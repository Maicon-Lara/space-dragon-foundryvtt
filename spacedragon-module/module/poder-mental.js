/**
 * Realizar um poder mental — a regra do Space Dragon, no lugar da magia do
 * Old Dragon 2.
 *
 * ── O QUE A FICHA DO SISTEMA FAZIA ──────────────────────────────────────────
 *
 * Tratava o poder como magia vanciana: memorizar, escolher quantos espaços,
 * marcar cada uso do dia. O botão de lançar RECUSAVA o poder "não memorizado"
 * ou sem espaço. Nada disso existe no Space Dragon, e o mentálico ficava preso
 * a uma mecânica de outro jogo.
 *
 * ── A REGRA DO LIVRO (Cap. 9.2 a 9.4) ───────────────────────────────────────
 *
 *   · Poder CONHECIDO se realiza livremente, respeitando a Grandeza-limite e o
 *     alcance mental do dia.
 *   · Poder DESCONHECIDO pede, ANTES, 1d100 ≤ "realizar e aprender" do
 *     Intelecto (T1-4). Falhou: não realiza, e desconta a Grandeza mesmo
 *     assim. Acima do DOBRO da chance: efeito colateral a critério do Mestre.
 *   · Realizou um desconhecido: PODE fazer uma segunda rolagem, com a mesma
 *     chance, para memorizá-lo de vez.
 *   · Custa, em %, a Grandeza do poder — "mesmo que ele seja anulado ou não
 *     seja realizado com sucesso". E o alcance nunca pode ser ultrapassado.
 *
 * ── ONDE ISSO MORA NA FICHA ─────────────────────────────────────────────────
 *
 * A caixa de "memorizar" do sistema passa a significar CONHECIDO — é o mesmo
 * dado (a flag `memorized`), com o nome certo. Espaços e usos por dia somem.
 */

import { orcamento } from "./mental.js";
import { preparar } from "./testes.js";
import { CAMPO_NA_FICHA } from "./dados.js";

const ID = "spacedragon";
const FLAG_GASTO = "alcanceGasto";

/** O mentálico conhece este poder? É a caixa de "memorizar" do sistema. */
export const conhecido = (item) => !!item?.getFlag?.("olddragon2e", "spell")?.memorized;

/** A chance de realizar e aprender, pela T1-4 do Intelecto. */
function chance(ator) {
  const valores = { intelecto: Number(ator.system?.[CAMPO_NA_FICHA.intelecto]) || 0 };
  return preparar("realizar-poder", { nivel: Number(ator.system?.level) || 1, valores }).alvo;
}

/** Pergunta sim/não, com o diálogo do v13 e o antigo como reserva. */
async function confirmar(titulo, texto) {
  const V2 = foundry.applications?.api?.DialogV2;
  if (V2?.confirm) return V2.confirm({ window: { title: titulo }, content: `<p>${texto}</p>`, rejectClose: false });
  return Dialog.confirm({ title: titulo, content: `<p>${texto}</p>` });
}

/** O cartão do poder, no formato do sistema, para quem conseguiu realizá-lo. */
async function cartaoDoSistema(ator, item) {
  try {
    const render = foundry.applications?.handlebars?.renderTemplate ?? globalThis.renderTemplate;
    return await render("systems/olddragon2e/templates/chat/spell-chat.hbs", {
      name: item.name, owner: ator.id, id: item._id, system: item.system,
    });
  } catch {
    return "";
  }
}

/**
 * Realiza o poder: confere limite e alcance, rola se for desconhecido,
 * desconta a Grandeza e, se deu certo com um desconhecido, oferece aprender.
 */
export async function realizarPoder(ator, item, { perguntar = confirmar } = {}) {
  const g = Number(item?.system?.circle) || 1;
  const o = orcamento(ator);

  if (g > o.limite) {
    ui.notifications.warn(`${item.name} é de ${g}ª Grandeza, acima do limite deste personagem, que é a ${o.limite}ª.`);
    return null;
  }
  if (g > o.restante) {
    ui.notifications.warn(
      `Faltam ${g - o.restante}% de alcance mental: restam ${o.restante}% e ${item.name} custa ${g}%. ` +
      "O livro é taxativo: o alcance nunca pode ser ultrapassado."
    );
    return null;
  }

  const sabe = conhecido(item);
  const alvo = sabe ? null : chance(ator);
  const rolls = [];
  let realizou = true;
  let corpo = "";

  if (!sabe) {
    const r = await new Roll("1d100").evaluate();
    rolls.push(r);
    realizou = r.total <= alvo;
    const colateral = !realizou && r.total > 2 * alvo;
    corpo +=
      `<p>Poder <strong>desconhecido</strong>: 1d100 <strong>${r.total}</strong> contra <strong>${alvo}%</strong> ` +
      `(realizar e aprender, pelo Intelecto)</p>` +
      `<p class="result"><strong class="${realizou ? "success" : "failure"}">${realizou ? "Realizou" : "Não realizou"}</strong></p>` +
      (colateral
        ? "<p><em>Passou do dobro da chance: <strong>efeito colateral</strong> a critério do Mestre, e só poderá tentar realizá-lo ou aprendê-lo de novo em <strong>1d4 dias</strong>.</em></p>"
        : !realizou
          ? "<p><em>Só poderá tentar aprendê-lo daqui a <strong>24 horas</strong> — mas pode tentar usá-lo de novo.</em></p>"
          : "");
  }

  // Desconta SEMPRE: "mesmo que ele seja anulado ou não seja realizado".
  await ator.setFlag(ID, FLAG_GASTO, o.gasto + g);
  const depois = orcamento(ator);
  corpo += `<ul class="sd-parcelas"><li>gastou <strong>${g}%</strong> — restam <strong>${depois.restante}%</strong> de ${depois.total}%</li></ul>`;

  const cartao = realizou ? await cartaoDoSistema(ator, item) : "";
  await ChatMessage.create({
    content: `<div class="title">${item.name} — ${g}ª Grandeza</div><div class="sd-teste">${corpo}</div>${cartao}`,
    speaker: ChatMessage.getSpeaker({ actor: ator }),
    rolls,
    sound: rolls.length ? CONFIG.sounds?.dice : null,
  });

  // Realizou um desconhecido: o livro deixa tentar memorizar agora.
  let aprendeu = null;
  if (!sabe && realizou) {
    const quer = await perguntar(
      `Aprender ${item.name}?`,
      `Você realizou um poder desconhecido. Pode fazer uma <strong>segunda rolagem</strong>, com a mesma chance ` +
      `(<strong>${alvo}%</strong>), para memorizá-lo de vez e não precisar mais rolar para usá-lo.`
    );
    if (quer) {
      const r2 = await new Roll("1d100").evaluate();
      aprendeu = r2.total <= alvo;
      if (aprendeu) await item.update({ "flags.olddragon2e.spell.memorized": true });
      await ChatMessage.create({
        content:
          `<div class="title">Aprender ${item.name}</div><div class="sd-teste">` +
          `<p>1d100 <strong>${r2.total}</strong> contra <strong>${alvo}%</strong></p>` +
          `<p class="result"><strong class="${aprendeu ? "success" : "failure"}">${aprendeu ? "Aprendeu — agora é um poder conhecido" : "Não aprendeu"}</strong></p></div>`,
        speaker: ChatMessage.getSpeaker({ actor: ator }),
        rolls: [r2],
        sound: CONFIG.sounds?.dice,
      });
    }
  }

  return { grandeza: g, conhecido: sabe, realizou, aprendeu, restante: depois.restante };
}
