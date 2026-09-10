/**
 * Os testes de porcentagem do Livro Básico Aprimorado.
 *
 * ── A REGRA ─────────────────────────────────────────────────────────────────
 *
 * Rola 1d100 e passa com MENOR OU IGUAL ao alvo. É o inverso do d20 do Old
 * Dragon 2, onde se quer o número alto, e é por isso que o sistema não tem como
 * rolar isto sozinho: não é uma fórmula diferente, é uma comparação diferente.
 *
 * ── DE ONDE SAI O ALVO ──────────────────────────────────────────────────────
 *
 *   `base`   a porcentagem da tabela da classe, pelo NÍVEL. Dois testes não vêm
 *            de classe nenhuma — realizar poder mental e clonagem saem direto
 *            da tabela do atributo, e aí a base é ela.
 *   `ajuste` a coluna da tabela do ATRIBUTO, que soma ou subtrai.
 *
 * ── A FONTE É O *LIVRO BÁSICO APRIMORADO* ───────────────────────────────────
 *
 * 245 páginas, o PDF em `Documents/Ekhoria/20 Space Dragon/_regras`. Existe uma
 * edição anterior de 197 páginas chamada "Módulo Básico" que reescreve metade
 * disto — lá a classe é "Homem Espacial", a T1-2 tem três colunas e os talentos
 * de gatuno são oito. NÃO É A FONTE DESTE MÓDULO, e conferir contra ela já
 * custou uma versão inteira de regressões.
 *
 * O jeito rápido de saber qual PDF está aberto: o Aprimorado diz
 * "cosmonauta", "furtividade" e "aptidão tecnológica"; o antigo diz
 * "homem espacial", "esgueirar-se" e "crédito tecnológico".
 *
 * ── O QUE NÃO É TESTE DE PORCENTAGEM ────────────────────────────────────────
 *
 *   · Percepção é 1d6, e passa dentro de uma FAIXA ("1-2" até "1-5").
 *   · Desativar robôs é 1d20 contra a T3-2, pelo nível do disruptor, e o
 *     resultado precisa ser MAIOR ou igual. Depende do Capítulo 8, que o
 *     módulo ainda não tem.
 *   · Ataque furtivo e dano crítico são multiplicadores, não chances.
 *   · Alcance mental é orçamento diário: usar um poder desconta um percentual
 *     igual à grandeza dele.
 */

export const TESTES = [
  // ── Cientista ──
  {
    chave: "operar-maquinas",
    nome: "Operar e consertar máquinas",
    classe: "Cientista",
    base: { tabela: "CIENTISTA", coluna: "operarMaquinas" },
    ajuste: null,
    nota: "Máquinas avariadas precisam ser consertadas antes de ficarem operáveis. Serve para pilotar naves, mas o cosmonauta faz isso melhor.",
  },

  // ── Cosmonauta ──
  {
    chave: "pilotar-naves",
    nome: "Pilotar naves",
    classe: "Cosmonauta",
    base: { tabela: "COSMONAUTA", coluna: "pilotarNaves" },
    ajuste: null,
    nota: "Falhar não é bater: é encontrar dificuldade de pilotagem, ou se perder no caminho.",
  },
  {
    chave: "desarmar",
    nome: "Desarmar",
    classe: "Cosmonauta",
    base: { tabela: "COSMONAUTA", coluna: "desarmarSubjugar" },
    ajuste: { atributo: "destreza", coluna: "furtividade" },
    nota: "Custa um ataque, ou os dois. O adversário precisa ser desarmado antes de ser subjugado.",
  },
  {
    chave: "subjugar",
    nome: "Subjugar",
    classe: "Cosmonauta",
    base: { tabela: "COSMONAUTA", coluna: "desarmarSubjugar" },
    ajuste: { atributo: "forca", coluna: "subjugar" },
    nota: "Mesma porcentagem de tabela que desarmar — o que muda é o atributo que ajusta.",
  },

  // ── Gatuno ──
  {
    chave: "sabotagem",
    nome: "Sabotagem",
    classe: "Gatuno",
    base: { tabela: "TALENTOSGATUNO", coluna: "sabotagem" },
    ajuste: { atributo: "ciencia", coluna: "aptidao" },
    nota: "Destranca portas ou avaria máquinas. Um uso por porta ou máquina, e só com os instrumentos. O dado ao lado da porcentagem é quantas RODADAS a sabotagem leva.",
  },
  {
    chave: "escalar",
    nome: "Escalar",
    classe: "Gatuno",
    base: { tabela: "TALENTOSGATUNO", coluna: "escalar" },
    ajuste: null,
    nota: "Cada sucesso vale 3 metros. Falhar derruba, com 1d6 por 3 metros já subidos — a queda da primeira jogada não machuca.",
  },
  {
    chave: "furtividade",
    nome: "Furtividade",
    classe: "Gatuno",
    base: { tabela: "TALENTOSGATUNO", coluna: "furtividade" },
    ajuste: { atributo: "destreza", coluna: "furtividade" },
    segredo: true,
    nota: "Esconder-se ou mover-se em silêncio. No movimento furtivo o livro manda o MESTRE rolar: o gatuno acha que passou até algo provar o contrário.",
  },
  {
    chave: "furtar",
    nome: "Furtar",
    classe: "Gatuno",
    base: { tabela: "TALENTOSGATUNO", coluna: "furtar" },
    ajuste: { atributo: "destreza", coluna: "furtividade" },
    nota: "Tirar o DOBRO do alvo ou mais faz todo mundo em volta perceber, inclusive a vítima.",
  },
  {
    chave: "percepcao",
    nome: "Percepção",
    classe: "Gatuno",
    dado: "1d6",
    base: { tabela: "TALENTOSGATUNO", coluna: "percepcao" },
    ajuste: null,
    nota: "Não é porcentagem: 1d6, e passa se cair dentro da faixa do nível.",
  },

  // ── Mentálico ──
  {
    chave: "realizar-poder",
    nome: "Realizar e aprender poder mental",
    classe: "Mentálico",
    base: { atributo: "intelecto", coluna: "poderMental" },
    ajuste: null,
    nota: "A chance sai INTEIRA do Intelecto, pela T1-4 — a tabela da classe não entra. O que a classe dá é o alcance mental diário, que é orçamento, não rolagem.",
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
