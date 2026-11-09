/**
 * Anulação e contra-ataque mental (Cap. 9.5) e resistência mental (Cap. 9.6).
 *
 * ── A REGRA DO LIVRO ────────────────────────────────────────────────────────
 *
 *   · O mentálico ALVO de um poder pode anulá-lo na hora. Gasta do próprio
 *     alcance a Grandeza do poder e faz uma rolagem resistida: 1d6 + nível
 *     de cada um.
 *   · Pode gastar MAIS para ganhar bônus: +1 a cada 2% a mais, e o extra
 *     nunca passa da Grandeza que já gastou.
 *   · Defensor maior: o poder é anulado. Atacante maior: o poder funciona.
 *     Empate: CHOQUE MENTAL — 1d4 de dano mental, JPM de ambos para não ficar
 *     atordoado por 6d10 segundos, e o poder fracassa.
 *   · Defensor com o DOBRO do atacante, ou mais: pode realizar na hora um
 *     poder contra o atacante — que pode anulá-lo também. A disputa encadeia.
 *   · RM: a cada poder contra a criatura, d%. Igual ou acima da RM, o poder é
 *     efetivo; abaixo, aquele poder NUNCA MAIS a afeta. O gasto vale do mesmo
 *     jeito.
 *
 * ── COMO ISSO CHEGA À MESA ──────────────────────────────────────────────────
 *
 * O cartão do poder realizado traz um botão "Anular" para cada alvo
 * mentálico (os tokens marcados como alvo por quem realizou) e um genérico
 * quando não há alvo marcado — aí vale o token controlado ou o personagem de
 * quem clica. O dono do defensor clica, escolhe o gasto extra, e o módulo
 * rola, desconta e diz o resultado. Vencendo pelo dobro, o cartão traz o
 * botão "Contra-atacar", que abre os poderes do defensor e realiza o
 * escolhido contra o atacante — com um novo "Anular" para ele.
 *
 * O dano mental é dreno de Intelecto (Cap. 7.9) e o módulo não mexe no
 * atributo sozinho: o cartão diz quanto, e a ficha se ajusta à mão.
 */

import { rmDaRaca } from "./racas.js";
import { orcamento } from "./mental.js";
import { chassiDe } from "./chassi.js";

import { t as txt } from "./i18n.js";

const ID = "spacedragon";
const FLAG_GASTO = "alcanceGasto";
const FLAG_IMUNE = "imuneAPoderes";

export const BOTAO_ANULAR = "sd-anular";
export const BOTAO_CONTRA = "sd-contra-ataque";

const escapa = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const nivelDe = (ator) => Math.max(Number(ator?.system?.level) || 1, 1);

export const ehMentalico = (ator) => chassiDe(ator) === "Mentálico";

/** +1 a cada 2% a mais. */
export const bonusDoExtra = (extra) => Math.floor(Math.max(Number(extra) || 0, 0) / 2);

/** O extra cabe no que resta depois da Grandeza, e nunca passa dela. */
export const extraMaximo = (grandeza, restante) => Math.max(Math.min(grandeza, restante - grandeza), 0);

/** A rolagem resistida, já com os dados na mão. */
export function resolverAnulacao({ dadoDefensor, nivelDefensor, bonus = 0, dadoAtacante, nivelAtacante }) {
  const defensor = dadoDefensor + nivelDefensor + bonus;
  const atacante = dadoAtacante + nivelAtacante;
  if (defensor === atacante) return { defensor, atacante, resultado: "choque", contraAtaque: false };
  if (defensor > atacante) return { defensor, atacante, resultado: "anulado", contraAtaque: defensor >= 2 * atacante };
  return { defensor, atacante, resultado: "ineficaz", contraAtaque: false };
}

/** "15%" → 15. Sem número, sem RM. */
export function rmDe(ator) {
  const n = parseInt(String(ator?.getFlag?.(ID, "ameaca")?.rm ?? "").replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : rmDaRaca(ator);
}

const imunesDe = (ator) => ator?.getFlag?.(ID, FLAG_IMUNE) ?? [];

/**
 * O que acontece com cada alvo quando o poder é realizado: RM rolada para
 * quem tem, botão de anular para quem é mentálico. Devolve o HTML e as
 * rolagens, para o cartão do poder.
 */
export async function reacoesDosAlvos(atacante, item, alvos) {
  const g = Number(item?.system?.circle) || 1;
  const dados = `data-atacante="${escapa(atacante.uuid)}" data-grandeza="${g}" data-poder="${escapa(item.name)}"`;
  const rolls = [];
  const linhas = [];
  const botoes = [];

  for (const alvo of alvos) {
    if (alvo === atacante) continue;
    if (imunesDe(alvo).includes(item.name)) {
      linhas.push(`<li><strong>${escapa(alvo.name)}</strong> é <strong>imune</strong> a ${escapa(item.name)} — a RM já o barrou antes.</li>`);
      continue;
    }
    const rm = rmDe(alvo);
    if (rm !== null) {
      const r = await new Roll("1d100").evaluate();
      rolls.push(r);
      const efetivo = r.total >= rm;
      linhas.push(
        `<li>RM de <strong>${escapa(alvo.name)}</strong>: d% <strong>${r.total}</strong> contra <strong>${rm}%</strong> — ` +
        (efetivo
          ? `<strong class="success">efetivo</strong></li>`
          : `<strong class="failure">resistiu</strong>, e este poder nunca mais o afetará.</li>`)
      );
      if (!efetivo) {
        if (alvo.isOwner) await alvo.setFlag(ID, FLAG_IMUNE, [...imunesDe(alvo), item.name]);
        continue;
      }
    }
    if (ehMentalico(alvo)) {
      botoes.push(`<button type="button" class="${BOTAO_ANULAR}" ${dados} data-alvo="${escapa(alvo.uuid)}">Anular — ${escapa(alvo.name)}</button>`);
    }
  }
  // Sem alvo marcado, quem clica diz quem é o defensor.
  if (!alvos.length) botoes.push(`<button type="button" class="${BOTAO_ANULAR}" ${dados}>Anular este poder</button>`);

  const html =
    (linhas.length ? `<ul class="sd-parcelas">${linhas.join("")}</ul>` : "") +
    (botoes.length ? `<div class="sd-reacao-mental">${botoes.join("")}</div>` : "");
  return { html, rolls };
}

/** Pergunta o gasto extra. `null` é desistir. */
async function perguntarExtra(defensor, grandeza, restante) {
  const max = extraMaximo(grandeza, restante);
  const V2 = foundry.applications?.api?.DialogV2;
  if (!V2?.prompt) return 0;
  const r = await V2.prompt({
    window: { title: txt("spacedragon.janela.anular", { nome: defensor.name }) },
    content:
      `<p>Anular custa <strong>${grandeza}%</strong>; restam <strong>${restante}%</strong>.</p>` +
      `<p>Cada 2% a mais dá +1 na rolagem, até ${max}% a mais.</p>` +
      `<div class="form-group"><label>Gasto extra (%)</label>` +
      `<input type="number" name="extra" value="0" min="0" max="${max}" step="2" autofocus></div>`,
    ok: {
      label: txt("spacedragon.botao.rolar"),
      callback: (ev, botao) => Math.min(Math.max(Number(botao.form?.elements?.extra?.value) || 0, 0), max),
    },
    rejectClose: false,
  });
  return r ?? null;
}

/** JPM de qualquer ator: o personagem pela regra do livro, a ameaça pelo bloco. */
async function jpmDe(ator) {
  if (ator?.type === "character") {
    const { rolarJP } = await import("./jp.js");
    return rolarJP(ator, "jps");
  }
  const { rolarJPAmeaca } = await import("./ameaca.js");
  return rolarJPAmeaca(ator);
}

/**
 * Gasta, rola e conta o resultado. `extra` já vem validado. As opções existem
 * para o teste trocar a JPM.
 */
export async function anularPoder(defensor, atacante, grandeza, extra, nomePoder, { jpm = jpmDe } = {}) {
  const g = Number(grandeza) || 1;
  const o = orcamento(defensor);
  const ext = Math.min(Math.max(Number(extra) || 0, 0), extraMaximo(g, o.restante));
  if (g > o.restante) {
    ui.notifications.warn(txt("spacedragon.aviso.alcanceInsuficienteAnular", { restante: o.restante, custo: g }));
    return null;
  }
  const bonus = bonusDoExtra(ext);

  await defensor.setFlag(ID, FLAG_GASTO, o.gasto + g + ext);
  const depois = orcamento(defensor);

  const rDef = await new Roll("1d6").evaluate();
  const rAtk = await new Roll("1d6").evaluate();
  const rolls = [rDef, rAtk];
  const res = resolverAnulacao({
    dadoDefensor: rDef.total, nivelDefensor: nivelDe(defensor), bonus,
    dadoAtacante: rAtk.total, nivelAtacante: nivelDe(atacante),
  });

  let corpo =
    `<p><strong>${escapa(defensor.name)}</strong>: 1d6 <strong>${rDef.total}</strong> + nível ${nivelDe(defensor)}` +
    (bonus ? ` + ${bonus} (gastou ${ext}% a mais)` : "") + ` = <strong>${res.defensor}</strong></p>` +
    `<p><strong>${escapa(atacante.name)}</strong>: 1d6 <strong>${rAtk.total}</strong> + nível ${nivelDe(atacante)} = <strong>${res.atacante}</strong></p>`;

  let choque = null;
  if (res.resultado === "anulado") {
    corpo += `<p class="result"><strong class="success">Anulado</strong> — ${escapa(nomePoder)} não tem efeito.</p>`;
    if (res.contraAtaque) {
      corpo +=
        `<p>Venceu pelo dobro: pode realizar <strong>agora</strong> um poder contra ${escapa(atacante.name)}.</p>` +
        `<div class="sd-reacao-mental"><button type="button" class="${BOTAO_CONTRA}" ` +
        `data-atacante="${escapa(defensor.uuid)}" data-alvo="${escapa(atacante.uuid)}">Contra-atacar</button></div>`;
    }
  } else if (res.resultado === "ineficaz") {
    corpo += `<p class="result"><strong class="failure">Anulação ineficaz</strong> — ${escapa(nomePoder)} funciona normalmente.</p>`;
  } else {
    const dDef = await new Roll("1d4").evaluate();
    const dAtk = await new Roll("1d4").evaluate();
    rolls.push(dDef, dAtk);
    choque = { defensor: dDef.total, atacante: dAtk.total };
    corpo +=
      `<p class="result"><strong class="failure">Choque mental</strong> — ${escapa(nomePoder)} fracassa.</p>` +
      `<ul class="sd-parcelas">` +
      `<li>${escapa(defensor.name)}: <strong>${dDef.total}</strong> de dano mental</li>` +
      `<li>${escapa(atacante.name)}: <strong>${dAtk.total}</strong> de dano mental</li></ul>` +
      `<p><em>Dano mental é dreno de Intelecto (Cap. 7.9): baixe o atributo na ficha. O mentálico perde na hora ` +
      `o bônus de alcance mental do Intelecto. Os dois fazem JPM para não ficar atordoados por 6d10 segundos.</em></p>`;
  }
  corpo += `<ul class="sd-parcelas"><li>${escapa(defensor.name)} gastou <strong>${g + ext}%</strong> — restam <strong>${depois.restante}%</strong> de ${depois.total}%</li></ul>`;

  await ChatMessage.create({
    content: `<div class="title">Anulação — ${escapa(nomePoder)}</div><div class="sd-teste">${corpo}</div>`,
    speaker: ChatMessage.getSpeaker({ actor: defensor }),
    rolls,
    sound: CONFIG.sounds?.dice,
  });

  if (choque) {
    for (const ator of [defensor, atacante]) {
      const jp = await jpm(ator);
      if (jp && !jp.passou) {
        const s = await new Roll("6d10").evaluate();
        await ChatMessage.create({
          content: `<div class="sd-teste"><p><strong>${escapa(ator.name)}</strong> fica <strong>atordoado</strong> por <strong>${s.total} segundos</strong> (6d10).</p></div>`,
          speaker: ChatMessage.getSpeaker({ actor: ator }),
          rolls: [s],
          sound: CONFIG.sounds?.dice,
        });
      }
    }
  }
  return { ...res, bonus, gasto: g + ext, restante: depois.restante, choque };
}

/** Quem defende: o alvo do botão, senão o token controlado ou o personagem. */
async function defensorDoBotao(b) {
  if (b.dataset.alvo) return globalThis.fromUuid?.(b.dataset.alvo);
  return globalThis.canvas?.tokens?.controlled?.[0]?.actor ?? globalThis.game?.user?.character ?? null;
}

async function cliqueAnular(b) {
  const defensor = await defensorDoBotao(b);
  const atacante = await globalThis.fromUuid?.(b.dataset.atacante);
  if (!defensor || !atacante) return ui.notifications.warn(txt("spacedragon.aviso.semDefensorMental"));
  if (!defensor.isOwner) return ui.notifications.warn(txt("spacedragon.aviso.defensorDeOutro", { nome: defensor.name }));
  if (!ehMentalico(defensor)) return ui.notifications.warn(txt("spacedragon.aviso.soMentalicoAnula", { nome: defensor.name }));
  const g = Number(b.dataset.grandeza) || 1;
  const o = orcamento(defensor);
  if (g > o.restante) return ui.notifications.warn(txt("spacedragon.aviso.alcanceInsuficienteAnular", { restante: o.restante, custo: g }));
  const extra = await perguntarExtra(defensor, g, o.restante);
  if (extra === null) return null;
  b.disabled = true;
  return anularPoder(defensor, atacante, g, extra, b.dataset.poder);
}

async function cliqueContraAtaque(b) {
  const ator = await globalThis.fromUuid?.(b.dataset.atacante);
  const alvo = await globalThis.fromUuid?.(b.dataset.alvo);
  if (!ator || !alvo) return null;
  if (!ator.isOwner) return ui.notifications.warn(txt("spacedragon.aviso.defensorDeOutro", { nome: ator.name }));
  const o = orcamento(ator);
  const poderes = [...(ator.items ?? [])]
    .filter((i) => i.type === "spell")
    .filter((i) => (Number(i.system?.circle) || 1) <= Math.min(o.limite, o.restante))
    .sort((a, c) => (Number(a.system?.circle) || 1) - (Number(c.system?.circle) || 1) || a.name.localeCompare(c.name));
  if (!poderes.length) return ui.notifications.warn(txt("spacedragon.aviso.semPoderParaContra", { nome: ator.name }));

  const V2 = foundry.applications?.api?.DialogV2;
  if (!V2?.prompt) return null;
  const id = await V2.prompt({
    window: { title: txt("spacedragon.janela.contraAtaque", { alvo: alvo.name }) },
    content:
      `<div class="form-group"><label>Poder</label><select name="poder" autofocus>` +
      poderes.map((p) => `<option value="${p.id}">${escapa(p.name)} — ${Number(p.system?.circle) || 1}ª Grandeza</option>`).join("") +
      `</select></div>`,
    ok: { label: txt("spacedragon.botao.realizar"), callback: (ev, botao) => botao.form?.elements?.poder?.value },
    rejectClose: false,
  });
  const item = id ? ator.items.get(id) : null;
  if (!item) return null;
  b.disabled = true;
  const { realizarPoder } = await import("./poder-mental.js");
  return realizarPoder(ator, item, { alvos: [alvo] });
}

/** Os dois botões dos cartões. Ligado no `ready`. */
export function ligarAnulacao() {
  globalThis.Hooks?.on?.("renderChatMessageHTML", (_msg, html) => {
    for (const [classe, acao] of [[BOTAO_ANULAR, cliqueAnular], [BOTAO_CONTRA, cliqueContraAtaque]]) {
      for (const b of html?.querySelectorAll?.(`.${classe}`) ?? []) {
        if (b.dataset.ligado) continue;
        b.dataset.ligado = "1";
        b.addEventListener("click", (ev) => {
          ev.preventDefault();
          acao(b).catch((e) => console.error(`${ID} | ${classe} falhou`, e));
        });
      }
    }
  });
  return true;
}
