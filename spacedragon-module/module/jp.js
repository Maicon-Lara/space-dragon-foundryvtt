/**
 * Jogadas de Proteção pela regra do Space Dragon.
 *
 * ── O QUE A FICHA DO SISTEMA FAZIA ──────────────────────────────────────────
 *
 * O Old Dragon 2 soma JP da classe + bônus de espécie + modificador num número
 * só, e a JP passa se o d20 sair MENOR OU IGUAL a ele. O Space Dragon faz o
 * contrário (Cap. 4.4, pág. 59): "rola-se 1d20 e aplica-se o modificador
 * adequado de Destreza, Constituição ou Intelecto. O resultado final precisa
 * ser IGUAL OU SUPERIOR ao indicado como valor da jogada de proteção na tabela
 * da classe". Por isso as JP da tabela DESCEM com o nível.
 *
 * Um Cosmonauta de 1º, JP 16, Destreza +2: pelo livro passa com 14 ou mais no
 * d20 (35%); pela ficha do sistema passava com 18 ou menos (90%).
 *
 * Os MODIFICADORES já estavam certos — a escala do módulo entrega a coluna de
 * proteção de cada atributo: JPR a da Destreza (T1-2), JPF a da Constituição
 * (T1-3), JPM a proteção mental do Intelecto (T1-4). O erro era a direção.
 *
 * ── O QUE MUDA NA FICHA DO SPACE DRAGON ─────────────────────────────────────
 *
 *   · O número grande de cada JP passa a ser o MÍNIMO NO d20: JP da classe −
 *     modificador − bônus de espécie. "JPR 14" = tire 14 ou mais. Os campos
 *     pequenos (classe, espécie, modificador) continuam como estão.
 *   · O botão rola 1d20 + modificador contra a JP da classe. Shift-clique abre
 *     o modificador de situação.
 */

import { atorUsaFichaSD } from "./ficha.js";

const ID = "spacedragon";

/** As três JP: o nome no sistema, o rótulo do Space Dragon e o atributo. */
export const JPS = {
  jpd: { rotulo: "JPR", nome: "Jogada de Proteção de Reflexos", mod: "mod_destreza", atributo: "Destreza" },
  jpc: { rotulo: "JPF", nome: "Jogada de Proteção Física", mod: "mod_constituicao", atributo: "Constituição" },
  jps: { rotulo: "JPM", nome: "Jogada de Proteção Mental", mod: "mod_sabedoria", atributo: "Intelecto" },
};

/** Modificador que entra na rolagem: o do atributo mais o bônus de espécie. */
export function modificadorDaJP(sistema, qual) {
  const j = JPS[qual];
  return (Number(sistema[j.mod]) || 0) + (Number(sistema[`${qual}_race_bonus`]) || 0);
}

/**
 * Troca `jpd_total`, `jpc_total` e `jps_total` — o número grande da ficha —
 * pelo mínimo no d20, para quem usa a ficha do Space Dragon. O personagem de
 * Old Dragon 2 no mesmo mundo continua com a conta do sistema.
 */
let originais = null;

export function aplicarJP() {
  const proto = CONFIG.Actor?.dataModels?.character?.prototype;
  if (!proto || originais) return !!originais;
  originais = {};
  for (const qual of Object.keys(JPS)) {
    const desc = Object.getOwnPropertyDescriptor(proto, `${qual}_total`);
    if (!desc?.get) {
      console.warn(`${ID} | ${qual}_total não é getter — a JP fica a do sistema`);
      continue;
    }
    originais[qual] = desc.get;
    Object.defineProperty(proto, `${qual}_total`, {
      configurable: true,
      get() {
        if (!atorUsaFichaSD(this.parent)) return originais[qual].call(this);
        return (Number(this.jp) || 0) - modificadorDaJP(this, qual);
      },
    });
  }
  return true;
}

/** Rola a JP pela regra do livro e manda o cartão para o chat. */
export async function rolarJP(ator, qual, situacional = 0) {
  const j = JPS[qual];
  if (!j) return null;
  const s = ator.system;
  const alvo = Number(s.jp) || 0;
  const mod = modificadorDaJP(s, qual);
  const sit = Number(situacional) || 0;

  const roll = await new Roll(`1d20 + ${mod + sit}`).evaluate();
  const passou = roll.total >= alvo;
  const sinal = (n) => (n >= 0 ? `+${n}` : `${n}`);

  await ChatMessage.create({
    content:
      `<div class="title">${j.rotulo} — ${j.nome}</div>` +
      `<div class="sd-teste">` +
      `<p>1d20 <strong>${roll.total - mod - sit}</strong> ${sinal(mod)} (${j.atributo}${s[`${qual}_race_bonus`] ? " e espécie" : ""})` +
      (sit ? ` ${sinal(sit)} (situação)` : "") +
      ` = <strong>${roll.total}</strong> contra JP <strong>${alvo}</strong></p>` +
      `<p class="result"><strong class="${passou ? "success" : "failure"}">${passou ? "Sucesso" : "Falha"}</strong></p>` +
      `</div>`,
    speaker: ChatMessage.getSpeaker({ actor: ator }),
    rolls: [roll],
    sound: CONFIG.sounds?.dice,
  });
  return { roll, passou, alvo, mod };
}

/** Pede o modificador de situação (Shift-clique). */
export async function perguntarSituacao(rotulo) {
  const V2 = foundry.applications?.api?.DialogV2;
  if (!V2?.prompt) return 0;
  const r = await V2.prompt({
    window: { title: `${rotulo} — modificador de situação` },
    content: `<div class="form-group"><label>Modificador de situação</label><input type="number" name="sit" value="0" autofocus></div>`,
    ok: { label: "Rolar", callback: (ev, botao) => Number(botao.form?.elements?.sit?.value) || 0 },
    rejectClose: false,
  });
  return r ?? null;
}
