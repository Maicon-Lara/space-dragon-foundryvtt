/**
 * O Combate Cinematográfico na Ficha de Nave (nave-cine-ficha.js e a opção).
 *
 * ── O QUE ESTE TESTE GARANTE ────────────────────────────────────────────────
 *
 *   · [CINEF-OPCAO]    a opção nasce desligada, é registrada como as outras, e
 *                      só com ela ligada a aba Tripulação troca de painel e as
 *                      camadas somem — desligada, a ficha de sempre;
 *   · [CINEF-ESTADO]   o estado vazio, a escala aplicada (Escudo só com Escudo
 *                      de força), a limpeza do fim da rodada (o que vale até a
 *                      PRÓXIMA rodada fica; Motores passa para o duelo seguinte);
 *   · [CINEF-ACAO]     Firmar, Travar, Interferência, Supressão e Resolver
 *                      mudam o estado; sem alvo marcado, erro;
 *   · [CINEF-PRIOR]    uma Prioridade por rodada, duas com o reator forçado, e
 *                      nenhuma com a Sala de Máquinas avariada;
 *   · [CINEF-TIRO]     o CP com Firmar e Giro do alvo, o dano com Rajada e
 *                      Prioridade Armas, a metralhadora em 3d10, o canhão −4
 *                      contra nave pequena;
 *   · [CINEF-IMPACTO]  Escudo primeiro; a câmara só com dano no Casco; a câmara
 *                      ausente cobra o extra; a de novo cai Fora; Máquinas Fora
 *                      zera o Escudo; o Arsenal Fora explode;
 *   · [CINEF-PAINEL]   o painel tem as trilhas, o duelo, a Prioridade, os cinco
 *                      postos com o campo de sempre, as avarias e os botões.
 *
 *     node tools/teste-nave-cine-ficha.mjs
 */

import { combateCinematico, registrarOpcoesDeNave } from "../spacedragon-module/module/opcoes.js";
import {
  cineVazio, cineDe, aplicarEscala, limparRodadaCine, acaoCine, escolherPrioridade, prioridadeConta,
  cpCine, formulaDoDanoCine, ajusteDaArmaCine, aplicarImpactoCine, painelCinematico,
  MARCA_CINE, CLASSE_CINE_RESOLVER, CLASSE_CINE_DUELO, CLASSE_CINE_FIM, CLASSE_CINE_ESCALA,
} from "../spacedragon-module/module/nave-cine-ficha.js";
import { porPainelDaTripulacao, porPainelDasCamadas, MARCA_TRIPULACAO } from "../spacedragon-module/module/nave-pc-ficha.js";
import { naveVazia } from "../spacedragon-module/module/nave-pc-dados.js";
import { CAMARAS } from "../spacedragon-module/module/camaras.js";

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

function comOpcoes(valores) {
  globalThis.game = {
    settings: {
      get: (_m, chave) => {
        if (!(chave in valores)) throw new Error(`opção não registrada: ${chave}`);
        return valores[chave];
      },
    },
  };
}
function fichaFalsa() {
  const aba = { html: "", querySelector: () => null, insertAdjacentHTML(_o, h) { this.html += h; } };
  return { aba, raiz: { querySelector: () => aba } };
}
const ator = { name: "Presa de Krayt", items: [], system: { hp: { value: 33, max: 40 } } };

// ── [CINEF-OPCAO] ──
{
  delete globalThis.game;
  confere(combateCinematico() === false, "[CINEF-OPCAO] fora do Foundry o Cinematográfico conta como desligado");
  comOpcoes({ naveCombateCompilado: true });
  confere(combateCinematico() === false, "[CINEF-OPCAO] opção não registrada (lança) conta como desligada");

  const registradas = {};
  globalThis.game = { settings: { register: (_m, chave, cfg) => { registradas[chave] = cfg; } } };
  let redesenhos = 0;
  registrarOpcoesDeNave(() => { redesenhos += 1; });
  const cfg = registradas.naveCinematico;
  confere(cfg && cfg.default === false && cfg.scope === "world" && cfg.config === true && cfg.type === Boolean,
    "[CINEF-OPCAO] naveCinematico: opção de mundo booleana, desligada por padrão");
  confere(cfg?.name === "spacedragon.opcao.naveCinematico.nome", "[CINEF-OPCAO] nome da opção pela chave de idioma");
  cfg?.onChange?.(true);
  confere(redesenhos === 1, "[CINEF-OPCAO] trocar a opção redesenha as fichas");

  comOpcoes({ naveCombateCompilado: true, naveCinematico: true, camadaEnergia: true });
  const t = fichaFalsa();
  porPainelDaTripulacao(t.raiz, ator);
  confere(t.aba.html.includes(MARCA_CINE) && !t.aba.html.includes(MARCA_TRIPULACAO), "[CINEF-OPCAO] ligada: a aba mostra o painel cinematográfico, não o das Compiladas");
  confere(t.aba.html.includes('class="sw-posto-nome"'), "[CINEF-OPCAO] os postos usam o mesmo campo de sempre (o gravar da ficha vale)");
  const c = fichaFalsa();
  confere(porPainelDasCamadas(c.raiz, ator) === false && c.aba.html === "", "[CINEF-OPCAO] ligada: as camadas somem mesmo ligadas");

  comOpcoes({ naveCombateCompilado: true, naveCinematico: false });
  const t2 = fichaFalsa();
  porPainelDaTripulacao(t2.raiz, ator);
  confere(!t2.aba.html.includes(MARCA_CINE) && t2.aba.html.includes(MARCA_TRIPULACAO), "[CINEF-OPCAO] desligada: a ficha de sempre");
  delete globalThis.game;
}

// ── [CINEF-ESTADO] ──
const vazio = cineVazio();
confere(vazio.escudo.atual === 0 && vazio.prioridade.length === 0 && vazio.duelo === null, "[CINEF-ESTADO] estado vazio");
const lido = cineDe({ cine: { escudo: { atual: 7 }, avarias: { ponte: { estado: "avaria" } } } });
const residuo = cineDe({ cine: { interferencia: {}, supressao: {}, duelo: {} } });
confere(residuo.interferencia === null && residuo.supressao === null && residuo.duelo === null, "[CINEF-ESTADO] o {} que a gravação por caminho deixa conta como nada");
confere(lido.escudo.atual === 7 && lido.escudo.max === 0 && lido.avarias.ponte.estado === "avaria" && lido.pilotar === 0, "[CINEF-ESTADO] cineDe completa o que falta");
let esc = aplicarEscala(vazio, "particular", { temEscudo: true });
confere(esc.cine.escudo.atual === 15 && esc.cine.escudo.max === 15 && esc.hp.value === 40 && esc.hp.max === 40 && esc.cine.recarga === "1d10",
  "[CINEF-ESTADO] Particular com escudo: 15/15, Casco 40, Recarga 1d10");
esc = aplicarEscala(vazio, "particular", { temEscudo: false });
confere(esc.cine.escudo.max === 0 && esc.cine.recarga === null, "[CINEF-ESTADO] sem Escudo de força, Escudo 0");
confere(aplicarEscala(vazio, "") === null, "[CINEF-ESTADO] sem tipo, sem escala");

const sujo = {
  ...vazio, firmar: true, giro: 4, prioridade: ["motores"], forcado: true, trava: "t1",
  vantagens: { t1: { chave: "mira" } }, armasUsadas: 1,
  interferencia: { alvo: "t2", ate: 3 }, supressao: { alvo: "t3", ate: 2 },
};
const limpo = limparRodadaCine(sujo, 2);
confere(!limpo.firmar && limpo.giro === 0 && !limpo.prioridade.length && !limpo.forcado && !limpo.trava && !Object.keys(limpo.vantagens).length && limpo.armasUsadas === 0,
  "[CINEF-ESTADO] o fim da rodada apaga Firmar, Giro, Prioridade, reator, Trava, Vantagens e a Prioridade Armas gasta");
confere(limpo.interferencia?.alvo === "t2", "[CINEF-ESTADO] Interferência da rodada 2 vale para o duelo da 3: fica");
confere(limpo.supressao === null, "[CINEF-ESTADO] Supressão até a rodada 2: sai no fim da 2");
confere(limpo.motores === 3, "[CINEF-ESTADO] Prioridade Motores na rodada 2 vale no duelo da 3");
confere(limparRodadaCine(vazio, 2).motores === null, "[CINEF-ESTADO] sem Motores, nada para o duelo seguinte");

// ── [CINEF-ACAO] ──
confere(acaoCine(vazio, "firmar").cine.firmar === true, "[CINEF-ACAO] Firmar liga");
confere(acaoCine(vazio, "travar").erro, "[CINEF-ACAO] Travar sem alvo é erro");
confere(acaoCine(vazio, "travar", { alvo: "t9", alvoNome: "Dunelizard" }).cine.trava === "t9", "[CINEF-ACAO] Travar grava o token");
const inter = acaoCine(vazio, "interferencia", { alvo: "t9", rodada: 4 }).cine.interferencia;
confere(inter.alvo === "t9" && inter.ate === 5, "[CINEF-ACAO] Interferência vale para o duelo da próxima rodada");
confere(acaoCine(vazio, "supressao", { alvo: "t9", rodada: 4 }).cine.supressao.ate === 5, "[CINEF-ACAO] Supressão até o fim da próxima rodada");
const comAvaria = { ...vazio, avarias: { maquinas: { estado: "avaria", desde: 1 }, arsenal: { estado: "fora", desde: 1 } } };
confere(acaoCine(comAvaria, "resolver").cine.avarias.maquinas === undefined, "[CINEF-ACAO] Resolver (Engenharia) tira a avaria da Sala de Máquinas");
confere(acaoCine(comAvaria, "resolver", { camara: "arsenal" }).erro, "[CINEF-ACAO] câmara Fora não se resolve em combate");
confere(acaoCine(vazio, "varredura").erro, "[CINEF-ACAO] ação da mesa não muda o estado");
confere(/Dunelizard/.test(acaoCine(vazio, "travar", { alvo: "t9", alvoNome: "Dunelizard" }).linha), "[CINEF-ACAO] o cartão diz quem foi travado");
confere(!/<script>/.test(acaoCine(vazio, "travar", { alvo: "t9", alvoNome: "<script>x" }).linha), "[CINEF-ACAO] o nome do alvo entra escapado");

// ── [CINEF-PRIOR] ──
let pr = escolherPrioridade(vazio, "armas").cine;
confere(prioridadeConta(pr, "armas") === 1, "[CINEF-PRIOR] uma Prioridade");
pr = escolherPrioridade(pr, "escudos").cine;
confere(prioridadeConta(pr, "armas") === 0 && prioridadeConta(pr, "escudos") === 1, "[CINEF-PRIOR] sem forçar, a nova troca a anterior");
pr = escolherPrioridade(escolherPrioridade({ ...vazio, forcado: true }, "armas").cine, "armas").cine;
confere(prioridadeConta(pr, "armas") === 2, "[CINEF-PRIOR] reator forçado: a mesma duas vezes");
confere(escolherPrioridade(comAvaria, "armas").erro, "[CINEF-PRIOR] Sala de Máquinas avariada: sem Prioridade");

// ── [CINEF-TIRO] ──
confere(cpCine(26, {}).cp === 26, "[CINEF-TIRO] CP sem nada");
confere(cpCine(26, { firmar: true }).cp === 24, "[CINEF-TIRO] o alvo que firmou fica com −2 (o exemplo: CP 24)");
confere(cpCine(26, { giro: 4 }).cp === 30 && cpCine(26, { giro: -2 }).cp === 24, "[CINEF-TIRO] Giro evasivo +4, falho −2");
confere(cpCine(null, {}) === null, "[CINEF-TIRO] sem CP, sem conta");
confere(formulaDoDanoCine("disparadores", { dano: "2d10" }) === "2d10", "[CINEF-TIRO] laser 2d10");
confere(formulaDoDanoCine("disparadores", { dano: "2d10" }, { rajada: true, armas: 1 }) === "4d10", "[CINEF-TIRO] Rajada e Prioridade Armas: +1 dado cada");
confere(formulaDoDanoCine("metralhadora", { dano: "1d10", ataques: 4 }) === "3d10", "[CINEF-TIRO] metralhadora: uma rolagem de 3d10");
confere(ajusteDaArmaCine("canhoes", "Pequena") === -4 && ajusteDaArmaCine("canhoes", "Média") === 0, "[CINEF-TIRO] canhão −4 contra nave pequena");
confere(ajusteDaArmaCine("metralhadora", "Pequena") === 2, "[CINEF-TIRO] metralhadora +2 contra nave pequena");

// ── [CINEF-IMPACTO] ──
const todas = Object.fromEntries(Object.keys(CAMARAS).map((k) => [k, "instalada"]));
const alvo = { ...vazio, escudo: { atual: 6, max: 15 } };
let im = aplicarImpactoCine(alvo, 40, { dano: 13, camara: "deposito", rodada: 1 }, { estados: todas });
confere(im.cine.escudo.atual === 0 && im.casco === 33 && im.noEscudo === 6 && im.noCasco === 7, "[CINEF-IMPACTO] 13 com 6 de Escudo: 7 no Casco");
confere(im.cine.avarias.deposito?.estado === "avaria", "[CINEF-IMPACTO] dano no Casco com câmara: avaria no Depósito");
im = aplicarImpactoCine({ ...vazio, escudo: { atual: 30, max: 30 } }, 40, { dano: 13, camara: "deposito", rodada: 1 }, { estados: todas });
confere(im.casco === 40 && !im.cine.avarias.deposito, "[CINEF-IMPACTO] o escudo recarregou antes do clique: nada no Casco, nenhuma câmara");
im = aplicarImpactoCine(vazio, 40, { dano: 10, camara: "laboratorio", extraAusente: 6, rodada: 1 }, { estados: { ...todas, laboratorio: "ausente" } });
confere(im.casco === 24 && !im.cine.avarias.laboratorio, "[CINEF-IMPACTO] câmara ausente: +extra no Casco, sem avaria");
im = aplicarImpactoCine({ ...vazio, escudo: { atual: 15, max: 15 }, avarias: { maquinas: { estado: "avaria", desde: 1 } } }, 40,
  { dano: 20, camara: "maquinas", rodada: 2 }, { estados: todas });
confere(im.cine.avarias.maquinas.estado === "fora" && im.cine.escudo.atual === 0, "[CINEF-IMPACTO] Máquinas de novo: Fora, e o Escudo cai a 0");
im = aplicarImpactoCine({ ...vazio, avarias: { arsenal: { estado: "avaria", desde: 1 } } }, 40,
  { dano: 5, camara: "arsenal", extraArsenal: 11, rodada: 2 }, { estados: todas });
confere(im.cine.avarias.arsenal.estado === "fora" && im.casco === 24, "[CINEF-IMPACTO] Arsenal de novo: Fora e explosão de 2d10 (11)");
im = aplicarImpactoCine(vazio, 40, { dano: 5, camara: null }, { estados: todas });
confere(im.casco === 35 && !Object.keys(im.cine.avarias).length, "[CINEF-IMPACTO] sem câmara, só dano");

// ── [CINEF-PAINEL] ──
const nave = { ...naveVazia(), postos: { leme: "Talik Secura", artilharia: "Mesla" }, cine: { ...vazio, escudo: { atual: 7, max: 15 }, pilotar: 84, avarias: { deposito: { estado: "avaria", desde: 1 }, ponte: { estado: "fora", desde: 1 } } } };
const html = painelCinematico(ator, nave, { rodada: 3 });
confere(html.includes("Tensão +2"), "[CINEF-PAINEL] rodada 3: Tensão +2 no título");
confere(html.includes('value="7"') && html.includes('value="15"') && html.includes("<strong>33</strong> / 40"), "[CINEF-PAINEL] Escudo 7/15 e Casco 33/40");
confere(html.includes('value="84"'), "[CINEF-PAINEL] o Pilotar do Leme");
confere(html.includes('value="Talik Secura"') && html.includes('value="Mesla"'), "[CINEF-PAINEL] quem está em cada posto");
confere((html.match(/data-posto="/g) ?? []).length >= 5, "[CINEF-PAINEL] cinco postos");
confere(html.includes(`class="${CLASSE_CINE_RESOLVER}" data-camara="deposito"`), "[CINEF-PAINEL] a avaria do Depósito tem Resolver");
confere(!html.includes(`data-camara="ponte"`) && html.includes("FORA"), "[CINEF-PAINEL] a Ponte Fora não tem Resolver e aparece como FORA");
for (const c of [CLASSE_CINE_DUELO, CLASSE_CINE_FIM, CLASSE_CINE_ESCALA]) confere(html.includes(`class="${c}"`), `[CINEF-PAINEL] botão ${c}`);
const semCombate = painelCinematico(ator, { ...naveVazia() }, { rodada: null });
confere(!semCombate.includes("Tensão"), "[CINEF-PAINEL] fora de combate, sem Tensão");
confere(semCombate.includes("Nenhuma avaria"), "[CINEF-PAINEL] sem avarias, o painel diz");
const hostil = painelCinematico(ator, { ...naveVazia(), postos: { leme: '"><script>' } }, {});
confere(!hostil.includes("<script>"), "[CINEF-PAINEL] o nome no posto entra escapado");

if (problemas.length) {
  console.error(`${problemas.length} problema(s) no painel cinematográfico:`);
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log("✔ Combate Cinematográfico na ficha: opção, estado, ações, Prioridade, tiro, impacto e painel conferem.");
