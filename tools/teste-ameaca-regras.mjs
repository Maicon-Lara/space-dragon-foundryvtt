/**
 * As regras do bloco de alienígena (Cap. 11) na Ficha de Ameaça.
 *
 * ── AS ASSERÇÕES QUE MAIS IMPORTAM ──────────────────────────────────────────
 *
 * 1. TODO DV do bestiário vira uma rolagem — o sistema lia "3+1 (13/25)" como
 *    não-número e rolava 1d8 para qualquer criatura. O máximo da fórmula tem
 *    de bater com o máximo que o próprio livro imprime entre parênteses.
 *
 * 2. O prêmio do vilão com classe bate com os oito personagens de exemplo do
 *    bestiário: é o próprio livro conferindo a regra dos 10%.
 *
 *     node tools/teste-ameaca-regras.mjs
 */

import { CRIATURAS } from "./data/bestiario.mjs";
import {
  lerDV, formulaDoDV, xpDeVilao, significadoDosZeros, gruposParaMoral,
} from "../spacedragon-module/module/ameaca-regras.js";

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

/* ── 1. O DV ───────────────────────────────────────────────────────────── */
for (const [texto, esperado] of [
  ["3+1 (13/25)", "3d8+1"], ["1D10+1 (6)", "1d10+1"], ["9 (36/72)", "9d8"],
  ["20+5 (85/165)", "20d8+5"], ["2+2 (10/18) PARA CADA 2M", "2d8+2"],
]) {
  confere(formulaDoDV(lerDV(texto)) === esperado, `DV "${texto}" deu ${formulaDoDV(lerDV(texto))}, esperava ${esperado}`);
}
confere(lerDV("1 PV")?.fixo === 1 && formulaDoDV(lerDV("1 PV")) === null, "\"1 PV\" é fixo, não se rola");
confere(formulaDoDV(lerDV("3+1 (13/25)", "2")) === "3d8+3", "o campo de bônus de DV da ficha não somou ao do bloco");
confere(/para cada 2m/.test(lerDV("2+2 (10/18) PARA CADA 2M")?.nota ?? ""), "a nota \"para cada 2m\" se perdeu");
confere(lerDV("") === null && lerDV("—") === null, "DV vazio devia dar null");

// Cada DV do bestiário: rola, e o máximo da fórmula é o do livro.
for (const c of CRIATURAS) {
  const dv = lerDV(c.dv);
  confere(dv, `${c.nome}: o DV "${c.dv}" não foi lido`);
  if (!dv || dv.fixo !== null) continue;
  const maximoLivro = Number(String(c.dv).match(/\/(\d+)\)/)?.[1] ?? NaN);
  if (Number.isFinite(maximoLivro)) {
    const maximo = dv.quantidade * dv.faces + dv.bonus;
    confere(maximo === maximoLivro, `${c.nome}: ${formulaDoDV(dv)} chega a ${maximo}, o livro diz ${maximoLivro}`);
  }
}

/* ── 2. O prêmio do vilão, conferido pelo livro ────────────────────────── */
for (const c of CRIATURAS.filter((x) => /\(Nível \d+\)/.test(x.nome))) {
  const [, classe, nivel] = c.nome.match(/^(\S+) \(Nível (\d+)\)/);
  const doLivro = Number(String(c.premios).match(/([\d.]+)\s*XP/)?.[1]?.replace(/\./g, ""));
  confere(xpDeVilao(classe, nivel) === doLivro,
    `${c.nome}: prêmio ${xpDeVilao(classe, nivel)} XP, o bestiário diz ${doLivro}`);
}
confere(xpDeVilao("Nave", 1) === null, "classe que não é do livro não tem prêmio");

/* ── 3. O atributo zero ────────────────────────────────────────────────── */
{
  const notas = significadoDosZeros({ FOR: 14, INT: 0, CIE: 0, COM: "" });
  confere(notas.length === 2 && /irracional/i.test(notas[0]) && /primitiv/i.test(notas[1]),
    `INT 0 e CIE 0 deviam dar duas notas; deu: ${notas.join(" | ")}`);
  confere(significadoDosZeros({ COM: "" }).length === 0, "campo VAZIO não é zero");
  const aranha = CRIATURAS.find((c) => c.nome === "Aranha Gigante");
  confere(significadoDosZeros(aranha.atributos).some((n) => /irracional/i.test(n)), "a Aranha Gigante (INT 0) não saiu irracional");
}

/* ── 4. A Moral quando metade do grupo cai ─────────────────────────────── */
{
  const zork = (id, pv, extra = {}) => ({ actorId: "zork", actor: { type: "monster", name: "Zork", system: { hp: { value: pv } } }, id, ...extra });
  const tres = [zork("a", 0), zork("b", 5), zork("c", 5)];
  confere(gruposParaMoral(tres).length === 0, "1 de 3 caídos ainda não pede Moral");
  const metade = [zork("a", 0), zork("b", 5)];
  const g = gruposParaMoral(metade);
  confere(g.length === 1 && g[0].vivos.length === 1, "1 de 2 caídos (50%) devia pedir a Moral do sobrevivente");
  confere(gruposParaMoral(metade, ["zork"]).length === 0, "o aviso saiu duas vezes para o mesmo grupo");
  confere(gruposParaMoral([zork("a", 0), zork("b", 0)]).length === 0, "grupo todo caído não tem quem role");
  confere(gruposParaMoral([zork("a", 5, { defeated: true }), zork("b", 5)]).length === 1,
    "o derrotado marcado no rastreador (com PV) também conta");
  const pj = { actorId: "pj", actor: { type: "character", system: { hp: { value: 0 } } } };
  confere(gruposParaMoral([pj, { ...pj, actor: { ...pj.actor, system: { hp: { value: 3 } } } }]).length === 0,
    "personagem não rola Moral");
}

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log(
  "  ✔ ameaça: todo DV do bestiário vira rolagem com o máximo do livro, o prêmio de vilão bate com os oito " +
    "exemplos, atributo 0 tem nota, e a Moral sai quando metade do grupo cai"
);
