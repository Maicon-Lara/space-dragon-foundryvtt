/**
 * A declaração da Ordem de Ação quando o combate começa — e a cada rodada.
 *
 * ── O QUE ISTO SUBSTITUI ────────────────────────────────────────────────────
 *
 * O botão de rolar iniciativa do rastreador. Na T7-2 ninguém rola iniciativa:
 * o valor vem da AÇÃO declarada, e muda a cada rodada. Um botão de 1d20 ali é
 * um convite a jogar a regra errada — então, com esta opção ligada, ele some e
 * a pergunta toma o lugar dele.
 *
 * ── POR QUE NÃO PRECISA DE SOCKET ───────────────────────────────────────────
 *
 * Porque `combatStart` e `combatRound` disparam em TODOS os clientes, não só no
 * do Mestre. Cada um pergunta apenas pelos combatentes que controla, e grava o
 * próprio valor. Sem socket não há mensagem para se perder, nem permissão de
 * módulo a declarar no manifesto, nem o caso de o Mestre estar com a aba em
 * segundo plano.
 *
 * ── UM DIÁLOGO, N LINHAS ────────────────────────────────────────────────────
 *
 * Uma janela por combatente seria aceitável para o jogador, que tem um, e
 * insuportável para o Mestre, que pode ter seis. Então a janela lista TODOS os
 * combatentes que você controla, cada um com o próprio seletor de ação — o
 * jogador vê uma linha, o Mestre vê as dele.
 */

import { MODOS } from "./ordem.js";
import { opcoesDeOrdem } from "./ordem-ficha.js";

const ID = "spacedragon";
// Marca de que já envolvemos o protótipo: um segundo envoltório sobre o nosso
// chamaria a janela duas vezes.
const MARCA_PATCH = "__sdOrdemRollInitiative";

const escapa = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const ligada = () => {
  try {
    return game.settings?.get?.(ID, "ordemNoCombate") === true;
  } catch {
    return false;
  }
};

/**
 * Os combatentes que ESTE usuário deve declarar.
 *
 * Pelo ator, e não pelo token: quem é dono do personagem declara por ele. Um
 * combatente sem ator (token solto, deletado) fica de fora — não há o que
 * perguntar sobre ele.
 *
 * O Mestre pega o que sobra: os PNJs que ninguém mais controla. Sem isso, um
 * monstro ficaria sem valor e o rastreador o poria em qualquer lugar da fila.
 */
export function meusCombatentes(combatentes = [], { ehMestre = false } = {}) {
  const deOutros = (c) => !!c?.actor?.hasPlayerOwner;
  return combatentes.filter((c) => {
    if (!c?.actor) return false;
    if (c.actor.isOwner && !ehMestre) return true;
    if (!ehMestre) return false;
    // Mestre: o que ninguém mais tem dono para declarar
    return !deOutros(c);
  });
}

/** Uma linha do formulário, por combatente. */
function linha(c) {
  const opcoes = opcoesDeOrdem(c.actor)
    .map(
      (l) =>
        `<option value="${escapa(l.modo)}" data-campo="${escapa(l.campo)}">${escapa(l.rotulo)}</option>`
    )
    .join("");
  const primeiro = opcoesDeOrdem(c.actor)[0];
  return (
    `<div class="sd-ordem-linha-combate" data-id="${escapa(c.id)}">` +
    `<span class="sd-ordem-nome">${escapa(c.name ?? c.actor?.name ?? "?")}</span>` +
    `<select class="sd-ordem-modo">${opcoes}</select>` +
    `<input type="text" class="sd-ordem-entrada" value="${escapa(primeiro?.campo ?? "")}">` +
    `</div>`
  );
}

/**
 * Lê o formulário e devolve [{ id, modo, entrada }].
 *
 * Separado do diálogo para poder ser testado: é aqui que uma troca de ordem de
 * campos passaria despercebida.
 */
export function lerFormulario(raiz) {
  return [...(raiz?.querySelectorAll?.(".sd-ordem-linha-combate") ?? [])].map((n) => ({
    id: n.dataset.id,
    modo: n.querySelector(".sd-ordem-modo")?.value ?? "ataque",
    entrada: String(n.querySelector(".sd-ordem-entrada")?.value ?? "").trim(),
  }));
}

/** Grava o valor no rastreador, e diz se conseguiu. */
async function gravar(combat, id, valor) {
  try {
    await combat.setInitiative(id, valor);
    return true;
  } catch (e) {
    // Sem permissão de escrever no combatente: o valor ainda vale, e o cartão
    // de chat já o mostrou — o Mestre o lança à mão. Melhor isto que um erro
    // vermelho no meio da rodada.
    console.warn(`${ID} | não pude gravar a ordem de ${id} no rastreador`, e);
    return false;
  }
}

async function perguntar(combat, ids = null) {
  let meus = meusCombatentes(combat.combatants.contents, { ehMestre: !!game.user?.isGM });
  // Quando a pergunta vem de um clique em "rolar iniciativa", ela vale só para
  // os combatentes daquele clique — e não para todos os meus.
  if (ids?.length) meus = meus.filter((c) => ids.includes(c.id));
  if (!meus.length) return;

  const V2 = foundry.applications?.api?.DialogV2;
  if (!V2) return;

  const corpo =
    `<p class="sd-explica">A ordem de ação sai da <strong>T7-2</strong>: o valor vem da ` +
    `ação escolhida, e <strong>o menor age primeiro</strong>. Declare de novo a cada rodada.</p>` +
    `<div class="sd-ordem-combate">${meus.map(linha).join("")}</div>`;

  const escolhas = await V2.wait({
    window: { title: `Ordem de Ação — rodada ${combat.round}` },
    content: corpo,
    buttons: [
      { action: "ok", label: "Declarar", default: true, callback: (_e, b) => lerFormulario(b.form) },
      { action: "nao", label: "Depois", callback: () => null },
    ],
    rejectClose: false,
  });
  if (!escolhas) return;

  const ditos = [];
  for (const { id, modo, entrada } of escolhas) {
    const c = meus.find((x) => x.id === id);
    if (!c) continue;
    const m = MODOS[modo] ?? MODOS.ataque;
    const { n, como, roll } = await m.valor(entrada);
    const foi = await gravar(combat, id, n);
    ditos.push({ nome: c.name ?? c.actor?.name, n, como, roll, foi });
  }
  if (!ditos.length) return;

  const linhas = ditos
    .map(
      (d) =>
        `<li class="sd-ordem-item"><span class="sd-nome">${escapa(d.nome)}</span> ` +
        `<span class="sd-alvo">${d.n}</span> <span class="sd-conta">${escapa(d.como)}</span>` +
        (d.foi ? "" : ` <em>(o Mestre precisa lançar este número)</em>`) +
        `</li>`
    )
    .join("");

  await ChatMessage.create({
    content:
      `<div class="title">Ordem de Ação — rodada ${combat.round}</div>` +
      `<div class="sd-teste"><ol class="sd-testes">${linhas}</ol>` +
      `<p class="sd-nota"><em>Age primeiro o menor resultado, pela T7-2.</em></p></div>`,
    rolls: ditos.map((d) => d.roll).filter(Boolean),
    ...(ditos.some((d) => d.roll) ? { sound: CONFIG.sounds?.dice } : {}),
  });
}

export function registrarOpcaoDeCombate() {
  game.settings.register(ID, "ordemNoCombate", {
    name: "Perguntar a ação ao começar o combate e a cada rodada",
    hint:
      "Em vez do botão de rolar iniciativa, cada jogador recebe uma janela com as ações do " +
      "personagem dele (as armas já vêm com o dado de dano) e o valor da T7-2 vai para o " +
      "rastreador. O Mestre declara pelos PNJs na mesma janela. Atenção: o rastreador do " +
      "Foundry ordena do MAIOR para o menor, ao contrário da regra — use um módulo que " +
      "inverta a ordenação, ou leia a fila de baixo para cima.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
  });
}

/**
 * `rollInitiative` deixa de rolar 1d20 e passa a perguntar a ação.
 *
 * ── POR QUE AQUI, E NÃO NOS BOTÕES ──────────────────────────────────────────
 *
 * Porque há mais de um rastreador no mundo. O padrão do Foundry tem o seu botão;
 * o *Combat Tracker Dock* tem três caminhos próprios (o retrato do combatente,
 * "rolar todos" e "rolar PNJs"); o *Combat Carousel* tem o ícone do card. Caçar
 * botão por botão significa perseguir o CSS de cada módulo a cada versão deles,
 * e perder sempre que um novo aparecer.
 *
 * Todos, porém, acabam chamando `combat.rollInitiative()`. Trocando esse ponto,
 * qualquer um deles passa a abrir a janela de declaração — inclusive a rolagem
 * automática que o Foundry faz ao adicionar um combatente, que de outro modo
 * encheria a fila de 1d20 antes de alguém declarar.
 *
 * ── O QUE ISTO CUSTA, DITO EM VOZ ALTA ──────────────────────────────────────
 *
 * É um patch no protótipo de `Combat`, e o cabeçalho de ordem.js diz que este
 * módulo não reescreve a iniciativa de um sistema alheio. A diferença é o
 * consentimento: isto só entra com a opção LIGADA, e a opção existe justamente
 * para quem decidiu jogar a T7-2. Com ela desligada, o original roda intacto e
 * nada neste arquivo toca em nada.
 *
 * O original fica guardado e é chamado de volta nesse caso — não substituímos a
 * regra do sistema, desviamos a chamada enquanto a mesa quer o desvio.
 */
export function envolverRollInitiative() {
  const Base = CONFIG.Combat?.documentClass;
  if (!Base?.prototype || Base.prototype[MARCA_PATCH]) return;
  const original = Base.prototype.rollInitiative;
  if (typeof original !== "function") return;

  Base.prototype.rollInitiative = async function (ids, options) {
    if (!ligada()) return original.call(this, ids, options);
    const lista = Array.isArray(ids) ? ids : ids ? [ids] : null;
    await perguntar(this, lista);
    return this;
  };
  Base.prototype[MARCA_PATCH] = true;
}

export function ligarOrdemNoCombate() {
  envolverRollInitiative();

  // Os dois momentos em que a T7-2 manda declarar: o começo do combate e cada
  // rodada nova. `combatRound` já cobre a virada; `combatStart` existe porque a
  // primeira rodada não "vira".
  Hooks.on("combatStart", (combat) => { if (ligada()) perguntar(combat); });
  Hooks.on("combatRound", (combat) => { if (ligada()) perguntar(combat); });

  // O botão de rolar iniciativa sai de cena: na T7-2 não se rola iniciativa, e
  // deixá-lo ali é convidar a mesa a jogar a regra errada. Removido do DOM, e
  // não escondido por CSS, para não depender de qual seletor o sistema usa na
  // versão da vez.
  Hooks.on("renderCombatTracker", (app, el) => {
    if (!ligada()) return;
    const raiz = el instanceof HTMLElement ? el : el?.[0];
    raiz
      ?.querySelectorAll('[data-control="rollInitiative"], [data-action="rollInitiative"], .roll-initiative')
      .forEach((b) => b.remove());
  });
}
