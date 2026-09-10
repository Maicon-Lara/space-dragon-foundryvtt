/**
 * O cabeçalho da ficha: moedas viram Danos Mortais.
 *
 * ── POR QUE TROCAR ──────────────────────────────────────────────────────────
 *
 * O Old Dragon 2 reserva uma caixa do cabeçalho para peças de ouro, prata e
 * cobre. Nenhuma das três existe no Space Dragon, que usa CRÉDITOS — e a caixa
 * fica ocupando o lugar mais nobre da ficha com um dado que a mesa nunca vai
 * preencher.
 *
 * No lugar entra o que o Space Dragon tem e o Old Dragon 2 não: os DANOS
 * MORTAIS. O personagem não morre em 0 PV, morre num número negativo que sai da
 * T1-3 da Constituição — de −5 com Constituição 1 a −19 com 28–29. No Old
 * Dragon 2 a morte é sempre em −10 fixo, então não há campo para isso.
 *
 * É o tipo de número que decide se o personagem cai ou morre, e ficava só no
 * journal, para consultar no meio do combate.
 *
 * ── O QUE ACONTECE COM O DINHEIRO ───────────────────────────────────────────
 *
 * Não some. Uma das três caixas de moeda vira "Créditos" e continua gravando
 * em `system.economy.gp`, que é campo do próprio sistema — o valor sobrevive a
 * desinstalar o módulo, só volta a se chamar peças de ouro. As outras duas
 * saem.
 *
 * ── COMO ────────────────────────────────────────────────────────────────────
 *
 * Cirurgia no DOM depois do render, como o painel de testes. O template é do
 * sistema e não se toca; se ele mudar, o seletor não acha nada e a ficha segue
 * inteira, com as moedas de volta.
 */

import { FAIXAS, CAMPO_NA_FICHA, COLUNA } from "./dados.js";

const ID = "spacedragon";
const MARCA = "spacedragon-mortais";

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

function troca(app, elemento) {
  try {
    const raiz = elemento?.querySelectorAll ? elemento : elemento?.[0];
    const ator = app?.actor ?? app?.document;
    if (!raiz?.querySelector || ator?.type !== "character") return;

    const caixa = raiz.querySelector(".economy");
    if (!caixa || caixa.classList.contains(MARCA)) return;

    const mortais = danosMortais(ator);
    const con = Number(ator.system?.[CAMPO_NA_FICHA.constituicao]) || 0;
    const creditos = Number(ator.system?.economy?.gp) || 0;

    caixa.classList.add(MARCA);
    const rotulo = caixa.querySelector("label");
    if (rotulo) rotulo.textContent = "Danos Mortais";

    const moedas = caixa.querySelector(".currency");
    if (!moedas) return;

    moedas.innerHTML =
      `<div class="sd-mortais" title="Constituição ${con} — o personagem morre com ${mortais} pontos de vida, pela T1-3">` +
      `<input type="text" value="${mortais}" disabled>` +
      `<div class="label"><label class="text-xs font-bold">PV</label></div>` +
      `</div>` +
      `<div class="sd-creditos" title="Créditos. Gravados no campo de peças de ouro do sistema.">` +
      `<input type="text" name="system.economy.gp" value="${creditos}" data-dtype="Number">` +
      `<div class="label"><label class="text-xs font-bold">CR</label></div>` +
      `</div>`;

    // O campo é criado DEPOIS de o sistema ligar os ouvintes do formulário,
    // então ele não seria salvo sozinho. Grava por conta própria.
    const campo = moedas.querySelector('input[name="system.economy.gp"]');
    campo?.addEventListener("change", (ev) => {
      const v = Number(ev.currentTarget.value) || 0;
      if (ator.isOwner) ator.update({ "system.economy.gp": v });
    });
  } catch (e) {
    console.warn(`${ID} | cabeçalho não pôde ser ajustado`, e);
  }
}

export function ligarCabecalho() {
  Hooks.on("renderOD2CharacterSheet", troca);
  Hooks.on("renderActorSheet", (app, el) => {
    if (app?.constructor?.name !== "OD2CharacterSheet") troca(app, el);
  });
  console.log(`${ID} | moedas do cabeçalho trocadas por Danos Mortais`);
}
