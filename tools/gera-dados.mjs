/**
 * Gera `spacedragon-module/module/dados.js` a partir de tools/data.
 *
 * O script do módulo roda no navegador e não tem como importar tools/data. Ou
 * as tabelas são copiadas à mão para lá — e passam a divergir na primeira
 * correção —, ou saem daqui. Saem daqui.
 *
 * Este arquivo é ARTEFATO. Editar dados.js à mão é perder o trabalho no build.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { TABELAS, FAIXAS, ROTULOS, rotuloColuna } from "./data/atributos.mjs";
import { CIENTISTA, HOMEM_ESPACIAL, GATUNO, MENTALICO, TALENTOSGATUNO } from "./data/progressao.mjs";
import { TESTES } from "./data/testes.mjs";
import { CAMPO_NA_FICHA, NOME } from "./data/onde-anotar.mjs";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const DESTINO = path.resolve(AQUI, "..", "spacedragon-module", "module", "dados.js");

const PROGRESSOES = { CIENTISTA, HOMEM_ESPACIAL, GATUNO, MENTALICO, TALENTOSGATUNO };

/** Só as colunas que algum teste usa. O resto seria peso morto no cliente. */
function enxuga() {
  const prog = {};
  const attr = {};
  for (const t of TESTES) {
    for (const f of [t.base, t.ajuste]) {
      if (!f) continue;
      if (f.tabela) {
        prog[f.tabela] ??= {};
        prog[f.tabela][f.coluna] = PROGRESSOES[f.tabela].map((l) => l[f.coluna]);
      } else {
        attr[f.atributo] ??= {};
        attr[f.atributo][f.coluna] = TABELAS[f.atributo].map((l) => l[f.coluna]);
      }
    }
  }
  return { prog, attr };
}

const { prog, attr } = enxuga();

const rotulos = {};
for (const t of TESTES) {
  for (const f of [t.base, t.ajuste]) {
    if (f?.atributo) rotulos[`${f.atributo}.${f.coluna}`] = rotuloColuna(f.coluna, f.atributo);
  }
}

const j = (x) => JSON.stringify(x, null, 2);

fs.writeFileSync(DESTINO, `// GERADO POR tools/gera-dados.mjs — NÃO EDITAR À MÃO.
//
// Fonte: tools/data/atributos.mjs, progressao.mjs, testes.mjs.
// Regenerado a cada \`npm run build\`.

/** Faixas de valor de atributo, [mínimo, máximo]. Iguais nas seis tabelas. */
export const FAIXAS = ${j(FAIXAS)};

/** Onde cada atributo do Space Dragon é anotado na ficha do Old Dragon 2. */
export const CAMPO_NA_FICHA = ${j(CAMPO_NA_FICHA)};
export const NOME_ATRIBUTO = ${j(NOME)};
export const SIGLA = ${j(Object.fromEntries(Object.entries(ROTULOS).map(([k, v]) => [k, v.sigla])))};

/** Colunas de progressão de classe, indexadas por nível − 1. */
export const PROGRESSAO = ${j(prog)};

/** Colunas de tabela de atributo, indexadas pela faixa. */
export const ATRIBUTO = ${j(attr)};

/** O cabeçalho que o livro dá a cada coluna de atributo usada num teste. */
export const ROTULO_COLUNA = ${j(rotulos)};

export const TESTES = ${j(TESTES)};
`);
console.log(`  ✔ module/dados.js: ${TESTES.length} testes, ${Object.keys(prog).length} progressões`);
