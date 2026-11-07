/**
 * O Combate Cinematográfico na mesa, com um Foundry de brinquedo
 * (nave-cine-acoes.js): o que só existe dentro do VTT — Roll, ChatMessage,
 * DialogV2, o combate, os tokens e o `actor.update` por caminho.
 *
 * ⚠️ Não substitui testar na mesa: prova que as rolagens, as gravações e os
 * cartões saem certos com a API fingida; não prova que a API real é igual.
 *
 * ── O QUE ESTE TESTE GARANTE ────────────────────────────────────────────────
 *
 *   · [CINEM-ESCALA]   o botão de escala grava Escudo, Agilidade, Recarga e o
 *                      Casco no PV nativo;
 *   · [CINEM-DUELO]    o duelo rola o d100 com a chance certa, grava o grau e
 *                      põe a iniciativa na ordem do duelo; a Sala de Máquinas
 *                      Fora perde sem rolar; a Interferência inimiga tira 20%;
 *   · [CINEM-DISPARO]  o tiro soma Tensão, Mira e Firmar, rola o d12 com margem
 *                      5+ no Casco, e o cartão leva o impacto para o Mestre;
 *   · [CINEM-APLICAR]  aplicar desconta Escudo e Casco e grava a avaria no alvo;
 *   · [CINEM-FIM]      o fim da rodada cobra o incêndio no Casco, recarrega pela
 *                      Prioridade e limpa a rodada;
 *   · [CINEM-ENCERRAR] Fora vira câmara danificada, e o Escudo volta cheio;
 *   · [CINEM-ACOES]    Reparo não repete em rodadas seguidas; Forçar com 1
 *                      avaria a Sala de Máquinas.
 *
 *     node tools/teste-nave-cine-mesa.mjs
 */

import { instalarLang } from "./lang-de-teste.mjs";
import { dispararCine, aplicarImpactoCineDaMensagem, PARA_TESTE } from "../spacedragon-module/module/nave-cine-acoes.js";

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

/* ── O Foundry de brinquedo ──────────────────────────────────────────────── */

// Rolagens roteirizadas: cada fórmula tira da fila dela; sem roteiro, a média.
const roteiro = {};
const rolado = [];
globalThis.Roll = class {
  constructor(formula) { this.formula = formula; }
  async evaluate() {
    const fila = roteiro[this.formula];
    const m = this.formula.match(/^1d20/);
    if (fila?.length) this.total = fila.shift();
    else this.total = 1;
    if (m) {
      // o d20 natural é o primeiro número da fila "d20"; o total soma os termos
      const nat = roteiro.d20?.shift() ?? 10;
      const soma = this.formula.replace(/^1d20/, "").replace(/\s+/g, "")
        .match(/[+-]\d+/g)?.reduce((s, n) => s + Number(n), 0) ?? 0;
      this.dice = [{ total: nat }];
      this.total = nat + soma;
    }
    rolado.push([this.formula, this.total]);
    return this;
  }
};
const mensagens = [];
globalThis.ChatMessage = {
  create: async (dados) => { mensagens.push(dados); return dados; },
  getSpeaker: () => ({}),
};
const avisos = [];
globalThis.ui = { notifications: { warn: (m) => avisos.push(["warn", m]), info: (m) => avisos.push(["info", m]) } };
let dialogo = null;
globalThis.foundry = { applications: { api: { DialogV2: { wait: async () => dialogo } } } };

function setPath(obj, caminho, valor) {
  const partes = caminho.split(".");
  let o = obj;
  for (let i = 0; i < partes.length - 1; i += 1) o = o[partes[i]] ??= {};
  const ultima = partes.at(-1);
  if (ultima.startsWith("-=")) delete o[ultima.slice(2)];
  else o[ultima] = structuredClone(valor);
}

function novaNave({ id, nome, tipo = "particular", tamanho = "Média", hp = 40, cp = 26, cine = {}, camaras = {}, grupo = false, escudo = true }) {
  return {
    id, name: nome, hasPlayerOwner: grupo,
    flags: { core: { sheetClass: "spacedragon.NaveSheet" }, spacedragon: { nave: { tipo, tamanho, postos: {}, camaras, cine } } },
    system: { hp: { value: hp, max: hp }, ba: 12, ac_total: cp, race: { name: "" } },
    items: escudo ? [{ flags: { spacedragon: { equipamentoDeNave: { chave: "escudo" } } } }] : [],
    getActiveTokens() { return [{ id: `tok-${id}` }]; },
    async update(mud) { for (const [k, v] of Object.entries(mud)) setPath(this, k, v); return this; },
  };
}
const ctxDe = (ator) => ({
  ator, token: { id: `tok-${ator.id}` }, editavel: () => true,
  gravar: async (antes, depois) => {
    const { updateDaNave } = await import("../spacedragon-module/module/nave-pc-dados.js");
    const mud = updateDaNave(antes, depois, "spacedragon");
    if (mud) await ator.update(mud);
  },
});
const cineDeAtor = (a) => a.flags.spacedragon.nave.cine;

const iniciativas = {};
function combate(round, atores) {
  globalThis.game.combat = {
    id: "c1", round,
    combatants: { find: (fn) => atores.map((a) => ({ id: `cb-${a.id}`, actorId: a.id, tokenId: `tok-${a.id}` })).find(fn) },
    setInitiative: async (id, v) => { iniciativas[id] = v; },
  };
}

globalThis.game = { user: { targets: new Set() }, actors: { getName: () => ({ system: { bad: 3 } }) } };
instalarLang();

const presa = novaNave({ id: "presa", nome: "Presa de Krayt", grupo: true, camaras: { deposito: "instalada" } });
const thw = novaNave({ id: "thw", nome: "Dunelizard", tipo: "caca", tamanho: "Pequena", hp: 20, cp: 28, escudo: false });
const tokPresa = { id: "tok-presa", name: "Presa de Krayt", actor: presa, document: { uuid: "Actor.presa" } };
const tokThw = { id: "tok-thw", name: "Dunelizard", actor: thw, document: { uuid: "Actor.thw" } };
globalThis.canvas = { tokens: { placeables: [tokPresa, tokThw] } };
globalThis.fromUuid = async (u) => ({ "Actor.presa": presa, "Actor.thw": thw })[u];

// ── [CINEM-ESCALA] ──
await PARA_TESTE.aplicarEscalaDaNave(ctxDe(presa));
confere(cineDeAtor(presa).escudo.max === 15 && cineDeAtor(presa).escudo.atual === 15 && cineDeAtor(presa).recarga === "1d10",
  `[CINEM-ESCALA] Escudo 15/15 e Recarga 1d10: ${JSON.stringify(cineDeAtor(presa).escudo)}`);
confere(presa.system.hp.max === 40 && presa.system.hp.value === 40, "[CINEM-ESCALA] Casco 40 no PV nativo");
await PARA_TESTE.aplicarEscalaDaNave(ctxDe(thw));
confere(cineDeAtor(thw).escudo.max === 0 && thw.system.hp.max === 20 && cineDeAtor(thw).agilidade === 20, "[CINEM-ESCALA] caça: sem Escudo, Casco 20, Agilidade +20");

// ── [CINEM-DUELO] ──
combate(1, [presa, thw]);
cineDeAtor(presa).pilotar = 84;
roteiro["1d100"] = [18];
await PARA_TESTE.duelo(ctxDe(presa));
confere(cineDeAtor(presa).duelo?.grau === "otimo" && cineDeAtor(presa).duelo?.rodada === 1, `[CINEM-DUELO] Talik tira 18 com 84%: Ótimo (${JSON.stringify(cineDeAtor(presa).duelo)})`);
const cartaoDuelo = mensagens.at(-1).content;
confere(/Chance 84%/.test(cartaoDuelo) && /Ótimo/.test(cartaoDuelo) && /JP da nave \+4/.test(cartaoDuelo), "[CINEM-DUELO] o cartão mostra a chance, o grau e a JP");
cineDeAtor(thw).pilotar = 55;
roteiro["1d100"] = [40];
await PARA_TESTE.duelo(ctxDe(thw));
confere(iniciativas["cb-presa"] > iniciativas["cb-thw"], `[CINEM-DUELO] o grupo venceu e age antes: ${JSON.stringify(iniciativas)}`);
// Interferência da Presa no Dunelizard, para o duelo da rodada 2
cineDeAtor(presa).interferencia = { alvo: "tok-thw", ate: 2 };
combate(2, [presa, thw]);
roteiro["1d100"] = [70];
await PARA_TESTE.duelo(ctxDe(thw));
confere(/Chance 55%/.test(mensagens.at(-1).content) && /Interferência/.test(mensagens.at(-1).content),
  "[CINEM-DUELO] Interferência: 55 + 20 − 20 = 55%");
confere(cineDeAtor(thw).duelo.grau === "falha", "[CINEM-DUELO] 70 com 55%: falha");
cineDeAtor(thw).avarias = { maquinas: { estado: "fora", desde: 1 } };
const rolagensAntes = rolado.length;
await PARA_TESTE.duelo(ctxDe(thw));
confere(cineDeAtor(thw).duelo.grau === "desastre" && rolado.length === rolagensAntes, "[CINEM-DUELO] Máquinas Fora: perde sem rolar");
cineDeAtor(thw).avarias = {};

// ── [CINEM-DISPARO] ──
combate(2, [presa, thw]);
cineDeAtor(presa).vantagens = { "tok-thw": { chave: "mira", nome: "Dunelizard" } };
cineDeAtor(presa).firmar = true;
globalThis.game.user.targets = new Set([tokThw]);
dialogo = { artilheiro: "3", situacao: "0", camara: "ponte" };
roteiro.d20 = [13];
roteiro["2d10"] = [12];
roteiro["1d12"] = [4];
const tiro = await dispararCine(ctxDe(presa), { item: { name: "Canhão em torre" }, chave: "disparadores", arma: { nome: "Disparadores laser", dano: "2d10" } });
// +12 BA, +3 artilheiro, +1 Tensão (rodada 2), +2 Mira, +2 Firmar = +20; 13 + 20 = 33 contra CP 28: margem 5
const cartaoTiro = mensagens.at(-1).content;
confere(tiro.acerto && /<strong>33<\/strong>/.test(cartaoTiro), `[CINEM-DISPARO] 13 + 20 = 33: ${cartaoTiro.slice(0, 300)}`);
confere(tiro.impacto?.modo === "cine" && tiro.impacto.dano === 12 && tiro.impacto.camara === "deposito", `[CINEM-DISPARO] impacto com câmara do d12 (4 = Depósito): ${JSON.stringify(tiro.impacto)}`);
confere(/Tensão/.test(cartaoTiro) && /Mira/.test(cartaoTiro) && /Firmar/.test(cartaoTiro), "[CINEM-DISPARO] o cartão nomeia Tensão, Mira e Firmar");
confere(/sd-aplicar-impacto/.test(cartaoTiro) && mensagens.at(-1).flags?.spacedragon?.impacto, "[CINEM-DISPARO] o cartão tem o botão e a flag de impacto");

// ── [CINEM-APLICAR] ──
const msg = { flags: {}, async setFlag(_e, k, v) { this.flags[k] = v; } };
await aplicarImpactoCineDaMensagem(msg, tiro.impacto);
// o caça não tem o Depósito (ausente) — o extra veio no tiro
confere(thw.system.hp.value === 20 - 12 - (tiro.impacto.extraAusente || 0), `[CINEM-APLICAR] o caça leva 12 + o extra da câmara ausente: Casco ${thw.system.hp.value}`);
confere(msg.flags.impacto?.aplicado === true, "[CINEM-APLICAR] a mensagem fica marcada como aplicada");
// contra a Presa: 9 cai inteiro no Escudo
await aplicarImpactoCineDaMensagem({ async setFlag() {} }, { modo: "cine", alvo: "Actor.presa", dano: 9, camara: "deposito", rodada: 2 });
confere(cineDeAtor(presa).escudo.atual === 6 && presa.system.hp.value === 40 && !cineDeAtor(presa).avarias?.deposito,
  "[CINEM-APLICAR] 9 de dano: tudo no Escudo, nenhuma câmara");
await aplicarImpactoCineDaMensagem({ async setFlag() {} }, { modo: "cine", alvo: "Actor.presa", dano: 13, camara: "deposito", rodada: 2 });
confere(cineDeAtor(presa).escudo.atual === 0 && presa.system.hp.value === 33 && cineDeAtor(presa).avarias?.deposito?.estado === "avaria",
  `[CINEM-APLICAR] 13: 6 no Escudo, 7 no Casco, Depósito em chamas (${JSON.stringify(cineDeAtor(presa).avarias)})`);

// ── [CINEM-FIM] ──
cineDeAtor(presa).prioridade = ["escudos"];
roteiro["1d6"] = [3];
roteiro["1d10"] = [7];
await PARA_TESTE.fimDaRodada(ctxDe(presa));
confere(presa.system.hp.value === 30, `[CINEM-FIM] o incêndio cobra 3 do Casco: ${presa.system.hp.value}`);
confere(cineDeAtor(presa).escudo.atual === 7, `[CINEM-FIM] Prioridade Escudos recarrega 7: ${cineDeAtor(presa).escudo.atual}`);
confere(!cineDeAtor(presa).firmar && !(cineDeAtor(presa).prioridade ?? []).length && !Object.keys(cineDeAtor(presa).vantagens ?? {}).length,
  "[CINEM-FIM] Firmar, Prioridade e Vantagens saem");
confere(cineDeAtor(presa).avarias?.deposito?.estado === "avaria", "[CINEM-FIM] o incêndio continua até alguém apagar");

// ── [CINEM-ACOES] ──
roteiro["1d10"] = [5];
await PARA_TESTE.acao(ctxDe(presa), "reparo");
confere(presa.system.hp.value === 35 && cineDeAtor(presa).ultimoReparo === 2, "[CINEM-ACOES] Reparo de emergência: +5 de Casco");
combate(3, [presa, thw]);
avisos.length = 0;
await PARA_TESTE.acao(ctxDe(presa), "reparo");
confere(presa.system.hp.value === 35 && avisos.some(([k]) => k === "warn"), "[CINEM-ACOES] na rodada seguinte, o Reparo recusa");
roteiro["1d6"] = [1];
await PARA_TESTE.acao(ctxDe(presa), "forcar");
confere(cineDeAtor(presa).forcado && cineDeAtor(presa).avarias.maquinas?.estado === "avaria", "[CINEM-ACOES] Forçar com 1: avaria na Sala de Máquinas");
await PARA_TESTE.acao(ctxDe(presa), "resolver", { camara: "deposito" });
confere(!cineDeAtor(presa).avarias.deposito, "[CINEM-ACOES] Resolver apaga o incêndio do Depósito");

// ── [CINEM-ENCERRAR] ──
cineDeAtor(presa).avarias = { ponte: { estado: "fora", desde: 2 }, arsenal: { estado: "avaria", desde: 3 } };
presa.flags.spacedragon.nave.camaras = { ponte: "instalada", arsenal: "instalada" };
await PARA_TESTE.encerrar(ctxDe(presa));
confere(presa.flags.spacedragon.nave.camaras.ponte === "danificada", "[CINEM-ENCERRAR] Ponte Fora fica danificada");
confere(presa.flags.spacedragon.nave.camaras.arsenal === "instalada" && /Arsenal/.test(mensagens.at(-1).content), "[CINEM-ENCERRAR] o Arsenal pede o último teste");
confere(!Object.keys(cineDeAtor(presa).avarias ?? {}).length && cineDeAtor(presa).escudo.atual === 15, "[CINEM-ENCERRAR] avarias limpas, Escudo cheio");

if (problemas.length) {
  console.error(`${problemas.length} problema(s) no Combate Cinematográfico na mesa:`);
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log("✔ Combate Cinematográfico na mesa: escala, duelo, disparo, impacto, fim da rodada, ações e encerramento conferem.");
