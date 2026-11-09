/**
 * O botão "Usar" dos aparatos, poderes e ataques especiais.
 *
 * Quem usa rola uma vez o ataque e o dano. O cartão leva um botão por alvo,
 * para o Mestre ou o dono da ficha do alvo: ele rola a JP, se houver, e o
 * resultado desconta PV, cura, drena o atributo ou cria o efeito no Qualidade
 * de Vida. O que precisa de decisão do Mestre vai escrito no cartão.
 */

import {
  AUTOMACAO_DE_ITENS, ESPECIAIS_DE_CRIATURAS, chaveDoNome,
} from "./automacao-dados.js";
import { aplicarEmAtor } from "./dano-no-alvo.js";
import { automacaoDeItensLigada } from "./opcoes.js";
import { ligarNaFicha } from "./ficha.js";
import { ehNave } from "./nave-marca.js";
import { rolarJP, modificadorDaJP } from "./jp.js";
import { atorUsaFichaSD } from "./ficha.js";
import { t as txt } from "./i18n.js";

const ID = "spacedragon";
const FLAG = "automacao";
const FEITOS = "automacoesFeitas";
export const CLASSE_USAR = "sd-usar";
export const CLASSE_ALVO = "sd-auto-alvo";

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const QUAL_JP = { jpr: "jpd", jpf: "jpc", jpm: "jps" };
const ROTULO_JP = { jpr: "JPR", jpf: "JPF", jpm: "JPM" };

/* ── A regra pura ─────────────────────────────────────────────────────────── */

/** As tabelas de outros módulos: nome → entrada, ou nome de um item daqui. */
const REGISTRADAS = {};

/** Outro módulo acrescenta os itens dele. As chaves já vêm em `chaveDoNome`. */
export function registrarAutomacao(tabela = {}) {
  Object.assign(REGISTRADAS, tabela);
}

const resolver = (chave) => {
  const achada = REGISTRADAS[chave] ?? AUTOMACAO_DE_ITENS[chave] ?? null;
  return typeof achada === "string" ? AUTOMACAO_DE_ITENS[achada] ?? null : achada;
};

/** O que este item faz, ou null. */
export function automacaoDe(item, ator) {
  if (item?.type === "monster_attack") {
    const ataque = String(item.system?.description ?? "").replace(/<[^>]+>/g, " ");
    return ESPECIAIS_DE_CRIATURAS[`${chaveDoNome(ator?.name)}|${chaveDoNome(ataque)}`] ?? null;
  }
  return resolver(chaveDoNome(item?.name));
}

/** Troca {n}, {des}, {nivel3} e {nivel4} numa fórmula. */
export function montarFormula(formula, { n = 0, des = 0, nivel = 1 } = {}) {
  const sinalDes = Number(des) < 0 ? `${des}` : `${Number(des) || 0}`;
  return String(formula)
    .replace(/\{n\}/g, String(n))
    .replace(/\+\{des\}/g, Number(des) < 0 ? sinalDes : `+${sinalDes}`)
    .replace(/\{nivel3\}/g, String(Math.max(1, Math.floor((Number(nivel) || 1) / 3))))
    .replace(/\{nivel4\}/g, String(Math.max(1, Math.floor((Number(nivel) || 1) / 4))));
}

/** O que acontece com o alvo, conforme a JP: "cheio", "metade", "soDano" ou "nada". */
export function resultadoDaJp(def, passou) {
  if (!def.jp || !passou) return "cheio";
  if (def.aoPassar === "soDano") return "soDano";
  return def.aoPassar === "metade" ? "metade" : "nada";
}

/** Rodadas do Qualidade de Vida (10 segundos cada), no mínimo 1. */
export const rodadasDe = (segundos) => Math.max(1, Math.ceil((Number(segundos) || 0) / 10));

/** O efeito pronto para o Qualidade de Vida; `segundos` já vem calculado. */
export function efeitoPronto(efeito, { segundos = null, origem = "Space Dragon", id = "" } = {}) {
  const pronto = {
    id, name: efeito.nome, icon: "icons/svg/aura.svg", origin: origem, description: efeito.descricao ?? "",
    modifiers: (efeito.mods ?? []).map((m) => ({ key: m.key, mode: "add", value: String(m.value) })),
  };
  if (segundos) {
    const value = rodadasDe(segundos);
    pronto.duration = { type: "rounds", value, remaining: value };
    pronto.deleteOnExpire = true;
  }
  return pronto;
}

/** O efeito do dreno de atributo. */
export const efeitoDoDreno = (chave, pontos, nome) => ({
  nome: `Dreno: ${nome}`,
  descricao: `−${pontos} no atributo, até se recuperar.`,
  mods: [{ key: chave, value: -pontos }],
});

/* ── O uso ────────────────────────────────────────────────────────────────── */

async function rolar(formula) {
  return new globalThis.Roll(formula).evaluate();
}

/** Os modos e o valor {n}, numa janela. Devolve a definição final ou null. */
async function escolher(def) {
  const V2 = globalThis.foundry?.applications?.api?.DialogV2;
  if (!def.modos && !def.pedir) return { def, n: 0 };
  const campos =
    (def.modos ? `<div class="form-group"><label>${txt("spacedragon.auto.modo")}</label><select name="modo">` +
      def.modos.map((m, i) => `<option value="${i}">${esc(m.rotulo)}</option>`).join("") + `</select></div>` : "") +
    (def.pedir ? `<div class="form-group"><label>${esc(def.pedir.rotulo)}</label>` +
      `<input type="number" name="n" value="${def.pedir.padrao}" min="${def.pedir.min}" max="${def.pedir.max}"></div>` : "");
  const r = await V2.wait({
    window: { title: txt("spacedragon.auto.usar") },
    content: campos,
    buttons: [
      { action: "ok", label: txt("spacedragon.botao.rolar"), default: true, callback: (_e, b) => Object.fromEntries(new FormData(b.form)) },
      { action: "cancelar", label: txt("spacedragon.botao.cancelar") },
    ],
    rejectClose: false,
  });
  if (!r || typeof r !== "object") return null;
  const modo = def.modos?.[Number(r.modo)] ?? {};
  const limita = (v) => Math.min(def.pedir?.max ?? v, Math.max(def.pedir?.min ?? v, Math.trunc(Number(v) || 0)));
  return { def: { ...def, ...modo, modos: undefined }, n: def.pedir ? limita(r.n) : 0 };
}

/** O primeiro número de um campo: o bestiário traz "15 (+2 contra veneno)". */
export const numeroDe = (v) => {
  const n = Number.parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : null;
};

const alvoDoToken = (t) => {
  const s = t.actor?.system ?? {};
  return { uuid: t.document?.uuid ?? t.actor?.uuid, nome: t.name ?? t.actor?.name ?? "?", cp: s.ac_total ?? s.ac ?? numeroDe(s.ca) };
};

/** Usa o item: rola, e manda o cartão com um botão por alvo. */
export async function usarItem(ator, item, definicao) {
  const marcados = definicao.proprio
    ? [{ uuid: ator.uuid, nome: ator.name, cp: null }]
    : [...(globalThis.game?.user?.targets ?? [])].map(alvoDoToken);
  if (!marcados.length) {
    globalThis.ui?.notifications?.warn?.(txt("spacedragon.cine.aviso.semAlvo"));
    return null;
  }
  const escolha = await escolher(definicao);
  if (!escolha) return null;
  const { def, n } = escolha;
  const nivel = Number(ator.system?.level) || 1;
  const contexto = { n, nivel, des: Number(ator.system?.mod_destreza) || 0 };
  const rolls = [];
  const linhas = [];
  const r = async (f) => { const x = await rolar(montarFormula(f, contexto)); rolls.push(x); return x; };

  if (def.area) linhas.push(txt("spacedragon.auto.area", { area: esc(def.area) }));

  const atingidos = [];
  if (def.ataque) {
    const ba = Number(ator.system?.[def.ataque]) || 0;
    // um uso, um número de disparos: com vários alvos, eles se revezam
    for (let i = 0; i < (def.ataques ?? 1); i += 1) {
      const alvo = marcados[i % marcados.length];
      const a = await r(`1d20 + ${ba}`);
      const natural = a.dice?.[0]?.total;
      const acertou = natural === 20 || (natural !== 1 && (alvo.cp === null || a.total >= Number(alvo.cp)));
      linhas.push(acertou
        ? txt("spacedragon.auto.acertou", { nome: esc(alvo.nome), total: a.total, cp: alvo.cp ?? "?" })
        : txt("spacedragon.auto.errou", { nome: esc(alvo.nome), total: a.total, cp: alvo.cp ?? "?" }));
      if (!acertou) continue;
      // cada disparo que acerta rola o próprio dano
      if (def.dano) {
        const d = (await r(def.dano)).total;
        linhas.push(txt("spacedragon.auto.dano", { n: d }));
        atingidos.push({ ...alvo, dano: d });
      } else {
        atingidos.push(alvo);
      }
    }
  } else {
    atingidos.push(...marcados);
  }

  const dano = def.dano && !def.ataque ? (await r(def.dano)).total : 0;
  const cura = def.cura ? (await r(def.cura)).total : 0;
  const dreno = def.dreno ? (await r(def.dreno.formula)).total : 0;
  if (def.dano && !def.ataque) linhas.push(txt("spacedragon.auto.dano", { n: dano }));
  if (def.cura) linhas.push(txt("spacedragon.auto.cura", { n: cura }));
  if (def.dreno) linhas.push(txt("spacedragon.auto.dreno", { n: dreno }));
  if (def.jp) {
    linhas.push(def.aoPassar === "metade"
      ? txt("spacedragon.auto.jpMetade", { jp: ROTULO_JP[def.jp] })
      : def.aoPassar === "soDano"
        ? txt("spacedragon.auto.jpSoDano", { jp: ROTULO_JP[def.jp] })
        : txt("spacedragon.auto.jpAnula", { jp: ROTULO_JP[def.jp] }));
  }

  let segundos = def.efeito?.segundos ?? null;
  if (segundos && def.efeito.porNivel) segundos *= nivel;
  if (def.efeito?.segundosRolar) segundos = (await r(def.efeito.segundosRolar)).total;

  if (def.custo) {
    const c = (await r(def.custo.formula)).total;
    linhas.push(txt("spacedragon.auto.custo", { n: c, nome: esc(ator.name) }));
  }
  if (def.nota) linhas.push(`<em>${esc(def.nota)}</em>`);

  const dados = {
    nomeItem: item.name, alvos: atingidos.map((a) => ({ uuid: a.uuid, nome: a.nome, dano: a.dano ?? null })),
    dano, cura, dreno, chaveDreno: def.dreno?.chave ?? null, jp: def.jp ?? null, aoPassar: def.aoPassar ?? null,
    efeito: def.efeito ? { ...def.efeito, mods: def.efeito.mods?.map((m) => ({ ...m, value: Number(montarFormula(m.value, contexto)) })) } : null,
    segundos,
  };
  const botoes = atingidos.map((a, i) =>
    `<button type="button" class="${CLASSE_ALVO}" data-i="${i}">${def.jp
      ? txt("spacedragon.auto.rolarJp", { jp: ROTULO_JP[def.jp], nome: esc(a.nome) })
      : txt("spacedragon.auto.aplicar", { nome: esc(a.nome) })}</button>`).join("");
  await globalThis.ChatMessage?.create?.({
    speaker: globalThis.ChatMessage?.getSpeaker?.({ actor: ator }),
    content: `<div class="spacedragon-cartao sd-automacao"><h4>${esc(item.name)}</h4><ul>${linhas.map((l) => `<li>${l}</li>`).join("")}</ul>${botoes}</div>`,
    rolls,
    flags: { [ID]: { [FLAG]: dados } },
  });
  return dados;
}

/** A JP do alvo: a do personagem pela regra do livro; a da criatura, 1d20 ≥ JP. */
async function jpDoAlvo(ator, jp) {
  if (ator.type !== "monster" && atorUsaFichaSD(ator)) return (await rolarJP(ator, QUAL_JP[jp]))?.passou ?? false;
  // Criatura, ou personagem em outra ficha: `rolarJP` deduz o modificador do
  // total da ficha SD, e fora dela sairia invertido.
  const mod = ator.type === "monster" ? 0 : modificadorDaJP(ator.system, QUAL_JP[jp]);
  const roll = await rolar(`1d20 + ${mod}`);
  await roll.toMessage?.({ flavor: `${ROTULO_JP[jp]} — ${esc(ator.name)}`, speaker: globalThis.ChatMessage?.getSpeaker?.({ actor: ator }) });
  return roll.total >= (numeroDe(ator.system?.jp) ?? 0);
}

const novaId = () => (globalThis.foundry?.utils?.randomID?.() ?? `sd${Date.now()}`);

async function acrescentarEfeito(ator, efeito) {
  const api = globalThis.game?.od2Qdv?.effects;
  if (!api?.get || !api?.set) {
    globalThis.ui?.notifications?.warn?.(txt("spacedragon.auto.semQdv", { efeito: esc(efeito.name) }));
    return false;
  }
  await api.set(ator, [...(api.get(ator) ?? []), efeito]);
  return true;
}

/** Aplica o resultado em um alvo do cartão, uma vez. */
export async function aplicarNoAlvo(idMensagem, i, dados) {
  const info = dados.alvos?.[i];
  const doc = await globalThis.fromUuid?.(info?.uuid);
  const ator = doc?.actor ?? doc;
  const avisa = (m) => { globalThis.ui?.notifications?.warn?.(m); return null; };
  if (!ator?.update) return avisa(txt("spacedragon.danoNoAlvo.semAlvo"));
  if (!ator.isOwner) return avisa(txt("spacedragon.aviso.semPermissao", { nome: esc(ator.name) }));
  const chave = `${idMensagem}:${i}`;
  const feitos = [].concat(ator.getFlag?.(ID, FEITOS) ?? ator.flags?.[ID]?.[FEITOS] ?? []);
  if (feitos.includes(chave)) return avisa(txt("spacedragon.nave.disparo.jaAplicado"));
  // A marca só entra no fim: uma falha de conexão no meio não perde o uso.
  const marcar = () => ator.update({ [`flags.${ID}.${FEITOS}`]: [...feitos, chave].slice(-40) });

  const passou = dados.jp ? await jpDoAlvo(ator, dados.jp) : false;
  const resultado = resultadoDaJp(dados, passou);
  if (resultado === "nada") {
    await marcar();
    globalThis.ui?.notifications?.info?.(txt("spacedragon.auto.resistiu", { nome: esc(ator.name) }));
    return { resultado };
  }
  const dano = info.dano ?? dados.dano;
  if (dano) await aplicarEmAtor(ator, resultado === "metade" ? Math.floor(dano / 2) : dano);
  if (dados.cura) {
    const hp = ator.system?.hp ?? {};
    await ator.update({ "system.hp.value": Math.min(Number(hp.max) || Infinity, (Number(hp.value) || 0) + dados.cura) });
  }
  // o efeito e o dreno são da falha: quem passa em "metade" só leva o dano
  if (resultado === "cheio") {
    if (dados.dreno) await acrescentarEfeito(ator, efeitoPronto(efeitoDoDreno(dados.chaveDreno, dados.dreno, dados.nomeItem), { id: novaId() }));
    if (dados.efeito) await acrescentarEfeito(ator, efeitoPronto(dados.efeito, { segundos: dados.segundos, id: novaId() }));
  }
  await marcar();
  return { resultado };
}

/* ── Na ficha e no chat ───────────────────────────────────────────────────── */

export function ligarAutomacao() {
  const desenha = (app, el) => {
    if (!automacaoDeItensLigada() || ehNave(app?.actor) || !app?.actor?.isOwner) return;
    const raiz = el?.querySelector ? el : el?.[0];
    for (const linha of raiz?.querySelectorAll?.("[data-item-id]") ?? []) {
      if (linha.querySelector(`.${CLASSE_USAR}`)) continue;
      const item = app.actor.items?.get?.(linha.dataset.itemId);
      const def = automacaoDe(item, app.actor);
      if (!def) continue;
      const botao = linha.ownerDocument.createElement("button");
      botao.type = "button";
      botao.className = CLASSE_USAR;
      botao.textContent = def.rotulo ?? txt("spacedragon.auto.usar");
      botao.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        usarItem(app.actor, item, def).catch((e) => console.error(`${ID} | usar ${item.name}`, e));
      });
      linha.appendChild(botao);
    }
  };
  ligarNaFicha(desenha);
  globalThis.Hooks?.on?.("renderOD2MonsterSheet", desenha);
  globalThis.Hooks?.on?.("renderChatMessageHTML", (msg, html) => {
    const dados = msg?.getFlag?.(ID, FLAG);
    if (!dados) return;
    for (const b of html?.querySelectorAll?.(`.${CLASSE_ALVO}`) ?? []) {
      if (b.dataset.ligado) continue;
      b.dataset.ligado = "1";
      const i = Number(b.dataset.i);
      b.addEventListener("click", (ev) => {
        ev.preventDefault();
        b.disabled = true;
        aplicarNoAlvo(msg.id, i, dados).catch((e) => { b.disabled = false; console.error(`${ID} | automação`, e); });
      });
    }
  });
  return true;
}
