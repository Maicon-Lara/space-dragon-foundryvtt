/**
 * O disparo das armas de nave: alcance, faixa e a conta do ataque.
 *
 * ── O QUE ESTE TESTE GARANTE ────────────────────────────────────────────────
 *
 *   · toda arma da T10-4 tem as três faixas da casa, crescentes, e o item do
 *     compêndio leva a curta no campo de alcance e a tripla na descrição;
 *   · a faixa sai da distância (cada faixa vai até o número dela, inclusive),
 *     e passar da longa é fora de alcance;
 *   · a fórmula é 1d20 + BA da nave + Balístico + artilheiro + faixa + situação,
 *     sem termos zero;
 *   · acerto é igualar ou superar o CP;
 *   · a Ficha de Nave atende o clique da arma de nave em captura, antes do
 *     Qualidade de Vida, e deixa passar qualquer outro ataque.
 *
 *     node tools/teste-nave-disparo.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  armaDoEquipamento, alcanceEscrito, faixaDoAlcance, penalidadeDaFaixa, formulaDoDisparo, resultadoDoDisparo,
  unidadeEmMetros,
} from "../spacedragon-module/module/nave-disparo.js";
import { EQUIPAMENTOS_DE_NAVE } from "../spacedragon-module/module/equipamentos-nave.js";
import { equipamentosDeNave } from "./data/equipamentos-de-nave.mjs";
import { armaDoBotao } from "../spacedragon-module/module/nave-pc-ficha.js";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

/* ── As armas e os números da casa ────────────────────────────────────────── */
{
  const armas = Object.entries(EQUIPAMENTOS_DE_NAVE).filter(([, e]) => e.efeito?.arma);
  confere(armas.length === 4, `esperava 4 armas na T10-4, achei ${armas.length}`);
  for (const [chave, e] of armas) {
    const a = e.efeito.arma.alcance;
    confere(Array.isArray(a) && a.length === 3, `${chave} sem as três faixas de alcance`);
    confere(Array.isArray(a) && a[0] < a[1] && a[1] < a[2], `${chave}: as faixas não crescem (${a})`);
    const item = equipamentosDeNave.find((x) => x.chave === chave);
    confere(item?.alcance?.[0] === a?.[0], `${chave}: o item do compêndio não leva a faixa curta`);
    confere(/Alcance \(regra da casa\)/.test(item?.desc ?? ""), `${chave}: a descrição não traz o alcance marcado como da casa`);
  }
  confere(JSON.stringify(armaDoEquipamento("disparadores")?.alcance) === "[100,200,300]", "disparadores com alcance diferente do combinado");
  confere(JSON.stringify(armaDoEquipamento("metralhadora")?.alcance) === "[80,160,240]", "metralhadora com alcance diferente do combinado");
  confere(JSON.stringify(armaDoEquipamento("canhoes")?.alcance) === "[150,300,450]", "canhões com alcance diferente do combinado");
  confere(JSON.stringify(armaDoEquipamento("misseis")?.alcance) === "[200,400,600]", "mísseis com alcance diferente do combinado");
  confere(armaDoEquipamento("balistico") === null, "o Computador Balístico não atira");
  confere(alcanceEscrito([600, 1200, 1800]) === "600 / 1.200 / 1.800 m", `alcance escrito: ${alcanceEscrito([600, 1200, 1800])}`);
  for (const u of ["m", "M", "metros", "metro", "meters", " m. "]) confere(unidadeEmMetros(u), `"${u}" devia contar como metro`);
  for (const u of ["ft", "pés", "quadrados", "", null, "km"]) confere(!unidadeEmMetros(u), `"${u}" não é metro`);
}

/* ── A faixa pela distância ───────────────────────────────────────────────── */
{
  const a = [150, 300, 450];
  const f = (d) => faixaDoAlcance(a, d)?.chave ?? null;
  confere(f(0) === "curta" && f(150) === "curta", "até 150 m é curta, inclusive");
  confere(f(151) === "media" && f(300) === "media", "de 151 a 300 m é média");
  confere(f(301) === "longa" && f(450) === "longa", "de 301 a 450 m é longa");
  confere(f(451) === "fora" && faixaDoAlcance(a, 451).fora === true, "além de 450 m é fora de alcance");
  confere(faixaDoAlcance(a, null) === null && faixaDoAlcance(a, undefined) === null, "sem distância, a faixa fica para a mesa");
  confere(faixaDoAlcance(null, 100) === null, "arma sem alcance não tem faixa");
  confere(penalidadeDaFaixa("curta") === 0 && penalidadeDaFaixa("media") === -2 && penalidadeDaFaixa("longa") === -4,
    "as penalidades são 0, −2 e −4, como na T5-1");
}

/* ── A fórmula e o resultado ──────────────────────────────────────────────── */
{
  const f = formulaDoDisparo({ baNave: 16, balistico: 2, artilheiro: 3, penalidade: -2, situacao: 0 });
  confere(f === "1d20 + 16 + 2 + 3 - 2", `fórmula: ${f}`);
  confere(formulaDoDisparo({ baNave: 12 }) === "1d20 + 12", "termos zero não entram");
  confere(formulaDoDisparo({ baNave: 12, artilheiro: "" }) === "1d20 + 12", "artilheiro em branco conta zero");
  confere(formulaDoDisparo({ baNave: "+12", artilheiro: "4" }) === "1d20 + 12 + 4", "números vindos do formulário como texto");
  confere(resultadoDoDisparo(26, 26) === "acerto", "igualar o CP acerta");
  confere(resultadoDoDisparo(25, 26) === "erro", "abaixo do CP erra");
  confere(resultadoDoDisparo(30, null) === null, "sem CP, a mesa compara");
}

/* ── O botão de ataque: nosso ou do sistema ───────────────────────────────── */
{
  const itens = {
    laser: { flags: { spacedragon: { equipamentoDeNave: { chave: "disparadores" } } } },
    pistola: { flags: {} },
  };
  const ator = { items: { get: (id) => itens[id] } };
  const botao = (id) => ({ closest: (sel) => (sel === "[data-item-id]" ? { dataset: { itemId: id } } : null) });
  confere(armaDoBotao(botao("laser"), ator)?.chave === "disparadores", "o ataque dos disparadores devia ser da Ficha de Nave");
  confere(armaDoBotao(botao("pistola"), ator) === null, "a arma pessoal devia seguir para o sistema");
  confere(armaDoBotao({ closest: () => null }, ator) === null, "botão fora de uma linha de item segue para o sistema");
}

/* ── A ficha liga o disparo em captura ────────────────────────────────────── */
{
  const fonte = fs.readFileSync(path.join(RAIZ, "spacedragon-module", "module", "nave-pc-ficha.js"), "utf8");
  const trecho = fonte.slice(fonte.indexOf("#ligarDisparo(raiz) {"), fonte.indexOf("async #disparar("));
  confere(/addEventListener\("click"[\s\S]*\}, true\);/.test(trecho), "o disparo devia ouvir em captura, para rodar antes do Qualidade de Vida");
  confere(/stopImmediatePropagation\(\)/.test(trecho), "o disparo devia impedir que o Qualidade de Vida peça munição");
  confere(/if \(!achada\) return;/.test(trecho), "o clique que não é de arma de nave devia seguir adiante");
  confere(/this\.#ligarDisparo\(raiz\);/.test(fonte), "a ficha não liga o disparo");
}

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log("  ✔ disparo de nave: faixas da casa, fórmula do Cap. 10, clique antes do Qualidade de Vida");
