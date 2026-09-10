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

function aplicar(ligado) {
  document.body?.classList.toggle(CLASSE, !!ligado);
}

export function registrarTema() {
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

export function ligarTema() {
  aplicar(game.settings.get(ID, "tema"));
  console.log(`${ID} | tema ${game.settings.get(ID, "tema") ? "ligado" : "desligado"}`);
}
