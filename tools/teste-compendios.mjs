/**
 * Os compêndios continuam arrumados.
 *
 * ── POR QUE ISTO EXISTE ─────────────────────────────────────────────────────
 *
 * Até a 1.26 toda pasta nascia com `sort: 0`, e o Foundry desempatava pelo
 * nome: a "10ª Grandeza" vinha antes da "1ª", o "Mutante" antes do "Humano".
 * Nada quebrava; a lista só ficava errada, e ninguém escreve teste para o que
 * não quebra. Este escreve.
 *
 *   · pastas irmãs têm posições DIFERENTES (senão o nome decide a ordem);
 *   · nenhuma pasta-raiz repete o nome do compêndio (um clique à toa);
 *   · todo compêndio está numa pasta do manifesto, uma vez só;
 *   · os journals têm o capítulo no nome, em ordem.
 *
 * Lê packs-src, que é saída do build: rode `npm run build` antes.
 *
 *     node tools/teste-compendios.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(RAIZ, "packs-src");
const manifesto = JSON.parse(fs.readFileSync(path.join(RAIZ, "spacedragon-module", "module.json"), "utf8"));

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

/* ── O manifesto: todo compêndio numa pasta, uma vez ───────────────────── */
{
  const nomes = manifesto.packs.map((p) => p.name);
  const nasPastas = [];
  const percorre = (fs_) => fs_.forEach((f) => { nasPastas.push(...(f.packs ?? [])); percorre(f.folders ?? []); });
  percorre(manifesto.packFolders ?? []);
  for (const n of nomes) confere(nasPastas.filter((x) => x === n).length === 1, `o compêndio ${n} não está em exatamente uma pasta do packFolders`);
  for (const n of nasPastas) confere(nomes.includes(n), `packFolders cita ${n}, que não é compêndio do módulo`);
  for (const p of manifesto.packs) confere(/^Space Dragon — /.test(p.label), `o rótulo "${p.label}" não segue o padrão "Space Dragon — …"`);
}

/* ── As pastas de cada compêndio ───────────────────────────────────────── */
if (!fs.existsSync(SRC)) {
  problemas.push("packs-src não existe — rode `npm run build` antes");
} else {
  for (const pack of fs.readdirSync(SRC)) {
    const docs = fs.readdirSync(path.join(SRC, pack))
      .filter((f) => f.endsWith(".json"))
      .map((f) => JSON.parse(fs.readFileSync(path.join(SRC, pack, f), "utf8")));
    const pastas = docs.filter((d) => d._key?.startsWith("!folders!"));
    const rotulo = manifesto.packs.find((p) => p.name === pack)?.label ?? pack;

    const irmas = new Map();
    for (const p of pastas) {
      const k = p.folder ?? "(raiz)";
      if (!irmas.has(k)) irmas.set(k, []);
      irmas.get(k).push(p);
    }
    for (const lista of irmas.values()) {
      if (lista.length < 2) continue;
      const sorts = lista.map((p) => p.sort ?? 0);
      confere(new Set(sorts).size === sorts.length,
        `${pack}: pastas irmãs com a mesma posição (${lista.map((p) => `${p.name}=${p.sort}`).join(", ")}) — o nome decide a ordem`);
    }

    const raizes = pastas.filter((p) => !p.folder);
    if (raizes.length === 1) {
      const nomeDoPack = rotulo.replace(/^Space Dragon — /, "");
      confere(raizes[0].name !== nomeDoPack,
        `${pack}: a única pasta-raiz se chama "${raizes[0].name}", o mesmo nome do compêndio — é um clique a mais`);
    }

    if (pack === "spacedragon-journal") {
      const caps = docs.filter((d) => !d._key?.startsWith("!folders!"))
        .sort((a, b) => a.sort - b.sort)
        .map((d) => Number(d.name.match(/^Cap\. (\d+) — /)?.[1]));
      confere(caps.every((n) => n > 0), "algum journal não começa com \"Cap. N — \"");
      confere(caps.every((n, i) => i === 0 || n > caps[i - 1]), `os journals não estão na ordem dos capítulos: ${caps.join(", ")}`);
    }
  }
}

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log("  ✔ compêndios: todos numa pasta do manifesto, pastas irmãs em ordem própria, sem raiz repetida, journals por capítulo");
