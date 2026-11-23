/**
 * Os estados de dano do Space Dragon (Cap. 7, "Dano, cura e morte"): Redução
 * de Dano, inconsciente, morrendo, morto, e a JPF a cada rodada.
 *
 * ── A REGRA ─────────────────────────────────────────────────────────────────
 *
 *   · RD desconta um valor fixo de cada acerto; o dano nunca fica negativo.
 *   · Acima de 0: ferido. Em 0: inconsciente, porém estável. Abaixo de 0: a
 *     caminho da morte, com uma JPF por rodada a partir da seguinte (falha:
 *     −1d4 PV; sucesso: estável). Nos Danos Mortais da Constituição (T1-3):
 *     morto, sem jogada.
 *   · Ameaça (o bestiário) não tem Danos Mortais: em 0 ou menos está derrotada.
 *
 * ── ONDE CADA PARTE ENTRA ───────────────────────────────────────────────────
 *
 * A RD entra em `aplicarEmAtor` (dano-no-alvo.js), o caminho que o botão
 * "Aplicar em (alvo)" e a automação de ataque já compartilham.
 *
 * Os ESTADOS não dependem de quem mexeu no PV: um gancho em `updateActor` olha o
 * PV novo e põe o status — o botão, a automação, a cura, o descanso e o número
 * digitado na ficha passam todos por ali. Os status são os do core
 * (`unconscious`, `dead`, combatente derrotado), os mesmos que o Qualidade de
 * Vida usa; assim as travas dele (não atacar nem mover com PV ≤ 0) continuam.
 *
 * A RD de ameaça é texto, como o livro imprime: "6/FÍSICO", "4/ÁCIDO", "IMUNE A
 * ATAQUES FÍSICOS". Com condição, o módulo não adivinha o tipo do dano: pergunta
 * a quem aplica. A RD de personagem é a da mutação Tato (ignora 2 de qualquer
 * dano).
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
const OPCAO_PV_ANTES = "spacedragonPVAntes";
const CLASSE_JPF = "sd-rolar-jpf";

const escapa = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* ── O QUE É PURO (testado em tools/teste-estados-de-dano.mjs) ───────────── */

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
  if (/^imune\b/i.test(s)) {
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

/** O dano depois da RD. `rd` Infinity é imunidade. */
export function descontarRD(dano, rd) {
  const bruto = Math.max(0, Math.floor(Number(dano) || 0));
  const r = rd === Infinity ? bruto : Math.max(0, Math.floor(Number(rd) || 0));
  return { final: Math.max(0, bruto - r), descontado: Math.min(bruto, r) };
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

/** Quem, no combate, está abaixo de 0, vivo, e ainda não estabilizou. */
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

/* ── A RD NA HORA DO DANO ──────────────────────────────────────────────── */

/**
 * A RD que vale contra este dano. Sem condição, a do ator; com condição,
 * pergunta. Devolve um número (Infinity = imune).
 */
export async function rdContra(ator, dano) {
  const rd = rdDoAtor(ator);
  if (!rd.condicao && !rd.imune) return rd.valor;
  const V2 = globalThis.foundry?.applications?.api?.DialogV2;
  if (!V2?.wait) return 0;
  const nome = escapa(ator.name);
  const sim = rd.imune ? txt("spacedragon.estados.rdImune") : txt("spacedragon.estados.rdSim", { rd: rd.valor });
  const r = await V2.wait({
    window: { title: txt("spacedragon.estados.rdJanela", { nome }) },
    content: `<p>${txt("spacedragon.estados.rdPergunta", { nome, rd: escapa(rd.texto), dano })}</p>`,
    buttons: [
      { action: "sim", label: sim, default: true, callback: () => (rd.imune ? Infinity : rd.valor) },
      { action: "nao", label: txt("spacedragon.estados.rdNao"), callback: () => 0 },
    ],
    rejectClose: false,
  });
  return r ?? 0;
}

/* ── OS STATUS ─────────────────────────────────────────────────────────── */

function temStatus(id) {
  return (globalThis.CONFIG?.statusEffects ?? []).some((s) => s.id === id);
}

async function status(ator, id, ativo) {
  if (!temStatus(id) || typeof ator?.toggleStatusEffect !== "function") return;
  if (!!ator.statuses?.has?.(id) === ativo) return;
  await ator.toggleStatusEffect(id, { active: ativo, overlay: ativo && id === "dead" });
}

async function marcarDerrotado(ator) {
  if (!globalThis.game?.user?.isGM) return;
  // token sem vínculo: o ator do combatente é o sintético do token, o mesmo uuid
  const c = globalThis.game?.combat?.combatants?.find?.((x) => x.actor === ator || (!!ator?.uuid && x.actor?.uuid === ator.uuid));
  if (c && !c.defeated) await c.update({ defeated: true });
}

/** Põe na ficha e no token o estado que o PV pede. */
export async function aplicarEstado(ator, estado, { piorou = false } = {}) {
  if (estado === "de-pe") {
    await status(ator, "unconscious", false);
    if (ator.flags?.[ID]?.[FLAG_ESTAVEL]) await ator.unsetFlag(ID, FLAG_ESTAVEL);
    return;
  }
  if (estado === "inconsciente" || estado === "morrendo") {
    await status(ator, "unconscious", true);
    // ferido de novo abaixo de 0: volta a correr risco
    if (estado === "morrendo" && piorou && ator.flags?.[ID]?.[FLAG_ESTAVEL]) await ator.unsetFlag(ID, FLAG_ESTAVEL);
    return;
  }
  // morto ou derrotado
  await status(ator, "unconscious", false);
  await status(ator, "dead", true);
  await marcarDerrotado(ator);
}

/* ── A JPF A CADA RODADA ───────────────────────────────────────────────── */

async function pedirJPF(combate) {
  for (const c of quemRolaJPF(combate?.combatants)) {
    const ator = c.actor;
    const donos = [...(globalThis.game?.users ?? [])]
      .filter((u) => u.isGM || ator.testUserPermission?.(u, "OWNER"))
      .map((u) => u.id);
    await globalThis.ChatMessage?.create?.({
      content:
        `<div class="sd-teste"><p>${txt("spacedragon.estados.jpfPedido", { nome: escapa(c.name ?? ator.name), pv: ator.system.hp.value, mortais: danosMortais(ator) })}</p>` +
        `<button type="button" class="${CLASSE_JPF}" data-ator="${escapa(ator.uuid)}" data-vez="${escapa(`${combate.id}:${combate.round}`)}">` +
        `<i class="fas fa-heart-pulse"></i> ${txt("spacedragon.estados.jpfBotao")}</button></div>`,
      speaker: globalThis.ChatMessage.getSpeaker?.({ actor: ator }),
      whisper: donos,
    });
  }
}

/** A JPF de quem está morrendo: passar estabiliza, falhar custa 1d4 PV. */
export async function rolarJPF(ator, vez = "") {
  if (!ator) return null;
  if (vez && ator.flags?.[ID]?.[FLAG_JPF] === vez) {
    globalThis.ui?.notifications?.warn?.(txt("spacedragon.estados.jpfJaFeita", { nome: escapa(ator.name) }));
    return null;
  }
  const r = await rolarJP(ator, "jpc");
  if (!r) return null;
  if (vez) await ator.setFlag(ID, FLAG_JPF, vez);
  const nome = escapa(ator.name);
  if (r.passou) {
    await ator.setFlag(ID, FLAG_ESTAVEL, true);
    await globalThis.ChatMessage?.create?.({
      content: `<div class="sd-teste"><p>${txt("spacedragon.estados.estabilizou", { nome, pv: ator.system.hp.value })}</p></div>`,
      speaker: globalThis.ChatMessage.getSpeaker?.({ actor: ator }),
    });
    return { ...r, perdeu: 0 };
  }
  const d4 = await new globalThis.Roll("1d4").evaluate();
  const pv = (Number(ator.system?.hp?.value) || 0) - d4.total;
  // o estado (e a morte nos Danos Mortais) vem do gancho de updateActor
  await ator.update({ "system.hp.value": pv });
  await globalThis.ChatMessage?.create?.({
    content: `<div class="sd-teste"><p>${txt("spacedragon.estados.piorou", { nome, n: d4.total, pv })}</p></div>`,
    speaker: globalThis.ChatMessage.getSpeaker?.({ actor: ator }),
    rolls: [d4],
  });
  return { ...r, perdeu: d4.total };
}

function ligarBotaoJPF(botao) {
  botao.dataset.ligado = "1";
  const ator = globalThis.fromUuidSync?.(botao.dataset.ator);
  if (!ator?.isOwner) {
    botao.disabled = true;
    return;
  }
  botao.addEventListener("click", (ev) => {
    ev.preventDefault();
    botao.disabled = true;
    rolarJPF(ator, botao.dataset.vez).catch((e) => console.error(`${ID} | a JPF falhou`, e));
  });
}

/* ── LIGAR ─────────────────────────────────────────────────────────────── */

function mortaisDo(ator, modo) {
  return modo === "personagem" ? danosMortais(ator) : 0;
}

export function ligarEstadosDeDano() {
  const H = globalThis.Hooks;

  // o PV de antes, para saber se a mudança foi dano (ver racas.js: o que se
  // escreve nas opções do preUpdate chega ao updateActor)
  H?.on?.("preUpdateActor", (ator, mudou, opcoes) => {
    if (globalThis.foundry?.utils?.hasProperty?.(mudou, "system.hp.value") && opcoes) {
      opcoes[OPCAO_PV_ANTES] = Number(ator.system?.hp?.value);
    }
  });

  // o estado pelo PV novo, no cliente de quem mudou
  H?.on?.("updateActor", (ator, mudou, opcoes, usuario) => {
    if (usuario !== globalThis.game?.user?.id) return;
    if (!globalThis.foundry?.utils?.hasProperty?.(mudou, "system.hp.value")) return;
    const modo = modoDo(ator);
    if (!modo) return;
    const pv = Number(ator.system?.hp?.value);
    if (!Number.isFinite(pv)) return;
    const antes = Number(opcoes?.[OPCAO_PV_ANTES]);
    const estado = estadoPorPV(pv, { modo, mortais: mortaisDo(ator, modo) });
    aplicarEstado(ator, estado, { piorou: Number.isFinite(antes) && pv < antes })
      .catch((e) => console.error(`${ID} | estado de dano`, e));
  });

  // o botão da JPF: o dono ou o Mestre rola
  H?.on?.("renderChatMessageHTML", (_msg, html) => {
    const jpf = html?.querySelector?.(`.${CLASSE_JPF}`);
    if (jpf && !jpf.dataset.ligado) ligarBotaoJPF(jpf);
  });

  // a virada de rodada pede a JPF de quem está abaixo de 0; só um Mestre pede
  H?.on?.("updateCombat", (combate, mudou) => {
    if (mudou?.round == null) return;
    const game = globalThis.game;
    if (!game?.user?.isGM || (game.users?.activeGM && game.users.activeGM.id !== game.user.id)) return;
    pedirJPF(combate).catch((e) => console.error(`${ID} | pedir a JPF falhou`, e));
  });
  return true;
}
