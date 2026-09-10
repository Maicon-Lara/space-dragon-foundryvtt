// GERADO POR tools/gera-dados.mjs — NÃO EDITAR À MÃO.
//
// Fonte: tools/data/atributos.mjs, progressao.mjs, testes.mjs.
// Regenerado a cada `npm run build`.

/** Faixas de valor de atributo, [mínimo, máximo]. Iguais nas seis tabelas. */
export const FAIXAS = [
  [
    1,
    1
  ],
  [
    2,
    3
  ],
  [
    4,
    5
  ],
  [
    6,
    7
  ],
  [
    8,
    9
  ],
  [
    10,
    11
  ],
  [
    12,
    13
  ],
  [
    14,
    15
  ],
  [
    16,
    17
  ],
  [
    18,
    19
  ],
  [
    20,
    21
  ],
  [
    22,
    23
  ],
  [
    24,
    25
  ],
  [
    26,
    27
  ],
  [
    28,
    29
  ]
];

/** Onde cada atributo do Space Dragon é anotado na ficha do Old Dragon 2. */
export const CAMPO_NA_FICHA = {
  "forca": "forca",
  "destreza": "destreza",
  "constituicao": "constituicao",
  "ciencia": "inteligencia",
  "intelecto": "sabedoria",
  "comunicacao": "carisma"
};
export const NOME_ATRIBUTO = {
  "forca": "Força",
  "destreza": "Destreza",
  "constituicao": "Constituição",
  "ciencia": "Ciência",
  "intelecto": "Intelecto",
  "comunicacao": "Comunicação"
};
export const SIGLA = {
  "forca": "FOR",
  "destreza": "DES",
  "constituicao": "CON",
  "intelecto": "INT",
  "ciencia": "CIE",
  "comunicacao": "COM"
};

/** Colunas de progressão de classe, indexadas por nível − 1. */
export const PROGRESSAO = {
  "CIENTISTA": {
    "operarMaquinas": [
      "80%",
      "81%",
      "82%",
      "83%",
      "84%",
      "85%",
      "86%",
      "87%",
      "88%",
      "89%",
      "90%",
      "91%",
      "92%",
      "93%",
      "94%",
      "95%",
      "96%",
      "97%",
      "98%",
      "99%"
    ]
  },
  "COSMONAUTA": {
    "pilotarNaves": [
      "80%",
      "81%",
      "82%",
      "83%",
      "84%",
      "85%",
      "86%",
      "87%",
      "88%",
      "89%",
      "90%",
      "91%",
      "92%",
      "93%",
      "94%",
      "95%",
      "96%",
      "97%",
      "98%",
      "99%"
    ],
    "desarmarSubjugar": [
      "20%",
      "25%",
      "30%",
      "35%",
      "40%",
      "45%",
      "50%",
      "55%",
      "60%",
      "65%",
      "70%",
      "72%",
      "74%",
      "76%",
      "78%",
      "80%",
      "82%",
      "84%",
      "86%",
      "88%"
    ]
  },
  "TALENTOSGATUNO": {
    "sabotagem": [
      "15% / 1d8",
      "20% / 1d8",
      "25% / 1d8",
      "30% / 1d8",
      "35% / 1d8",
      "40% / 1d6",
      "45% / 1d6",
      "50% / 1d6",
      "55% / 1d6",
      "60% / 1d6",
      "62% / 1d4",
      "64% / 1d4",
      "66% / 1d4",
      "68% / 1d4",
      "70% / 1d4",
      "72% / 1",
      "74% / 1",
      "76% / 1",
      "78% / 1",
      "80% / 1"
    ],
    "escalar": [
      "80%",
      "81%",
      "82%",
      "83%",
      "84%",
      "85%",
      "86%",
      "87%",
      "88%",
      "89%",
      "90%",
      "91%",
      "92%",
      "93%",
      "94%",
      "95%",
      "96%",
      "97%",
      "98%",
      "99%"
    ],
    "furtividade": [
      "20%",
      "25%",
      "30%",
      "35%",
      "40%",
      "45%",
      "50%",
      "55%",
      "60%",
      "65%",
      "70%",
      "72%",
      "74%",
      "76%",
      "78%",
      "80%",
      "82%",
      "84%",
      "86%",
      "88%"
    ],
    "furtar": [
      "20%",
      "25%",
      "30%",
      "35%",
      "40%",
      "45%",
      "50%",
      "55%",
      "60%",
      "65%",
      "70%",
      "72%",
      "74%",
      "76%",
      "78%",
      "80%",
      "82%",
      "84%",
      "86%",
      "88%"
    ],
    "percepcao": [
      "1-2",
      "1-2",
      "1-2",
      "1-2",
      "1-3",
      "1-3",
      "1-3",
      "1-3",
      "1-3",
      "1-4",
      "1-4",
      "1-4",
      "1-4",
      "1-4",
      "1-4",
      "1-5",
      "1-5",
      "1-5",
      "1-5",
      "1-5"
    ]
  }
};

/** Colunas de tabela de atributo, indexadas pela faixa. */
export const ATRIBUTO = {
  "destreza": {
    "furtividade": [
      -25,
      -20,
      -15,
      -10,
      -5,
      0,
      5,
      10,
      15,
      20,
      25,
      30,
      35,
      40,
      45
    ]
  },
  "forca": {
    "subjugar": [
      -25,
      -20,
      -15,
      -10,
      -5,
      0,
      5,
      10,
      15,
      20,
      25,
      30,
      35,
      40,
      45
    ]
  },
  "ciencia": {
    "aptidao": [
      -25,
      -20,
      -15,
      -10,
      -5,
      0,
      5,
      10,
      15,
      20,
      25,
      30,
      35,
      40,
      45
    ]
  },
  "intelecto": {
    "poderMental": [
      0,
      0,
      0,
      0,
      0,
      15,
      25,
      35,
      45,
      55,
      65,
      75,
      85,
      95,
      100
    ]
  },
  "constituicao": {
    "clonagem": [
      0,
      0,
      0,
      1,
      10,
      25,
      50,
      75,
      95,
      100,
      100,
      100,
      100,
      100,
      100
    ]
  }
};

/** O cabeçalho que o livro dá a cada coluna de atributo usada num teste. */
export const ROTULO_COLUNA = {
  "destreza.furtividade": "Furtividade, Furtar e Desarmar",
  "forca.subjugar": "Subjugar",
  "ciencia.aptidao": "Aptidão Tecnológica",
  "intelecto.poderMental": "Realizar e Aprender Poder Mental",
  "constituicao.clonagem": "Probabilidade de Clonagem"
};

export const TESTES = [
  {
    "chave": "operar-maquinas",
    "nome": "Operar e consertar máquinas",
    "classe": "Cientista",
    "base": {
      "tabela": "CIENTISTA",
      "coluna": "operarMaquinas"
    },
    "ajuste": null,
    "nota": "Máquinas avariadas precisam ser consertadas antes de ficarem operáveis. Serve para pilotar naves, mas o cosmonauta faz isso melhor."
  },
  {
    "chave": "pilotar-naves",
    "nome": "Pilotar naves",
    "classe": "Cosmonauta",
    "base": {
      "tabela": "COSMONAUTA",
      "coluna": "pilotarNaves"
    },
    "ajuste": null,
    "nota": "Falhar não é bater: é encontrar dificuldade de pilotagem, ou se perder no caminho."
  },
  {
    "chave": "desarmar",
    "nome": "Desarmar",
    "classe": "Cosmonauta",
    "base": {
      "tabela": "COSMONAUTA",
      "coluna": "desarmarSubjugar"
    },
    "ajuste": {
      "atributo": "destreza",
      "coluna": "furtividade"
    },
    "nota": "Custa um ataque, ou os dois. O adversário precisa ser desarmado antes de ser subjugado."
  },
  {
    "chave": "subjugar",
    "nome": "Subjugar",
    "classe": "Cosmonauta",
    "base": {
      "tabela": "COSMONAUTA",
      "coluna": "desarmarSubjugar"
    },
    "ajuste": {
      "atributo": "forca",
      "coluna": "subjugar"
    },
    "nota": "Mesma porcentagem de tabela que desarmar — o que muda é o atributo que ajusta."
  },
  {
    "chave": "sabotagem",
    "nome": "Sabotagem",
    "classe": "Gatuno",
    "base": {
      "tabela": "TALENTOSGATUNO",
      "coluna": "sabotagem"
    },
    "ajuste": {
      "atributo": "ciencia",
      "coluna": "aptidao"
    },
    "nota": "Destranca portas ou avaria máquinas. Um uso por porta ou máquina, e só com os instrumentos. O dado ao lado da porcentagem é quantas RODADAS a sabotagem leva."
  },
  {
    "chave": "escalar",
    "nome": "Escalar",
    "classe": "Gatuno",
    "base": {
      "tabela": "TALENTOSGATUNO",
      "coluna": "escalar"
    },
    "ajuste": null,
    "nota": "Cada sucesso vale 3 metros. Falhar derruba, com 1d6 por 3 metros já subidos — a queda da primeira jogada não machuca."
  },
  {
    "chave": "furtividade",
    "nome": "Furtividade",
    "classe": "Gatuno",
    "base": {
      "tabela": "TALENTOSGATUNO",
      "coluna": "furtividade"
    },
    "ajuste": {
      "atributo": "destreza",
      "coluna": "furtividade"
    },
    "segredo": true,
    "nota": "Esconder-se ou mover-se em silêncio. No movimento furtivo o livro manda o MESTRE rolar: o gatuno acha que passou até algo provar o contrário."
  },
  {
    "chave": "furtar",
    "nome": "Furtar",
    "classe": "Gatuno",
    "base": {
      "tabela": "TALENTOSGATUNO",
      "coluna": "furtar"
    },
    "ajuste": {
      "atributo": "destreza",
      "coluna": "furtividade"
    },
    "nota": "Tirar o DOBRO do alvo ou mais faz todo mundo em volta perceber, inclusive a vítima."
  },
  {
    "chave": "percepcao",
    "nome": "Percepção",
    "classe": "Gatuno",
    "dado": "1d6",
    "base": {
      "tabela": "TALENTOSGATUNO",
      "coluna": "percepcao"
    },
    "ajuste": null,
    "nota": "Não é porcentagem: 1d6, e passa se cair dentro da faixa do nível."
  },
  {
    "chave": "realizar-poder",
    "nome": "Realizar e aprender poder mental",
    "classe": "Mentálico",
    "base": {
      "atributo": "intelecto",
      "coluna": "poderMental"
    },
    "ajuste": null,
    "nota": "A chance sai INTEIRA do Intelecto, pela T1-4 — a tabela da classe não entra. O que a classe dá é o alcance mental diário, que é orçamento, não rolagem."
  },
  {
    "chave": "clonagem",
    "nome": "Clonagem",
    "classe": null,
    "base": {
      "atributo": "constituicao",
      "coluna": "clonagem"
    },
    "ajuste": null,
    "nota": "A chance de a clonagem do personagem dar certo. Sai da Constituição, e vale para qualquer classe."
  }
];
