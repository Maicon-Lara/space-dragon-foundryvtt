/**
 * O descanso do Space Dragon dentro do do Qualidade de Vida (module/descanso.js).
 *
 *   · 1 PV por nível no repouso total; Recuperação Acelerada dobra; Lenta
 *     recupera a cada 2 dias; androide não recupera;
 *   · a mutação e a espécie lidas do ator;
 *   · o envelope em `game.od2Qdv.effects.rest` roda o original antes.
 *
 *     node tools/teste-descanso.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pvDoRepouso, ritmoDe, ehAndroide } from "../spacedragon-module/module/descanso.js";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

/* ── A taxa ────────────────────────────────────────────────────────────── */
confere(pvDoRepouso({ nivel: 5 }).pv === 5, "repouso total no 5º nível devolve 5 PV");
confere(pvDoRepouso({ nivel: 5, ritmo: "acelerada" }).pv === 10, "Recuperação Acelerada devolve 2 por nível");
confere(pvDoRepouso({ nivel: 5, androide: true }).pv === 0, "androide não se recupera sozinho");
confere(pvDoRepouso({ nivel: 0 }).pv === 1, "nível em branco conta como 1º");
{
  const d1 = pvDoRepouso({ nivel: 4, ritmo: "lenta", diasLentos: 0 });
  const d2 = pvDoRepouso({ nivel: 4, ritmo: "lenta", diasLentos: d1.diasLentos });
  confere(d1.pv === 0 && d1.diasLentos === 1, `Lenta, 1º dia: ${JSON.stringify(d1)}`);
  confere(d2.pv === 4 && d2.diasLentos === 0, `Lenta, 2º dia: ${JSON.stringify(d2)}`);
}

/* ── Mutação e espécie ─────────────────────────────────────────────────── */
{
  const comMutacao = (lado, chave) => ({
    system: { variable_construction_selections: { m: [{ key: chave }] } },
    items: { get: () => ({ flags: { spacedragon: { mutacao: lado } }, system: {} }) },
  });
  confere(ritmoDe(comMutacao("aprimoramento", "01-recuperacao-acelerada")) === "acelerada", "Recuperação Acelerada não foi lida");
  confere(ritmoDe(comMutacao("degeneracao", "01-recuperacao-lenta")) === "lenta", "Recuperação Lenta não foi lida");
  confere(ritmoDe({ system: {}, items: { get: () => null } }) === "normal", "sem mutação, o ritmo é o normal");
  confere(ehAndroide({ items: [{ type: "race", name: "Androide" }] }), "a espécie Androide não foi reconhecida");
  confere(!ehAndroide({ items: [{ type: "race", name: "Humano" }, { type: "class", name: "Androide" }] }),
    "só o item de ESPÉCIE conta, não uma classe com o mesmo nome");
}

/* ── O envelope ────────────────────────────────────────────────────────── */
{
  const fonte = fs.readFileSync(path.join(RAIZ, "spacedragon-module", "module", "descanso.js"), "utf8");
  confere(/await original\.call\(this, ator, \.\.\.resto\);\s*\n\s*await depoisDoDescanso\(ator\)/.test(fonte),
    "o envelope tem de rodar o descanso do Qualidade de Vida ANTES do nosso");
  confere(/efeitos\.rest\[MARCA\]/.test(fonte), "o envelope não pode se envolver duas vezes");
}

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log("  ✔ descanso: 1 PV por nível, Acelerada, Lenta a cada 2 dias, androide sem recuperação e o envelope do Qualidade de Vida");
