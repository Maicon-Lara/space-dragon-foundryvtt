/**
 * Os testes de porcentagem do Livro Básico Aprimorado.
 *
 * ── A REGRA, COMO O LIVRO A ESCREVE ─────────────────────────────────────────
 *
 * "Para usar seus talentos, o gatuno deve rolar um dado de porcentagem (2d10
 * com a indicação de dezena e unidade ou 1d100). Se o teste resultar num valor
 * menor ou igual ao valor do talento, o gatuno é bem-sucedido."
 *
 * Vale para todos: rola 1d100, passa com MENOR OU IGUAL ao alvo. É o oposto do
 * d20 do Old Dragon 2, onde se quer o resultado alto.
 *
 * ── DE ONDE SAI O ALVO ──────────────────────────────────────────────────────
 *
 * Duas parcelas, e cada teste diz quais tem:
 *
 *   `base`   a porcentagem da tabela da classe, pelo NÍVEL. Alguns testes não
 *            vêm de classe nenhuma — reproduzir poder mental e clonagem saem
 *            direto da tabela do atributo, e aí a base é ela.
 *   `ajuste` a coluna da tabela do ATRIBUTO, que soma ou subtrai.
 *
 * ── O QUE NÃO É TESTE DE PORCENTAGEM ────────────────────────────────────────
 *
 * Está aqui, marcado com `dado`, porque a mesa procura por ele no mesmo lugar:
 *
 *   · Ouvir barulhos é 1d6, e passa dentro de uma FAIXA ("1-2" até "1-5").
 *   · Desativar robôs é 1d20 contra a T3-2, pelo nível do disruptor, e o
 *     resultado precisa ser MAIOR ou igual. Fica de fora: depende de um
 *     aparato do Capítulo 8, que o módulo ainda não tem.
 *   · Ataque pelas costas e dano crítico são multiplicadores, não chances.
 */

/** Um teste: `base` diz de onde vem a porcentagem, `ajuste` o que soma nela. */
export const TESTES = [
  // ── Cientista ──
  {
    chave: "operar-maquinas",
    nome: "Operar máquinas",
    classe: "Cientista",
    base: { tabela: "CIENTISTA", coluna: "operarMaquinas" },
    ajuste: null,
    nota: "Operar e consertar máquinas. O livro não dá modificador de atributo para este.",
  },

  // ── Homem Espacial ──
  {
    chave: "pilotar-naves",
    nome: "Pilotar naves",
    classe: "Homem Espacial",
    base: { tabela: "HOMEM_ESPACIAL", coluna: "pilotarNaves" },
    ajuste: null,
    nota: "Falhar não é bater: é encontrar dificuldade de pilotagem, ou se perder no caminho.",
  },
  {
    chave: "desarmar",
    nome: "Desarmar",
    classe: "Homem Espacial",
    base: { tabela: "HOMEM_ESPACIAL", coluna: "desarmarSubjugar" },
    ajuste: { atributo: "destreza", coluna: "ocultarFurtarDesarmar" },
    nota: "Custa um ataque, ou os dois. O adversário precisa ser desarmado antes de ser subjugado.",
  },
  {
    chave: "subjugar",
    nome: "Subjugar",
    classe: "Homem Espacial",
    base: { tabela: "HOMEM_ESPACIAL", coluna: "desarmarSubjugar" },
    ajuste: { atributo: "forca", coluna: "subjugar" },
    nota: "Mesma porcentagem de tabela que desarmar — o que muda é o atributo que ajusta.",
  },

  // ── Gatuno ──
  {
    chave: "destrancar-portas",
    nome: "Destrancar portas",
    classe: "Gatuno",
    base: { tabela: "TALENTOSGATUNO", coluna: "destrancarPortas" },
    ajuste: { atributo: "destreza", coluna: "esgueirarDestrancar" },
    nota: "Uma tentativa por porta, e só com os instrumentos em mãos.",
  },
  {
    chave: "localizar-sabotar",
    nome: "Localizar e sabotar máquinas",
    classe: "Gatuno",
    base: { tabela: "TALENTOSGATUNO", coluna: "localizarSabotar" },
    ajuste: { atributo: "ciencia", coluna: "localizarSabotar" },
    nota: "Um uso por máquina, e só com os instrumentos. O talento diz se deu certo, não o quê.",
  },
  {
    chave: "escalar-superficies",
    nome: "Escalar superfícies",
    classe: "Gatuno",
    base: { tabela: "TALENTOSGATUNO", coluna: "escalarSuperficies" },
    ajuste: null,
    nota: "Cada sucesso vale 3 metros. Falhar derruba, com 1d6 por 3 metros já subidos — a queda da primeira jogada não machuca.",
  },
  {
    chave: "esgueirar-se",
    nome: "Esgueirar-se",
    classe: "Gatuno",
    base: { tabela: "TALENTOSGATUNO", coluna: "esgueirarSe" },
    ajuste: { atributo: "destreza", coluna: "esgueirarDestrancar" },
    segredo: true,
    nota: "O livro manda o MESTRE rolar: o gatuno acha que passou até algo provar o contrário.",
  },
  {
    chave: "ocultar-se",
    nome: "Ocultar-se",
    classe: "Gatuno",
    base: { tabela: "TALENTOSGATUNO", coluna: "ocultarSe" },
    ajuste: { atributo: "destreza", coluna: "ocultarFurtarDesarmar" },
    segredo: true,
    nota: "Também é rolagem do Mestre. Escondido, só se move esgueirando-se.",
  },
  {
    chave: "furtar",
    nome: "Furtar",
    classe: "Gatuno",
    base: { tabela: "TALENTOSGATUNO", coluna: "furtar" },
    ajuste: { atributo: "destreza", coluna: "ocultarFurtarDesarmar" },
    nota: "Tirar o DOBRO do alvo ou mais faz todo mundo em volta perceber, inclusive a vítima.",
  },
  {
    chave: "ouvir-barulhos",
    nome: "Ouvir barulhos",
    classe: "Gatuno",
    dado: "1d6",
    base: { tabela: "TALENTOSGATUNO", coluna: "ouvirBarulhos" },
    ajuste: null,
    nota: "Não é porcentagem: 1d6, e passa se cair dentro da faixa do nível.",
  },

  // ── Mentálico ──
  {
    chave: "reproduzir-poder",
    nome: "Reproduzir e aprender poder mental",
    classe: "Mentálico",
    base: { atributo: "intelecto", coluna: "poderMental" },
    ajuste: null,
    nota: "A chance sai INTEIRA do Intelecto — a tabela da classe não entra. O que a classe dá é o alcance mental diário, que é orçamento, não rolagem.",
  },

  // ── Qualquer um ──
  {
    chave: "clonagem",
    nome: "Clonagem",
    classe: null,
    base: { atributo: "constituicao", coluna: "clonagem" },
    ajuste: null,
    nota: "A chance de a clonagem do personagem dar certo. Sai da Constituição, e vale para qualquer classe.",
  },
];

export const porChave = (c) => TESTES.find((t) => t.chave === c);
