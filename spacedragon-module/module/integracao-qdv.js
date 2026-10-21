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
 */

import { atorUsaFichaSD } from "./ficha.js";
import { ehNave } from "./nave-marca.js";
import { danosMortais } from "./cabecalho.js";
import { t as txt } from "./i18n.js";

const ID = "spacedragon";
export const QDV = "old-dragon-2-qualidade-de-vida";

/** A mensagem é o pedido de agonização do Qualidade de Vida? Devolve o UUID do ator. */
export function uuidDaAgonizacao(dadosDaMensagem) {
  return dadosDaMensagem?.flags?.[QDV]?.agonizeActorUuid ?? null;
}

export function ligarIntegracaoQdV() {
  if (!globalThis.game?.modules?.get?.(QDV)?.active) return false;
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
