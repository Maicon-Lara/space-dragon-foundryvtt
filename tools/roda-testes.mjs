/**
 * Roda todos os testes de uma vez, pelo runner nativo do Node.
 *
 * ── POR QUE ISTO EXISTE ─────────────────────────────────────────────────────
 *
 * Os testes eram 24 comandos encadeados com `&&` dentro do script `build` do
 * package.json. O primeiro que falhava escondia os outros, e cada build
 * esperava os 24 em fila. Aqui eles rodam em PARALELO, cada um no próprio
 * processo, e o resumo diz quais passaram e quais não.
 *
 * Nada muda nos testes: cada arquivo continua sendo um script que sai com
 * código 0 ao passar e diferente de 0 ao falhar — é exatamente isso que o
 * runner do Node entende como "passou" e "falhou" para arquivos que não usam
 * `node:test`. Um teste novo é só um `tools/teste-<nome>.mjs` a mais.
 *
 *     npm test
 *     node tools/roda-testes.mjs --filtro nave     # só os que têm "nave" no nome
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { run } from "node:test";
import { spec } from "node:test/reporters";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const filtro = process.argv.includes("--filtro") ? process.argv[process.argv.indexOf("--filtro") + 1] : null;

const arquivos = fs
  .readdirSync(AQUI)
  .filter((n) => /^teste-.*\.mjs$/.test(n) || n === "verifica.mjs" || n === "fumaca.mjs")
  .filter((n) => !filtro || n.includes(filtro))
  .sort()
  .map((n) => path.join(AQUI, n));

if (!arquivos.length) {
  console.error("nenhum teste encontrado");
  process.exit(1);
}

let falhas = 0;
run({ files: arquivos, concurrency: true })
  .on("test:fail", () => { falhas += 1; })
  .on("end", () => { process.exitCode = falhas ? 1 : 0; })
  .compose(spec)
  .pipe(process.stdout);
