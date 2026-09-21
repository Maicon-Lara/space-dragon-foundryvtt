/**
 * A Ficha de Ameaça Space Dragon: a ficha de monstro do sistema, com as
 * rolagens do livro.
 *
 * ── O QUE A FICHA DO SISTEMA FAZIA COM AS CRIATURAS DO SPACE DRAGON ────────
 *
 * Nada que desse certo. O bestiário grava a JP e a Moral como o livro as
 * imprime — "15 (+2 CONTRA VENENO)", "70%" — e o sistema faz `Number(...)`
 * desses campos: dá NaN, e toda JP e toda Moral saía FALHA, sempre. E mesmo
 * com um número limpo a regra seria outra:
 *
 *   · JP de monstro no sistema: d20 ≤ JP. No livro (11.6), a JP é o valor
 *     "que deve ser VENCIDO pelo alienígena" — 1d20 igual ou maior — e "já
 *     engloba JPF, JPR e JPM, sendo desnecessário aplicar qualquer tipo de
 *     modificador ao resultado no dado". O parêntese ("+2 contra veneno") é
 *     situacional.
 *   · Moral no sistema: 2d6 ≤ Moral. No livro, é uma porcentagem de 0% a 100%:
 *     quando 50% ou mais dos alienígenas de uma espécie são derrotados, os
 *     restantes rolam d% ≤ Moral para ficar; falha é render-se ou fugir. 0%
 *     sempre foge, 100% nunca desiste.
 *
 * ── COMO É ESCOLHIDA ────────────────────────────────────────────────────────
 *
 * Como a de personagem: é a padrão do mundo pela opção "Fichas Space Dragon
 * como padrão" (ligada), e numa mesa mista o GM desliga e escolhe no botão
 * "Sheet". As criaturas do Bestiário deste módulo já vêm com ela marcada.
 */

const ID = "spacedragon";
export const MARCA_AMEACA = "spacedragon-ameaca";

/** "15 (+2 CONTRA VENENO)" → { valor: 15, nota: "+2 CONTRA VENENO" }. */
export function lerJP(texto) {
  const s = String(texto ?? "").trim();
  const m = s.match(/-?\d+/);
  const nota = s.match(/\(([^)]*)\)/)?.[1]?.trim() ?? "";
  return { valor: m ? Number(m[0]) : null, nota };
}

/** "70%" → 70. Sem número, null. */
export function lerMoral(texto) {
  const m = String(texto ?? "").match(/-?\d+/);
  return m ? Number(m[0]) : null;
}

const sinal = (n) => (n >= 0 ? `+${n}` : `${n}`);

/** JP de ameaça: 1d20 (+ situação) ≥ JP. Sem modificador de atributo. */
export async function rolarJPAmeaca(ator, situacional = 0) {
  const { valor, nota } = lerJP(ator.system?.jp);
  if (valor === null) {
    ui.notifications.warn(`${ator.name} não tem JP numérica: "${ator.system?.jp ?? ""}".`);
    return null;
  }
  const sit = Number(situacional) || 0;
  const roll = await new Roll(sit ? `1d20 + ${sit}` : "1d20").evaluate();
  const passou = roll.total >= valor;
  await ChatMessage.create({
    content:
      `<div class="title">JP — ${ator.name}</div><div class="sd-teste">` +
      `<p>1d20 <strong>${roll.total - sit}</strong>${sit ? ` ${sinal(sit)} (situação)` : ""} = <strong>${roll.total}</strong> contra JP <strong>${valor}</strong></p>` +
      `<p class="result"><strong class="${passou ? "success" : "failure"}">${passou ? "Sucesso" : "Falha"}</strong></p>` +
      (nota ? `<p><em>Do bloco: ${nota}. Se valer para esta jogada, some com Shift-clique.</em></p>` : "") +
      `</div>`,
    speaker: ChatMessage.getSpeaker({ actor: ator }),
    rolls: [roll],
    sound: CONFIG.sounds?.dice,
  });
  return { roll, passou, valor };
}

/** Moral: d% ≤ Moral, para continuar no combate. */
export async function rolarMoral(ator, situacional = 0) {
  const moral = lerMoral(ator.system?.mo);
  if (moral === null) {
    ui.notifications.warn(`${ator.name} não tem Moral numérica: "${ator.system?.mo ?? ""}".`);
    return null;
  }
  // Moral de 2 a 12 sem "%" é a escala do Old Dragon 2 (2d6), não a do livro.
  const escalaOD2 = !/%/.test(String(ator.system?.mo)) && moral <= 12;
  const alvo = Math.max(0, Math.min(100, moral + (Number(situacional) || 0)));
  const roll = await new Roll("1d100").evaluate();
  const fica = alvo >= 100 || (alvo > 0 && roll.total <= alvo);
  await ChatMessage.create({
    content:
      `<div class="title">Moral — ${ator.name}</div><div class="sd-teste">` +
      `<p>1d100 <strong>${roll.total}</strong> contra <strong>${alvo}%</strong></p>` +
      `<p class="result"><strong class="${fica ? "success" : "failure"}">${fica ? "Fica no combate" : "Rende-se ou tenta fugir"}</strong></p>` +
      (moral <= 0 ? "<p><em>Moral 0%: sempre foge.</em></p>" : moral >= 100 ? "<p><em>Moral 100%: nunca desiste.</em></p>" : "") +
      (escalaOD2 ? `<p><em>⚠ "${ator.system.mo}" parece a Moral do Old Dragon 2 (2 a 12, em 2d6). No Space Dragon ela é uma porcentagem.</em></p>` : "") +
      "<p><em>Rola-se quando 50% ou mais dos alienígenas da mesma espécie forem derrotados no combate.</em></p>" +
      `</div>`,
    speaker: ChatMessage.getSpeaker({ actor: ator }),
    rolls: [roll],
    sound: CONFIG.sounds?.dice,
  });
  return { roll, fica, alvo };
}

/** Pede o modificador de situação (Shift-clique). */
async function perguntarSituacao(titulo) {
  const V2 = foundry.applications?.api?.DialogV2;
  if (!V2?.prompt) return 0;
  const r = await V2.prompt({
    window: { title: `${titulo} — modificador de situação` },
    content: `<div class="form-group"><label>Modificador de situação</label><input type="number" name="sit" value="0" autofocus></div>`,
    ok: { label: "Rolar", callback: (ev, botao) => Number(botao.form?.elements?.sit?.value) || 0 },
    rejectClose: false,
  });
  return r ?? null;
}

/** Troca o texto de um elemento preservando o ícone, que é filho dele. */
function texto(el, novo) {
  if (!el) return;
  for (const no of [...el.childNodes]) if (no.nodeType === 3) no.remove();
  el.append?.(novo);
}

/** "BANDO" → "Bando". */
const capitaliza = (s) => {
  const t = String(s ?? "").trim().toLowerCase();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : "";
};

/**
 * ── A FICHA AINDA FALAVA A LÍNGUA DA FANTASIA ───────────────────────────────
 *
 * "Alinhamento Caótico", "Tesouros — Errantes e Covil". No Space Dragon é
 * AFILIAÇÃO (leal, neutro, rebelde) e são RELÍQUIAS: as iniciais O, D e U do
 * bloco dizem que o alienígena carrega relíquia ofensiva, defensiva ou
 * utilitária (11.6), e o XP vem separado, como prêmio pela derrota.
 *
 * E cada espécie chama o covil do seu jeito — NINHO, TOCA, NAVE, BASE,
 * ALCATEIA. O nome vem do próprio bloco, pelos flags que o build gravou.
 */
const RELIQUIAS = "Relíquias que o alienígena carrega: O ofensiva, D defensiva, U utilitária (Cap. 11.6).";
const AFILIACOES = { "Ordeiro": "Leal", "Caótico": "Rebelde" };

/** Troca o texto de um rótulo que case com `qual`, e devolve se trocou. */
function renomeia(el, qual, novo, dica = null) {
  if (!el || !qual.test(el.textContent.trim())) return false;
  el.textContent = novo;
  if (dica) el.setAttribute("title", dica);
  return true;
}

/** Os rótulos do Space Dragon na ficha de ameaça. */
function rotular(app, elemento) {
  try {
    const raiz = elemento?.querySelectorAll ? elemento : elemento?.[0];
    if (!raiz?.querySelector) return;
    const dados = app.actor?.flags?.[ID]?.ameaca ?? {};

    for (const stat of raiz.querySelectorAll(".stats .stat")) {
      const label = stat.querySelector("label");
      if (label && /^CA\b/.test(label.textContent.trim())) label.textContent = "CP";
    }

    // O valor inteiro na dica: "15 (TRAJES DE COMBATE)" não cabe na caixa.
    for (const input of raiz.querySelectorAll(".sidebar input")) {
      const v = input.getAttribute?.("value");
      if (v && String(v).length > 4) input.setAttribute("title", v);
    }

    // Afiliação, e não Alinhamento: leal, neutro e rebelde.
    for (const div of raiz.querySelectorAll(".alignment")) {
      renomeia(div.querySelector("label"), /^Alinhamento$/i, "Afiliação");
      for (const op of div.querySelectorAll("option")) {
        const novo = AFILIACOES[op.textContent.trim()];
        if (novo) op.textContent = novo;
      }
    }

    // Encontros: o número fica na caixa e o nome do bloco vira o rótulo.
    const enc = raiz.querySelector(".encounter");
    if (enc) {
      const subs = enc.querySelectorAll(".encounter-value label");
      if (dados.encontro?.grupo && subs[0]) subs[0].textContent = capitaliza(dados.encontro.grupo);
      if (dados.encontro?.covil && subs[1]) subs[1].textContent = capitaliza(dados.encontro.covil);
    }

    // Relíquias, e não Tesouros. O segundo campo, de covil, não existe aqui.
    const tes = raiz.querySelector(".treasure");
    if (tes) {
      renomeia(tes.querySelector("label"), /^Tesouros?$/i, "Relíquias", RELIQUIAS);
      const valores = tes.querySelectorAll(".treasure-value");
      const sub = valores[0]?.querySelector("label");
      if (sub) { sub.textContent = "O · D · U"; sub.setAttribute("title", RELIQUIAS); }
      valores[1]?.classList?.add("sd-escondido");
    }

    // XP é o prêmio pela derrota.
    renomeia(raiz.querySelector(".xp label"), /^XP$/i, "Prêmio");
    const jp = raiz.querySelector(".jp-roll");
    if (jp) {
      texto(jp, "JP");
      jp.setAttribute("title", "Jogada de Proteção: 1d20 igual ou maior que a JP, sem modificador. Shift: situação");
    }
    const mo = raiz.querySelector(".mo-roll");
    if (mo) {
      texto(mo, "Moral");
      mo.setAttribute("title", "Moral: 1d100 igual ou menor que a Moral para ficar no combate. Shift: situação");
    }
  } catch (e) {
    console.warn(`${ID} | rótulos da ficha de ameaça não puderam ser trocados`, e);
  }
}

/**
 * ── O PAINEL DO BLOCO DO LIVRO ──────────────────────────────────────────────
 *
 * O bloco de criatura do Space Dragon tem mais do que a ficha de monstro do
 * sistema guarda: os seis atributos, Resistência Mental, Redução de Dano e o
 * nome científico. Moram em `flags.spacedragon.ameaca` — o módulo não inventa
 * campo em `system.*` —, e os campos abaixo, por terem `name`, são salvos pelo
 * próprio formulário da ficha, como qualquer outro.
 */
export const ATRIBUTOS_AMEACA = [
  ["FOR", "Força"], ["DES", "Destreza"], ["CON", "Constituição"],
  ["INT", "Intelecto"], ["CIE", "Ciência"], ["COM", "Comunicação"],
];

const esc = (v) =>
  String(v ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

export function painelAmeaca(dados = {}) {
  const at = dados.atributos ?? {};
  const campo = (k, nome) =>
    `<div class="sd-ameaca-atributo" title="${nome}">` +
    `<input name="flags.${ID}.ameaca.atributos.${k}" type="number" value="${esc(at[k])}" data-dtype="Number" placeholder="—">` +
    `<label class="text-xs font-bold">${k}</label></div>`;
  return (
    `<div class="sd-ameaca-painel"><hr>` +
    `<label class="font-bold">Atributos</label>` +
    `<div class="sd-ameaca-atributos">${ATRIBUTOS_AMEACA.map(([k, n]) => campo(k, n)).join("")}</div>` +
    `<div class="sd-ameaca-defesas">` +
    `<div class="sd-ameaca-defesa" title="Resistência Mental"><input name="flags.${ID}.ameaca.rm" type="text" value="${esc(dados.rm)}" data-dtype="String" placeholder="—"><label class="text-xs font-bold">RM</label></div>` +
    `<div class="sd-ameaca-defesa" title="Redução de Dano"><input name="flags.${ID}.ameaca.rd" type="text" value="${esc(dados.rd)}" data-dtype="String" placeholder="—"><label class="text-xs font-bold">RD</label></div>` +
    `</div></div>`
  );
}

export function campoCientifico(dados = {}) {
  return (
    `<div class="sd-ameaca-cientifico">` +
    `<input name="flags.${ID}.ameaca.cientifico" type="text" value="${esc(dados.cientifico)}" data-dtype="String" placeholder="—">` +
    `<label class="font-bold">Nome científico</label></div>`
  );
}

/**
 * ── O QUE A CRIATURA CARREGA ────────────────────────────────────────────────
 *
 * A criatura do Space Dragon tem blaster, armadura e aparato; o monstro do Old
 * Dragon 2 tem só o bloco. A ficha do sistema lista APENAS ataques de monstro,
 * e é só isso: o ator guarda item de qualquer tipo sem reclamar — arrastar uma
 * arma para a ficha já funciona hoje, e o item simplesmente não aparecia em
 * lugar nenhum. Este bloco mostra o que está lá.
 *
 * "Virar ataque" copia a arma para um ataque de monstro, que é o que tem botão
 * de rolar nesta ficha. A arma continua na lista, porque é ela que diz alcance,
 * peso e custo.
 */
const TIPOS_EQUIPAMENTO = ["weapon", "armor", "shield", "misc", "container", "vehicle"];

const ICONE = { weapon: "fa-sword", armor: "fa-shield-halved", shield: "fa-shield", misc: "fa-toolbox", container: "fa-box", vehicle: "fa-rocket" };

export function equipamentoDe(ator) {
  return (ator?.items?.filter?.((i) => TIPOS_EQUIPAMENTO.includes(i.type)) ?? []);
}

export function blocoEquipamento(ator) {
  const itens = equipamentoDe(ator);
  const linhas = itens.map((i) => {
    const dano = i.type === "weapon" && i.system?.damage
      ? `<span class="sd-equip-dano">${esc(i.system.damage)}</span>` : "";
    const virar = i.type === "weapon"
      ? `<a class="sd-equip-ataque" data-item="${esc(i.id)}" title="Copiar para os ataques desta ficha, com botão de rolar"><i class="fa-solid fa-dice-d20"></i></a>` : "";
    return (
      `<li class="item sd-equip-linha" data-item-id="${esc(i.id)}">` +
      `<a class="sd-equip-abrir" data-item="${esc(i.id)}" title="Abrir ${esc(i.name)}">` +
      `<i class="fa-thin ${ICONE[i.type] ?? "fa-box"}"></i> ${esc(i.name)}</a>${dano}` +
      `<span class="sd-equip-controles">${virar}` +
      `<a class="sd-equip-remover" data-item="${esc(i.id)}" title="Remover desta criatura"><i class="fa-solid fa-trash"></i></a>` +
      `</span></li>`
    );
  }).join("");
  return (
    `<div class="sd-equipamento"><div class="list"><div class="attack">Equipamento</div></div>` +
    (itens.length
      ? `<ol class="item-list">${linhas}</ol>`
      : `<p class="sd-equip-vazio"><em>Nada equipado. Arraste armas, vestes e aparatos do compêndio para esta ficha.</em></p>`) +
    `</div>`
  );
}

/** Os botões do bloco de equipamento. A ficha do sistema não os conhece. */
function ligarEquipamento(raiz, ator) {
  const item = (ev) => ator.items?.get?.(ev.currentTarget?.dataset?.item);
  const pare = (ev) => { ev.preventDefault?.(); ev.stopPropagation?.(); };

  for (const a of raiz.querySelectorAll(".sd-equip-abrir")) {
    a.addEventListener("click", (ev) => { pare(ev); item(ev)?.sheet?.render(true); });
  }
  for (const a of raiz.querySelectorAll(".sd-equip-remover")) {
    a.addEventListener("click", (ev) => {
      pare(ev);
      const doc = item(ev);
      if (!doc) return;
      (async () => {
        // Apagar item é irreversível, e aqui é um clique ao lado do de abrir.
        const V2 = foundry.applications?.api?.DialogV2;
        const ok = V2?.confirm
          ? await V2.confirm({ window: { title: "Remover equipamento" }, content: `<p>Remover <strong>${esc(doc.name)}</strong> de ${esc(ator.name)}?</p>`, rejectClose: false })
          : true;
        if (ok) await ator.deleteEmbeddedDocuments("Item", [doc.id]);
      })();
    });
  }
  for (const a of raiz.querySelectorAll(".sd-equip-ataque")) {
    a.addEventListener("click", (ev) => {
      pare(ev);
      const arma = item(ev);
      if (!arma) return;
      const bonus = Number(arma.system?.bonus_damage) || 0;
      const dano = String(arma.system?.damage ?? "");
      ator.createEmbeddedDocuments("Item", [{
        name: arma.name,
        type: "monster_attack",
        img: arma.img,
        system: {
          times: 1,
          ba: Number(arma.system?.bonus_ba) || 0,
          damage_bonus: 0,
          weapon: true,
          description: arma.name,
          damage: dano,
          damage_description: bonus ? `${dano}+${bonus}` : dano,
        },
      }]);
    });
  }
}

/** Outro módulo (ou o sistema) já cuida do equipamento desta criatura? */
function equipamentoJaTemDono(raiz) {
  if (game?.modules?.get?.("old-dragon-2-qualidade-de-vida")?.active) return true;
  return !!raiz.querySelector(`[data-tab*="equip"]`);
}

/** Põe o painel e o nome científico na ficha, uma vez por renderização. */
function injetarPainel(app, elemento) {
  try {
    const raiz = elemento?.querySelectorAll ? elemento : elemento?.[0];
    if (!raiz?.querySelector) return;
    const dados = app.actor?.flags?.[ID]?.ameaca ?? {};
    const stats = raiz.querySelector(".stats");
    if (stats && !stats.querySelector(".sd-ameaca-painel")) stats.insertAdjacentHTML("beforeend", painelAmeaca(dados));
    const info = raiz.querySelector(".basic-info");
    if (info && !info.querySelector(".sd-ameaca-cientifico")) info.insertAdjacentHTML("beforeend", campoCientifico(dados));
    // O que a criatura carrega, na aba de ataques, logo abaixo deles.
    //
    // Menos quando já existe uma aba de equipamento na ficha: o "Old Dragon 2:
    // Qualidade de Vida" põe uma ("od2qdv-monster-equipment"), e ela é o lugar
    // certo — duas listas da mesma coisa é pior do que nenhuma. A checagem é
    // pelo MÓDULO ATIVO, e não só pela aba, porque quem desenha primeiro
    // depende da ordem dos ganchos: se esperássemos a aba aparecer, a corrida
    // decidiria, e às vezes sairiam as duas.
    if (equipamentoJaTemDono(raiz)) return;
    const aba = raiz.querySelector(".monster-tab-attacks");
    if (aba && !aba.querySelector(".sd-equipamento")) {
      aba.insertAdjacentHTML("beforeend", blocoEquipamento(app.actor));
      ligarEquipamento(aba, app.actor);
    }
  } catch (e) {
    console.warn(`${ID} | painel da ficha de ameaça não pôde ser montado`, e);
  }
}

let Registrada = null;

export function registrarFichaAmeaca(padrao = true) {
  const registro = CONFIG.Actor?.sheetClasses?.monster ?? {};
  const Base = Object.values(registro).find((e) => e?.cls?.name === "OD2MonsterSheet")?.cls;
  if (!Base) {
    console.warn(`${ID} | OD2MonsterSheet não encontrada — a Ficha de Ameaça não será registrada`);
    return null;
  }

  class SDMonsterSheet extends Base {
    static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
        classes: [...super.defaultOptions.classes, MARCA_AMEACA],
        // A criatura do Space Dragon escreve mais em cada campo — "15 (TRAJES
        // DE COMBATE)", "16 (+2 CONTRA VENENO)" — e ainda ganha o painel de
        // atributos na lateral. Nos 600x650 do sistema tudo saía cortado.
        width: 760,
        height: 780,
      });
    }

    _onJPRoll(event) {
      event.preventDefault?.();
      const shift = !!event.shiftKey;
      (async () => {
        const sit = shift ? await perguntarSituacao("JP") : 0;
        if (sit !== null) await rolarJPAmeaca(this.actor, sit);
      })();
    }

    _onMORoll(event) {
      event.preventDefault?.();
      const shift = !!event.shiftKey;
      (async () => {
        const sit = shift ? await perguntarSituacao("Moral") : 0;
        if (sit !== null) await rolarMoral(this.actor, sit);
      })();
    }
  }

  foundry.documents.collections.Actors.registerSheet(ID, SDMonsterSheet, {
    types: ["monster"],
    label: "Ficha de Ameaça Space Dragon",
    // Padrão do mundo pela opção "Fichas Space Dragon como padrão". Numa mesa
    // mista, o GM desliga e escolhe no botão Sheet de cada monstro.
    makeDefault: !!padrao,
  });
  // O gancho é o da classe CONCRETA do sistema, e não o da subclasse: no v13,
  // ficha appv1 garantidamente dispara `renderOD2MonsterSheet` (é o mesmo que
  // a ficha de personagem usa, `renderOD2CharacterSheet`), e o nome montado a
  // partir de uma subclasse de módulo não é garantido. Sem os rótulos, a
  // ficha nova ficava idêntica à do sistema na tela.
  Hooks.on("renderOD2MonsterSheet", (app, el) => {
    if (!(app instanceof SDMonsterSheet)) return;
    rotular(app, el);
    injetarPainel(app, el);
  });
  Registrada = SDMonsterSheet;
  console.log(`${ID} | ficha de ameaça Space Dragon registrada`);
  return SDMonsterSheet;
}

export const fichaAmeacaRegistrada = () => Registrada;
