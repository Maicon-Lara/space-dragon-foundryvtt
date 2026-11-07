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
let confirmar = true;
globalThis.foundry = { applications: { api: { DialogV2: { wait: async () => dialogo, confirm: async () => confirmar } } } };

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

// a Presa entra com o PV do livro (3d100 = 187): a escala o guarda
const presa = novaNave({ id: "presa", nome: "Presa de Krayt", grupo: true, hp: 187, camaras: { deposito: "instalada" } });
const thw = novaNave({ id: "thw", nome: "Dunelizard", tipo: "caca", tamanho: "Pequena", hp: 20, cp: 28, escudo: false });
const tokPresa = { id: "tok-presa", name: "Presa de Krayt", actor: presa, document: { uuid: "Actor.presa" } };
const tokThw = { id: "tok-thw", name: "Dunelizard", actor: thw, document: { uuid: "Actor.thw" } };
globalThis.canvas = { tokens: { placeables: [tokPresa, tokThw] } };
globalThis.fromUuid = async (u) => ({ "Actor.presa": presa, "Actor.thw": thw })[u];

// ── [CINEM-ESCALA] ──
confirmar = false;
await PARA_TESTE.aplicarEscalaDaNave(ctxDe(presa));
confere(presa.system.hp.max === 187 && !cineDeAtor(presa).escudo, "[CINEM-ESCALA] recusada a confirmação, nada muda");
confirmar = true;
await PARA_TESTE.aplicarEscalaDaNave(ctxDe(presa));
confere(cineDeAtor(presa).pvLivro?.max === 187, "[CINEM-ESCALA] o PV do livro (187) fica guardado");
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
cineDeAtor(presa).vantagens = { "tok-thw": { chaves: ["mira"], nome: "Dunelizard" } };
cineDeAtor(presa).firmar = { rodada: 2 };
cineDeAtor(presa).trava = "tok-thw";
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
confere(cineDeAtor(presa).trava === null, "[CINEM-DISPARO] o acerto no Casco do alvo travado gasta a Trava");
confere(cineDeAtor(presa).turno === 2, "[CINEM-DISPARO] atirar marca o turno da nave");

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
confere(!(cineDeAtor(presa).prioridade ?? []).length && !Object.keys(cineDeAtor(presa).vantagens ?? {}).length,
  "[CINEM-FIM] Prioridade e Vantagens saem");
confere(cineDeAtor(presa).firmar?.rodada === 2, "[CINEM-FIM] o Firmar da rodada 2 fica para o CP até o turno da nave na 3");
const hpAntes = presa.system.hp.value;
avisos.length = 0;
await PARA_TESTE.fimDaRodada(ctxDe(presa));
confere(presa.system.hp.value === hpAntes && avisos.some(([k]) => k === "warn"), "[CINEM-FIM] o segundo clique na mesma rodada não cobra de novo");
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

// ── [CINEM-REVISAO] os achados da revisão independente ──
{
  // o combatente pelo TOKEN: dois caças do mesmo ator
  const lista = [{ id: "cb-x", actorId: "thw", tokenId: "tok-x" }, { id: "cb-certo", actorId: "thw", tokenId: "tok-thw" }];
  globalThis.game.combat = { id: "c2", round: 3, combatants: { find: (fn) => lista.find(fn) }, setInitiative: async (id, v) => { iniciativas[id] = v; } };
  roteiro["1d100"] = [30];
  await PARA_TESTE.duelo(ctxDe(thw));
  confere(iniciativas["cb-certo"] !== undefined && iniciativas["cb-x"] === undefined, `[CINEM-REVISAO] a iniciativa vai para o token que duelou: ${JSON.stringify(iniciativas)}`);

  // Máquinas Fora: no fim da fila, abaixo de qualquer grau
  cineDeAtor(thw).avarias = { maquinas: { estado: "fora", desde: 1 } };
  await PARA_TESTE.duelo(ctxDe(thw));
  confere(iniciativas["cb-certo"] === 0, "[CINEM-REVISAO] Máquinas Fora: iniciativa 0, perde até no desempate");
  cineDeAtor(thw).avarias = {};

  // com a Ordem de Ação do módulo ligada, o duelo não mexe no rastreador
  delete iniciativas["cb-certo"];
  globalThis.game.settings = { get: (_m, k) => k === "ordemDeAcao" };
  roteiro["1d100"] = [30];
  await PARA_TESTE.duelo(ctxDe(thw));
  confere(iniciativas["cb-certo"] === undefined && /Ordem de Ação/.test(mensagens.at(-1).content), "[CINEM-REVISAO] Ordem de Ação ligada: não grava e avisa");
  delete globalThis.game.settings;

  combate(3, [presa, thw]);
  globalThis.game.user.targets = new Set([tokThw]);
  // Prioridade Armas: +1 dado numa arma, à escolha
  cineDeAtor(presa).prioridade = ["armas"];
  cineDeAtor(presa).armasUsadas = 0;
  cineDeAtor(thw).escudo = { atual: 0, max: 0 };
  thw.system.hp.value = 20;
  dialogo = { artilheiro: "3", situacao: "0", armas: "on" };
  roteiro.d20 = [15];
  roteiro["3d10"] = [16];
  const t1 = await dispararCine(ctxDe(presa), { item: { name: "Torre" }, chave: "disparadores", arma: { nome: "Disparadores laser", dano: "2d10" } });
  confere(t1.acerto && rolado.some(([f]) => f === "3d10") && cineDeAtor(presa).armasUsadas === 1, "[CINEM-REVISAO] Prioridade Armas: 3d10 numa arma, e fica gasta");
  dialogo = { artilheiro: "3", situacao: "0" };
  roteiro.d20 = [15];
  const antes = rolado.length;
  await dispararCine(ctxDe(presa), { item: { name: "Laser 2" }, chave: "disparadores", arma: { nome: "Disparadores laser", dano: "2d10" } });
  confere(rolado.slice(antes).some(([f]) => f === "2d10"), "[CINEM-REVISAO] a segunda arma rola 2d10: a Prioridade era de uma só");

  // a câmara do formulário só vale se for uma das doze
  dialogo = { artilheiro: "3", situacao: "0", mirar: "on", camara: "<img src=x>" };
  roteiro.d20 = [20];
  roteiro["1d12"] = [6];
  const t3 = await dispararCine(ctxDe(presa), { item: { name: "Torre" }, chave: "disparadores", arma: { nome: "Disparadores laser", dano: "2d10" } });
  confere(t3.impacto?.camara === "arsenal" && !mensagens.at(-1).content.includes("<img"), `[CINEM-REVISAO] câmara inválida: cai no d12 e nada entra no chat (${t3.impacto?.camara})`);
  confere(Number(t3.impacto?.extraAusente) > 0 && Number(t3.impacto?.extraArsenal) > 0, "[CINEM-REVISAO] os extras saem rolados no tiro, para qualquer desfecho");

  // o míssil chega pela JP, não rola contra o CP
  roteiro["4d10"] = [22];
  const d20Antes = roteiro.d20.length;
  const m = await dispararCine(ctxDe(presa), { item: { name: "Mísseis" }, chave: "misseis", arma: { nome: "Mísseis teleguiados", dano: "4d10" } });
  confere(m.impacto?.dano === 22 && m.impacto.camara === null && /JP/.test(mensagens.at(-1).content) && roteiro.d20.length === d20Antes,
    "[CINEM-REVISAO] míssil: 4d10 no cartão, aplicar só se o alvo falhar na JP, sem d20");

  // Giro evasivo: só P ou M; o cargueiro não gira
  const cargueiro = novaNave({ id: "carg", nome: "Vazio Doce", tipo: "cargueiro", tamanho: "Gigantesca", hp: 80, cp: 24 });
  avisos.length = 0;
  await PARA_TESTE.acao(ctxDe(cargueiro), "giro");
  confere(avisos.some(([k, t]) => k === "warn" && /Pequena ou Média/.test(t)) && !cineDeAtor(cargueiro).giro, "[CINEM-REVISAO] cargueiro não faz Giro evasivo");

  // Forçar com 1 com Máquinas já avariada: Fora, e o Escudo cai a 0 na hora
  cineDeAtor(presa).escudo = { atual: 15, max: 15 };
  cineDeAtor(presa).avarias = { maquinas: { estado: "avaria", desde: 3 } };
  roteiro["1d6"] = [1];
  await PARA_TESTE.acao(ctxDe(presa), "forcar");
  confere(cineDeAtor(presa).avarias.maquinas.estado === "fora" && cineDeAtor(presa).escudo.atual === 0, "[CINEM-REVISAO] Máquinas Fora pelo reator: Escudo 0 na hora");
}

// ── [CINEM-ENCERRAR] ──
cineDeAtor(presa).avarias = { ponte: { estado: "fora", desde: 2 }, arsenal: { estado: "avaria", desde: 3 } };
presa.flags.spacedragon.nave.camaras = { ponte: "instalada", arsenal: "instalada" };
await PARA_TESTE.encerrar(ctxDe(presa));
confere(presa.flags.spacedragon.nave.camaras.ponte === "danificada", "[CINEM-ENCERRAR] Ponte Fora fica danificada");
confere(presa.flags.spacedragon.nave.camaras.arsenal === "instalada" && /Arsenal/.test(mensagens.at(-1).content), "[CINEM-ENCERRAR] o Arsenal pede o último teste");
confere(!Object.keys(cineDeAtor(presa).avarias ?? {}).length && cineDeAtor(presa).escudo.atual === 15, "[CINEM-ENCERRAR] avarias limpas, Escudo cheio");

// ── [CINEM-LIVRO] voltar ao PV do livro ──
await PARA_TESTE.voltarAoLivro(ctxDe(presa));
confere(presa.system.hp.max === 187 && presa.system.hp.value === 187 && !cineDeAtor(presa).pvLivro?.max, `[CINEM-LIVRO] o PV do livro volta, e o backup sai (${JSON.stringify(presa.system.hp)})`);

if (problemas.length) {
  console.error(`${problemas.length} problema(s) no Combate Cinematográfico na mesa:`);
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log("✔ Combate Cinematográfico na mesa: escala, duelo, disparo, impacto, fim da rodada, ações e encerramento conferem.");
