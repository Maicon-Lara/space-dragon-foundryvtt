/**
 * As regras de raça que reagem à mesa: regeneração, queda a 0 PV, caixas de JP,
 * quem feriu, dano por tipo de arma e usos limitados.
 *
 * ⚠️ Com um Foundry de brinquedo: prova as contas e as gravações, não a ficha real.
 *
 *     node tools/teste-racas-etapa2.mjs
 */

import { instalarLang } from "./lang-de-teste.mjs";

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

let natural = 10;
globalThis.Roll = class {
  constructor(f) { this.formula = f; formulas.push(f); }
  async evaluate() {
    this.dice = [{ total: natural }];
    this.total = /^1d20/.test(this.formula) ? natural + (Number(this.formula.match(/[+-] ?\d+$/)?.[0].replace(" ", "")) || 0) : 3;
    return this;
  }
};
const formulas = [];
const mensagens = [];
const avisos = [];
globalThis.ChatMessage = { create: async (d) => { mensagens.push(d); return d; }, getSpeaker: () => ({}), getSpeakerActor: (s) => s.ator };
globalThis.ui = { notifications: { warn: (m) => avisos.push(m), info() {} } };
globalThis.CONFIG = {};
const ganchos = {};
globalThis.Hooks = { on: (n, f) => { (ganchos[n] ??= []).push(f); }, once() {} };
let resposta = null;
globalThis.foundry = {
  applications: { api: { DialogV2: { prompt: async (d) => resposta(d) } } },
  utils: { getProperty: (o, k) => (k in o ? o[k] : k.split(".").reduce((x, p) => x?.[p], o)) },
};
globalThis.game = {
  user: { id: "gm", targets: new Set() }, users: { activeGM: { id: "gm" } }, combat: null,
  settings: { get: () => undefined }, time: { worldTime: 0 },
};
instalarLang();

const R = await import("../spacedragon-module/module/racas.js");
const { perguntarJP } = await import("../spacedragon-module/module/jp.js");
const { usarItem, usosRestantes, aplicarNoAlvo } = await import("../spacedragon-module/module/automacao.js");
const { marcarCartao } = await import("../spacedragon-module/module/dano-no-alvo.js");

R.registrarRacas({
  regeneracao: { regenera: 1 },
  "resistencia a dor": { aoCair: { jp: "jpc", sucesso: "age, cambaleante." } },
  inabalavel: { jpSituacao: { jps: [{ rotulo: "medo", bonus: 2 }] } },
  "sangue frio": { contraQuemFeriu: 2 },
  "vulnerabilidade a ion": { recebe: ({ chave, critico }) => (/\bions?\b/.test(chave) ? { mult: 2, desativa: critico } : null) },
});

function ator(habilidades, pv = 10) {
  const a = {
    id: "a", uuid: "Actor.a", name: "A", type: "character", isOwner: true, flags: { spacedragon: {} },
    items: habilidades.map((name) => ({ type: "race_ability", name })),
    system: { level: 1, bac: 1, bad: 1, jp: 10, mod_constituicao: 0, constituicao: 10, hp: { value: pv, max: 12 } },
    getFlag(_m, k) { return this.flags.spacedragon[k]; },
    async update(mud) {
      for (const [k, v] of Object.entries(mud)) {
        if (k === "system.hp.value") this.system.hp.value = v;
        else if (k.startsWith("flags.spacedragon.")) {
          const partes = k.split(".").slice(2);
          let o = this.flags.spacedragon;
          for (const p of partes.slice(0, -1)) o = o[p] ??= {};
          o[partes.at(-1)] = v;
        }
      }
    },
    async toggleStatusEffect(id) { this.status = id; },
  };
  return a;
}

// [REGEN]
const t = ator(["Regeneração"]);
const combate = (round) => ({ id: "c", round, combatants: [{ actor: t }] });
await R.regenerarNaRodada(combate(1));
confere(t.system.hp.value === 10, "[REGEN] a 1ª virada só anota");
await R.regenerarNaRodada(combate(2));
confere(t.system.hp.value === 11, "[REGEN] rodada inteira sem dano: +1 PV");
t.system.hp.value = 5;
await R.regenerarNaRodada(combate(3));
confere(t.system.hp.value === 5, "[REGEN] sofreu dano: não recupera");
await R.regenerarNaRodada(combate(4));
confere(t.system.hp.value === 6, "[REGEN] voltou a recuperar");
t.system.hp.value = -1;
await R.regenerarNaRodada(combate(5));
await R.regenerarNaRodada(combate(6));
confere(t.system.hp.value === -1, "[REGEN] abaixo de 0 PV não funciona");
t.system.hp.value = 12;
await R.regenerarNaRodada(combate(7));
await R.regenerarNaRodada(combate(8));
confere(t.system.hp.value === 12, "[REGEN] não passa do máximo");

// [QUEDA]
const z = ator(["Resistência à Dor"]);
const op = {};
R.notarQueda(z, { "system.hp.value": 0 }, op);
confere(op.sdCaiu === true, "[QUEDA] chegar a 0 é notado");
const op2 = {};
R.notarQueda(ator([], 5), { "system.hp.value": 0 }, op2);
confere(!op2.sdCaiu, "[QUEDA] sem a habilidade não é notado");
const op3 = {};
R.notarQueda(z, { name: "x" }, op3);
confere(!op3.sdCaiu, "[QUEDA] alteração sem PV é ignorada");
confere(await R.reagirAQueda(z) === null, "[QUEDA] fora de combate não rola");
game.combat = { id: "c1", started: true };
z.system.hp.value = 0;
natural = 15;
const r1 = await R.reagirAQueda(z);
confere(r1?.passou === true && /cambaleante/.test(mensagens.at(-1).content), "[QUEDA] passou: age cambaleante");
confere(await R.reagirAQueda(z) === null, "[QUEDA] uma vez por combate");
game.combat = { id: "c2", started: true };
z.system.hp.value = -50;
confere(await R.reagirAQueda(z) === null, "[QUEDA] quem morreu não rola");

// [JP]
const w = ator(["Inabalável"]);
confere(await perguntarJP(ator([]), "jps") === 0, "[JP] sem caixas não abre janela");
resposta = (d) => {
  confere(/\+2 contra medo/.test(d.content), "[JP] a caixa mostra o bônus");
  return d.ok.callback(null, { form: { elements: { c0: { checked: true } } } });
};
confere(await perguntarJP(w, "jps") === 2, "[JP] a caixa marcada soma");
resposta = (d) => d.ok.callback(null, { form: { elements: { c0: { checked: false }, sit: { value: "1" } } } });
confere(await perguntarJP(w, "jps", { shift: true }) === 1, "[JP] o Shift ainda dá o modificador");
resposta = () => null;
confere(await perguntarJP(w, "jps") === null, "[JP] fechar a janela cancela");
resposta = () => { problemas.push("[JP] outra JP não tem caixa"); return 0; };
await perguntarJP(w, "jpc");

// [FERIU]
const rodiano = ator(["Sangue Frio"]);
const mud = R.marcaDeFerida(rodiano, "tok1");
confere(mud["flags.spacedragon.feridoPor"]?.[0] === "tok1", "[FERIU] grava quem feriu");
confere(Object.keys(R.marcaDeFerida(ator([]), "tok1")).length === 0, "[FERIU] sem a habilidade não grava");
await rodiano.update(mud);
confere(R.ajusteContraQuemFeriu(rodiano, { chave: "tok1" })?.valor === 2, "[FERIU] +2 contra quem feriu");
confere(R.ajusteContraQuemFeriu(rodiano, { chave: "tok2" }) === null, "[FERIU] outro alvo não dá bônus");
await rodiano.update({ "flags.spacedragon.feridoPor": ["tok1", "atorX"] });
confere(R.ajusteContraQuemFeriu(rodiano, { chave: "tok7", atorId: "atorX" })?.valor === 2, "[FERIU] ferido pela ficha da barra lateral");
game.user.targets = new Set([{ name: "Alvo", actor: { system: { ac_total: 1 } }, document: { uuid: "Token.x", id: "tok1" } }]);
natural = 10;
const arma = { id: "w", name: "Pistola", type: "weapon", system: { type: "ranged", damage: "1d6" } };
formulas.length = 0;
await usarItem(rodiano, arma, { ataque: "bad", dano: "1d6" });
confere(formulas.includes("1d20 + 3"), `[FERIU] o ataque soma: ${formulas}`);
confere(/1d20 <strong>10<\/strong> \+1 \(BA\) \+2 \(Sangue Frio\) = <strong>13<\/strong>/.test(mensagens.at(-1).content), `[CONTA] o cartão mostra a conta: ${mensagens.at(-1).content}`);
let flagsDoCartao = null;
game.settings.get = () => true;
game.user.targets = new Set([{ name: "D", document: { uuid: "Token.y" } }]);
marcarCartao({ flavor: "", content: `<div class="od2ca-card"><dt>Dano</dt><dd>5</dd></div>`, speaker: { ator: { token: { id: "tok9" } } }, updateSource: (d) => { flagsDoCartao = d; } });
confere(flagsDoCartao?.flags?.spacedragon?.danoNoAlvo?.atacante === "tok9", "[FERIU] o cartão dos outros módulos guarda o atacante");
game.settings.get = () => undefined;

// [ION]
const droide = ator(["Vulnerabilidade a Íon"], 12);
globalThis.fromUuid = async () => droide;
await aplicarNoAlvo("m1", 0, { nomeItem: "Pistola de Íons", alvos: [{ uuid: "x", dano: 3, critico: false }], dano: 0 });
confere(droide.system.hp.value === 6 && !droide.status, `[ION] dano dobrado: ${droide.system.hp.value}`);
await aplicarNoAlvo("m2", 0, { nomeItem: "Pistola de Íons", alvos: [{ uuid: "x", dano: 1, critico: true }], dano: 0 });
confere(droide.system.hp.value === 4 && droide.status === "unconscious", "[ION] no crítico, desativa");
const outroDroide = ator(["Vulnerabilidade a Íon"], 12);
globalThis.fromUuid = async () => outroDroide;
await aplicarNoAlvo("m3", 0, { nomeItem: "Pistola Blaster", alvos: [{ uuid: "x", dano: 3, critico: true }], dano: 0 });
confere(outroDroide.system.hp.value === 9 && !outroDroide.status, "[ION] outra arma é normal");

// [USOS]
const lider = ator([]);
const habilidade = { id: "h", name: "Liderança Serena", type: "race_ability", system: {} };
const def = { proprio: true, semAlvo: true, limite: { vezes: 1, por: "dia" }, nota: "Repete." };
const limite = def.limite;
confere(usosRestantes(lider, habilidade, limite) === 1, "[USOS] começa cheio");
confere(await usarItem(lider, habilidade, def) && usosRestantes(lider, habilidade, limite) === 0, "[USOS] gasta");
confere(!/sd-auto-alvo/.test(mensagens.at(-1).content), "[USOS] sem botão de alvo");
const qtos = mensagens.length;
confere(await usarItem(lider, habilidade, def) === null && mensagens.length === qtos && avisos.length > 0, "[USOS] sem uso, avisa e não usa");
game.time.worldTime = 86400;
confere(usosRestantes(lider, habilidade, limite) === 1, "[USOS] no dia seguinte recarrega");

if (problemas.length) {
  console.error(`✘ ${problemas.length} problema(s):\n  ${problemas.join("\n  ")}`);
  process.exit(1);
}
console.log("✔ Regras de raça na mesa conferem.");
