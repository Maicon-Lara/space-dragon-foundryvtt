/**
 * Crítico, arma de preferência, Ataque Furtivo e as regras de raça registradas.
 *
 * ⚠️ Com um Foundry de brinquedo: prova as contas, não o desenho na ficha real.
 *
 *     node tools/teste-racas-critico.mjs
 */

import { instalarLang } from "./lang-de-teste.mjs";

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

let natural = 10;
let centena = 15;
const formulas = [];
globalThis.Roll = class {
  constructor(f) { this.formula = f; formulas.push(f); }
  async evaluate() {
    this.dice = [{ total: natural }];
    this.total = /^1d20/.test(this.formula) ? natural + (this.formula.match(/[+-] ?\d+$/)?.[0].replace(" ", "") * 1 || 0) : this.formula === "1d100" ? centena : 3;
    return this;
  }
};
const mensagens = [];
globalThis.ChatMessage = { create: async (d) => { mensagens.push(d); return d; }, getSpeaker: () => ({}) };
globalThis.ui = { notifications: { warn() {}, info() {} } };
globalThis.CONFIG = {};
globalThis.Hooks = { on() {}, once() {} };
let dialogo = null;
globalThis.foundry = { applications: { api: { DialogV2: { wait: async () => dialogo } } } };
globalThis.game = { user: { targets: new Set() }, settings: { get: () => undefined } };
instalarLang();

const { automacaoDe, usarItem, ataqueDaFicha } = await import("../spacedragon-module/module/automacao.js");
const { multiplicadorDaArma, multiplicadorFurtivo, escolheArmaPreferida } = await import("../spacedragon-module/module/vitalidade.js");
const { registrarRacas, bonusDeDanoDaRaca, comAjusteDaOrdem, rmDaRaca, venceJPPelaRaca } = await import("../spacedragon-module/module/racas.js");
const { rmDe } = await import("../spacedragon-module/module/anulacao.js");
const { rolarJP } = await import("../spacedragon-module/module/jp.js");

const personagem = (classe, level, flags = {}, itens = []) => {
  const c = { type: "class", name: classe };
  return {
    id: "a", uuid: "Actor.a", name: "A", type: "character", isOwner: true, flags, items: [c, ...itens],
    system: { level, bac: 5, bad: 6, mod_forca: 0, jp: 10, hp: { value: 20, max: 30 } },
    getFlag: (_m, k) => flags[k],
  };
};
const arma = { id: "w", name: "Arma", type: "weapon", system: { type: "ranged", damage: "1d6" } };
const outra = { id: "x", name: "Outra", type: "weapon", system: { type: "ranged", damage: "1d6" } };
game.user.targets = new Set([{ name: "Alvo", actor: { system: { ac_total: 12 } }, document: { uuid: "Token.x" } }]);
const danoDe = () => mensagens.at(-1)?.flags?.spacedragon?.automacao?.alvos?.[0]?.dano;

// O crítico
const cosmo = personagem("Cosmonauta", 6);
confere(multiplicadorDaArma(cosmo, arma) === 3, "[CRIT] Cosmonauta 6º é ×3");
natural = 20;
await usarItem(cosmo, arma, automacaoDe(arma, cosmo));
confere(danoDe() === 9, `[CRIT] 3 × 3 no 20 natural: ${danoDe()}`);
natural = 15;
await usarItem(cosmo, arma, automacaoDe(arma, cosmo));
confere(danoDe() === 3, `[CRIT] sem 20, sem multiplicar: ${danoDe()}`);
natural = 20;
dialogo = {};
const gatuno = personagem("Gatuno", 6);
await usarItem(gatuno, arma, automacaoDe(arma, gatuno));
confere(danoDe() === 6 && /T7-4/.test(mensagens.at(-1).content), `[CRIT] as outras classes dobram no 20 natural: ${danoDe()}`);

// O Mercenário
const merc = personagem("Mercenário — Cosmonauta", 6, { armaPreferida: "w" });
confere(multiplicadorDaArma(merc, arma) === 4, "[MERC] arma de preferência: ×4 no 6º");
confere(multiplicadorDaArma(merc, outra) === 3, "[MERC] outra arma: a tabela do livro");
confere(multiplicadorDaArma(personagem("Mercenário — Cosmonauta", 18, { armaPreferida: "w" }), arma) === 6, "[MERC] ×6 no 18º");
confere(!escolheArmaPreferida(personagem("Mercenário — Cosmonauta", 4)), "[MERC] só a partir do 5º");

// O Ataque Furtivo
confere(multiplicadorFurtivo(personagem("Gatuno", 12)) === 4, "[FURTIVO] T3-5 no 12º");
confere(multiplicadorFurtivo(personagem("Assassino — Gatuno", 5)) === 3, "[FURTIVO] Assassino +1 no 5º");
confere(multiplicadorFurtivo(personagem("Sabotador — Gatuno", 12)) === 2, "[FURTIVO] Sabotador para no 5º");
confere(multiplicadorFurtivo(cosmo) === null, "[FURTIVO] só o Gatuno");
natural = 15;
dialogo = { furtivo: "on" };
const op = personagem("Gatuno", 6);
await usarItem(op, arma, automacaoDe(arma, op));
confere(formulas.includes("1d20 + 8"), `[FURTIVO] +2 no ataque: ${formulas.slice(-3)}`);
confere(danoDe() === 9, `[FURTIVO] dano × 3: ${danoDe()}`);
natural = 20;
await usarItem(op, arma, automacaoDe(arma, op));
confere(danoDe() === 9, "[FURTIVO] crítico sem multiplicador não soma ao furtivo");

// O Mercenário do 10º em diante
const merc10 = personagem("Mercenário — Cosmonauta", 10, { armaPreferida: "w" });
natural = 15;
dialogo = { primeiro: "on" };
await usarItem(merc10, arma, automacaoDe(arma, merc10));
confere(formulas.at(-2) === "1d20 + 8", `[MERC10] +2 no 1º ataque: ${formulas.slice(-2)}`);
dialogo = {};
await usarItem(merc10, arma, automacaoDe(arma, merc10));
confere(formulas.at(-2) === "1d20 + 6", `[MERC10] sem o +2 depois do 1º: ${formulas.slice(-2)}`);
await usarItem(merc10, outra, automacaoDe(outra, merc10));
confere(formulas.at(-2) === "1d20 + 2", `[MERC10] −4 em outra arma: ${formulas.slice(-2)}`);
dialogo = { sacrificar: "on" };
centena = 15;
await usarItem(merc10, arma, automacaoDe(arma, merc10));
confere(danoDe() === 12, `[MERC10] sacrifício: o acerto é crítico ×4: ${danoDe()}`);
centena = 50;
const cartoesAntes = mensagens.length;
const falhou = await usarItem(merc10, arma, automacaoDe(arma, merc10));
confere(falhou === null && mensagens.length === cartoesAntes + 1 && /Falhou/.test(mensagens.at(-1).content), "[MERC10] falhou no d%: o turno acaba");
centena = 15;
dialogo = {};

// O clique no ataque da ficha
natural = 15;
const fichaDe = (actor) => ({ actor });
confere(await ataqueDaFicha(fichaDe(cosmo), arma, "bad") === true, "[FICHA] com alvo, o fluxo é o do módulo");
const alvos = game.user.targets;
game.user.targets = new Set();
confere(await ataqueDaFicha(fichaDe(cosmo), arma, "bad") === false, "[FICHA] sem alvo, a rolagem do sistema");
game.user.targets = alvos;
const comFlecha = { ...arma, system: { ...arma.system, ammo_type: "arrow" } };
confere(await ataqueDaFicha(fichaDe(cosmo), comFlecha, "bad") === false, "[FICHA] munição rastreada fica com o sistema");
class NaveSheet { actor = cosmo; }
confere(await ataqueDaFicha(new NaveSheet(), arma, "bad") === false, "[FICHA] a nave tem o disparo próprio");
const arremesso = { id: "t", name: "Machado", type: "weapon", system: { type: "throwing", damage: "1d6" } };
await ataqueDaFicha(fichaDe(cosmo), arremesso, "bac");
confere(formulas.at(-2) === "1d20 + 5", `[FICHA] o botão clicado escolhe BAC: ${formulas.slice(-2)}`);
const faca = { id: "f", name: "Faca", type: "weapon", system: { type: "melee", damage: "1d4", throw_range: 3 } };
await ataqueDaFicha(fichaDe(cosmo), faca, "bad");
confere(formulas.at(-2) === "1d20 + 6", `[FICHA] arma arremessável sem janela: ${formulas.slice(-2)}`);

// As raças
registrarRacas({
  "furia selvagem": { dano: (a, x) => (x.system.type === "melee" && a.system.hp.value < a.system.hp.max / 2 ? 2 : 0) },
  "mente tatica": { ordem: -1 },
  "corpo robotico": { venceJP: { jpc: (a) => a.system.hp.value >= 0 } },
  "cerebro positronico": { rm: 5 },
});
const hab = (name) => ({ type: "race_ability", name });
const wook = personagem("Veterano", 1, {}, [hab("Fúria Selvagem")]);
const bastao = { system: { type: "melee" } };
confere(bonusDeDanoDaRaca(wook, bastao) === 0, "[RACA] acima da metade do PV, sem bônus");
wook.system.hp.value = 14;
confere(bonusDeDanoDaRaca(wook, bastao) === 2, "[RACA] abaixo da metade, +2");
confere(bonusDeDanoDaRaca(wook, { system: { type: "ranged" } }) === 0, "[RACA] só corpo a corpo");
const chiss = personagem("Veterano", 1, {}, [hab("Mente Tática")]);
const o = comAjusteDaOrdem(chiss, { n: 4, como: "1d8 deu 4", roll: null });
confere(o.n === 3 && /Mente Tática/.test(o.como), `[RACA] Ordem −1: ${JSON.stringify(o)}`);
confere(comAjusteDaOrdem(cosmo, { n: 4, como: "x" }).n === 4, "[RACA] sem a habilidade, sem ajuste");
const droide = personagem("Veterano", 1, {}, [hab("Corpo Robótico"), hab("Cérebro Positrônico")]);
confere(rmDaRaca(droide) === 5 && rmDe(droide) === 5, "[RACA] RM 5%");
confere(rmDe(cosmo) === null, "[RACA] sem RM");
confere(venceJPPelaRaca(droide, "jpc") && !venceJPPelaRaca(droide, "jps"), "[RACA] só a JPF");
const antes = formulas.length;
confere((await rolarJP(droide, "jpc"))?.passou === true && formulas.length === antes, "[RACA] Droide passa sem rolar");
droide.system.hp.value = -1;
confere(!venceJPPelaRaca(droide, "jpc"), "[RACA] com PV negativo rola a estabilização");

// A conta do dano no cartão: dados, parcelas e o multiplicador do crítico.
{
  const forte = { ...personagem("Mercenário", 1), system: { level: 1, bac: 5, bad: 6, mod_forca: 2, hp: { value: 20, max: 30 }, raceBonusDamage: () => 1 } };
  const lanca = { id: "l", name: "Lança", type: "weapon", system: { type: "melee", damage: "1d6", bonus_damage: 0 } };
  globalThis.game.user.targets = new Set([{ name: "Alvo", actor: { system: { ac_total: 1 } }, document: { uuid: "Token.z" } }]);
  natural = 20;
  await usarItem(forte, lanca, automacaoDe(lanca, forte));
  const c = mensagens.at(-1)?.content ?? "";
  confere(/Dano: 1d6 \(0\) \+2 \(Força\) \+1 \(raça\) = <strong>3<\/strong> ×2 = <strong>6<\/strong>/.test(c), `[CONTA] o cartão mostra o dano: ${c}`);
  natural = 10;
  globalThis.game.user.targets = new Set();
}

if (problemas.length) {
  console.error(`✘ ${problemas.length} problema(s):\n  ${problemas.join("\n  ")}`);
  process.exit(1);
}
console.log("✔ Crítico, arma de preferência, Ataque Furtivo e raças conferem.");
