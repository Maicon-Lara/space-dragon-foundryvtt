/**
 * O botão de iniciativa do Old Dragon 2, na ficha de personagem e na de nave.
 *
 * ── POR QUE UM BOTÃO, SE O SISTEMA JÁ TESTA SOZINHO ─────────────────────────
 *
 * A iniciativa "padrão" do sistema só acontece no rastreador: ao começar o
 * combate, ele rola 1d20 por combatente e compara com o maior entre Destreza
 * e Sabedoria. O jogador não rola nada, e quem entra com o combate andando é
 * rolado em silêncio. A mesa pediu o gesto de volta: cada um rola o seu, da
 * própria ficha, e vê o resultado no chat.
 *
 * ── A REGRA É A DO SISTEMA, E NÃO UMA CÓPIA DELA ────────────────────────────
 *
 *   · Padrão: 1d20 ≤ maior entre Destreza e Sabedoria. Sucesso age antes dos
 *     PNJs (99 no rastreador), falha age depois (33); os PNJs ficam no 66.
 *     Vale o combate inteiro.
 *   · Individual: 1d12, maior primeiro, e a mesa rola de novo quando quiser.
 *
 * Os números 99/33/66 são lidos do próprio sistema quando ele os expõe
 * (`game.olddragon2e.InitiativeModule.INITIATIVE`); os daqui são só a reserva.
 *
 * ── O PONTO DELICADO: ANTES OU DEPOIS DE O COMBATE COMEÇAR ──────────────────
 *
 * Antes da 1ª rodada, o sistema lê o valor gravado em cada combatente como o
 * d20 JÁ ROLADO e converte em 99/33 ao começar. Então o botão grava o d20 cru
 * — gravar 99 ali faria o sistema comparar 99 com a Destreza e dar falha.
 * Depois da 1ª rodada o sistema não converte mais nada, e o botão grava o
 * 99/33 direto, como o sistema faz com quem entra no meio.
 *
 * ── A NAVE ──────────────────────────────────────────────────────────────────
 *
 * A nave testa com quem está no Leme (nave-iniciativa.js). O alvo do teste é
 * o do piloto, e antes da 1ª rodada o gancho de lá já põe os atributos dele
 * na nave na hora da conversão.
 *
 * ── QUANDO O BOTÃO NÃO APARECE ──────────────────────────────────────────────
 *
 * Com a Ordem de Ação (T7-2) ligada: lá a iniciativa é a ação declarada, e
 * um segundo botão gravando outro número no rastreador brigaria com ela.
 */

import { ehNave } from "./nave-marca.js";
import { atributosDaIniciativa, nomeDoPiloto } from "./nave-iniciativa.js";
import { regraDaOrdemLigada } from "./ordem-ficha.js";
import { ligarNaFicha } from "./ficha.js";
import { t as txt } from "./i18n.js";

const ID = "spacedragon";
export const MARCA_INICIATIVA = "sd-iniciativa-od2";

/** A reserva, igual a rolls/initiative.js do sistema 2.6. */
export const INICIATIVA_PADRAO = { SUCCESS: 99, FAILURE: 33, NPC: 66 };

/** Os números do sistema, se ele os expõe; senão a reserva. */
function numerosDoSistema() {
  return globalThis.game?.olddragon2e?.InitiativeModule?.INITIATIVE ?? INICIATIVA_PADRAO;
}

/** "standard" ou "individual", como o sistema grava. Fora do Foundry: padrão. */
export function modoDeIniciativa() {
  try {
    return globalThis.game?.settings?.get?.("olddragon2e", "initiativeType") === "individual"
      ? "individual"
      : "standard";
  } catch {
    return "standard";
  }
}

/**
 * Contra que número o ator testa: o maior entre Destreza e Sabedoria, como o
 * sistema. Na nave, os do piloto (ou 10, o piloto mediano).
 *
 * Devolve `alvo: null` quando falta atributo — o sistema também recusa, e
 * avisa "atributos inválidos".
 */
export function alvoDaIniciativa(ator, acharAtor = () => null) {
  if (ehNave(ator)) {
    const nome = nomeDoPiloto(ator);
    const a = atributosDaIniciativa(nome ? acharAtor(nome) : null);
    return { alvo: Math.max(a.destreza, a.sabedoria), piloto: a.piloto };
  }
  const des = Number(ator?.system?.destreza) || 0;
  const sab = Number(ator?.system?.sabedoria) || 0;
  if (!des || !sab) return { alvo: null, piloto: null };
  return { alvo: Math.max(des, sab), piloto: null };
}

/**
 * O que gravar no rastreador para um d20 já rolado (modo padrão).
 *
 * `comecou` é se o combate já passou da rodada 0: antes disso grava-se o d20
 * cru, e o sistema converte ao começar (ver o topo).
 */
export function valorPadrao(rolado, alvo, comecou, numeros = INICIATIVA_PADRAO) {
  const sucesso = alvo != null && rolado <= alvo;
  if (!comecou) return { valor: rolado, sucesso };
  return { valor: sucesso ? numeros.SUCCESS : numeros.FAILURE, sucesso };
}

/**
 * Pode rolar? No modo padrão o teste vale o combate inteiro: quem já tem
 * valor não rola de novo, a não ser o Mestre. No individual, rola-se sempre.
 */
export function podeRolar({ modo, jaTem, mestre }) {
  if (modo === "individual") return true;
  return !jaTem || mestre;
}

/* ── O GESTO, NO FOUNDRY ───────────────────────────────────────────────────── */

const acharPorNome = (nome) => globalThis.game?.actors?.getName?.(nome) ?? null;

// o nome do piloto é texto digitado na ficha, e vai para o HTML do chat
const escapa = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Os combatentes deste ator no combate ativo (token ligado ou não). */
function combatentesDoAtor(combate, ator) {
  return (combate?.combatants?.contents ?? []).filter((c) => c.actor?.id === ator.id || c.actorId === ator.id);
}

/**
 * Rola a iniciativa do ator pela regra do OD2 e grava no rastreador.
 * Sem combate ativo, ou sem o ator nele, avisa e não rola.
 */
export async function rolarIniciativaOD2(ator) {
  const avisa = (texto) => globalThis.ui?.notifications?.warn?.(texto);
  const combate = globalThis.game?.combat;
  if (!combate) return avisa(txt("spacedragon.iniciativa.semCombate"));
  const combatentes = combatentesDoAtor(combate, ator);
  if (!combatentes.length) return avisa(txt("spacedragon.iniciativa.foraDoCombate", { nome: ator.name }));

  const modo = modoDeIniciativa();
  const mestre = Boolean(globalThis.game?.user?.isGM);
  const jaTem = combatentes.every((c) => c.initiative !== null && c.initiative !== undefined);
  if (!podeRolar({ modo, jaTem, mestre })) return avisa(txt("spacedragon.iniciativa.jaRolou"));

  const falante = globalThis.ChatMessage?.getSpeaker?.({ actor: ator });

  // individual: o dado do sistema (1d12), maior primeiro
  if (modo === "individual") {
    const formula = globalThis.CONFIG?.Combat?.initiative?.formula || "1d12";
    const rolagem = await new globalThis.Roll(formula).evaluate();
    await rolagem.toMessage({ speaker: falante, flavor: txt("spacedragon.iniciativa.individual") });
    for (const c of combatentes) await combate.setInitiative(c.id, rolagem.total);
    return { modo, valor: rolagem.total };
  }

  const { alvo, piloto } = alvoDaIniciativa(ator, acharPorNome);
  if (alvo == null) return avisa(txt("spacedragon.iniciativa.semAtributos", { nome: ator.name }));

  const rolagem = await new globalThis.Roll("1d20").evaluate();
  const comecou = (combate.round ?? 0) >= 1;
  const { valor, sucesso } = valorPadrao(rolagem.total, alvo, comecou, numerosDoSistema());

  const linhas = [
    piloto
      ? txt("spacedragon.iniciativa.testePiloto", { alvo, piloto: escapa(piloto) })
      : txt("spacedragon.iniciativa.teste", { alvo }),
    sucesso ? txt("spacedragon.iniciativa.sucesso") : txt("spacedragon.iniciativa.falha"),
  ];
  await rolagem.toMessage({ speaker: falante, flavor: linhas.map((l) => `<p>${l}</p>`).join("") });

  for (const c of combatentes) {
    await combate.setInitiative(c.id, valor);
    // a mesma marca que o sistema deixa, para o relatório dele ler igual
    await c.setFlag?.("world", "old-dragon-2e-standard-initiative", { success: sucesso, value: rolagem.total, attribute: alvo });
  }
  if (comecou) await combate.setupTurns?.();
  return { modo, valor, sucesso, alvo };
}

/* ── O BOTÃO ───────────────────────────────────────────────────────────────── */

/** O HTML do botão, com a regra escrita ao lado para quem nunca viu. */
export function botaoDeIniciativa(ator, modo = modoDeIniciativa()) {
  const dica = modo === "individual"
    ? txt("spacedragon.iniciativa.dicaIndividual")
    : ehNave(ator)
      ? txt("spacedragon.iniciativa.dicaNave")
      : txt("spacedragon.iniciativa.dicaPadrao");
  return (
    `<div class="${MARCA_INICIATIVA}">` +
    `<button type="button" class="sd-iniciativa-rolar">${txt("spacedragon.iniciativa.botao")}</button>` +
    `<span class="sd-iniciativa-dica">${dica}</span>` +
    `</div>`
  );
}

/** A aba de ataques, onde ficam os painéis do módulo. */
function abaDeAtaques(raiz) {
  return raiz.querySelector(".character-tab-attacks") ??
    raiz.querySelector('[data-tab="attacks"]:not(nav [data-tab="attacks"])');
}

export function ligarIniciativaNaFicha() {
  const desenha = (app, elemento) => {
    try {
      const raiz = elemento instanceof HTMLElement ? elemento : elemento?.[0];
      const ator = app?.actor ?? app?.document;
      // só quem o sistema testa: personagem e ajudante. A nave é personagem.
      if (!raiz || !["character", "retainer"].includes(ator?.type)) return;
      raiz.querySelectorAll(`.${MARCA_INICIATIVA}`).forEach((n) => n.remove());
      if (regraDaOrdemLigada()) return;
      const aba = abaDeAtaques(raiz);
      if (!aba) return;
      aba.insertAdjacentHTML("afterbegin", botaoDeIniciativa(ator));
      aba.querySelector(`.${MARCA_INICIATIVA} .sd-iniciativa-rolar`)
        ?.addEventListener("click", (ev) => {
          ev.preventDefault();
          rolarIniciativaOD2(ator);
        });
    } catch (e) {
      // nunca quebrar a ficha do sistema por causa de um botão do módulo
      console.warn(`${ID} | botão de iniciativa não pôde ser desenhado`, e);
    }
  };
  ligarNaFicha(desenha);
}
