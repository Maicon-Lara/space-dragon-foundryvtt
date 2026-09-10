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
