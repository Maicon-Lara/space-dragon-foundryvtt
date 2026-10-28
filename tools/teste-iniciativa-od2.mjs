/**
 * O botão de iniciativa do Old Dragon 2, na ficha de personagem e na de nave.
 *
 * ── O QUE ESTE TESTE GARANTE ────────────────────────────────────────────────
 *
 *   · o alvo é o maior entre Destreza e Sabedoria, como no sistema; a nave usa
 *     o piloto do Leme, ou 10 sem piloto com ficha;
 *   · ANTES da 1ª rodada grava-se o d20 cru (o sistema converte ao começar);
 *     DEPOIS, grava-se 99 no sucesso e 33 na falha;
 *   · no modo padrão o teste vale o combate inteiro: só o Mestre rola de novo;
 *   · no individual rola-se o dado do sistema (1d12);
 *   · fora do combate não rola nada.
 *
 *     node tools/teste-iniciativa-od2.mjs
 */

import {
  alvoDaIniciativa, valorPadrao, podeRolar, botaoDeIniciativa,
  rolarIniciativaOD2, INICIATIVA_PADRAO, MARCA_INICIATIVA,
} from "../spacedragon-module/module/iniciativa-od2.js";

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

const personagem = (des, sab, extra = {}) => ({ id: "p1", name: "Darian", type: "character", flags: {}, system: { destreza: des, sabedoria: sab }, ...extra });
const nave = (leme) => ({ id: "n1", name: "Presa", type: "character", flags: { spacedragon: { nave: { tipo: "particular", postos: { leme } } } }, system: {} });

/* ── O alvo ───────────────────────────────────────────────────────────────── */
{
  confere(alvoDaIniciativa(personagem(14, 9)).alvo === 14, "o alvo devia ser a Destreza, a maior");
  confere(alvoDaIniciativa(personagem(9, 16)).alvo === 16, "o alvo devia ser a Sabedoria (Intelecto), a maior");
  confere(alvoDaIniciativa(personagem(0, 12)).alvo === null, "sem Destreza o sistema recusa, e o botão também");

  const piloto = personagem(17, 11, { name: "Mesla" });
  const r = alvoDaIniciativa(nave("Mesla"), (n) => (n === "Mesla" ? piloto : null));
  confere(r.alvo === 17 && r.piloto === "Mesla", `a nave devia testar com o piloto (17), deu ${JSON.stringify(r)}`);
  confere(alvoDaIniciativa(nave("")).alvo === 10, "nave sem piloto testa contra 10");
}

/* ── O valor gravado ──────────────────────────────────────────────────────── */
{
  confere(valorPadrao(7, 12, false).valor === 7, "antes da 1ª rodada devia gravar o d20 cru");
  confere(valorPadrao(12, 12, true).valor === INICIATIVA_PADRAO.SUCCESS, "igual ao alvo é sucesso (≤), e grava 99");
  confere(valorPadrao(13, 12, true).valor === INICIATIVA_PADRAO.FAILURE, "acima do alvo é falha, e grava 33");
  confere(valorPadrao(13, 12, false).sucesso === false, "o sucesso sai certo mesmo antes de começar");
}

/* ── Quem pode rolar ──────────────────────────────────────────────────────── */
{
  confere(podeRolar({ modo: "standard", jaTem: false, mestre: false }), "quem não rolou pode rolar");
  confere(!podeRolar({ modo: "standard", jaTem: true, mestre: false }), "no padrão o jogador não rola de novo");
  confere(podeRolar({ modo: "standard", jaTem: true, mestre: true }), "o Mestre pode rolar de novo");
  confere(podeRolar({ modo: "individual", jaTem: true, mestre: false }), "no individual rola-se de novo");
}

/* ── O botão ──────────────────────────────────────────────────────────────── */
{
  const html = botaoDeIniciativa(personagem(12, 12), "standard");
  confere(html.includes(MARCA_INICIATIVA) && html.includes("Rolar iniciativa"), "o botão devia ter a marca e o rótulo");
  confere(html.includes("1d20"), "a dica do modo padrão devia citar o 1d20");
  confere(botaoDeIniciativa(nave("x"), "standard").includes("Leme"), "a dica da nave devia citar o Leme");
  confere(botaoDeIniciativa(personagem(12, 12), "individual").includes("1d12"), "a dica do individual devia citar o 1d12");
}

/* ── O gesto, com um Foundry de mentira ───────────────────────────────────── */
function montar({ modo = "standard", round = 0, d = 5, inicial = null, mestre = false, ator = personagem(12, 8) } = {}) {
  const gravado = {};
  const avisos = [];
  const chat = [];
  const combatente = { id: "c1", actor: ator, actorId: ator.id, initiative: inicial, setFlag: async () => {} };
  globalThis.game = {
    combat: { round, combatants: { contents: [combatente] }, setInitiative: async (id, v) => { gravado[id] = v; }, setupTurns: async () => {} },
    user: { isGM: mestre },
    settings: { get: (s, k) => (s === "olddragon2e" && k === "initiativeType" ? modo : undefined) },
    actors: { getName: () => null },
  };
  globalThis.ui = { notifications: { warn: (m) => avisos.push(m) } };
  globalThis.CONFIG = { Combat: { initiative: { formula: modo === "individual" ? "1d12" : "1d20" } } };
  globalThis.Roll = class { constructor(f) { this.formula = f; } async evaluate() { this.total = d; return this; } async toMessage(m) { chat.push({ formula: this.formula, ...m }); } };
  globalThis.ChatMessage = { getSpeaker: () => ({}) };
  return { gravado, avisos, chat, ator };
}

{
  const t = montar({ round: 0, d: 5 });
  await rolarIniciativaOD2(t.ator);
  confere(t.gravado.c1 === 5, `antes de começar devia gravar o d20 cru (5), gravou ${t.gravado.c1}`);
  confere(t.chat[0]?.formula === "1d20", "o padrão rola 1d20");
}
{
  const t = montar({ round: 2, d: 5 });
  await rolarIniciativaOD2(t.ator);
  confere(t.gravado.c1 === 99, `com o combate andando, 5 ≤ 12 devia gravar 99, gravou ${t.gravado.c1}`);
}
{
  const t = montar({ round: 2, d: 18 });
  await rolarIniciativaOD2(t.ator);
  confere(t.gravado.c1 === 33, `com o combate andando, 18 > 12 devia gravar 33, gravou ${t.gravado.c1}`);
}
{
  const t = montar({ round: 1, inicial: 99 });
  await rolarIniciativaOD2(t.ator);
  confere(!("c1" in t.gravado) && t.avisos.length === 1, "o jogador não devia rolar de novo no modo padrão");
}
{
  const t = montar({ modo: "individual", round: 3, d: 9, inicial: 4 });
  await rolarIniciativaOD2(t.ator);
  confere(t.gravado.c1 === 9 && t.chat[0]?.formula === "1d12", "no individual devia rolar 1d12 e gravar o total");
}
{
  const t = montar();
  globalThis.game.combat.combatants.contents = [];
  await rolarIniciativaOD2(t.ator);
  confere(t.avisos.length === 1 && t.chat.length === 0, "fora do combate devia avisar e não rolar");
}

if (problemas.length) {
  console.error(`✘ iniciativa OD2: ${problemas.length} problema(s)`);
  for (const p of problemas) console.error(`  · ${p}`);
  process.exit(1);
}
console.log("✔ iniciativa OD2: alvo, valor gravado, quem rola, botão e o gesto no combate");
