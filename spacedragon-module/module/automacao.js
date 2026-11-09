/**
 * O botão "Usar" dos aparatos, poderes e ataques especiais.
 *
 * Quem usa rola uma vez o ataque e o dano. O cartão leva um botão por alvo,
 * para o Mestre ou o dono da ficha do alvo: ele rola a JP, se houver, e o
 * resultado desconta PV, cura, drena o atributo ou cria o efeito no Qualidade
 * de Vida. O que precisa de decisão do Mestre vai escrito no cartão.
 */

import {
  AUTOMACAO_DE_ITENS, ESPECIAIS_DE_CRIATURAS, chaveDoNome, danoRolavel,
} from "./automacao-dados.js";
import { aplicarEmAtor } from "./dano-no-alvo.js";
import { automacaoDeItensLigada, automacaoDeArmasLigada } from "./opcoes.js";
import { chassiDe } from "./chassi.js";
import { multiplicadorDaArma, multiplicadorFurtivo, escolheArmaPreferida, regraDoMercenario } from "./vitalidade.js";
import { ligarNaFicha } from "./ficha.js";
import { ehNave } from "./nave-marca.js";
import { rolarJP, perguntarJP, modificadorDaJP } from "./jp.js";
import { ajusteContraQuemFeriu, chaveDoAtacante, danoRecebido, marcaDeFerida } from "./racas.js";
import { atorUsaFichaSD } from "./ficha.js";
import { t as txt } from "./i18n.js";

const ID = "spacedragon";
const FLAG = "automacao";
const FEITOS = "automacoesFeitas";
// Não é "sd-usar": essa é do link "usar X%" do painel mental (mental.js), e o
// botão deixava de ser desenhado nas linhas de poder do Mentálico.
export const CLASSE_USAR = "sd-usar-item";
export const CLASSE_ALVO = "sd-auto-alvo";
export const CLASSE_PREFERIDA = "sd-arma-preferida";

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

/**
 * A arma comum, montada pelos campos do item — vale também para a arma feita à
 * mão. As contas são as do sistema: BA + bônus da arma no ataque; no dano, Força
 * para corpo a corpo e arremesso, e o bônus da arma e o da raça para todas.
 */
export function automacaoDeArma(item, ator) {
  const s = item?.system ?? {};
  const dado = danoRolavel(s.damage);
  if (item?.type !== "weapon" || !dado || s.type === "ammunition") return null;
  const corpo = s.type === "melee";
  const forca = corpo || s.type === "throwing" ? Number(ator?.system?.mod_forca) || 0 : 0;
  const extra = forca + (Number(s.bonus_damage) || 0) + (Number(ator?.system?.raceBonusDamage?.(item)) || 0);
  const base = { dano: extra ? `${dado}${extra < 0 ? extra : `+${extra}`}` : dado, bonusAtaque: Number(s.bonus_ba) || 0 };
  if (corpo && Number(s.throw_range) > 0) {
    return { ...base, modos: [
      { rotulo: txt("spacedragon.auto.modoCorpo"), ataque: "bac" },
      { rotulo: txt("spacedragon.auto.modoArremesso"), ataque: "bad" },
    ] };
  }
  return { ...base, ataque: corpo ? "bac" : "bad" };
}

/** O que este item faz, ou null. */
export function automacaoDe(item, ator) {
  if (item?.type === "monster_attack") {
    const ataque = String(item.system?.description ?? "").replace(/<[^>]+>/g, " ");
    return ESPECIAIS_DE_CRIATURAS[`${chaveDoNome(ator?.name)}|${chaveDoNome(ataque)}`] ?? null;
  }
  return resolver(chaveDoNome(item?.name)) ?? automacaoDeArma(item, ator);
}

/** O que o botão da linha faz, respeitando a opção de cada tipo de item. */
export function definicaoDoBotao(item, ator) {
  const ligada = item?.type === "weapon" ? automacaoDeArmasLigada() : automacaoDeItensLigada();
  return ligada ? automacaoDe(item, ator) : null;
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

/** A conta de uma rolagem, como o Foundry a resolveu: "1d6 + 3 → 3 + 3 = 6". */
const contaDe = (x) => (x?.result ? txt("spacedragon.auto.contaDados", { formula: x.formula, result: x.result, total: x.total }) : null);

async function rolar(formula) {
  return new globalThis.Roll(formula).evaluate();
}

/* Usos limitados. Por dia, conta o dia do calendário do mundo; Shift no botão recarrega. */
const periodoDe = (limite) => (limite.por === "dia" ? Math.floor((Number(globalThis.game?.time?.worldTime) || 0) / 86400) : 0);

export function usosRestantes(ator, item, limite) {
  const u = (ator.getFlag?.(ID, "usos") ?? ator.flags?.[ID]?.usos)?.[item.id];
  return Math.max(0, limite.vezes - (u?.periodo === periodoDe(limite) ? Number(u.n) || 0 : 0));
}

const gravarUsos = (ator, item, limite, n) =>
  ator.update({ [`flags.${ID}.usos.${item.id}`]: { n, periodo: periodoDe(limite) } });

/** Os modos e o valor {n}, numa janela. Devolve a definição final ou null. */
async function escolher(def, extras = {}) {
  const V2 = globalThis.foundry?.applications?.api?.DialogV2;
  const pede = def.ataque || def.modos?.some((m) => m.ataque) ? extras : {};
  if (!def.modos && !def.pedir && !pede.furtivo && !pede.ajuste && !pede.primeiro && !pede.sacrificio) return { def, n: 0 };
  const marca = (nome, rotulo, marcada = false) =>
    `<div class="form-group"><label>${rotulo}</label><input type="checkbox" name="${nome}"${marcada ? " checked" : ""}></div>`;
  const dificuldades = [["0", "Normal"], ["5", "Muito fácil (+5)"], ["2", "Fácil (+2)"], ["-2", "Difícil (−2)"], ["-5", "Muito difícil (−5)"]];
  const campos =
    (def.modos ? `<div class="form-group"><label>${txt("spacedragon.auto.modo")}</label><select name="modo">` +
      def.modos.map((m, i) => `<option value="${i}">${esc(m.rotulo)}</option>`).join("") + `</select></div>` : "") +
    (def.pedir ? `<div class="form-group"><label>${esc(def.pedir.rotulo)}</label>` +
      `<input type="number" name="n" value="${def.pedir.padrao}" min="${def.pedir.min}" max="${def.pedir.max}"></div>` : "") +
    (pede.ajuste ? `<div class="form-group"><label>${txt("spacedragon.auto.dificuldade")}</label><select name="dificuldade">` +
      dificuldades.map(([v, r]) => `<option value="${v}">${r}</option>`).join("") + `</select></div>` +
      `<div class="form-group"><label>${txt("spacedragon.auto.bonus")}</label><input type="number" name="bonus" value="0"></div>` : "") +
    (pede.furtivo ? marca("furtivo", txt("spacedragon.auto.ataqueFurtivo", { mult: pede.furtivo })) : "") +
    (pede.primeiro ? marca("primeiro", txt("spacedragon.auto.primeiroAtaque"), true) : "") +
    (pede.sacrificio ? marca("sacrificar", txt("spacedragon.auto.sacrificar", { chance: pede.sacrificio })) : "");
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
  return { def: { ...def, ...modo, modos: undefined }, n: def.pedir ? limita(r.n) : 0,
    furtivo: Boolean(pede.furtivo && r.furtivo),
    ajuste: (Number(r.dificuldade) || 0) + (Number(r.bonus) || 0),
    primeiro: Boolean(r.primeiro),
    sacrificar: Boolean(pede.sacrificio && r.sacrificar) };
}

/** O primeiro número de um campo: o bestiário traz "15 (+2 contra veneno)". */
export const numeroDe = (v) => {
  const n = Number.parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : null;
};

const alvoDoToken = (t) => {
  const s = t.actor?.system ?? {};
  // A mesma chave de quem feriu: o ator se o token é ligado, senão o token.
  const chave = t.document?.actorLink ? t.actor?.id : t.document?.id ?? null;
  return { uuid: t.document?.uuid ?? t.actor?.uuid, nome: t.name ?? t.actor?.name ?? "?", cp: s.ac_total ?? s.ac ?? numeroDe(s.ca), chave, atorId: t.actor?.id ?? null };
};

/** Usa o item: rola, e manda o cartão com um botão por alvo. */
export async function usarItem(ator, item, definicao, opcoes = {}) {
  const marcados = definicao.proprio
    ? [{ uuid: ator.uuid, nome: ator.name, cp: null }]
    : [...(globalThis.game?.user?.targets ?? [])].map(alvoDoToken);
  if (!marcados.length) {
    globalThis.ui?.notifications?.warn?.(txt("spacedragon.cine.aviso.semAlvo"));
    return null;
  }
  if (definicao.limite && usosRestantes(ator, item, definicao.limite) <= 0) {
    globalThis.ui?.notifications?.warn?.(txt("spacedragon.auto.semUsos", { nome: esc(item.name) }));
    return null;
  }
  const multFurtivo = multiplicadorFurtivo(ator);
  const merc = regraDoMercenario(ator, item);
  const escolha = await escolher(definicao, { furtivo: multFurtivo, ajuste: opcoes.ajuste, primeiro: merc?.preferida, sacrificio: merc?.chance });
  if (!escolha) return null;
  const { def, n } = escolha;
  const furtivo = escolha.furtivo && def.ataque ? multFurtivo : null;
  // O Mentálico paga o alcance e rola o desconhecido pela regra do Cap. 9 antes
  // do efeito; sem isto o botão seria um jeito de usar o poder de graça.
  if (item.type === "spell" && chassiDe(ator) === "Mentálico") {
    const { realizarPoder } = await import("./poder-mental.js");
    const poder = await realizarPoder(ator, item);
    if (!poder?.realizou) return null;
  }
  const nivel = Number(ator.system?.level) || 1;
  const contexto = { n, nivel, des: Number(ator.system?.mod_destreza) || 0 };
  const rolls = [];
  const linhas = [];
  const r = async (f) => { const x = await rolar(montarFormula(f, contexto)); rolls.push(x); return x; };

  // Sacrificar o 2º ataque: passou, o acerto é crítico; falhou, o turno acabou.
  let critGarantido = false;
  if (escolha.sacrificar && def.ataque) {
    const teste = await r("1d100");
    if (teste.total > merc.chance) {
      await globalThis.ChatMessage?.create?.({
        speaker: globalThis.ChatMessage?.getSpeaker?.({ actor: ator }),
        content: `<div class="spacedragon-cartao sd-automacao"><h4>${esc(item.name)}</h4><p>${txt("spacedragon.auto.sacrificouFalha", { total: teste.total, chance: merc.chance })}</p></div>`,
        rolls,
      });
      return null;
    }
    critGarantido = true;
    linhas.push(txt("spacedragon.auto.sacrificouOk", { total: teste.total, chance: merc.chance }));
  }
  // O +2 é só do 1º ataque do turno; o −4 vale em toda outra arma.
  const ajusteMerc = !merc ? 0 : merc.preferida ? (escolha.primeiro ? 2 : 0) : merc.marcada ? -4 : 0;

  if (def.area) linhas.push(txt("spacedragon.auto.area", { area: esc(def.area) }));

  const atingidos = [];
  if (def.ataque) {
    const ba = Number(ator.system?.[def.ataque]) || 0;
    // um uso, um número de disparos: com vários alvos, eles se revezam
    for (let i = 0; i < (def.ataques ?? 1); i += 1) {
      const alvo = marcados[i % marcados.length];
      const raca = ajusteContraQuemFeriu(ator, alvo);
      if (raca) linhas.push(txt("spacedragon.racas.ajusteAtaque", { habilidade: esc(raca.nome), n: raca.valor, nome: esc(alvo.nome) }));
      const partes = [[ba, "BA"], [Number(def.bonusAtaque) || 0, "arma"], [furtivo ? 2 : 0, "furtivo"], [Number(escolha.ajuste) || 0, "situação"], [ajusteMerc, "Mercenário"], [raca?.valor ?? 0, esc(raca?.nome)]];
      const a = await r(`1d20 + ${partes.reduce((soma, [v]) => soma + v, 0)}`);
      const natural = a.dice?.[0]?.total;
      const somas = partes.filter(([v]) => v).map(([v, rotulo]) => `${v < 0 ? v : `+${v}`} (${rotulo})`).join(" ");
      const total = a.total;
      linhas.push(txt("spacedragon.auto.contaAtaque", { natural, somas, total }));
      const acertou = natural === 20 || (natural !== 1 && (alvo.cp === null || a.total >= Number(alvo.cp)));
      linhas.push(acertou
        ? txt("spacedragon.auto.acertou", { nome: esc(alvo.nome), total: a.total, cp: alvo.cp ?? "?" })
        : txt("spacedragon.auto.errou", { nome: esc(alvo.nome), total: a.total, cp: alvo.cp ?? "?" }));
      if (!acertou) continue;
      // cada disparo que acerta rola o próprio dano
      const critico = natural === 20 || critGarantido;
      if (critico) linhas.push(txt("spacedragon.auto.critico"));
      if (critGarantido && natural === 20) linhas.push(txt("spacedragon.auto.danoMassivo"));
      if (def.dano) {
        const rolagemDano = await r(def.dano);
        const rolado = rolagemDano.total;
        // Multiplicam o dano final. Crítico e furtivo não se somam: vale o maior.
        // Todo crítico dobra o dano; o Veterano/Cosmonauta tem a coluna própria.
        const multCritico = critico ? multiplicadorDaArma(ator, item) ?? 2 : null;
        const mult = Math.max(1, multCritico ?? 1, furtivo ?? 1);
        const d = rolado * mult;
        linhas.push(txt("spacedragon.auto.dano", { n: d }));
        if (contaDe(rolagemDano)) linhas.push(contaDe(rolagemDano));
        if (mult > 1) {
          linhas.push(mult === multCritico
            ? txt("spacedragon.auto.danoCritico", { rolado, mult })
            : txt("spacedragon.auto.danoFurtivo", { rolado, mult }));
        }
        atingidos.push({ ...alvo, dano: d, critico });
      } else {
        atingidos.push(alvo);
      }
    }
  } else {
    atingidos.push(...marcados);
  }

  const contas = [];
  const comConta = async (f) => { const x = await r(f); if (contaDe(x)) contas.push(contaDe(x)); return x.total; };
  const dano = def.dano && !def.ataque ? await comConta(def.dano) : 0;
  const cura = def.cura ? await comConta(def.cura) : 0;
  const dreno = def.dreno ? await comConta(def.dreno.formula) : 0;
  if (def.dano && !def.ataque) linhas.push(txt("spacedragon.auto.dano", { n: dano }));
  if (def.cura) linhas.push(txt("spacedragon.auto.cura", { n: cura }));
  if (def.dreno) linhas.push(txt("spacedragon.auto.dreno", { n: dreno }));
  linhas.push(...contas);
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
    nomeItem: item.name, atacante: chaveDoAtacante(ator),
    alvos: atingidos.map((a) => ({ uuid: a.uuid, nome: a.nome, dano: a.dano ?? null, critico: Boolean(a.critico) })),
    dano, cura, dreno, chaveDreno: def.dreno?.chave ?? null, jp: def.jp ?? null, aoPassar: def.aoPassar ?? null,
    efeito: def.efeito ? { ...def.efeito, mods: def.efeito.mods?.map((m) => ({ ...m, value: Number(montarFormula(m.value, contexto)) })) } : null,
    segundos,
  };
  if (def.limite) await gravarUsos(ator, item, def.limite, def.limite.vezes - usosRestantes(ator, item, def.limite) + 1);
  const botoes = (def.semAlvo ? [] : atingidos).map((a, i) =>
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
  if (ator.type !== "monster" && atorUsaFichaSD(ator)) {
    const sit = await perguntarJP(ator, QUAL_JP[jp]);
    return (await rolarJP(ator, QUAL_JP[jp], sit ?? 0))?.passou ?? false;
  }
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
  const recebido = danoRecebido(ator, { chave: chaveDoNome(dados.nomeItem), critico: Boolean(info.critico) });
  const dano = (info.dano ?? dados.dano) * recebido.mult;
  const fala = (texto) => globalThis.ChatMessage?.create?.({ speaker: globalThis.ChatMessage?.getSpeaker?.({ actor: ator }), content: `<div class="sd-teste"><p>${texto}</p></div>` });
  if (dano) {
    const final = resultado === "metade" ? Math.floor(dano / 2) : dano;
    await aplicarEmAtor(ator, final, marcaDeFerida(ator, dados.atacante));
    const habilidade = esc(recebido.nomes.join(", "));
    if (recebido.mult > 1) await fala(txt("spacedragon.racas.danoMultiplicado", { nome: esc(ator.name), habilidade, mult: recebido.mult, dano: final }));
    if (recebido.desativa && resultado === "cheio") {
      await ator.toggleStatusEffect?.("unconscious", { active: true });
      await fala(txt("spacedragon.racas.desativado", { nome: esc(ator.name) }));
    }
  }
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

/** O clique no BAC ou BAD da arma. Devolve false para seguir o fluxo do sistema. */
export async function ataqueDaFicha(ficha, item, ba, { shift = false } = {}) {
  const ator = ficha?.actor;
  if (item?.type !== "weapon" || ehNave(ator) || ficha?.constructor?.name === "NaveSheet") return false;
  if (!automacaoDeArmasLigada() || ![...(globalThis.game?.user?.targets ?? [])].length) return false;
  // A conta da munição rastreada é do sistema, e não fica exposta aos módulos.
  if ((item.system?.ammo_type ?? "none") !== "none") return false;
  let def = automacaoDe(item, ator);
  if (!def) return false;
  if (def.modos?.every((m) => m.ataque)) {
    const modo = def.modos.find((m) => m.ataque === ba);
    if (modo) def = { ...def, ...modo, modos: undefined };
  } else if (def.ataque && ba) {
    def = { ...def, ataque: ba };
  }
  await usarItem(ator, item, def, { ajuste: shift });
  return true;
}

function desenharEstrela(linha, item, ator) {
  if (!escolheArmaPreferida(ator) || linha.querySelector(`.${CLASSE_PREFERIDA}`)) return;
  const marcada = ator.getFlag?.(ID, "armaPreferida") === item.id;
  const estrela = linha.ownerDocument.createElement("a");
  estrela.className = CLASSE_PREFERIDA;
  estrela.textContent = marcada ? "★" : "☆";
  estrela.title = txt("spacedragon.auto.armaPreferida");
  estrela.addEventListener("click", (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    ator.setFlag(ID, "armaPreferida", marcada ? "" : item.id);
  });
  (linha.querySelector(".item-controls, .weapon-description") ?? linha).appendChild(estrela);
}

export function ligarAutomacao() {
  const desenha = (app, el) => {
    // A classe da ficha também: a nave aberta nela pode não ter a marca de tipo.
    if (ehNave(app?.actor) || app?.constructor?.name === "NaveSheet" || !app?.actor?.isOwner) return;
    const raiz = el?.querySelector ? el : el?.[0];
    // A linha, e não todo [data-item-id]: na aba de Poderes, o input e o select
    // de dentro da linha também levam esse atributo.
    for (const linha of raiz?.querySelectorAll?.("li.item[data-item-id]") ?? []) {
      if (linha.querySelector(`.${CLASSE_USAR}`)) continue;
      const item = app.actor.items?.get?.(linha.dataset.itemId);
      // A arma ataca pelos botões BAC e BAD da própria ficha (ataqueDaFicha).
      if (item?.type === "weapon") {
        desenharEstrela(linha, item, app.actor);
        continue;
      }
      const def = definicaoDoBotao(item, app.actor);
      if (!def) continue;
      const botao = linha.ownerDocument.createElement("button");
      botao.type = "button";
      botao.className = CLASSE_USAR;
      const rotulo = def.rotulo ?? txt("spacedragon.auto.usar");
      const restam = def.limite ? usosRestantes(app.actor, item, def.limite) : 0;
      botao.textContent = def.limite
        ? txt("spacedragon.auto.usarComLimite", { rotulo, restam, max: def.limite.vezes })
        : rotulo;
      botao.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        if (ev.shiftKey && def.limite) {
          gravarUsos(app.actor, item, def.limite, 0).catch((e) => console.error(`${ID} | recarregar ${item.name}`, e));
          return;
        }
        usarItem(app.actor, item, def).catch((e) => console.error(`${ID} | usar ${item.name}`, e));
      });
      // Dentro de uma célula que já existe: um filho novo na linha, que é flex
      // com colunas em porcentagem, espreme o nome e o dano.
      const casa = linha.querySelector(".item-controls, .weapon-description") ?? linha;
      casa.appendChild(botao);
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
