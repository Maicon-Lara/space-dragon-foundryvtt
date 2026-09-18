/**
 * Desativar Robôs (T3-2) na ficha, como os talentos do Gatuno.
 *
 * ── A REGRA, QUE NÃO É A DOS OUTROS TESTES ──────────────────────────────────
 *
 * É o único teste do Cientista em 1d20, e no sentido do Old Dragon 2: passa
 * com IGUAL OU MAIOR que o número da tabela. A linha é o nível do DISRUPTOR
 * POSITRÔNICO, e o disruptor "deverá ser atualizado pelo criador sempre que
 * este adquirir novos níveis, acompanhando-o até o 20° nível" (Cap. 8) — então
 * a linha é o nível do personagem, e o Shift-clique troca, para quem usa um
 * disruptor desatualizado ou emprestado.
 *
 * No lugar do número a tabela pode trazer:
 *
 *   A  desativa sem rolar      D  destrói sem rolar      N  não afeta
 *
 * QUANTOS robôs caem é outra rolagem, pelo dado da coluna de robôs da Ciência
 * (T1-5): 1d2 com Ciência 10–11, 1d20 com 28–29.
 *
 * O Niilógico (10º) e o Slicer do Star Wars REPROGRAMAM em vez de desativar:
 * "D" vira reprogramado para sempre e "A" controlável por 24 horas. O cartão
 * avisa; a rolagem é a mesma.
 */

import { FAIXAS, CAMPO_NA_FICHA, COLUNA, TIPOS_DE_ROBO, LETRAS_ROBO, DESATIVAR_ROBOS } from "./dados.js";

export const HABILIDADE_ROBOS = "Desativar Robôs";

const NOME_TIPO = {
  "sucata": "Sucata", "protótipo": "Protótipo", "repetidor": "Repetidor", "autômato": "Autômato",
  "humanoide": "Humanoide", "serviçal": "Serviçal", "metahumano": "Metahumano", "androide": "Androide",
};
export const nomeDoTipo = (t) => NOME_TIPO[t] ?? t;

function faixaDe(valor) {
  const v = Number(valor) || 0;
  if (v <= 1) return 0;
  if (v >= 29) return FAIXAS.length - 1;
  return FAIXAS.findIndex(([min, max]) => v >= min && v <= max);
}

const limita = (n) => Math.min(Math.max(Number(n) || 1, 1), DESATIVAR_ROBOS.length);

/** A célula da T3-2 e o que ela quer dizer. */
export function celulaRobo(nivelDisruptor, tipo) {
  const nivel = limita(nivelDisruptor);
  const cel = String(DESATIVAR_ROBOS[nivel - 1]?.[tipo] ?? "N");
  if (LETRAS_ROBO[cel]) return { nivel, tipo, cel, letra: cel, alvo: null };
  return { nivel, tipo, cel, letra: null, alvo: Number(cel) };
}

/** O dado de quantos robôs caem, pela Ciência (anotada no campo Inteligência). */
export function quantosRobos(ator) {
  const ciencia = Number(ator?.system?.[CAMPO_NA_FICHA.ciencia]) || 0;
  const dado = String(COLUNA["ciencia.robos"]?.[faixaDe(ciencia)] ?? "0");
  return { ciencia, dado };
}

/** Niilógico do 10º em diante, ou o Slicer do Star Wars: reprograma. */
export function reprograma(ator) {
  const nome = String(ator?.system?.class?.name ?? "");
  const nivel = Number(ator?.system?.level) || 1;
  return /^(Niilógico|Slicer)\b/.test(nome) && nivel >= 10;
}

export async function rolarDesativar(ator, { tipo, nivel = null } = {}) {
  const c = celulaRobo(nivel ?? ator?.system?.level, tipo);
  const { ciencia, dado } = quantosRobos(ator);
  const titulo = `Desativar Robôs — ${nomeDoTipo(tipo)}`;
  const rolls = [];
  const linhas = [];

  let passou;
  if (c.letra === "N") {
    passou = false;
    linhas.push(`<p class="result"><strong class="failure">Não afeta</strong> — ${LETRAS_ROBO.N}.</p>`);
  } else if (c.letra) {
    passou = true;
    linhas.push(`<p class="result"><strong class="success">${c.letra === "D" ? "Destruído" : "Automático"}</strong> — ${LETRAS_ROBO[c.letra]}.</p>`);
  } else {
    const r = await new Roll("1d20").evaluate();
    rolls.push(r);
    passou = r.total >= c.alvo;
    linhas.push(
      `<p class="result"><strong class="${passou ? "success" : "failure"}">${passou ? "Sucesso" : "Falha"}</strong>` +
      ` — rolou <strong>${r.total}</strong>, precisava ${c.alvo} ou mais</p>`
    );
  }

  if (passou) {
    if (/d/i.test(dado)) {
      const q = await new Roll(dado).evaluate();
      rolls.push(q);
      linhas.push(`<p class="result"><strong>${q.total}</strong> robô(s) — ${dado} pela Ciência ${ciencia}</p>`);
    } else if (Number(dado) > 0) {
      linhas.push(`<p class="result"><strong>${dado}</strong> robô — pela Ciência ${ciencia}</p>`);
    } else {
      linhas.push(`<p class="result"><em>Ciência ${ciencia || "—"}: a T1-5 não dá robô nenhum.</em></p>`);
    }
  }

  linhas.push(`<ul class="sd-parcelas"><li>linha do disruptor de ${c.nivel}º nível, coluna ${nomeDoTipo(tipo)}: <strong>${c.cel}</strong></li></ul>`);
  if (reprograma(ator) && c.letra !== "N") {
    linhas.push(`<p class="sd-nota"><em>${ator.system.class.name.split(" — ")[0]}: reprograma em vez de desativar — ` +
      `"D" obedece para sempre, "A" fica sob controle por 24 horas; os demais não são afetados.</em></p>`);
  }

  await ChatMessage.create({
    content: `<div class="title">${titulo}</div><div class="sd-teste">${linhas.join("")}</div>`,
    speaker: ChatMessage.getSpeaker({ actor: ator ?? undefined }),
    rolls,
    ...(rolls.length ? { sound: CONFIG.sounds?.dice } : {}),
  });
  return { ...c, passou, dado };
}

/** Diálogo do Shift-clique: outro nível de disruptor, ou outro tipo. */
export async function abrirDesativar(ator, tipo = TIPOS_DE_ROBO[0]) {
  const V2 = foundry.applications?.api?.DialogV2;
  if (!V2) return rolarDesativar(ator, { tipo });
  const nivel = limita(ator?.system?.level);
  const opcoes = TIPOS_DE_ROBO.map((t) => `<option value="${t}"${t === tipo ? " selected" : ""}>${nomeDoTipo(t)}</option>`).join("");
  const r = await V2.wait({
    window: { title: "Desativar Robôs — T3-2" },
    content:
      `<p class="sd-explica">1d20, passa com <strong>igual ou maior</strong>. A linha é o nível do disruptor.</p>` +
      `<div class="form-group"><label>Tipo de robô</label><select name="tipo">${opcoes}</select></div>` +
      `<div class="form-group"><label>Nível do disruptor</label><input type="number" name="nivel" value="${nivel}" min="1" max="20"></div>`,
    buttons: [
      { action: "ok", label: "Rolar", default: true, callback: (_e, botao) => ({ tipo: botao.form.elements.tipo.value, nivel: Number(botao.form.elements.nivel.value) }) },
      { action: "nao", label: "Cancelar", callback: () => null },
    ],
    rejectClose: false,
  });
  if (!r) return null;
  return rolarDesativar(ator, r);
}

/** O bloco da ficha: uma linha por tipo, com o alvo do nível atual. */
export function blocoRobos(ator, marca) {
  const nivel = limita(ator?.system?.level);
  const { ciencia, dado } = quantosRobos(ator);
  const linhas = TIPOS_DE_ROBO.map((t) => {
    const c = celulaRobo(nivel, t);
    const alvo = c.letra === "N" ? "—" : c.letra === "A" ? "auto" : c.letra === "D" ? "destrói" : `${c.alvo}+`;
    const botao = c.letra === "N"
      ? `<span class="sd-rolar sd-robo-imune" title="${LETRAS_ROBO.N}"><i class="fa-thin fa-ban"></i> ${nomeDoTipo(t)}</span>`
      : `<a class="sd-rolar" data-robo="${t}" title="Desativar ${nomeDoTipo(t)} — Shift: outro nível de disruptor">` +
        `<i class="fa-thin fa-dice-d20"></i> ${nomeDoTipo(t)}</a>`;
    return `<li class="sd-teste-linha">${botao}<span class="sd-alvo">${alvo}</span></li>`;
  }).join("");
  return (
    `<div class="${marca} sd-robos"><ul class="sd-testes">${linhas}</ul>` +
    `<p class="sd-rodape">1d20, passa com <strong>igual ou maior</strong>; disruptor de ${nivel}º nível. ` +
    `Quantidade: <strong>${/d/i.test(dado) || Number(dado) > 0 ? dado : "nenhum"}</strong> pela Ciência ${ciencia || "—"}. ` +
    `Shift-clique troca o nível do disruptor.</p></div>`
  );
}
