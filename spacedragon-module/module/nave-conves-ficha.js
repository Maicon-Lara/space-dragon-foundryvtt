/**
 * O painel do Combate de Convés na aba de Tripulação.
 *
 * Reaproveita as trilhas e o duelo do Cinematográfico, e usa a mesma marca de
 * CSS. Puro: o teste desenha o painel em Node.
 */

import { VANTAGENS, tensaoDaRodada } from "./nave-cinematico.js";
import {
  ACOES_CONVES, AUTOMATICAS_CONVES, GOLPES, MARCAS_DA_FUGA, BONUS_MAXIMO_DO_COLAPSO,
} from "./nave-conves.js";
import {
  cineDe, blocoDasTrilhas, blocoDoDuelo, seloDoTripulante, MARCA_CINE, CLASSE_CINE_ACAO,
  CLASSE_CINE_RESOLVER, CLASSE_CINE_ENCERRAR,
} from "./nave-cine-ficha.js";
import { POSTOS } from "./tripulacao.js";
import { t as txt } from "./i18n.js";

export const CLASSE_CONVES_SALVAR = "sd-conves-salvar";

/** No Convés, o vencedor do duelo só escolhe entre estas duas. */
const VANTAGENS_CONVES = { mira: VANTAGENS.mira, cauda: VANTAGENS.cauda };

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

function blocoDosPostos(nave, classePosto, tripulacao) {
  const ocupantes = nave?.postos ?? {};
  return POSTOS.map((posto) => {
    const quem = String(ocupantes[posto.chave] ?? "").trim();
    const acoes = (ACOES_CONVES[posto.chave] ?? []).map((a) => (AUTOMATICAS_CONVES.has(a.chave)
      ? `<li class="posto-acao acao-auto"><button type="button" class="${CLASSE_CINE_ACAO}" data-posto="${posto.chave}" ` +
        `data-acao="${a.chave}" title="${esc(a.efeito)}">${a.rotulo}</button></li>`
      : `<li class="posto-acao acao-texto" title="${esc(a.efeito)}">${a.rotulo}</li>`)).join("");
    return (
      `<div class="posto${quem ? " posto-ocupado" : ""}">` +
      `<div class="posto-cabeca"><strong>${posto.rotulo}</strong> ` +
      `<input type="text" class="${classePosto}" data-posto="${posto.chave}" value="${esc(quem)}" placeholder="${esc(posto.quem)}" ` +
      `title="${esc(txt("spacedragon.nave.tripulacao.dicaPosto"))}">` +
      seloDoTripulante(tripulacao[posto.chave]) +
      `</div><ul class="posto-acoes">${acoes}</ul></div>`
    );
  }).join("");
}

function blocoDosGolpes(cine) {
  const ativos = GOLPES.filter((g) => cine.golpes?.[g.chave]);
  if (!ativos.length) return `<div class="cine-avarias cine-sem">${txt("spacedragon.conves.semGolpes")}</div>`;
  return (
    `<div class="cine-avarias"><strong>${txt("spacedragon.conves.golpes")}</strong><ul>` +
    ativos.map((g) => `<li class="cine-avaria"><strong>${g.rotulo}</strong> — ${esc(g.efeito)} ` +
      `<button type="button" class="${CLASSE_CINE_RESOLVER}" data-camara="${g.chave}">${txt("spacedragon.conves.reparar")}</button></li>`).join("") +
    `</ul></div>`
  );
}

function blocoDaSituacao(cine) {
  const c = cine.colapso;
  return (
    `<div class="cine-rodada">${txt("spacedragon.conves.fuga", { marcas: Number(cine.fuga) || 0, max: MARCAS_DA_FUGA })}</div>` +
    (c
      ? `<div class="cine-avarias conves-colapso"><strong>${c.acabou
        ? txt("spacedragon.conves.colapsoFim")
        : txt("spacedragon.conves.colapso", { restam: c.restam })}</strong> ` +
        `${txt("spacedragon.conves.colapsoBonus", { bonus: Number(c.bonus) || 0, max: BONUS_MAXIMO_DO_COLAPSO })} ` +
        (c.acabou ? "" : `<button type="button" class="${CLASSE_CONVES_SALVAR}">${txt("spacedragon.conves.salvar")}</button>`) +
        `</div>`
      : "")
  );
}

/** O painel inteiro, na aba de Tripulação. */
export function painelConves(ator, nave, { rodada = null, classePosto = "sw-posto-nome", tripulacao = {} } = {}) {
  const cine = cineDe(nave);
  const tensao = rodada ? tensaoDaRodada(rodada) : null;
  return (
    `<section class="${MARCA_CINE}">` +
    `<h3>${txt("spacedragon.conves.titulo")}` +
    (tensao !== null ? ` <span class="cine-tensao">${txt("spacedragon.cine.tensao", { rodada, tensao })}</span>` : "") +
    `</h3>` +
    blocoDasTrilhas(cine, ator?.system?.hp, tripulacao) +
    blocoDoDuelo(cine, rodada, VANTAGENS_CONVES) +
    blocoDosPostos(nave, classePosto, tripulacao) +
    blocoDosGolpes(cine) +
    blocoDaSituacao(cine) +
    `<div class="cine-rodada">` +
    `<span class="cine-fim-auto">${txt("spacedragon.cine.fimAutomatico")}</span> ` +
    `<button type="button" class="${CLASSE_CINE_ENCERRAR}" title="${esc(txt("spacedragon.cine.encerrarDica"))}">${txt("spacedragon.cine.encerrar")}</button>` +
    `</div>` +
    `</section>`
  );
}
