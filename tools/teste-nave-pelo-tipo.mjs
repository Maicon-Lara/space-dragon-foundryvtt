/**
 * Os dois caminhos de criar nave levam à Ficha de Nave.
 *
 * ── O RELATO DA MESA ────────────────────────────────────────────────────────
 *
 * O botão "Nova nave" não aparecia ao abrir o mundo: ele era posto num gancho
 * de render, e a aba de Atores já estava desenhada quando o módulo terminava de
 * carregar. A mesa criou a nave pelo "Criar Ator" do Foundry, arrastou o Caça,
 * e o ator ficou na ficha de PERSONAGEM — as doze câmaras sem botão.
 *
 *   · o botão entra também na aba já desenhada;
 *   · um tipo de nave que entra num personagem o transforma em nave.
 *
 *     node tools/teste-nave-pelo-tipo.mjs
 */

import { tipoDeNaveDoItem, viraNave, porBotaoDeNovaNave, ligarBotaoDeNovaNave } from "../spacedragon-module/module/nave-nova.js";

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

/* ── O tipo de nave é reconhecido ──────────────────────────────────────── */
confere(tipoDeNaveDoItem({ type: "race", name: "Qualquer", flags: { spacedragon: { tipoDeNave: "caca" } } }) === "caca",
  "o tipo marcado pela flag do build não foi reconhecido");
confere(tipoDeNaveDoItem({ type: "race", name: "Cargueiro", flags: {} }) === "cargueiro",
  "o tipo copiado antes da flag (pelo nome) não foi reconhecido");
confere(tipoDeNaveDoItem({ type: "race", name: "Humano", flags: {} }) === null, "Humano virou tipo de nave");
confere(tipoDeNaveDoItem({ type: "class", name: "Caça", flags: {} }) === null, "a CLASSE Caça não deve transformar o ator");

/* ── O personagem vira nave ────────────────────────────────────────────── */
{
  const personagem = { type: "character", flags: {}, getFlag: () => undefined };
  const u = viraNave(personagem, "particular");
  confere(u?.["flags.core.sheetClass"] === "spacedragon.NaveSheet", "o ator não passou para a Ficha de Nave");
  confere(u?.["flags.spacedragon.nave"]?.tamanho === "Média", "a flag da nave não ganhou o tamanho do tipo");
  confere(u?.["flags.spacedragon.nave"]?.tipo === "particular", "a flag da nave não ganhou o tipo");

  const jaNave = {
    type: "character",
    flags: { core: { sheetClass: "spacedragon.NaveSheet" }, spacedragon: { nave: { tipo: "particular", tamanho: "Média" } } },
  };
  confere(viraNave(jaNave, "particular") === null, "uma nave pronta recebeu update à toa");
  confere(viraNave({ type: "monster", flags: {} }, "caca") === null, "um monstro virou nave");
}

/* ── O botão entra na aba que JÁ está desenhada ────────────────────────── */
{
  const filhos = [];
  const cabeca = { querySelector: () => filhos.find(Boolean) ?? null, append: (b) => filhos.push(b) };
  const aba = { querySelector: (sel) => (/header-actions/.test(sel) ? cabeca : null) };
  globalThis.HTMLElement ??= class {};
  globalThis.document = {
    createElement: () => ({ addEventListener() {}, set innerHTML(v) { this.html = v; }, get innerHTML() { return this.html; } }),
  };
  const ganchos = [];
  globalThis.Hooks = { on: (nome) => ganchos.push(nome) };
  globalThis.ui = { actors: { element: aba } };
  ligarBotaoDeNovaNave();
  confere(filhos.length === 1 && /Nova nave/.test(filhos[0].html), "o botão não entrou na aba de Atores que já estava na tela");
  confere(ganchos.includes("renderActorDirectory"), "o gancho para os próximos desenhos sumiu");
  confere(porBotaoDeNovaNave(aba) === false && filhos.length === 1, "o botão foi posto duas vezes");
}

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log("  ✔ nave pelo tipo: o botão entra na aba já desenhada, e o tipo de nave arrastado transforma o personagem em nave, com tipo e tamanho");
