/**
 * O Combate de Convés de naves (nave-conves.js), a regra pura e a mesa com um
 * Foundry de brinquedo. Os números esperados vêm de `combate-de-conves.md`.
 *
 * ⚠️ Não substitui testar na mesa: prova as contas, as gravações e os cartões
 * com a API fingida, não que a API real se comporte igual.
 *
 *   · [CONV-ESCALA]   a tabela da regra, e Escudo zerado sem Escudo de força;
 *   · [CONV-ATAQUE]   Mira, Cauda, Travar, Interferir, Ponte e Mirar;
 *   · [CONV-DADO]     +1 dado a partir da 4ª rodada, e o da Sobrecarga;
 *   · [CONV-GOLPE]    margem 5+ no Casco ou 20 natural; a ordem do d6;
 *   · [CONV-IMPACTO]  Escudo antes do Casco; golpe só se chegou ao Casco;
 *   · [CONV-FUGA]     três marcas e a nave escapa;
 *   · [CONV-COLAPSO]  3 rodadas depois do Casco 0, bônus até +4, JPR uma vez;
 *   · [CONV-OPCAO]    desligada por padrão; ligada, põe a ficha no motor;
 *   · [CONV-PAINEL]   duas ações por posto, sem Prioridade, Colapso visível;
 *   · [CONV-MESA]     disparo, Recompor, incêndio, Colapso e a JPR final.
 *
 *     node tools/teste-nave-conves.mjs
 */

import { instalarLang } from "./lang-de-teste.mjs";
import {
  ESCALA_CONVES, escalaConves, termosConves, dadosExtras, golpeForte, golpeDoD6, GOLPES, aplicarImpactoConves,
  repararGolpe, marcarFuga, avancarColapso, somarSalvamento, ACOES_CONVES, danoATripulante, semArmaParaAtirar,
} from "../spacedragon-module/module/nave-conves.js";
import { painelConves } from "../spacedragon-module/module/nave-conves-ficha.js";
import { cineDe } from "../spacedragon-module/module/nave-cine-ficha.js";
import { combateConves, combateCinematico, registrarOpcoesDeNave } from "../spacedragon-module/module/opcoes.js";
import {
  dispararCine, aplicarImpactoCineDaMensagem, fecharRodadaDaNave, rolarJprFinal, PARA_TESTE,
} from "../spacedragon-module/module/nave-cine-acoes.js";
import { TIPOS } from "../spacedragon-module/module/tipos-de-nave.js";
import { updateDaNave } from "../spacedragon-module/module/nave-pc-dados.js";

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };
const soma = (t) => t.reduce((s, [, v]) => s + v, 0);

/* ── Foundry de brinquedo ─────────────────────────────────────────────────── */

const roteiro = {};
globalThis.Roll = class {
  constructor(f) { this.formula = f; }
  async evaluate() {
    const d20 = /^1d20/.test(this.formula);
    if (d20) {
      const nat = roteiro.d20?.shift() ?? 10;
      const mods = this.formula.replace(/^1d20/, "").replace(/\s+/g, "").match(/[+-]\d+/g) ?? [];
      this.dice = [{ total: nat }];
      this.total = nat + mods.reduce((s, n) => s + Number(n), 0);
    } else {
      this.total = roteiro[this.formula]?.shift() ?? 1;
    }
    return this;
  }
};
const mensagens = [];
globalThis.ChatMessage = { create: async (d) => { mensagens.push(d); return d; }, getSpeaker: () => ({}) };
const avisos = [];
globalThis.ui = { notifications: { warn: (m) => avisos.push(m), info: () => {} } };
globalThis.CONFIG = {};
let dialogo = null;
globalThis.foundry = { applications: { api: { DialogV2: { wait: async () => dialogo, confirm: async () => true } } } };
let opcoes = {};
globalThis.game = {
  user: { targets: new Set() },
  actors: { getName: () => null },
  settings: { get: (_m, k) => opcoes[k], register: (_m, k, c) => { registradas[k] = c; } },
};
const registradas = {};
instalarLang();

function setPath(obj, caminho, valor) {
  const partes = caminho.split(".");
  let o = obj;
  for (let i = 0; i < partes.length - 1; i += 1) o = o[partes[i]] ??= {};
  const ultima = partes.at(-1);
  if (ultima.startsWith("-=")) delete o[ultima.slice(2)];
  else o[ultima] = structuredClone(valor);
}
function novaNave({ id, hp = 50, max = 50, cp = 24, cine = {}, armas = 2 } = {}) {
  return {
    id, name: id,
    flags: { core: { sheetClass: "spacedragon.NaveSheet" }, spacedragon: { nave: { tipo: "cargueiro", tamanho: "Gigantesca", postos: {}, camaras: { ponte: "instalada" }, cine } } },
    system: { hp: { value: hp, max }, ba: 12, ac_total: cp, race: { name: "" } },
    items: Array.from({ length: armas }, () => ({ type: "weapon", flags: {} })),
    getActiveTokens() { return [{ id: `tok-${id}` }]; },
    async update(m) { for (const [k, v] of Object.entries(m)) setPath(this, k, v); return this; },
  };
}
const ctxDe = (ator) => ({
  ator, token: { id: `tok-${ator.id}` }, editavel: () => true,
  gravar: async (a, d) => { const m = updateDaNave(a, d, "spacedragon"); if (m) await ator.update(m); },
});
const cineAtor = (a) => cineDe(a.flags.spacedragon.nave);

/* ── A regra pura ─────────────────────────────────────────────────────────── */

// [CONV-ESCALA]
confere(Object.keys(ESCALA_CONVES).sort().join() === Object.keys(TIPOS).sort().join(), "[CONV-ESCALA] cobre os oito tipos");
for (const [tipo, [e, c, rec]] of Object.entries({
  caca: [0, 20, null], capsula: [0, 15, null], escolta: [0, 30, null], particular: [10, 30, "1d10"],
  cargueiro: [20, 50, "2d10"], transuniversal: [20, 50, "2d10"], cruzador: [40, 100, "3d10"], naveMae: [40, 130, "3d10"],
})) {
  const x = escalaConves(tipo, { temEscudo: true });
  confere(x.escudo === e && x.casco === c && x.recarga === rec, `[CONV-ESCALA] ${tipo}: ${JSON.stringify(x)}`);
}
const semEscudo = escalaConves("cargueiro", { temEscudo: false });
confere(semEscudo.escudo === 0 && semEscudo.casco === 50 && semEscudo.recarga === null, "[CONV-ESCALA] sem Escudo de força, Escudo 0");

// [CONV-ATAQUE] BA 12 + artilheiro 5, rodada 3 (Tensão +2)
const base = { ba: 12, artilheiro: 5, rodada: 3 };
confere(soma(termosConves(base)) === 19, "[CONV-ATAQUE] BA + artilheiro + Tensão");
confere(soma(termosConves({ ...base, vantagem: ["mira"] })) === 21, "[CONV-ATAQUE] Mira +2");
confere(soma(termosConves({ ...base, caudaContraMim: true })) === 17, "[CONV-ATAQUE] Na cauda −2");
confere(soma(termosConves({ ...base, travado: true })) === 21, "[CONV-ATAQUE] Travar +2");
confere(soma(termosConves({ ...base, interferido: true })) === 17, "[CONV-ATAQUE] Interferir −2");
confere(soma(termosConves({ ...base, golpes: { ponte: true } })) === 17, "[CONV-ATAQUE] Ponte −2");
confere(soma(termosConves({ ...base, mirar: true })) === 17, "[CONV-ATAQUE] Mirar −2");
confere(soma(termosConves({ ...base, rodada: 20 })) === 22, "[CONV-ATAQUE] a Tensão para em +5");

// [CONV-DADO]
confere(dadosExtras(3) === 0 && dadosExtras(4) === 1 && dadosExtras(9) === 1, "[CONV-DADO] +1 dado a partir da 4ª rodada");
confere(dadosExtras(4, { sobrecarga: true }) === 2 && dadosExtras(1, { sobrecarga: true }) === 1, "[CONV-DADO] Sobrecarga soma +1");

// [CONV-GOLPE]
confere(golpeForte({ total: 29, cp: 24, natural: 10, noCasco: 1 }) === true, "[CONV-GOLPE] margem 5 é golpe forte");
confere(golpeForte({ total: 28, cp: 24, natural: 10, noCasco: 1 }) === false, "[CONV-GOLPE] margem 4 não é");
confere(golpeForte({ total: 25, cp: 24, natural: 20, noCasco: 1 }) === true, "[CONV-GOLPE] 20 natural é");
confere(golpeForte({ total: 40, cp: 24, natural: 20, noCasco: 0 }) === false, "[CONV-GOLPE] só no Casco");
confere(GOLPES.map((g) => g.chave).join() === "ponte,motores,armas,incendio,brecha,tripulacao", "[CONV-GOLPE] a ordem do d6");
confere(golpeDoD6(4).chave === "incendio", "[CONV-GOLPE] 4 é Incêndio");
confere(danoATripulante(24, 50) === "2d6" && danoATripulante(25, 50) === "1d6", "[CONV-GOLPE] 2d6 abaixo da metade do Casco");
confere(semArmaParaAtirar({ armas: true }, 1) && !semArmaParaAtirar({ armas: true }, 2), "[CONV-GOLPE] arma parada cala só quem tem uma");

// [CONV-IMPACTO]
const c0 = cineDe({ cine: { escudo: { atual: 10, max: 20 } } });
const i1 = aplicarImpactoConves(c0, 50, { dano: 8, golpe: "ponte" });
confere(i1.cine.escudo.atual === 2 && i1.casco === 50 && i1.golpe === null && !i1.cine.golpes.ponte, "[CONV-IMPACTO] parado no Escudo, sem golpe");
const i2 = aplicarImpactoConves(c0, 50, { dano: 15, golpe: "ponte" });
confere(i2.cine.escudo.atual === 0 && i2.casco === 45 && i2.cine.golpes.ponte === true, "[CONV-IMPACTO] o que sobra vai ao Casco, com golpe");
const i3 = aplicarImpactoConves(c0, 50, { dano: 15, golpe: "brecha" });
confere(i3.golpe?.jpr === 2 && !i3.cine.golpes.brecha, "[CONV-IMPACTO] Brecha pede JPR de dois e não fica na nave");
confere(!repararGolpe({ ponte: true }, "ponte").ponte, "[CONV-IMPACTO] reparar tira o golpe");

// [CONV-FUGA]
confere(marcarFuga(0).marcas === 1 && !marcarFuga(1).escapou && marcarFuga(2).escapou && marcarFuga(3).marcas === 3, "[CONV-FUGA] três marcas");

// [CONV-COLAPSO]
confere(avancarColapso(null, 1).colapso === null, "[CONV-COLAPSO] com Casco, nada");
let col = avancarColapso(null, 0);
confere(col.evento === "comecou" && col.colapso.restam === 3, "[CONV-COLAPSO] Casco 0 começa com 3");
col = avancarColapso(col.colapso, 0);
confere(col.evento === "contando" && col.colapso.restam === 2, "[CONV-COLAPSO] 1ª rodada");
col = avancarColapso(col.colapso, 0);
confere(col.evento === "contando" && col.colapso.restam === 1, "[CONV-COLAPSO] 2ª rodada");
col = avancarColapso(col.colapso, 0);
confere(col.evento === "fim" && col.colapso.acabou, "[CONV-COLAPSO] 3ª rodada encerra");
confere(avancarColapso(col.colapso, 0).evento === null, "[CONV-COLAPSO] a JPR final é uma só");
let b = { restam: 3, bonus: 0 };
for (let i = 0; i < 6; i += 1) b = somarSalvamento(b);
confere(b.bonus === 4, "[CONV-COLAPSO] bônus para em +4");

// Duas ações por posto (a Sobrecarga é uma ação em dois botões)
for (const [posto, n] of Object.entries({ leme: 2, artilharia: 2, engenharia: 3, sensores: 2, comando: 2 })) {
  confere(ACOES_CONVES[posto].length === n, `[CONV-PAINEL] ${posto}`);
}

/* ── A opção ──────────────────────────────────────────────────────────────── */

opcoes = {};
registrarOpcoesDeNave();
confere(registradas.naveConves?.default === false && registradas.naveConves?.scope === "world", "[CONV-OPCAO] desligada por padrão");
confere(!combateConves() && !combateCinematico(), "[CONV-OPCAO] desligada, nenhum motor");
opcoes = { naveConves: true };
confere(combateConves() && combateCinematico(), "[CONV-OPCAO] ligada, usa o motor do Cinematográfico");
opcoes = { naveCinematico: true };
confere(!combateConves() && combateCinematico(), "[CONV-OPCAO] o Cinematográfico sozinho continua sendo ele");

/* ── A mesa ───────────────────────────────────────────────────────────────── */

opcoes = { naveConves: true };

// [CONV-PAINEL]
const html = painelConves({ system: { hp: { value: 0, max: 50 } } }, { cine: { golpes: { ponte: true }, colapso: { restam: 2, bonus: 1 }, fuga: 1 } }, { rodada: 2 });
confere(html.includes("Combate de Convés") && html.includes("Sobrecarga") && !html.includes("sd-cine-prioridade"), "[CONV-PAINEL] sem Prioridade");
confere(html.includes("restam 2") && html.includes("sd-conves-salvar") && html.includes("1 de 3"), "[CONV-PAINEL] Colapso e fuga visíveis");
confere(!html.includes('data-vantagem="bloqueio"') && html.includes('data-vantagem="mira"'), "[CONV-PAINEL] só Mira e Na cauda");

const atirador = novaNave({ id: "a", cine: { trava: "tok-b" } });
const alvo = novaNave({ id: "b", cine: { escudo: { atual: 5, max: 20 }, recarga: "2d10" } });
const tokB = { id: "tok-b", name: "b", actor: alvo, document: { uuid: "Actor.b" } };
const tokA = { id: "tok-a", name: "a", actor: atirador, document: { uuid: "Actor.a" } };
globalThis.canvas = { tokens: { placeables: [tokA, tokB] } };
const tripulante = {
  id: "t", uuid: "Actor.t", name: "Talik", isOwner: true, type: "character", items: [],
  flags: {}, system: { hp: { value: 30, max: 30 }, jp: 12, jpd_total: 12, mod_destreza: 0 },
  async update(m) { for (const [k, v] of Object.entries(m)) setPath(this, k, v); return this; },
};
globalThis.fromUuid = async (u) => ({ "Actor.b": alvo, "Actor.a": atirador, "Actor.t": tripulante })[u];
game.user.targets = new Set([tokB]);
game.combat = { id: "c1", round: 4 };

// Rodada 4: Tensão +3, Travar +2, artilheiro 5. d20 10 → 10 + 12 + 5 + 3 + 2 = 32, margem 8 contra CP 24
dialogo = { artilheiro: "5", situacao: "0" };
roteiro.d20 = [10];
roteiro["3d10"] = [20]; // 2d10 + 1 dado da 4ª rodada
roteiro["1d6"] = [1];
const tiro = await dispararCine(ctxDe(atirador), { item: { name: "Laser" }, chave: "laser", arma: { nome: "Laser", dano: "2d10" } });
confere(tiro?.acerto === true && tiro.impacto?.dano === 20 && tiro.impacto.golpe === "ponte", `[CONV-MESA] disparo: ${JSON.stringify(tiro?.impacto)}`);

const msg = { setFlag: async () => {} };
await aplicarImpactoCineDaMensagem(msg, tiro.impacto);
confere(alvo.system.hp.value === 35 && cineAtor(alvo).escudo.atual === 0 && cineAtor(alvo).golpes.ponte === true, "[CONV-MESA] aplicar: Escudo 5, Casco −15, Ponte atingida");

await PARA_TESTE.acao(ctxDe(alvo), "resolver", { camara: "incendio" });
confere(avisos.length === 1, "[CONV-MESA] reparar o que não foi atingido avisa");

roteiro["2d10"] = [9];
await PARA_TESTE.acao(ctxDe(alvo), "recompor", { posto: "comando" });
confere(cineAtor(alvo).escudo.atual === 9 && cineAtor(alvo).recomposto === true, "[CONV-MESA] Recompor recarrega");
await PARA_TESTE.acao(ctxDe(alvo), "recompor", { posto: "comando" });
confere(cineAtor(alvo).escudo.atual === 9 && avisos.length === 2, "[CONV-MESA] Recompor só uma vez por combate");

// Incêndio no fim da rodada e Colapso pelo Casco zerado
const queimando = novaNave({ id: "q", hp: 3, cine: { golpes: { incendio: true } } });
queimando.flags.spacedragon.nave.postos = { leme: "Talik" };
game.actors.getName = (n) => (n === "Talik" ? tripulante : null);
roteiro["1d6"] = [5];
await fecharRodadaDaNave(queimando, { combate: "c1", rodada: 4 });
confere(queimando.system.hp.value === -2 && cineAtor(queimando).colapso?.restam === 3, "[CONV-MESA] incêndio leva o Casco a 0 e abre o Colapso");
await PARA_TESTE.salvamento(ctxDe(queimando));
confere(cineAtor(queimando).colapso.bonus === 1, "[CONV-MESA] salvamento soma +1");
roteiro["1d6"] = [2, 2, 2];
await fecharRodadaDaNave(queimando, { combate: "c1", rodada: 5 });
await fecharRodadaDaNave(queimando, { combate: "c1", rodada: 6 });
const antes = mensagens.length;
await fecharRodadaDaNave(queimando, { combate: "c1", rodada: 7 });
const cartoes = mensagens.slice(antes).map((m) => m.content).join("");
confere(cineAtor(queimando).colapso?.acabou === true, "[CONV-MESA] o Colapso acaba na 3ª rodada seguinte");
confere(cartoes.includes("sd-conves-jpr-final") && cartoes.includes('data-bonus="1"'), "[CONV-MESA] o cartão final leva a JPR com o bônus");

// A JPR final: JP 12. d20 11 + 1 passa; d20 10 + 1 morre
roteiro.d20 = [11];
roteiro["1d6"] = [4];
const vivo = await rolarJprFinal("Actor.t", 1);
confere(vivo?.morreu === false && tripulante.system.hp.value === 4, `[CONV-MESA] passou: sobrevive com 1d6 PV (${JSON.stringify(vivo)})`);
roteiro.d20 = [10];
const morto = await rolarJprFinal("Actor.t", 1);
confere(morto?.morreu === true, "[CONV-MESA] falhou: morre");
confere(mensagens.at(-1).content.includes("morreu"), "[CONV-MESA] o cartão anuncia a morte");

// Achados da revisão
const ferido = { ...tripulante, system: { ...tripulante.system, hp: { value: -3, max: 30 } }, update: tripulante.update };
globalThis.fromUuid = async () => ferido;
roteiro.d20 = [18];
roteiro["1d6"] = [2];
await rolarJprFinal("Actor.t", 0);
confere(ferido.system.hp.value === 2, "[CONV-MESA] quem passa fica com o 1d6 de PV, mesmo vindo de PV negativo");

const baixa = novaNave({ id: "c", hp: 10, max: 50, cine: { pilotar: 50, agilidade: 0 } });
roteiro["1d100"] = [45];
await PARA_TESTE.acao(ctxDe(baixa), "fuga", { posto: "leme" });
confere(!cineAtor(baixa).fuga, "[CONV-FUGA] Casco abaixo da metade tira 20% (45 contra 30 falha)");

const lancador = novaNave({ id: "l", armas: 1, cine: { porRodada: { 4: { prioridade: ["sobrecarga"] } } } });
game.combat = { id: "c1", round: 4 };
game.user.targets = new Set([tokB]);
roteiro["6d10"] = [33];
const missil = await dispararCine(ctxDe(lancador), { item: { name: "Míssil" }, chave: "misseis", arma: { nome: "Míssil", dano: "4d10" } });
confere(missil?.impacto?.dano === 33, "[CONV-DADO] míssil na 4ª rodada com Sobrecarga: 4d10 + 2 dados");
confere(!(cineAtor(lancador).porRodada?.[4]?.prioridade ?? []).length, "[CONV-DADO] o míssil gasta a Sobrecarga");

const calado = novaNave({ id: "m", armas: 1, cine: { golpes: { armas: true } } });
confere(await dispararCine(ctxDe(calado), { item: { name: "Míssil" }, chave: "misseis", arma: { nome: "Míssil", dano: "4d10" } }) === null, "[CONV-MESA] Armas atingida cala o lançador único");

const critica = novaNave({ id: "v", cine: { duelo: { rodada: 4, grau: "critico" } } });
game.user.targets = new Set([tokB]);
await PARA_TESTE.vantagem(ctxDe(critica), "mira");
await PARA_TESTE.vantagem(ctxDe(critica), "cauda");
confere(cineAtor(critica).porRodada[4].vantagens["tok-b"].chaves.join() === "cauda", "[CONV-MESA] Crítico não dá as duas: Mira ou Na cauda");

// Encerrar limpa o que é do combate
game.users = { activeGM: { id: "m" } };
game.user.id = "m";
game.combat = null;
await PARA_TESTE.encerrar(ctxDe(queimando));
const fim = cineAtor(queimando);
confere(!fim.colapso && !fim.golpes.incendio && fim.fuga === 0 && !fim.recomposto, "[CONV-MESA] encerrar limpa golpes, Colapso e fuga");

if (problemas.length) {
  console.error(`✘ ${problemas.length} problema(s):\n  ${problemas.join("\n  ")}`);
  process.exit(1);
}
console.log("✔ Combate de Convés: regra e mesa conferem.");
