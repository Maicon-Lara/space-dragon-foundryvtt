/**
 * As mutações na ficha: o que se vê e o ataque à distância.
 *
 * As contas moram em mutacoes.js e são lidas por quem calcula — modificador
 * (atributos.js), CP (atributos.js), JP (jp.js), dado de vida (vitalidade.js),
 * testes de porcentagem (painel.js, testes.js). Este arquivo faz o resto:
 *
 *   · o selo "+3" ao lado do atributo, com o valor efetivo na dica, para o
 *     jogador entender por que o modificador não bate com o número do campo;
 *   · um resumo no fim da aba de Espécie: o que entrou sozinho e o que fica
 *     com a mesa, com o aviso da trava do livro (números iguais na T2-1);
 *   · o envelope da BA à distância, que é a única conta da Visão.
 *
 * Só na ficha do Space Dragon, como todo o resto do módulo.
 */

import { CAMPO_NA_FICHA, NOME_ATRIBUTO } from "./dados.js";
import { efeitosDe, atributoEfetivo, mesmoNumero, mutacoesDe } from "./mutacoes.js";
import { ehFichaSD, ligarNaFicha, atorUsaFichaSD } from "./ficha.js";
import { envolver, MODELO_PERSONAGEM } from "./envelope.js";
import { t as txt } from "./i18n.js";

const ID = "spacedragon";
const MARCA_SELO = "sd-mutacao-ajuste";
const MARCA_RESUMO = "sd-mutacao-resumo";

const escapa = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const sinal = (n) => (n > 0 ? `+${n}` : `−${Math.abs(n)}`);
const ROTULO_JP = { jpd: "JPR", jpc: "JPF", jps: "JPM" };

/** As linhas do que entrou sozinho, em português de mesa. */
export function linhasAplicadas(ator) {
  const ef = efeitosDe(ator);
  const linhas = [];
  for (const [a, n] of Object.entries(ef.atributo)) {
    if (n) linhas.push(`${NOME_ATRIBUTO[a] ?? a} ${sinal(n)}`);
  }
  for (const [a, teto] of Object.entries(ef.teto)) {
    linhas.push(txt("spacedragon.mutacao.teto", { atributo: NOME_ATRIBUTO[a] ?? a, teto }));
  }
  for (const [j, n] of Object.entries(ef.jp)) if (n) linhas.push(`${ROTULO_JP[j]} ${sinal(n)}`);
  if (ef.cp) linhas.push(`CP ${sinal(ef.cp)}`);
  if (ef.bad) linhas.push(txt("spacedragon.mutacao.distancia", { ajuste: sinal(ef.bad) }));
  if (ef.dv > 0) linhas.push(txt("spacedragon.mutacao.dvSobe"));
  if (ef.dv < 0) linhas.push(txt("spacedragon.mutacao.dvDesce"));
  return linhas;
}

function desenha(app, elemento) {
  try {
    const raiz = elemento?.querySelectorAll ? elemento : elemento?.[0];
    const ator = app?.actor ?? app?.document;
    if (!raiz?.querySelector || ator?.type !== "character" || !ehFichaSD(app)) return;

    raiz.querySelectorAll(`.${MARCA_SELO}, .${MARCA_RESUMO}`).forEach((n) => n.remove());
    if (!mutacoesDe(ator).length) return;

    // ── O selo ao lado de cada atributo ajustado ──
    const ef = efeitosDe(ator);
    for (const a of new Set([...Object.keys(ef.atributo), ...Object.keys(ef.teto)])) {
      const campo = CAMPO_NA_FICHA[a];
      const input = raiz.querySelector(`input[name="system.${campo}"]`);
      if (!input) continue;
      const cru = Number(input.value) || 0;
      const efetivo = atributoEfetivo(ator, a, cru);
      if (efetivo === cru) continue;
      const dica = txt("spacedragon.mutacao.selo", { atributo: NOME_ATRIBUTO[a] ?? a, valor: efetivo });
      input.insertAdjacentHTML(
        "afterend",
        `<span class="${MARCA_SELO}" title="${escapa(dica)}">${escapa(sinal(efetivo - cru))}</span>`
      );
    }

    // ── O resumo na aba de Espécie ──
    const aba = raiz.querySelector(".character-tab-race .race-abilities") ?? raiz.querySelector(".character-tab-race");
    if (!aba) return;
    const aplicadas = linhasAplicadas(ator);
    const repetido = mesmoNumero(ator);
    const html =
      `<section class="${MARCA_RESUMO}">` +
      `<strong>${escapa(txt("spacedragon.mutacao.titulo"))}</strong>` +
      (repetido
        ? `<p class="sd-mutacao-alerta">${escapa(txt("spacedragon.mutacao.mesmoNumero", { numero: Number(repetido) }))}</p>`
        : "") +
      (aplicadas.length
        ? `<p><em>${escapa(txt("spacedragon.mutacao.aplicado"))}</em> ${escapa(aplicadas.join(" · "))}</p>`
        : "") +
      (ef.mesa.length
        ? `<p><em>${escapa(txt("spacedragon.mutacao.mesa"))}</em></p><ul>` +
          ef.mesa.map((m) => `<li><strong>${escapa(m.nome)}</strong>: ${escapa(m.texto)}</li>`).join("") +
          `</ul>`
        : "") +
      `</section>`;
    aba.insertAdjacentHTML("beforeend", html);
  } catch (e) {
    console.warn(`${ID} | não foi possível desenhar o resumo das mutações`, e);
  }
}

let badEnvolvido = false;

/**
 * A BA de ataque à distância, para a Visão ampliada ou diminuída. Só se o
 * sistema expõe `bad` como getter no modelo do personagem; se não, o resumo
 * já diz o ajuste e a mesa soma.
 */
export function aplicarMutacoesNaBA() {
  const proto = CONFIG.Actor?.dataModels?.character?.prototype;
  if (badEnvolvido || !Object.getOwnPropertyDescriptor(proto ?? {}, "bad")?.get) return false;
  badEnvolvido = envolver(`${MODELO_PERSONAGEM}.bad`, function (wrapped) {
    const base = wrapped();
    if (!atorUsaFichaSD(this.parent)) return base;
    return base + efeitosDe(this.parent).bad;
  });
  return badEnvolvido;
}

export function ligarMutacoes() {
  aplicarMutacoesNaBA();
  ligarNaFicha(desenha);
}
