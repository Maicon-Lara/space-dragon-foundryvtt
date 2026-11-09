/**
 * O Combate de Convés de naves — REGRA DA CASA, ligada por opção de mundo.
 *
 * Uma versão enxuta do Combate Cinematográfico: mesma ficha, mesmo duelo e
 * mesma Tensão, com a escala menor, duas ações por posto, o golpe forte em d6
 * e o Colapso, em que a tripulação pode morrer.
 *
 * Fonte: `combate-de-conves.md`, a regra aprovada pela mesa.
 *
 * Nada aqui toca `game`, `canvas` ou `ui`: tools/teste-nave-conves.mjs testa
 * tudo em Node. O motor que rola e grava mora em nave-cine-acoes.js.
 */

import { ESCALA, tensaoDaRodada, aplicarDanoCine, atingeCamara } from "./nave-cinematico.js";

/* ── A ESCALA ─────────────────────────────────────────────────────────────── */

export const ESCALA_CONVES = {
  caca: { escudo: 0, casco: 20 },
  capsula: { escudo: 0, casco: 15 },
  escolta: { escudo: 0, casco: 30 },
  particular: { escudo: 10, casco: 30 },
  cargueiro: { escudo: 20, casco: 50 },
  transuniversal: { escudo: 20, casco: 50 },
  cruzador: { escudo: 40, casco: 100 },
  naveMae: { escudo: 40, casco: 130 },
};

/** A escala do tipo, no mesmo formato de `escalaDoTipo` do Cinematográfico. */
export function escalaConves(tipo, { temEscudo = false } = {}) {
  const e = ESCALA_CONVES[tipo];
  if (!e) return null;
  const comEscudo = Boolean(temEscudo) && e.escudo > 0;
  return {
    escudo: comEscudo ? e.escudo : 0,
    casco: e.casco,
    agilidade: ESCALA[tipo].agilidade,
    recarga: comEscudo ? ESCALA[tipo].recarga : null,
  };
}

/* ── O PERIGO ─────────────────────────────────────────────────────────────── */

export const RODADA_DO_DADO_EXTRA = 4;

/** Os dados a mais no dano: um da 4ª rodada em diante, um da Sobrecarga. */
export function dadosExtras(rodada, { sobrecarga = false } = {}) {
  return (Number(rodada) >= RODADA_DO_DADO_EXTRA ? 1 : 0) + (sobrecarga ? 1 : 0);
}

/* ── O ATAQUE ─────────────────────────────────────────────────────────────── */

/** Os termos do ataque, cada um com nome, para o cartão. */
export function termosConves({
  ba = 0, balistico = 0, artilheiro = 0, rodada = 0, vantagem = null, caudaContraMim = false,
  travado = false, interferido = false, golpes = {}, mirar = false, situacao = 0,
} = {}) {
  return [
    ["BA da nave", ba],
    ["Computador Balístico", balistico],
    ["artilheiro", artilheiro],
    ["Tensão", tensaoDaRodada(rodada)],
    ["Mira (duelo)", [].concat(vantagem ?? []).includes("mira") ? 2 : 0],
    ["Na cauda (inimigo)", caudaContraMim ? -2 : 0],
    ["Travar (Sensores)", travado ? 2 : 0],
    ["Interferência sofrida", interferido ? -2 : 0],
    ["Ponte atingida", golpes?.ponte ? -2 : 0],
    ["Mirar", mirar ? -2 : 0],
    ["situação", situacao],
  ]
    .map(([r, v]) => [r, Math.trunc(Number(v) || 0)])
    .filter(([, v]) => v !== 0);
}

/* ── O GOLPE FORTE ────────────────────────────────────────────────────────── */

export const MARGEM_DO_GOLPE = 5;

/** Golpe forte: dano no Casco com margem de 5 ou mais, ou 20 natural. */
export const golpeForte = ({ total, cp, natural, noCasco = 0 } = {}) =>
  atingeCamara({ total, cp, natural, noCasco, margem: MARGEM_DO_GOLPE });

/**
 * Os seis golpes. `persiste` fica na nave até reparar; os outros acontecem uma
 * vez e pedem JPR (`jpr`: quantos postos).
 */
export const GOLPES = [
  { chave: "ponte", rotulo: "Ponte", efeito: "−2 nos ataques.", persiste: true },
  { chave: "motores", rotulo: "Motores", efeito: "Sem Giro evasivo.", persiste: true },
  { chave: "armas", rotulo: "Armas", efeito: "Uma arma parada.", persiste: true },
  { chave: "incendio", rotulo: "Incêndio", efeito: "1d6 no Casco por rodada.", persiste: true, dado: "1d6" },
  { chave: "brecha", rotulo: "Brecha", efeito: "Dois postos à escolha do Mestre fazem JPR.", persiste: false, jpr: 2 },
  { chave: "tripulacao", rotulo: "Tripulação", efeito: "Um posto aleatório faz JPR.", persiste: false, jpr: 1 },
];
export const GOLPE = Object.fromEntries(GOLPES.map((g) => [g.chave, g]));

export const golpeDoD6 = (n) => GOLPES[Math.trunc(Number(n)) - 1] ?? null;

/** Com a única arma parada, a nave não atira. */
export const semArmaParaAtirar = (golpes, armasInstaladas) =>
  Boolean(golpes?.armas) && Number(armasInstaladas) <= 1;

/** O dano de quem falha a JPR: dobra com o Casco abaixo da metade. */
export const danoATripulante = (casco, max) => (Number(casco) < Number(max) / 2 ? "2d6" : "1d6");

/**
 * Aplica um impacto já rolado: Escudo, depois Casco. O golpe só vale se o dano
 * ainda chega ao Casco na hora em que o Mestre aplica, porque entre o tiro e o
 * clique o Escudo pode ter recarregado.
 */
export function aplicarImpactoConves(cine, casco, imp = {}) {
  const r = aplicarDanoCine({ escudo: cine.escudo.atual, casco, dano: imp.dano });
  const golpe = imp.golpe && r.noCasco > 0 ? GOLPE[imp.golpe] ?? null : null;
  const golpes = golpe?.persiste ? { ...cine.golpes, [golpe.chave]: true } : { ...cine.golpes };
  return {
    cine: { ...cine, escudo: { ...cine.escudo, atual: r.escudo }, golpes },
    casco: r.casco,
    noEscudo: r.noEscudo,
    noCasco: r.noCasco,
    golpe,
  };
}

/** Tira um golpe da nave. */
export function repararGolpe(golpes = {}, chave) {
  const novo = { ...golpes };
  delete novo[chave];
  return novo;
}

/* ── A FUGA ───────────────────────────────────────────────────────────────── */

export const MARCAS_DA_FUGA = 3;

/** Mais uma marca no relógio: { marcas, escapou }. */
export function marcarFuga(marcas) {
  const n = Math.min(MARCAS_DA_FUGA, Math.max(0, Number(marcas) || 0) + 1);
  return { marcas: n, escapou: n >= MARCAS_DA_FUGA };
}

/* ── O COLAPSO ────────────────────────────────────────────────────────────── */

export const RODADAS_DE_COLAPSO = 3;
export const BONUS_MAXIMO_DO_COLAPSO = 4;

/**
 * O fim de uma rodada para o Colapso: { colapso, evento }.
 *
 * `evento` é "comecou", "contando", "fim" ou null. O Colapso começa no fim da
 * rodada em que o Casco chegou a 0 e corre pelas 3 rodadas seguintes. Depois
 * do "fim", nada mais acontece: a JPR final é uma só.
 */
export function avancarColapso(colapso, casco) {
  if (colapso?.acabou) return { colapso, evento: null };
  if (!colapso) {
    if (Number(casco) > 0) return { colapso: null, evento: null };
    return { colapso: { restam: RODADAS_DE_COLAPSO, bonus: 0 }, evento: "comecou" };
  }
  const restam = Number(colapso.restam) - 1;
  if (restam > 0) return { colapso: { ...colapso, restam }, evento: "contando" };
  return { colapso: { ...colapso, restam: 0, acabou: true }, evento: "fim" };
}

/** Um salvamento bem-sucedido: +1 na JPR final, até +4. */
export function somarSalvamento(colapso) {
  if (!colapso || colapso.acabou) return colapso;
  return { ...colapso, bonus: Math.min(BONUS_MAXIMO_DO_COLAPSO, (Number(colapso.bonus) || 0) + 1) };
}

/* ── OS POSTOS ────────────────────────────────────────────────────────────── */

export const ACOES_CONVES = {
  leme: [
    { chave: "giro", rotulo: "Giro evasivo", efeito: "+4 de CP até o próximo turno da nave. Sem teste." },
    { chave: "fuga", rotulo: "Marcar a fuga", efeito: "Teste de Pilotar: +1 no relógio. Três marcas, a nave escapa." },
  ],
  artilharia: [
    { chave: "disparar", rotulo: "Disparar (botão da arma, em Armamento)", efeito: "Pelo botão da arma, na ficha." },
    { chave: "mirar", rotulo: "Mirar (na janela do disparo)", efeito: "Marque na janela do disparo: −2; num golpe forte, você escolhe o sistema." },
  ],
  engenharia: [
    { chave: "reparar", rotulo: "Reparar (nos sistemas atingidos, abaixo)", efeito: "Clique em Reparar no golpe da lista abaixo." },
    { chave: "sobrecargaDano", rotulo: "Sobrecarga: dano", efeito: "+1 dado no próximo acerto da rodada. Na falha, Motores atingidos." },
    { chave: "sobrecargaFuga", rotulo: "Sobrecarga: fuga", efeito: "+1 no relógio de fuga. Na falha, Motores atingidos." },
  ],
  sensores: [
    { chave: "travar", rotulo: "Travar", efeito: "+2 nos ataques contra o alvo marcado." },
    { chave: "interferir", rotulo: "Interferir", efeito: "−2 no ataque do alvo marcado, até o fim da próxima rodada." },
  ],
  comando: [
    { chave: "ordem", rotulo: "Ordem (um aliado repete uma rolagem)", efeito: "Um aliado repete uma rolagem." },
    { chave: "recompor", rotulo: "Recompor", efeito: "O Escudo recupera a Recarga. Uma vez por combate." },
  ],
};

/** As ações que a ficha aplica sozinha; as outras são lembretes para a mesa. */
export const AUTOMATICAS_CONVES = new Set([
  "giro", "fuga", "sobrecargaDano", "sobrecargaFuga", "travar", "interferir", "recompor",
]);

/** De que posto é cada ação. */
export const POSTO_DA_ACAO_CONVES = Object.fromEntries(
  Object.entries(ACOES_CONVES).flatMap(([posto, acoes]) => acoes.map((a) => [a.chave, posto])),
);
