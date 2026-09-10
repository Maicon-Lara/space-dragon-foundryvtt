// T3-2: Desativar Robôs.
//
// ── NÃO É TESTE DE PORCENTAGEM ──────────────────────────────────────────────
//
// É o único teste do Cientista que roda em 1d20, e com a comparação NO SENTIDO
// DO OLD DRAGON 2: o resultado precisa ser IGUAL OU MAIOR que o número da
// tabela. Todo o resto do Space Dragon é 1d100 com sucesso no menor ou igual.
//
// A linha é o NÍVEL DO DISRUPTOR POSITRÔNICO, não o nível do cientista. O
// disruptor é um aparato do Capítulo 8, e sobe de nível pelas regras de lá.
//
// Duas letras no lugar do número:
//
//   A  desativa automaticamente, sem rolar
//   N  robôs desse tipo não são afetados neste nível
//   D  destruídos e completamente inutilizados
//
// A QUANTIDADE de robôs atingidos não sai daqui: sai da T1-5 da Ciência, e é
// um DADO — 1d2 com Ciência 10–11, 1d20 com 28–29.

/** As oito colunas, na ordem do livro: do mais simples ao mais avançado. */
export const TIPOS_DE_ROBO = [
  "sucata", "protótipo", "repetidor", "autômato",
  "humanoide", "serviçal", "metahumano", "androide",
];

/** O que cada letra significa no lugar de um alvo de 1d20. */
export const LETRAS = {
  A: "desativado automaticamente, sem rolagem",
  N: "não é afetado neste nível de disruptor",
  D: "destruído e completamente inutilizado",
};

/** T3-2, indexada pelo nível do DISRUPTOR. */
export const DESATIVAR_ROBOS = [
  { nivel:  1, sucata: "13", protótipo: "17", repetidor: "19", autômato: "N", humanoide: "N", serviçal: "N", metahumano: "N", androide: "N" },
  { nivel:  2, sucata: "11", protótipo: "15", repetidor: "18", autômato: "20", humanoide: "N", serviçal: "N", metahumano: "N", androide: "N" },
  { nivel:  3, sucata: "9", protótipo: "13", repetidor: "17", autômato: "19", humanoide: "N", serviçal: "N", metahumano: "N", androide: "N" },
  { nivel:  4, sucata: "7", protótipo: "11", repetidor: "15", autômato: "18", humanoide: "20", serviçal: "N", metahumano: "N", androide: "N" },
  { nivel:  5, sucata: "5", protótipo: "9", repetidor: "13", autômato: "17", humanoide: "19", serviçal: "N", metahumano: "N", androide: "N" },
  { nivel:  6, sucata: "3", protótipo: "7", repetidor: "11", autômato: "15", humanoide: "18", serviçal: "20", metahumano: "N", androide: "N" },
  { nivel:  7, sucata: "A", protótipo: "5", repetidor: "9", autômato: "13", humanoide: "17", serviçal: "19", metahumano: "N", androide: "N" },
  { nivel:  8, sucata: "A", protótipo: "3", repetidor: "7", autômato: "11", humanoide: "15", serviçal: "18", metahumano: "20", androide: "N" },
  { nivel:  9, sucata: "A", protótipo: "2", repetidor: "5", autômato: "9", humanoide: "13", serviçal: "17", metahumano: "19", androide: "N" },
  { nivel: 10, sucata: "D", protótipo: "A", repetidor: "3", autômato: "7", humanoide: "11", serviçal: "15", metahumano: "18", androide: "20" },
  { nivel: 11, sucata: "D", protótipo: "A", repetidor: "2", autômato: "5", humanoide: "9", serviçal: "13", metahumano: "17", androide: "19" },
  { nivel: 12, sucata: "D", protótipo: "A", repetidor: "A", autômato: "3", humanoide: "7", serviçal: "11", metahumano: "15", androide: "18" },
  { nivel: 13, sucata: "D", protótipo: "D", repetidor: "A", autômato: "2", humanoide: "5", serviçal: "9", metahumano: "13", androide: "17" },
  { nivel: 14, sucata: "D", protótipo: "D", repetidor: "A", autômato: "A", humanoide: "3", serviçal: "7", metahumano: "11", androide: "15" },
  { nivel: 15, sucata: "D", protótipo: "D", repetidor: "D", autômato: "A", humanoide: "2", serviçal: "5", metahumano: "9", androide: "13" },
  { nivel: 16, sucata: "D", protótipo: "D", repetidor: "D", autômato: "A", humanoide: "A", serviçal: "3", metahumano: "7", androide: "11" },
  { nivel: 17, sucata: "D", protótipo: "D", repetidor: "D", autômato: "D", humanoide: "A", serviçal: "2", metahumano: "5", androide: "9" },
  { nivel: 18, sucata: "D", protótipo: "D", repetidor: "D", autômato: "D", humanoide: "A", serviçal: "A", metahumano: "3", androide: "7" },
  { nivel: 19, sucata: "D", protótipo: "D", repetidor: "D", autômato: "D", humanoide: "D", serviçal: "A", metahumano: "2", androide: "5" },
  { nivel: 20, sucata: "D", protótipo: "D", repetidor: "D", autômato: "D", humanoide: "D", serviçal: "A", metahumano: "A", androide: "3" },
];
