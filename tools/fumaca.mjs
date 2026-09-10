/**
 * Teste de fumaça: o script do módulo CARREGA?
 *
 * ── POR QUE ISTO EXISTE ─────────────────────────────────────────────────────
 *
 * A v0.8.2 foi publicada com um `import { TESTES } from "./testes.js"` que o
 * `testes.js` não exportava. Isso é SyntaxError na resolução do módulo, e o
 * Foundry simplesmente NÃO CARREGA o esmodule inteiro — sem diálogo de erro,
 * sem nada na tela. O resultado foi uma ficha sem nenhum botão de rolagem e
 * travada no 15º nível, e o único sintoma visível era a ausência de sintoma.
 *
 * O `lang` continua funcionando nesse cenário, porque não depende de JS. Foi
 * justamente isso que disfarçou a falha: os rótulos certos na tela davam a
 * impressão de que o módulo estava vivo.
 *
 * Aqui o módulo é importado de verdade, com o mínimo do Foundry fingido, e o
 * gancho `ready` é executado. Qualquer erro de import, de nome exportado ou de
 * código de topo estoura o build.
 *
 * ⚠️ Não é substituto de testar na mesa: nada aqui prova que o seletor de CSS
 * casa com a ficha real. Prova que o módulo SOBE.
 *
 *     npm run fumaca
 */

const niveisIniciais = Object.fromEntries(
  Array.from({ length: 15 }, (_, i) => [i + 1, `olddragon2e.levels.${i + 1}`])
);

// ── O mínimo do Foundry ─────────────────────────────────────────────────────
// Só o que o módulo toca no caminho de carga. `Hooks.once` roda o retorno na
// hora, que é o ponto: queremos executar o `ready` e ver o que ele faz.
const ganchos = [];
globalThis.Hooks = {
  on: (nome, fn) => ganchos.push({ nome, fn }),
  once: (_nome, fn) => fn(),
};
globalThis.CONFIG = { olddragon2e: { levels: niveisIniciais }, sounds: {} };
globalThis.game = { i18n: { localize: (s) => s } };
globalThis.ui = { notifications: { warn: () => {}, error: () => {} }, windows: {} };
globalThis.foundry = { applications: { api: {} } };
globalThis.Roll = class { async evaluate() { this.total = 1; return this; } };
globalThis.ChatMessage = { getSpeaker: () => ({}), create: async () => {} };
globalThis.FormDataExtended = class { constructor() { this.object = {}; } };

await import("../spacedragon-module/module/spacedragon.js");

// ── O que o `ready` tinha de ter feito ──────────────────────────────────────
const falhas = [];

const api = globalThis.game.spacedragon;
if (!api) falhas.push("game.spacedragon não foi criado");
else {
  for (const m of ["teste", "rolar", "preparar", "TESTES"]) {
    if (!api[m]) falhas.push(`game.spacedragon.${m} está faltando`);
  }
  if (Array.isArray(api.TESTES) && !api.TESTES.length) falhas.push("TESTES veio vazio");
}

const niveis = Object.keys(CONFIG.olddragon2e.levels).map(Number);
const teto = Math.max(...niveis);
if (teto !== 20) falhas.push(`o seletor de nível parou no ${teto}º, devia ir ao 20º`);

if (!ganchos.some((g) => g.nome === "renderOD2CharacterSheet")) {
  falhas.push("ninguém se registrou em renderOD2CharacterSheet");
}

if (falhas.length) {
  for (const f of falhas) console.error(`  ✘ ${f}`);
  process.exit(1);
}

console.log(
  `  ✔ fumaça: módulo carrega, ${api.TESTES.length} testes na API, ` +
  `nível até o ${teto}º, ${ganchos.length} gancho(s) registrado(s)`
);

// ── A injeção acha as habilidades na ficha? ─────────────────────────────────
//
// O HTML abaixo é o que o template do olddragon2e produz para a aba de Classe
// (templates/partials/tabs/character-tab-class.hbs, sistema 2.6.0). Se o
// sistema mudar essa marcação, este teste quebra — que é exatamente o aviso
// que faltou quando a injeção parou de achar as habilidades em silêncio.
import { monta } from "./dom-minimo.mjs";

const FICHA = `
<div class="character-tab-class">
  <div class="class-abilities">
    <ol class="item-list">
      <li class="item" data-item-id="aaa">
        <div class="ability">
          <span class="ability-level">1</span>
          <span><strong>Talentos de Gatuno</strong>:</span>
        </div>
        <p>Seis talentos, cada um com progressao propria.</p>
      </li>
      <li class="item" data-item-id="bbb">
        <div class="ability">
          <span class="ability-level">1</span>
          <span><strong>Nao Existe Este Poder</strong>:</span>
        </div>
      </li>
    </ol>
  </div>
</div>`;

const raiz = monta(FICHA);
const ator = {
  type: "character",
  name: "Cobaia",
  system: { class: { name: "Sabotador — Gatuno" }, level: 7, destreza: 16, inteligencia: 14 },
};

const render = ganchos.find((g) => g.nome === "renderOD2CharacterSheet");
render.fn({ actor: ator }, raiz);

const botoes = raiz.querySelectorAll(".sd-rolar");
const chaves = botoes.map((b) => b.dataset.teste);
const esperadas = api.TESTES.filter((t) => t.habilidade === "Talentos de Gatuno").map((t) => t.chave);

const problemas = [];
if (!botoes.length) problemas.push("nenhum botão foi injetado na ficha de brinquedo");
if (chaves.join() !== esperadas.join()) {
  problemas.push(`botões errados: ${chaves.join(", ") || "(nenhum)"} — esperava ${esperadas.join(", ")}`);
}
// O poder sem teste não pode receber nada.
const intruso = raiz.querySelectorAll(".item").find(
  (li) => li.querySelector(".ability strong")?.textContent === "Nao Existe Este Poder"
);
if (intruso?.querySelector(".spacedragon-testes")) {
  problemas.push("injetou num poder que não tem teste nenhum");
}
// Rodar duas vezes não pode duplicar.
render.fn({ actor: ator }, raiz);
if (raiz.querySelectorAll(".sd-rolar").length !== botoes.length) {
  problemas.push("renderizar duas vezes duplicou os botões");
}
// Os alvos têm de vir CALCULADOS, não copiados da tabela.
//
// Gatuno de 7º nível, T3-5: sabotagem 45%, escalar 86%, furtividade 50%,
// furtar 50%, percepção 1-3. Destreza 16 dá +15% e Ciência 14 dá +10% de
// aptidão tecnológica — lidos à mão nas T1-2 e T1-5 do Aprimorado.
const alvos = raiz.querySelectorAll(".sd-alvo").map((n) => n.textContent.trim());
const esperados = ["55%", "86%", "65%", "65%", "1–3"];
if (alvos.join(" ") !== esperados.join(" ")) {
  problemas.push(`alvos ${alvos.join(" ")} — esperava ${esperados.join(" ")}`);
}

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log(`  ✔ injeção: ${botoes.length} botões no poder certo (${chaves.join(", ")}), alvos ${alvos.join(" ")}`);
