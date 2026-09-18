/**
 * Os degraus de nível DENTRO do texto de uma habilidade de classe.
 *
 * ── O PROBLEMA ──────────────────────────────────────────────────────────────
 *
 * O Old Dragon 2 já esconde da ficha o que o personagem não alcançou: a
 * habilidade de nível acima do dele não aparece, e os blocos de 3º, 6º e 10º
 * só aparecem quando ele chega lá. Mas o Space Dragon sobe em 5º, 10º e 20º,
 * que não são esses campos — então os degraus moram no TEXTO da habilidade, e
 * o sistema não tem como saber deles. Um Guardião de 5º lia na ficha o
 * "Mestre Soresu" do 20º nível.
 *
 * ── A REGRA ─────────────────────────────────────────────────────────────────
 *
 * A mesma do sistema: degrau acima do nível do personagem não aparece. Ele
 * volta sozinho quando o nível sobe, porque a ficha redesenha.
 *
 * ── COMO UM DEGRAU É RECONHECIDO ────────────────────────────────────────────
 *
 *   · `data-degrau="10"` em qualquer elemento — a marca explícita, que as
 *     especializações deste módulo usam;
 *   · um item de lista que ABRE com o nível entre crases — `<li><code>10º
 *     </code> …` —, que é como o cofre do Star Wars para Space Dragon escreve
 *     os degraus das Formas, das Sendas e do Eco. Assim o suplemento não
 *     precisa reconstruir nada.
 *
 * Só na ficha do Space Dragon: trocar para a do Old Dragon 2 devolve o sistema
 * puro, como em todo o resto do módulo.
 */

import { ehFichaSD, ligarNaFicha } from "./ficha.js";

const ID = "spacedragon";
export const MARCA_FUTURO = "sd-degrau-futuro";

/** O nível de um degrau, ou null se o elemento não é degrau. */
export function nivelDoDegrau(el) {
  const marcado = el.getAttribute?.("data-degrau");
  if (marcado) return Number(marcado) || null;
  if (el.tagName !== "LI") return null;
  const primeiro = el.firstElementChild;
  if (primeiro?.tagName !== "CODE") return null;
  const m = String(primeiro.textContent ?? "").trim().match(/^(\d+)\s*[º°]/);
  return m ? Number(m[1]) : null;
}

/** Esconde, dentro das habilidades de classe, os degraus acima do nível. */
export function esconderDegraus(app, elemento) {
  try {
    const raiz = elemento?.querySelectorAll ? elemento : elemento?.[0];
    const ator = app?.actor ?? app?.document;
    if (!raiz?.querySelectorAll || ator?.type !== "character") return;
    if (!ehFichaSD(app)) return;
    const nivel = Number(ator.system?.level) || 1;

    for (const seletor of [".class-abilities .item li", ".class-abilities .item p"]) {
      for (const el of raiz.querySelectorAll(seletor)) {
        const n = nivelDoDegrau(el);
        if (n === null) continue;
        if (n > nivel) el.classList.add(MARCA_FUTURO);
        else el.classList.remove(MARCA_FUTURO);
      }
    }
  } catch (e) {
    // Nunca quebrar a ficha do sistema por causa de um degrau.
    console.warn(`${ID} | degraus não puderam ser filtrados`, e);
  }
}

export function ligarDegraus() {
  ligarNaFicha(esconderDegraus);
  console.log(`${ID} | degraus de habilidade acima do nível ficam ocultos`);
}
