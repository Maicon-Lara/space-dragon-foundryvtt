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
 *                      avaria a Sala de Máquinas;
 *   · [CINEM-TRIP]     o tripulante vinculado ao posto: o duelo usa o Pilotar
 *                      da ficha do piloto e fala por ele; o disparo traz o BA
 *                      do artilheiro; Resolver avaria rola o teste de quem
 *                      tenta (falhou, a avaria fica; incêndio, sem teste); a
 *                      câmara atingida pede JPR a quem está nela, e a falha
 *                      custa 1d6 de PV.
 *
 *     node tools/teste-nave-cine-mesa.mjs
 */

import { instalarLang } from "./lang-de-teste.mjs";
import { pilotarDe, consertoDe } from "../spacedragon-module/module/nave-tripulante.js";
import {
  dispararCine, aplicarImpactoCineDaMensagem, rolarJprDoTripulante, PARA_TESTE, fecharRodadaDaNave, fecharRodadaDoCombate, fecharRodadaPeloRastreador,
  guardarRodadaAntes, OPCAO_RODADA_ANTES, comecarCombate,
} from "../spacedragon-module/module/nave-cine-acoes.js";

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
cineDeAtor(presa).porRodada = { 2: { vantagens: { "tok-thw": { chaves: ["mira"], nome: "Dunelizard" } } } };
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

// ── [CINEM-FIM] o fim da rodada, pelo rastreador ──
cineDeAtor(presa).porRodada = { 2: { prioridade: ["escudos"] } };
roteiro["1d6"] = [3];
roteiro["1d10"] = [7];
confere(await fecharRodadaDaNave(presa, { combate: "c1", rodada: 2 }) === true, "[CINEM-FIM] fecha a rodada 2");
confere(presa.system.hp.value === 30, `[CINEM-FIM] o incêndio cobra 3 do Casco: ${presa.system.hp.value}`);
confere(cineDeAtor(presa).escudo.atual === 7, `[CINEM-FIM] Prioridade Escudos recarrega 7: ${cineDeAtor(presa).escudo.atual}`);
confere(!cineDeAtor(presa).porRodada?.[2]?.prioridade?.length && !Object.keys(cineDeAtor(presa).porRodada?.[2]?.vantagens ?? {}).length,
  "[CINEM-FIM] Prioridade e Vantagens saem");
confere(cineDeAtor(presa).firmar?.rodada === 2, "[CINEM-FIM] o Firmar da rodada 2 fica para o CP até o turno da nave na 3");
const hpAntes = presa.system.hp.value;
confere(await fecharRodadaDaNave(presa, { combate: "c1", rodada: 2 }) === false && presa.system.hp.value === hpAntes, "[CINEM-FIM] a mesma rodada não se fecha duas vezes");
{
  // o gancho: só o Mestre ativo fecha, só ao AVANÇAR, uma vez por ator, e o Evento sai uma vez
  const a = novaNave({ id: "a", nome: "Nave A", camaras: { deposito: "instalada" } });
  const b = novaNave({ id: "b", nome: "Nave B" });
  cineDeAtor(a).avarias = { deposito: { estado: "avaria", desde: 3 } };
  const naoNave = { id: "p", name: "Piloto", flags: {}, system: {} };
  const comb = { id: "cX", previous: { round: 3 }, combatants: [{ actor: a }, { actor: a }, { actor: b }, { actor: naoNave }] };
  const antesMsgs = mensagens.length;
  globalThis.game.user = { ...globalThis.game.user, id: "jogador", isGM: false };
  globalThis.game.users = { activeGM: { id: "mestre" } };
  roteiro["1d6"] = [2, 2];
  confere(await fecharRodadaPeloRastreador(comb, { round: 4 }) === 0 && a.system.hp.value === 40, "[CINEM-FIM] no cliente de um jogador, o gancho não fecha nada");
  globalThis.game.user = { ...globalThis.game.user, id: "mestre", isGM: true };
  confere(await fecharRodadaPeloRastreador(comb, { round: 3 }) === 0, "[CINEM-FIM] voltar o rastreador não fecha nada");
  confere(await fecharRodadaPeloRastreador(comb, { round: 4 }) === 2, "[CINEM-FIM] o Mestre avança da 3 para a 4: fecha a 3 das duas naves");
  confere(a.system.hp.value === 38 && cineDeAtor(a).fimRodada?.combate === "cX" && cineDeAtor(a).fimRodada?.rodada === 3,
    `[CINEM-FIM] a nave A (dois tokens) cobra o fogo uma vez só: ${a.system.hp.value}`);
  confere(mensagens.slice(antesMsgs).some((m) => /Tensão chega a \+3/.test(m.content)), "[CINEM-FIM] a Tensão chega a +3 na rodada 4: um lembrete de Evento");
  confere(await fecharRodadaDoCombate(comb, 3) === 0, "[CINEM-FIM] a rodada 3 já foi fechada neste combate");
  // um combate novo não é travado pela marca do anterior
  cineDeAtor(b).fimRodada = { combate: "cX", rodada: 3 };
  confere(await fecharRodadaDaNave(b, { combate: "cY", rodada: 1 }) === true, "[CINEM-FIM] a marca de outro combate não trava a rodada 1 do seguinte");
  // [M3] a rodada de antes vem do preUpdateCombat, mesmo com `previous` já na rodada nova
  const opcoes = {};
  guardarRodadaAntes({ round: 4 }, { round: 5 }, opcoes);
  confere(opcoes[OPCAO_RODADA_ANTES] === 4, "[CINEM-FIM] o preUpdateCombat guarda a rodada de antes nas opções");
  const combErrado = { id: "cX", previous: { round: 5 }, combatants: [{ actor: a }] };
  roteiro["1d6"] = [1];
  confere(await fecharRodadaPeloRastreador(combErrado, { round: 5 }, opcoes) === 1 && cineDeAtor(a).fimRodada.rodada === 4,
    "[CINEM-FIM] com a rodada das opções, fecha a 4 mesmo se `previous` já disser 5");

  // [M1] avançar duas rodadas depressa: os fechamentos vão em fila, e os dois danos contam
  const hpA = a.system.hp.value;
  // o servidor demora: sem a fila, o segundo fechamento leria a nave antes de o primeiro gravar
  const updateRapido = a.update;
  a.update = async function (mud) { await new Promise((ok) => setTimeout(ok, 15)); return updateRapido.call(this, mud); };
  roteiro["1d6"] = [2, 3];
  const p1 = fecharRodadaPeloRastreador(comb, { round: 6 }, { [OPCAO_RODADA_ANTES]: 5 });
  const p2 = fecharRodadaPeloRastreador(comb, { round: 7 }, { [OPCAO_RODADA_ANTES]: 6 });
  await Promise.all([p1, p2]);
  a.update = updateRapido;
  confere(a.system.hp.value === hpA - 5 && cineDeAtor(a).fimRodada.rodada === 6, `[CINEM-FIM] duas rodadas seguidas: 2 + 3 de fogo, nada se perde (${hpA} → ${a.system.hp.value})`);

  // [B1] uma nave que falha não leva as outras
  const quebrada = novaNave({ id: "q", nome: "Quebrada" });
  quebrada.update = async () => { throw new Error("ator apagado"); };
  cineDeAtor(quebrada).avarias = { aposentos: { estado: "avaria", desde: 1 } };
  quebrada.flags.spacedragon.nave.camaras = { aposentos: "instalada" };
  const inteira = novaNave({ id: "i", nome: "Inteira" });
  const erroAntes = console.error;
  console.error = () => {};
  roteiro["1d6"] = [1];
  const n = await fecharRodadaDoCombate({ id: "cZ", combatants: [{ actor: quebrada }, { actor: inteira }] }, 1);
  console.error = erroAntes;
  confere(n === 1 && cineDeAtor(inteira).fimRodada?.combate === "cZ", "[CINEM-FIM] a nave que falha não impede a seguinte");

  // Encerrar é do Mestre ativo: o jogador recebe aviso e nada muda
  globalThis.game.user = { ...globalThis.game.user, id: "jogador", isGM: false };
  const antesDeEncerrar = JSON.stringify(cineDeAtor(a));
  avisos.length = 0;
  await PARA_TESTE.encerrar(ctxDe(a));
  confere(JSON.stringify(cineDeAtor(a)) === antesDeEncerrar && avisos.some(([k, t]) => k === "warn" && /Mestre/.test(t)), "[CINEM-FIM] o jogador não encerra: só o Mestre ativo");
  globalThis.game.user = { ...globalThis.game.user, id: "mestre", isGM: true };

  // [M2] Encerrar combate cobra a última rodada antes de limpar
  const ultima = novaNave({ id: "u", nome: "Última", camaras: { deposito: "instalada" } });
  cineDeAtor(ultima).avarias = { deposito: { estado: "avaria", desde: 3 } };
  cineDeAtor(ultima).fimRodada = { combate: "cU", rodada: 2 };
  globalThis.game.combat = { id: "cU", round: 3, combatants: [] };
  roteiro["1d6"] = [4];
  await PARA_TESTE.encerrar(ctxDe(ultima));
  confere(ultima.system.hp.value === 36 && !Object.keys(cineDeAtor(ultima).avarias ?? {}).length,
    `[CINEM-FIM] Encerrar cobra o fogo da rodada 3, que não terminou pelo rastreador, e depois limpa (${ultima.system.hp.value})`);

  // o combate começa: o que sobrou do anterior sai, uma vez por ator
  cineDeAtor(b).porRodada = { 7: { prioridade: ["escudos"] } };
  cineDeAtor(b).prioridade = ["armas"];
  const combNovo = { id: "cN", combatants: [{ actor: b }, { actor: b }, { actor: naoNave }] };
  confere(await fecharRodadaPeloRastreador(combNovo, { round: 1 }, { [OPCAO_RODADA_ANTES]: 0 }) === 1, "[CINEM-FIM] o rastreador começa o combate: uma nave recomeça");
  confere(!cineDeAtor(b).porRodada?.[7]?.prioridade?.length && !cineDeAtor(b).prioridade, "[CINEM-FIM] a sobra do combate anterior e o formato antigo saem do ator");
  confere(await comecarCombate({ id: "cV", combatants: [] }) === 0, "[CINEM-FIM] combate sem naves: nada");

  globalThis.game.users = undefined;
  combate(2, [presa, thw]);
}

// ── [CINEM-MOTORES] o duelo antes de o fechamento da rodada anterior chegar ──
{
  const m = novaNave({ id: "m", nome: "Motores" });
  cineDeAtor(m).pilotar = 50;
  cineDeAtor(m).porRodada = { 4: { prioridade: ["motores"] } };   // a rodada 4 ainda não fechou
  combate(5, [m]);
  roteiro["1d100"] = [60];
  await PARA_TESTE.duelo(ctxDe(m));
  confere(/Chance 70%/.test(mensagens.at(-1).content), `[CINEM-MOTORES] a Motores da 4 dá +20% no duelo da 5 mesmo antes do fechamento: ${mensagens.at(-1).content.slice(0, 160)}`);
  combate(2, [presa, thw]);
}
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
confere(cineDeAtor(presa).porRodada?.[3]?.forcado && cineDeAtor(presa).avarias.maquinas?.estado === "avaria", "[CINEM-ACOES] Forçar com 1: avaria na Sala de Máquinas");
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
  cineDeAtor(presa).porRodada = { 3: { prioridade: ["armas"], armasUsadas: 0 } };
  cineDeAtor(thw).escudo = { atual: 0, max: 0 };
  thw.system.hp.value = 20;
  dialogo = { artilheiro: "3", situacao: "0", armas: "on" };
  roteiro.d20 = [15];
  roteiro["3d10"] = [16];
  const t1 = await dispararCine(ctxDe(presa), { item: { name: "Torre" }, chave: "disparadores", arma: { nome: "Disparadores laser", dano: "2d10" } });
  confere(t1.acerto && rolado.some(([f]) => f === "3d10") && cineDeAtor(presa).porRodada?.[3]?.armasUsadas === 1, "[CINEM-REVISAO] Prioridade Armas: 3d10 numa arma, e fica gasta");
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

  // cancelar a janela de disparo não gasta o Firmar da rodada anterior
  cineDeAtor(presa).firmar = { rodada: 2 };
  cineDeAtor(presa).turno = 2;
  dialogo = null;
  await dispararCine(ctxDe(presa), { item: { name: "Torre" }, chave: "disparadores", arma: { nome: "Disparadores laser", dano: "2d10" } });
  confere(cineDeAtor(presa).firmar?.rodada === 2 && cineDeAtor(presa).turno === 2, "[CINEM-REVISAO] janela cancelada: o turno não começou");

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

// ── [CINEM-TRIP] o tripulante vinculado ao posto ──
{
  globalThis.CONFIG ??= { sounds: {} };
  const classe = (chassi) => ({ type: "class", name: `Algo — ${chassi}`, flags: { spacedragon: { chassi } } });
  const hab = (name, habilidade = null) => ({ type: "class_ability", name, flags: habilidade ? { spacedragon: { habilidade } } : {} });
  const pessoa = (id, name, items, system = {}) => ({
    id, uuid: `Actor.${id}`, name, items, flags: {}, isOwner: true,
    system: { level: 7, sabedoria: 12, bad: 3, jp: 12, jpd_total: 10, hp: { value: 30, max: 30 }, ...system },
    async update(mud) { for (const [k, v] of Object.entries(mud)) setPath(this, k, v); return this; },
  });
  const talik = pessoa("talik", "Talik Secura", [classe("Cosmonauta"), hab("Pilotar Naves")], { sabedoria: 10 });
  const md9 = pessoa("md9", "MD-9", [classe("Cientista"), hab("Operar e Consertar Máquinas", "Operar Máquinas")]);
  const mesla = pessoa("mesla", "Mesla", [classe("Gatuno")], { bad: 7 });
  const nt = novaNave({ id: "nt", nome: "Presa", camaras: { ponte: "instalada", maquinas: "instalada" } });
  const mundo = { "Actor.talik": talik, "Actor.md9": md9, "Actor.mesla": mesla, "Actor.nt": nt };
  const antes = { getName: globalThis.game.actors.getName, fromUuid: globalThis.fromUuid, getSpeaker: globalThis.ChatMessage.getSpeaker, wait: globalThis.foundry.applications.api.DialogV2.wait };
  globalThis.game.actors.getName = (nome) => Object.values(mundo).find((a) => a.name === nome) ?? null;
  globalThis.fromUuidSync = (u) => mundo[u] ?? null;
  globalThis.fromUuid = async (u) => mundo[u] ?? antes.fromUuid(u);
  globalThis.ChatMessage.getSpeaker = ({ actor } = {}) => ({ alias: actor?.name });
  let ultimoDialogo = null;
  globalThis.foundry.applications.api.DialogV2.wait = async (o) => { ultimoDialogo = o; return dialogo; };

  const naveT = nt.flags.spacedragon.nave;
  naveT.postos = { leme: "Talik Secura", artilharia: "Mesla", engenharia: "MD-9", sensores: "R5-D4" };
  naveT.vinculos = { leme: "Actor.talik", engenharia: "Actor.md9" };   // a Mesla, só pelo nome
  cineDeAtor(nt).pilotar = 10;                                          // o campo digitado perde para a ficha
  combate(2, [nt, thw]);

  // o duelo: o Pilotar da ficha, e o cartão fala pelo piloto
  const pTalik = pilotarDe(talik).valor;
  roteiro["1d100"] = [99];
  await PARA_TESTE.duelo(ctxDe(nt));
  const mDuelo = mensagens.at(-1);
  confere(new RegExp(`Chance ${pTalik}%`).test(mDuelo.content) && /Talik Secura, Pilotar Naves/.test(mDuelo.content) && mDuelo.speaker?.alias === "Talik Secura",
    `[CINEM-TRIP] o duelo usa o Pilotar de Talik (${pTalik}%) e fala por ele: ${mDuelo.content.slice(0, 200)} / ${JSON.stringify(mDuelo.speaker)}`);
  // sem a ficha no Leme, o campo da nave volta a valer
  naveT.postos.leme = "Kael"; delete naveT.vinculos.leme;
  roteiro["1d100"] = [99];
  await PARA_TESTE.duelo(ctxDe(nt));
  confere(/Chance 10%/.test(mensagens.at(-1).content) && mensagens.at(-1).speaker?.alias === "Presa", "[CINEM-TRIP] piloto sem ficha: o Pilotar digitado na nave, e fala a nave");
  naveT.postos.leme = "Talik Secura"; naveT.vinculos.leme = "Actor.talik";

  // o disparo: o BA de quem está na Artilharia, com o nome no rótulo
  globalThis.game.user.targets = new Set([tokThw]);
  dialogo = null;
  await dispararCine(ctxDe(nt), { item: { name: "Laser" }, chave: "lasers", arma: { nome: "Laser", dano: "2d10" } });
  confere(/BA à distância de Mesla/.test(ultimoDialogo?.content ?? "") && /name="artilheiro" value="7"/.test(ultimoDialogo?.content ?? ""),
    `[CINEM-TRIP] o disparo traz o BA de Mesla (+7): ${(ultimoDialogo?.content ?? "").slice(0, 300)}`);
  globalThis.game.user.targets = new Set();

  // Resolver avaria: o teste de quem tenta
  const operar = consertoDe(md9).valor;
  cineDeAtor(nt).avarias = { maquinas: { estado: "avaria", desde: 1 } };
  dialogo = "0";                                   // MD-9, o primeiro (a Engenharia)
  roteiro["1d100"] = [operar + 1];
  await PARA_TESTE.acao(ctxDe(nt), "resolver", { camara: "maquinas" });
  confere(cineDeAtor(nt).avarias.maquinas?.estado === "avaria" && /A avaria continua/.test(mensagens.at(-1).content) && mensagens.at(-1).speaker?.alias === "MD-9",
    `[CINEM-TRIP] MD-9 falha no Operar Máquinas (${operar}%): a avaria fica, e o cartão é dele`);
  confere(/MD-9 — Operar Máquinas/.test(ultimoDialogo?.content ?? "") && /Talik Secura — Intelecto 10/.test(ultimoDialogo?.content ?? "") && /value="sem"/.test(ultimoDialogo?.content ?? ""),
    "[CINEM-TRIP] a janela lista quem pode tentar, com a chance de cada um, e o «sem teste»");
  ultimoDialogo = null;
  const nAv = avisos.length;
  await PARA_TESTE.acao(ctxDe(nt), "resolver", { camara: "maquinas" });
  confere(ultimoDialogo === null && avisos.length === nAv + 1 && cineDeAtor(nt).avarias.maquinas?.estado === "avaria",
    "[CINEM-TRIP] falhou: outra tentativa na mesma câmara só na próxima rodada");
  combate(3, [nt, thw]);
  roteiro["1d100"] = [operar];
  await PARA_TESTE.acao(ctxDe(nt), "resolver", { camara: "maquinas" });
  confere(!cineDeAtor(nt).avarias.maquinas && /Resolvido/.test(mensagens.at(-1).content), "[CINEM-TRIP] com ≤ a chance, resolvida");
  cineDeAtor(nt).avarias = { maquinas: { estado: "avaria", desde: 1 } };
  dialogo = "1";                                   // Talik, pelo Intelecto
  roteiro.d20 = [9];
  roteiro["1d20"] = [9];
  await PARA_TESTE.acao(ctxDe(nt), "resolver", { camara: "maquinas" });
  confere(!cineDeAtor(nt).avarias.maquinas && /Talik Secura, Intelecto: rolou 9/.test(mensagens.at(-1).content), `[CINEM-TRIP] Talik resolve pelo Intelecto, 1d20 ≤ 10: ${mensagens.at(-1).content.slice(0, 200)}`);
  cineDeAtor(nt).avarias = { maquinas: { estado: "avaria", desde: 1 } };
  dialogo = "sem";
  await PARA_TESTE.acao(ctxDe(nt), "resolver", { camara: "maquinas" });
  confere(!cineDeAtor(nt).avarias.maquinas, "[CINEM-TRIP] «sem teste»: resolve como antes");
  cineDeAtor(nt).avarias = { maquinas: { estado: "avaria", desde: 1 } };
  dialogo = null;
  await PARA_TESTE.acao(ctxDe(nt), "resolver", { camara: "maquinas" });
  confere(cineDeAtor(nt).avarias.maquinas?.estado === "avaria", "[CINEM-TRIP] fechar a janela: nada acontece");
  cineDeAtor(nt).avarias = { deposito: { estado: "avaria", desde: 1 } };
  ultimoDialogo = null;
  await PARA_TESTE.acao(ctxDe(nt), "resolver", { camara: "deposito" });
  confere(!cineDeAtor(nt).avarias.deposito && ultimoDialogo === null, "[CINEM-TRIP] incêndio: sem teste, só a ação");
  cineDeAtor(nt).avarias = {};

  // a câmara atingida: JPR para quem está nela
  const msg = { setFlag: async () => {} };
  cineDeAtor(nt).escudo = { atual: 0, max: 0 };
  await aplicarImpactoCineDaMensagem(msg, { modo: "cine", alvo: "Actor.nt", dano: 5, camara: "ponte", extraAusente: 0, extraArsenal: 0, rodada: 2 });
  const cJpr = mensagens.at(-1).content;
  confere(/data-uuid="Actor.talik"/.test(cJpr) && /data-uuid="Actor.mesla"/.test(cJpr) && !/Actor.md9/.test(cJpr) && /R5-D4: sem ficha/.test(cJpr),
    `[CINEM-TRIP] Ponte atingida: JPR de Talik e Mesla, R5 sem ficha, MD-9 (na Sala de Máquinas) fora: ${cJpr.slice(0, 400)}`);
  const nMsgs = mensagens.length;
  await aplicarImpactoCineDaMensagem(msg, { modo: "cine", alvo: "Actor.nt", dano: 5, camara: null, extraAusente: 0, extraArsenal: 0, rodada: 2 });
  confere(mensagens.length === nMsgs, "[CINEM-TRIP] sem câmara atingida, sem cartão de JPR");

  // o mesmo personagem em dois postos da Ponte: um botão só
  naveT.postos.comando = "Talik Secura"; naveT.vinculos.comando = "Actor.talik";
  await aplicarImpactoCineDaMensagem(msg, { modo: "cine", alvo: "Actor.nt", dano: 5, camara: "ponte", extraAusente: 0, extraArsenal: 0, rodada: 2 });
  confere((mensagens.at(-1).content.match(/Actor.talik/g) ?? []).length === 1, "[CINEM-TRIP] dois postos na Ponte, uma JPR");
  delete naveT.postos.comando; delete naveT.vinculos.comando;

  roteiro.d20 = [3];
  roteiro["1d6"] = [4];
  talik.getFlag = (escopo, chave) => talik.flags?.[escopo]?.[chave];
  const falhou = await rolarJprDoTripulante("Actor.talik", "msg-1");
  const nAvJ = avisos.length;
  confere(await rolarJprDoTripulante("Actor.talik", "msg-1") === null && avisos.length === nAvJ + 1 && talik.system.hp.value === 26,
    "[CINEM-TRIP] o segundo clique no mesmo cartão não rola outra JPR");
  confere(falhou && !falhou.passou && falhou.dano === 4 && talik.system.hp.value === 26, `[CINEM-TRIP] JPR falhou: 1d6 (4) do PV de Talik (${talik.system.hp.value})`);
  roteiro.d20 = [15];
  const passou = await rolarJprDoTripulante("Actor.talik", "msg-2");
  const nAvK = avisos.length;
  confere(await rolarJprDoTripulante("Actor.talik", "msg-1") === null && avisos.length === nAvK + 1,
    "[CINEM-TRIP] depois do cartão B, voltar ao cartão A não rola outra JPR");
  confere(passou?.passou && talik.system.hp.value === 26, "[CINEM-TRIP] JPR passou: nada");
  mesla.isOwner = false;
  // o conserto só oferece quem o usuário controla
  cineDeAtor(nt).avarias = { maquinas: { estado: "avaria", desde: 3 } };
  dialogo = null;
  await PARA_TESTE.acao(ctxDe(nt), "resolver", { camara: "maquinas" });
  confere(!/Mesla/.test(ultimoDialogo?.content ?? "") && /MD-9/.test(ultimoDialogo?.content ?? ""), "[CINEM-TRIP] a janela do conserto não oferece o personagem de outro jogador");
  cineDeAtor(nt).avarias = {};
  const nAvisos = avisos.length;
  confere(await rolarJprDoTripulante("Actor.mesla") === null && avisos.length === nAvisos + 1, "[CINEM-TRIP] quem não é dono não rola a JPR alheia");

  globalThis.game.actors.getName = antes.getName;
  globalThis.fromUuid = antes.fromUuid;
  globalThis.ChatMessage.getSpeaker = antes.getSpeaker;
  globalThis.foundry.applications.api.DialogV2.wait = antes.wait;
  delete globalThis.fromUuidSync;
  dialogo = null;
}

if (problemas.length) {
  console.error(`${problemas.length} problema(s) no Combate Cinematográfico na mesa:`);
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log("✔ Combate Cinematográfico na mesa: escala, duelo, disparo, impacto, fim da rodada, ações e encerramento conferem.");
