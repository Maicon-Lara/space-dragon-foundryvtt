/**
 * As armas do compêndio, do jeito que a automação de combate as lê.
 *
 * O campo de dano vai direto para a fórmula do sistema e do Qualidade de Vida,
 * que só oferece como munição o item do tipo `ammunition`. Os valores esperados
 * vêm da T5-1 do livro.
 *
 *     node tools/teste-armas-automacao.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PASTA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "packs-src", "spacedragon-equipamento");
const armas = fs.readdirSync(PASTA).filter((n) => n.includes("__weapon__"))
  .map((n) => JSON.parse(fs.readFileSync(path.join(PASTA, n), "utf8")));
const porNome = Object.fromEntries(armas.map((a) => [a.name, a.system]));

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

confere(armas.length === 32, `esperava as 32 armas da T5-1, achei ${armas.length}`);
for (const a of armas) {
  const d = a.system.damage;
  confere(d === "" || /^\d*d\d+$/i.test(d), `[ARMA-DANO] ${a.name}: "${d}" não é fórmula que a ficha role`);
}
for (const [nome, dano] of Object.entries({
  "Granada Elétrica (1)": "1d8", "Granada Explosiva (1)": "1d10", "Míssil (1)": "2d8", "Pistola Autodestrutiva": "1d6",
})) confere(porNome[nome]?.damage === dano, `[ARMA-AREA] ${nome}: dano ${porNome[nome]?.damage}`);
for (const nome of ["Arco para Flechas", "Lança-Granadas", "Lança-Mísseis", "Projéteis (30)", "Zarabatana", "Potencializador", "Projéteis Explosivos (10)"]) {
  confere(porNome[nome]?.damage === "", `[ARMA-SEM] ${nome} não tem dano próprio no campo`);
}
for (const nome of ["Flecha (20)", "Dardo para Zarabatana (1)", "Míssil (1)", "Projéteis (30)", "Projéteis Explosivos (10)"]) {
  confere(porNome[nome]?.type === "ammunition", `[ARMA-MUNICAO] ${nome}: tipo ${porNome[nome]?.type}`);
}
confere(porNome["Granada Elétrica (1)"]?.type === "throwing", "[ARMA-MUNICAO] granada continua de arremesso");
confere(porNome["Pistola Laser"]?.type === "ranged" && porNome["Pistola Laser"]?.damage === "1d6", "[ARMA-DANO] arma comum não muda");
confere(/JPR/.test(porNome["Granada Elétrica (1)"]?.description ?? ""), "[ARMA-AREA] a regra da área continua na descrição");

if (problemas.length) {
  console.error(`✘ ${problemas.length} problema(s):\n  ${problemas.join("\n  ")}`);
  process.exit(1);
}
console.log("✔ Armas: fórmulas e munições conferem.");
