/**
 * A XP de uma nave abatida — REGRA DA CASA: o livro não dá XP para naves.
 *
 * ── A TABELA ────────────────────────────────────────────────────────────────
 *
 * Um valor por tipo da T10-1, na escala do bestiário do Cap. 11, onde uma
 * criatura de DV 5 vale cerca de 405 XP, uma de DV 10 cerca de 1.390 e uma de
 * DV 20, 7.250. O Mestre troca o valor de uma nave específica na ficha dela
 * (`nave.xp`), e o valor da ficha vence a tabela.
 *
 * ── O QUE O FIM DE COMBATE FAZIA ────────────────────────────────────────────
 *
 * O cartão de fim de combate do "Old Dragon 2: Qualidade de Vida" soma a XP dos
 * atores do tipo MONSTRO e divide entre os do tipo PERSONAGEM. A nave é ator do
 * tipo personagem, e com isso a nave inimiga não dava XP nenhuma e a nave dos
 * jogadores entrava na divisão como se fosse um tripulante. Num combate só de
 * naves, que é o normal, não havia o que dividir nem com quem.
 *
 * O ajuste é no cartão, antes de ele ser criado (integracao-qdv.js): as naves
 * inimigas entram na lista de derrotados, com a XP desta tabela, e quem recebe
 * passa a ser a tripulação — nunca uma nave. A escolha de quais derrotados
 * contam continua no diálogo do Qualidade de Vida.
 */

import { TIPOS } from "./tipos-de-nave.js";
import { ehNave } from "./nave-marca.js";
import { naveDe } from "./nave-pc-dados.js";
import { t as txt } from "./i18n.js";

const ID = "spacedragon";

/** A XP de cada tipo da T10-1, na escala do bestiário. */
export const XP_POR_TIPO = {
  capsula: 100,         // ≈ DV 2
  caca: 405,            // ≈ DV 5
  escolta: 555,         // ≈ DV 6
  particular: 875,      // ≈ DV 8
  transuniversal: 1390, // ≈ DV 10
  cargueiro: 1390,      // ≈ DV 10
  cruzador: 2615,       // ≈ DV 14
  naveMae: 7250,        // ≈ DV 20
};

/** O tipo da nave: o gravado; senão o do tipo cujo nome é o da raça arrastada. */
export function tipoDaNave(nave, nomeDaRaca = "") {
  if (nave?.tipo && TIPOS[nave.tipo]) return nave.tipo;
  const nome = String(nomeDaRaca ?? "").trim();
  return Object.entries(TIPOS).find(([, t]) => t.rotulo === nome)?.[0] ?? null;
}

/**
 * Quanto a nave vale ao ser abatida: o valor da ficha, se o Mestre pôs um;
 * senão o da tabela; senão 0.
 */
export function xpDaNave(nave, nomeDaRaca = "") {
  const daFicha = nave?.xp;
  if (daFicha !== null && daFicha !== undefined && daFicha !== "" && Number.isFinite(Number(daFicha))) {
    return Math.max(0, Math.trunc(Number(daFicha)));
  }
  return XP_POR_TIPO[tipoDaNave(nave, nomeDaRaca)] ?? 0;
}

/** A nave é dos jogadores? Quem tem dono jogador não é "abatida" por eles. */
const dosJogadores = (ator) => !!ator?.hasPlayerOwner;

/**
 * O retrato de um combate que acabou, do ponto de vista das naves.
 *
 *   inimigas    as naves sem dono jogador, com a XP e o PV de cada uma;
 *   tripulacao  os ids dos personagens que recebem: os não-nave do combate, os
 *               que estão nos postos das naves dos jogadores e, se ainda não
 *               houver ninguém, os personagens dos donos dessas naves.
 *
 * `achar(nome)` acha um ator pelo nome; `personagensDosDonos(nave)` devolve os
 * personagens dos jogadores donos da nave. Os dois vêm de fora para isto ter
 * teste sem Foundry.
 */
export function retratoDoCombate(combatentes = [], { achar = () => null, personagensDosDonos = () => [] } = {}) {
  const inimigas = [];
  const tripulacao = new Map();
  const navesNossas = [];
  const vistos = new Set();

  for (const c of combatentes) {
    const ator = c?.actor;
    if (!ator || vistos.has(ator.id)) continue;
    vistos.add(ator.id);
    if (!ehNave(ator)) {
      if (ator.type === "character") tripulacao.set(ator.id, ator);
      continue;
    }
    if (dosJogadores(ator)) {
      navesNossas.push(ator);
      continue;
    }
    const nave = naveDe(ator, ID);
    inimigas.push({
      name: c.name ?? ator.name,
      xp: xpDaNave(nave, ator.system?.race?.name ?? ""),
      hp: Number(ator.system?.hp?.value ?? 0) || 0,
      maxHp: Number(ator.system?.hp?.max ?? 0) || 0,
    });
  }

  for (const n of navesNossas) {
    for (const nome of Object.values(naveDe(n, ID)?.postos ?? {})) {
      const a = achar(String(nome ?? "").trim());
      if (a && !ehNave(a) && a.type === "character") tripulacao.set(a.id, a);
    }
  }
  if (!tripulacao.size) {
    for (const n of navesNossas) {
      for (const a of personagensDosDonos(n) ?? []) {
        if (a && !ehNave(a)) tripulacao.set(a.id, a);
      }
    }
  }

  return {
    inimigas,
    tripulacao: [...tripulacao.values()].sort((x, y) => String(x.name).localeCompare(String(y.name), "pt-BR")),
  };
}

/**
 * O prêmio do cartão de fim de combate, com as naves.
 *
 * Recebe o `xpAward` que o Qualidade de Vida montou e o retrato do combate, e
 * devolve o novo: as inimigas somadas aos derrotados, quem recebe sem nenhuma
 * nave, e o total refeito. Os derrotados que ele já tinha ficam como estão.
 */
export function premioComNaves(premio = {}, retrato = { inimigas: [], tripulacao: [] }, ehNavePorId = () => false) {
  const criaturas = [...(premio.creatures ?? []), ...retrato.inimigas];
  const quem = new Map();
  for (const r of premio.recipients ?? []) {
    if (!ehNavePorId(r.actorId)) quem.set(r.actorId, r);
  }
  for (const a of retrato.tripulacao) {
    if (!quem.has(a.id)) quem.set(a.id, { actorId: a.id, name: a.name });
  }
  return {
    ...premio,
    creatures: criaturas,
    recipients: [...quem.values()],
    totalXp: criaturas.reduce((s, c) => s + (Number(c.xp) || 0), 0),
  };
}

const escapa = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const emXP = (n) => (Number(n) || 0).toLocaleString("pt-BR");

/**
 * O HTML do cartão do Qualidade de Vida, com as naves.
 *
 * Mexe só no que precisa: acrescenta uma linha por nave abatida na lista de
 * derrotados (trocando a linha de "nenhuma criatura" se era a única), refaz o
 * total e põe o botão de distribuir quando ele não existia — o cartão de um
 * combate só de naves nascia sem botão, por não ver XP nem quem a recebesse.
 * O botão leva o mesmo atributo que o Qualidade de Vida procura para ligar o
 * clique dele.
 */
export function cartaoComNaves(html = "", novo = {}, inimigas = [], tinhaCriaturas = true) {
  let s = String(html);
  if (inimigas.length) {
    const linhas = inimigas
      .map((n) => `<li>${txt("spacedragon.qdv.naveAbatida", { nome: escapa(n.name), xp: emXP(n.xp) })}</li>`)
      .join("");
    s = tinhaCriaturas
      ? s.replace("</ul>", `${linhas}</ul>`)
      : s.replace(/<ul>[\s\S]*?<\/ul>/, `<ul>${linhas}</ul>`);
  }
  s = s.replace(
    /<div class="od2ca-xp-total">[\s\S]*?<\/div>/,
    `<div class="od2ca-xp-total"><strong>${txt("spacedragon.qdv.xpTotal")}:</strong> ${emXP(novo.totalXp)} XP</div>`,
  );
  const podeDistribuir = (novo.totalXp ?? 0) > 0 && (novo.recipients ?? []).length > 0;
  if (podeDistribuir && !s.includes('data-od2ca-action="distribute-xp"')) {
    s = s.replace(
      /(<div class="od2ca-xp-total">[\s\S]*?<\/div>)/,
      `$1<button type="button" data-od2ca-action="distribute-xp"><i class="fas fa-award"></i> ${txt("spacedragon.qdv.distribuir")}</button>`,
    );
  }
  return s;
}
