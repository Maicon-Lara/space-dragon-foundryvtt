/**
 * O botão Usar nas armas, a convivência com o painel mental e a migração.
 *
 * ⚠️ Com um Foundry de brinquedo: prova as contas e as gravações, não o desenho
 * na ficha real.
 *
 *   · [BOTAO-CONTA]   BA e dano como o sistema calcula, por tipo de arma;
 *   · [BOTAO-AREA]    granada pede JPR para metade, sem somar Força;
 *   · [BOTAO-OPCAO]   cada opção desliga só o seu tipo de item;
 *   · [BOTAO-LINHA]   o botão entra na linha que já tem o "usar X%" mental;
 *   · [BOTAO-MENTAL]  o Mentálico paga o alcance, e acima do limite não usa;
 *   · [MIGRA]         só o valor exato do compêndio antigo é trocado.
 *
 *     node tools/teste-armas-botao.mjs
 */

import fs from "node:fs";
import { instalarLang } from "./lang-de-teste.mjs";

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

globalThis.Roll = class {
  constructor(f) { this.formula = f; formulas.push(f); }
  async evaluate() { this.dice = [{ total: 15 }]; this.total = 20; return this; }
};
const formulas = [];
const mensagens = [];
globalThis.ChatMessage = { create: async (d) => { mensagens.push(d); return d; }, getSpeaker: () => ({}) };
const avisos = [];
const infos = [];
globalThis.ui = { notifications: { warn: (m) => avisos.push(m), info: (m) => infos.push(m) } };
globalThis.CONFIG = {};
const ganchos = {};
globalThis.Hooks = { on: (n, f) => { (ganchos[n] ??= []).push(f); }, once() {} };
const opcoes = {};
globalThis.game = {
  user: { targets: new Set(), isGM: true, id: "gm" }, users: { activeGM: { id: "gm" } }, actors: [],
  settings: { get: (_m, k) => opcoes[k] },
};
instalarLang();

const { automacaoDe, definicaoDoBotao, usarItem, ligarAutomacao, CLASSE_USAR } = await import("../spacedragon-module/module/automacao.js");
const { correcaoDaArma, migrarArmasNoReady } = await import("../spacedragon-module/module/migrar-armas.js");

const ator = (extra = {}) => ({
  id: "a", uuid: "Actor.a", name: "A", type: "character", isOwner: true, flags: {}, items: [],
  system: { level: 8, bac: 5, bad: 6, mod_forca: 2, mod_destreza: 1 },
  ...extra,
});
const arma = (type, damage, extra = {}) => ({ id: "w", name: "Arma da Mesa", type: "weapon", system: { type, damage, bonus_ba: 0, bonus_damage: 0, throw_range: 0, ...extra } });

// [BOTAO-CONTA]
const a = ator();
confere(automacaoDe(arma("ranged", "2d8"), a).ataque === "bad", "[BOTAO-CONTA] à distância usa BAD");
confere(automacaoDe(arma("ranged", "2d8"), a).dano === "2d8", "[BOTAO-CONTA] à distância não soma Força");
const bastao = automacaoDe(arma("melee", "1d6", { bonus_damage: 1, bonus_ba: 3 }), a);
confere(bastao.ataque === "bac" && bastao.dano === "1d6+3" && bastao.bonusAtaque === 3, `[BOTAO-CONTA] corpo a corpo: ${JSON.stringify(bastao)}`);
confere(automacaoDe(arma("melee", "1d6"), ator({ system: { mod_forca: -1 } })).dano === "1d6-1", "[BOTAO-CONTA] Força negativa");
confere(automacaoDe(arma("melee", "1d4", { throw_range: 3 }), a).modos?.length === 2, "[BOTAO-CONTA] corpo a corpo arremessável pergunta o modo");
confere(automacaoDe(arma("ammunition", "1d4"), a) === null, "[BOTAO-CONTA] munição não tem botão");
confere(automacaoDe(arma("ranged", ""), a) === null, "[BOTAO-CONTA] arma sem dano não tem botão");

game.user.targets = new Set([{ name: "Alvo", actor: { system: { ac_total: 12 } }, document: { uuid: "Token.x" } }]);
await usarItem(a, arma("melee", "1d6", { bonus_ba: 3 }), automacaoDe(arma("melee", "1d6", { bonus_ba: 3 }), a));
confere(formulas.includes("1d20 + 8"), `[BOTAO-CONTA] ataque soma BA e bônus: ${formulas}`);
confere(mensagens.at(-1)?.flags?.spacedragon?.automacao?.alvos?.[0]?.dano === 20, "[BOTAO-CONTA] o cartão leva o dano para o alvo");

// [BOTAO-AREA]
const granada = { id: "g", name: "Granada Explosiva (1)", type: "weapon", system: { type: "throwing", damage: "1d10 em 10m²" } };
const defGranada = automacaoDe(granada, a);
confere(defGranada.jp === "jpr" && defGranada.aoPassar === "metade" && defGranada.dano === "1d10", "[BOTAO-AREA] granada: JPR para metade, sem Força");

// [BOTAO-OPCAO]
const aparato = { id: "c", name: "Cortador Laser", type: "misc", system: {} };
opcoes.automacaoDeArmas = false;
confere(definicaoDoBotao(arma("ranged", "2d8"), a) === null && definicaoDoBotao(aparato, a), "[BOTAO-OPCAO] a opção de armas não mexe nos aparatos");
opcoes.automacaoDeArmas = true;
opcoes.automacaoDeItens = false;
confere(definicaoDoBotao(aparato, a) === null && definicaoDoBotao(arma("ranged", "2d8"), a), "[BOTAO-OPCAO] a opção de itens não mexe nas armas");
opcoes.automacaoDeItens = true;

// [BOTAO-LINHA]
ligarAutomacao();
const filhos = [{ className: "sd-usar" }];
const linha = {
  dataset: { itemId: "p" },
  querySelector: (s) => filhos.find((f) => `.${f.className}` === s) ?? null,
  appendChild: (n) => filhos.push(n),
  ownerDocument: { createElement: () => ({ addEventListener() {} }) },
};
let seletor = "";
const raiz = { querySelector() {}, querySelectorAll: (s) => { seletor = s; return [linha]; } };
const poder = { id: "p", name: "Confundir Mente", type: "spell", system: { circle: 1 }, getFlag: () => ({ memorized: true }) };
ganchos.renderOD2CharacterSheet[0]({ actor: ator({ items: { get: () => poder } }) }, raiz);
confere(filhos.some((f) => f.className === CLASSE_USAR), "[BOTAO-LINHA] o botão entra na linha com o link do painel mental");
confere(CLASSE_USAR !== "sd-usar", "[BOTAO-LINHA] classe separada da do painel mental");
confere(seletor === "li.item[data-item-id]", `[BOTAO-LINHA] só as linhas, e não os campos delas: ${seletor}`);

seletor = "";
class NaveSheet { actor = ator({ items: { get: () => poder } }); }
ganchos.renderOD2CharacterSheet[0](new NaveSheet(), raiz);
confere(seletor === "", "[BOTAO-LINHA] a Ficha de Nave não ganha o botão");
const css = fs.readFileSync(new URL("../spacedragon-module/styles/nave.css", import.meta.url), "utf8");
confere(/\.sd-usar-item \{[^}]*width: auto !important/.test(css), "[BOTAO-LINHA] a largura precisa vencer o CSS do sistema");
const celula = { children: [], appendChild(n) { this.children.push(n); } };
const naCelula = { ...linha, querySelector: (s) => (s.includes("item-controls") ? celula : null) };
const raizCelula = { querySelector() {}, querySelectorAll: () => [naCelula] };
ganchos.renderOD2CharacterSheet[0]({ actor: ator({ items: { get: () => poder } }) }, raizCelula);
confere(celula.children.length === 1, "[BOTAO-LINHA] o botão entra na célula, sem coluna nova");

// [BOTAO-MENTAL]
const classeMental = { type: "class", name: "Mentálico" };
const mentalico = () => {
  const m = ator({ items: [classeMental], system: { level: 10, class: classeMental, inteligencia: 12, sabedoria: 12 } });
  m.getFlag = (_m, k) => m.flags[k];
  m.setFlag = async (_m, k, v) => { m.flags[k] = v; };
  return m;
};
game.user.targets = new Set([{ name: "Alvo", actor: { system: {}, items: [] }, document: { uuid: "Token.x" } }]);
const m1 = mentalico();
const cartoes = mensagens.length;
const avisosAntes = avisos.length;
const r = await usarItem(m1, { ...poder, system: { circle: 9 } }, automacaoDe(poder, m1));
confere(r === null && avisos.length > avisosAntes && mensagens.length === cartoes, "[BOTAO-MENTAL] acima do limite: avisa e não usa");
const m2 = mentalico();
const ok = await usarItem(m2, poder, automacaoDe(poder, m2));
confere(ok && m2.flags.alcanceGasto === 1, `[BOTAO-MENTAL] gasta a Grandeza: ${m2.flags.alcanceGasto}`);

// [MIGRA]
const velha = (name, type, damage) => ({ id: name, name, type: "weapon", system: { type, damage } });
const ug = correcaoDaArma(velha("Granada Explosiva (1)", "throwing", "1d10 em 10m²"));
confere(ug?.["system.damage"] === "1d10" && !("system.type" in ug), `[MIGRA] granada: ${JSON.stringify(ug)}`);
const um = correcaoDaArma(velha("Míssil (1)", "ranged", "2d8 em 15m²"));
confere(um?.["system.type"] === "ammunition" && um?.["system.damage"] === "2d8", "[MIGRA] míssil: tipo e dano");
confere(correcaoDaArma(velha("Granada Explosiva (1)", "throwing", "1d10")) === null, "[MIGRA] já corrigida não muda");
confere(correcaoDaArma(velha("Granada Explosiva (1)", "throwing", "2d10+1")) === null, "[MIGRA] editada à mão não muda");
confere(correcaoDaArma(velha("Pistola Blaster Pesada", "ranged", "2d8")) === null, "[MIGRA] arma fora da lista não muda");

const gravados = [];
game.actors = [{ items: [velha("Flecha (20)", "ranged", "")], updateEmbeddedDocuments: async (_t, l) => gravados.push(...l) }];
confere(await migrarArmasNoReady() === 1 && gravados[0]["system.type"] === "ammunition", "[MIGRA] o Mestre grava");
game.users.activeGM = { id: "outro" };
confere(await migrarArmasNoReady() === 0, "[MIGRA] só o Mestre ativo grava");

if (problemas.length) {
  console.error(`✘ ${problemas.length} problema(s):\n  ${problemas.join("\n  ")}`);
  process.exit(1);
}
console.log("✔ Botão Usar nas armas: contas, opções, painel mental e migração conferem.");
