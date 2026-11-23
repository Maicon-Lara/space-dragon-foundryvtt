/**
 * Os estados de dano do Space Dragon (module/estados-de-dano.js).
 *
 *   · a RD como o bestiário grava ("6/FÍSICO", "IMUNE A ATAQUES FÍSICOS") e a
 *     da mutação Tato;
 *   · o dano depois da RD nunca fica negativo;
 *   · os estados do Cap. 7 e a morte nos Danos Mortais;
 *   · quem rola a JPF na virada de rodada;
 *   · a RD entra no aplicarEmAtor, que o botão e a automação compartilham.
 *
 *     node tools/teste-estados-de-dano.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  lerRD, descontarRD, estadoPorPV, modoDo, rdDoAtor, quemRolaJPF,
} from "../spacedragon-module/module/estados-de-dano.js";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* ── A RD do bestiário ─────────────────────────────────────────────────── */
{
  const casos = [
    ["", { valor: 0, condicao: "", imune: false }],
    ["3", { valor: 3, condicao: "", imune: false }],
    ["6/FÍSICO", { valor: 6, condicao: "FÍSICO", imune: false }],
    ["4/ÁCIDO", { valor: 4, condicao: "ÁCIDO", imune: false }],
    ["IMUNE A ATAQUES FÍSICOS", { valor: 0, condicao: "ATAQUES FÍSICOS", imune: true }],
    ["IMUNE A", { valor: 0, condicao: "", imune: true }],
  ];
  for (const [texto, esperado] of casos) {
    const r = lerRD(texto);
    const recorte = { valor: r.valor, condicao: r.condicao, imune: r.imune };
    confere(igual(recorte, esperado), `RD "${texto}" virou ${JSON.stringify(recorte)}`);
  }
}

/* ── O desconto ────────────────────────────────────────────────────────── */
// o exemplo do livro: RD 3 e leva 8, sofre 5
confere(igual(descontarRD(8, 3), { final: 5, descontado: 3 }), `RD 3 contra 8: ${JSON.stringify(descontarRD(8, 3))}`);
confere(igual(descontarRD(2, 5), { final: 0, descontado: 2 }), "RD maior que o dano não pode virar cura");
confere(igual(descontarRD(9, Infinity), { final: 0, descontado: 9 }), "imune não sofre nada");
confere(igual(descontarRD(7, 0), { final: 7, descontado: 0 }), "sem RD o dano passa inteiro");

/* ── Os estados ────────────────────────────────────────────────────────── */
{
  const p = (pv) => estadoPorPV(pv, { modo: "personagem", mortais: -10 });
  confere(p(1) === "de-pe" && p(0) === "inconsciente" && p(-1) === "morrendo" && p(-9) === "morrendo" && p(-10) === "morto",
    `estados do personagem: 1 ${p(1)}, 0 ${p(0)}, −1 ${p(-1)}, −9 ${p(-9)}, −10 ${p(-10)}`);
  confere(estadoPorPV(0, { modo: "ameaca" }) === "derrotado" && estadoPorPV(-4, { modo: "ameaca" }) === "derrotado",
    "ameaça em 0 ou menos está derrotada");
  confere(estadoPorPV(3, { modo: "ameaca" }) === "de-pe", "ameaça com PV está de pé");
}

/* ── Quem é quem ───────────────────────────────────────────────────────── */
{
  confere(modoDo({ type: "monster", flags: {} }) === "ameaca", "monstro é ameaça");
  confere(modoDo({ type: "character", flags: {} }) === "personagem", "personagem com a ficha do Space Dragon");
  confere(modoDo({ type: "character", flags: { spacedragon: { nave: { tipo: "caca" } } } }) === null, "nave fica fora dos estados de personagem");
  confere(rdDoAtor({ type: "monster", flags: { spacedragon: { ameaca: { rd: "6/FÍSICO" } } } }).valor === 6, "RD da Ficha de Ameaça");

  // a mutação Tato ignora 2 de qualquer dano
  const tato = {
    type: "character", flags: {},
    system: { variable_construction_selections: { m1: [{ key: "07-tato" }] } },
    items: { get: (id) => (id === "m1" ? { flags: { spacedragon: { mutacao: "aprimoramento" } }, system: {} } : null) },
  };
  confere(rdDoAtor(tato).valor === 2, `a mutação Tato devia dar RD 2, deu ${rdDoAtor(tato).valor}`);
}

/* ── Quem rola a JPF ───────────────────────────────────────────────────── */
{
  const pc = (nome, pv, extra = {}) => ({
    name: nome, defeated: false,
    actor: { name: nome, type: "character", system: { hp: { value: pv }, constituicao: 10 }, flags: { spacedragon: extra } },
  });
  const lista = [pc("Ferido", 4), pc("Desmaiado", 0), pc("Morrendo", -3), pc("Estável", -3, { estavel: true }), pc("Morto", -40)];
  const nomes = quemRolaJPF(lista).map((c) => c.name);
  confere(igual(nomes, ["Morrendo"]), `só quem está abaixo de 0, vivo e sem estabilizar rola; vieram ${nomes.join(", ")}`);
}

/* ── A RD no caminho do dano ───────────────────────────────────────────── */
{
  const fonte = fs.readFileSync(path.join(RAIZ, "spacedragon-module", "module", "dano-no-alvo.js"), "utf8");
  confere(/if \(!ehNave\(ator\) && dano > 0\) \{\s*const r = descontarRD\(dano, await rdContra\(ator, dano\)\)/.test(fonte),
    "o aplicarEmAtor não desconta mais a RD de quem não é nave");
}

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log("  ✔ estados de dano: RD do bestiário e do Tato, desconto sem dano negativo, Danos Mortais, ameaça derrotada em 0 e a JPF de quem está morrendo");
