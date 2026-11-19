/**
 * Aplicar dano pela regra do Space Dragon (module/dano.js).
 *
 *   · a RD como o bestiário grava ("6/FÍSICO", "IMUNE A ATAQUES FÍSICOS");
 *   · PV negativo para personagem, travado em 0 para ameaça;
 *   · os estados do Cap. 7 e a morte nos Danos Mortais;
 *   · a cura não passa do máximo;
 *   · quais mensagens do chat são de dano;
 *   · quem rola a JPF na virada de rodada.
 *
 *     node tools/teste-dano.mjs
 */

import {
  lerRD, calcularDano, estadoPorPV, ehMensagemDeDano, totalDaMensagem, modoDo, rdDoAtor, quemRolaJPF,
} from "../spacedragon-module/module/dano.js";

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* ── A RD do bestiário ─────────────────────────────────────────────────── */
{
  const casos = [
    ["", { valor: 0, condicao: "", imune: false }],
    ["3", { valor: 3, condicao: "", imune: false }],
    ["6/FÍSICO", { valor: 6, condicao: "FÍSICO", imune: false }],
    ["4/ÁCIDO", { valor: 4, condicao: "ÁCIDO", imune: false }],
    ["IMUNE A ATAQUES FÍSICOS", { valor: 0, condicao: "ATAQUES FÍSICOS", imune: true }],
    ["IMUNE A", { valor: 0, condicao: "", imune: true }],
  ];
  for (const [texto, esperado] of casos) {
    const r = lerRD(texto);
    const recorte = { valor: r.valor, condicao: r.condicao, imune: r.imune };
    confere(igual(recorte, esperado), `RD "${texto}" virou ${JSON.stringify(recorte)}`);
  }
}

/* ── A conta ───────────────────────────────────────────────────────────── */
{
  // o exemplo do livro: RD 3 e leva 8, sofre 5
  const r = calcularDano({ pv: 10, dano: 8, rd: 3 });
  confere(r.sofrido === 5 && r.depois === 5 && r.rdUsada === 3, `RD 3 contra 8 deu ${JSON.stringify(r)}`);

  // o dano nunca é negativo
  const zero = calcularDano({ pv: 10, dano: 2, rd: 5 });
  confere(zero.sofrido === 0 && zero.depois === 10, "RD maior que o dano não pode curar");

  // personagem vai abaixo de 0; ameaça para em 0
  const p = calcularDano({ pv: 3, dano: 7, mortais: -10 });
  confere(p.depois === -4 && p.estado === "morrendo", `personagem de 3 PV com 7 de dano: ${JSON.stringify(p)}`);
  const a = calcularDano({ pv: 3, dano: 7, modo: "ameaca" });
  confere(a.depois === 0 && a.estado === "derrotado", `ameaça de 3 PV com 7 de dano: ${JSON.stringify(a)}`);

  // morte nos Danos Mortais, inclusive exatamente neles
  confere(calcularDano({ pv: 2, dano: 9, mortais: -7 }).estado === "morto", "−7 com Danos Mortais −7 é morte");
  confere(calcularDano({ pv: 2, dano: 8, mortais: -7 }).estado === "morrendo", "−6 com Danos Mortais −7 ainda não é morte");

  // a cura não passa do máximo e tira do negativo
  const c = calcularDano({ pv: -3, max: 12, dano: 20, cura: true });
  confere(c.depois === 12 && c.sofrido === -15 && c.estado === "de-pe", `cura de −3 com 20, máx. 12: ${JSON.stringify(c)}`);
  confere(calcularDano({ pv: 5, max: 12, dano: 4, cura: true, rd: 3 }).depois === 9, "a RD não pode descontar cura");
}

/* ── Os estados ────────────────────────────────────────────────────────── */
{
  const p = (pv) => estadoPorPV(pv, { modo: "personagem", mortais: -10 });
  confere(p(1) === "de-pe" && p(0) === "inconsciente" && p(-1) === "morrendo" && p(-10) === "morto",
    `estados do personagem: 1 ${p(1)}, 0 ${p(0)}, −1 ${p(-1)}, −10 ${p(-10)}`);
  confere(estadoPorPV(0, { modo: "ameaca" }) === "derrotado", "ameaça em 0 está derrotada");
}

/* ── As mensagens de dano ──────────────────────────────────────────────── */
{
  const od2 = { flavor: "<div class='title'>Dano com <strong>Pistola laser</strong></div>", temRolagem: true };
  confere(ehMensagemDeDano(od2, { od2: "Dano com", qdv: "Dano" }), "a rolagem de dano do sistema não foi reconhecida");
  const qdv = { flavor: "Dano", content: '<div class="od2ca-card">…</div>', temRolagem: true };
  confere(ehMensagemDeDano(qdv, { od2: "Dano com", qdv: "Dano" }), "o cartão de dano do Qualidade de Vida não foi reconhecido");
  confere(!ehMensagemDeDano({ flavor: "Dano", content: "<p>outra coisa</p>", temRolagem: true }), "\"Dano\" solto não é o cartão do Qualidade de Vida");
  confere(!ehMensagemDeDano({ ...od2, temRolagem: false }), "mensagem sem rolagem não tem o que aplicar");
  confere(!ehMensagemDeDano({ flavor: "Ataque com Pistola", temRolagem: true }), "ataque confundido com dano");
  confere(ehMensagemDeDano({ flavor: "Damage with <b>Sword</b>", temRolagem: true }, { od2: "Damage with", qdv: "Damage" }),
    "o rótulo vem do idioma do sistema, e em inglês não foi reconhecido");
  confere(totalDaMensagem({ rolls: [{ total: 7 }, { total: 3 }] }) === 10, "o total soma as rolagens da mensagem");
}

/* ── Quem é quem ───────────────────────────────────────────────────────── */
{
  confere(modoDo({ type: "monster", flags: {} }) === "ameaca", "monstro é ameaça");
  confere(modoDo({ type: "character", flags: {} }) === "personagem", "personagem com a ficha do Space Dragon");
  confere(modoDo({ type: "character", flags: { spacedragon: { nave: { tipo: "caca" } } } }) === null, "nave não toma dano por aqui");
  confere(rdDoAtor({ type: "monster", flags: { spacedragon: { ameaca: { rd: "6/FÍSICO" } } } }).valor === 6, "RD da Ficha de Ameaça");

  // a mutação Tato ignora 2 de qualquer dano
  const tato = {
    type: "character", flags: {},
    system: { variable_construction_selections: { m1: [{ key: "07-tato" }] } },
    items: { get: (id) => (id === "m1" ? { flags: { spacedragon: { mutacao: "aprimoramento" } }, system: {} } : null) },
  };
  confere(rdDoAtor(tato).valor === 2, `a mutação Tato devia dar RD 2, deu ${rdDoAtor(tato).valor}`);
}

/* ── Quem rola a JPF ───────────────────────────────────────────────────── */
{
  const pc = (nome, pv, extra = {}) => ({
    name: nome, defeated: false,
    actor: { name: nome, type: "character", system: { hp: { value: pv }, constituicao: 10 }, flags: { spacedragon: extra } },
  });
  const lista = [pc("Ferido", 4), pc("Desmaiado", 0), pc("Morrendo", -3), pc("Estável", -3, { estavel: true }), pc("Morto", -40)];
  const nomes = quemRolaJPF(lista).map((c) => c.name);
  confere(igual(nomes, ["Morrendo"]), `só quem está abaixo de 0, vivo e sem estabilizar rola; vieram ${nomes.join(", ")}`);
}

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log("  ✔ dano: RD do bestiário e do Tato, PV negativo, Danos Mortais, cura, mensagens de dano e a JPF de quem está morrendo");
