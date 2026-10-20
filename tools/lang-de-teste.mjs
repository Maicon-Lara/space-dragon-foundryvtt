/**
 * O lang/pt-BR.json para os testes em Node.
 *
 * O módulo traduz avisos, títulos e nomes de ficha por `t()` (module/i18n.js),
 * que sem `game.i18n` devolve a própria chave. Um teste que lê o TEXTO — o
 * que o jogador vê — precisa do arquivo de idioma de verdade, e é isto que
 * está aqui, com o `format` do Foundry imitado: `{nome}` vira o valor.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
export const CAMINHO_LANG = path.join(AQUI, "..", "spacedragon-module", "lang", "pt-BR.json");

/** O dicionário inteiro, chave → texto. */
export const LANG = JSON.parse(fs.readFileSync(CAMINHO_LANG, "utf8"));

/** Um `game.i18n` de brinquedo, com o mesmo contrato do Foundry. */
export const i18n = {
  localize: (chave) => LANG[chave] ?? chave,
  format: (chave, dados = {}) =>
    (LANG[chave] ?? chave).replace(/\{(\w+)\}/g, (_, c) => String(dados[c] ?? `{${c}}`)),
  has: (chave) => chave in LANG,
};

/** Instala o `game.i18n` de brinquedo, sem derrubar um `game` que o teste já montou. */
export function instalarLang() {
  globalThis.game ??= {};
  globalThis.game.i18n ??= i18n;
  return LANG;
}

/**
 * Num trecho de CÓDIGO-FONTE, acrescenta o texto de cada chave `spacedragon.*`
 * citada — para um teste que lê a fonte continuar enxergando o que o jogador
 * lê, agora que a fonte só tem a chave.
 */
export function comTextos(fonte) {
  const chaves = [...fonte.matchAll(/"(spacedragon\.[\w.]+)"/g)].map((m) => m[1]);
  return fonte + "\n" + chaves.map((c) => LANG[c] ?? "").join("\n");
}
