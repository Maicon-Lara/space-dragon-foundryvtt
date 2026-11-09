/**
 * Os golpes fortes do Combate de Convés como efeitos do Qualidade de Vida.
 *
 * Eles aparecem na aba Efeitos da nave e somem quando reparados. São SÓ AVISO,
 * sem modificadores: a conta dos golpes é do disparo do Convés
 * (nave-conves.js), e um −2 também no efeito poderia descontar duas vezes.
 */

import { GOLPES } from "./nave-conves.js";
import { combateConves, golpesComoEfeitosLigado } from "./opcoes.js";

const PREFIXO = "sd-golpe-";

/** A lista de efeitos da nave com os golpes atuais; os outros ficam como estão. */
export function efeitosDosGolpes(efeitos = [], golpes = {}) {
  const outros = efeitos.filter((e) => !String(e?.id ?? "").startsWith(PREFIXO));
  const dosGolpes = GOLPES.filter((g) => g.persiste && golpes?.[g.chave]).map((g) => ({
    id: `${PREFIXO}${g.chave}`,
    name: `Golpe: ${g.rotulo}`,
    icon: "icons/svg/explosion.svg",
    origin: "Space Dragon",
    description: g.efeito,
    modifiers: [],
  }));
  return [...outros, ...dosGolpes];
}

const idsDe = (efeitos) => efeitos.filter((e) => String(e?.id ?? "").startsWith(PREFIXO)).map((e) => e.id).sort().join();

/** Acerta os efeitos da nave com os golpes dela. Devolve true se gravou. */
export async function sincronizarGolpes(ator, golpes, api = globalThis.game?.od2Qdv?.effects) {
  if (!api?.get || !api?.set) return false;
  const atuais = api.get(ator) ?? [];
  const novos = efeitosDosGolpes(atuais, golpes);
  if (idsDe(atuais) === idsDe(novos)) return false;
  await api.set(ator, novos);
  return true;
}

/** Quem mudou os golpes acerta os efeitos: é ele quem tem permissão na nave. */
export function ligarGolpesComoEfeitos() {
  globalThis.Hooks?.on?.("updateActor", (ator, mud, _opcoes, usuario) => {
    if (usuario !== globalThis.game?.user?.id || !combateConves() || !golpesComoEfeitosLigado()) return;
    const cine = mud?.flags?.spacedragon?.nave?.cine;
    if (!cine || !("golpes" in cine)) return;
    const golpes = ator?.flags?.spacedragon?.nave?.cine?.golpes ?? {};
    sincronizarGolpes(ator, golpes).catch((e) => console.warn("spacedragon | efeitos dos golpes", e));
  });
  return true;
}
