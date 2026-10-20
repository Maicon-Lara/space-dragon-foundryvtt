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
 * Nos testes em Node não há `game.i18n`, e `t()` usa lang-padrao.js, o
 * pt-BR.json gerado como módulo JS por tools/gera-dados.mjs. tools/teste-lang.mjs
 * confere que os dois batem e que toda chave usada no código existe no
 * arquivo, para um texto nunca sair como "spacedragon.aviso.algumaCoisa".
 *
 * Os marcadores de `format` são os do Foundry: `{nome}`.
 */

/**
 * Traduz `chave`; com `dados`, preenche os marcadores (`game.i18n.format`).
 * Sem `game.i18n` (Node), devolve a chave.
 */
import { LANG_PADRAO } from "./lang-padrao.js";

export function t(chave, dados) {
  const i18n = globalThis.game?.i18n;
  if (i18n?.localize) return dados ? i18n.format(chave, dados) : i18n.localize(chave);
  // Fora do Foundry (os testes em Node): o pt-BR gerado em lang-padrao.js, com
  // o mesmo `{marcador}` do `format`. Assim o teste lê o texto que o jogador
  // lê, e não a chave.
  const texto = LANG_PADRAO[chave] ?? chave;
  return dados ? texto.replace(/\{(\w+)\}/g, (_, c) => String(dados[c] ?? `{${c}}`)) : texto;
}
