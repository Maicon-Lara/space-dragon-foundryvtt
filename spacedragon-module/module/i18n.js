/**
 * Os textos que o jogador vê, pelo `lang` do Foundry.
 *
 * ── O QUE PASSA POR AQUI ────────────────────────────────────────────────────
 *
 * Avisos (`ui.notifications`), títulos e botões de janela, e os nomes das
 * fichas no seletor. As OPÇÕES de mundo não precisam: `game.settings.register`
 * recebe a chave em `name` e `hint` e o próprio Foundry a traduz.
 *
 * O que NÃO passa: o `console`, que é para quem depura, e os textos das
 * regras, que são o livro e moram nos compêndios.
 *
 * ── FORA DO FOUNDRY ─────────────────────────────────────────────────────────
 *
 * Nos testes em Node não há `game.i18n`, e `t()` devolve a própria chave. O
 * teste de fumaça, que sobe o módulo inteiro, carrega o lang/pt-BR.json e
 * traduz de verdade — e tools/teste-lang.mjs confere que toda chave usada no
 * código existe no arquivo, para um texto nunca sair como
 * "spacedragon.aviso.algumaCoisa" na tela.
 *
 * Os marcadores de `format` são os do Foundry: `{nome}`.
 */

/**
 * Traduz `chave`; com `dados`, preenche os marcadores (`game.i18n.format`).
 * Sem `game.i18n` (Node), devolve a chave.
 */
export function t(chave, dados) {
  const i18n = globalThis.game?.i18n;
  if (!i18n?.localize) return chave;
  return dados ? i18n.format(chave, dados) : i18n.localize(chave);
}
