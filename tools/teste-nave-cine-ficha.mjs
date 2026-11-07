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
  vigenteAteProximoTurno, firmouNestaRodada, marcarTurno, normalizarEscudo, adicionarVantagem,
  vantagensContra, podeManobrar, guardarPvDoLivro, CLASSE_CINE_LIVRO, daRodada, comRodada, armasLivres,
  MARCA_CINE, CLASSE_CINE_RESOLVER, CLASSE_CINE_DUELO, CLASSE_CINE_ENCERRAR, CLASSE_CINE_ESCALA,
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
confere(vazio.escudo.atual === 0 && daRodada(vazio, 1).prioridade.length === 0 && vazio.duelo === null && !Object.keys(vazio.porRodada).length, "[CINEF-ESTADO] estado vazio");
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
  ...vazio, firmar: { rodada: 2 }, giro: { valor: 4, rodada: 1 }, trava: "t1",
  porRodada: { 2: { prioridade: ["motores"], forcado: true, armasUsadas: 1, vantagens: { t1: { chaves: ["mira"] } } } },
  interferencia: { alvo: "t2", ate: 3 }, supressao: { alvo: "t3", ate: 2 },
};
const limpo = limparRodadaCine(sujo, 2, { combate: "c1" });
confere(!Object.keys(limpo.porRodada).length && limpo.fimRodada?.combate === "c1" && limpo.fimRodada?.rodada === 2,
  "[CINEF-ESTADO] o fim da rodada apaga Prioridade, reator, Vantagens e a Prioridade Armas gasta, e marca a rodada cobrada");
confere(limpo.firmar?.rodada === 2, "[CINEF-ESTADO] o Firmar desta rodada passa para a próxima (até o turno da nave)");
confere(limpo.giro === null, "[CINEF-ESTADO] o Giro da rodada anterior já não vale");
confere(limpo.trava === "t1", "[CINEF-ESTADO] a Trava não tem prazo: espera o próximo acerto");
confere(limpo.interferencia?.alvo === "t2", "[CINEF-ESTADO] Interferência da rodada 2 vale para o duelo da 3: fica");
confere(limpo.supressao === null, "[CINEF-ESTADO] Supressão até a rodada 2: sai no fim da 2");
confere(limpo.motores === 3, "[CINEF-ESTADO] Prioridade Motores na rodada 2 vale no duelo da 3");
confere(limparRodadaCine(vazio, 2).motores === null, "[CINEF-ESTADO] sem Motores, nada para o duelo seguinte");

// ── [CINEF-ACAO] ──
confere(acaoCine(vazio, "firmar", { rodada: 3 }).cine.firmar?.rodada === 3, "[CINEF-ACAO] Firmar guarda a rodada");
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
confere(prioridadeConta(pr, "armas", 0) === 1, "[CINEF-PRIOR] uma Prioridade");
pr = escolherPrioridade(pr, "escudos").cine;
confere(prioridadeConta(pr, "armas", 0) === 0 && prioridadeConta(pr, "escudos", 0) === 1, "[CINEF-PRIOR] sem forçar, a nova troca a anterior");
const forcadoNa3 = comRodada(vazio, 3, (d) => ({ ...d, forcado: true }));
pr = escolherPrioridade(escolherPrioridade(forcadoNa3, "armas", { rodada: 3 }).cine, "armas", { rodada: 3 }).cine;
confere(prioridadeConta(pr, "armas", 3) === 2 && armasLivres(pr, 3) === 2, "[CINEF-PRIOR] reator forçado: a mesma duas vezes, duas armas livres");
pr = escolherPrioridade(escolherPrioridade(forcadoNa3, "armas", { rodada: 4 }).cine, "escudos", { rodada: 4 }).cine;
confere(prioridadeConta(pr, "escudos", 4) === 1 && prioridadeConta(pr, "armas", 4) === 0, "[CINEF-PRIOR] o reator forçado da rodada 3 não dá duas Prioridades na 4");
confere(escolherPrioridade(comAvaria, "armas").erro, "[CINEF-PRIOR] Sala de Máquinas avariada: sem Prioridade");

// ── [CINEF-TIRO] ──
confere(cpCine(26, {}, 1).cp === 26, "[CINEF-TIRO] CP sem nada");
confere(cpCine(26, { firmar: { rodada: 1 } }, 1).cp === 24, "[CINEF-TIRO] o alvo que firmou fica com −2 na mesma rodada");
// «Rodada 2: +18 contra CP 24, porque o Firmar ainda vale» — o esquadrão age antes da Andorinha
confere(cpCine(26, { firmar: { rodada: 1 }, turno: 1 }, 2).cp === 24, "[CINEF-TIRO] o Firmar da rodada 1 ainda vale na 2, antes do turno da nave (o exemplo)");
confere(cpCine(26, { firmar: { rodada: 1 }, turno: 2 }, 2).cp === 26, "[CINEF-TIRO] depois que a nave agiu na rodada 2, o Firmar acabou");
confere(cpCine(26, { firmar: { rodada: 1 } }, 3).cp === 26, "[CINEF-TIRO] duas rodadas depois, nada");
confere(cpCine(26, { giro: { valor: 4, rodada: 2 }, turno: 2 }, 3).cp === 30, "[CINEF-TIRO] «CP 30 (o Giro evasivo ainda vale)» na rodada 3, antes do turno");
confere(cpCine(26, { giro: { valor: -2, rodada: 2 } }, 2).cp === 24, "[CINEF-TIRO] Giro falho, −2");
confere(cpCine(null, {}) === null, "[CINEF-TIRO] sem CP, sem conta");
confere(firmouNestaRodada({ firmar: { rodada: 2 } }, 2) && !firmouNestaRodada({ firmar: { rodada: 1 } }, 2), "[CINEF-TIRO] o +2 de ataque do Firmar só na rodada dele");
confere(vigenteAteProximoTurno(null, {}, 1) === false, "[CINEF-TIRO] sem efeito, nada");
let turno = marcarTurno({ ...vazio, firmar: { rodada: 1 }, giro: { valor: 4, rodada: 2 } }, 2);
confere(turno.turno === 2 && turno.firmar === null && turno.giro?.valor === 4, "[CINEF-TIRO] começar o turno da rodada 2 apaga o Firmar da 1 e mantém o Giro da 2");
confere(marcarTurno(turno, 2) === turno, "[CINEF-TIRO] marcar de novo na mesma rodada não muda nada");
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
for (const c of [CLASSE_CINE_DUELO, CLASSE_CINE_ENCERRAR, CLASSE_CINE_ESCALA]) confere(html.includes(`class="${c}"`), `[CINEF-PAINEL] botão ${c}`);
confere(!html.includes("sd-cine-fim\"") && /automático/.test(html), "[CINEF-PAINEL] sem botão de fim da rodada: o painel diz que é automático");
confere(cineDe({ cine: { fimRodada: 3 } }).fimRodada === null, "[CINEF-ESTADO] a marca antiga (só o número) não conta: sem combate, nada trava");
const semCombate = painelCinematico(ator, { ...naveVazia() }, { rodada: null });
confere(!semCombate.includes("Tensão"), "[CINEF-PAINEL] fora de combate, sem Tensão");
confere(semCombate.includes("Nenhuma avaria"), "[CINEF-PAINEL] sem avarias, o painel diz");
const hostil = painelCinematico(ator, { ...naveVazia(), postos: { leme: '"><script>' } }, {});
confere(!hostil.includes("<script>"), "[CINEF-PAINEL] o nome no posto entra escapado");

// ── [CINEF-NOVA] as escolhas moram sob a rodada: o fechamento da r não toca a r+1 ──
{
  let c = escolherPrioridade(vazio, "motores", { rodada: 5 }).cine;   // Motores na rodada 5
  c = escolherPrioridade(c, "escudos", { rodada: 6 }).cine;           // Escudos na 6, antes de fechar a 5
  c = adicionarVantagem(c, "t1", "A", "mira", { rodada: 6 });
  c = adicionarVantagem(c, "t2", "B", "cauda", { rodada: 5 });
  c = comRodada(c, 6, (d) => ({ ...d, forcado: true, armasUsadas: 1 }));
  const fechada = limparRodadaCine(c, 5, { combate: "c1" });
  confere(fechada.motores === 6, "[CINEF-NOVA] a Motores da 5 vale no duelo da 6, mesmo com a Prioridade da 6 já escolhida (era o achado A1)");
  confere(prioridadeConta(fechada, "escudos", 6) === 1 && daRodada(fechada, 6).forcado && daRodada(fechada, 6).armasUsadas === 1,
    "[CINEF-NOVA] as escolhas da 6 sobrevivem ao fechamento da 5");
  confere(prioridadeConta(fechada, "escudos", 5) === 0 && !fechada.porRodada[5], "[CINEF-NOVA] as da 5 saem");
  confere(vantagensContra(fechada, "t1", 6).join() === "mira" && vantagensContra(fechada, "t2", 5).length === 0,
    "[CINEF-NOVA] a Vantagem da 6 fica; a da 5 sai");
  confere(prioridadeConta(c, "escudos", 5) === 0, "[CINEF-NOVA] a Escudos da 6 não conta como da 5 (a recarga da 5 não a vê; era o achado A2)");
  confere(limparRodadaCine(vazio, 5, { combate: "c1" }).motores === null, "[CINEF-NOVA] sem Motores, nada para o duelo seguinte");
  const legado = cineDe({ cine: { prioridade: ["motores"], vantagens: { t: { chave: "mira" } }, armasUsadas: 3 } });
  confere(prioridadeConta(legado, "motores", 1) === 0 && vantagensContra(legado, "t", 1).length === 0, "[CINEF-NOVA] estado gravado no formato antigo é ignorado sem erro");
}

// ── [CINEF-REVISAO] achados da revisão independente ──
let v = adicionarVantagem(vazio, "t1", "Garra", "mira");
v = adicionarVantagem(v, "t1", "Garra", "cauda");
confere(vantagensContra(v, "t1").join() === "cauda", "[CINEF-REVISAO] sem Crítico, uma Vantagem: a nova troca a antiga");
v = adicionarVantagem(adicionarVantagem(vazio, "t1", "Garra", "mira", { critico: true }), "t1", "Garra", "cauda", { critico: true });
confere(vantagensContra(v, "t1").join() === "mira,cauda", "[CINEF-REVISAO] com Crítico, duas Vantagens contra o mesmo alvo");
confere(vantagensContra(v, null).length === 0, "[CINEF-REVISAO] sem token, nenhuma Vantagem");
confere(podeManobrar({ tamanho: "Gigantesca" }) === "tamanho" && podeManobrar({ tamanho: "Média", bloqueada: true }) === "bloqueio" &&
  podeManobrar({ tamanho: "Pequena", suprimida: true }) === "supressao" && podeManobrar({ tamanho: "Média" }) === null,
"[CINEF-REVISAO] Giro: só P ou M, e não sob Bloqueio ou Supressão");
const semMaquinas = normalizarEscudo({ ...vazio, escudo: { atual: 15, max: 15 }, avarias: { maquinas: { estado: "fora" } } });
confere(semMaquinas.escudo.atual === 0, "[CINEF-REVISAO] Máquinas Fora por qualquer caminho: Escudo 0");
confere(normalizarEscudo({ ...vazio, escudo: { atual: 15, max: 15 }, avarias: { maquinas: { estado: "avaria" } } }).escudo.atual === 15, "[CINEF-REVISAO] Máquinas só avariada: escudo de pé");
const backup = guardarPvDoLivro(vazio, { value: 150, max: 187 });
confere(backup.pvLivro?.max === 187 && backup.pvLivro?.value === 150, "[CINEF-REVISAO] o PV do livro fica guardado");
confere(guardarPvDoLivro(backup, { value: 40, max: 40 }).pvLivro.max === 187, "[CINEF-REVISAO] aplicar de novo não perde o PV do livro");
const comBackup = painelCinematico(ator, { ...naveVazia(), cine: backup }, {});
confere(comBackup.includes(`class="${CLASSE_CINE_LIVRO}"`) && comBackup.includes("187"), "[CINEF-REVISAO] o painel oferece voltar ao PV do livro");
confere(!painelCinematico(ator, { ...naveVazia() }, {}).includes(CLASSE_CINE_LIVRO), "[CINEF-REVISAO] sem backup, sem o botão");
const listaV = painelCinematico(ator, { ...naveVazia(), cine: v }, {});
confere(!painelCinematico(ator, { ...naveVazia(), cine: v }, { rodada: 1 }).includes("Mira + Na cauda"), "[CINEF-REVISAO] as Vantagens de outra rodada não aparecem");
confere(listaV.includes("Mira + Na cauda → Garra"), "[CINEF-REVISAO] o painel lista as duas Vantagens");

if (problemas.length) {
  console.error(`${problemas.length} problema(s) no painel cinematográfico:`);
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log("✔ Combate Cinematográfico na ficha: opção, estado, ações, Prioridade, tiro, impacto e painel conferem.");
