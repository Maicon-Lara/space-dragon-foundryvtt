/**
 * O tripulante no posto (nave-tripulante.js): a ficha do personagem ligada a
 * um posto da nave, e o que a nave lê dela.
 *
 * ── O QUE ESTE TESTE GARANTE ────────────────────────────────────────────────
 *
 *   · [TRIP-PILOTAR]  Pilotar Naves pela tabela do Cosmonauta (e pela da
 *                     especialização, quando ela declara); Operar Máquinas para
 *                     o Cientista; a HABILIDADE manda sobre o chassi (o
 *                     Sensível à Força mistura as classes); sem nenhuma, null;
 *   · [TRIP-CONSERTO] Operar Máquinas (%) para o Técnico, Intelecto (1d20) para
 *                     os demais;
 *   · [TRIP-VINCULO]  arrastar grava nome e vínculo; nave não senta; digitar
 *                     outro nome solta o vínculo, o mesmo nome o mantém, vazio
 *                     apaga os dois; o vínculo manda sobre o nome;
 *   · [TRIP-CAMARA]   quem está na Ponte e na Sala de Máquinas;
 *   · [TRIP-PAINEL]   o selo do posto, e o Pilotar lido no lugar do campo.
 *
 *     node tools/teste-nave-tripulante.mjs
 */

import { instalarLang } from "./lang-de-teste.mjs";
import {
  pilotarDe, consertoDe, baDistanciaDe, consertoPassou, formulaDoConserto, vincularAoPosto, digitarNoPosto,
  tripulanteDoPosto, tripulacaoDaNave, tripulantesNaCamara, resumoDoTripulante, habilidadesDe,
} from "../spacedragon-module/module/nave-tripulante.js";
import { painelCinematico, seloDoTripulante } from "../spacedragon-module/module/nave-cine-ficha.js";
import { naveVazia } from "../spacedragon-module/module/nave-pc-dados.js";
import { PROGRESSAO } from "../spacedragon-module/module/dados.js";

instalarLang();
const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

const classe = (chassi, extra = {}) => ({ type: "class", name: `Algo — ${chassi}`, flags: { spacedragon: { chassi, ...extra } } });
const hab = (name, habilidade = null) => ({ type: "class_ability", name, flags: habilidade ? { spacedragon: { habilidade } } : {} });
const pessoa = (id, name, items, system = {}) => ({
  id, uuid: `Actor.${id}`, name, items, flags: {},
  system: { level: 7, sabedoria: 12, bad: 3, ...system },
});
const pct = (tabela, coluna, nivel) => Number(String(PROGRESSAO[tabela][coluna][nivel - 1]).replace("%", ""));

const talik = pessoa("talik", "Talik Secura", [classe("Cosmonauta"), hab("Pilotar Naves")], { bad: 5, sabedoria: 10 });
const mercenario = pessoa("merc", "Mercenário", [
  classe("Cosmonauta", { progressao: { fonte: "Mercenário", colunas: { pilotarNaves: { 7: "84%" } } } }), hab("Pilotar Naves"),
]);
const md9 = pessoa("md9", "MD-9", [classe("Cientista"), hab("Operar e Consertar Máquinas", "Operar Máquinas")], { sabedoria: 16 });
const mesla = pessoa("mesla", "Mesla", [classe("Gatuno"), hab("Talentos de Operativo", "Talentos de Gatuno")], { bad: 7, sabedoria: 14 });
const darian = pessoa("darian", "Darian", [classe("Mentálico"), hab("Poderes da Força", "Realizar e Aprender Poder Mental")], { sabedoria: 16 });
const guardiaoPiloto = pessoa("gp", "Guardião piloto", [classe("Mentálico"), hab("Pilotar Naves")]);
const semClasse = pessoa("x", "Sem classe", [], { sabedoria: 0 });
const nave = { id: "n", name: "Dunelizard", flags: { spacedragon: { nave: { tipo: "caca" } } }, items: [], system: {} };

// ── [TRIP-PILOTAR] ──
confere(pilotarDe(talik)?.valor === pct("COSMONAUTA", "pilotarNaves", 7) && pilotarDe(talik)?.fonte === "Pilotar Naves",
  `[TRIP-PILOTAR] Veterano 7º: Pilotar Naves da tabela (${JSON.stringify(pilotarDe(talik))})`);
confere(pilotarDe(mercenario)?.valor === 84, `[TRIP-PILOTAR] a especialização que declara a coluna manda: 84% (${JSON.stringify(pilotarDe(mercenario))})`);
confere(pilotarDe(md9)?.valor === pct("CIENTISTA", "operarMaquinas", 7) && pilotarDe(md9)?.fonte === "Operar Máquinas",
  "[TRIP-PILOTAR] Técnico pilota pelo Operar Máquinas");
confere(pilotarDe(mesla) === null && pilotarDe(darian) === null, "[TRIP-PILOTAR] Operativo e Guardião sem a habilidade: a mesa digita");
confere(pilotarDe(guardiaoPiloto)?.fonte === "Pilotar Naves", "[TRIP-PILOTAR] o Sensível à Força com Pilotar Naves pilota pela habilidade, não pelo chassi");
confere(pilotarDe(null) === null && habilidadesDe(md9).has("Operar Máquinas"), "[TRIP-PILOTAR] sem ator, null; a habilidade pelo nome do livro");

// ── [TRIP-CONSERTO] ──
const cMd9 = consertoDe(md9);
confere(cMd9?.tipo === "pct" && cMd9.valor === pct("CIENTISTA", "operarMaquinas", 7) && formulaDoConserto(cMd9) === "1d100",
  `[TRIP-CONSERTO] Técnico: Operar Máquinas, 1d100 (${JSON.stringify(cMd9)})`);
const cMesla = consertoDe(mesla);
confere(cMesla?.tipo === "d20" && cMesla.valor === 14 && formulaDoConserto(cMesla) === "1d20", "[TRIP-CONSERTO] os demais: Intelecto (campo Sabedoria), 1d20");
confere(consertoPassou(cMesla, 14) && !consertoPassou(cMesla, 15) && !consertoPassou(null, 1), "[TRIP-CONSERTO] passa com ≤");
confere(consertoDe(semClasse) === null, "[TRIP-CONSERTO] sem Intelecto na ficha, null");
confere(baDistanciaDe(mesla) === 7 && baDistanciaDe(null) === null, "[TRIP-CONSERTO] BA à distância da ficha");

// ── [TRIP-VINCULO] ──
let n = naveVazia();
n = vincularAoPosto(n, "leme", talik);
confere(n.postos.leme === "Talik Secura" && n.vinculos.leme === "Actor.talik", "[TRIP-VINCULO] arrastar grava nome e vínculo");
confere(vincularAoPosto(n, "leme", nave) === null && vincularAoPosto(n, "cozinha", talik) === null, "[TRIP-VINCULO] nave não senta; posto inexistente, nada");
confere(vincularAoPosto(n, "leme", { ...talik, pack: "world.pjs", uuid: "Compendium.world.pjs.Actor.talik" }) === null,
  "[TRIP-VINCULO] ator de compêndio não senta (o vínculo apontaria para o pack)");
confere(digitarNoPosto(n, "leme", " Talik Secura ").vinculos.leme === "Actor.talik", "[TRIP-VINCULO] o mesmo nome mantém o vínculo");
const outro = digitarNoPosto(n, "leme", "Kael");
confere(outro.postos.leme === "Kael" && !("leme" in outro.vinculos), "[TRIP-VINCULO] outro nome solta o vínculo");
const vago = digitarNoPosto(n, "leme", "");
confere(!("leme" in vago.postos) && !("leme" in vago.vinculos), "[TRIP-VINCULO] vazio apaga os dois");

const mundo = { "Actor.talik": talik, "Actor.md9": md9, "Actor.mesla": mesla, "Actor.n": nave };
const acharAtor = ({ uuid, nome }) => (uuid ? mundo[uuid] ?? null : Object.values(mundo).find((a) => a.name === nome) ?? null);
// renomeado no mundo, o vínculo ainda acha
const renomeado = { ...n, postos: { leme: "Talik (antigo)" } };
confere(tripulanteDoPosto(renomeado, "leme", acharAtor) === talik, "[TRIP-VINCULO] o vínculo manda sobre o nome");
confere(tripulanteDoPosto({ postos: { artilharia: "Mesla" } }, "artilharia", acharAtor) === mesla, "[TRIP-VINCULO] sem vínculo, pelo nome");
confere(tripulanteDoPosto({ postos: { leme: "Fantasma" }, vinculos: { leme: "Actor.apagado" } }, "leme", acharAtor) === null,
  "[TRIP-VINCULO] ator apagado e nome sem ficha: ninguém");
confere(tripulanteDoPosto({ postos: { leme: "Dunelizard" } }, "leme", acharAtor) === null, "[TRIP-VINCULO] uma nave achada pelo nome não conta");
confere(tripulanteDoPosto({ postos: { leme: "Talik Secura" } }, "leme", null) === null, "[TRIP-VINCULO] sem a função da mesa, ninguém");

// ── [TRIP-CAMARA] ──
const tripulada = {
  postos: { leme: "Talik Secura", artilharia: "Mesla", sensores: "R5-D4", engenharia: "MD-9" },
  vinculos: { leme: "Actor.talik", engenharia: "Actor.md9" },
};
const naPonte = tripulantesNaCamara(tripulada, "ponte", acharAtor);
confere(naPonte.map((t) => t.posto).join() === "leme,artilharia,sensores" && naPonte[2].ator === null && naPonte[1].ator === mesla,
  `[TRIP-CAMARA] na Ponte: Leme, Artilharia e Sensores (R5 sem ficha): ${JSON.stringify(naPonte.map((t) => [t.posto, t.ator?.name ?? null]))}`);
confere(tripulantesNaCamara(tripulada, "maquinas", acharAtor).map((t) => t.ator?.name).join() === "MD-9", "[TRIP-CAMARA] na Sala de Máquinas: a Engenharia");
confere(!tripulantesNaCamara(tripulada, "hangar", acharAtor).length, "[TRIP-CAMARA] câmara sem posto: ninguém");
const dobrado = { postos: { leme: "Talik Secura", artilharia: "Talik Secura" }, vinculos: { leme: "Actor.talik", artilharia: "Actor.talik" } };
confere(tripulantesNaCamara(dobrado, "ponte", acharAtor).length === 1, "[TRIP-CAMARA] quem está em dois postos da Ponte faz uma JPR só");

// ── [TRIP-PAINEL] ──
const trip = tripulacaoDaNave(tripulada, acharAtor);
confere(trip.leme.vinculado && !trip.artilharia.vinculado && !trip.sensores, "[TRIP-PAINEL] vinculado, achado pelo nome, sem ficha");
const morto = tripulacaoDaNave({ postos: { leme: "Talik Secura" }, vinculos: { leme: "Actor.apagado" } }, acharAtor);
confere(morto.leme?.ator === talik && !morto.leme.vinculado, "[TRIP-PAINEL] vínculo de ator apagado: o homônimo achado pelo nome não conta como vinculado");
confere(resumoDoTripulante("leme", talik) === `Pilotar Naves ${pct("COSMONAUTA", "pilotarNaves", 7)}%` &&
  resumoDoTripulante("artilharia", mesla) === "BA +7" && /^Operar Máquinas \d+%$/.test(resumoDoTripulante("engenharia", md9)),
  "[TRIP-PAINEL] o resumo diz só o que o posto usa");
confere(/fa-link/.test(seloDoTripulante(trip.leme)) && /fa-user/.test(seloDoTripulante(trip.artilharia)) && seloDoTripulante(undefined) === "",
  "[TRIP-PAINEL] selo: corrente para o vinculado, pessoa para o achado pelo nome, nada sem ficha");
const ator = { system: { hp: { value: 40, max: 40 } } };
const comPiloto = painelCinematico(ator, { ...naveVazia(), ...tripulada }, { rodada: 1, tripulacao: trip });
confere(!/data-campo="pilotar"/.test(comPiloto) && /cine-lido/.test(comPiloto) && comPiloto.includes(`<strong>${pct("COSMONAUTA", "pilotarNaves", 7)}</strong>`),
  "[TRIP-PAINEL] com o piloto vinculado, o Pilotar vem lido, sem campo");
const semPiloto = painelCinematico(ator, naveVazia(), { rodada: 1 });
confere(/data-campo="pilotar"/.test(semPiloto) && !/posto-ficha/.test(semPiloto), "[TRIP-PAINEL] sem tripulante, o campo de sempre");
// um NPC digitado com o nome de um ator do mundo não tira o campo da mesa
const tripPorNome = tripulacaoDaNave({ postos: { leme: "Talik Secura" } }, acharAtor);
const porNome = painelCinematico(ator, naveVazia(), { rodada: 1, tripulacao: tripPorNome });
confere(tripPorNome.leme?.ator === talik && /data-campo="pilotar"/.test(porNome), "[TRIP-PAINEL] achado só pelo nome: o campo de digitar continua");
const operativoNoLeme = painelCinematico(ator, naveVazia(), { rodada: 1, tripulacao: { leme: { ator: mesla, vinculado: true, resumo: "" } } });
confere(/data-campo="pilotar"/.test(operativoNoLeme), "[TRIP-PAINEL] piloto que não pilota pela tabela: o campo continua");

if (problemas.length) {
  console.error(`${problemas.length} problema(s) no tripulante do posto:`);
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log("✔ Tripulante no posto: Pilotar, conserto, BA, vínculo, câmara e painel conferem.");
