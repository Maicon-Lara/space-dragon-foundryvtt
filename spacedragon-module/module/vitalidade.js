/**
 * Pontos de vida por classe, e o dano crítico do Cosmonauta.
 *
 * ── PONTOS DE VIDA ──────────────────────────────────────────────────────────
 *
 * O livro é curto e específico:
 *
 *   · No 1º nível NÃO SE ROLA. O personagem recebe o MÁXIMO do dado de vida da
 *     classe, mais o ajuste de Constituição.
 *   · A cada novo nível, rola o dado da classe e aplica o ajuste.
 *   · A partir de certo nível a classe para de dar dados e passa a dar um
 *     número fixo de PV — é a coluna "+1 PV", "+2 PV" da tabela.
 *
 * O dado de vida vive em `class.system.hp`, e o número fixo vem da coluna `dv`
 * da progressão, que este módulo já carrega. O ajuste de Constituição sai da
 * T1-3 do Space Dragon, e não da tabela do Old Dragon 2 — ver atributos.js.
 *
 * ── DANO CRÍTICO ────────────────────────────────────────────────────────────
 *
 * Só o Cosmonauta tem, e é um MULTIPLICADOR do dano final, não uma chance:
 * ×2 até o 5º nível, ×3 até o 11º, ×4 até o 17º, ×5 do 18º em diante. O
 * Mercenário sobe um degrau com a arma de preferência.
 *
 * Não há o que rolar para saber se é crítico — isso é do sistema. O que este
 * arquivo faz é aplicar o multiplicador certo a um dano já rolado, que é a
 * parte que a mesa erra ao consultar a tabela de cabeça.
 */

import { PROGRESSAO, FAIXAS, CAMPO_NA_FICHA, COLUNA_DERIVADA } from "./dados.js";

const ID = "spacedragon";

function faixaDe(valor) {
  const v = Number(valor) || 0;
  if (v <= 1) return 0;
  if (v >= 29) return FAIXAS.length - 1;
  return FAIXAS.findIndex(([min, max]) => v >= min && v <= max);
}

/** O ajuste de Constituição pela T1-3, que é o que manda nos PV. */
function ajusteCon(ator) {
  const valor = Number(ator.system?.[CAMPO_NA_FICHA.constituicao]) || 0;
  return Number(COLUNA_DERIVADA.constituicao[faixaDe(valor)] ?? 0);
}

/** A classe-base por trás do item de classe: "Sabotador — Gatuno" → "Gatuno". */
function classeBase(ator) {
  const nome = ator.system?.class?.name ?? "";
  const partes = nome.split(" — ");
  return partes[partes.length - 1].trim();
}

const CHAVE = { Cientista: "CIENTISTA", Cosmonauta: "COSMONAUTA", Gatuno: "GATUNO", "Mentálico": "MENTALICO" };

/**
 * A célula `dv` da tabela da classe, no nível pedido.
 *
 * É "1", "2", … enquanto a classe dá dados, e vira "+1 PV", "+2 PV" quando ela
 * passa a dar um número fixo. O Mentálico chega a "–", que é nada.
 */
function celulaDV(ator, nivel) {
  const col = PROGRESSAO[CHAVE[classeBase(ator)]]?.dv;
  if (!col) return null;
  return col[Math.min(Math.max(nivel, 1), col.length) - 1] ?? null;
}

/** O dado de vida da classe, de `class.system.hp`. */
const dadoDe = (ator) => Number(ator.system?.class?.system?.hp) || 0;

/**
 * Rola os pontos de vida do nível atual e soma ao total.
 *
 * No 1º nível não rola: entrega o máximo do dado, que é a regra do livro.
 */
export async function rolarPV(ator = null, { nivel = null } = {}) {
  ator = ator ?? canvas?.tokens?.controlled?.[0]?.actor ?? game.user?.character ?? null;
  if (!ator?.system?.class) {
    ui.notifications.warn("A ficha precisa de uma classe para rolar pontos de vida.");
    return null;
  }
  const n = Number(nivel ?? ator.system?.level) || 1;
  const dado = dadoDe(ator);
  const cel = celulaDV(ator, n);
  const con = ajusteCon(ator);

  let ganho;
  let como;
  let roll = null;

  const fixo = String(cel ?? "").match(/\+(\d+)\s*PV/i);
  if (fixo) {
    // A classe parou de dar dados: o número da tabela é o ganho, e o livro não
    // manda somar Constituição de novo aqui.
    ganho = Number(fixo[1]);
    como = `${cel} da tabela, no ${n}º nível`;
  } else if (!cel || cel === "–" || cel === "-") {
    ganho = 0;
    como = `a tabela não dá PV no ${n}º nível`;
  } else if (n === 1) {
    ganho = dado + con;
    como = `máximo do d${dado} — no 1º nível não se rola`;
  } else {
    roll = await new Roll(`1d${dado}`).evaluate();
    ganho = roll.total + con;
    como = `1d${dado} deu ${roll.total}`;
  }

  // O livro garante o mínimo de 1 PV por nível a partir do 2º: uma
  // Constituição ruim não pode tirar vida de quem subiu de nível.
  if (n > 1 && ganho < 1 && !fixo && cel) {
    como += ` — elevado ao mínimo de 1`;
    ganho = 1;
  }

  const antes = Number(ator.system?.hp?.max) || 0;
  const depois = antes + ganho;
  await ator.update({ "system.hp.max": depois, "system.hp.value": depois });

  const sinal = con > 0 ? `+${con}` : `${con}`;
  await ChatMessage.create({
    content:
      `<div class="title">Pontos de Vida — ${n}º nível</div>` +
      `<div class="sd-teste">` +
      `<p class="result"><strong class="success">+${ganho} PV</strong> — total ${depois}</p>` +
      `<ul class="sd-parcelas"><li>${como}</li>` +
      (fixo || !cel ? "" : `<li>${sinal} <em>ajuste de Constituição (T1-3)</em></li>`) +
      `</ul></div>`,
    speaker: ChatMessage.getSpeaker({ actor: ator }),
    ...(roll ? { rolls: [roll], sound: CONFIG.sounds.dice } : {}),
  });

  return { ganho, total: depois };
}

/** O multiplicador de dano crítico do Cosmonauta, no nível dado. */
export function multiplicadorCritico(ator, nivel = null) {
  if (classeBase(ator) !== "Cosmonauta") return null;
  const n = Number(nivel ?? ator.system?.level) || 1;
  const col = PROGRESSAO.COSMONAUTA?.danoCritico;
  if (!col) return null;
  const cel = col[Math.min(Math.max(n, 1), col.length) - 1];
  return Number(String(cel ?? "").replace(/[^\d]/g, "")) || null;
}

/**
 * Aplica o multiplicador a um dano já rolado.
 *
 * `formula` é o dano da arma. O crítico do Space Dragon multiplica o DANO
 * FINAL, então rolamos uma vez e multiplicamos o resultado — não rolamos os
 * dados N vezes, que daria outra distribuição.
 */
export async function rolarCritico(ator, formula = null, { degrausExtra = 0 } = {}) {
  ator = ator ?? canvas?.tokens?.controlled?.[0]?.actor ?? game.user?.character ?? null;
  if (!ator) {
    ui.notifications.warn("Selecione o token do cosmonauta.");
    return null;
  }
  const base = multiplicadorCritico(ator);
  if (!base) {
    ui.notifications.warn("Dano crítico com multiplicador é habilidade de Cosmonauta.");
    return null;
  }
  if (!formula) {
    formula = await pedeFormula(base);
    if (!formula) return null;
  }
  const mult = base + Number(degrausExtra || 0);
  const roll = await new Roll(formula).evaluate();
  const total = roll.total * mult;

  await ChatMessage.create({
    content:
      `<div class="title">Dano Crítico ×${mult}</div>` +
      `<div class="sd-teste">` +
      `<p class="result"><strong class="success">${total}</strong> de dano</p>` +
      `<ul class="sd-parcelas">` +
      `<li>${formula} deu ${roll.total}</li>` +
      `<li>×${mult} <em>${ator.system?.level}º nível` +
      (degrausExtra ? `, ${degrausExtra > 0 ? "+" : ""}${degrausExtra} de especialização` : "") +
      `</em></li></ul>` +
      `<p class="sd-nota"><em>O multiplicador incide sobre o dano final, ` +
      `não sobre cada dado.</em></p></div>`,
    speaker: ChatMessage.getSpeaker({ actor: ator }),
    rolls: [roll],
    sound: CONFIG.sounds.dice,
  });
  return { mult, total };
}

/** Pergunta o dano da arma. O crítico multiplica o que a arma faz. */
async function pedeFormula(mult) {
  const conteudo = `
<form class="sd-dialogo">
  <p class="sd-explica">O crítico multiplica o <strong>dano final</strong> por
  <strong>×${mult}</strong> neste nível. Informe o dano da arma.</p>
  <div class="form-group"><label>Dano da arma</label>
  <input type="text" name="formula" value="1d8" placeholder="1d8+2"></div>
</form>`;
  const colhe = (form) => (form ? new FormDataExtended(form).object.formula : null);
  const V2 = foundry.applications?.api?.DialogV2;
  if (V2) {
    return V2.wait({
      window: { title: "Dano Crítico — Space Dragon" },
      content: conteudo,
      buttons: [
        { action: "ok", label: "Rolar", default: true, callback: (_e, b) => colhe(b.form) },
        { action: "nao", label: "Cancelar", callback: () => null },
      ],
      rejectClose: false,
    });
  }
  return new Promise((ok) => {
    new Dialog({
      title: "Dano Crítico — Space Dragon",
      content: conteudo,
      buttons: {
        ok: { label: "Rolar", callback: (h) => ok(colhe((h[0] ?? h).querySelector("form"))) },
        nao: { label: "Cancelar", callback: () => ok(null) },
      },
      default: "ok",
      close: () => ok(null),
    }).render(true);
  });
}
