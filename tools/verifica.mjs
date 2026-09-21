/**
 * Verificação dos testes de porcentagem.
 *
 * ── POR QUE ISTO EXISTE ─────────────────────────────────────────────────────
 *
 * Porque conferir a conta contra ela mesma não prova nada. Cada caso abaixo tem
 * o alvo LIDO À MÃO nas tabelas do *Livro Básico Aprimorado* — 245 páginas, o
 * PDF em `Documents/Ekhoria/20 Space Dragon/_regras`.
 *
 * ⚠️ NÃO CONFERIR CONTRA O "MÓDULO BÁSICO" DE 197 PÁGINAS. É uma edição
 * anterior que reescreve metade das tabelas, e conferir contra ela já custou
 * uma versão inteira de regressões. O Aprimorado diz "cosmonauta",
 * "furtividade" e "aptidão tecnológica"; o antigo diz "homem espacial",
 * "esgueirar-se" e "crédito tecnológico".
 *
 * Roda em Node, sem Foundry: `preparar()` só depende de module/dados.js, que é
 * ESM puro. A rolagem não é testada aqui — o que se testa é o ALVO, que é onde
 * erro de transcrição aparece.
 *
 *     npm run verifica
 */

import { preparar } from "../spacedragon-module/module/testes.js";

const A = (o) => ({ nivel: 1, valores: {}, ...o });

const CASOS = [
  // ── Gatuno, T3-5 ──
  ["furtividade", A({ nivel: 1, valores: { destreza: 10 } }), 20,
   "T3-5 nível 1 furtividade 20%, Destreza 10-11 dá 0"],
  ["furtividade", A({ nivel: 20, valores: { destreza: 29 } }), 133,
   "T3-5 nível 20 furtividade 88%, Destreza 28-29 dá +45%"],
  ["furtar", A({ nivel: 1, valores: { destreza: 13 } }), 25,
   "Destreza 12-13 dá +5%. Furtar e furtividade compartilham a MESMA coluna da T1-2"],
  ["sabotagem", A({ nivel: 1, valores: { ciencia: 10 } }), 15,
   "T3-5 nível 1 traz '15% / 1d8' — o alvo é 15, o 1d8 são as rodadas que a sabotagem leva"],
  ["sabotagem", A({ nivel: 20, valores: { ciencia: 10 } }), 80,
   "nível 20 traz '80% / 1'"],
  ["sabotagem", A({ nivel: 5, valores: { ciencia: 17 } }), 50,
   "T3-5 nível 5 sabotagem 35%, Ciência 16-17 dá +15% de aptidão tecnológica"],
  ["escalar", A({ nivel: 1 }), 80, "T3-5 nível 1"],
  ["escalar", A({ nivel: 20 }), 99, "T3-5 nível 20"],
  ["percepcao", A({ nivel: 1 }), 2, "faixa 1-2 no nível 1"],
  ["percepcao", A({ nivel: 20 }), 5, "faixa 1-5 no nível 20"],

  // ── Cosmonauta, T3-3 ──
  ["subjugar", A({ nivel: 1, valores: { forca: 16 } }), 35,
   "T3-3 nível 1 dá 20%, Força 16-17 dá +15% em subjugar"],
  ["desarmar", A({ nivel: 1, valores: { destreza: 16 } }), 35,
   "mesma porcentagem de tabela; Destreza 16-17 dá +15%"],
  ["pilotar-naves", A({ nivel: 1 }), 80, "T3-3 nível 1"],
  ["pilotar-naves", A({ nivel: 20 }), 99, "T3-3 nível 20"],

  // ── Cientista, T3-1 ──
  ["operar-maquinas", A({ nivel: 1 }), 80, "T3-1 nível 1"],
  ["operar-maquinas", A({ nivel: 20 }), 99, "T3-1 nível 20"],

  // ── Sai do atributo, não da classe ──
  ["realizar-poder", A({ valores: { intelecto: 10 } }), 15, "T1-4 Intelecto 10-11"],
  ["realizar-poder", A({ valores: { intelecto: 29 } }), 100, "T1-4 Intelecto 28-29"],
  ["realizar-poder", A({ valores: { intelecto: 9 } }), 0, "T1-4 abaixo de 10 não dá chance nenhuma"],
  ["clonagem", A({ valores: { constituicao: 10 } }), 25, "T1-3 Constituição 10-11"],
  ["clonagem", A({ valores: { constituicao: 18 } }), 100, "T1-3 Constituição 18-19"],
];

let falhas = 0;
for (const [chave, ctx, esperado, porque] of CASOS) {
  const { alvo } = preparar(chave, ctx);
  const ok = alvo === esperado;
  if (!ok) falhas += 1;
  console.log(
    `  ${ok ? "✔" : "✘"} ${chave.padEnd(16)} alvo ${String(alvo).padStart(3)}` +
    `${ok ? "" : ` — esperado ${esperado}`}   ${porque}`
  );
}

console.log(`\n${CASOS.length - falhas}/${CASOS.length} conferem.`);

// ── Bestiário: os blocos que a primeira transcrição misturou ───────────────
//
// A Sucata Robótica tinha os ataques e o texto do Tiranossauro, e o
// Tiranossauro e o Tentaculoide tinham sumido; o Gatuno de 5º tinha o quadro
// do Mentálico. Valores lidos à mão no PDF, págs. 203–204 e 237–239.
const { CRIATURAS } = await import("./data/bestiario.mjs");
const criatura = (n) => CRIATURAS.find((c) => c.nome === n);
const BLOCOS = [
  ["Sucata Robótica", "ataques", "1 PANCADA +1 (1D4+1)", "pág. 237"],
  ["Sucata Robótica", "premios", "25 XP", "pág. 237"],
  ["Tiranossauro", "ataques", "1 MORDIDA +16 (3D8+6 + ENGOLIR) 1 ATAQUE COM CAUDA +10 (2D6+2)", "pág. 239"],
  ["Tiranossauro", "dv", "14+4 (60/116)", "pág. 239"],
  ["Tentaculoide", "cp", "15 (CORPO MALEÁVEL +2)", "pág. 238"],
  ["Tentaculoide", "premios", "2.075 XP", "pág. 238"],
];
let falhasB = 0;
for (const [nome, campo, esperado, onde] of BLOCOS) {
  const obtido = criatura(nome)?.[campo];
  const ok = obtido === esperado;
  if (!ok) falhasB += 1;
  console.log(`  ${ok ? "✔" : "✘"} ${nome.padEnd(16)} ${campo.padEnd(8)} ${ok ? "" : `— "${obtido}", esperado "${esperado}"`}  ${onde}`);
}
// O quadro de habilidades é da classe do exemplo, e não da seguinte.
for (const [nome, comeca] of [["Gatuno (Nível 5)", "Sabotagem"], ["Mentálico (Nível 1)", "Poderes Mentais"], ["Mentálico (Nível 5)", "Poderes Mentais"]]) {
  const ok = (criatura(nome)?.texto ?? "").startsWith(comeca);
  if (!ok) falhasB += 1;
  console.log(`  ${ok ? "✔" : "✘"} ${nome.padEnd(20)} texto começa com "${comeca}"  págs. 203–204`);
}
console.log(`\n${BLOCOS.length + 3 - falhasB}/${BLOCOS.length + 3} blocos do bestiário conferem.`);

// ── Os ataques do bloco viram botões ───────────────────────────────────────
//
// Cada linha foi lida no bloco da criatura: vezes, nome, BA e o dado que o
// botão de dano rola. As formas esquisitas do livro estão todas aqui.
const { ataquesDoBloco, monsterDoc, premiosDe, encontrosDe } = await import("./lib.mjs");

// ── Prêmios e encontros, como o livro imprime ──────────────────────────────
//
// "PRÊMIOS OD 37 XP": as iniciais são as RELÍQUIAS que o alienígena carrega —
// O ofensiva, D defensiva, U utilitária (11.6) —, e não parte do XP.
// "ENCONTROS BANDO 3D6 BASE 10D6" são dois números, e cada espécie chama o
// covil do seu jeito.
{
  const CASOS = [
    ["Zork", { xp: "37 XP", treasure: "O, D" }, { encounters: "3D6", encounters_lair: "10D6", rotulos: { grupo: "BANDO", covil: "BASE" } }, "pág. 243"],
    ["Aranha Gigante", { xp: "205 XP" }, { encounters: "1D4", encounters_lair: "2D6", rotulos: { grupo: "GRUPO", covil: "NINHO" } }, "pág. 210"],
    ["Cientista (Nível 1)", { xp: "1.200 XP", treasure: "O, D, U" }, { encounters: "1D4" }, "pág. 203"],
  ];
  let falhasP = 0;
  for (const [nome, premio, encontro, onde] of CASOS) {
    const p = premiosDe(criatura(nome)?.premios);
    const e = encontrosDe(criatura(nome)?.encontros);
    const ok = JSON.stringify(p) === JSON.stringify(premio) && JSON.stringify(e) === JSON.stringify(encontro);
    if (!ok) falhasP += 1;
    console.log(`  ${ok ? "✔" : "✘"} ${nome.padEnd(22)} prêmio e encontros  ${onde}${ok ? "" : ` — ${JSON.stringify(p)} ${JSON.stringify(e)}`}`);
  }
  if (falhasP) process.exit(1);
}
const ATAQUES = [
  ["Tiranossauro", 0, { vezes: 1, nome: "Mordida", ba: 16, dano: "3d8+6" }],
  ["Tiranossauro", 1, { vezes: 1, nome: "Ataque com cauda", ba: 10, dano: "2d6+2" }],
  ["Aranha Gigante", 1, { vezes: 1, nome: "Ferroada", ba: 3, dano: "1d8+3" }],
  ["Encrustáceo", 0, { vezes: 2, nome: "Garras", ba: 4, dano: "1d6+2" }],
  ["Cosmonauta (Nível 1)", 1, { vezes: 1, nome: "Espada de energia", ba: 3, dano: "1d8+2" }],
  ["Eletricobra", 0, { vezes: 1, nome: "Mordida", ba: 4, dano: "1d6+1d4" }],
  ["Shoggoth", 0, { vezes: 1, nome: "Pancada por metro", ba: 2, dano: "1d4" }],
  ["Vampiro Energético", 0, { vezes: 1, nome: "Toque", ba: 4, dano: "" }],
  ["Medusa Elétrica", 0, { vezes: 1, nome: "Tentáculo", ba: 0, dano: "1d4" }],
];
let falhasA = 0;
for (const [nome, i, esperado] of ATAQUES) {
  const obtido = ataquesDoBloco(criatura(nome)?.ataques)[i] ?? {};
  const ok = Object.entries(esperado).every(([k, v]) => obtido[k] === v);
  if (!ok) falhasA += 1;
  console.log(`  ${ok ? "✔" : "✘"} ${nome.padEnd(22)} ataque ${i + 1}${ok ? "" : ` — ${JSON.stringify(obtido)}`}`);
}
// Ação especial, sem bônus e sem dado, fica no texto e não vira botão.
for (const nome of ["Bolha Verde", "Devorador de Mentes", "Geleia Espacial", "Planta Carnívora"]) {
  const n = ataquesDoBloco(criatura(nome)?.ataques).length;
  if (n) falhasA += 1;
  console.log(`  ${n ? "✘" : "✔"} ${nome.padEnd(22)} sem ataque rolável${n ? ` — leu ${n}` : ""}`);
}
// O documento: itens embutidos com a chave de item de ator, e o painel nos flags.
{
  const doc = monsterDoc(criatura("Tiranossauro"), null, "bestiario", 0);
  const probs = [];
  if (doc.items.length !== 2) probs.push(`${doc.items.length} itens, esperava 2`);
  for (const it of doc.items) {
    if (it.type !== "monster_attack") probs.push(`item do tipo ${it.type}`);
    if (it._key !== `!actors.items!${doc._id}.${it._id}`) probs.push(`chave ${it._key}`);
  }
  if (new Set(doc.items.map((i) => i._id)).size !== doc.items.length) probs.push("ids de ataque repetidos");
  const am = doc.flags?.spacedragon?.ameaca;
  if (am?.atributos?.FOR !== criatura("Tiranossauro").atributos.FOR) probs.push("atributos fora dos flags");
  if (!doc.system.description.includes('class="sd-bloco-extra"')) probs.push("o topo da descrição não está marcado para a Ficha de Ameaça esconder");
  if (probs.length) falhasA += 1;
  console.log(`  ${probs.length ? "✘" : "✔"} documento do Tiranossauro${probs.length ? ` — ${probs.join("; ")}` : ": 2 ataques embutidos, atributos nos flags"}`);
}
console.log(`\n${ATAQUES.length + 5 - falhasA}/${ATAQUES.length + 5} conferências de ataque passam.`);

if (falhas || falhasB || falhasA) process.exit(1);
