/**
 * O botão "Usar" e a tabela de automação (automacao.js).
 *
 * Os números vêm do texto do livro. ⚠️ Com um Foundry de brinquedo: prova as
 * contas e gravações, não que a API real e o outro módulo se comportem igual.
 *
 *   · [AUTO-TABELA]  todo nome da tabela existe nos compêndios;
 *   · [AUTO-LIVRO]   as fórmulas e as JP dos itens principais;
 *   · [AUTO-JP]      falhou: cheio; "metade" e "anula" ao passar;
 *   · [AUTO-USO]     área: um dano só; ataque: só quem foi acertado;
 *   · [AUTO-ALVO]    dono aplica uma vez; não dono não; cura respeita o máximo;
 *   · [AUTO-MENTAL]  dano mental drena Intelecto e não tira PV.
 *
 *     node tools/teste-automacao.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { instalarLang } from "./lang-de-teste.mjs";

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

const roteiro = {};
globalThis.Roll = class {
  constructor(f) { this.formula = f; }
  async evaluate() {
    if (/^1d20/.test(this.formula)) {
      const nat = roteiro.d20?.shift() ?? 10;
      const mod = this.formula.replace(/^1d20/, "").replace(/\s+/g, "").match(/[+-]\d+/g)?.reduce((s, x) => s + Number(x), 0) ?? 0;
      this.dice = [{ total: nat }];
      this.total = nat + mod;
    } else this.total = roteiro[this.formula]?.shift() ?? 1;
    return this;
  }
};
const mensagens = [];
globalThis.ChatMessage = { create: async (d) => { mensagens.push(d); return d; }, getSpeaker: () => ({}) };
const avisos = [];
globalThis.ui = { notifications: { warn: (m) => avisos.push(m), info: () => {} } };
globalThis.CONFIG = {};
globalThis.Hooks = { on() {}, once() {} };
let dialogo = null;
globalThis.foundry = { applications: { api: { DialogV2: { wait: async () => dialogo } } } };
globalThis.game = { user: { targets: new Set() }, actors: { getName: () => null }, settings: { get: () => undefined } };
instalarLang();

const { AUTOMACAO_DE_ITENS: T, ESPECIAIS_DE_CRIATURAS: E, chaveDoNome } = await import("../spacedragon-module/module/automacao-dados.js");
const { automacaoDe, montarFormula, resultadoDaJp, rodadasDe, usarItem, aplicarNoAlvo } = await import("../spacedragon-module/module/automacao.js");

function setPath(obj, caminho, valor) {
  const partes = caminho.split(".");
  let o = obj;
  for (let i = 0; i < partes.length - 1; i += 1) o = o[partes[i]] ??= {};
  o[partes.at(-1)] = structuredClone(valor);
}
const novo = (id, extra = {}) => ({
  id, uuid: `Actor.${id}`, name: id, type: "character", isOwner: true, flags: {},
  system: { hp: { value: 20, max: 30 }, level: 8, bac: 5, bad: 6, mod_destreza: 2, jp: 12, jpd_total: 12, jpc_total: 12, jps_total: 12, ac_total: 15 },
  async update(m) { for (const [k, v] of Object.entries(m)) setPath(this, k, v); return this; },
  ...extra,
});

// [AUTO-TABELA]
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "packs-src");
const nomes = new Set();
const atributosCriaturas = new Set();
for (const pack of ["spacedragon-aparatos", "spacedragon-poderes", "spacedragon-bestiario", "spacedragon-equipamento"]) {
  for (const n of fs.readdirSync(path.join(RAIZ, pack))) {
    const d = JSON.parse(fs.readFileSync(path.join(RAIZ, pack, n), "utf8"));
    nomes.add(chaveDoNome(d.name));
    for (const i of d.items ?? []) if (i.type === "monster_attack") atributosCriaturas.add(`${chaveDoNome(d.name)}|${chaveDoNome(i.system?.description)}`);
  }
}
for (const k of Object.keys(T)) confere(nomes.has(k), `[AUTO-TABELA] "${k}" não existe nos compêndios`);
for (const k of Object.keys(E)) confere(atributosCriaturas.has(k), `[AUTO-TABELA] ataque "${k}" não existe no bestiário`);

// [AUTO-LIVRO]
confere(T["cortador laser"].dano === "1d4+{des}" && T["cortador laser"].ataque === "bac", "[AUTO-LIVRO] Cortador Laser");
confere(T["metralhadora energetica"].ataques === 4 && T["metralhadora energetica"].dano === "1d10", "[AUTO-LIVRO] Metralhadora: 4 disparos de 1d10");
confere(T["canhao de fotons"].modos.map((m) => m.dano).join() === "2d10,2d12,4d8" && T["canhao de fotons"].aoPassar === "metade", "[AUTO-LIVRO] Canhão de Fótons");
confere(T["lanca-chamas"].modos.map((m) => m.dano).join() === "5d10,5d6,5d4", "[AUTO-LIVRO] Lança-Chamas");
confere(T["missil teleguiado"].aoPassar === "anula" && T["missil teleguiado"].dano === "2d10", "[AUTO-LIVRO] Míssil Teleguiado");
confere(T["choque mental"].dreno.formula === "1d4" && T["choque mental"].jp === "jpm", "[AUTO-LIVRO] Choque Mental");
confere(T["atormentar mente"].efeito.mods.every((m) => m.value === -8), "[AUTO-LIVRO] Atormentar: −8");
confere(!T["disparo mental"].jp && !T["disparo mental"].dreno, "[AUTO-LIVRO] Disparo Mental: sem JP, dano em PV");
confere(montarFormula("1d6+{n}*2", { n: 4 }) === "1d6+4*2", "[AUTO-LIVRO] Disparo: +2 por ponto");
confere(montarFormula("{n}d4+{n}", { n: 3 }) === "3d4+3", "[AUTO-LIVRO] Injeção por NT");
confere(montarFormula("1d4+{des}", { des: -1 }) === "1d4-1", "[AUTO-LIVRO] Destreza negativa");
confere(rodadasDe(30) === 3 && rodadasDe(5) === 1, "[AUTO-LIVRO] segundos em rodadas de 10 s");
confere(automacaoDe({ name: "Cortador Laser" }).ataque === "bac", "[AUTO-LIVRO] acha o item com acento e maiúscula");
confere(automacaoDe({ type: "monster_attack", system: { description: "<p>Ferroada</p>" } }, { name: "Aranha Gigante" }).dreno.chave === "constituicao", "[AUTO-LIVRO] veneno da aranha");
confere(automacaoDe({ name: "Item qualquer" }) === null, "[AUTO-LIVRO] item fora da tabela não ganha botão");

// [AUTO-REGISTRO] as tabelas de outros módulos
const { registrarAutomacao } = await import("../spacedragon-module/module/automacao.js");
registrarAutomacao({ "choque da forca": "choque mental", "toque sombrio": { jp: "jpf", aoPassar: "soDano", dano: "1d4" }, "aponta errado": "nao existe" });
confere(automacaoDe({ name: "Choque da Força" }) === T["choque mental"], "[AUTO-REGISTRO] equivalente aponta para o item daqui");
confere(automacaoDe({ name: "Toque Sombrio" }).dano === "1d4", "[AUTO-REGISTRO] entrada própria");
confere(automacaoDe({ name: "Aponta Errado" }) === null, "[AUTO-REGISTRO] equivalente inexistente não quebra");
confere(montarFormula("-{nivel3}", { nivel: 7 }) === "-2", "[AUTO-REGISTRO] 1 a cada 3 níveis");
confere(resultadoDaJp({ jp: "jpf", aoPassar: "soDano" }, true) === "soDano", "[AUTO-JP] passou: leva o dano, sem o efeito");

// [AUTO-JP]
confere(resultadoDaJp({ jp: "jpr", aoPassar: "metade" }, true) === "metade", "[AUTO-JP] passou em metade");
confere(resultadoDaJp({ jp: "jpm", aoPassar: "anula" }, true) === "nada", "[AUTO-JP] passou em anula");
confere(resultadoDaJp({ jp: "jpr", aoPassar: "anula" }, false) === "cheio", "[AUTO-JP] falhou");

// [AUTO-USO]
const atirador = novo("a");
const tokA = { name: "A", actor: novo("x"), document: { uuid: "Actor.x" } };
const tokB = { name: "B", actor: novo("y"), document: { uuid: "Actor.y" } };
game.user.targets = new Set([tokA, tokB]);
roteiro["3d12"] = [17];
dialogo = { n: "3" };
const area = await usarItem(atirador, { name: "Explosivo" }, T["explosivo remotamente controlado"]);
confere(area.dano === 17 && area.alvos.length === 2 && area.jp === "jpr", "[AUTO-USO] área: um dano para os dois alvos");
roteiro.d20 = [15];
roteiro["2d6"] = [8];
const tiro = await usarItem(atirador, { name: "Pistola" }, T["pistola de repeticao"]);
confere(tiro.alvos.length === 1 && tiro.alvos[0].nome === "A" && tiro.alvos[0].dano === 8, "[AUTO-USO] um uso é um disparo, mesmo com dois alvos marcados");
roteiro.d20 = [15, 15, 2, 15];
roteiro["1d10"] = [4, 7, 9];
const rajada = await usarItem(atirador, { name: "Metralhadora" }, T["metralhadora energetica"]);
confere(rajada.alvos.map((a) => `${a.nome}${a.dano}`).join() === "A4,B7,B9", `[AUTO-USO] 4 disparos revezados, cada acerto com o próprio dano: ${JSON.stringify(rajada.alvos)}`);
game.user.targets = new Set();
confere(await usarItem(atirador, { name: "x" }, T["pistola de repeticao"]) === null && avisos.length === 1, "[AUTO-USO] sem alvo marcado, avisa");

// [AUTO-ALVO]
const alvo = novo("t");
globalThis.fromUuid = async () => alvo;
const base = { alvos: [{ uuid: "u", nome: "t" }], dano: 10, cura: 0, dreno: 0, jp: "jpr", aoPassar: "metade" };
roteiro.d20 = [15];
const r1 = await aplicarNoAlvo("m", 0, base);
confere(r1.resultado === "metade" && alvo.system.hp.value === 15, `[AUTO-ALVO] passou: metade (${alvo.system.hp.value})`);
await aplicarNoAlvo("m", 0, base);
confere(alvo.system.hp.value === 15, "[AUTO-ALVO] o mesmo botão não aplica duas vezes");
roteiro.d20 = [2];
await aplicarNoAlvo("m2", 0, base);
confere(alvo.system.hp.value === 5, "[AUTO-ALVO] falhou: dano inteiro");
await aplicarNoAlvo("m3", 0, { alvos: base.alvos, dano: 0, cura: 99 });
confere(alvo.system.hp.value === 30, "[AUTO-ALVO] cura não passa do máximo");
const alheio = novo("z", { isOwner: false });
globalThis.fromUuid = async () => alheio;
await aplicarNoAlvo("m4", 0, base);
confere(alheio.system.hp.value === 20, "[AUTO-ALVO] quem não é dono não aplica");

// A JP de criatura com texto no campo, e o CP dela
const { numeroDe } = await import("../spacedragon-module/module/automacao.js");
confere(numeroDe("15 (+2 CONTRA VENENO)") === 15 && numeroDe("") === null, "[AUTO-ALVO] lê o número do campo de texto");
const aranha = novo("ar", { type: "monster" });
aranha.system.jp = "15 (+2 CONTRA VENENO)";
globalThis.fromUuid = async () => aranha;
roteiro.d20 = [3];
const jpCriatura = await aplicarNoAlvo("m6", 0, base);
confere(jpCriatura.resultado === "cheio", "[AUTO-ALVO] criatura com JP em texto falha quando tira menos");
// falha no meio não perde o uso
const instavel = novo("i");
let quebra = true;
const atualizar = instavel.update;
instavel.update = async function (m) { if (quebra && "system.hp.value" in m) throw new Error("queda"); return atualizar.call(this, m); };
globalThis.fromUuid = async () => instavel;
roteiro.d20 = [2];
await aplicarNoAlvo("m7", 0, base).catch(() => null);
quebra = false;
roteiro.d20 = [2];
await aplicarNoAlvo("m7", 0, base);
confere(instavel.system.hp.value === 10, "[AUTO-ALVO] depois de uma falha, o botão ainda aplica");

// [AUTO-MENTAL]
const mente = novo("m");
globalThis.fromUuid = async () => mente;
const efeitos = [];
game.od2Qdv = { effects: { get: () => efeitos, set: async (_a, l) => { efeitos.splice(0, efeitos.length, ...l); } } };
roteiro.d20 = [1];
await aplicarNoAlvo("m5", 0, { alvos: [{ uuid: "u", nome: "m" }], nomeItem: "Choque", dano: 0, cura: 0, dreno: 3, chaveDreno: "sabedoria", jp: "jpm", aoPassar: "anula", efeito: T["choque mental"].efeito, segundos: 30 });
confere(mente.system.hp.value === 20, "[AUTO-MENTAL] dano mental não tira PV");
confere(efeitos[0]?.modifiers[0]?.key === "sabedoria" && efeitos[0].modifiers[0].value === "-3", `[AUTO-MENTAL] drena Intelecto: ${JSON.stringify(efeitos[0])}`);
confere(efeitos[1]?.name === "Atordoado" && efeitos[1].duration.value === 3, "[AUTO-MENTAL] Atordoado por 3 rodadas (30 s)");

if (problemas.length) {
  console.error(`✘ ${problemas.length} problema(s):\n  ${problemas.join("\n  ")}`);
  process.exit(1);
}
console.log("✔ Automação de itens: tabela, regras e mesa conferem.");
