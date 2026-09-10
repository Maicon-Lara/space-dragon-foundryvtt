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
    "dv": [
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "+1 PV",
      "+1 PV",
      "+2 PV",
      "+2 PV",
      "+3 PV",
      "+3 PV",
      "+4 PV",
      "+4 PV",
      "+5 PV",
      "+5 PV",
      "+6 PV"
    ],
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
    "dv": [
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "+2 PV",
      "+2 PV",
      "+4 PV",
      "+4 PV",
      "+5 PV",
      "+5 PV",
      "+6 PV",
      "+6 PV",
      "+7 PV",
      "+7 PV",
      "+8 PV"
    ],
    "danoCritico": [
      "x2",
      "x2",
      "x2",
      "x2",
      "x2",
      "x3",
      "x3",
      "x3",
      "x3",
      "x3",
      "x3",
      "x4",
      "x4",
      "x4",
      "x4",
      "x4",
      "x4",
      "x5",
      "x5",
      "x5"
    ],
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
  "GATUNO": {
    "dv": [
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "+1 PV",
      "+1 PV",
      "+2 PV",
      "+2 PV",
      "+2 PV",
      "+3 PV",
      "+3 PV",
      "+3 PV",
      "+4 PV",
      "+4 PV",
      "+4 PV"
    ]
  },
  "MENTALICO": {
    "dv": [
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "+1 PV",
      "+1 PV",
      "+1 PV",
      "+1 PV",
      "+1 PV",
      "+2 PV",
      "+2 PV",
      "–",
      "–",
      "–",
      "–"
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
  "comunicacao": {
    "reacao": [
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
  "comunicacao.reacao": "reacao",
  "constituicao.clonagem": "Probabilidade de Clonagem"
};

export const TESTES = [
  {
    "chave": "operar-maquinas",
    "habilidade": "Operar Máquinas",
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
    "habilidade": "Pilotar Naves",
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
    "habilidade": "Desarmar e Subjugar",
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
    "habilidade": "Desarmar e Subjugar",
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
    "habilidade": "Talentos de Gatuno",
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
    "habilidade": "Talentos de Gatuno",
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
    "habilidade": "Talentos de Gatuno",
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
    "habilidade": "Talentos de Gatuno",
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
    "habilidade": "Talentos de Gatuno",
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
    "habilidade": "Realizar e Aprender Poder Mental",
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
    "chave": "reacao",
    "habilidade": null,
    "nome": "Reação de criatura inteligente",
    "classe": null,
    "base": {
      "atributo": "comunicacao",
      "coluna": "reacao"
    },
    "ajuste": null,
    "nota": "Some a chance-base da afiliação da criatura no modificador de situação: 70 para leal, 50 para neutro, 30 para rebelde. O teste é POR PERSONAGEM, não um por grupo. Hostilidade pode ser revertida com presentes ou negociação."
  },
  {
    "chave": "clonagem",
    "habilidade": null,
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

/**
 * A coluna que vira o "modificador" de cada atributo na ficha.
 *
 * A ficha do Old Dragon 2 tem uma caixa derivada por atributo, e a ficha
 * oficial do Space Dragon também. Estas são as colunas que casam uma a uma.
 * As duas últimas são PORCENTAGEM, não modificador de d20.
 */
export const COLUNA_DERIVADA = {
  "forca": [
    -5,
    -4,
    -3,
    -2,
    -1,
    0,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9
  ],
  "destreza": [
    -5,
    -4,
    -3,
    -2,
    -1,
    0,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9
  ],
  "constituicao": [
    -5,
    -4,
    -3,
    -2,
    -1,
    0,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9
  ],
  "intelecto": [
    -5,
    -4,
    -3,
    -2,
    -1,
    0,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9
  ],
  "ciencia": [
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
  ],
  "comunicacao": [
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
};

/**
 * Colunas de atributo que a ficha mostra fora das caixas derivadas.
 *
 * A chave "constituicao.mortais" é com quantos pontos de vida NEGATIVOS o personagem
 * morre — de −5 com Constituição 1 a −19 com 28–29. Não existe no Old Dragon 2,
 * onde a morte é sempre em −10 fixo.
 */
export const COLUNA = {
  "constituicao.mortais": [
    -5,
    -6,
    -7,
    -8,
    -9,
    -10,
    -11,
    -12,
    -13,
    -14,
    -15,
    -16,
    -17,
    -18,
    -19
  ]
};

/** T7-4: acertos críticos, em 1d6. */
export const CRITICOS = [
  {
    "d6": 1,
    "efeito": "Acerto em área vital, dano ×2."
  },
  {
    "d6": 2,
    "efeito": "Ferimento: dano ×2 e a movimentação do alvo cai à metade."
  },
  {
    "d6": 3,
    "efeito": "Ferimento: dano ×2 e −2 nos ataques desferidos pelo alvo."
  },
  {
    "d6": 4,
    "efeito": "Vestes avariadas: dano ×2 e −2 no CP."
  },
  {
    "d6": 5,
    "efeito": "Ataque extra contra inimigo ao alcance da arma."
  },
  {
    "d6": 6,
    "efeito": "Morte."
  }
];

/** T7-5: falhas críticas, em 1d6. */
export const FALHAS = [
  {
    "d6": 1,
    "efeito": "Derruba a arma."
  },
  {
    "d6": 2,
    "efeito": "Desequilíbrio: −1 no CP."
  },
  {
    "d6": 3,
    "efeito": "Arma temporariamente danificada."
  },
  {
    "d6": 4,
    "efeito": "Arma permanentemente danificada."
  },
  {
    "d6": 5,
    "efeito": "Atinge um aliado próximo ao alvo."
  },
  {
    "d6": 6,
    "efeito": "Queda: −1 no CP, e uma ação de movimento para se levantar."
  }
];

/** T10-6: críticos e falhas de ESPAÇONAVE. Não são os mesmos da T7-4/T7-5. */
export const CRITICOS_NAVE = [
  {
    "d6": 1,
    "efeito": "Acerto em área crítica, dano ×2."
  },
  {
    "d6": 2,
    "efeito": "Avaria no sistema de propulsão: dano ×2 e a movimentação da nave cai à metade."
  },
  {
    "d6": 3,
    "efeito": "Avaria nas armas: dano ×2 e −5 nos ataques desferidos pela nave alvo."
  },
  {
    "d6": 4,
    "efeito": "Casco avariado: dano ×2 e −5 no CP."
  },
  {
    "d6": 5,
    "efeito": "Ataque extra contra outra nave ao alcance."
  },
  {
    "d6": 6,
    "efeito": "Pane geral na espaçonave."
  }
];
export const FALHAS_NAVE = [
  {
    "d6": 1,
    "efeito": "As armas param de funcionar."
  },
  {
    "d6": 2,
    "efeito": "Perda de controle momentânea: −5 no CP até o próximo turno."
  },
  {
    "d6": 3,
    "efeito": "Arma temporariamente danificada."
  },
  {
    "d6": 4,
    "efeito": "Arma permanentemente danificada."
  },
  {
    "d6": 5,
    "efeito": "Atinge uma nave aliada próxima ao alvo."
  },
  {
    "d6": 6,
    "efeito": "Perda de controle brusca: −10 no CP até o próximo turno, e um teste de pilotagem para retomar o controle."
  }
];
