/**
 * O tamanho do token da nave no grid — REGRA DA CASA.
 *
 * O livro dá quatro tamanhos de nave (T10-1) e nenhuma medida de mapa. A mesa
 * joga o combate espacial numa cena de 10 m por quadrado e adotou:
 *
 *   Pequena 1×1 · Média 2×2 · Gigantesca 4×4 · Colossal 6×6
 *
 * ── QUANDO O TAMANHO É APLICADO ─────────────────────────────────────────────
 *
 *   · ao criar a nave pelo botão (o protótipo já nasce no tamanho);
 *   · ao arrastar um tipo de nave para o ator (a nave muda de tamanho junto);
 *   · UMA VEZ nas naves que já existiam, no `ready` do Mestre.
 *
 * A flag `nave.tokenLado` marca que o tamanho foi aplicado. Com ela, o `ready`
 * não mexe mais na nave: se o Mestre redimensionar um token à mão (a nave-mãe
 * que precisa caber no mapa), a próxima sessão não desfaz.
 */

import { naveDe, tamanhoDaNave, FLAG } from "./nave-pc-dados.js";
import { ehNave } from "./nave-marca.js";

const ID = "spacedragon";

/** Quantos quadrados de lado o token tem, por tamanho da T10-1. */
export const LADO_POR_TAMANHO = { Pequena: 1, "Média": 2, Gigantesca: 4, Colossal: 6 };

/** O lado do token desta nave, ou null se o tamanho não é conhecido. */
export function ladoDoToken(ator) {
  const nave = naveDe(ator, ID);
  const tamanho = tamanhoDaNave(nave, ator?.system?.race?.name ?? "");
  return LADO_POR_TAMANHO[tamanho] ?? null;
}

/**
 * O update do ator: protótipo no tamanho e a marca de aplicado. Null quando
 * não há o que mudar — tamanho desconhecido, ou já está assim e marcado.
 */
export function updateDoToken(ator) {
  const lado = ladoDoToken(ator);
  if (!lado) return null;
  const p = ator?.prototypeToken ?? {};
  const marcado = naveDe(ator, ID)?.tokenLado === lado;
  if (p.width === lado && p.height === lado && marcado) return null;
  return {
    "prototypeToken.width": lado,
    "prototypeToken.height": lado,
    [`flags.${ID}.${FLAG}.tokenLado`]: lado,
  };
}

/** Os tokens desta nave já postos nas cenas, que estão em outro tamanho. */
export function tokensForaDoTamanho(ator, cenas = [], lado = ladoDoToken(ator)) {
  if (!lado) return [];
  const saida = [];
  for (const cena of cenas) {
    const ids = [...(cena?.tokens ?? [])]
      .filter((t) => t?.actorId === ator?.id && (t.width !== lado || t.height !== lado))
      .map((t) => t.id);
    if (ids.length) saida.push({ cena, ids });
  }
  return saida;
}

/** Aplica o tamanho no protótipo e nos tokens já postos. Devolve o lado, ou null. */
export async function ajustarToken(ator) {
  if (!ator || !ehNave(ator)) return null;
  const lado = ladoDoToken(ator);
  if (!lado) return null;
  const update = updateDoToken(ator);
  if (update) await ator.update(update);
  for (const { cena, ids } of tokensForaDoTamanho(ator, [...(globalThis.game?.scenes ?? [])], lado)) {
    await cena.updateEmbeddedDocuments("Token", ids.map((_id) => ({ _id, width: lado, height: lado })));
  }
  return lado;
}

/** No `ready` do Mestre: as naves que nunca tiveram o tamanho aplicado. */
export async function ajustarTokensNoReady() {
  if (!globalThis.game?.user?.isGM) return 0;
  let feitas = 0;
  for (const ator of [...(globalThis.game?.actors ?? [])]) {
    try {
      if (!ehNave(ator) || naveDe(ator, ID)?.tokenLado) continue;
      if (await ajustarToken(ator)) feitas += 1;
    } catch (e) {
      console.warn(`${ID} | não pude ajustar o token de ${ator?.name}`, e);
    }
  }
  if (feitas) console.log(`${ID} | tamanho do token aplicado em ${feitas} nave(s)`);
  return feitas;
}
