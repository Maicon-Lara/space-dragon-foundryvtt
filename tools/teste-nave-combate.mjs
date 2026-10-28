/**
 * O combate de naves numa conta só (nave-combate.js).
 *
 * ── O QUE ESTE TESTE GARANTE ────────────────────────────────────────────────
 *
 *   · o estado da tripulação ENTRA no ataque: Firmar, Travar (só contra o alvo
 *     travado), Rajada, Supressão, Interferência e as avarias;
 *   · sem Ponte ou em pane, a nave não atira;
 *   · o CP do alvo soma o Escudo de força (+10 no livro), a energia nos
 *     Escudos e o −5 do casco — e, na reserva, o escudo sai do CP;
 *   · o dano conta energia, Rajada e margem, com multiplicador e crítico;
 *   · o escudo como reserva absorve, gasta-se por combate e volta cheio no
 *     combate seguinte;
 *   · avaria por dano pesado no limiar de 10%;
 *   · o fim da rodada: prazo vencido danifica a câmara, a avaria sem prazo
 *     sai, e o Calor acumula, esfria 1 e cobra num 1d6 ≤ Calor.
 *
 *     node tools/teste-nave-combate.mjs
 */

import {
  AVARIAS, CRITICO_T10_6, penalidadesDeAvaria, termosDoAtaque, formulaDosTermos, cpDoAlvo,
  formulaDoDano, dadosPorMargem, danoFinal, escudoRestante, aplicarImpacto, causaAvaria,
  avariaParaReparar, fimDaRodada, calorNoFimDaRodada, lerAvaria,
} from "../spacedragon-module/module/nave-combate.js";
import { AVARIA_VIRA_CAMARA } from "../spacedragon-module/module/camaras.js";
import { PRAZO_DE_AVARIA } from "../spacedragon-module/module/tripulacao.js";

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };
const soma = (termos) => termos.reduce((s, [, v]) => s + v, 0);

/* ── O ataque ─────────────────────────────────────────────────────────────── */
{
  const base = { ba: 12, balistico: 2, artilheiro: 5 };
  confere(soma(termosDoAtaque(base).termos) === 19, "BA 12 + Balístico 2 + artilheiro 5 = 19");

  const firmou = termosDoAtaque({ ...base, atacante: { firmar: { ativa: true } } });
  confere(soma(firmou.termos) === 21, "Firmar devia somar +2");

  const travou = { trava: { alvo: "tie" } };
  confere(soma(termosDoAtaque({ ...base, atacante: travou, alvoToken: "tie" }).termos) === 21, "a trava dá +2 contra o travado");
  confere(soma(termosDoAtaque({ ...base, atacante: travou, alvoToken: "outro" }).termos) === 19, "a trava NÃO vale contra outro alvo");

  confere(soma(termosDoAtaque({ ...base, rajada: true }).termos) === 14, "Rajada devia dar −5");
  confere(soma(termosDoAtaque({ ...base, suprimida: true }).termos) === 17, "suprimida devia dar −2");
  confere(soma(termosDoAtaque({ ...base, alvo: { interferencia: true } }).termos) === 17, "a interferência do alvo dá −2");
  confere(soma(termosDoAtaque({ ...base, atacante: { avarias: { armas: { rodada: 1 } } } }).termos) === 14, "avaria nas armas dá −5");
  confere(soma(termosDoAtaque({ ...base, atacante: { avarias: { armas: { rodada: 1 } }, aguentem: { ativa: true } } }).termos) === 19,
    "o Aguentem firme cancela o −5 das armas");

  confere(termosDoAtaque({ ...base, ponteOk: false }).bloqueio === "ponte", "sem Ponte, a nave não atira");
  confere(termosDoAtaque({ ...base, atacante: { avarias: { pane: { rodada: 1 } } } }).bloqueio === "pane", "em pane, a nave não atira");
  confere(formulaDosTermos([["BA", 12], ["faixa", -2]]) === "1d20 + 12 - 2", "a fórmula escreve os sinais");
}

/* ── O CP do alvo ─────────────────────────────────────────────────────────── */
{
  confere(cpDoAlvo({}, { cpBase: 26 }).cp === 26, "sem nada, o CP é o da ficha");
  confere(cpDoAlvo({}, { cpBase: 26, temEscudo: true }).cp === 36, "o Escudo de força dá +10 (livro)");
  confere(cpDoAlvo({}, { cpBase: 26, temEscudo: true, ponteOk: false }).cp === 26, "sem Ponte, sem escudo");
  confere(cpDoAlvo({}, { cpBase: 26, temEscudo: true, reserva: true }).cp === 26, "na reserva, o escudo sai do CP");
  confere(cpDoAlvo({ energia: { escudos: 2 } }, { cpBase: 26 }).cp === 30, "2 de energia nos Escudos = +4");
  confere(cpDoAlvo({ avarias: { casco: { rodada: 1 } } }, { cpBase: 26 }).cp === 21, "casco avariado = −5");
  confere(cpDoAlvo({ avarias: { escudos: { rodada: 1 } } }, { cpBase: 26, temEscudo: true }).cp === 26, "avaria nos escudos desliga o +10");
  confere(cpDoAlvo({}, { cpBase: null }) === null, "sem CP, a mesa compara");
}

/* ── O dano ───────────────────────────────────────────────────────────────── */
{
  const laser = { dano: "2d10" };
  confere(formulaDoDano(laser).formula === "2d10", "sem extras, o dado da arma");
  confere(formulaDoDano(laser, { rajada: true, energia: 1, margem: 2 }).formula === "6d10", "2 + Rajada 1 + energia 1 + margem 2 = 6d10");
  confere(dadosPorMargem(36, 26) === 2 && dadosPorMargem(30, 26) === 0 && dadosPorMargem(20, 26) === 0, "um dado a cada 5 acima do CP");
  confere(danoFinal(11, { multiplicador: 2 }) === 22, "×2 de dano de nave");
  confere(danoFinal(11, { multiplicador: 2, critico: CRITICO_T10_6[1] }) === 44, "o crítico dobra por cima do multiplicador");
  confere(danoFinal(11, { critico: CRITICO_T10_6[5] }) === 11, "o crítico 5 (ataque extra) não dobra");
  confere(causaAvaria(15, 150) && !causaAvaria(14, 150), "o limiar é 10% do PV máximo");
}

/* ── O escudo como reserva ────────────────────────────────────────────────── */
{
  const opt = { tamanho: "Média", combate: "c1", temEscudo: true, reserva: true };
  confere(escudoRestante({}, opt) === 20, "a reserva da Média é 20");
  const r1 = aplicarImpacto({}, { ...opt, pv: 150, dano: 12 });
  confere(r1.absorvido === 12 && r1.pv === 150, "12 de dano: o escudo absorve tudo");
  const r2 = aplicarImpacto(r1.nave, { ...opt, pv: 150, dano: 15 });
  confere(r2.absorvido === 8 && r2.pv === 143, `a reserva acaba: 8 absorvidos e 7 no PV (veio ${r2.absorvido}/${r2.pv})`);
  confere(escudoRestante(r2.nave, { ...opt, combate: "c2" }) === 20, "num combate novo o escudo volta cheio");
  const comEnergia = aplicarImpacto(r2.nave, { ...opt, pv: 143, dano: 10, nave: undefined });
  confere(comEnergia.pv === 133, "escudo vazio: o dano vai inteiro ao PV");
  const r3 = aplicarImpacto({ energia: { escudos: 1 } }, { ...opt, pv: 100, dano: 4 });
  confere(r3.absorvido === 4 && !r3.nave.escudo?.absorvido, "a energia da rodada absorve antes da reserva");
  const semReserva = aplicarImpacto({}, { tamanho: "Média", pv: 100, dano: 30, avarias: ["motor"], rodada: 2 });
  confere(semReserva.pv === 70 && lerAvaria(semReserva.nave.avarias.motor)?.rodada === 2, "sem reserva o dano vai ao PV, e a avaria entra com a rodada");
}

/* ── Reparo, prazos e Calor ───────────────────────────────────────────────── */
{
  confere(avariaParaReparar({ avarias: { motor: 1, pane: 1 } }) === "pane", "o Reparar começa pela pane");
  confere(avariaParaReparar({ avarias: { motor: 1, pane: 1 } }, "motor") === "motor", "a escolhida passa na frente");

  const venceu = fimDaRodada({ avarias: { armas: { rodada: 1 } } }, { rodada: 3, prazos: true });
  confere(venceu.nave.camaras.arsenal === "danificada", "armas sem reparo em 2 rodadas danificam o Arsenal");
  confere(lerAvaria(venceu.nave.avarias.armas)?.vencida, "a penalidade continua até o Reparar");
  confere(penalidadesDeAvaria(venceu.nave).ataque === -5, "vencida, a avaria ainda dá −5");

  const corre = fimDaRodada({ avarias: { armas: { rodada: 2 } } }, { rodada: 3, prazos: true });
  confere(!corre.nave.camaras.arsenal, "dentro do prazo, a câmara fica");
  confere(!fimDaRodada({ avarias: { tripulacao: { rodada: 3 } } }, { rodada: 3 }).nave.avarias.tripulacao, "a Tripulação abalada sai sozinha");

  confere(calorNoFimDaRodada({ calor: 0, energia: { extra: 2 } }) === 1, "Forçar (+2) e esfria 1 = 1");
  confere(calorNoFimDaRodada({ calor: 3, energia: { acoes: 1 } }) === 3, "3 + 1 da ação extra − 1 = 3");
  const quente = fimDaRodada({ calor: 3 }, { rodada: 4, calor: true, d6: 2 });
  confere(quente.nave.calor === 2 && lerAvaria(quente.nave.avarias.motor), "Calor 2 e 1d6 = 2: avaria na Sala de Máquinas");
  confere(!fimDaRodada({ calor: 3 }, { rodada: 4, calor: true, d6: 5 }).nave.avarias.motor, "1d6 acima do Calor: sem avaria");
}

/* ── Uma lista de avarias só ──────────────────────────────────────────────── */
{
  for (const [k, a] of Object.entries(AVARIAS)) {
    if (a.prazo) confere(PRAZO_DE_AVARIA[k] === a.prazo, `o prazo de ${k} diverge entre as listas`);
    if (a.camara) confere(AVARIA_VIRA_CAMARA[k] === a.camara, `a câmara de ${k} diverge entre as listas`);
  }
  for (const c of Object.values(CRITICO_T10_6)) {
    if (c.avaria) confere(AVARIAS[c.avaria], `o crítico aponta uma avaria que não existe: ${c.avaria}`);
  }
}

if (problemas.length) {
  console.error(`✘ combate de naves: ${problemas.length} problema(s)`);
  for (const p of problemas) console.error(`  · ${p}`);
  process.exit(1);
}
console.log("✔ combate de naves: ataque com a tripulação, CP com escudo, dano com margem, reserva, avarias, prazos e Calor");
