/**
 * Build do módulo Space Dragon.
 *
 *   tools/data/*.mjs  →  packs-src/*.json  →  LevelDB em spacedragon-module/packs/
 *
 * `packs-src` é fonte de LEITURA, não de verdade: quem manda é tools/data.
 * Editar packs-src à mão é perder o trabalho no próximo build.
 *
 *     npm run build
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compilePack } from "@foundryvtt/foundryvtt-cli";

import {
  folderDoc, raceDoc, raceAbilityDoc, classDoc, classAbilityDoc, journalDoc, rollTableDoc, macroDoc,
  itemUuid, writeSource, aninhaPastas, pintaPastas, makeId, stats,
} from "./lib.mjs";
import { especies } from "./data/especies.mjs";
import { classes } from "./data/classes.mjs";
import { especializacoes } from "./data/especializacoes.mjs";
import { PARES } from "./data/mutacoes.mjs";
import { regras } from "./data/regras.mjs";
import { mutacoesJournal } from "./data/mutacoes-journal.mjs";
import { TESTES } from "./data/testes.mjs";
import { testesJournal } from "./data/testes-journal.mjs";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(AQUI, "..");
const SRC = path.join(ROOT, "packs-src");
const OUT = path.join(ROOT, "spacedragon-module", "packs");

const P_CLASSES = "spacedragon-classes";
const P_ESPECIES = "spacedragon-especies";
const P_TABELAS = "spacedragon-tabelas";
const P_JOURNAL = "spacedragon-journal";
const P_MACROS = "spacedragon-macros";

/** Cor por pasta: sem isso o compêndio vira uma lista cinza indistinguível. */
const PALETA = {
  "Espécies": "#2f5d7c",
  "Classes": "#5a3f7c",
};

// ── Espécies ────────────────────────────────────────────────────────────────
function montaEspecies() {
  const docs = [];
  const pasta = folderDoc("Espécies", "Item", "sd-especies");
  docs.push(pasta);

  especies.forEach((esp, i) => {
    // Mesma razão das classes: as habilidades da espécie ficam junto DELA.
    const sub = folderDoc(`Espécies — ${esp.nome}`, "Item", `sd-especie:${esp.nome}`);
    docs.push(sub);

    const habs = (esp.habilidades ?? []).map((h, j) =>
      raceAbilityDoc(h, sub._id, `sd-race-ab:${esp.nome}`, j));
    docs.push(...habs);
    docs.push({
      ...raceDoc(esp, pasta._id, habs.map((h) => itemUuid(P_ESPECIES, h._id))),
      sort: (i + 1) * 1000,
    });
  });
  return docs;
}

// ── Classes ───────────────────────────────────────────────────────
function montaClasses() {
  const docs = [];
  const pasta = folderDoc("Classes", "Item", "sd-classes");
  docs.push(pasta);

  classes.forEach((cls, i) => {
    // Uma subpasta POR CLASSE. Sem isso, as 24 habilidades e especializações
    // caem numa lista única em ordem alfabética, e achar o que é do Gatuno vira
    // caça. O "Pai — Filho" no nome é o que a aninhaPastas lê para hierarquizar.
    const sub = folderDoc(`Classes — ${cls.nome}`, "Item", `sd-classe:${cls.nome}`);
    docs.push(sub);

    const habs = (cls.habilidades ?? []).map((h, j) =>
      classAbilityDoc(h, sub._id, `sd-class-ab:${cls.nome}`, j));
    docs.push(...habs);
    // As especializações da classe entram como habilidades dela: a escolha
    // acontece no 5º nível e CONGELA uma coluna da progressão-base, então elas
    // pertencem à classe em vez de substituí-la.
    const specs = especializacoes
      .filter((e) => e.classe === cls.nome)
      .map((e, j) => classAbilityDoc({
        nome: `${e.nome} (${e.afiliacao})`,
        level: 5,
        desc:
          `<p><em>Especialização de ${e.classe}, para quem tem Afiliação ` +
          `<strong>${e.afiliacao}</strong>.</em></p>` +
          `<p><strong>A partir do 5º nível.</strong> ${e.n5}</p>` +
          (e.n20 ? `<p><strong>No 20º nível.</strong> ${e.n20}</p>` : "") +
          `<p class='nota-casa'><em>O degrau de 20º nível aparece aqui na descrição ` +
          `porque a ficha do Old Dragon 2 só tem campos para 3º, 6º e 10º.</em></p>`,
        level10: e.n10 || "",
      }, sub._id, `sd-espec:${cls.nome}`, 100 + j));
    docs.push(...specs);

    const todas = [...habs, ...specs];
    docs.push({
      ...classDoc(cls, pasta._id, todas.map((h) => itemUuid(P_CLASSES, h._id))),
      sort: (i + 1) * 1000,
    });
  });
  return docs;
}

// ── T2-1 como tabela rolável ────────────────────────────────────────────────
//
// Duas tabelas de 1d10, e não uma de 2d10: o livro manda rolar um dado em CADA
// coluna, e rerrolar se derem o mesmo número. Uma tabela de 2d10 somaria os
// dados, que é outra coisa.
function montaTabelas() {
  const docs = [];
  for (const [nome, lado, desc] of [
    ["T2-1: Mutações — Aprimoramentos", "aprimoramento",
     "Role 1d10. Role também na tabela de Degenerações; se os dois dados derem o MESMO número, rerrole os dois."],
    ["T2-1: Mutações — Degenerações", "degeneracao",
     "Role 1d10. Role também na tabela de Aprimoramentos; se os dois dados derem o MESMO número, rerrole os dois."],
  ]) {
    docs.push(rollTableDoc({
      nome,
      desc,
      formula: "1d10",
      // `range` e `text` são os nomes que o rollTableDoc espera — conferidos na
      // lib, não deduzidos. Cada resultado ocupa uma face só.
      resultados: PARES.map((p) => ({ text: p[lado].nome, range: [p.indice, p.indice] })),
    }, PARES.length));
  }
  return docs;
}

// ── Macros ──────────────────────────────────────────────────────────────────
//
// Uma macro geral e uma por teste. As específicas existem porque é assim que a
// mesa usa: o gatuno quer um botão "Furtar" na barra, não um menu onde escolher
// furtar toda vez.
//
// O COMANDO É UMA LINHA SÓ, de propósito. Toda a regra vive em
// module/testes.js; a macro apenas chama. Assim atualizar o módulo atualiza a
// regra, inclusive para as macros que já foram arrastadas para a barra.
function montaMacros() {
  const docs = [];
  const pasta = folderDoc("Testes de porcentagem", "Macro", "sd-macros");
  docs.push(pasta);

  docs.push(macroDoc({
    nome: "Teste de porcentagem",
    comando: "game.spacedragon.teste();",
    img: "icons/svg/d20-highlight.svg",
  }, pasta._id, 0));

  TESTES.forEach((t, i) => {
    docs.push(macroDoc({
      nome: t.classe ? `${t.nome} (${t.classe})` : t.nome,
      comando: `game.spacedragon.teste("${t.chave}");`,
    }, pasta._id, (i + 1) * 100));
  });
  return docs;
}

// ── Compilação ──────────────────────────────────────────────────────────────
async function compila(nome, docs) {
  const srcDir = path.join(SRC, nome);
  fs.rmSync(srcDir, { recursive: true, force: true });
  fs.mkdirSync(srcDir, { recursive: true });
  writeSource(srcDir, docs);

  const outDir = path.join(OUT, nome);
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  await compilePack(srcDir, outDir, { log: false });

  const pastas = docs.filter((d) => d._key?.startsWith("!folders!")).length;
  console.log(`  ✔ ${nome}: ${docs.length} documentos → LevelDB (${pastas} pasta(s))`);
}

async function main() {
  console.log("Montando o Space Dragon…");

  let cls = aninhaPastas(montaClasses());
  pintaPastas(cls, PALETA);
  await compila(P_CLASSES, cls);

  let esp = aninhaPastas(montaEspecies());
  pintaPastas(esp, PALETA);
  await compila(P_ESPECIES, esp);

  await compila(P_TABELAS, montaTabelas());
  const journais = [...regras, mutacoesJournal, testesJournal];
  await compila(P_MACROS, montaMacros());
  await compila(P_JOURNAL, journais.map((e, i) => journalDoc(e, (i + 1) * 1000)));

  console.log("Concluído.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
