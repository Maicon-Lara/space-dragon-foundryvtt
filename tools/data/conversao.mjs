// A conversão Space Dragon → Old Dragon 2.
//
// Este arquivo é a peça central do módulo. Tudo o mais depende de acertá-lo.
//
// ── A EQUIVALÊNCIA DE ATRIBUTO ──────────────────────────────────────────────
//
// NÃO é a que o nome sugere. Pela Tabela 1.1 do guia "Jogando Space Dragon com
// Old Dragon 2", de Francisco Martellini:
//
//     Força        → Força
//     Destreza     → Destreza
//     Constituição → Constituição
//     Ciência      → INTELIGÊNCIA
//     Intelecto    → SABEDORIA        ← não é Inteligência
//     Comunicação  → Carisma
//
// O guia justifica: "o atributo Intelecto tem uma semelhança maior com a
// Sabedoria do que com a Inteligência, sendo usado inclusive nas Jogadas de
// Proteção". Mapear pelo nome parecido inverteria dois atributos no módulo
// inteiro, e o erro só apareceria quando um teste caísse no atributo errado.
export const ATRIBUTO = {
  forca: "forca",
  destreza: "destreza",
  constituicao: "constituicao",
  ciencia: "inteligencia",
  intelecto: "sabedoria",
  comunicacao: "carisma",
};

/** Nome de exibição dos dois lados, para a prosa da ficha citar ambos. */
export const NOME_SD = {
  forca: "Força", destreza: "Destreza", constituicao: "Constituição",
  ciencia: "Ciência", intelecto: "Intelecto", comunicacao: "Comunicação",
};
export const NOME_OD2 = {
  forca: "Força", destreza: "Destreza", constituicao: "Constituição",
  ciencia: "Inteligência", intelecto: "Sabedoria", comunicacao: "Carisma",
};

/**
 * "Comunicação (Carisma no OD2)" — sempre os dois nomes na primeira menção.
 *
 * Quem lê a ficha tem o livro do Space Dragon na mão e a ficha do OD2 na tela.
 * Citar só um dos nomes obriga a pessoa a fazer a tradução de cabeça, que é
 * exatamente o que este módulo existe para evitar.
 */
export const par = (sd) =>
  `<strong>${NOME_SD[sd]}</strong> <em>(${NOME_OD2[sd]} no OD2)</em>`;

// ── OS MODIFICADORES TAMBÉM MUDAM ───────────────────────────────────────────
//
// A tabela nativa do Space Dragon vai de 1 a 29 em faixas de dois, com a faixa
// neutra em 10-11. O guia ajusta para a escala do OD2 (Tabela 1.2), com a faixa
// neutra em 9-12 — mas mantém as faixas acima de 20, que o OD2 não tem.
//
// A ficha do OD2 calcula pelo modificador DELA. Nos valores de 1 e de 21 para
// cima os dois discordam, e aí o número exibido está errado para Space Dragon.
// É limitação conhecida e está escrita no journal.
export const MODIFICADOR_CONVERTIDO = [
  { de: 1, ate: 1, mod: -4 },
  { de: 2, ate: 3, mod: -3 },
  { de: 4, ate: 5, mod: -2 },
  { de: 6, ate: 8, mod: -1 },
  { de: 9, ate: 12, mod: 0 },
  { de: 13, ate: 14, mod: +1 },
  { de: 15, ate: 16, mod: +2 },
  { de: 17, ate: 18, mod: +3 },
  { de: 19, ate: 20, mod: +4 },
  { de: 21, ate: 22, mod: +5 },
  { de: 23, ate: 24, mod: +6 },
  { de: 25, ate: 26, mod: +7 },
  { de: 27, ate: 29, mod: +8 },
];

/** Onde os dois sistemas discordam do valor exibido pela ficha do OD2. */
export const DIVERGE_DA_FICHA = [1, 21, 22, 23, 24, 25, 26, 27, 28, 29];
