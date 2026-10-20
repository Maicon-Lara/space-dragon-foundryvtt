/**
 * Nenhum documento do compêndio troca de ID.
 *
 * ── POR QUE ISTO EXISTE ─────────────────────────────────────────────────────
 *
 * O ID é o que liga o item que a mesa importou ao compêndio de onde ele veio
 * (`_stats.compendiumSource`) e o que os links `@UUID[...]` dos journals
 * apontam. Ele sai de uma SEMENTE — quase sempre o nome —, e renomear um
 * documento troca o ID em silêncio: o build passa, os testes passam, e o mundo
 * da mesa fica com itens órfãos e links quebrados.
 *
 * Por isso existem `seedNome` (itens) e `seedTitle` (journals). Este teste é a
 * rede para quando alguém esquecer de usá-los: compara o que o build gerou com
 * a lista guardada em tools/ids-estaveis.json, e falha se um ID SUMIR.
 *
 * ID novo é normal (conteúdo novo) e não falha; para registrá-lo:
 *
 *     node tools/teste-ids.mjs --atualizar
 *
 * Lê packs-src, que é saída do build: rode `npm run build` antes.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(RAIZ, "packs-src");
const LISTA = path.join(RAIZ, "tools", "ids-estaveis.json");

/** id → "pack · nome", de documentos, páginas de journal e resultados de tabela. */
function idsAtuais() {
  const ids = {};
  for (const pack of fs.readdirSync(SRC).sort()) {
    for (const f of fs.readdirSync(path.join(SRC, pack)).filter((n) => n.endsWith(".json")).sort()) {
      const d = JSON.parse(fs.readFileSync(path.join(SRC, pack, f), "utf8"));
      if (d._key?.startsWith("!folders!")) continue; // pasta não é referenciada de fora
      ids[d._id] = `${pack} · ${d.name}`;
      for (const p of d.pages ?? []) ids[p._id] = `${pack} · ${d.name} › ${p.name}`;
      for (const r of d.results ?? []) ids[r._id] = `${pack} · ${d.name} › resultado`;
    }
  }
  return ids;
}

if (!fs.existsSync(SRC)) {
  console.error("  ✘ packs-src não existe — rode `npm run build` antes");
  process.exit(1);
}

const atuais = idsAtuais();

if (process.argv.includes("--atualizar")) {
  const ordenado = Object.fromEntries(Object.entries(atuais).sort(([, a], [, b]) => a.localeCompare(b)));
  fs.writeFileSync(LISTA, JSON.stringify(ordenado, null, 1) + "\n");
  console.log(`  ✔ ids-estaveis.json: ${Object.keys(ordenado).length} IDs registrados`);
  process.exit(0);
}

const guardados = JSON.parse(fs.readFileSync(LISTA, "utf8"));
const sumiram = Object.entries(guardados).filter(([id]) => !(id in atuais));
const novos = Object.keys(atuais).filter((id) => !(id in guardados));

if (sumiram.length) {
  console.error(`  ✘ ${sumiram.length} ID(s) sumiram — itens já importados nos mundos perdem o vínculo:`);
  for (const [id, onde] of sumiram.slice(0, 20)) console.error(`      ${id}  ${onde}`);
  console.error("    Se foi renomeação, use seedNome/seedTitle com o nome antigo. Se foi remoção de propósito,");
  console.error("    rode `node tools/teste-ids.mjs --atualizar` e diga no changelog o que saiu.");
  process.exit(1);
}
console.log(
  `  ✔ ids: os ${Object.keys(guardados).length} IDs registrados continuam no compêndio` +
    (novos.length ? ` (${novos.length} novo(s) — registre com --atualizar)` : "")
);
