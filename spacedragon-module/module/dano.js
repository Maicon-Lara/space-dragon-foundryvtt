/**
 * Aplicar dano pela regra do Space Dragon (Cap. 7, "Dano, cura e morte").
 *
 * ── POR QUE O MÓDULO PRECISA DO PRÓPRIO BOTÃO ───────────────────────────────
 *
 * O Old Dragon 2 não aplica dano nenhum: a rolagem só vai para o chat. Quem
 * aplica é o "Qualidade de Vida", e do jeito do Old Dragon 2 (medido no código
 * dele, v0.10.110):
 *
 *   · trava o PV em 0 (`Math.max(0, hp - dano)`), e o Space Dragon tem PV
 *     negativos até os Danos Mortais;
 *   · não conhece Redução de Dano — o ajuste dele é normal, fraqueza ou
 *     resistência;
 *   · a função é interna ao módulo dele e o cartão de dano não guarda alvo nem
 *     arma em flags. Não há onde se encaixar por fora.
 *
 * Então a mesa deixa o "Aplicar dano automático" dele DESLIGADO, e o dano entra
 * por aqui: um botão na mensagem de dano (do sistema ou do Qualidade de Vida) e
 * a opção "Aplicar dano (Space Dragon)" no menu de qualquer rolagem do chat.
 * Vale para os tokens SELECIONADOS — ou, sem seleção, para os marcados como
 * alvo — no momento do clique. Só o Mestre vê e usa.
 *
 * ── A REGRA ─────────────────────────────────────────────────────────────────
 *
 *   · RD desconta um valor fixo de cada acerto; o dano nunca fica negativo.
 *   · Acima de 0: ferido. Em 0: inconsciente, porém estável. Abaixo de 0: a
 *     caminho da morte, com uma JPF por rodada (falha: −1d4 PV; sucesso:
 *     estável). Nos Danos Mortais da Constituição (T1-3): morto, sem jogada.
 *   · Ameaça (o bestiário) não tem Danos Mortais: em 0 está derrotada, como no
 *     Old Dragon 2.
 *
 * Os status são os do core — `unconscious` e `dead`, e o combatente derrotado —,
 * os mesmos que o Qualidade de Vida usa. Assim as travas dele (não atacar nem
 * mover o token com PV ≤ 0) continuam valendo.
 *
 * A RD de ameaça é texto, como o livro imprime: "6/FÍSICO", "4/ÁCIDO", "IMUNE A
 * ATAQUES FÍSICOS". Com condição, o módulo não adivinha o tipo do dano: pergunta
 * ao Mestre. A RD de personagem é a da mutação Tato (ignora 2 de qualquer dano).
 */

import { atorUsaFichaSD } from "./ficha.js";
import { ehNave } from "./nave-marca.js";
import { danosMortais } from "./cabecalho.js";
import { mutacoesDe } from "./mutacoes.js";
import { rolarJP } from "./jp.js";
import { t as txt } from "./i18n.js";

const ID = "spacedragon";
const FLAG_ESTAVEL = "estavel";
const FLAG_JPF = "jpfFeita";
const CLASSE_BOTAO = "sd-aplicar-dano";
const CLASSE_JPF = "sd-rolar-jpf";

const escapa = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* ── O QUE É PURO (testado em tools/teste-dano.mjs) ──────────────────────── */

/**
 * Lê a RD como o bestiário grava.
 *
 *   ""                         → { valor: 0 }
 *   "3"                        → { valor: 3 }
 *   "6/FÍSICO"                 → { valor: 6, condicao: "FÍSICO" }
 *   "IMUNE A ATAQUES FÍSICOS"  → { valor: 0, imune: true, condicao: "ATAQUES FÍSICOS" }
 */
export function lerRD(texto) {
  const s = String(texto ?? "").trim();
  if (!s || s === "—" || s === "-") return { valor: 0, condicao: "", imune: false, texto: "" };
  const imune = /^imune\b/i.exec(s);
  if (imune) {
    const condicao = s.replace(/^imune\s*(a|à|ao|aos|as|às)?\s*/i, "").trim();
    return { valor: 0, condicao, imune: true, texto: s };
  }
  const m = /^(\d+)\s*(?:\/\s*(.+))?$/.exec(s);
  if (m) return { valor: Number(m[1]), condicao: (m[2] ?? "").trim(), imune: false, texto: s };
  const n = /\d+/.exec(s);
  return { valor: n ? Number(n[0]) : 0, condicao: s, imune: false, texto: s };
}

/** Quem é o ator para esta regra: "personagem", "ameaca" ou null (fora dela). */
export function modoDo(ator) {
  if (!ator || ehNave(ator)) return null;
  if (ator.type === "monster") return "ameaca";
  if ((ator.type === "character" || ator.type === "retainer") && atorUsaFichaSD(ator)) return "personagem";
  return null;
}

/** A RD do ator: a da Ficha de Ameaça, ou a da mutação Tato. */
export function rdDoAtor(ator) {
  if (ator?.type === "monster") return lerRD(ator?.flags?.[ID]?.ameaca?.rd);
  const tato = mutacoesDe(ator).some((m) => m.chave === "07-tato");
  return { valor: tato ? 2 : 0, condicao: "", imune: false, texto: tato ? "2" : "" };
}

/**
 * O estado pelo PV.
 *
 * Personagem: "de-pe" (> 0), "inconsciente" (= 0), "morrendo" (< 0) e "morto"
 * (≤ Danos Mortais). Ameaça: "de-pe" ou "derrotado" (≤ 0).
 */
export function estadoPorPV(pv, { modo, mortais = -10 } = {}) {
  if (modo === "ameaca") return pv > 0 ? "de-pe" : "derrotado";
  if (pv <= mortais) return "morto";
  if (pv < 0) return "morrendo";
  if (pv === 0) return "inconsciente";
  return "de-pe";
}

/**
 * A conta de um acerto (ou de uma cura).
 *
 * `rd` é o que a mesa decidiu descontar — já resolvida a condição. Devolve o
 * que o alvo sofre, o PV depois e o estado.
 */
export function calcularDano({ pv, max, dano, rd = 0, cura = false, modo = "personagem", mortais = -10 }) {
  const antes = Number(pv) || 0;
  const bruto = Math.max(0, Math.floor(Number(dano) || 0));
  let depois;
  let sofrido;
  if (cura) {
    const teto = Number.isFinite(Number(max)) && Number(max) > 0 ? Number(max) : Infinity;
    depois = Math.max(antes, Math.min(teto, antes + bruto));
    sofrido = antes - depois; // negativo: recuperou
  } else {
    sofrido = Math.max(0, bruto - Math.max(0, Number(rd) || 0));
    depois = antes - sofrido;
    if (modo === "ameaca") depois = Math.max(0, depois);
  }
  return { antes, depois, sofrido, rdUsada: cura ? 0 : Math.min(bruto, Math.max(0, Number(rd) || 0)), estado: estadoPorPV(depois, { modo, mortais }) };
}

/** A mensagem é uma rolagem de dano? (a do sistema, ou o cartão de dano do Qualidade de Vida) */
export function ehMensagemDeDano({ flavor = "", content = "", temRolagem = false } = {}, rotulos = {}) {
  if (!temRolagem) return false;
  const texto = String(flavor).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const od2 = String(rotulos.od2 ?? "Dano com").trim();
  const qdv = String(rotulos.qdv ?? "Dano").trim();
  if (od2 && texto.startsWith(od2)) return true;
  return !!qdv && texto === qdv && String(content).includes("od2ca-card");
}

/** O total das rolagens de uma mensagem. */
export function totalDaMensagem(msg) {
  return (msg?.rolls ?? []).reduce((soma, r) => soma + (Number(r?.total) || 0), 0);
}

/* ── O FOUNDRY ─────────────────────────────────────────────────────────── */

function temStatus(id) {
  return (globalThis.CONFIG?.statusEffects ?? []).some((s) => s.id === id);
}

async function status(ator, id, ativo) {
  if (!temStatus(id) || typeof ator?.toggleStatusEffect !== "function") return;
  if (!!ator.statuses?.has?.(id) === ativo) return;
  await ator.toggleStatusEffect(id, { active: ativo, overlay: ativo && id === "dead" });
}

async function marcarDerrotado(ator, derrotado) {
  if (!globalThis.game?.user?.isGM) return;
  const combate = globalThis.game?.combat;
  // token sem vínculo: o ator do combatente é o sintético do token, o mesmo uuid
  const c = combate?.combatants?.find?.((x) => x.actor === ator || (!!ator?.uuid && x.actor?.uuid === ator.uuid));
  if (c && !!c.defeated !== derrotado) await c.update({ defeated: derrotado });
}

/** Põe na ficha e no token o estado que o PV pede. */
export async function aplicarEstado(ator, estado, { feriu = false } = {}) {
  if (estado === "de-pe") {
    await status(ator, "unconscious", false);
    await status(ator, "dead", false);
    if (ator.getFlag?.(ID, FLAG_ESTAVEL)) await ator.unsetFlag(ID, FLAG_ESTAVEL);
    return;
  }
  if (estado === "inconsciente" || estado === "morrendo") {
    await status(ator, "dead", false);
    await status(ator, "unconscious", true);
    if (estado === "morrendo" && feriu && ator.getFlag?.(ID, FLAG_ESTAVEL)) await ator.unsetFlag(ID, FLAG_ESTAVEL);
    return;
  }
  // morto ou derrotado
  await status(ator, "unconscious", false);
  await status(ator, "dead", true);
  await marcarDerrotado(ator, true);
}

function textoDoEstado(estado, mortais) {
  if (estado === "inconsciente") return txt("spacedragon.dano.estado.inconsciente");
  if (estado === "morrendo") return txt("spacedragon.dano.estado.morrendo", { mortais });
  if (estado === "morto") return txt("spacedragon.dano.estado.morto");
  if (estado === "derrotado") return txt("spacedragon.dano.estado.derrotado");
  return "";
}

/** O dono vê o PV; ameaça do Mestre, não (o Qualidade de Vida faz igual). */
function mostraPV(ator) {
  return ator?.type !== "monster" || !!ator?.hasPlayerOwner;
}

/** A RD com condição: pergunta ao Mestre se vale contra este dano. */
async function resolverRD(ator, rd, dano) {
  if (!rd.condicao && !rd.imune) return rd.valor;
  const V2 = globalThis.foundry?.applications?.api?.DialogV2;
  if (!V2?.wait) return rd.imune ? 0 : rd.valor;
  const nome = escapa(ator.name);
  const sim = rd.imune ? txt("spacedragon.dano.rdImune") : txt("spacedragon.dano.rdSim", { rd: rd.valor });
  const r = await V2.wait({
    window: { title: txt("spacedragon.dano.rdJanela", { nome }) },
    content: `<p>${txt("spacedragon.dano.rdPergunta", { nome, rd: escapa(rd.texto), dano })}</p>`,
    buttons: [
      { action: "sim", label: sim, default: true, callback: () => (rd.imune ? Infinity : rd.valor) },
      { action: "nao", label: txt("spacedragon.dano.rdNao"), callback: () => 0 },
    ],
    rejectClose: false,
  });
  return r ?? null;
}

/** Os tokens que recebem: os selecionados, ou os marcados como alvo. */
function alvos() {
  const selecionados = globalThis.canvas?.tokens?.controlled ?? [];
  if (selecionados.length) return selecionados;
  return [...(globalThis.game?.user?.targets ?? [])];
}

/**
 * Aplica `valor` de dano (ou de cura) nos tokens selecionados.
 * É o que o botão, o menu e `game.spacedragon.aplicarDano` chamam.
 */
export async function aplicarDano(valor, { cura = false, tokens = null } = {}) {
  if (!globalThis.game?.user?.isGM) return [];
  const lista = tokens ?? alvos();
  if (!lista.length) {
    globalThis.ui?.notifications?.warn?.(txt("spacedragon.dano.semAlvo"));
    return [];
  }
  const linhas = [];
  const resultados = [];
  for (const token of lista) {
    const ator = token?.actor;
    if (!ator) continue;
    if (ehNave(ator)) {
      globalThis.ui?.notifications?.warn?.(txt("spacedragon.dano.nave", { nome: escapa(ator.name) }));
      continue;
    }
    const modo = modoDo(ator);
    if (!modo) {
      globalThis.ui?.notifications?.warn?.(txt("spacedragon.dano.foraDaRegra", { nome: escapa(ator.name) }));
      continue;
    }
    const mortais = modo === "personagem" ? danosMortais(ator) : 0;
    let rd = 0;
    if (!cura) {
      rd = await resolverRD(ator, rdDoAtor(ator), valor);
      if (rd === null) continue; // fechou a janela: não aplica neste
    }
    const r = calcularDano({
      pv: ator.system?.hp?.value, max: ator.system?.hp?.max, dano: valor, rd: Number.isFinite(rd) ? rd : valor,
      cura, modo, mortais,
    });
    if (r.depois !== r.antes) await ator.update({ "system.hp.value": r.depois });
    await aplicarEstado(ator, r.estado, { feriu: r.sofrido > 0 });

    const nome = escapa(token.name ?? ator.name);
    let linha = cura
      ? txt("spacedragon.dano.linhaCura", { nome, n: -r.sofrido })
      : txt("spacedragon.dano.linha", { nome, sofrido: r.sofrido });
    if (!cura && r.rdUsada > 0) linha += txt("spacedragon.dano.linhaRD", { rd: r.rdUsada, dano: valor });
    if (mostraPV(ator)) linha += ` — ${txt("spacedragon.dano.pv", { antes: r.antes, depois: r.depois })}`;
    const estado = textoDoEstado(r.estado, mortais);
    if (estado) linha += `. <em>${estado}</em>`;
    linhas.push(`<li>${linha}</li>`);
    resultados.push({ ator, ...r });
  }
  if (linhas.length) {
    await globalThis.ChatMessage?.create?.({
      content:
        `<div class="title">${cura ? txt("spacedragon.dano.tituloCura") : txt("spacedragon.dano.titulo")}</div>` +
        `<div class="sd-teste"><ul class="sd-parcelas">${linhas.join("")}</ul></div>`,
      speaker: { alias: "Space Dragon" },
    });
  }
  return resultados;
}

/* ── A JPF A CADA RODADA ───────────────────────────────────────────────── */

/** Quem, no combate, está abaixo de 0 e ainda não estabilizou. */
export function quemRolaJPF(combatentes) {
  const saida = [];
  for (const c of combatentes ?? []) {
    const ator = c?.actor;
    if (!ator || c.defeated || modoDo(ator) !== "personagem") continue;
    const pv = Number(ator.system?.hp?.value);
    if (!(pv < 0) || pv <= danosMortais(ator)) continue;
    if (ator.flags?.[ID]?.[FLAG_ESTAVEL]) continue;
    saida.push(c);
  }
  return saida;
}

async function pedirJPF(combate) {
  for (const c of quemRolaJPF(combate?.combatants)) {
    const ator = c.actor;
    const donos = [...(globalThis.game?.users ?? [])]
      .filter((u) => u.isGM || ator.testUserPermission?.(u, "OWNER"))
      .map((u) => u.id);
    await globalThis.ChatMessage?.create?.({
      content:
        `<div class="sd-teste"><p>${txt("spacedragon.dano.jpfPedido", { nome: escapa(c.name ?? ator.name), pv: ator.system.hp.value, mortais: danosMortais(ator) })}</p>` +
        `<button type="button" class="${CLASSE_JPF}" data-ator="${escapa(ator.uuid)}" data-vez="${escapa(`${combate.id}:${combate.round}`)}">` +
        `<i class="fas fa-heart-pulse"></i> ${txt("spacedragon.dano.jpfBotao")}</button></div>`,
      speaker: globalThis.ChatMessage.getSpeaker?.({ actor: ator }),
      whisper: donos,
    });
  }
}

/** A JPF do personagem que está morrendo: passar estabiliza, falhar custa 1d4 PV. */
export async function rolarJPF(ator, vez = "") {
  if (!ator) return null;
  if (vez && ator.getFlag?.(ID, FLAG_JPF) === vez) {
    globalThis.ui?.notifications?.warn?.(txt("spacedragon.dano.jpfJaFeita", { nome: escapa(ator.name) }));
    return null;
  }
  const r = await rolarJP(ator, "jpc");
  if (!r) return null;
  if (vez) await ator.setFlag(ID, FLAG_JPF, vez);
  const nome = escapa(ator.name);
  if (r.passou) {
    await ator.setFlag(ID, FLAG_ESTAVEL, true);
    await globalThis.ChatMessage?.create?.({
      content: `<div class="sd-teste"><p>${txt("spacedragon.dano.estabilizou", { nome, pv: ator.system.hp.value })}</p></div>`,
      speaker: globalThis.ChatMessage.getSpeaker?.({ actor: ator }),
    });
    return { ...r, perdeu: 0 };
  }
  const d4 = await new globalThis.Roll("1d4").evaluate();
  const mortais = danosMortais(ator);
  const conta = calcularDano({ pv: ator.system.hp.value, dano: d4.total, modo: "personagem", mortais });
  await ator.update({ "system.hp.value": conta.depois });
  await aplicarEstado(ator, conta.estado, { feriu: true });
  const estado = conta.estado === "morto" ? ` <em>${txt("spacedragon.dano.estado.morto")}</em>` : "";
  await globalThis.ChatMessage?.create?.({
    content: `<div class="sd-teste"><p>${txt("spacedragon.dano.piorou", { nome, n: d4.total, pv: conta.depois })}${estado}</p></div>`,
    speaker: globalThis.ChatMessage.getSpeaker?.({ actor: ator }),
    rolls: [d4],
  });
  return { ...r, perdeu: d4.total };
}

/* ── LIGAR ─────────────────────────────────────────────────────────────── */

function rotulos() {
  const i18n = globalThis.game?.i18n;
  const od2 = i18n?.localize?.("olddragon2e.chat.damage_with");
  const qdv = i18n?.localize?.("OD2CA.Chat.damage");
  return {
    od2: od2 && od2 !== "olddragon2e.chat.damage_with" ? od2 : "Dano com",
    qdv: qdv && qdv !== "OD2CA.Chat.damage" ? qdv : "Dano",
  };
}

function mensagemDoMenu(li) {
  const el = li?.dataset ? li : li?.[0];
  const id = el?.dataset?.messageId ?? el?.closest?.("[data-message-id]")?.dataset?.messageId;
  return id ? globalThis.game?.messages?.get?.(id) : null;
}

export function ligarDano() {
  const Hooks = globalThis.Hooks;

  Hooks?.on?.("renderChatMessageHTML", (msg, html) => {
    if (!html?.querySelector) return;
    // a JPF de quem está morrendo: o dono ou o Mestre rola
    const jpf = html.querySelector(`.${CLASSE_JPF}`);
    if (jpf && !jpf.dataset.ligado) ligarBotaoJPF(jpf);

    // o botão nas mensagens de dano, só para o Mestre
    if (!globalThis.game?.user?.isGM || html.querySelector(`.${CLASSE_BOTAO}`)) return;
    const dados = { flavor: msg?.flavor, content: msg?.content, temRolagem: (msg?.rolls?.length ?? 0) > 0 };
    if (!ehMensagemDeDano(dados, rotulos())) return;
    const total = totalDaMensagem(msg);
    const alvo = html.querySelector(".message-content") ?? html;
    alvo.insertAdjacentHTML(
      "beforeend",
      `<div class="sd-dano-acoes"><button type="button" class="${CLASSE_BOTAO}" title="${escapa(txt("spacedragon.dano.dica"))}">` +
      `<i class="fas fa-heart-crack"></i> ${txt("spacedragon.dano.botao", { n: total })}</button></div>`
    );
    alvo.querySelector(`.${CLASSE_BOTAO}`)?.addEventListener("click", (ev) => {
      ev.preventDefault();
      aplicarDano(totalDaMensagem(msg)).catch((e) => console.error(`${ID} | aplicar dano falhou`, e));
    });
  });

  // O menu de qualquer rolagem: dano e cura.
  Hooks?.on?.("getChatMessageContextOptions", (_app, opcoes) => {
    const ehRolagem = (li) => !!globalThis.game?.user?.isGM && (mensagemDoMenu(li)?.rolls?.length ?? 0) > 0;
    opcoes.push(
      {
        name: txt("spacedragon.dano.menuDano"),
        icon: '<i class="fas fa-heart-crack"></i>',
        condition: ehRolagem,
        callback: (li) => aplicarDano(totalDaMensagem(mensagemDoMenu(li))),
      },
      {
        name: txt("spacedragon.dano.menuCura"),
        icon: '<i class="fas fa-heart"></i>',
        condition: ehRolagem,
        callback: (li) => aplicarDano(totalDaMensagem(mensagemDoMenu(li)), { cura: true }),
      }
    );
  });

  // A virada de rodada pede a JPF de quem está abaixo de 0. Só um Mestre pede.
  Hooks?.on?.("updateCombat", (combate, mudou) => {
    if (mudou?.round == null) return;
    const game = globalThis.game;
    if (!game?.user?.isGM || (game.users?.activeGM && game.users.activeGM.id !== game.user.id)) return;
    pedirJPF(combate).catch((e) => console.error(`${ID} | pedir a JPF falhou`, e));
  });
  return true;
}

function ligarBotaoJPF(botao) {
  botao.dataset.ligado = "1";
  const ator = globalThis.fromUuidSync?.(botao.dataset.ator);
  const pode = !!ator && (globalThis.game?.user?.isGM || ator.testUserPermission?.(globalThis.game.user, "OWNER"));
  if (!pode) {
    botao.disabled = true;
    return;
  }
  botao.addEventListener("click", (ev) => {
    ev.preventDefault();
    botao.disabled = true;
    rolarJPF(ator, botao.dataset.vez).catch((e) => console.error(`${ID} | a JPF falhou`, e));
  });
}
