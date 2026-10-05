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

function aplicar(ligado) {
  document.body?.classList.toggle(CLASSE, !!ligado);
}

function aplicarContraste(ligado) {
  document.body?.classList.toggle(CLASSE_CONTRASTE, !!ligado);
}

export function registrarTema() {
  registrarContraste();
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
      "Desligue se o seu Foundry já está em tema claro.",
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
    onChange: aplicarContraste,
  });
}

export function ligarTema() {
  aplicarContraste(game.settings.get(ID, "contraste"));
  aplicar(game.settings.get(ID, "tema"));
  console.log(`${ID} | tema ${game.settings.get(ID, "tema") ? "ligado" : "desligado"}`);
}
