/**
 * O custo total dos itens (module/custo.js).
 *
 * ── O BUG QUE ISTO EXISTE PARA NÃO DEIXAR VOLTAR ────────────────────────────
 *
 * A mesa relatou que aparatos e feitos científicos "não arrastavam" para a
 * ficha. O item era criado; o que quebrava era o redesenho: o `total_cost` do
 * Old Dragon 2 faz `cost.match(/\d+/)[0]`, e "Variável", "Nenhum" e
 * "Indefinido" não têm dígito. A ficha desenha esse getter em cada linha do
 * inventário, e o TypeError parava a ficha inteira.
 *
 * Aqui o getter do sistema é COPIADO como está (olddragon2e,
 * OD2EquipmentDataModel), envolvido pelo mesmo caminho que o módulo usa no
 * `ready`, e lido com o custo de cada item dos compêndios.
 *
 *     node tools/teste-custo.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

/** O getter do sistema, copiado sem mudar a lógica. */
class ModeloDoSistema {
  constructor(cost, quantity = 1) { this.cost = cost; this.quantity = quantity; }
  get total_cost() {
    let cost = this.cost;
    const quantity = this.quantity;
    if (!cost) return "0";
    cost = cost.toUpperCase();
    let isPO = cost.match("PO") != null;
    const isPP = cost.match("PP") != null;
    const isPC = cost.match("PC") != null;
    const match = cost.match(/\d+/);
    const costValue = match[0];
    const totalCost = costValue * Number(quantity);
    if (totalCost <= 0) return cost;
    if (!isPO && !isPP && !isPC) isPO = true;
    if (isPP) return Math.trunc(totalCost / 10) > 0 ? `${Math.trunc(totalCost / 10)} PO` : `${totalCost} PP`;
    if (isPC) {
      if (Math.trunc(totalCost / 100) > 0) return `${Math.trunc(totalCost / 100)} PO`;
      if (Math.trunc(totalCost / 10) > 0) return `${Math.trunc(totalCost / 10)} PP`;
      return `${totalCost} PC`;
    }
    return `${totalCost} PO`;
  }
}

/* ── 1. O sistema, sozinho, quebra — senão o teste não prova nada ───────── */
{
  let quebrou = false;
  try { void new ModeloDoSistema("Variável").total_cost; } catch { quebrou = true; }
  confere(quebrou, "a cópia do getter do sistema devia quebrar com \"Variável\"");
}

/* ── 2. A regra pura ────────────────────────────────────────────────────── */
const { custoTotal, milhar, ligarCusto } = await import("../spacedragon-module/module/custo.js");
{
  const casos = [
    ["Variável", 1, "Variável"],
    ["Nenhum", 3, "Nenhum"],
    ["Indefinido", 1, "Indefinido"],
    ["$180.000", 1, "$180.000"],
    ["$180.000", 2, "$360.000"],
    ["$2.000.000", 1, "$2.000.000"],
    ["80.000 créditos", 1, "80.000 créditos"],
    ["5.000 créditos", 4, "20.000 créditos"],
    ["10 PO", 1, null],
    ["", 1, null],
    [undefined, 1, null],
    ["$180.000", 0, "$180.000"],
  ];
  for (const [custo, qtd, esperado] of casos) {
    const deu = custoTotal(custo, qtd);
    confere(deu === esperado, `custoTotal(${JSON.stringify(custo)}, ${qtd}) devia ser ${JSON.stringify(esperado)}, deu ${JSON.stringify(deu)}`);
  }
  confere(milhar(1234567) === "1.234.567", `milhar(1234567) deu ${milhar(1234567)}`);
}

/* ── 3. O envelope, pelo mesmo caminho do `ready` ───────────────────────── */
globalThis.CONFIG = { Item: { dataModels: { misc: ModeloDoSistema } } };
confere(ligarCusto() === true, "ligarCusto() não registrou o envelope");
{
  confere(new ModeloDoSistema("10 PO", 2).total_cost === "20 PO", "custo em PO tem de continuar com a conta do sistema");
  confere(new ModeloDoSistema("").total_cost === "0", "custo vazio tem de continuar com a conta do sistema");
}

/* ── 4. Todo item dos compêndios desenha ────────────────────────────────── */
{
  const dir = path.join(RAIZ, "packs-src");
  let lidos = 0;
  for (const pack of fs.readdirSync(dir)) {
    const d = path.join(dir, pack);
    if (!fs.statSync(d).isDirectory()) continue;
    for (const f of fs.readdirSync(d)) {
      if (!f.endsWith(".json")) continue;
      const doc = JSON.parse(fs.readFileSync(path.join(d, f), "utf8"));
      if (!doc.system || !("cost" in doc.system)) continue;
      lidos += 1;
      try {
        const total = new ModeloDoSistema(doc.system.cost, doc.system.quantity ?? 1).total_cost;
        confere(typeof total === "string", `${pack}/${doc.name}: total_cost não é texto`);
        // crédito não vira PO: era o "$180.000 → 180 PO" da ficha
        if (/\$|cr[eé]dito/i.test(doc.system.cost)) {
          confere(!/PO$/.test(total), `${pack}/${doc.name}: "${doc.system.cost}" virou "${total}"`);
        }
      } catch (e) {
        problemas.push(`${pack}/${doc.name}: total_cost quebra com "${doc.system.cost}" (${e.message})`);
      }
    }
  }
  confere(lidos > 80, `só ${lidos} itens com custo foram lidos — o caminho dos packs mudou?`);
}

/* ── 5. Nenhum custo de aparato com o ponto de milhar pela metade ───────── */
{
  const { APARATOS } = await import("./data/aparatos.mjs");
  for (const a of APARATOS) {
    if (/\d/.test(a.custo)) confere(/^\$\d{1,3}(\.\d{3})+$/.test(a.custo), `${a.nome}: custo "${a.custo}" fora do formato $000.000`);
  }
}

if (problemas.length) {
  console.error(`teste-custo: ${problemas.length} problema(s)\n  ` + problemas.join("\n  "));
  process.exit(1);
}
console.log("teste-custo: ok");
