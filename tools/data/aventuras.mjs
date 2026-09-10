// Capítulo 6 — Aventuras Espaciais.
//
// Tripulação contratada, gravidade, terreno, carga e exploração.
//
// ── A GRAVIDADE MEXE EM TRÊS COISAS AO MESMO TEMPO ──────────────────────────
//
// Movimento, peso relativo e capacidade de carga. E não na mesma direção:
// gravidade BAIXA reduz o movimento mas AUMENTA a carga, porque o personagem
// pesa menos e carrega mais. É contraintuitivo e é fácil aplicar ao contrário.
//
// ── A ORDEM DAS PENALIDADES IMPORTA ─────────────────────────────────────────
//
// O livro é explícito: "a gravidade deve ser considerada ANTES do terreno".
// Primeiro a gravidade transforma o movimento base; depois o terreno desconta
// do resultado; depois a carga; depois a veste.

/** T6-1: quanto custa cada tripulante, por expedição de cerca de um mês. */
export const TRIPULANTES = [
  { funcao: "Guarda-costas", preco: 20000 },
  { funcao: "Piloto", preco: 30000 },
  { funcao: "Mecânico", preco: 50000 },
  { funcao: "Médico", preco: 150000 },
  { funcao: "Especialista", preco: 300000 },
];

/**
 * T6-2: o terreno.
 *
 * As duas porcentagens são do MESTRE, não do jogador: o livro pede que ele as
 * role em segredo, depois de algum tempo naquele terreno. Cabe aos jogadores
 * deduzir que se perderam, ou se preparar para o que aparecer.
 */
export const TERRENOS = [
  { terreno: "Planície", penalidade: 0, perder: "15%", encontro: "60%" },
  { terreno: "Colina", penalidade: -1, perder: "30%", encontro: "60%" },
  { terreno: "Montanha", penalidade: -4, perder: "30%", encontro: "40%" },
  { terreno: "Vulcão", penalidade: -4, perder: "30%", encontro: "40%" },
  { terreno: "Pântano", penalidade: -3, perder: "50%", encontro: "50%" },
  { terreno: "Geleira", penalidade: -2, perder: "50%", encontro: "30%" },
  { terreno: "Tundra", penalidade: -1, perder: "30%", encontro: "60%" },
  { terreno: "Deserto", penalidade: -2, perder: "50%", encontro: "15%" },
  { terreno: "Floresta", penalidade: -2, perder: "30%", encontro: "30%" },
  { terreno: "Cidade", penalidade: 0, perder: "5%", encontro: "5% ou 100%" },
];

/** T6-3: quanto se anda, a partir do movimento final em metros. */
export const DESLOCAMENTO = [
  { tempo: "1 segundo", distancia: "movimento ÷ 6 metros" },
  { tempo: "6 segundos", distancia: "movimento × 1 metro" },
  { tempo: "1 minuto", distancia: "movimento × 10 metros" },
  { tempo: "1 hora", distancia: "movimento × 600 metros" },
  { tempo: "1 dia", distancia: "movimento × 4 quilômetros" },
  { tempo: "1 semana", distancia: "movimento × 30 quilômetros" },
  { tempo: "1 mês", distancia: "movimento × 120 quilômetros" },
];

/** A penalidade de movimento por faixa de carga, pela T1-1 da Força. */
export const CARGA = [
  { faixa: "Até a carga leve", penalidade: "nenhuma", nota: "O caso mais comum." },
  { faixa: "Acima da leve, até a média", penalidade: "−1 metro", nota: "Levando equipamento importante ou provisões de viagem." },
  { faixa: "Acima da média, até a pesada", penalidade: "−2 metros", nota: "Equipamento pesado, mesmo dividindo o peso com outros." },
  { faixa: "Acima da pesada", penalidade: "não se move", nota: "O personagem fica sem locomoção." },
];

/**
 * A chance BASE de uma criatura inteligente reagir bem, pela afiliação dela.
 *
 * Sobre ela soma-se o ajuste de reação da Comunicação de QUEM está tentando o
 * contato, e o teste é feito por personagem — não um por grupo.
 */
export const REACAO = {
  leal: { amigavel: 70, texto: "70% de chance de ser amigável." },
  neutro: { amigavel: 50, texto: "50% de chance de ser amigável, 50% de ser hostil." },
  rebelde: { amigavel: 30, texto: "70% de chance de ser hostil." },
};

/** O movimento base de todo personagem, antes de qualquer modificador. */
export const MOVIMENTO_BASE = 10;

/** Os limites da escala de gravidade, em porcentagem. */
export const GRAVIDADE = { minimo: 0, padrao: 100, maximo: 200 };
