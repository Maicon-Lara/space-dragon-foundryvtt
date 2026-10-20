/**
 * A 10ª Grandeza cabe na ficha.
 *
 * ── O PROBLEMA ──────────────────────────────────────────────────────────────
 *
 * A aba de Magias do Old Dragon 2 monta a grade de círculos de 1 a 9, e
 * distribui cada magia no seu. O que não couber cai num fallback:
 *
 *     if (circle && spellByCircle[circle]) spellByCircle[circle].spells.push(spell);
 *     else if (spellByCircle[1]) spellByCircle[1].spells.push(spell);
 *
 * O Space Dragon tem DEZ grandezas. Os quatro poderes de 10ª — entre eles
 * "Morte cerebral" e "Universo mental" — cairiam calados no meio dos poderes de
 * 1ª Grandeza. Não é erro visível: é um poder devastador listado como o mais
 * fraco, e ninguém percebe até a mesa.
 *
 * ── A EMENDA ────────────────────────────────────────────────────────────────
 *
 * Envolvemos o `getData` da ficha (pelo libWrapper): depois que o sistema monta os dados,
 * refazemos `spell_by_circle` com dez faixas em vez de nove. O template não é
 * tocado — ele percorre o que receber, e passa a receber dez.
 *
 * Se o sistema mudar o nome do campo, o envelope não acha nada e devolve os
 * dados como vieram: a ficha continua funcionando, com a 10ª de volta ao
 * fallback. Ruim, mas não quebrado.
 */

import { envolver, caminhoDaFicha } from "./envelope.js";

const ID = "spacedragon";
const GRANDEZA_MAXIMA = 10;

/** O círculo de uma magia, olhando as quatro tradições como o sistema faz. */
function circuloDe(magia) {
  for (const t of ["arcane", "divine", "necromancer", "illusionist"]) {
    const v = magia.system?.[t];
    if (v && v !== "null" && parseInt(v, 10) > 0) return parseInt(v, 10);
  }
  return null;
}

let envolvido = false;

export function ligarGrandezas() {
  if (envolvido) return;

  const registro = CONFIG.Actor?.sheetClasses?.character ?? {};
  const ficha = Object.values(registro).find((e) => e?.cls?.name === "OD2CharacterSheet")?.cls;
  const alvo = caminhoDaFicha("character", "OD2CharacterSheet", "getData");
  if (!alvo || !ficha?.prototype?.getData) {
    console.warn(`${ID} | ficha de personagem não encontrada — a 10ª Grandeza cai no 1º círculo`);
    return;
  }

  // Pelo libWrapper (envelope.js), no `getData` da ficha do SISTEMA: vale
  // também para quem abre um Space Dragon na ficha do Old Dragon 2.
  envolvido = envolver(alvo, async function (wrapped, ...args) {
    const dados = await wrapped(...args);
    try {
      if (!dados?.spell_by_circle) return dados;

      const grade = {};
      for (let i = 1; i <= GRANDEZA_MAXIMA; i += 1) grade[i] = { circle: i, spells: [] };

      for (const magia of this.actor.items.filter((i) => i.type === "spell")) {
        const c = circuloDe(magia);
        // O mesmo fallback do sistema, para magia sem círculo: cai na 1ª.
        (grade[c] ?? grade[1]).spells.push(magia);
      }
      dados.spell_by_circle = grade;
    } catch (e) {
      console.warn(`${ID} | não foi possível estender as Grandezas`, e);
    }
    return dados;
  });

  if (envolvido) console.log(`${ID} | aba de poderes estendida até a ${GRANDEZA_MAXIMA}ª Grandeza`);
}
