/**
 * O tamanho do token da nave no grid (regra da casa).
 *
 * ── O QUE ESTE TESTE GARANTE ────────────────────────────────────────────────
 *
 *   · Pequena 1×1, Média 2×2, Gigantesca 4×4, Colossal 6×6, pelo tamanho
 *     gravado, pelo tipo ou pelo nome da raça;
 *   · o update põe o protótipo no tamanho e marca a nave, e não faz nada quando
 *     já está assim e marcada;
 *   · só os tokens DESTA nave, e fora do tamanho, são corrigidos nas cenas;
 *   · a nave criada pelo botão já nasce no tamanho, e trocar o tipo ajusta.
 *
 *     node tools/teste-nave-token.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  LADO_POR_TAMANHO, ladoDoToken, updateDoToken, tokensForaDoTamanho,
} from "../spacedragon-module/module/nave-token.js";
import { TIPOS } from "../spacedragon-module/module/tipos-de-nave.js";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

const ator = (nave, { proto = { width: 1, height: 1 }, raca = "" } = {}) => ({
  id: "n1", name: "Nave", flags: { spacedragon: { nave } }, prototypeToken: proto, system: { race: { name: raca } },
});

/* ── O lado por tamanho ───────────────────────────────────────────────────── */
{
  confere(Object.values(TIPOS).every((t) => LADO_POR_TAMANHO[t.tamanho]), "todo tamanho da T10-1 devia ter lado");
  confere(ladoDoToken(ator({ tamanho: "Média" })) === 2, "Média é 2×2");
  confere(ladoDoToken(ator({ tipo: "cruzador" })) === 6, "pelo tipo gravado: cruzador é Colossal, 6×6");
  confere(ladoDoToken(ator({}, { raca: "Cargueiro" })) === 4, "pelo nome da raça: cargueiro é Gigantesca, 4×4");
  confere(ladoDoToken(ator({})) === null, "sem tamanho conhecido, não há lado");
}

/* ── O update do ator ─────────────────────────────────────────────────────── */
{
  const u = updateDoToken(ator({ tipo: "particular" }));
  confere(u?.["prototypeToken.width"] === 2 && u?.["prototypeToken.height"] === 2, "a particular devia ir a 2×2");
  confere(u?.["flags.spacedragon.nave.tokenLado"] === 2, "a nave devia ser marcada como ajustada");
  confere(updateDoToken(ator({ tipo: "particular", tokenLado: 2 }, { proto: { width: 2, height: 2 } })) === null,
    "já no tamanho e marcada, nada a fazer");
  confere(updateDoToken(ator({})) === null, "sem tamanho, nada a fazer");
}

/* ── Os tokens nas cenas ──────────────────────────────────────────────────── */
{
  const cena = { tokens: [
    { id: "t1", actorId: "n1", width: 1, height: 1 },
    { id: "t2", actorId: "n1", width: 6, height: 6 },
    { id: "t3", actorId: "outro", width: 1, height: 1 },
  ] };
  const fora = tokensForaDoTamanho(ator({ tipo: "cruzador" }), [cena]);
  confere(fora.length === 1 && fora[0].ids.join() === "t1", `só o token desta nave fora do tamanho, achei ${JSON.stringify(fora.map((f) => f.ids))}`);
  confere(tokensForaDoTamanho(ator({}), [cena]).length === 0, "sem tamanho, nenhum token");
}

/* ── Criar e trocar o tipo ────────────────────────────────────────────────── */
{
  const fonte = fs.readFileSync(path.join(RAIZ, "spacedragon-module", "module", "nave-nova.js"), "utf8");
  confere(/prototypeToken: \{ width: lado, height: lado \}/.test(fonte), "a nave criada pelo botão devia nascer no tamanho");
  confere(/await ajustarToken\(ator\);/.test(fonte), "trocar o tipo devia ajustar o token");
  const sd = fs.readFileSync(path.join(RAIZ, "spacedragon-module", "module", "spacedragon.js"), "utf8");
  confere(/ajustarTokensNoReady\(\)/.test(sd), "as naves que já existem deviam ser ajustadas no ready");
}

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log("  ✔ token da nave: 1×1 a 6×6 pelo tamanho, uma vez nas antigas, ao criar e ao trocar o tipo");
