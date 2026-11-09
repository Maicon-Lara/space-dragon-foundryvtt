/**
 * Atualiza as armas que já estavam nas fichas antes da 1.38.
 *
 * Recompilar o compêndio não alcança o item do ator, que é uma cópia feita no
 * dia do arrasto. Sem isto a granada segue com "1d10 em 10m²" no dano, o que
 * quebra a rolagem, e a munição antiga não aparece no Qualidade de Vida.
 *
 * Só troca o valor EXATO que o compêndio antigo gravava: a arma que a mesa
 * editou à mão fica como está, e rodar de novo não muda nada.
 */

import { chaveDoNome } from "./automacao-dados.js";
import { t as txt } from "./i18n.js";

const MUNICAO = { de: "ranged", para: "ammunition" };

const CORRECOES = {
  "flecha (20)": { tipo: MUNICAO },
  "dardo para zarabatana (1)": { tipo: MUNICAO },
  "projeteis (30)": { tipo: MUNICAO },
  "projeteis explosivos (10)": { tipo: MUNICAO, dano: { de: "+1d4", para: "" } },
  "missil (1)": { tipo: MUNICAO, dano: { de: "2d8 em 15m²", para: "2d8" } },
  "granada eletrica (1)": { dano: { de: "1d8 em 5m²", para: "1d8" } },
  "granada explosiva (1)": { dano: { de: "1d10 em 10m²", para: "1d10" } },
  "pistola autodestrutiva": { dano: { de: "1d6 · 1d8 em 2m²", para: "1d6" } },
  potencializador: { dano: { de: "+1d4", para: "" } },
};

/** O update deste item, ou null se ele já está certo. */
export function correcaoDaArma(item) {
  if (item?.type !== "weapon") return null;
  const c = CORRECOES[chaveDoNome(item.name)];
  if (!c) return null;
  const mud = {};
  if (c.tipo && item.system?.type === c.tipo.de) mud["system.type"] = c.tipo.para;
  if (c.dano && item.system?.damage === c.dano.de) mud["system.damage"] = c.dano.para;
  return Object.keys(mud).length ? { _id: item.id, ...mud } : null;
}

/** Corrige os itens dos atores do mundo. Só o Mestre ativo grava. */
export async function migrarArmasNoReady() {
  const jogo = globalThis.game;
  if (!jogo?.user?.isGM || (jogo.users?.activeGM && jogo.users.activeGM.id !== jogo.user.id)) return 0;
  let total = 0;
  for (const ator of jogo.actors ?? []) {
    const lista = [...(ator.items ?? [])].map(correcaoDaArma).filter(Boolean);
    if (!lista.length) continue;
    await ator.updateEmbeddedDocuments("Item", lista);
    total += lista.length;
  }
  if (total) globalThis.ui?.notifications?.info?.(txt("spacedragon.aviso.armasMigradas", { n: total }));
  return total;
}
