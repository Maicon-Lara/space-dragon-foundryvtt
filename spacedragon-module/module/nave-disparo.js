/**
 * O disparo de uma arma de nave: o alcance, a faixa e a conta do ataque.
 *
 * ── O ALCANCE É REGRA DA CASA ───────────────────────────────────────────────
 *
 * A T10-4 dá o dano das armas de nave e onde cada uma cabe, e nenhum alcance.
 * A mesa escolheu três faixas, como as das armas pessoais da T5-1 (a média dá
 * −2, a longa −4), na escala do movimento das naves: um caça anda 150 m por
 * rodada, um cruzador 20 m. Os números moram em equipamentos-nave.js, junto da
 * arma, e marcados como da casa.
 *
 * ── POR QUE A FICHA DISPARA, E NÃO O SISTEMA ────────────────────────────────
 *
 * A automação de combate do "Old Dragon 2: Qualidade de Vida" exige munição
 * equipada para toda arma à distância, e cancela o ataque sem ela. Arma de
 * nave não tem munição. A Ficha de Nave atende o clique antes (nave-pc-ficha.js),
 * e aproveita para aplicar o alcance, que nenhum dos dois mede.
 *
 * Nada aqui toca `game` ou `canvas`: a ficha mede a distância e lê os números;
 * a regra é esta, e tem teste em tools/teste-nave-disparo.mjs.
 */

import { EQUIPAMENTOS_DE_NAVE } from "./equipamentos-nave.js";

/** As três faixas, na ordem, com a penalidade de cada uma (T5-1). */
export const FAIXAS = [
  { chave: "curta", penalidade: 0 },
  { chave: "media", penalidade: -2 },
  { chave: "longa", penalidade: -4 },
];

/** A arma montada de um equipamento da T10-4, ou null se ele não atira. */
export function armaDoEquipamento(chave) {
  return EQUIPAMENTOS_DE_NAVE[chave]?.efeito?.arma ?? null;
}

/** "150 / 300 / 450 m", como as armas pessoais escrevem. */
export function alcanceEscrito(alcance) {
  if (!Array.isArray(alcance) || alcance.length !== 3) return "";
  return `${alcance.map((m) => m.toLocaleString("pt-BR")).join(" / ")} m`;
}

/**
 * A faixa em que o alvo está, pela distância em metros.
 *
 * Cada faixa vai ATÉ o número dela, inclusive: a 150 m, os disparadores ainda
 * estão na curta. Passou do último número, está fora de alcance. Sem distância
 * (nada no mapa, ou nenhum alvo marcado), a faixa fica para a mesa dizer.
 */
export function faixaDoAlcance(alcance, distancia) {
  const d = Number(distancia);
  if (!Array.isArray(alcance) || alcance.length !== 3) return null;
  if (distancia === null || distancia === undefined || !Number.isFinite(d) || d < 0) return null;
  const i = alcance.findIndex((limite) => d <= limite);
  if (i === -1) return { chave: "fora", penalidade: null, fora: true };
  return { ...FAIXAS[i], fora: false };
}

/** A penalidade de uma faixa escolhida pelo nome. Desconhecida conta como curta. */
export function penalidadeDaFaixa(chave) {
  return FAIXAS.find((f) => f.chave === chave)?.penalidade ?? 0;
}

/**
 * A fórmula do ataque: «1d20 + BA da nave + BA à distância de quem opera a
 * arma» (Cap. 10), mais o Computador Balístico, a faixa e o que a mesa somar.
 *
 * Termos zero ficam fora: "1d20 + 12 + 0 + 0 - 0" é ruído no chat, e quem lê
 * precisa ver de onde vem cada número que conta.
 */
export function formulaDoDisparo({ baNave = 0, balistico = 0, artilheiro = 0, penalidade = 0, situacao = 0 } = {}) {
  const termos = [baNave, balistico, artilheiro, penalidade, situacao]
    .map((n) => Math.trunc(Number(n) || 0))
    .filter((n) => n !== 0)
    .map((n) => (n > 0 ? `+ ${n}` : `- ${Math.abs(n)}`));
  return ["1d20", ...termos].join(" ");
}

/**
 * O que o resultado quer dizer contra o CP do alvo: «iguala ou supera o CP da
 * nave alvo e causa dano». Sem CP conhecido, a mesa compara.
 */
export function resultadoDoDisparo(total, cpDoAlvo) {
  const cp = Number(cpDoAlvo);
  if (cpDoAlvo === null || cpDoAlvo === undefined || cpDoAlvo === "" || !Number.isFinite(cp)) return null;
  return Number(total) >= cp ? "acerto" : "erro";
}
