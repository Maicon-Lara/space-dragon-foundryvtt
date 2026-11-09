/**
 * "Meu posto": as ações do posto na ficha de quem está nele.
 *
 * Só aparece com o Combate de Convés ligado e para o personagem que ocupa um
 * posto de nave. O painel chama as mesmas ações da Ficha de Nave, e por isso
 * o jogador precisa ser dono da nave para que elas gravem.
 */

import { ACOES_CONVES, AUTOMATICAS_CONVES, GOLPE } from "./nave-conves.js";
import { tripulanteDoPosto, acharAtorNoMundo } from "./nave-tripulante.js";
import { naveDe, flagDeNave, updateDaNave } from "./nave-pc-dados.js";
import { cineDe } from "./nave-cine-ficha.js";
import { armaDoEquipamento } from "./nave-disparo.js";
import { ehNave } from "./nave-marca.js";
import { POSTOS } from "./tripulacao.js";
import { acaoDoPosto, dispararCine } from "./nave-cine-acoes.js";
import { combateConves, meuPostoLigado } from "./opcoes.js";
import { ligarNaFicha } from "./ficha.js";
import { t as txt } from "./i18n.js";

const ID = "spacedragon";
export const MARCA_MEU_POSTO = "sd-meu-posto";

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

/** Os postos que `ator` ocupa: [{ nave, posto }]. */
export function postosDoAtor(ator, naves, acharAtor = acharAtorNoMundo) {
  const saida = [];
  for (const nave of naves ?? []) {
    if (!ehNave(nave)) continue;
    const dados = naveDe(nave, ID);
    for (const posto of Object.keys(ACOES_CONVES)) {
      if (tripulanteDoPosto(dados, posto, acharAtor)?.id === ator?.id && ator?.id) saida.push({ nave, posto });
    }
  }
  return saida;
}

/** As armas de nave instaladas: [{ item, chave, arma }]. */
function armasDaNave(nave) {
  return [...(nave?.items ?? [])].flatMap((item) => {
    const chave = flagDeNave(item, "equipamentoDeNave", ID)?.chave ?? null;
    const arma = chave ? armaDoEquipamento(chave) : null;
    return arma ? [{ item, chave, arma }] : [];
  });
}

const botao = (rotulo, dica, dados) =>
  `<button type="button" ${Object.entries(dados).map(([k, v]) => `data-${k}="${esc(v)}"`).join(" ")} title="${esc(dica)}">${esc(rotulo)}</button>`;

/** Os botões de um posto. */
function botoesDoPosto(nave, posto) {
  const partes = [];
  if (posto === "artilharia") {
    for (const { item } of armasDaNave(nave)) partes.push(botao(txt("spacedragon.meuPosto.disparar", { arma: item.name }), "", { disparar: item.id }));
  }
  if (posto === "engenharia") {
    const golpes = cineDe(naveDe(nave, ID)).golpes;
    for (const chave of Object.keys(golpes)) {
      if (GOLPE[chave]) partes.push(botao(txt("spacedragon.meuPosto.reparar", { golpe: GOLPE[chave].rotulo }), GOLPE[chave].efeito, { reparar: chave }));
    }
  }
  for (const a of ACOES_CONVES[posto] ?? []) {
    if (AUTOMATICAS_CONVES.has(a.chave)) partes.push(botao(a.rotulo, a.efeito, { acao: a.chave, posto }));
  }
  return partes.join(" ");
}

/** O painel, um bloco por posto ocupado. */
export function painelMeuPosto(lista) {
  return (
    `<section class="${MARCA_MEU_POSTO}">` +
    lista.map(({ nave, posto }) => {
      const rotulo = POSTOS.find((p) => p.chave === posto)?.rotulo ?? posto;
      return (
        `<div class="meu-posto" data-nave="${esc(nave.uuid ?? nave.id)}">` +
        `<strong>${txt("spacedragon.meuPosto.titulo", { posto: esc(rotulo), nave: esc(nave.name) })}</strong> ` +
        (nave.isOwner ? botoesDoPosto(nave, posto) : `<em>${txt("spacedragon.meuPosto.semPermissao")}</em>`) +
        `</div>`
      );
    }).join("") +
    `</section>`
  );
}

function contextoDa(nave) {
  return {
    ator: nave,
    token: null,
    editavel: () => nave.isOwner === true,
    gravar: async (antes, depois) => {
      const mud = updateDaNave(antes, depois, ID);
      if (mud) await nave.update(mud);
    },
  };
}

/** O clique num botão do painel. */
export async function acaoDoBotao(dados, nave) {
  const ctx = contextoDa(nave);
  if (dados.disparar) {
    const achada = armasDaNave(nave).find((a) => a.item.id === dados.disparar);
    return achada ? dispararCine(ctx, achada) : null;
  }
  if (dados.reparar) return acaoDoPosto(ctx, "resolver", { camara: dados.reparar });
  if (dados.acao) return acaoDoPosto(ctx, dados.acao, { posto: dados.posto });
  return null;
}

/** Desenha o painel na aba de ataques da ficha de personagem. */
export function ligarMeuPosto() {
  ligarNaFicha((app, el) => {
    if (!combateConves() || !meuPostoLigado() || ehNave(app?.actor)) return;
    const raiz = el?.querySelector ? el : el?.[0];
    const aba = raiz?.querySelector?.(".character-tab-attacks");
    if (!aba || aba.querySelector(`.${MARCA_MEU_POSTO}`)) return;
    const lista = postosDoAtor(app.actor, globalThis.game?.actors);
    if (!lista.length) return;
    aba.insertAdjacentHTML("afterbegin", painelMeuPosto(lista));
    aba.querySelector(`.${MARCA_MEU_POSTO}`).addEventListener("click", (ev) => {
      const b = ev.target?.closest?.("button");
      const bloco = b?.closest?.(".meu-posto");
      if (!bloco) return;
      ev.preventDefault();
      ev.stopPropagation();
      const nave = lista.find((x) => (x.nave.uuid ?? x.nave.id) === bloco.dataset.nave)?.nave;
      if (!nave) return;
      acaoDoBotao({ ...b.dataset }, nave)
        .then(() => app.render(false))
        .catch((e) => console.error(`${ID} | Meu posto`, e));
    });
  });
  return true;
}
