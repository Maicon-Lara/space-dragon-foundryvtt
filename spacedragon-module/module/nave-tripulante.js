/**
 * O tripulante no posto: a ficha do personagem ligada a um posto da nave.
 *
 * ── O QUE MUDA ──────────────────────────────────────────────────────────────
 *
 * O posto guardava só um NOME digitado, e a mesa copiava à mão o Pilotar (%)
 * do piloto e o BA do artilheiro para a ficha da nave — e esquecia de atualizar
 * quando o personagem subia de nível. Agora o jogador ARRASTA o personagem para
 * o posto: a nave guarda o vínculo (`nave.vinculos[posto]` = uuid do ator) e lê
 * da ficha dele, na hora de rolar, o que o posto precisa.
 *
 * O nome digitado continua valendo: um NPC ou um droide sem ficha ocupa o posto
 * pelo nome, e a mesa digita o número como antes.
 *
 * ── DE ONDE VEM CADA NÚMERO ─────────────────────────────────────────────────
 *
 * As classes da campanha têm outros nomes («Mercenário — Veterano», «Médico de
 * Campo — Técnico»), mas a base é a do Space Dragon, e o item de classe diz qual
 * (`flags.spacedragon.chassi`, ver chassi.js). As habilidades de classe também
 * dizem o nome do livro (`flags.spacedragon.habilidade`). Por isso a leitura
 * procura primeiro a HABILIDADE e depois o chassi: o Sensível à Força mistura
 * as classes, e um Guardião com «Pilotar Naves» pilota pela tabela do
 * Cosmonauta mesmo sendo Mentálico.
 *
 *   Pilotar (%)  «Pilotar Naves» (Cosmonauta); sem ela, «Operar Máquinas»
 *                (Cientista: «serve para pilotar naves, mas o cosmonauta faz
 *                isso melhor»); sem nenhuma, não sabe — a mesa digita.
 *   Conserto     «Operar Máquinas» (%); os demais, teste de Intelecto
 *                (1d20 ≤ Intelecto), como diz o §4 da regra.
 *   BA à dist.   o `bad` da ficha.
 *
 * Só `acharAtorNoMundo`, no fim, olha o mundo: o resto recebe a função que acha
 * o ator (`acharAtor`), e os testes passam atores de brinquedo.
 */

import { preparar, nivelDe, atributoDe } from "./testes.js";
import { chassiDe, habilidadeDe, progressaoDe } from "./chassi.js";
import { ehNave } from "./nave-marca.js";

/** Onde fica cada posto: a câmara atingida derruba quem está nela (JPR). */
export const CAMARA_DO_POSTO = {
  leme: "ponte", artilharia: "ponte", sensores: "ponte", comando: "ponte", engenharia: "maquinas",
};

/** As habilidades de classe do ator, pelo nome do livro. */
export function habilidadesDe(ator) {
  const itens = ator?.items ?? [];
  const nomes = new Set();
  for (const i of itens) {
    if (i?.type === "class_ability" && i.name) nomes.add(habilidadeDe(ator, i.name));
  }
  return nomes;
}

function porcentagem(ator, chave) {
  try {
    const p = preparar(chave, { nivel: nivelDe(ator) ?? 1, valores: {}, progressao: progressaoDe(ator) });
    return Number.isFinite(p.alvo) ? { valor: p.alvo, fonte: p.teste.habilidade } : null;
  } catch {
    return null;
  }
}

/**
 * O Pilotar (%) do tripulante: { valor, fonte } ou null (não pilota pela
 * tabela, e a mesa decide).
 */
export function pilotarDe(ator) {
  if (!ator) return null;
  const hab = habilidadesDe(ator);
  const chassi = chassiDe(ator);
  if (hab.has("Pilotar Naves")) return porcentagem(ator, "pilotar-naves");
  if (hab.has("Operar Máquinas")) return porcentagem(ator, "operar-maquinas");
  if (chassi === "Cosmonauta") return porcentagem(ator, "pilotar-naves");
  if (chassi === "Cientista") return porcentagem(ator, "operar-maquinas");
  return null;
}

/**
 * O teste de resolver avaria do tripulante:
 *   { tipo: "pct", valor, fonte }  — Operar Máquinas, 1d100 ≤ valor;
 *   { tipo: "d20", valor, fonte }  — Intelecto, 1d20 ≤ valor;
 *   null                           — sem ficha que diga.
 */
export function consertoDe(ator) {
  if (!ator) return null;
  const tecnico = habilidadesDe(ator).has("Operar Máquinas") || chassiDe(ator) === "Cientista";
  if (tecnico) {
    const p = porcentagem(ator, "operar-maquinas");
    if (p) return { tipo: "pct", ...p };
  }
  const intelecto = atributoDe(ator, "intelecto");
  return intelecto ? { tipo: "d20", valor: intelecto, fonte: "Intelecto" } : null;
}

/** O BA à distância do tripulante, ou null. */
export function baDistanciaDe(ator) {
  const n = Number(ator?.system?.bad);
  return ator && Number.isFinite(n) ? n : null;
}

/** O teste de conserto passou? (1d100 ou 1d20, sempre ≤ valor) */
export function consertoPassou(teste, rolado) {
  return Boolean(teste) && Number(rolado) <= Number(teste.valor);
}

/** A fórmula do teste de conserto. */
export const formulaDoConserto = (teste) => (teste?.tipo === "d20" ? "1d20" : "1d100");

/**
 * O ator no posto, ou null.
 *
 * O vínculo manda; sem vínculo (ou com o ator apagado), vale o nome digitado,
 * como antes. `acharAtor({ uuid, nome })` é da mesa.
 */
export function tripulanteDoPosto(nave, posto, acharAtor) {
  const nome = String(nave?.postos?.[posto] ?? "").trim();
  if (!nome || typeof acharAtor !== "function") return null;
  const uuid = nave?.vinculos?.[posto] ?? null;
  const ator = (uuid ? acharAtor({ uuid }) : null) ?? acharAtor({ nome });
  return ator && !ehNave(ator) ? ator : null;
}

/**
 * Gravar o tripulante arrastado no posto: o nome no campo de sempre e o
 * vínculo ao lado. Devolve a nave nova (não grava), ou null se não serve.
 */
export function vincularAoPosto(nave, posto, ator) {
  // um ator de compêndio não: o vínculo apontaria para o pack, que nem sempre
  // está carregado, e o jogador não é dono dele
  if (!CAMARA_DO_POSTO[posto] || !ator?.name || ehNave(ator) || ator.pack) return null;
  const uuid = ator.uuid ?? null;
  return {
    ...nave,
    postos: { ...(nave?.postos ?? {}), [posto]: ator.name },
    vinculos: { ...(nave?.vinculos ?? {}), ...(uuid ? { [posto]: uuid } : {}) },
  };
}

/**
 * O nome do posto foi digitado: se mudou, o vínculo cai (quem senta agora é
 * outro); se o campo ficou vazio, os dois saem.
 */
export function digitarNoPosto(nave, posto, texto) {
  const quem = String(texto ?? "").trim();
  const postos = { ...(nave?.postos ?? {}) };
  const vinculos = { ...(nave?.vinculos ?? {}) };
  if (quem) postos[posto] = quem;
  else delete postos[posto];
  if (String(nave?.postos?.[posto] ?? "").trim() !== quem) delete vinculos[posto];
  return { ...nave, postos, vinculos };
}

/**
 * O resumo do que a ficha leu, para o painel: «Pilotar 84%», «BA +3»…
 * Só do que o posto usa.
 */
export function resumoDoTripulante(posto, ator) {
  if (!ator) return "";
  const partes = [];
  if (posto === "leme") {
    const p = pilotarDe(ator);
    if (p) partes.push(`${p.fonte} ${p.valor}%`);
  }
  if (posto === "artilharia") {
    const b = baDistanciaDe(ator);
    if (b !== null) partes.push(`BA ${b >= 0 ? "+" : ""}${b}`);
  }
  if (posto === "engenharia") {
    const c = consertoDe(ator);
    if (c) partes.push(c.tipo === "pct" ? `${c.fonte} ${c.valor}%` : `${c.fonte} ${c.valor}`);
  }
  return partes.join(" · ");
}

/**
 * Os tripulantes da nave, posto a posto: { posto: { ator, vinculado, resumo } }.
 * É o que o painel desenha ao lado do nome.
 */
/**
 * O ator VINCULADO ao posto: achado pelo uuid do vínculo, e só assim. Um vínculo
 * cujo ator foi apagado não conta, mesmo que haja um homônimo no mundo.
 */
export function vinculadoAoPosto(nave, posto, acharAtor) {
  const uuid = nave?.vinculos?.[posto];
  if (!uuid || !String(nave?.postos?.[posto] ?? "").trim() || typeof acharAtor !== "function") return null;
  const ator = acharAtor({ uuid });
  return ator && !ehNave(ator) ? ator : null;
}

export function tripulacaoDaNave(nave, acharAtor) {
  const saida = {};
  for (const posto of Object.keys(CAMARA_DO_POSTO)) {
    const ator = tripulanteDoPosto(nave, posto, acharAtor);
    if (!ator) continue;
    saida[posto] = {
      ator,
      vinculado: vinculadoAoPosto(nave, posto, acharAtor) === ator,
      resumo: resumoDoTripulante(posto, ator),
    };
  }
  return saida;
}

/**
 * Quem está na câmara atingida: os postos dela, com e sem ficha.
 * [{ posto, nome, ator|null }]
 */
export function tripulantesNaCamara(nave, camara, acharAtor) {
  // quem está em dois postos da mesma câmara faz UMA JPR
  const vistos = new Set();
  return Object.entries(CAMARA_DO_POSTO)
    .filter(([, c]) => c === camara)
    .map(([posto]) => ({
      posto,
      nome: String(nave?.postos?.[posto] ?? "").trim(),
      ator: tripulanteDoPosto(nave, posto, acharAtor),
    }))
    .filter((t) => {
      if (!t.nome) return false;
      const chave = t.ator ? `a:${t.ator.uuid ?? t.ator.id}` : `n:${t.nome}`;
      if (vistos.has(chave)) return false;
      vistos.add(chave);
      return true;
    });
}

/**
 * O `acharAtor` da mesa: pelo uuid (o vínculo) ou pelo nome (o campo digitado).
 * É a única função deste arquivo que olha o mundo; fora do Foundry, null.
 */
export function acharAtorNoMundo({ uuid = null, nome = null } = {}) {
  try {
    if (uuid) {
      const doc = globalThis.fromUuidSync?.(uuid);
      return doc?.actor ?? doc ?? null;
    }
    return nome ? globalThis.game?.actors?.getName?.(nome) ?? null : null;
  } catch {
    return null;
  }
}
