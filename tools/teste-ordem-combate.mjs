// Teste da declaração por rodada (T7-2 no rastreador), sem Foundry.
//
// ── A ASSERÇÃO QUE MAIS IMPORTA ─────────────────────────────────────────────
//
// QUEM declara pelo quê. Os ganchos de combate disparam em TODOS os clientes, e
// cada um pergunta pelos seus — então a divisão precisa ser exata nos dois
// sentidos:
//
//   · se o Mestre também declarar pelo personagem de um jogador, ele rouba a
//     vez do jogador, e o valor que o jogador declarar depois sobrescreve o
//     dele (ou o contrário, conforme quem clicar primeiro);
//   · se ninguém pegar o PNJ, ele entra no combate SEM valor, e o rastreador o
//     põe em qualquer lugar da fila.
//
// Os dois erros são silenciosos na mesa: a fila existe, só está errada.
//
// Uso: node tools/teste-ordem-combate.mjs

import {
  meusCombatentes, lerFormulario, envolverRollInitiative,
} from "../spacedragon-module/module/ordem-combate.js";

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

/* ── QUEM DECLARA PELO QUÊ ────────────────────────────────────────────────── */

const comb = (nome, { meu = false, dePlayer = false, semAtor = false } = {}) => ({
  id: `c-${nome}`,
  name: nome,
  actor: semAtor ? null : { isOwner: meu, hasPlayerOwner: dePlayer },
});

const mesa = [
  comb("Han", { meu: true, dePlayer: true }),       // o personagem deste jogador
  comb("Leia", { meu: false, dePlayer: true }),     // de outro jogador
  comb("Stormtrooper 1"),                           // PNJ
  comb("Stormtrooper 2"),                           // PNJ
  comb("Token solto", { semAtor: true }),           // sem ator
];

{
  const doJogador = meusCombatentes(mesa, { ehMestre: false }).map((c) => c.name);
  confere(JSON.stringify(doJogador) === JSON.stringify(["Han"]),
    `o jogador declara só pelo Han, veio ${doJogador.join(", ") || "nada"}`);
}
{
  const doMestre = meusCombatentes(mesa, { ehMestre: true }).map((c) => c.name);
  // Os PNJs, e SÓ os PNJs: Han e Leia são dos jogadores.
  confere(JSON.stringify(doMestre) === JSON.stringify(["Stormtrooper 1", "Stormtrooper 2"]),
    `o Mestre declara pelos dois PNJs, veio ${doMestre.join(", ") || "nada"}`);
  confere(!doMestre.includes("Han") && !doMestre.includes("Leia"),
    "o Mestre NÃO pode declarar pelo personagem de um jogador — ele rouba a vez dele");
}
{
  // Ninguém pode ficar de fora: todo combatente com ator tem exatamente um
  // declarante entre o Mestre e os jogadores.
  const comAtor = mesa.filter((c) => c.actor);
  const doMestre = new Set(meusCombatentes(mesa, { ehMestre: true }).map((c) => c.id));
  for (const c of comAtor) {
    const temDono = c.actor.hasPlayerOwner;
    confere(doMestre.has(c.id) || temDono,
      `${c.name} ficaria sem ninguém para declarar — entraria no combate sem valor`);
  }
}
{
  // Token sem ator não tem o que declarar, e não pode quebrar a janela.
  const todos = [...meusCombatentes(mesa, { ehMestre: true }), ...meusCombatentes(mesa, { ehMestre: false })];
  confere(!todos.some((c) => c.name === "Token solto"), "combatente sem ator não entra na janela");
  confere(meusCombatentes([], { ehMestre: true }).length === 0, "combate vazio não quebra");
  confere(meusCombatentes(undefined).length === 0, "lista ausente não quebra");
}
{
  // Um PNJ que o Mestre entregou a um jogador (o familiar, o aliado) é do
  // jogador: hasPlayerOwner é o que decide, não o tipo do ator.
  const aliado = [comb("Chewie", { meu: false, dePlayer: true })];
  confere(meusCombatentes(aliado, { ehMestre: true }).length === 0,
    "PNJ entregue a um jogador não volta para a lista do Mestre");
}

/* ── A LEITURA DO FORMULÁRIO ──────────────────────────────────────────────── */
//
// Uma troca de campos aqui daria a ação de um combatente a outro, e o valor
// pareceria plausível — ninguém notaria no meio da rodada.

function formFalso(linhas) {
  const nos = linhas.map((l) => ({
    dataset: { id: l.id },
    querySelector: (sel) =>
      sel === ".sd-ordem-modo" ? { value: l.modo } :
      sel === ".sd-ordem-entrada" ? { value: l.entrada } : null,
  }));
  return { querySelectorAll: () => nos };
}

{
  const lido = lerFormulario(formFalso([
    { id: "c-Han", modo: "ataque", entrada: "1d8" },
    { id: "c-Leia", modo: "movimento", entrada: "3" },
  ]));
  confere(lido.length === 2, "duas linhas, dois resultados");
  confere(lido[0].id === "c-Han" && lido[0].modo === "ataque" && lido[0].entrada === "1d8",
    "a primeira linha não voltou com os próprios campos");
  confere(lido[1].id === "c-Leia" && lido[1].modo === "movimento" && lido[1].entrada === "3",
    "a segunda linha não voltou com os próprios campos");
}
confere(lerFormulario(null).length === 0, "formulário ausente não quebra");
confere(lerFormulario({}).length === 0, "formulário sem querySelectorAll não quebra");

/* ── A OPÇÃO VEM DESLIGADA ────────────────────────────────────────────────── */
//
// Abrir uma janela na cara de todo mundo ao iniciar qualquer combate é
// intrusivo para um mundo que só queria os compêndios.
{
  const fs = await import("node:fs");
  const fonte = fs.readFileSync(new URL("../spacedragon-module/module/ordem-combate.js", import.meta.url), "utf8");
  // A partir do REGISTRO, e não da primeira menção: a primeira é a leitura
  // dentro de `ligada()`, e uma janela a partir dela não alcança o default.
  const i = fonte.indexOf('game.settings.register(ID, "ordemNoCombate"');
  confere(i > 0, "não achei o registro da opção ordemNoCombate");
  confere(/default:\s*false/.test(fonte.slice(i, i + 1400)),
    "a pergunta por rodada tem de vir DESLIGADA: ela abre janela em todo cliente");
  // E o botão de rolar iniciativa só some com a opção ligada — senão o módulo
  // tiraria da mesa um botão que ela talvez use.
  const j = fonte.indexOf("renderCombatTracker");
  confere(/if \(!ligada\(\)\) return;/.test(fonte.slice(j, j + 400)),
    "o botão de rolar iniciativa só pode sumir com a opção ligada");
  /* ── O GANCHO PRECISA CHEGAR AOS JOGADORES ──────────────────────────────
   *
   * A ASSERÇÃO QUE NASCEU DA MESA. `combatStart` e `combatRound` SÓ DISPARAM NO
   * MESTRE: o Foundry guarda os eventos de turno atrás de uma checagem de GM
   * ativo. A primeira versão usava os dois, e o sintoma foi exatamente esse —
   * a janela de declaração aparecia só para o Mestre, pelos PNJs, e os
   * jogadores nunca eram perguntados.
   *
   * `updateCombat` é gancho de DOCUMENTO e chega a todos os clientes. A virada
   * se reconhece por `mudou.round`.
   */
  confere(!/Hooks\.on\("combat(Start|Round)"/.test(fonte),
    "combatStart/combatRound só disparam no Mestre — os jogadores nunca seriam " +
    "perguntados. Use updateCombat, que chega a todos os clientes");
  confere(/Hooks\.on\("updateCombat"/.test(fonte),
    "falta o gancho updateCombat, que é o que alcança os jogadores");
  confere(/mudou\?\.round == null/.test(fonte),
    "updateCombat dispara em toda mudança de combate — sem conferir `round`, a " +
    "janela abriria a cada ataque, não a cada rodada");
}

/* ── O DESVIO DE rollInitiative ──────────────────────────────────────────── */
//
// É o ponto que TODOS os rastreadores compartilham: o padrão do Foundry, o
// Combat Tracker Dock (três caminhos próprios) e o Combat Carousel. Caçar botão
// por botão seria perseguir o CSS de cada um; o desvio pega todos.
//
// O que não pode acontecer, em ordem de gravidade:
//   · desviar com a opção DESLIGADA — o módulo quebraria a iniciativa de quem
//     nunca pediu a T7-2;
//   · envolver duas vezes — a janela abriria em dobro.
{
  let chamouOriginal = 0;
  class CombatFalso {
    async rollInitiative(ids) { chamouOriginal += 1; return `original:${ids}`; }
  }
  globalThis.CONFIG = { Combat: { documentClass: CombatFalso } };
  globalThis.foundry = {};            // sem DialogV2: `perguntar` sai cedo
  globalThis.game = { user: { isGM: true }, settings: { get: () => desligada ? false : true } };
  let desligada = true;

  envolverRollInitiative();
  const c = new CombatFalso();
  c.combatants = { contents: [] };

  // opção DESLIGADA: o original roda intacto
  await c.rollInitiative(["x"]);
  confere(chamouOriginal === 1, "com a opção desligada, rollInitiative tem de chamar o original");

  // opção LIGADA: o original não roda
  desligada = false;
  await c.rollInitiative(["x"]);
  confere(chamouOriginal === 1,
    "com a opção ligada, rollInitiative NÃO pode rolar 1d20 — é a regra que a T7-2 substitui");

  // Envolver de novo não pode re-embrulhar. A primeira versão deste teste
  // contava chamadas ao original, e isso NÃO prova nada: com a opção ligada,
  // cada envoltório retorna antes de chamar o de baixo, então o contador fica
  // igual com um ou com cinco. O que se mede é a IDENTIDADE da função — se ela
  // mudar, a cadeia cresceu a cada `ready`.
  const envolvida = CombatFalso.prototype.rollInitiative;
  envolverRollInitiative();
  envolverRollInitiative();
  confere(CombatFalso.prototype.rollInitiative === envolvida,
    "envolver de novo re-embrulhou a função — a cadeia cresce a cada recarga");

  // e o original volta a valer se a opção for desligada no meio da sessão
  desligada = true;
  await c.rollInitiative(["x"]);
  confere(chamouOriginal === 2,
    "desligar a opção no meio da sessão tem de devolver a iniciativa original");
}

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log(
  "  ✔ ordem no combate: o Mestre declara pelos PNJs e por mais ninguém, o jogador " +
    "só pelo seu, ninguém fica sem declarante, token sem ator não entra, o formulário " +
    "não troca linha, a opção vem desligada, e rollInitiative só é desviado com ela ligada"
);
