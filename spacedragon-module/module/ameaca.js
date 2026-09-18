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
 * Como a de personagem: no botão "Sheet" do ator, sem virar padrão — um mundo
 * com o Star Dragon tem monstros de Old Dragon 2 ao lado. As criaturas do
 * Bestiário deste módulo já vêm com ela marcada.
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

/** Os rótulos do Space Dragon na ficha de ameaça. */
function rotular(app, elemento) {
  try {
    const raiz = elemento?.querySelectorAll ? elemento : elemento?.[0];
    if (!raiz?.querySelector) return;
    for (const stat of raiz.querySelectorAll(".stats .stat")) {
      const label = stat.querySelector("label");
      if (label && /^CA\b/.test(label.textContent.trim())) label.textContent = "CP";
    }
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

let Registrada = null;

export function registrarFichaAmeaca() {
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
    // Não é padrão: um mundo com o Star Dragon tem monstros de Old Dragon 2.
    makeDefault: false,
  });
  Hooks.on("renderSDMonsterSheet", rotular);
  Registrada = SDMonsterSheet;
  console.log(`${ID} | ficha de ameaça Space Dragon registrada`);
  return SDMonsterSheet;
}

export const fichaAmeacaRegistrada = () => Registrada;
