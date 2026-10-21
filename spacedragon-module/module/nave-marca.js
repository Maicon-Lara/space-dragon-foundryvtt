/**
 * Este ator é uma nave?
 *
 * Num arquivo à parte, sem import nenhum, porque é lido DENTRO dos getters do
 * modelo de dados (atributos.js) — e ali não pode haver ciclo de import nem
 * leitura que lance. Lê o objeto `flags` cru, nunca getFlag (que lança para
 * escopo de pacote inativo; ver lerFlag em nave-pc-dados.js).
 *
 * É nave quem abre na Ficha de Nave, ou quem tem o tipo de nave gravado.
 */
export function ehNave(ator) {
  const flags = ator?.flags;
  if (!flags) return false;
  if (flags.core?.sheetClass === "spacedragon.NaveSheet") return true;
  return !!flags.spacedragon?.nave?.tipo;
}
