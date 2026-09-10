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

import { TABELAS, FAIXAS, ROTULOS } from "./data/atributos.mjs";
import { CIENTISTA, COSMONAUTA, GATUNO, MENTALICO, TALENTOSGATUNO } from "./data/progressao.mjs";
import { TESTES } from "./data/testes.mjs";
import { CAMPO_NA_FICHA, NOME } from "./data/onde-anotar.mjs";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const DESTINO = path.resolve(AQUI, "..", "spacedragon-module", "module", "dados.js");

const PROGRESSOES = { CIENTISTA, COSMONAUTA, GATUNO, MENTALICO, TALENTOSGATUNO };

/** Só as colunas que algum teste usa. O resto seria peso morto no cliente. */
function enxuga() {
  const prog = {};
  const attr = {};

  // Colunas que o cliente usa fora dos testes: o dado de vida por nível e o
  // multiplicador de crítico do Cosmonauta.
  const EXTRA = {
    CIENTISTA: ["dv"], COSMONAUTA: ["dv", "danoCritico"],
    GATUNO: ["dv"], MENTALICO: ["dv"],
  };
  for (const [tabela, colunas] of Object.entries(EXTRA)) {
    prog[tabela] ??= {};
    for (const c of colunas) prog[tabela][c] = PROGRESSOES[tabela].map((l) => l[c]);
  }
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

// A caixa derivada de cada atributo, na ordem das quinze faixas.
const DERIVADA = {
  forca: "ataque",              // ajuste de ataque e dano corpo a corpo
  destreza: "ataque",           // ajuste de ataque à distância e proteção
  constituicao: "pv",           // ajuste de pontos de vida e proteção
  intelecto: "protecaoMental",
  ciencia: "aptidao",           // porcentagem
  comunicacao: "reacao",        // porcentagem
};
const derivadas = Object.fromEntries(
  Object.entries(DERIVADA).map(([a, c]) => [a, TABELAS[a].map((l) => l[c])])
);

// Colunas de atributo que a ficha usa fora das caixas derivadas.
const OUTRAS = { "constituicao.mortais": TABELAS.constituicao.map((l) => l.mortais) };

// O cabeçalho que o Aprimorado dá a cada coluna usada num teste.
const ROTULO_COLUNA = {
  "forca.subjugar": "Subjugar",
  "destreza.furtividade": "Furtividade, Furtar e Desarmar",
  "constituicao.clonagem": "Probabilidade de Clonagem",
  "intelecto.poderMental": "Realizar e Aprender Poder Mental",
  "ciencia.aptidao": "Aptidão Tecnológica",
};
const rotulos = {};
for (const t of TESTES) {
  for (const f of [t.base, t.ajuste]) {
    if (f?.atributo) rotulos[`${f.atributo}.${f.coluna}`] = ROTULO_COLUNA[`${f.atributo}.${f.coluna}`] ?? f.coluna;
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

/**
 * A coluna que vira o "modificador" de cada atributo na ficha.
 *
 * A ficha do Old Dragon 2 tem uma caixa derivada por atributo, e a ficha
 * oficial do Space Dragon também. Estas são as colunas que casam uma a uma.
 * As duas últimas são PORCENTAGEM, não modificador de d20.
 */
export const COLUNA_DERIVADA = ${j(derivadas)};

/**
 * Colunas de atributo que a ficha mostra fora das caixas derivadas.
 *
 * A chave "constituicao.mortais" é com quantos pontos de vida NEGATIVOS o personagem
 * morre — de −5 com Constituição 1 a −19 com 28–29. Não existe no Old Dragon 2,
 * onde a morte é sempre em −10 fixo.
 */
export const COLUNA = ${j(OUTRAS)};
`);
console.log(`  ✔ module/dados.js: ${TESTES.length} testes, ${Object.keys(prog).length} progressões`);
