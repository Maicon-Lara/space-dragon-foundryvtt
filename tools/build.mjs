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

// ── Classes ─────────────────────────────────────────────────────────────────
//
// ── AS ESPECIALIZAÇÕES SÃO CLASSES, NÃO HABILIDADES ─────────────────────────
//
// No 5º nível o personagem ESCOLHE uma, e a partir dali sobe nela em vez de
// subir na classe-base. Isso é troca de classe, não ganho de habilidade.
//
// A primeira versão as fazia `class_ability` da classe-base, e a ficha ficava
// mostrando as três de uma vez — o cosmonauta lia Emissário, Mercenário e
// Caçador de Recompensas empilhados, sem nenhum ser o dele. É o mesmo desenho
// das Sendas do módulo Star Wars, e a solução é a mesma:
//
//   · cada especialização vira um item `class` próprio, "Cosmonauta —
//     Emissário", com a MESMA progressão de níveis da base;
//   · ela carrega as habilidades da classe-base POR REFERÊNCIA, mais a sua.
//     "Eles recebem poderes da classe base e novos das especializações";
//   · o jogador troca o item de classe na ficha quando escolhe.
//
// A classe-base continua existindo sozinha, para quem não se especializar.
//
// ── OS DEGRAUS DE 5, 10 E 20 ────────────────────────────────────────────────
//
// O `class_ability` do OD2 tem campos para 3º, 6º e 10º nível, e o template
// desenha a descrição PRIMEIRO e os degraus DEPOIS. Pôr o 20º na descrição
// fazia ele aparecer antes do bloco de 10º — fora de ordem na tela.
//
// Então os três degraus vão todos na descrição, em ordem. Perde-se a etiqueta
// que o sistema desenha; ganha-se o texto na ordem em que se lê.
//
// ── A COSTURA DOS DEGRAUS ───────────────────────────────────────────────────
//
// O texto foi transcrito para ser CONCATENADO, não empilhado. Cada bloco
// termina com o conector e o seguinte começa no número:
//
//   n5  "…não ser seus próprios artefatos. Ao atingir o"
//   n10 "10° nível ele pode usar a porcentagem…              …penalidade. No"
//   n20 "20° nível seu desconto tecnológico…"
//
// Empilhar isso com um rótulo produzia "No 10º nível. 10° nível o mercenário
// receberá…" — o número duas vezes, e um "Ao atingir o" pendurado no fim do
// bloco anterior.
//
// Então o conector MUDA DE BLOCO: sai do fim de um e vai para o começo do
// seguinte, onde ele sempre pertenceu. O texto do livro não é reescrito, só
// recortado no lugar certo.
const CONECTOR =
  /\s*(?:\d{1,3}\s+)?(No|A partir do|Ao atingir o|Atingindo o|Ao chegar no|Ao chegar ao|Já no|Chegando ao|atingindo o|ao atingir o)\s*$/;

/** Tira o conector do fim de um bloco e devolve os dois pedaços. */
function separaConector(txt) {
  const m = (txt ?? "").match(CONECTOR);
  if (!m) return { corpo: (txt ?? "").trim(), conector: null };
  return { corpo: txt.slice(0, m.index).trim(), conector: m[1] };
}

function degraus(e) {
  const a = separaConector(e.n5);
  const b = separaConector(e.n10);

  // O conector do bloco anterior abre o seguinte. Sem conector, o rótulo
  // genérico entra no lugar — algumas transcrições não têm nenhum.
  const abre = (conector, nivel, txt) => {
    if (!txt) return "";
    const jaTemNivel = new RegExp(`^${nivel}\\s*[°º]`).test(txt);
    const cabeca = conector
      ? `${conector} `
      : jaTemNivel ? "" : `No ${nivel}º nível `;
    return `<p>${cabeca}${txt}</p>`;
  };

  return (
    `<p><em>Especialização de ${e.classe}, para quem tem Afiliação ` +
    `<strong>${e.afiliacao}</strong>.</em></p>` +
    (a.corpo ? `<p>${a.corpo}</p>` : "") +
    abre(a.conector, 10, b.corpo) +
    abre(b.conector, 20, separaConector(e.n20).corpo)
  );
}

function montaClasses() {
  const docs = [];
  const pasta = folderDoc("Classes", "Item", "sd-classes");
  docs.push(pasta);

  classes.forEach((cls, i) => {
    // Uma subpasta POR CLASSE. Sem isso, as habilidades e especializações caem
    // numa lista única em ordem alfabética, e achar o que é do Gatuno vira
    // caça. O "Pai — Filho" no nome é o que a aninhaPastas lê para hierarquizar.
    const sub = folderDoc(`Classes — ${cls.nome}`, "Item", `sd-classe:${cls.nome}`);
    docs.push(sub);

    const habs = (cls.habilidades ?? []).map((h, j) =>
      classAbilityDoc(h, sub._id, `sd-class-ab:${cls.nome}`, j));
    docs.push(...habs);
    const uuidsBase = habs.map((h) => itemUuid(P_CLASSES, h._id));

    // A classe-base, para quem não se especializar.
    docs.push({
      ...classDoc(cls, sub._id, uuidsBase),
      sort: 0,
    });

    // Uma classe por especialização, herdando as habilidades da base.
    especializacoes
      .filter((e) => e.classe === cls.nome)
      .forEach((e, j) => {
        const hab = classAbilityDoc(
          { nome: e.nome, level: 5, desc: degraus(e) },
          sub._id, `sd-espec:${cls.nome}`, 100 + j
        );
        docs.push(hab);
        docs.push({
          ...classDoc({
            ...cls,
            // O _id continua semeado pela forma "Classe — Especialização", que
            // foi a que gerou os UUIDs: inverter o RÓTULO não pode trocar o
            // UUID de uma classe já em uso.
            seedNome: `${cls.nome} — ${e.nome}`,
            // A especialização vem primeiro porque é ela que o jogador procura.
            // "Emissário — Cosmonauta" acha na hora; "Cosmonauta — Emissário"
            // esconde o nome que importa atrás de um prefixo repetido três
            // vezes na lista.
            nome: `${e.nome} — ${cls.nome}`,
            flavor: `<p><em>${cls.nome} de Afiliação <strong>${e.afiliacao}</strong>.</em></p>`,
            descricao:
              `<p>Especialização escolhida no <strong>5º nível</strong>. A partir dali o ` +
              `personagem sobe nela, e não mais na classe-base — mas mantém tudo o que ` +
              `${cls.nome} já lhe deu.</p>` + degraus(e) + cls.descricao,
          }, sub._id, [...uuidsBase, itemUuid(P_CLASSES, hab._id)]),
          sort: (j + 1) * 10,
        });
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


// ── Guarda: todo teste tem de achar a habilidade dele ───────────────────────
//
// O painel da ficha enfia o botão de rolagem DENTRO da habilidade de classe,
// casando por nome. Se alguém renomear "Talentos de Gatuno" em classes.mjs e
// esquecer o testes.mjs, o botão some sem erro nenhum — a ficha só fica sem
// ele, e ninguém percebe até a mesa.
//
// Então o build quebra aqui em vez de publicar um painel mudo.
function conferePonteiros() {
  const existentes = new Set(
    classes.flatMap((c) => (c.habilidades ?? []).map((h) => h.nome))
  );
  const orfas = TESTES
    .filter((t) => t.habilidade && !existentes.has(t.habilidade))
    .map((t) => `${t.chave} → "${t.habilidade}"`);

  if (orfas.length) {
    for (const o of orfas) console.error(`  ✘ ${o}`);
    console.error("  habilidades disponíveis:", [...existentes].sort().join(", "));
    throw new Error(
      `${orfas.length} teste(s) apontam para habilidade que não existe em classes.mjs`
    );
  }
  console.log(`  ✔ ponteiros: ${TESTES.filter((t) => t.habilidade).length} testes ligados a habilidades`);
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
  conferePonteiros();

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
