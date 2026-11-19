/**
 * O descanso do Space Dragon dentro do "Realizar descanso" do Qualidade de Vida.
 *
 * ── O QUE O BOTÃO DELE FAZ E NÃO FAZ ────────────────────────────────────────
 *
 * O botão fica no diretório de Journals, é só do Mestre, e por personagem
 * escolhido (medido no código dele, v0.10.110, scripts/features/rest):
 * recupera os usos diários de magia e de habilidade, renova os efeitos do
 * gerenciador e gasta odres. PV ele não recupera, e o alcance mental do Space
 * Dragon ele não conhece — a mesa tinha de rodar a macro "Dia novo" à parte.
 *
 * ── ONDE SE ENCAIXA ─────────────────────────────────────────────────────────
 *
 * Para cada personagem ele chama `game.od2Qdv.effects.rest(ator)`, que é um
 * objeto público. Este módulo o envolve: o original roda, e depois o descanso
 * do Space Dragon. Sem o gerenciador de efeitos, ele dispara o gancho
 * `od2QdvRestCompleted`, e o módulo escuta esse também — nunca os dois, porque
 * o gancho só dispara quando a função não existe.
 *
 * ── A REGRA (Cap. 7, "Recuperar") ───────────────────────────────────────────
 *
 *   · o alcance mental volta inteiro: é um dia novo;
 *   · um DIA DE REPOUSO TOTAL devolve 1 PV por nível. O descanso do Qualidade
 *     de Vida pode ser uma noite de viagem, então o Mestre responde uma vez
 *     por descanso se foi repouso total;
 *   · Recuperação Acelerada: 2 PV por nível; Recuperação Lenta: 1 PV por nível
 *     a cada 2 dias (o módulo conta os dias na ficha);
 *   · androide não se recupera sozinho: depende de reparo de cientista.
 *
 * Tratamento médico (1d4+1 por dia, com teste de Ciência) fica com a mesa e
 * entra pelo "Aplicar como cura" do chat (dano.js).
 */

import { atorUsaFichaSD } from "./ficha.js";
import { ehNave } from "./nave-marca.js";
import { mutacoesDe } from "./mutacoes.js";
import { zerarAlcance } from "./mental.js";
import { aplicarEstado, estadoPorPV } from "./dano.js";
import { danosMortais } from "./cabecalho.js";
import { QDV } from "./integracao-qdv.js";
import { t as txt } from "./i18n.js";

const ID = "spacedragon";
const FLAG_LENTA = "diasLentos";
const MARCA = "__spacedragonDescanso";
/** Uma resposta de "repouso total?" vale para o lote inteiro do botão. */
const VALIDADE_DA_RESPOSTA = 2 * 60 * 1000;

const escapa = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* ── O QUE É PURO (testado em tools/teste-descanso.mjs) ──────────────────── */

/** "acelerada", "lenta" ou "normal", pelas mutações. */
export function ritmoDe(ator) {
  const chaves = new Set(mutacoesDe(ator).map((m) => m.chave));
  if (chaves.has("01-recuperacao-acelerada")) return "acelerada";
  if (chaves.has("01-recuperacao-lenta")) return "lenta";
  return "normal";
}

/** A espécie do ator é Androide? */
export function ehAndroide(ator) {
  const itens = ator?.items?.contents ?? [...(ator?.items ?? [])];
  return itens.some((i) => i?.type === "race" && /androide/i.test(String(i?.name ?? "")));
}

/**
 * Quantos PV um dia de repouso total devolve.
 * `diasLentos` é quantos dias a Recuperação Lenta já acumulou antes deste.
 */
export function pvDoRepouso({ nivel, ritmo = "normal", androide = false, diasLentos = 0 }) {
  const n = Math.min(Math.max(Math.trunc(Number(nivel) || 1), 1), 20);
  if (androide) return { pv: 0, diasLentos: 0 };
  if (ritmo === "acelerada") return { pv: 2 * n, diasLentos: 0 };
  if (ritmo === "lenta") {
    const dias = (Number(diasLentos) || 0) + 1;
    return dias >= 2 ? { pv: n, diasLentos: 0 } : { pv: 0, diasLentos: dias };
  }
  return { pv: n, diasLentos: 0 };
}

/* ── O FOUNDRY ─────────────────────────────────────────────────────────── */

let resposta = null; // { quando, repouso }

/** Pergunta uma vez por lote se foi um dia de repouso total. */
async function foiRepousoTotal() {
  if (resposta && Date.now() - resposta.quando < VALIDADE_DA_RESPOSTA) return resposta.repouso;
  const V2 = globalThis.foundry?.applications?.api?.DialogV2;
  let repouso = false;
  if (V2?.wait) {
    const r = await V2.wait({
      window: { title: txt("spacedragon.descanso.janela") },
      content: `<p>${txt("spacedragon.descanso.pergunta")}</p>`,
      buttons: [
        { action: "sim", label: txt("spacedragon.descanso.sim"), default: true, callback: () => true },
        { action: "nao", label: txt("spacedragon.descanso.nao"), callback: () => false },
      ],
      rejectClose: false,
    });
    repouso = r === true;
  }
  resposta = { quando: Date.now(), repouso };
  return repouso;
}

let linhas = [];
let timer = null;

/** O Qualidade de Vida descansa um personagem por vez: o cartão sai um só, no fim. */
function anotar(linha) {
  linhas.push(`<li>${linha}</li>`);
  clearTimeout(timer);
  timer = setTimeout(() => {
    const corpo = linhas.join("");
    linhas = [];
    globalThis.ChatMessage?.create?.({
      content: `<div class="title">${txt("spacedragon.descanso.titulo")}</div><div class="sd-teste"><ul class="sd-parcelas">${corpo}</ul></div>`,
      speaker: { alias: "Space Dragon" },
    });
  }, 600);
}

/** O descanso do Space Dragon de um personagem. Devolve o que foi feito. */
export async function descansarSD(ator, { repouso }) {
  if (!ator || ehNave(ator) || !["character", "retainer"].includes(ator.type) || !atorUsaFichaSD(ator)) return null;
  if (ator.statuses?.has?.("dead")) return null;
  const partes = [];

  const o = await zerarAlcance(ator);
  if (o?.total > 0) partes.push(txt("spacedragon.descanso.alcance", { total: o.total }));

  if (repouso) {
    const antes = Number(ator.system?.hp?.value) || 0;
    const max = Number(ator.system?.hp?.max) || antes;
    const androide = ehAndroide(ator);
    const ritmo = ritmoDe(ator);
    const r = pvDoRepouso({ nivel: ator.system?.level, ritmo, androide, diasLentos: ator.getFlag?.(ID, FLAG_LENTA) });
    if (ritmo === "lenta") await ator.setFlag(ID, FLAG_LENTA, r.diasLentos);
    if (androide) partes.push(txt("spacedragon.descanso.androide"));
    else if (antes >= max) partes.push(txt("spacedragon.descanso.cheio"));
    else if (!r.pv) partes.push(txt("spacedragon.descanso.lentaEspera"));
    else {
      const depois = Math.min(max, antes + r.pv);
      await ator.update({ "system.hp.value": depois });
      await aplicarEstado(ator, estadoPorPV(depois, { modo: "personagem", mortais: danosMortais(ator) }));
      partes.push(txt("spacedragon.descanso.pv", { n: depois - antes, antes, depois }));
    }
  }

  if (partes.length) anotar(`<strong>${escapa(ator.name)}</strong>: ${partes.join("; ")}`);
  return partes;
}

async function depoisDoDescanso(ator) {
  if (!globalThis.game?.user?.isGM) return;
  try {
    if (!ator || ehNave(ator) || !atorUsaFichaSD(ator)) return;
    await descansarSD(ator, { repouso: await foiRepousoTotal() });
  } catch (e) {
    console.warn(`${ID} | o descanso do Space Dragon falhou para ${ator?.name}`, e);
  }
}

function envolver() {
  const efeitos = globalThis.game?.od2Qdv?.effects;
  if (typeof efeitos?.rest !== "function") return false;
  if (efeitos.rest[MARCA]) return true;
  const original = efeitos.rest;
  const novo = async function (ator, ...resto) {
    const r = await original.call(this, ator, ...resto);
    await depoisDoDescanso(ator);
    return r;
  };
  novo[MARCA] = true;
  efeitos.rest = novo;
  return true;
}

export function ligarDescansoQdV() {
  if (!globalThis.game?.modules?.get?.(QDV)?.active) return false;
  // O Qualidade de Vida monta `game.od2Qdv.effects` no `ready` dele, que
  // normalmente roda antes do nosso (o id dele vem antes na ordem de carga).
  // Se não rodou, tenta de novo por alguns segundos.
  let tentativas = 20;
  const tentar = () => {
    if (envolver() || --tentativas <= 0) return;
    setTimeout(tentar, 250);
  };
  tentar();
  globalThis.Hooks?.on?.("od2QdvRestCompleted", (ator) => depoisDoDescanso(ator));
  return true;
}
