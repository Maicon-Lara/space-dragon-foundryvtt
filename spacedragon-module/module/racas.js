/**
 * Regras de raça que outros módulos registram, pelo NOME da habilidade.
 *
 * Pelo nome, e não por uma marca no item: as habilidades que já estão nas
 * fichas passam a valer sem ser arrastadas de novo do compêndio.
 *
 * Campos de uma regra:
 *   dano(ator, arma)  somado ao dano da arma, na ficha e no botão Usar;
 *   ordem             somado à Ordem de Ação declarada;
 *   venceJP           { jpc: (ator) => boolean }: a JP passa sem rolar;
 *   rm                Resistência Mental, em %.
 *
 * A armadura e as armas naturais não entram aqui: o sistema já as lê dos campos
 * `natural_armor` e `natural_weapon` da habilidade.
 */

import { chaveDoNome } from "./automacao-dados.js";
import { envolver, MODELO_PERSONAGEM } from "./envelope.js";

const REGRAS = {};

export function registrarRacas(tabela = {}) {
  Object.assign(REGRAS, tabela);
}

/** As regras que valem para o ator, cada uma com o nome da habilidade. */
function regrasDe(ator) {
  return [...(ator?.items ?? [])]
    .filter((i) => i.type === "race_ability" && REGRAS[chaveDoNome(i.name)])
    .map((i) => ({ ...REGRAS[chaveDoNome(i.name)], nome: i.name }));
}

export const bonusDeDanoDaRaca = (ator, arma) =>
  regrasDe(ator).reduce((soma, r) => soma + (Number(r.dano?.(ator, arma)) || 0), 0);

export const venceJPPelaRaca = (ator, qual) => regrasDe(ator).some((r) => r.venceJP?.[qual]?.(ator) === true);

/** A maior RM de raça do ator, ou null. */
export function rmDaRaca(ator) {
  const rm = Math.max(0, ...regrasDe(ator).map((r) => Number(r.rm) || 0));
  return rm > 0 ? rm : null;
}

/** Soma à Ordem de Ação o ajuste da raça, e o escreve na conta. */
export function comAjusteDaOrdem(ator, resultado) {
  const ajustes = regrasDe(ator).filter((r) => r.ordem);
  if (!ajustes.length) return resultado;
  const n = ajustes.reduce((s, r) => s + r.ordem, resultado.n);
  const como = ajustes.reduce((t, r) => `${t}, ${r.ordem > 0 ? "+" : ""}${r.ordem} (${r.nome})`, resultado.como);
  return { ...resultado, n, como };
}

let envolvido = false;

/** O bônus entra no método do sistema: vale no botão de dano dele e no Usar. */
export function ligarRacas() {
  if (envolvido || !CONFIG.Actor?.dataModels?.character?.prototype?.raceBonusDamage) return envolvido;
  envolvido = envolver(`${MODELO_PERSONAGEM}.raceBonusDamage`, function (wrapped, arma) {
    return wrapped(arma) + bonusDeDanoDaRaca(this.parent, arma);
  });
  return envolvido;
}
