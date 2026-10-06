/**
 * Liga e desliga o tema visual do Space Dragon.
 *
 * ── POR QUE UMA CLASSE NO <body> ────────────────────────────────────────────
 *
 * Porque não depende de gancho de render nenhum. A alternativa seria marcar
 * cada janela quando ela abre, e aí o tema fica refém de o gancho da ficha
 * disparar — coisa que já falhou neste projeto e no módulo Star Wars.
 *
 * Uma classe no <body> vale para ficha de personagem, de monstro, de ajudante,
 * de item e para o que o sistema criar depois, sem uma linha a mais.
 *
 * ── POR QUE UMA OPÇÃO, E NÃO SEMPRE LIGADO ──────────────────────────────────
 *
 * Repintar a ficha de qualquer mundo que instale o módulo seria decidir pelo
 * outro. Quem quiser só os compêndios desliga aqui e o sistema volta a ser o
 * que era — o CSS inteiro está sob essa classe, então sem ela nada alcança
 * nada.
 */

const ID = "spacedragon";
const CLASSE = "spacedragon-tema";
const CLASSE_CONTRASTE = "spacedragon-contraste";
const CLASSE_CONTRASTE_TOTAL = "spacedragon-contraste-total";

function aplicar(ligado) {
  document.body?.classList.toggle(CLASSE, !!ligado);
}

function aplicarContraste(ligado) {
  document.body?.classList.toggle(CLASSE_CONTRASTE, !!ligado);
}

function aplicarContrasteTotal(ligado) {
  document.body?.classList.toggle(CLASSE_CONTRASTE_TOTAL, !!ligado);
}

export function registrarTema() {
  registrarContraste();
  registrarContrasteTotal();
  game.settings.register(ID, "tema", {
    name: "Tema Space Dragon nas fichas",
    hint:
      "Repinta as fichas do Old Dragon 2 com a paleta do Space Dragon: fundo " +
      "frio no lugar do pergaminho, caixas em azul-lavanda e barras de seção " +
      "em azul-espaço. Desligue para manter a aparência original do sistema.",
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
    // Sem recarregar: a classe sai e o sistema reaparece.
    onChange: aplicar,
  });
}

/**
 * O conserto do texto claro em janela clara.
 *
 * ── O QUE ESTÁ ERRADO, MEDIDO NA MESA ───────────────────────────────────────
 *
 * Com o Foundry em tema ESCURO, as janelas que o sistema marca como CLARAS
 * continuam recebendo a cor de texto do tema escuro. Medido no console, numa
 * ficha de item:
 *
 *   classes: "olddragon2e sheet item themed theme-light"
 *   cor:     rgb(217, 214, 204)   ← a cor do tema ESCURO
 *
 * Sobre o pergaminho do sistema isso dá 1,19:1 de contraste. A WCAG pede 4,5:1
 * para texto normal, e 1,19 é, na prática, texto invisível.
 *
 * Não é um problema deste módulo: atinge qualquer coisa que não declare a
 * própria cor — a ficha de item, o cartão do chat, o botão de um painel. Foi
 * atrás desse sintoma, um lugar de cada vez, que se foram várias correções.
 *
 * ── POR QUE É SEGURO CONSERTAR ──────────────────────────────────────────────
 *
 * Porque a regra só toca janelas que elas mesmas se declaram `theme-light`. Numa
 * janela clara, texto claro é inequivocamente errado — não há leitura em que
 * 1,19:1 seja a intenção de alguém.
 *
 * Quem preferir resolver na origem troca o tema do Foundry para claro, e aí
 * pode desligar isto.
 */
function registrarContraste() {
  game.settings.register(ID, "contraste", {
    name: "Corrigir o texto claro em janelas claras",
    hint:
      "Com o Foundry em tema escuro, as fichas e janelas que o sistema pinta de claro " +
      "continuam com a cor de texto do tema escuro — o que dá 1,19:1 de contraste e deixa " +
      "o texto praticamente invisível. Isto devolve a cor escura nessas janelas. " +
      "Desligue se o seu Foundry já está em tema claro. Vem DESLIGADA: mexer na cor " +
      "de janelas que não são deste módulo é coisa que só se faz a pedido.",
    scope: "client",
    config: true,
    type: Boolean,
    default: false,
    onChange: aplicarContraste,
  });
}

/**
 * O modo de emergência: forçar texto escuro em TODA janela clara.
 *
 * ── POR QUE ELE EXISTE, E POR QUE DÁ MEDO ───────────────────────────────────
 *
 * Com o Foundry em tema escuro, o problema do texto claro em janela clara não
 * atinge só o sistema: atinge os módulos de terceiros que assumem tema claro —
 * os títulos do "Old Dragon 2: Qualidade de Vida", cartões de chat de outros
 * módulos, e o que mais houver.
 *
 * A opção acima (`contraste`) se restringe ao sistema de propósito. Esta NÃO se
 * restringe: ela pinta qualquer janela marcada `theme-light`, de qualquer
 * módulo. É a mesma regra que, numa versão anterior, QUEBROU a interface de uma
 * mesa — ela passa por cima de cores que outros módulos usam de propósito,
 * inclusive as que carregam informação.
 *
 * Por isso ela vem desligada, tem nome de emergência, e o aviso está no texto da
 * opção, não só aqui. Quem a liga assume o risco de olhos abertos, e desliga com
 * um clique se algo ficar estranho.
 *
 * A alternativa sem risco nenhum continua sendo pôr o Foundry em tema claro.
 */
function registrarContrasteTotal() {
  game.settings.register(ID, "contrasteTotal", {
    name: "Emergência: texto escuro em TODA janela clara",
    hint:
      "Força texto escuro em qualquer janela marcada como clara — inclusive as de OUTROS " +
      "módulos, como os títulos do Qualidade de Vida e cartões de chat alheios. ATENÇÃO: " +
      "isto passa por cima de cores que outros módulos usam de propósito, e pode deixar a " +
      "interface estranha. Ligue só se o texto claro em janela clara estiver atrapalhando " +
      "mais; desligue ao primeiro sinal de problema. Sem risco nenhum: pôr o próprio " +
      "Foundry em tema claro.",
    scope: "client",
    config: true,
    type: Boolean,
    default: false,
    onChange: aplicarContrasteTotal,
  });
}

export function ligarTema() {
  aplicarContrasteTotal(game.settings.get(ID, "contrasteTotal"));
  aplicarContraste(game.settings.get(ID, "contraste"));
  aplicar(game.settings.get(ID, "tema"));
  console.log(`${ID} | tema ${game.settings.get(ID, "tema") ? "ligado" : "desligado"}`);
}
