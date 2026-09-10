/**
 * O cabeçalho da ficha: Danos Mortais junto do PV, e a Economia vira Créditos.
 *
 * ── O CAMINHO ATÉ AQUI ──────────────────────────────────────────────────────
 *
 * A primeira versão pôs os Danos Mortais e os Créditos juntos, na caixa que era
 * das moedas. Ficou ruim por dois motivos que só aparecem na tela:
 *
 *   · as duas coisas não têm parentesco nenhum. Uma é onde o personagem morre,
 *     a outra é quanto dinheiro ele tem, e a caixa não tinha título possível;
 *   · sem moldura, ao lado de CP e BA que têm, elas ficaram órfãs — mais altas
 *     que as vizinhas e sem nada dizendo o que eram.
 *
 * Agora cada uma vai para onde pertence.
 *
 * ── DANOS MORTAIS PERTENCE AO PV ────────────────────────────────────────────
 *
 * É um limiar de pontos de vida: o personagem não morre em 0, morre num número
 * negativo que a Constituição dá, de −5 a −19. No Old Dragon 2 a morte é sempre
 * em −10 fixo, então não há campo — mas há o lugar certo, que é a caixa de
 * Pontos de Vida, ao lado de Atual e Total.
 *
 * Entrar ali dá de graça a moldura, o alinhamento e o tamanho de fonte das
 * vizinhas: nenhum CSS de layout é escrito aqui.
 *
 * ── E A ECONOMIA VIRA CRÉDITOS ──────────────────────────────────────────────
 *
 * O Space Dragon não tem ouro, prata nem cobre: tem créditos, que são virtuais e
 * andam no Cartão de Identificação Galáctico. As três caixas de moeda viram
 * uma, e ela continua gravando em `system.economy.gp` — campo do próprio
 * sistema, então o valor sobrevive a desinstalar o módulo.
 *
 * ── COMO ────────────────────────────────────────────────────────────────────
 *
 * Cirurgia no DOM depois do render. O template é do sistema e não se toca; se
 * ele mudar, o seletor não acha nada e a ficha segue inteira.
 */

import { FAIXAS, CAMPO_NA_FICHA, COLUNA } from "./dados.js";

const ID = "spacedragon";
const MARCA_PV = "spacedragon-mortais";
const MARCA_CR = "spacedragon-creditos";

function faixaDe(valor) {
  const v = Number(valor) || 0;
  if (v <= 1) return 0;
  if (v >= 29) return FAIXAS.length - 1;
  return FAIXAS.findIndex(([min, max]) => v >= min && v <= max);
}

/** Com quantos PV negativos este personagem morre. */
export function danosMortais(ator) {
  const con = Number(ator?.system?.[CAMPO_NA_FICHA.constituicao]) || 0;
  return Number(COLUNA["constituicao.mortais"][faixaDe(con)] ?? -10);
}

const escapa = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Terceira caixa na linha de Pontos de Vida, igual às duas que já existem. */
function poeDanosMortais(raiz, ator) {
  const linha = raiz.querySelector(".hp-values");
  if (!linha || raiz.querySelector(`.${MARCA_PV}`)) return;

  const mortais = danosMortais(ator);
  const con = Number(ator.system?.[CAMPO_NA_FICHA.constituicao]) || 0;
  const dica = escapa(
    `Constituição ${con}: o personagem morre com ${mortais} pontos de vida, pela T1-3. ` +
    `No Old Dragon 2 a morte é sempre em −10 fixo.`
  );

  // A classe `hp-value` é a do sistema: ela entrega moldura, alinhamento e
  // tipografia sem uma linha de CSS de layout deste módulo.
  linha.insertAdjacentHTML(
    "beforeend",
    `<div class="hp-value ${MARCA_PV}" title="${dica}">` +
    `<input type="text" value="${mortais}" disabled>` +
    `<label class="text-xs">Mortais</label>` +
    `</div>`
  );
}

/** A caixa das três moedas vira uma de Créditos, com moldura e título. */
function poeCreditos(raiz, ator) {
  const caixa = raiz.querySelector(".economy");
  if (!caixa || caixa.classList.contains(MARCA_CR)) return;

  const creditos = Number(ator.system?.economy?.gp) || 0;
  caixa.classList.add(MARCA_CR);

  // A moldura volta: ela é o que iguala esta caixa às de CP e BA ao lado.
  caixa.classList.add("border");
  const titulo = caixa.querySelector("label");
  if (titulo) titulo.textContent = "CR | Créditos";

  const moedas = caixa.querySelector(".currency");
  if (!moedas) return;

  moedas.innerHTML =
    `<div class="sd-creditos" title="Créditos espaciais. Gravados no campo de peças de ouro do sistema.">` +
    `<input type="text" name="system.economy.gp" value="${creditos}" data-dtype="Number">` +
    `<label class="text-xs">Cartão Galáctico</label>` +
    `</div>`;

  // O campo nasce DEPOIS de o sistema ligar os ouvintes do formulário, então
  // ele não seria salvo sozinho.
  const campo = moedas.querySelector('input[name="system.economy.gp"]');
  campo?.addEventListener("change", (ev) => {
    const v = Number(ev.currentTarget.value) || 0;
    if (ator.isOwner) ator.update({ "system.economy.gp": v });
  });
}

function troca(app, elemento) {
  try {
    const raiz = elemento?.querySelectorAll ? elemento : elemento?.[0];
    const ator = app?.actor ?? app?.document;
    if (!raiz?.querySelector || ator?.type !== "character") return;

    poeDanosMortais(raiz, ator);
    poeCreditos(raiz, ator);
  } catch (e) {
    console.warn(`${ID} | cabeçalho não pôde ser ajustado`, e);
  }
}

export function ligarCabecalho() {
  Hooks.on("renderOD2CharacterSheet", troca);
  Hooks.on("renderActorSheet", (app, el) => {
    if (app?.constructor?.name !== "OD2CharacterSheet") troca(app, el);
  });
  console.log(`${ID} | Danos Mortais no PV, e a Economia virou Créditos`);
}
