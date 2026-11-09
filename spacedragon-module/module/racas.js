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
 *   rm                Resistência Mental, em %;
 *   regenera          PV recuperados a cada rodada inteira sem perder PV;
 *   aoCair            { jp, sucesso }: ao chegar a 0 PV, 1x por combate;
 *   jpSituacao        { jpc: [{ rotulo, bonus }] }: caixas na janela da JP;
 *   contraQuemFeriu   somado ao ataque contra quem já feriu o personagem;
 *   recebe({ chave, critico })  { mult, desativa } do dano da arma recebida.
 *
 * A armadura e as armas naturais não entram aqui: o sistema já as lê dos campos
 * `natural_armor` e `natural_weapon` da habilidade.
 */

import { chaveDoNome } from "./automacao-dados.js";
import { envolver, MODELO_PERSONAGEM } from "./envelope.js";
import { t as txt } from "./i18n.js";

const ID = "spacedragon";
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

/** As caixas de bônus por situação na JP `qual`. */
export const situacoesDaJP = (ator, qual) =>
  regrasDe(ator).flatMap((r) => (r.jpSituacao?.[qual] ?? []).map((s) => ({ ...s, nome: r.nome })));

/** Quem feriu: o token, para criaturas iguais não se confundirem; senão o ator. */
export const chaveDoAtacante = (ator) => ator?.token?.id ?? ator?.id ?? null;

const feridoPor = (ator) => [].concat(ator?.getFlag?.(ID, "feridoPor") ?? ator?.flags?.[ID]?.feridoPor ?? []);

/** O bônus de ataque contra um alvo que já feriu o ator, ou null. */
export function ajusteContraQuemFeriu(ator, alvo) {
  const regra = regrasDe(ator).find((r) => r.contraQuemFeriu);
  // Também pelo ator: a ficha aberta na barra lateral fere sem token nenhum.
  const feridas = feridoPor(ator);
  if (!regra || ![alvo?.chave, alvo?.atorId].some((c) => c && feridas.includes(c))) return null;
  return { valor: regra.contraQuemFeriu, nome: regra.nome };
}

/** O que gravar no alvo ferido, junto do dano. Vazio se ele não guarda isso. */
export function marcaDeFerida(alvo, chave) {
  if (!chave || !regrasDe(alvo).some((r) => r.contraQuemFeriu)) return {};
  const lista = feridoPor(alvo);
  if (lista.includes(chave)) return {};
  return { [`flags.${ID}.feridoPor`]: [...lista, chave].slice(-30) };
}

/** Como a raça do alvo recebe o dano desta arma. */
export function danoRecebido(alvo, ataque) {
  const r = { mult: 1, desativa: false, nomes: [] };
  for (const regra of regrasDe(alvo)) {
    const efeito = regra.recebe?.(ataque);
    if (!efeito) continue;
    r.mult *= Number(efeito.mult) || 1;
    r.desativa ||= Boolean(efeito.desativa);
    r.nomes.push(regra.nome);
  }
  return r;
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

const eMestreAtivo = () => globalThis.game?.users?.activeGM?.id === globalThis.game?.user?.id;

const cartao = (ator, texto) => globalThis.ChatMessage?.create?.({
  speaker: globalThis.ChatMessage?.getSpeaker?.({ actor: ator }),
  content: `<div class="sd-teste"><p>${texto}</p></div>`,
});

/**
 * A cada virada de rodada, compara o PV com o da virada anterior: assim vale
 * para o dano aplicado por qualquer caminho, inclusive digitado na ficha.
 */
export async function regenerarNaRodada(combate) {
  const rodada = Number(combate?.round) || 0;
  for (const combatente of combate?.combatants ?? []) {
    const ator = combatente.actor;
    const regra = regrasDe(ator).find((r) => r.regenera);
    if (!regra) continue;
    const pv = Number(ator.system?.hp?.value) || 0;
    const maximo = Number(ator.system?.hp?.max) || 0;
    const antes = ator.getFlag?.(ID, "pvNaRodada");
    const inteira = antes?.combate === combate.id && antes.rodada === rodada - 1 && pv >= Number(antes.pv);
    const cura = inteira && pv >= 0 && pv < maximo ? Math.min(regra.regenera, maximo - pv) : 0;
    await ator.update({
      "system.hp.value": pv + cura,
      [`flags.${ID}.pvNaRodada`]: { combate: combate.id, rodada, pv: pv + cura },
    });
    if (cura) await cartao(ator, txt("spacedragon.racas.regenerou", { nome: ator.name, n: cura, habilidade: regra.nome }));
  }
}

/*
 * Quem acaba de cair, neste cliente. Num registro próprio: o Foundry não garante
 * que o que se escreve nas opções do preUpdate chegue ao updateActor.
 */
const caindo = new Set();

/** Consome a marca: devolve se este ator acaba de cair. */
export const acabouDeCair = (ator) => caindo.delete(ator.uuid);

/** Marca, em quem faz a alteração, se o PV acaba de chegar a 0 ou menos. */
export function notarQueda(ator, mudou) {
  const novo = globalThis.foundry?.utils?.getProperty?.(mudou, "system.hp.value");
  if (novo === undefined || Number(novo) > 0 || !(Number(ator.system?.hp?.value) > 0)) return;
  if (regrasDe(ator).some((r) => r.aoCair)) caindo.add(ator.uuid);
}

/** A JP de quem cai a 0 PV sem morrer, uma vez por combate. */
export async function reagirAQueda(ator) {
  const combate = globalThis.game?.combat;
  const regra = regrasDe(ator).find((r) => r.aoCair);
  if (!regra || !combate?.started || ator.getFlag?.(ID, "aoCairNoCombate") === combate.id) return null;
  const { danosMortais } = await import("./cabecalho.js");
  if (Number(ator.system?.hp?.value) <= danosMortais(ator)) return null;
  await ator.update({ [`flags.${ID}.aoCairNoCombate`]: combate.id });
  const { rolarJP } = await import("./jp.js");
  const r = await rolarJP(ator, regra.aoCair.jp);
  if (r?.passou) await cartao(ator, `<strong>${regra.nome}:</strong> ${ator.name} ${regra.aoCair.sucesso}`);
  return r;
}

let naMesa = false;

/** Os ganchos da mesa. Uma vez, no `ready`. */
export function ligarRacasNaMesa() {
  if (naMesa) return true;
  naMesa = true;
  const H = globalThis.Hooks;
  H?.on?.("updateCombat", (combate, mudou) => {
    if (!("round" in (mudou ?? {})) || !eMestreAtivo()) return;
    regenerarNaRodada(combate).catch((e) => console.error(`${ID} | regeneração`, e));
  });
  H?.on?.("preUpdateActor", (ator, mudou) => notarQueda(ator, mudou));
  H?.on?.("updateActor", (ator, _mudou, _opcoes, usuario) => {
    if (usuario !== globalThis.game?.user?.id || !acabouDeCair(ator)) return;
    reagirAQueda(ator).catch((e) => console.error(`${ID} | queda`, e));
  });
  return true;
}
