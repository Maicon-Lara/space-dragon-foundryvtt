/**
 * A iniciativa da nave no rastreador de combate.
 *
 * ── O PROBLEMA ──────────────────────────────────────────────────────────────
 *
 * A iniciativa "padrão" do Old Dragon 2 testa 1d20 contra o maior entre
 * Destreza e Sabedoria de cada personagem. A nave é um ator do tipo personagem
 * e não tem atributo nenhum: o sistema avisa "atributos inválidos" e a põe em
 * 21, atrás de todo mundo, rodada após rodada.
 *
 * ── AS DUAS SAÍDAS ──────────────────────────────────────────────────────────
 *
 *   · Com a Ordem de Ação do módulo, a nave declara pela T10-6, que é a regra
 *     do livro para naves e não usa atributo: disparo vale o dano da arma,
 *     ativar equipamento vale o BA da nave, manobra vale a JP. Isso mora em
 *     ordem-ficha.js (`opcoesDaNave`).
 *   · Com a iniciativa padrão do OD2, a nave testa com o PILOTO: a Destreza e a
 *     Sabedoria de quem está no Leme. É o que este arquivo faz.
 *
 * ── COMO, SEM REESCREVER O SISTEMA ──────────────────────────────────────────
 *
 * O sistema lê `actor.system.destreza` e `actor.system.sabedoria` dentro do
 * próprio gancho de combate, e não expõe a conta para ser trocada. Então o
 * módulo põe, NA MEMÓRIA, os atributos do piloto na nave um instante antes: os
 * nossos ganchos são registrados no `init`, e os do sistema no `ready`, então
 * os nossos rodam primeiro. Nada é gravado: a próxima atualização da nave
 * recarrega os campos do banco, e os modificadores da nave continuam 0
 * (atributos.js), então nenhuma outra conta muda.
 *
 * Sem piloto com ficha, a nave testa contra 10, um piloto mediano. Pôr a nave
 * "junto dos PNJs" faria o relatório de iniciativa do sistema dizer uma coisa e
 * o rastreador outra.
 */

import { ehNave } from "./nave-marca.js";
import { naveDe } from "./nave-pc-dados.js";

const ID = "spacedragon";

/** O piloto padrão, para a nave sem ninguém com ficha no Leme. */
export const PILOTO_MEDIANO = 10;

/**
 * Os atributos com que a nave testa a iniciativa: os do piloto, se ele tem os
 * dois preenchidos; senão, o piloto mediano.
 */
export function atributosDaIniciativa(piloto) {
  const destreza = Number(piloto?.system?.destreza) || 0;
  const sabedoria = Number(piloto?.system?.sabedoria) || 0;
  if (destreza > 0 && sabedoria > 0) {
    return { destreza, sabedoria, piloto: piloto?.name ?? null };
  }
  return { destreza: PILOTO_MEDIANO, sabedoria: PILOTO_MEDIANO, piloto: null };
}

/** Quem está no Leme da nave, pelo nome escrito no posto. */
export function nomeDoPiloto(ator) {
  return String(naveDe(ator, ID)?.postos?.leme ?? "").trim();
}

/**
 * Põe na memória das naves entre os combatentes os atributos do piloto.
 * Devolve o que fez, para o teste e para o console.
 */
export function prepararNaves(combatentes = [], acharAtor = () => null) {
  const feitos = [];
  for (const c of combatentes) {
    const ator = c?.actor;
    if (!ator?.system || !ehNave(ator)) continue;
    const nome = nomeDoPiloto(ator);
    const a = atributosDaIniciativa(nome ? acharAtor(nome) : null);
    ator.system.destreza = a.destreza;
    ator.system.sabedoria = a.sabedoria;
    feitos.push({ nave: ator.name, ...a });
  }
  return feitos;
}

/** A mesa usa a iniciativa padrão (por atributo) do Old Dragon 2? */
function iniciativaPadraoDoOD2() {
  try {
    return globalThis.game?.settings?.get?.("olddragon2e", "initiativeType") === "standard";
  } catch {
    return false;
  }
}

const acharPorNome = (nome) => globalThis.game?.actors?.getName?.(nome) ?? null;

/**
 * Liga os dois ganchos. Tem de ser chamado no `init`, para rodar antes dos do
 * sistema, que entram no `ready`.
 */
export function ligarIniciativaDasNaves() {
  const H = globalThis.Hooks;
  if (!H?.on) return false;

  // a primeira rodada: é aí que o sistema testa todo mundo
  H.on("preUpdateCombat", (combat, mudou) => {
    if (!iniciativaPadraoDoOD2()) return;
    const rodada = globalThis.foundry?.utils?.getProperty?.(mudou, "round") ?? mudou?.round;
    if (rodada !== 1) return;
    const feitos = prepararNaves(combat?.combatants?.contents ?? [], acharPorNome);
    if (feitos.length) console.log(`${ID} | iniciativa das naves pelo piloto`, feitos);
  });

  // a nave que entra com o combate já andando é testada na hora
  H.on("createCombatant", (combatente) => {
    if (!iniciativaPadraoDoOD2()) return;
    prepararNaves([combatente], acharPorNome);
  });
  return true;
}
