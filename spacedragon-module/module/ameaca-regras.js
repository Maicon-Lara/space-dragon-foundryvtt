/**
 * As regras do bloco de alienígena (Cap. 11) que a ficha do sistema não faz.
 *
 *   · PV pelo DV: d8, com o bônus fixo — "3+1 (13/25)" é 3d8+1.
 *   · O que um atributo 0 significa: INT 0 irracional, CIE 0 primitivo,
 *     COM 0 sem comunicação.
 *   · A Moral pedida quando metade do grupo cai.
 *   · O prêmio em XP de um vilão com classe: 10% do XP do nível dele.
 *
 * ── O PV QUE O SISTEMA ROLAVA ───────────────────────────────────────────────
 *
 * O bestiário grava o DV como o livro imprime — "3+1 (13/25)", "1D8+1 (5)" —, e
 * o sistema faz `isNaN(dv)`: não é número, ele cai no padrão 1. Toda criatura
 * rolava 1d8 de PV, sem o bônus; o Gigantossauro (DV 20+5) também. É o mesmo
 * defeito que a JP e a Moral tinham (ver ameaca.js).
 *
 * As partes puras daqui são testadas sem o Foundry (tools/teste-ameaca-regras.mjs).
 */

import { PROGRESSAO } from "./dados.js";
import { chassiDe } from "./chassi.js";
import { ehFichaSD, ligarNaFicha } from "./ficha.js";
import { t as txt } from "./i18n.js";

const ID = "spacedragon";
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

/* ── O DADO DE VIDA ────────────────────────────────────────────────────────── */

/**
 * O DV do bloco, lido como o livro o escreve.
 *
 *   "3+1 (13/25)"  → 3d8+1      (alienígena: sempre d8)
 *   "1D10+1 (6)"   → 1d10+1     (personagem de exemplo: o dado da classe)
 *   "9 (36/72)"    → 9d8
 *   "1 PV"         → 1 PV fixo, sem rolagem
 *   "2+2 (10/18) PARA CADA 2M" → 2d8+2, e a nota de que cresce com o tamanho
 *
 * `bonusExtra` é o campo "bônus de DV" da ficha, somado ao do bloco.
 * Devolve null se não houver número.
 */
export function lerDV(texto, bonusExtra = 0) {
  const s = String(texto ?? "").trim().toUpperCase();
  if (!s) return null;
  const extra = Number.parseInt(bonusExtra, 10) || 0;

  const fixo = s.match(/^(\d+)\s*PV\b/);
  if (fixo) return { fixo: Number(fixo[1]) + extra, quantidade: 0, faces: 0, bonus: 0, nota: "" };

  const m = s.match(/^(\d+)\s*(?:D(\d+))?\s*([+-]\s*\d+)?/);
  if (!m) return null;
  const nota = (s.match(/PARA CADA [^()]*$/)?.[0] ?? "").trim().toLowerCase();
  return {
    fixo: null,
    quantidade: Number(m[1]),
    faces: m[2] ? Number(m[2]) : 8,
    bonus: (m[3] ? Number(m[3].replace(/\s/g, "")) : 0) + extra,
    nota,
  };
}

/** A fórmula de rolagem do DV lido: "3d8+1". */
export function formulaDoDV(dv) {
  if (!dv || dv.fixo !== null) return null;
  const b = dv.bonus ? (dv.bonus > 0 ? `+${dv.bonus}` : `${dv.bonus}`) : "";
  return `${dv.quantidade}d${dv.faces}${b}`;
}

/** Rola os PV da criatura pelo DV e grava em PV atual e máximo. */
export async function rolarPVAmeaca(ator) {
  const dv = lerDV(ator?.system?.dv, ator?.system?.dv_bonus);
  if (!dv) {
    globalThis.ui?.notifications?.warn?.(txt("spacedragon.aviso.semDV", { nome: ator?.name ?? "", valor: ator?.system?.dv ?? "" }));
    return null;
  }
  let total;
  let roll = null;
  const formula = formulaDoDV(dv);
  if (dv.fixo !== null) {
    total = Math.max(1, dv.fixo);
  } else {
    roll = await new Roll(formula).evaluate();
    // nenhuma criatura nasce morta: o mínimo é 1 PV, mesmo com bônus negativo
    total = Math.max(1, roll.total);
  }
  await ator.update({ "system.hp.value": total, "system.hp.max": total });
  const nome = esc(ator.name);
  await ChatMessage.create({
    content:
      `<div class="title">${esc(txt("spacedragon.ameaca.pvTitulo", { nome }))}</div><div class="sd-teste">` +
      `<p>${dv.fixo !== null
        ? txt("spacedragon.ameaca.pvFixo", { total })
        : txt("spacedragon.ameaca.pvRolado", { formula, total })}</p>` +
      (dv.nota ? `<p><em>${esc(txt("spacedragon.ameaca.pvNota", { nota: dv.nota }))}</em></p>` : "") +
      `</div>`,
    speaker: ChatMessage.getSpeaker({ actor: ator }),
    rolls: roll ? [roll] : [],
    sound: roll ? CONFIG.sounds?.dice : undefined,
  });
  return { total, roll };
}

/* ── O ATRIBUTO ZERO ───────────────────────────────────────────────────────── */

/**
 * O que os atributos zerados do bloco dizem da criatura. Só o 0 de verdade:
 * campo vazio é "não informado", e não zero.
 */
export function significadoDosZeros(atributos = {}) {
  const zero = (k) => atributos?.[k] !== "" && atributos?.[k] !== null && atributos?.[k] !== undefined && Number(atributos[k]) === 0;
  const notas = [];
  if (zero("INT")) notas.push(txt("spacedragon.ameaca.int0"));
  if (zero("CIE")) notas.push(txt("spacedragon.ameaca.cie0"));
  if (zero("COM")) notas.push(txt("spacedragon.ameaca.com0"));
  return notas;
}

/* ── O PRÊMIO DO VILÃO COM CLASSE ──────────────────────────────────────────── */

const TABELA_DA_CLASSE = { Cientista: "CIENTISTA", Cosmonauta: "COSMONAUTA", Gatuno: "GATUNO", "Mentálico": "MENTALICO" };

/** "12.000" → 12000. */
const numero = (s) => Number(String(s ?? "").replace(/\./g, "").replace(",", ".")) || 0;

/**
 * O prêmio por derrotar um inimigo com classe: 10% do XP que a tabela da
 * classe pede para o nível dele, no mínimo 100. Conferido contra os
 * personagens de exemplo do bestiário (Cientista 5º: 12.000 → 1.200 XP).
 */
export function xpDeVilao(classe, nivel) {
  const tabela = PROGRESSAO[TABELA_DA_CLASSE[classe]]?.xp;
  if (!tabela) return null;
  const n = Math.min(Math.max(Number(nivel) || 1, 1), tabela.length);
  return Math.max(100, Math.round(numero(tabela[n - 1]) * 0.1));
}

/** O prêmio do ator, pela classe-base e pelo nível. Null se não tiver classe do livro. */
export function xpDeVilaoDoAtor(ator) {
  return xpDeVilao(chassiDe(ator), ator?.system?.level);
}

/** Mostra o prêmio na ficha do personagem, só para o Mestre. */
function desenharPremio(app, elemento) {
  try {
    const raiz = elemento?.querySelectorAll ? elemento : elemento?.[0];
    const ator = app?.actor;
    if (!raiz?.querySelector || ator?.type !== "character" || !ehFichaSD(app)) return;
    raiz.querySelectorAll(".sd-premio-vilao").forEach((n) => n.remove());
    if (!globalThis.game?.user?.isGM) return;
    // nave não é vilão: o prêmio de nave é outra conta
    if (ator.flags?.core?.sheetClass === "spacedragon.NaveSheet") return;
    const xp = xpDeVilaoDoAtor(ator);
    if (xp === null) return;
    const alvo = raiz.querySelector(".xp") ?? raiz.querySelector('input[name="system.current_xp"]')?.parentElement;
    if (!alvo) return;
    alvo.insertAdjacentHTML("beforeend",
      `<div class="sd-premio-vilao" title="${esc(txt("spacedragon.ameaca.premioDica"))}">` +
      `${esc(txt("spacedragon.ameaca.premio", { xp: xp.toLocaleString("pt-BR") }))}</div>`);
  } catch (e) {
    console.warn(`${ID} | não foi possível mostrar o prêmio de vilão`, e);
  }
}

/* ── A MORAL QUANDO METADE DO GRUPO CAI ────────────────────────────────────── */

/**
 * O grupo de um combatente: a mesma criatura do bestiário. Tokens sem vínculo
 * de um mesmo ator (três Zorks) são um grupo; dois atores diferentes, não.
 */
export const grupoDe = (combatente) => combatente?.actorId ?? combatente?.actor?.id ?? null;

/** Caiu: marcado como derrotado no rastreador, ou com PV 0 ou menos. */
export function caiu(combatente) {
  if (combatente?.defeated || combatente?.isDefeated) return true;
  const pv = combatente?.actor?.system?.hp?.value;
  return pv !== undefined && pv !== null && pv !== "" && Number(pv) <= 0;
}

/**
 * Os grupos de criaturas que chegaram a 50% de derrotados e ainda têm quem
 * role. Só monstros: personagem e vilão com classe não rolam Moral.
 * `avisados` são os grupos para os quais o aviso já saiu neste combate.
 */
export function gruposParaMoral(combatentes = [], avisados = []) {
  const grupos = new Map();
  for (const c of combatentes) {
    if (c?.actor?.type !== "monster") continue;
    const g = grupoDe(c);
    if (!g) continue;
    if (!grupos.has(g)) grupos.set(g, []);
    grupos.get(g).push(c);
  }
  const saida = [];
  for (const [grupo, lista] of grupos) {
    if (avisados.includes(grupo)) continue;
    const caidos = lista.filter(caiu);
    const vivos = lista.filter((c) => !caiu(c));
    if (vivos.length && caidos.length * 2 >= lista.length) {
      saida.push({ grupo, nome: vivos[0]?.actor?.name ?? vivos[0]?.name ?? "", total: lista.length, caidos: caidos.length, vivos });
    }
  }
  return saida;
}

const MARCA_MORAL = "sd-moral-grupo";

/** Confere o combate e avisa o Mestre, uma vez por grupo. Só o Mestre ativo grava. */
async function conferirMoral(combate) {
  const game = globalThis.game;
  if (!combate || !game?.user?.isGM || game.users?.activeGM?.id !== game.user.id) return;
  const avisados = combate.getFlag?.(ID, "moralAvisada") ?? [];
  const novos = gruposParaMoral([...(combate.combatants ?? [])], avisados);
  if (!novos.length) return;
  await combate.setFlag(ID, "moralAvisada", [...avisados, ...novos.map((g) => g.grupo)]);
  for (const g of novos) {
    const nome = esc(g.nome);
    await ChatMessage.create({
      content:
        `<div class="title">${esc(txt("spacedragon.ameaca.moralTitulo"))}</div><div class="sd-teste">` +
        `<p>${txt("spacedragon.ameaca.moralCaiu", { nome, caidos: g.caidos, total: g.total })}</p>` +
        `<p><button type="button" class="${MARCA_MORAL}" data-combate="${esc(combate.id)}" data-grupo="${esc(g.grupo)}">` +
        `${esc(txt("spacedragon.ameaca.moralBotao", { vivos: g.vivos.length }))}</button></p></div>`,
      whisper: game.users.filter((u) => u.isGM).map((u) => u.id),
    });
  }
}

/** O botão do cartão: rola a Moral de cada sobrevivente do grupo. */
async function rolarMoralDoGrupo(idCombate, grupo) {
  const combate = globalThis.game?.combats?.get?.(idCombate);
  if (!combate) return;
  const { rolarMoral } = await import("./ameaca.js");
  for (const c of combate.combatants ?? []) {
    if (grupoDe(c) === grupo && !caiu(c) && c.actor) await rolarMoral(c.actor);
  }
}

export function ligarRegrasDeAmeaca() {
  ligarNaFicha(desenharPremio);
  const Hooks = globalThis.Hooks;
  Hooks?.on?.("updateCombatant", (combatente) => conferirMoral(combatente?.parent ?? combatente?.combat));
  Hooks?.on?.("updateActor", (ator, mudou) => {
    if (mudou?.system?.hp === undefined) return;
    for (const combate of globalThis.game?.combats ?? []) {
      if ([...(combate.combatants ?? [])].some((c) => c.actor?.id === ator.id || c.actorId === ator.id)) conferirMoral(combate);
    }
  });
  Hooks?.on?.("renderChatMessageHTML", (_msg, html) => {
    const b = html?.querySelector?.(`.${MARCA_MORAL}`);
    if (!b || b.dataset.ligado) return;
    b.dataset.ligado = "1";
    b.addEventListener("click", (ev) => {
      ev.preventDefault();
      if (!globalThis.game?.user?.isGM) return;
      rolarMoralDoGrupo(b.dataset.combate, b.dataset.grupo);
    });
  });
}
