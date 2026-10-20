/**
 * Toda chave de idioma usada no código existe no lang/pt-BR.json — e vice-versa.
 *
 * ── POR QUE ISTO EXISTE ─────────────────────────────────────────────────────
 *
 * Um aviso cuja chave não está no arquivo sai na tela como
 * "spacedragon.aviso.algumaCoisa". O Foundry não acusa: `localize` devolve a
 * chave e segue. É um erro que só o jogador vê, e vê no meio da sessão.
 *
 * O caminho inverso também importa: chave no arquivo sem uso no código é
 * texto morto, que alguém um dia "corrige" achando que mudou algo na tela.
 *
 * Confere também os marcadores: se o código passa `{ nome }` ao `t()`, o texto
 * tem de ter `{nome}`, e o texto não pode pedir marcador que o código não dá.
 *
 *     node tools/teste-lang.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LANG } from "./lang-de-teste.mjs";
import { LANG_PADRAO } from "../spacedragon-module/module/lang-padrao.js";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const MOD = path.join(AQUI, "..", "spacedragon-module", "module");

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

const usadas = new Map(); // chave → [arquivo, dados passados ou null]
for (const nome of fs.readdirSync(MOD).filter((n) => n.endsWith(".js"))) {
  const fonte = fs.readFileSync(path.join(MOD, nome), "utf8");

  // toda chamada t("chave"), inclusive a aninhada dentro dos dados de outra
  for (const m of fonte.matchAll(/\btxt\(\s*"(spacedragon\.[\w.]+)"/g)) {
    if (!usadas.has(m[1])) usadas.set(m[1], [nome, null]);
  }
  // t("chave", { a, b: x }): os campos passados, para conferir os marcadores
  for (const m of fonte.matchAll(/\btxt\(\s*"(spacedragon\.[\w.]+)"\s*,\s*\{([^}]*)\}/g)) {
    const campos = m[2].split(",").map((p) => p.trim().split(":")[0].trim()).filter(Boolean);
    usadas.set(m[1], [nome, campos]);
  }
  // name: "chave" / hint: "chave" das opções, que o Foundry traduz sozinho
  for (const m of fonte.matchAll(/\b(?:name|hint):\s*"(spacedragon\.[\w.]+)"/g)) {
    usadas.set(m[1], [nome, null]);
  }
}

confere(usadas.size > 0, "nenhuma chave spacedragon.* encontrada no código — a varredura está cega");

for (const [chave, [arquivo, campos]] of usadas) {
  if (!(chave in LANG)) {
    confere(false, `${arquivo} usa "${chave}", que não está no lang/pt-BR.json`);
    continue;
  }
  const texto = LANG[chave];
  const marcadores = [...texto.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
  if (campos) {
    for (const c of campos) {
      confere(marcadores.includes(c), `${arquivo} passa {${c}} a "${chave}", mas o texto não tem {${c}}`);
    }
    for (const mk of marcadores) {
      confere(campos.includes(mk), `o texto de "${chave}" pede {${mk}}, e ${arquivo} não o passa`);
    }
  } else {
    confere(marcadores.length === 0, `"${chave}" tem marcador {${marcadores[0]}} e é usada sem dados em ${arquivo}`);
  }
}

for (const chave of Object.keys(LANG).filter((k) => k.startsWith("spacedragon."))) {
  confere(usadas.has(chave), `"${chave}" está no lang/pt-BR.json e nenhum arquivo a usa`);
}

// As chaves que não são nossas: só o que ACRESCENTA ao sistema, sem renomear.
for (const chave of Object.keys(LANG).filter((k) => !k.startsWith("spacedragon."))) {
  confere(/^olddragon2e\.(levels\.(1[6-9]|20)|spell_circle\.10)$/.test(chave),
    `"${chave}" renomeia algo do sistema pelo lang — isso é global e colide com outros módulos (ver rotulos.js)`);
}

// lang-padrao.js é cópia gerada do JSON, usada fora do Foundry: se divergir,
// os testes leriam um texto e a mesa outro.
confere(JSON.stringify(LANG_PADRAO) === JSON.stringify(LANG),
  "module/lang-padrao.js não bate com lang/pt-BR.json — rode `node tools/gera-dados.mjs`");

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log(`  ✔ lang: ${usadas.size} chaves usadas no código, todas no pt-BR.json, marcadores batendo, nenhuma chave morta`);
