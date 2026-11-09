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
export const MARCA_CONVES = "sd-painel-conves";

/** No Convés, o vencedor do duelo só escolhe entre estas duas. */
const VANTAGENS_CONVES = { mira: VANTAGENS.mira, cauda: VANTAGENS.cauda };

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

/** O símbolo de cada posto no cartão. */
const ICONE_DO_POSTO = { leme: "⌁", artilharia: "✦", engenharia: "⚙", sensores: "◉", comando: "◆" };

/**
 * Um cartão por posto. A classe `posto` e o campo `classePosto` são o alvo do
 * arrastar o personagem (nave-pc-ficha.js): não podem sair daqui.
 */
function blocoDosPostos(nave, classePosto, tripulacao) {
  const ocupantes = nave?.postos ?? {};
  return `<div class="conves-postos">` + POSTOS.map((posto) => {
    const quem = String(ocupantes[posto.chave] ?? "").trim();
    const acoes = (ACOES_CONVES[posto.chave] ?? []).map((a) => (AUTOMATICAS_CONVES.has(a.chave)
      ? `<li class="posto-acao acao-auto"><button type="button" class="${CLASSE_CINE_ACAO}" data-posto="${posto.chave}" ` +
        `data-acao="${a.chave}" title="${esc(a.efeito)}">${a.rotulo}</button></li>`
      : `<li class="posto-acao acao-texto" title="${esc(a.efeito)}">${a.rotulo}</li>`)).join("");
    return (
      `<article class="posto conves-cartao${quem ? " posto-ocupado" : ""}">` +
      `<div class="posto-cabeca"><span class="conves-icone">${ICONE_DO_POSTO[posto.chave] ?? ""}</span><strong>${posto.rotulo}</strong>` +
      seloDoTripulante(tripulacao[posto.chave]) + `</div>` +
      `<input type="text" class="${classePosto}" data-posto="${posto.chave}" value="${esc(quem)}" placeholder="${esc(posto.quem)}" ` +
      `title="${esc(txt("spacedragon.nave.tripulacao.dicaPosto"))}">` +
      `<ul class="posto-acoes">${acoes}</ul></article>`
    );
  }).join("") + `</div>`;
}

/** Um cartão de status, com a barra quando há um máximo. */
function cartaoDeStatus(rotulo, valor, { atual = null, max = null, classe = "" } = {}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((atual / max) * 100))) : null;
  return (
    `<div class="conves-status ${classe}"><span class="conves-rotulo">${rotulo}</span>` +
    `<div class="conves-valor">${valor}</div>` +
    (pct === null ? "" : `<div class="conves-barra"><span style="width:${pct}%"></span></div>`) +
    `</div>`
  );
}

/** O que importa no meio do combate, sem campos. */
function blocoDoResumo(cine, hp, rodada) {
  const casco = Number(hp?.value) || 0;
  const max = Number(hp?.max) || 0;
  const fuga = Number(cine.fuga) || 0;
  return (
    `<div class="conves-resumo">` +
    cartaoDeStatus(txt("spacedragon.cine.escudo"), `<strong>${cine.escudo.atual}</strong> / ${cine.escudo.max}`, { atual: cine.escudo.atual, max: cine.escudo.max, classe: "azul" }) +
    cartaoDeStatus(txt("spacedragon.cine.casco"), `<strong>${casco}</strong> / ${max}`, { atual: casco, max, classe: "ambar" }) +
    cartaoDeStatus(txt("spacedragon.conves.tensao"), rodada ? `<strong>+${tensaoDaRodada(rodada)}</strong>` : "—") +
    cartaoDeStatus(txt("spacedragon.conves.fugaRotulo"), `<strong>${fuga} de ${MARCAS_DA_FUGA}</strong>`, { atual: fuga, max: MARCAS_DA_FUGA, classe: "verde" }) +
    `</div>`
  );
}

/**
 * A configuração da nave fica recolhida; aberta só enquanto a escala ainda não
 * foi aplicada, que é quando ela é o próximo passo.
 */
function blocoDosAjustes(cine, hp, tripulacao) {
  return (
    `<details class="conves-ajustes"${cine.pvLivro ? "" : " open"}>` +
    `<summary>${txt("spacedragon.conves.ajustes")}</summary>` +
    blocoDasTrilhas(cine, hp, tripulacao) +
    `</details>`
  );
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
  return (
    `<section class="${MARCA_CINE} ${MARCA_CONVES}">` +
    `<h3>${txt("spacedragon.conves.titulo")}</h3>` +
    blocoDoResumo(cine, ator?.system?.hp, rodada) +
    blocoDosAjustes(cine, ator?.system?.hp, tripulacao) +
    blocoDoDuelo(cine, rodada, VANTAGENS_CONVES) +
    blocoDosPostos(nave, classePosto, tripulacao) +
    blocoDosGolpes(cine) +
    blocoDaSituacao(cine) +
    `<div class="cine-rodada">` +
    `<span class="cine-fim-auto">${txt("spacedragon.conves.fimAutomatico")}</span> ` +
    `<button type="button" class="${CLASSE_CINE_ENCERRAR}" title="${esc(txt("spacedragon.cine.encerrarDica"))}">${txt("spacedragon.cine.encerrar")}</button>` +
    `</div>` +
    `</section>`
  );
}
