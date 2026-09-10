/**
 * O alcance mental como orçamento, na aba de Poderes.
 *
 * ── A REGRA ─────────────────────────────────────────────────────────────────
 *
 * O alcance mental NÃO é uma chance de acertar: é quanto o mentálico pode
 * gastar por dia, em porcentagem. Usar um poder desconta um percentual
 * <strong>igual à Grandeza dele</strong> — um poder de 3ª custa 3%.
 *
 *   · o total vem da tabela da classe, pelo nível: 1% no 1º, 150% no 20º;
 *   · a coluna "Alcance Mental Adicional" do Intelecto soma a esse total;
 *   · a Grandeza mental limite corta o que ele consegue tentar, e sobe um
 *     degrau a cada dois níveis.
 *
 * Isso não se parece com nada que a aba de Magias do Old Dragon 2 faça. Lá há
 * memorização e espaços por círculo; aqui há uma bolsa de pontos que se esvazia.
 *
 * ── ONDE O GASTO FICA GUARDADO ──────────────────────────────────────────────
 *
 * Em `flags.spacedragon` do próprio ator — dois números, o gasto e o dia em que
 * ele foi zerado. Não toca em `system.*`: o módulo não inventa campo no sistema
 * de outra pessoa, e desinstalar deixa as flags para trás, inertes.
 *
 * ── O QUE ELE NÃO DECIDE ────────────────────────────────────────────────────
 *
 * Se o poder deu certo. Isso é outro teste — o de reproduzir e aprender, que
 * sai inteiro do Intelecto e tem botão próprio. Este painel só cuida do
 * orçamento.
 */

import { PROGRESSAO, COLUNA, FAIXAS, CAMPO_NA_FICHA } from "./dados.js";

const ID = "spacedragon";
const MARCA = "spacedragon-mental";
const FLAG_GASTO = "alcanceGasto";

const escapa = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function faixaDe(valor) {
  const v = Number(valor) || 0;
  if (v <= 1) return 0;
  if (v >= 29) return FAIXAS.length - 1;
  return FAIXAS.findIndex(([min, max]) => v >= min && v <= max);
}

/** "Hipercientista — Mentálico" → "Mentálico". */
function classeBase(ator) {
  const partes = (ator.system?.class?.name ?? "").split(" — ");
  return partes[partes.length - 1].trim();
}

const numero = (s) => Number(String(s ?? "").replace("%", "").replace(/[^\d-]/g, "")) || 0;

/**
 * O orçamento do dia: total, gasto e restante, mais a Grandeza limite.
 *
 * O total é a soma de duas fontes, e o painel mostra as duas separadas — sem
 * isso o jogador não tem como perceber que o Intelecto ficou em branco na
 * ficha.
 */
export function orcamento(ator) {
  const nivel = Math.min(Math.max(Number(ator.system?.level) || 1, 1), 20);
  const daClasse = numero(PROGRESSAO.MENTALICO?.alcanceMental?.[nivel - 1]);

  const intelecto = Number(ator.system?.[CAMPO_NA_FICHA.intelecto]) || 0;
  const doIntelecto = Number(COLUNA["intelecto.alcanceAdicional"]?.[faixaDe(intelecto)] ?? 0);

  // A coluna traz "1ª", "2ª" ou um traço nos níveis em que não sobe. O limite
  // é o ÚLTIMO valor preenchido até o nível atual — o traço não zera nada.
  const col = PROGRESSAO.MENTALICO?.grandezaMental ?? [];
  let limite = 1;
  for (let i = 0; i < nivel; i += 1) {
    const n = parseInt(col[i], 10);
    if (Number.isFinite(n)) limite = n;
  }

  const gasto = Number(ator.getFlag?.(ID, FLAG_GASTO) ?? 0);
  const total = daClasse + doIntelecto;
  return { nivel, daClasse, doIntelecto, total, gasto, restante: total - gasto, limite, intelecto };
}

/** Gasta o custo de uma Grandeza, ou avisa se não couber no que resta. */
export async function gastar(ator, grandeza) {
  const o = orcamento(ator);
  const custo = Number(grandeza) || 0;

  if (custo > o.limite) {
    ui.notifications.warn(
      `${grandeza}ª Grandeza está acima do limite deste mentálico, que é a ${o.limite}ª.`
    );
    return null;
  }
  if (custo > o.restante) {
    ui.notifications.warn(
      `Faltam ${custo - o.restante}% de alcance mental: restam ${o.restante}% e o poder custa ${custo}%.`
    );
    return null;
  }

  await ator.setFlag(ID, FLAG_GASTO, o.gasto + custo);
  const depois = orcamento(ator);

  await ChatMessage.create({
    content:
      `<div class="title">Alcance Mental</div>` +
      `<div class="sd-teste">` +
      `<p class="result">Gastou <strong>${custo}%</strong> — poder de ${grandeza}ª Grandeza</p>` +
      `<ul class="sd-parcelas"><li>restam <strong>${depois.restante}%</strong> de ${depois.total}%</li></ul>` +
      `</div>`,
    speaker: ChatMessage.getSpeaker({ actor: ator }),
  });
  return depois;
}

/** Zera o gasto: um dia novo. */
export async function descansar(ator) {
  ator = ator ?? canvas?.tokens?.controlled?.[0]?.actor ?? game.user?.character ?? null;
  if (!ator) {
    ui.notifications.warn("Selecione o token do mentálico.");
    return null;
  }
  await ator.setFlag(ID, FLAG_GASTO, 0);
  const o = orcamento(ator);
  await ChatMessage.create({
    content:
      `<div class="title">Alcance Mental</div>` +
      `<div class="sd-teste"><p class="result">Dia novo — <strong>${o.total}%</strong> disponíveis</p></div>`,
    speaker: ChatMessage.getSpeaker({ actor: ator }),
  });
  return o;
}

/** A barra de 20 casas. Texto puro, para funcionar em qualquer tema. */
function barra(gasto, total) {
  const casas = 20;
  const cheias = total > 0 ? Math.min(casas, Math.round((gasto / total) * casas)) : 0;
  return "▮".repeat(cheias) + "▯".repeat(casas - cheias);
}

function painel(ator) {
  const o = orcamento(ator);
  const fonte = o.doIntelecto
    ? `${o.daClasse}% da classe + ${o.doIntelecto}% do Intelecto`
    : o.intelecto
      ? `${o.daClasse}% da classe — o Intelecto ${o.intelecto} não acrescenta nada`
      : `${o.daClasse}% da classe — <span class="sd-alerta" title="Preencha o Intelecto no campo Sabedoria da ficha">⚠ Intelecto em branco</span>`;

  return (
    `<div class="${MARCA}">` +
    `<div class="sd-mental-cabeca">` +
    `<span class="sd-mental-total">${o.total}%</span>` +
    `<span class="sd-mental-fonte">${fonte}</span>` +
    `<a class="sd-descansar" title="Zera o gasto do dia">dia novo</a>` +
    `</div>` +
    `<div class="sd-mental-barra">${barra(o.gasto, o.total)}</div>` +
    `<div class="sd-mental-rodape">` +
    `<span>gasto <strong>${o.gasto}%</strong></span>` +
    `<span>restam <strong>${o.restante}%</strong></span>` +
    `<span>Grandeza limite: <strong>${o.limite}ª</strong></span>` +
    `</div>` +
    `<p class="sd-explica">Cada poder custa uma porcentagem igual à Grandeza dele. ` +
    `Isto é o orçamento — se o poder <em>dá certo</em> é outro teste, o de reproduzir e aprender.</p>` +
    `</div>`
  );
}

/** "5º Grandeza" → 5. O rótulo vem do template do sistema. */
const grandezaDo = (el) => Number(String(el?.textContent ?? "").match(/(\d+)/)?.[1] ?? 0);

function injeta(app, elemento) {
  try {
    const raiz = elemento?.querySelectorAll ? elemento : elemento?.[0];
    const ator = app?.actor ?? app?.document;
    if (!raiz?.querySelectorAll || ator?.type !== "character") return;
    if (classeBase(ator) !== "Mentálico") return;

    const aba = raiz.querySelector(".character-tab-spells");
    if (!aba) return;

    for (const velho of raiz.querySelectorAll(`.${MARCA}`)) velho.remove();
    aba.insertAdjacentHTML("afterbegin", painel(ator));

    const o = orcamento(ator);

    // Cada cabeçalho de Grandeza ganha o custo, e as acima do limite apagam.
    for (const cabeca of raiz.querySelectorAll(".character-tab-spells .circle")) {
      const g = grandezaDo(cabeca);
      if (!g) continue;
      const acima = g > o.limite;
      cabeca.classList.add(acima ? "sd-acima" : "sd-dentro");
      cabeca.insertAdjacentHTML(
        "beforeend",
        acima
          ? `<span class="sd-custo sd-custo-acima">acima do seu limite</span>`
          : `<span class="sd-custo">custa ${g}%</span>`
      );

      // O <ol> dos poderes daquela Grandeza é o irmão seguinte.
      const lista = cabeca.nextElementSibling;
      if (!lista || lista.tagName !== "OL") continue;
      for (const li of lista.querySelectorAll(".item")) {
        if (acima) {
          li.classList.add("sd-apagado");
          continue;
        }
        li.insertAdjacentHTML(
          "beforeend",
          `<a class="sd-usar" data-grandeza="${g}" title="Gasta ${g}% do alcance mental">usar ${g}%</a>`
        );
      }
    }

    for (const a of raiz.querySelectorAll(`.sd-usar`)) {
      a.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        return gastar(ator, Number(ev.currentTarget.dataset.grandeza));
      });
    }
    const dormir = raiz.querySelector(`.${MARCA} .sd-descansar`);
    dormir?.addEventListener("click", (ev) => {
      ev.preventDefault();
      return descansar(ator);
    });
  } catch (e) {
    console.warn(`${ID} | painel de alcance mental não pôde ser desenhado`, e);
  }
}

export function ligarMental() {
  Hooks.on("renderOD2CharacterSheet", injeta);
  Hooks.on("renderActorSheet", (app, el) => {
    if (app?.constructor?.name !== "OD2CharacterSheet") injeta(app, el);
  });
  console.log(`${ID} | alcance mental ligado à aba de Poderes`);
}
