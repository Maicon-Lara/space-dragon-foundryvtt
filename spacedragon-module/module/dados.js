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
  "HOMEM_ESPACIAL": {
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
    "destrancarPortas": [
      "15%",
      "20%",
      "25%",
      "30%",
      "35%",
      "40%",
      "45%",
      "50%",
      "55%",
      "60%",
      "62%",
      "64%",
      "66%",
      "68%",
      "70%",
      "72%",
      "74%",
      "76%",
      "78%",
      "80%"
    ],
    "localizarSabotar": [
      "20%",
      "25%",
      "30%",
      "35%",
      "40%",
      "45%",
      "50%",
      "55%",
      "60%",
      "62%",
      "64%",
      "66%",
      "68%",
      "70%",
      "72%",
      "74%",
      "76%",
      "78%",
      "80%",
      "82%"
    ],
    "escalarSuperficies": [
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
    "esgueirarSe": [
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
    "ocultarSe": [
      "10%",
      "15%",
      "20%",
      "25%",
      "30%",
      "35%",
      "40%",
      "45%",
      "50%",
      "55%",
      "60%",
      "62%",
      "64%",
      "66%",
      "68%",
      "70%",
      "72%",
      "74%",
      "76%",
      "78%"
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
    "ouvirBarulhos": [
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
    "ocultarFurtarDesarmar": [
      -25,
      -20,
      -15,
      -10,
      -5,
      0,
      0,
      5,
      10,
      15,
      20,
      25,
      30,
      35,
      40
    ],
    "esgueirarDestrancar": [
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
    "localizarSabotar": [
      -25,
      -20,
      -15,
      -10,
      -5,
      0,
      0,
      0,
      5,
      10,
      15,
      20,
      25,
      30,
      35
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
  "destreza.ocultarFurtarDesarmar": "Ocultar-se, Furtar e Desarmar",
  "forca.subjugar": "Subjugar",
  "destreza.esgueirarDestrancar": "Esgueirar-se e Destrancar Portas",
  "ciencia.localizarSabotar": "Localizar e Sabotar Máquinas",
  "intelecto.poderMental": "Reproduzir e Aprender Poder Mental",
  "constituicao.clonagem": "Probabilidade de Clonagem"
};

export const TESTES = [
  {
    "chave": "operar-maquinas",
    "nome": "Operar máquinas",
    "classe": "Cientista",
    "base": {
      "tabela": "CIENTISTA",
      "coluna": "operarMaquinas"
    },
    "ajuste": null,
    "nota": "Operar e consertar máquinas. O livro não dá modificador de atributo para este."
  },
  {
    "chave": "pilotar-naves",
    "nome": "Pilotar naves",
    "classe": "Homem Espacial",
    "base": {
      "tabela": "HOMEM_ESPACIAL",
      "coluna": "pilotarNaves"
    },
    "ajuste": null,
    "nota": "Falhar não é bater: é encontrar dificuldade de pilotagem, ou se perder no caminho."
  },
  {
    "chave": "desarmar",
    "nome": "Desarmar",
    "classe": "Homem Espacial",
    "base": {
      "tabela": "HOMEM_ESPACIAL",
      "coluna": "desarmarSubjugar"
    },
    "ajuste": {
      "atributo": "destreza",
      "coluna": "ocultarFurtarDesarmar"
    },
    "nota": "Custa um ataque, ou os dois. O adversário precisa ser desarmado antes de ser subjugado."
  },
  {
    "chave": "subjugar",
    "nome": "Subjugar",
    "classe": "Homem Espacial",
    "base": {
      "tabela": "HOMEM_ESPACIAL",
      "coluna": "desarmarSubjugar"
    },
    "ajuste": {
      "atributo": "forca",
      "coluna": "subjugar"
    },
    "nota": "Mesma porcentagem de tabela que desarmar — o que muda é o atributo que ajusta."
  },
  {
    "chave": "destrancar-portas",
    "nome": "Destrancar portas",
    "classe": "Gatuno",
    "base": {
      "tabela": "TALENTOSGATUNO",
      "coluna": "destrancarPortas"
    },
    "ajuste": {
      "atributo": "destreza",
      "coluna": "esgueirarDestrancar"
    },
    "nota": "Uma tentativa por porta, e só com os instrumentos em mãos."
  },
  {
    "chave": "localizar-sabotar",
    "nome": "Localizar e sabotar máquinas",
    "classe": "Gatuno",
    "base": {
      "tabela": "TALENTOSGATUNO",
      "coluna": "localizarSabotar"
    },
    "ajuste": {
      "atributo": "ciencia",
      "coluna": "localizarSabotar"
    },
    "nota": "Um uso por máquina, e só com os instrumentos. O talento diz se deu certo, não o quê."
  },
  {
    "chave": "escalar-superficies",
    "nome": "Escalar superfícies",
    "classe": "Gatuno",
    "base": {
      "tabela": "TALENTOSGATUNO",
      "coluna": "escalarSuperficies"
    },
    "ajuste": null,
    "nota": "Cada sucesso vale 3 metros. Falhar derruba, com 1d6 por 3 metros já subidos — a queda da primeira jogada não machuca."
  },
  {
    "chave": "esgueirar-se",
    "nome": "Esgueirar-se",
    "classe": "Gatuno",
    "base": {
      "tabela": "TALENTOSGATUNO",
      "coluna": "esgueirarSe"
    },
    "ajuste": {
      "atributo": "destreza",
      "coluna": "esgueirarDestrancar"
    },
    "segredo": true,
    "nota": "O livro manda o MESTRE rolar: o gatuno acha que passou até algo provar o contrário."
  },
  {
    "chave": "ocultar-se",
    "nome": "Ocultar-se",
    "classe": "Gatuno",
    "base": {
      "tabela": "TALENTOSGATUNO",
      "coluna": "ocultarSe"
    },
    "ajuste": {
      "atributo": "destreza",
      "coluna": "ocultarFurtarDesarmar"
    },
    "segredo": true,
    "nota": "Também é rolagem do Mestre. Escondido, só se move esgueirando-se."
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
      "coluna": "ocultarFurtarDesarmar"
    },
    "nota": "Tirar o DOBRO do alvo ou mais faz todo mundo em volta perceber, inclusive a vítima."
  },
  {
    "chave": "ouvir-barulhos",
    "nome": "Ouvir barulhos",
    "classe": "Gatuno",
    "dado": "1d6",
    "base": {
      "tabela": "TALENTOSGATUNO",
      "coluna": "ouvirBarulhos"
    },
    "ajuste": null,
    "nota": "Não é porcentagem: 1d6, e passa se cair dentro da faixa do nível."
  },
  {
    "chave": "reproduzir-poder",
    "nome": "Reproduzir e aprender poder mental",
    "classe": "Mentálico",
    "base": {
      "atributo": "intelecto",
      "coluna": "poderMental"
    },
    "ajuste": null,
    "nota": "A chance sai INTEIRA do Intelecto — a tabela da classe não entra. O que a classe dá é o alcance mental diário, que é orçamento, não rolagem."
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
