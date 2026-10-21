/**
 * O `ready` do módulo não deixa um passo derrubar os outros.
 *
 * ── POR QUE ISTO EXISTE ─────────────────────────────────────────────────────
 *
 * Os passos do `ready` rodavam em fila, sem proteção, e as naves vinham por
 * último. Na mesa, um deles caiu, e a Ficha de Nave e o botão de criar nave
 * sumiram: a nave abriu na ficha do sistema, com as doze câmaras sem botão.
 * Os testes passavam, porque em Node nenhum passo caía.
 *
 * Este teste lê a FONTE: todo passo passa por `passo(...)`, e a Ficha de Nave
 * vem logo depois da ficha de que depende.
 *
 *     node tools/teste-ready.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fonte = fs.readFileSync(path.join(RAIZ, "spacedragon-module", "module", "spacedragon.js"), "utf8");
const ready = fonte.slice(fonte.indexOf('Hooks.once("ready"'));

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

// nenhuma chamada solta de registrar/ligar/aplicar/migrar/avisar/estende/ordenar no ready
const soltas = [...ready.matchAll(/^\s{2}(registrar\w*|ligar\w*|aplicar\w*|migrar\w*|avisar\w*|estende\w*|ordenar\w*)\(/gm)].map((m) => m[1]);
confere(soltas.length === 0, `passos fora do passo(...) no ready: ${soltas.join(", ")} — um erro neles derruba o resto`);

const ordem = ["registrarFicha(", "registrarFichaAmeaca(", "registrarFichaDeNavePC(", "ligarBotaoDeNovaNave(", "aplicarModificadores("];
const pos = ordem.map((t) => ready.indexOf(t));
confere(pos.every((p) => p > 0), `faltam passos no ready: ${ordem.filter((t, i) => pos[i] < 0).join(", ")}`);
confere(pos.every((p, i) => i === 0 || p > pos[i - 1]),
  "a Ficha de Nave e o botão têm de vir logo depois das fichas de personagem e de ameaça, antes de todo o resto");
confere(/notifications\?\.error\?\.\(txt\("spacedragon\.aviso\.passosFalharam"/.test(ready),
  "o passo que falha não é avisado na tela do Mestre");

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log("  ✔ ready: todo passo isolado, a Ficha de Nave logo depois da ficha de que depende, e a falha avisada na tela");
