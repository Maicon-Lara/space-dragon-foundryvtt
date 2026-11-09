/**
 * O que cada aparato, poder mental e ataque especial faz, para a automação.
 *
 * Consultado pelo NOME do item, e não por uma marca no item: os itens que já
 * estão nas fichas funcionam sem ser arrastados de novo do compêndio.
 *
 * Tudo aqui vem do texto do livro. O que depende de decisão do Mestre (quem
 * "desiste", o que se lembra, onde cai) fica de fora, ou fica como `nota`.
 *
 * Campos de uma entrada:
 *   ataque   "bac" ou "bad": rola contra o CP de cada alvo;
 *   ataques  quantos disparos (padrão 1);
 *   bonusAtaque  somado à BA (o bônus de ataque da arma);
 *   dano     fórmula em PV, rolada uma vez para todos os alvos;
 *   cura     fórmula em PV, sem passar do máximo;
 *   dreno    { chave, formula }: perda de atributo (o dano mental é dreno de
 *            Intelecto, anotado no campo Sabedoria da ficha);
 *   jp       "jpr", "jpf" ou "jpm", feita pelo alvo;
 *   aoPassar "metade" ou "anula";
 *   efeito   { nome, descricao, mods, segundos, porNivel, segundosRolar };
 *   proprio  o efeito é no próprio usuário;
 *   custo    { formula }: dano mental em quem usa;
 *   modos    [{ rotulo, ...campos }], escolhidos numa janela;
 *   pedir    { rotulo, padrao, min, max }: valor {n} usado nas fórmulas.
 *
 * Nas fórmulas: {n} (o valor pedido), {des} (modificador de Destreza) e
 * {nivel4} (1 a cada 4 níveis completos, no mínimo 1).
 */

/** Penalidade em "qualquer rolagem": ataques e as três JP. */
export const emTodasAsRolagens = (valor) =>
  ["attack", "jpd", "jpc", "jps"].map((key) => ({ key, value: valor }));

const IMOBILIZADO = "Não pode agir nem se mover.";

export const AUTOMACAO_DE_ITENS = {
  /* ── Aparatos ─────────────────────────────────────────────────────────── */
  "cortador laser": { ataque: "bac", dano: "1d4+{des}" },
  "luvas de inducao eletrica": {
    modos: [
      { rotulo: "Toque (corpo a corpo, 1d6)", ataque: "bac", dano: "1d6" },
      { rotulo: "Descarga (à distância, 1d4)", ataque: "bad", dano: "1d4" },
    ],
  },
  "metralhadora energetica": { ataque: "bad", ataques: 4, dano: "1d10", nota: "Usada por duas rodadas seguidas, precisa esfriar por 30 segundos." },
  "pistola de repeticao": { ataque: "bad", dano: "2d6" },
  "canhao de fotons": {
    jp: "jpr", aoPassar: "metade", area: "10 m²",
    modos: [
      { rotulo: "Sem carregar (2d10)", dano: "2d10" },
      { rotulo: "Carregado 1 rodada (2d12)", dano: "2d12" },
      { rotulo: "Carregado 2 rodadas (4d8)", dano: "4d8" },
    ],
  },
  "explosivo remotamente controlado": {
    jp: "jpr", aoPassar: "metade", area: "20 m²", dano: "{n}d12",
    pedir: { rotulo: "Dados de dano do explosivo (d12)", padrao: 3, min: 3, max: 20 },
  },
  "lanca-chamas": {
    jp: "jpr", aoPassar: "metade", area: "linha de 10 m",
    modos: [
      { rotulo: "Até 2 m (5d10)", dano: "5d10", nota: "50% de chance de deixar o alvo em chamas: ele sofre o mesmo dano a cada rodada até apagar." },
      { rotulo: "De 2 a 4 m (5d6)", dano: "5d6", nota: "25% de chance de deixar o alvo em chamas: ele sofre o mesmo dano a cada rodada até apagar." },
      { rotulo: "Mais de 4 m (5d4)", dano: "5d4", nota: "10% de chance de deixar o alvo em chamas: ele sofre o mesmo dano a cada rodada até apagar." },
    ],
  },
  "missil teleguiado": { jp: "jpr", aoPassar: "anula", dano: "2d10", nota: "O míssil persegue por 1d4+1 rodadas: repita a JPR a cada rodada." },
  "raio paralisador": {
    ataque: "bad", jp: "jpf", aoPassar: "anula",
    efeito: { nome: "Paralisado", descricao: IMOBILIZADO, segundos: 30 },
    nota: "Criaturas muito maiores que um humano não são afetadas. Duas cargas antes de recarregar.",
  },
  "laco de energia": {
    ataque: "bad",
    efeito: { nome: "Preso no laço", descricao: "Teste de Força para interromper o laço." },
    nota: "O alvo faz um teste de Força para resistir.",
  },
  "injecao de adrenalina": {
    cura: "{n}d4+{n}", pedir: { rotulo: "NT da injeção", padrao: 1, min: 1, max: 10 },
    nota: "Não funciona em androides. Mais de uma injeção por dia pede JPF com −1 cumulativo.",
  },
  "granada de fumaca": {
    area: "20 m²",
    efeito: { nome: "Na fumaça", descricao: "−4 em rolagens de ataque enquanto estiver na área.", mods: [{ key: "attack", value: -4 }] },
  },
  "campo de forca individual": {
    proprio: true,
    efeito: { nome: "Campo de força", descricao: "+4 no CP. Substitui um escudo de energia.", mods: [{ key: "ac", value: 4 }], segundos: 60 },
    nota: "Recarga de 1d4 horas. A cada descarga completa, 5% cumulativos de defeito.",
  },
  "campo de forca coletivo": {
    area: "10 m²",
    efeito: { nome: "Campo de força coletivo", descricao: "+4 no CP dentro da área. Escudos de energia não funcionam nela.", mods: [{ key: "ac", value: 4 }], segundos: 60 },
    nota: "Recarga de 1d8 horas.",
  },

  /* ── Armas de área ────────────────────────────────────────────────────
   * As demais armas não entram aqui: automacaoDeArma as monta pelo próprio
   * item. Estas têm a regra do Dano em Área, que não está nos campos dele. */
  "granada eletrica (1)": { jp: "jpr", aoPassar: "metade", area: "5 m²", dano: "1d8" },
  "granada explosiva (1)": { jp: "jpr", aoPassar: "metade", area: "10 m²", dano: "1d10" },
  "pistola autodestrutiva": {
    modos: [
      { rotulo: "Disparo (1d6)", ataque: "bad", dano: "1d6" },
      { rotulo: "Autodestruição (1d8 em 2 m²)", jp: "jpr", aoPassar: "metade", area: "2 m²", dano: "1d8" },
    ],
  },

  /* ── Poderes mentais ──────────────────────────────────────────────────── */
  "choque mental": {
    jp: "jpm", aoPassar: "anula", dreno: { chave: "sabedoria", formula: "1d4" },
    efeito: { nome: "Atordoado", descricao: "−3 em qualquer rolagem.", mods: emTodasAsRolagens(-3), segundosRolar: "6d10" },
  },
  "dano cerebral": {
    jp: "jpm", aoPassar: "anula", dreno: { chave: "sabedoria", formula: "1d6" },
    efeito: { nome: "Inconsciente (dano cerebral)", descricao: "Desmaia e fica inconsciente por 1d4 dias." },
    nota: "O mesmo poder restaura o dano se o alvo passar na JPM: nesse caso, remova o efeito à mão.",
  },
  "disparo mental": {
    dano: "1d6+{n}*2", pedir: { rotulo: "% extra de alcance mental (+2 de dano por ponto)", padrao: 0, min: 0, max: 5 },
    nota: "O alvo não tem JPM, e o dano é de energia, não mental.",
  },
  "drenar mente": {
    jp: "jpm", aoPassar: "anula", dreno: { chave: "sabedoria", formula: "1d6" },
    nota: "O mentálico soma ao próprio Intelecto os pontos drenados, por 1 hora por nível.",
  },
  "morte cerebral": {
    jp: "jpm", aoPassar: "anula", custo: { formula: "1d6" },
    efeito: { nome: "Morte cerebral", descricao: "O alvo falhou na JPM e morreu." },
  },
  aterrorizar: {
    jp: "jpm", aoPassar: "anula",
    efeito: { nome: "Aterrorizado", descricao: "−2 em todas as rolagens, com chance de largar o que segura.", mods: emTodasAsRolagens(-2), segundos: 30, porNivel: true },
    nota: "Afeta inimigos de até 5 DV. Chance de largar objetos: 5% por nível do mentálico.",
  },
  "atormentar mente": {
    jp: "jpm", aoPassar: "anula",
    efeito: { nome: "Atormentado", descricao: "−8 em quaisquer rolagens.", mods: emTodasAsRolagens(-8), segundos: 5, porNivel: true },
  },
  "campo desestimulante": {
    jp: "jpm", aoPassar: "anula",
    efeito: {
      nome: "Desestimulado", descricao: "−2 em ataques e dano contra o mentálico e seus aliados.",
      mods: [{ key: "attack", value: -2 }, { key: "damage", value: -2 }], segundos: 30, porNivel: true,
    },
  },
  "confundir mente": {
    efeito: { nome: "Confuso", descricao: "Intelecto reduzido em 1/3 e −3 em qualquer rolagem.", mods: emTodasAsRolagens(-3), segundos: 15, porNivel: true },
    nota: "Reduza o Intelecto em 1/3 à mão enquanto durar.",
  },
  enfraquecimento: {
    jp: "jpm", aoPassar: "anula",
    efeito: { nome: "Enfraquecido", descricao: "−2 em Força.", mods: [{ key: "forca", value: -2 }], segundos: 30, porNivel: true },
  },
  "imobilizar pessoa": {
    jp: "jpm", aoPassar: "anula",
    efeito: { nome: "Imobilizado", descricao: IMOBILIZADO, segundos: 30, porNivel: true },
    nota: "Só afeta humanos, com DV até o nível do mentálico.",
  },
  "imobilizar criatura": {
    jp: "jpm", aoPassar: "anula",
    efeito: { nome: "Imobilizado", descricao: IMOBILIZADO, segundos: 30, porNivel: true },
  },
  "provocar sono": {
    efeito: { nome: "Dormindo", descricao: "Dorme pela duração do poder.", segundosRolar: "1d4*60" },
    nota: "Afeta 1d4+1 DV ou níveis a cada 5 níveis do mentálico, começando pelos mais próximos.",
  },
};

/**
 * Os ataques especiais das criaturas: "nome da criatura|ataque". A entrada só
 * vale depois do acerto, que o Mestre já rolou pelo ataque normal.
 */
const AGARRADO = { nome: "Agarrado", descricao: "Preso pela criatura." };
const ARREMESSADO = { nome: "Arremessado", descricao: "Lançado a 1d6 metros de distância." };

export const ESPECIAIS_DE_CRIATURAS = {
  "aranha gigante|ferroada": { jp: "jpf", aoPassar: "anula", dreno: { chave: "constituicao", formula: "1d6" }, rotulo: "Veneno" },
  "lula da areia|tentaculos": { jp: "jpr", aoPassar: "anula", efeito: AGARRADO, rotulo: "Agarrar" },
  "megassauro|mordida": { jp: "jpr", aoPassar: "anula", efeito: AGARRADO, rotulo: "Agarrar", nota: "Preso, o alvo sofre 1d8 por rodada." },
  "tentaculoide|tentaculos": { jp: "jpr", aoPassar: "anula", efeito: AGARRADO, rotulo: "Agarrar", nota: "Preso, o alvo sofre 1d6 por rodada." },
  "mastodonte|ataque com presas": { jp: "jpr", aoPassar: "anula", efeito: ARREMESSADO, rotulo: "Arremesso" },
  "rinoceratops|chifrada": { jp: "jpr", aoPassar: "anula", efeito: ARREMESSADO, rotulo: "Arremesso" },
};

/** A fórmula do campo de dano: "1d10 em 10m²" vira "1d10"; sem dado, "". */
export const danoRolavel = (dano) => String(dano ?? "").match(/^\s*(\d*d\d+(?:\s*[+-]\s*\d+)?)(?![\dd])/i)?.[1]?.replace(/\s+/g, "") ?? "";

/** O nome sem acento, em minúsculas: o jeito de achar um item na tabela. */
export const chaveDoNome = (nome) => String(nome ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "")
  .toLowerCase().trim();
