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
// O modelo de dados do personagem, com os getters que o sistema define. É
// neste protótipo que o módulo troca a tabela de modificadores.
class FichaOD2 {
  get mod_forca() { return od2(this.forca); }
  get mod_destreza() { return od2(this.destreza); }
  get mod_constituicao() { return od2(this.constituicao); }
  get mod_inteligencia() { return od2(this.inteligencia); }
  get mod_sabedoria() { return od2(this.sabedoria); }
  get mod_carisma() { return od2(this.carisma); }
}
function od2(v) {
  if (v < 2) return -4;
  if (v < 4) return -3;
  if (v < 6) return -2;
  if (v < 9) return -1;
  if (v < 13) return 0;
  if (v < 15) return 1;
  if (v < 17) return 2;
  if (v < 19) return 3;
  return 4;
}
globalThis.CONFIG = {
  olddragon2e: { levels: niveisIniciais },
  sounds: {},
  Actor: { dataModels: { character: FichaOD2 } },
};
const opcoes = new Map();
globalThis.game = {
  i18n: { localize: (s) => s },
  settings: {
    register: (mod, chave, cfg) => opcoes.set(`${mod}.${chave}`, cfg.default),
    get: (mod, chave) => opcoes.get(`${mod}.${chave}`),
    set: (mod, chave, v) => opcoes.set(`${mod}.${chave}`, v),
  },
};
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

// ── A tabela de modificadores virou a do Space Dragon? ──────────────────────
//
// Os valores abaixo saem das T1-1 a T1-6 do Aprimorado, lidos à mão. O contraste
// com o Old Dragon 2 é o ponto: Constituição 9 dá 0 lá e -1 aqui, e Destreza 29
// nem existe na escala de lá.
const ficha = Object.assign(new CONFIG.Actor.dataModels.character(), {
  forca: 9, destreza: 29, constituicao: 9, inteligencia: 17, sabedoria: 1, carisma: 13,
});

const ESPERADO = {
  mod_forca: -1,          // T1-1, faixa 8-9
  mod_destreza: 9,        // T1-2, faixa 28-29 — fora da escala do OD2
  mod_constituicao: -1,   // T1-3, faixa 8-9. O OD2 daria 0
  mod_inteligencia: 15,   // T1-5 aptidão tecnológica, faixa 16-17, em %
  mod_sabedoria: -5,      // T1-4 proteção mental, valor 1
  mod_carisma: 5,         // T1-6 ajuste de reação, faixa 12-13, em %
};

const erros = [];
for (const [campo, valor] of Object.entries(ESPERADO)) {
  if (ficha[campo] !== valor) erros.push(`${campo} deu ${ficha[campo]}, esperava ${valor}`);
}

// E desligar a opção tem de devolver o sistema ao que ele era.
const { aplicarModificadores } = await import("../spacedragon-module/module/atributos.js");
aplicarModificadores(false);
if (ficha.mod_constituicao !== 0) {
  erros.push(`desligar não restaurou o OD2: Constituição 9 deu ${ficha.mod_constituicao}, esperava 0`);
}
aplicarModificadores(true);

if (erros.length) {
  for (const e of erros) console.error(`  ✘ ${e}`);
  process.exit(1);
}
console.log("  ✔ modificadores: escala do Space Dragon aplicada, e reversível");

// ── As moedas viraram Danos Mortais? ───────────────────────────────────────
//
// A marcação abaixo é a da caixa .economy do character-sheet.hbs do
// olddragon2e 2.6.0. Se o sistema mudar isso, o teste avisa em vez de a ficha
// simplesmente continuar com peças de ouro.
const CABECALHO = `
<div class="economy border">
  <label class="font-bold">Economia</label>
  <div class="currency">
    <div class="gp"><input name="system.economy.gp" type="text" value="120"></div>
    <div class="sp"><input name="system.economy.sp" type="text" value="0"></div>
    <div class="cp"><input name="system.economy.cp" type="text" value="0"></div>
  </div>
</div>`;

const cab = monta(CABECALHO);
// Constituição 9 → faixa 8-9 → morre em -9. O Old Dragon 2 mataria em -10 fixo.
const atorCab = {
  type: "character",
  name: "Cobaia",
  isOwner: true,
  system: { class: { name: "Gatuno" }, level: 1, constituicao: 9, economy: { gp: 120 } },
  update: async () => {},
};

const trocaCab = ganchos.filter((g) => g.nome === "renderOD2CharacterSheet");
for (const g of trocaCab) g.fn({ actor: atorCab }, cab);

const falhasCab = [];
// A moldura e o título saem: sobram dois campos rotulados, como nas outras
// caixas do cabeçalho.
const economia = cab.querySelector(".economy");
if (economia?.classList.contains("border")) falhasCab.push("a moldura da caixa sobreviveu");
const rotuloMortais = cab.querySelector(".sd-mortais label")?.textContent.trim();
if (rotuloMortais !== "Danos Mortais") falhasCab.push(`o campo ficou rotulado "${rotuloMortais}"`);
if (cab.querySelectorAll(".sd-mortais label").length !== 1) falhasCab.push("rótulo duplicado");

const valorMortais = cab.querySelector(".sd-mortais input")?.atributos.value;
if (valorMortais !== "-9") falhasCab.push(`danos mortais deu ${valorMortais}, esperava -9 para Constituição 9`);

const cr = cab.querySelector(".sd-creditos input");
if (cr?.atributos.name !== "system.economy.gp") falhasCab.push("os créditos não gravam em system.economy.gp");
if (cr?.atributos.value !== "120") falhasCab.push(`créditos vieram ${cr?.atributos.value}, esperava 120`);

if (cab.querySelectorAll(".sp").length || cab.querySelectorAll(".cp").length) {
  falhasCab.push("prata ou cobre sobreviveram à troca");
}
// Rodar de novo não pode desfazer nem duplicar.
for (const g of trocaCab) g.fn({ actor: atorCab }, cab);
if (cab.querySelectorAll(".sd-mortais").length !== 1) falhasCab.push("renderizar duas vezes duplicou a caixa");

if (falhasCab.length) {
  for (const f of falhasCab) console.error(`  ✘ ${f}`);
  process.exit(1);
}
console.log("  ✔ cabeçalho: sem moldura, campo \"Danos Mortais\" −9, créditos em system.economy.gp");
