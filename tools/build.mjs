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
  folderDoc, raceDoc, raceAbilityDoc, classDoc, classAbilityDoc, journalDoc, rollTableDoc,
  itemUuid, writeSource, aninhaPastas, pintaPastas, makeId, stats,
} from "./lib.mjs";
import { especies } from "./data/especies.mjs";
import { classes } from "./data/classes.mjs";
import { PARES, T2_2, T2_3, T2_4, T2_5 } from "./data/mutacoes.mjs";
import { regras } from "./data/regras.mjs";
import { NOME_SD, NOME_OD2 } from "./data/conversao.mjs";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(AQUI, "..");
const SRC = path.join(ROOT, "packs-src");
const OUT = path.join(ROOT, "spacedragon-module", "packs");

const P_CLASSES = "spacedragon-classes";
const P_ESPECIES = "spacedragon-especies";
const P_MUTACOES = "spacedragon-mutacoes";
const P_TABELAS = "spacedragon-tabelas";
const P_JOURNAL = "spacedragon-journal";

/** Cor por pasta: sem isso o compêndio vira uma lista cinza indistinguível. */
const PALETA = {
  "Espécies": "#2f5d7c",
  "Classes": "#5a3f7c",
  "Aprimoramentos": "#2f6b46",
  "Degenerações": "#7c3a2f",
};

// ── Espécies ────────────────────────────────────────────────────────────────
function montaEspecies() {
  const docs = [];
  const pasta = folderDoc("Espécies", "Item", "sd-especies");
  docs.push(pasta);

  especies.forEach((esp, i) => {
    const habs = (esp.habilidades ?? []).map((h, j) =>
      raceAbilityDoc(h, pasta._id, `sd-race-ab:${esp.nome}`, j));
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
    const habs = (cls.habilidades ?? []).map((h, j) =>
      classAbilityDoc(h, pasta._id, `sd-class-ab:${cls.nome}`, j));
    docs.push(...habs);
    docs.push({
      ...classDoc(cls, pasta._id, habs.map((h) => itemUuid(P_CLASSES, h._id))),
      sort: (i + 1) * 1000,
    });
  });
  return docs;
}

// ── Mutações ────────────────────────────────────────────────────────────────
//
// Cada mutação vira uma `race_ability`: é o tipo do OD2 que o jogador solta
// DENTRO do item de raça que já está na ficha, que é como o Mutante as recebe.
//
// A forma de três campos do livro (Genótipo, Fenótipo, Funcionamento) fica
// preservada na descrição — ela separa o que o corpo fez do que aparece do que
// a mesa rola, e achatar isso num parágrafo só perderia a distinção.
function corpoDaMutacao(m, subtabela) {
  let html =
    `<p><em>Genótipo:</em> ${m.genotipo}</p>` +
    `<p><em>Fenótipo:</em> ${m.fenotipo}</p>` +
    `<p><strong>Funcionamento:</strong> ${m.funcionamento}</p>`;

  if (subtabela) {
    const linhas = subtabela.linhas.map((l) =>
      l.atributo
        // Os DOIS nomes: a subtabela do livro diz "Intelecto", e quem mexe na
        // ficha do OD2 precisa saber que isso é Sabedoria. É a razão de o
        // módulo existir.
        ? `<tr><td>${l.d6}</td><td><strong>${NOME_SD[l.atributo]}</strong> ${l.ajuste > 0 ? "+" : ""}${l.ajuste}` +
          // só quando os nomes DIFEREM: repetir "Força no OD2" é ruído que
          // esconde as três linhas que realmente importam.
          (NOME_OD2[l.atributo] !== NOME_SD[l.atributo]
            ? `<br><em style="opacity:.7">${NOME_OD2[l.atributo]} no OD2</em>` : "") +
          `</td><td>${l.fenotipo}</td></tr>`
        : `<tr><td>${l.d6}</td><td><strong>${l.sentido}</strong></td><td>${l.fenotipo}. ${l.funcionamento}</td></tr>`
    ).join("");
    html +=
      `<p><strong>${subtabela.nome}</strong> — role 1d6:</p>` +
      `<table><thead><tr><th>1d6</th><th>${subtabela.col2}</th><th>Efeito</th></tr></thead>` +
      `<tbody>${linhas}</tbody></table>`;
  }
  return html;
}

const SUBTABELAS = {
  "Atributo Ampliado": { nome: "T2-2: Atributo Ampliado", col2: "Atributo", linhas: T2_2 },
  "Atributo Diminuído": { nome: "T2-4: Atributo Diminuído", col2: "Atributo", linhas: T2_4 },
  "Sentido Ampliado": { nome: "T2-3: Sentido Ampliado", col2: "Sentido", linhas: T2_3 },
  "Sentido Diminuído": { nome: "T2-5: Sentido Diminuído", col2: "Sentido", linhas: T2_5 },
};

function montaMutacoes() {
  const docs = [];
  const pApr = folderDoc("Aprimoramentos", "Item", "sd-mut-apr");
  const pDeg = folderDoc("Degenerações", "Item", "sd-mut-deg");
  docs.push(pApr, pDeg);

  for (const p of PARES) {
    for (const [lado, pasta] of [["aprimoramento", pApr], ["degeneracao", pDeg]]) {
      const m = p[lado];
      docs.push({
        ...raceAbilityDoc(
          { nome: m.nome, desc: corpoDaMutacao(m, SUBTABELAS[m.nome]) },
          pasta._id, `sd-mut:${lado}`, p.indice
        ),
        sort: p.indice * 100,
      });
    }
  }
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

  let mut = aninhaPastas(montaMutacoes());
  pintaPastas(mut, PALETA);
  await compila(P_MUTACOES, mut);

  await compila(P_TABELAS, montaTabelas());
  await compila(P_JOURNAL, regras.map((e, i) => journalDoc(e, (i + 1) * 1000)));

  console.log("Concluído.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
