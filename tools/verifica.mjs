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
if (falhas) process.exit(1);
