/**
 * Verificação dos testes de porcentagem.
 *
 * ── POR QUE ISTO EXISTE ─────────────────────────────────────────────────────
 *
 * Porque conferir a conta contra ela mesma não prova nada. Cada caso abaixo tem
 * o alvo LIDO À MÃO nas tabelas do livro, e dois deles são exemplos que o
 * próprio livro resolve — se a conta do módulo divergir de um exemplo impresso,
 * é a conta que está errada.
 *
 * Roda em Node, sem Foundry: `preparar()` só depende de module/dados.js, que é
 * ESM puro. A rolagem em si não é testada aqui — o que se testa é o ALVO, que é
 * onde erro de transcrição aparece.
 *
 *     npm run verifica
 */

import { preparar } from "../spacedragon-module/module/testes.js";

const A = (o) => ({ nivel: 1, valores: {}, ...o });

const CASOS = [
  // ── Gatuno, T3-4 ──
  ["furtar", A({ nivel: 1, valores: { destreza: 10 } }), 20,
   "T3-4 nível 1 furtar 20%, Destreza 10-11 dá 0"],
  ["furtar", A({ nivel: 20, valores: { destreza: 29 } }), 128,
   "T3-4 nível 20 furtar 88%, Destreza 28-29 dá +40% na terceira coluna"],
  ["esgueirar-se", A({ nivel: 1, valores: { destreza: 13 } }), 25,
   "Destreza 12-13 dá +5% em esgueirar-se"],
  ["ocultar-se", A({ nivel: 1, valores: { destreza: 13 } }), 10,
   "…e 0 em ocultar-se: a terceira coluna ATRASA um degrau. Se der 15, as duas colunas viraram uma"],
  ["destrancar-portas", A({ nivel: 10, valores: { destreza: 20 } }), 85,
   "T3-4 nível 10 destrancar 60%, Destreza 20-21 dá +25%"],
  ["localizar-sabotar", A({ nivel: 5, valores: { ciencia: 17 } }), 45,
   "T3-4 nível 5 localizar 40%, Ciência 16-17 dá +5%"],
  ["localizar-sabotar", A({ nivel: 5, valores: { ciencia: 15 } }), 40,
   "Ciência 14-15 ainda dá 0: a coluna atrasa TRÊS degraus"],
  ["escalar-superficies", A({ nivel: 5 }), 84,
   "EXEMPLO DO LIVRO (p.42): 'sua probabilidade de escalar superfícies nesse nível é de 84%'"],
  ["localizar-sabotar", A({ nivel: 10, valores: { ciencia: 10 } }), 62,
   "EXEMPLO DO LIVRO (p.42): o sabotador de 10º tem 73% COM o bônus de +11 da especialização, sem atributo — logo a base é 62%"],
  ["ouvir-barulhos", A({ nivel: 1 }), 2, "faixa 1-2 no nível 1"],
  ["ouvir-barulhos", A({ nivel: 20 }), 5, "faixa 1-5 no nível 20"],

  // ── Homem Espacial, T3-5 ──
  ["subjugar", A({ nivel: 1, valores: { forca: 16 } }), 35,
   "T3-5 nível 1 dá 20%, Força 16-17 dá +15% em subjugar"],
  ["desarmar", A({ nivel: 1, valores: { destreza: 16 } }), 30,
   "mesma coluna de tabela, mas Destreza 16-17 dá +10% em desarmar"],
  ["pilotar-naves", A({ nivel: 20 }), 99, "T3-5 nível 20"],

  // ── Cientista, T3-1 ──
  ["operar-maquinas", A({ nivel: 1 }), 80, "T3-1 nível 1"],
  ["operar-maquinas", A({ nivel: 20 }), 99, "T3-1 nível 20"],

  // ── Sai do atributo, não da classe ──
  ["reproduzir-poder", A({ valores: { intelecto: 10 } }), 15, "T1-4 Intelecto 10-11"],
  ["reproduzir-poder", A({ valores: { intelecto: 29 } }), 100, "T1-4 Intelecto 28-29"],
  ["reproduzir-poder", A({ valores: { intelecto: 9 } }), 0, "T1-4 abaixo de 10 não dá chance nenhuma"],
  ["clonagem", A({ valores: { constituicao: 10 } }), 25, "T1-3 Constituição 10-11"],
  ["clonagem", A({ valores: { constituicao: 18 } }), 100, "T1-3 Constituição 18-19"],
];

let falhas = 0;
for (const [chave, ctx, esperado, porque] of CASOS) {
  const { alvo } = preparar(chave, ctx);
  const ok = alvo === esperado;
  if (!ok) falhas += 1;
  console.log(
    `  ${ok ? "✔" : "✘"} ${chave.padEnd(20)} alvo ${String(alvo).padStart(3)}` +
    `${ok ? "" : ` — esperado ${esperado}`}   ${porque}`
  );
}

console.log(`\n${CASOS.length - falhas}/${CASOS.length} conferem.`);
if (falhas) process.exit(1);
