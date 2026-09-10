/**
 * As seis tabelas de atributo do Capítulo 1.
 *
 * Transcritas do Livro Básico Aprimorado, tabelas T1-1 a T1-6. São a fundação
 * do sistema: PV, CP, ataque, poderes mentais e quase todo o resto derivam
 * daqui.
 *
 * ── POR QUE ISTO NÃO CABE NO OLD DRAGON 2 ──────────────────────────────────
 *
 * Não é diferença de nome, é de forma:
 *
 *   · A escala vai de 1 a 29 em faixas de DOIS (1, 2-3, 4-5, …, 28-29). O OD2
 *     usa faixas irregulares (2-3, 4-5, 6-8, 9-12, …) e para em 20.
 *   · O valor médio é 10-11 e o modificador ali é 0. No OD2 a faixa neutra é
 *     9-12, então Constituição 9 dá -1 aqui e 0 lá.
 *   · Cada atributo tem COLUNAS PRÓPRIAS. Força dá carga em kg, Ciência dá um
 *     DADO de robôs desativados, Comunicação dá número de seguidores. Não há
 *     "o modificador" único que o OD2 pressupõe.
 *   · Metade das colunas é PORCENTAGEM, que o OD2 não usa em lugar nenhum.
 *
 * ── COMO LER ───────────────────────────────────────────────────────────────
 *
 * `FAIXAS[i]` é o intervalo, e o índice `i` vale para as seis tabelas — todas
 * têm as mesmas quinze linhas. `tabela(atributo, valor)` devolve o objeto da
 * linha, ou a primeira/última se o valor sair da escala.
 */

/** As quinze faixas, iguais nas seis tabelas. [mínimo, máximo] */
export const FAIXAS = [
  [1, 1], [2, 3], [4, 5], [6, 7], [8, 9], [10, 11], [12, 13], [14, 15],
  [16, 17], [18, 19], [20, 21], [22, 23], [24, 25], [26, 27], [28, 29],
];

/** Índice da faixa para um valor de atributo. Satura fora da escala. */
export function faixaDe(valor) {
  if (valor <= 1) return 0;
  if (valor >= 29) return FAIXAS.length - 1;
  return FAIXAS.findIndex(([min, max]) => valor >= min && valor <= max);
}

// ── T1-1: FORÇA ─────────────────────────────────────────────────────────────
// ataque: ajuste de ataque e dano corpo-a-corpo
// subjugar: % somada à probabilidade de subjugar dos homens espaciais
// carga: [leve, média, pesada] em kg
export const FORCA = [
  { ataque: -5, subjugar: -25, carga: [1, 2, 5] },
  { ataque: -4, subjugar: -20, carga: [3, 5, 15] },
  { ataque: -3, subjugar: -15, carga: [5, 8, 25] },
  { ataque: -2, subjugar: -10, carga: [12, 15, 35] },
  { ataque: -1, subjugar: -5, carga: [15, 25, 45] },
  { ataque: 0, subjugar: 0, carga: [19, 30, 58] },
  { ataque: +1, subjugar: +5, carga: [25, 40, 75] },
  { ataque: +2, subjugar: +10, carga: [33, 50, 100] },
  { ataque: +3, subjugar: +15, carga: [43, 70, 130] },
  { ataque: +4, subjugar: +20, carga: [58, 90, 175] },
  { ataque: +5, subjugar: +25, carga: [75, 120, 230] },
  { ataque: +6, subjugar: +30, carga: [100, 150, 300] },
  { ataque: +7, subjugar: +35, carga: [135, 200, 400] },
  { ataque: +8, subjugar: +40, carga: [175, 250, 520] },
  { ataque: +9, subjugar: +45, carga: [235, 350, 700] },
];

// ── T1-2: DESTREZA ──────────────────────────────────────────────────────────
// ataque: ajuste de ataque à distância e proteção
// esgueirarDestrancar: % em esgueirar-se e destrancar portas
// ocultarFurtarDesarmar: % em ocultar-se e furtar (gatuno) e desarmar
//   (homem espacial)
//
// SÃO DUAS COLUNAS DE PORCENTAGEM, NÃO UMA. Elas não são iguais: acima da
// faixa neutra a segunda ATRASA um degrau — em 12-13 a primeira já dá +5% e a
// segunda ainda dá 0 —, e o teto é +40% contra +45%.
export const DESTREZA = [
  { ataque: -5, esgueirarDestrancar: -25, ocultarFurtarDesarmar: -25 },
  { ataque: -4, esgueirarDestrancar: -20, ocultarFurtarDesarmar: -20 },
  { ataque: -3, esgueirarDestrancar: -15, ocultarFurtarDesarmar: -15 },
  { ataque: -2, esgueirarDestrancar: -10, ocultarFurtarDesarmar: -10 },
  { ataque: -1, esgueirarDestrancar: -5, ocultarFurtarDesarmar: -5 },
  { ataque: 0, esgueirarDestrancar: 0, ocultarFurtarDesarmar: 0 },
  { ataque: +1, esgueirarDestrancar: +5, ocultarFurtarDesarmar: 0 },
  { ataque: +2, esgueirarDestrancar: +10, ocultarFurtarDesarmar: +5 },
  { ataque: +3, esgueirarDestrancar: +15, ocultarFurtarDesarmar: +10 },
  { ataque: +4, esgueirarDestrancar: +20, ocultarFurtarDesarmar: +15 },
  { ataque: +5, esgueirarDestrancar: +25, ocultarFurtarDesarmar: +20 },
  { ataque: +6, esgueirarDestrancar: +30, ocultarFurtarDesarmar: +25 },
  { ataque: +7, esgueirarDestrancar: +35, ocultarFurtarDesarmar: +30 },
  { ataque: +8, esgueirarDestrancar: +40, ocultarFurtarDesarmar: +35 },
  { ataque: +9, esgueirarDestrancar: +45, ocultarFurtarDesarmar: +40 },
];

// ── T1-3: CONSTITUIÇÃO ──────────────────────────────────────────────────────
// pv: ajuste de pontos de vida e proteção
// clonagem: % de chance de uma clonagem ser bem-sucedida
// mortais: com quantos PV negativos o personagem morre
export const CONSTITUICAO = [
  { pv: -5, clonagem: 0, mortais: -5 },    { pv: -4, clonagem: 0, mortais: -6 },
  { pv: -3, clonagem: 0, mortais: -7 },    { pv: -2, clonagem: 1, mortais: -8 },
  { pv: -1, clonagem: 10, mortais: -9 },   { pv: 0, clonagem: 25, mortais: -10 },
  { pv: +1, clonagem: 50, mortais: -11 },  { pv: +2, clonagem: 75, mortais: -12 },
  { pv: +3, clonagem: 95, mortais: -13 },  { pv: +4, clonagem: 100, mortais: -14 },
  { pv: +5, clonagem: 100, mortais: -15 }, { pv: +6, clonagem: 100, mortais: -16 },
  { pv: +7, clonagem: 100, mortais: -17 }, { pv: +8, clonagem: 100, mortais: -18 },
  { pv: +9, clonagem: 100, mortais: -19 },
];

// ── T1-4: INTELECTO ─────────────────────────────────────────────────────────
// poderMental: % de realizar e aprender um poder mental que ainda não domina
// alcanceAdicional: % de bônus no alcance mental diário
// protecaoMental: modificador em JP de mente e força de vontade
export const INTELECTO = [
  { poderMental: 0, alcanceAdicional: 0, protecaoMental: -5 },
  { poderMental: 0, alcanceAdicional: 0, protecaoMental: -4 },
  { poderMental: 0, alcanceAdicional: 0, protecaoMental: -3 },
  { poderMental: 0, alcanceAdicional: 0, protecaoMental: -2 },
  { poderMental: 0, alcanceAdicional: 0, protecaoMental: -1 },
  { poderMental: 15, alcanceAdicional: 0, protecaoMental: 0 },
  { poderMental: 25, alcanceAdicional: +1, protecaoMental: +1 },
  { poderMental: 35, alcanceAdicional: +2, protecaoMental: +2 },
  { poderMental: 45, alcanceAdicional: +3, protecaoMental: +3 },
  { poderMental: 55, alcanceAdicional: +4, protecaoMental: +4 },
  { poderMental: 65, alcanceAdicional: +5, protecaoMental: +5 },
  { poderMental: 75, alcanceAdicional: +6, protecaoMental: +6 },
  { poderMental: 85, alcanceAdicional: +7, protecaoMental: +7 },
  { poderMental: 95, alcanceAdicional: +8, protecaoMental: +8 },
  { poderMental: 100, alcanceAdicional: +9, protecaoMental: +9 },
];

// ── T1-5: CIÊNCIA ───────────────────────────────────────────────────────────
// robos: DADO de robôs desativados pelo cientista (string, é rolagem)
// localizarSabotar: % somada ao talento de localizar e sabotar máquinas do
//   gatuno. ATRASA TRÊS DEGRAUS acima da faixa neutra: 12-13, 14-15 e 10-11
//   dão todos 0, e só em 16-17 começa o +5%. O teto é +35%.
// creditoTecnologico: % de DESCONTO em gastos com equipamento. Não é bônus de
//   rolagem nenhum — é preço.
//
// NÃO EXISTE "aptidão tecnológica" na T1-5. Era uma coluna inventada, que
// somava uma escala de -25%..+45% em testes onde o livro manda somar outra.
export const CIENCIA = [
  { robos: "0", localizarSabotar: -25, creditoTecnologico: 0 },
  { robos: "0", localizarSabotar: -20, creditoTecnologico: 0 },
  { robos: "0", localizarSabotar: -15, creditoTecnologico: 0 },
  { robos: "0", localizarSabotar: -10, creditoTecnologico: 0 },
  { robos: "1", localizarSabotar: -5, creditoTecnologico: 0 },
  { robos: "1d2", localizarSabotar: 0, creditoTecnologico: 0 },
  { robos: "1d3", localizarSabotar: 0, creditoTecnologico: 10 },
  { robos: "1d4", localizarSabotar: 0, creditoTecnologico: 15 },
  { robos: "1d6", localizarSabotar: +5, creditoTecnologico: 20 },
  { robos: "1d8", localizarSabotar: +10, creditoTecnologico: 25 },
  { robos: "2d4", localizarSabotar: +15, creditoTecnologico: 30 },
  { robos: "1d10", localizarSabotar: +20, creditoTecnologico: 35 },
  { robos: "1d12", localizarSabotar: +25, creditoTecnologico: 40 },
  { robos: "2d6", localizarSabotar: +30, creditoTecnologico: 45 },
  { robos: "1d20", localizarSabotar: +35, creditoTecnologico: 50 },
];

// ── T1-6: COMUNICAÇÃO ───────────────────────────────────────────────────────
// seguidores: número máximo (não conta subalternos ou parceiros contratados)
// reacao: % somada a qualquer jogada de reação
// idiomas: idiomas além da língua do planeta natal e do idioma espacial
export const COMUNICACAO = [
  { seguidores: 0, reacao: -25, idiomas: 0 }, { seguidores: 0, reacao: -20, idiomas: 0 },
  { seguidores: 0, reacao: -15, idiomas: 0 }, { seguidores: 0, reacao: -10, idiomas: 0 },
  { seguidores: 0, reacao: -5, idiomas: 0 },  { seguidores: 1, reacao: 0, idiomas: 0 },
  { seguidores: 2, reacao: +5, idiomas: 1 },  { seguidores: 3, reacao: +10, idiomas: 2 },
  { seguidores: 4, reacao: +15, idiomas: 3 }, { seguidores: 5, reacao: +20, idiomas: 4 },
  { seguidores: 6, reacao: +25, idiomas: 5 }, { seguidores: 7, reacao: +30, idiomas: 6 },
  { seguidores: 8, reacao: +35, idiomas: 7 }, { seguidores: 9, reacao: +40, idiomas: 8 },
  { seguidores: 10, reacao: +45, idiomas: 9 },
];

export const TABELAS = {
  forca: FORCA,
  destreza: DESTREZA,
  constituicao: CONSTITUICAO,
  intelecto: INTELECTO,
  ciencia: CIENCIA,
  comunicacao: COMUNICACAO,
};

/** Os seis, na ordem em que o livro os apresenta e a ficha deve mostrar. */
export const ATRIBUTOS = ["forca", "destreza", "constituicao", "intelecto", "ciencia", "comunicacao"];

export const ROTULOS = {
  forca: { nome: "Força", sigla: "FOR" },
  destreza: { nome: "Destreza", sigla: "DES" },
  constituicao: { nome: "Constituição", sigla: "CON" },
  intelecto: { nome: "Intelecto", sigla: "INT" },
  ciencia: { nome: "Ciência", sigla: "CIE" },
  comunicacao: { nome: "Comunicação", sigla: "COM" },
};

/** O cabeçalho de cada coluna, como o livro o escreve. */
export const COLUNAS = {
  ataque: { forca: "Ajuste de Ataque e Dano Corpo-a-Corpo", destreza: "Ajuste de Ataque à Distância e Proteção" },
  subjugar: "Subjugar",
  carga: "Capacidade de Carga",
  esgueirarDestrancar: "Esgueirar-se e Destrancar Portas",
  ocultarFurtarDesarmar: "Ocultar-se, Furtar e Desarmar",
  pv: "Ajuste de Pontos de Vida e Proteção",
  clonagem: "Probabilidade de Clonagem",
  mortais: "Danos Mortais",
  poderMental: "Reproduzir e Aprender Poder Mental",
  alcanceAdicional: "Alcance Mental Adicional",
  protecaoMental: "Proteção Mental",
  robos: "Quantidade de Robôs Desativados",
  localizarSabotar: "Localizar e Sabotar Máquinas",
  creditoTecnologico: "Crédito Tecnológico",
  seguidores: "Número Máximo de Seguidores",
  reacao: "Ajuste de Reação",
  idiomas: "Idiomas Adicionais",
};

/** O rótulo da coluna `c` na tabela de `atributo`. */
export function rotuloColuna(c, atributo) {
  const r = COLUNAS[c];
  return typeof r === "string" ? r : (r?.[atributo] ?? c);
}

/** A linha da tabela de `atributo` para um `valor`. */
export function tabela(atributo, valor) {
  const t = TABELAS[atributo];
  if (!t) throw new Error(`Atributo desconhecido: ${atributo}`);
  return t[faixaDe(valor)];
}
