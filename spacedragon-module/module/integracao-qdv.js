/**
 * A convivência com o "Old Dragon 2: Qualidade de Vida".
 *
 * O Qualidade de Vida é feito para o Old Dragon 2, e em três pontos a regra do
 * Space Dragon é outra. O que dá para acertar do lado de cá está aqui; o resto
 * são opções dele que a mesa desliga (ver o journal de regras e o README).
 *
 *   · AGONIZAÇÃO: a 0 PV ele pede, a cada rodada, uma JPC/JPS no sentido do
 *     OD2 (d20 ≤ total). No Space Dragon, 0 PV é inconsciente e ESTÁVEL; quem
 *     corre risco é quem está abaixo de 0, com JPF pela regra do livro. Na ficha
 *     do Space Dragon, o pedido dele é trocado por esse lembrete.
 *   · A JP com efeitos: ver bonusExterno em jp.js.
 *   · Os botões de tesouro dele na Ficha de Ameaça: escondidos por CSS, porque
 *     leem a notação de tesouro do OD2 e o campo guarda as letras O, D, U.
 *   · O FIM DE COMBATE: ele soma XP de monstros e divide entre personagens, e
 *     a nave é personagem. As naves inimigas entram nos derrotados, com a XP
 *     da casa (nave-xp.js), e quem recebe é a tripulação, nunca uma nave.
 */

import { atorUsaFichaSD } from "./ficha.js";
import { ehNave } from "./nave-marca.js";
import { danosMortais } from "./cabecalho.js";
import { t as txt } from "./i18n.js";
import { retratoDoCombate, premioComNaves, cartaoComNaves } from "./nave-xp.js";

const ID = "spacedragon";
export const QDV = "old-dragon-2-qualidade-de-vida";

/** A mensagem é o pedido de agonização do Qualidade de Vida? Devolve o UUID do ator. */
export function uuidDaAgonizacao(dadosDaMensagem) {
  return dadosDaMensagem?.flags?.[QDV]?.agonizeActorUuid ?? null;
}

/** Os personagens dos jogadores donos de uma nave, para quando ninguém está nos postos. */
function personagensDosDonos(nave) {
  return [...(globalThis.game?.users ?? [])]
    .filter((u) => !u.isGM && nave?.testUserPermission?.(u, "OWNER"))
    .map((u) => u.character)
    .filter(Boolean);
}

/**
 * O retrato do último combate que acabou com nave nele.
 *
 * O Qualidade de Vida monta o cartão no `deleteCombat` e o cria depois de
 * alguns `await`; o nosso `deleteCombat` roda na mesma passada de ganchos,
 * então o retrato está pronto antes de o cartão chegar ao `preCreateChatMessage`.
 */
let ultimoRetrato = null;

function ligarXPDeNaves() {
  globalThis.Hooks?.on?.("deleteCombat", (combat) => {
    try {
      const combatentes = combat?.combatants?.contents ?? [...(combat?.combatants ?? [])];
      ultimoRetrato = combatentes.some((c) => ehNave(c?.actor))
        ? retratoDoCombate(combatentes, {
            achar: (nome) => (nome ? globalThis.game?.actors?.getName?.(nome) ?? null : null),
            personagensDosDonos,
          })
        : null;
    } catch (e) {
      ultimoRetrato = null;
      console.warn(`${ID} | não foi possível ler as naves do combate`, e);
    }
  });

  globalThis.Hooks?.on?.("preCreateChatMessage", (mensagem, dados) => {
    const premio = dados?.flags?.[QDV]?.xpAward;
    if (!premio || !ultimoRetrato) return true;
    const retrato = ultimoRetrato;
    ultimoRetrato = null;
    try {
      const novo = premioComNaves(premio, retrato, (id) => ehNave(globalThis.game?.actors?.get?.(id)));
      const content = cartaoComNaves(dados.content, novo, retrato.inimigas, (premio.creatures ?? []).length > 0);
      mensagem.updateSource({ content, flags: { [QDV]: { xpAward: novo } } });
    } catch (e) {
      console.warn(`${ID} | não foi possível pôr as naves no fim de combate`, e);
    }
    return true;
  });
}

export function ligarIntegracaoQdV() {
  if (!globalThis.game?.modules?.get?.(QDV)?.active) return false;
  ligarXPDeNaves();
  globalThis.Hooks?.on?.("preCreateChatMessage", (mensagem, dados) => {
    try {
      const uuid = uuidDaAgonizacao(dados) ?? uuidDaAgonizacao(mensagem);
      if (!uuid) return true;
      const ator = globalThis.fromUuidSync?.(uuid);
      if (!ator || ehNave(ator) || !atorUsaFichaSD(ator)) return true;
      // a regra do Space Dragon no lugar do pedido do OD2
      const nome = String(ator.name ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;");
      const mortais = danosMortais(ator);
      globalThis.ChatMessage?.create?.({
        speaker: globalThis.ChatMessage.getSpeaker?.({ actor: ator }),
        whisper: dados?.whisper ?? mensagem?.whisper ?? [],
        content: `<div class="sd-teste"><p>${txt("spacedragon.qdv.zeroPV", { nome, mortais: mortais ?? "—" })}</p></div>`,
      });
      return false;
    } catch (e) {
      console.warn(`${ID} | não foi possível trocar a agonização do Qualidade de Vida`, e);
      return true;
    }
  });
  console.log(`${ID} | convivência com o Old Dragon 2: Qualidade de Vida ligada`);
  return true;
}
