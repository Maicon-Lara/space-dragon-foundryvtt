/**
 * Ordem de ação do Space Dragon.
 *
 * ── POR QUE ISTO PRECISA DE CÓDIGO ──────────────────────────────────────────
 *
 * Não é iniciativa com outro nome. A T7-2 manda:
 *
 *   · quem ataca rola o DADO DE DANO DA ARMA;
 *   · quem usa aparato ou poder mental usa o NÍVEL TECNOLÓGICO ou a GRANDEZA,
 *     que é um número fixo, sem rolagem;
 *   · quem só se desloca usa 10 menos o modificador de Destreza;
 *   · age primeiro o MENOR resultado;
 *   · a rodada dura o MAIOR resultado × 2 segundos.
 *
 * Três coisas aí o rastreador de combate do Foundry não faz: a fórmula muda por
 * AÇÃO e não por personagem, a ordem é CRESCENTE, e a duração da rodada é
 * calculada. O sistema Old Dragon 2 rola 1d20 e ordena do maior para o menor —
 * o oposto, com a fórmula errada.
 *
 * ── O QUE ESTE ARQUIVO FAZ, E O QUE NÃO FAZ ─────────────────────────────────
 *
 * Faz: uma janela onde a mesa declara o que cada um vai fazer, rola o que
 * precisa ser rolado, ordena do menor para o maior e diz quanto dura a rodada.
 *
 * Não faz: mexer no rastreador de combate do Foundry. Reescrever a iniciativa
 * de um sistema alheio quebraria todo módulo de combate instalado, e a ordem do
 * Space Dragon muda a cada rodada conforme a ação declarada — não é um valor
 * que se guarda no combatente.
 */

const ID = "spacedragon";

// Escape próprio: o nome do combatente é digitado pela mesa e vai para dentro
// de HTML. `foundry.utils.escapeHTML` existiria, mas depender de um global
// aninhado significa estourar se ele mudar de lugar — e o encadeamento
// opcional em `foundry.utils.escapeHTML?.()` não protege contra `foundry.utils`
// ser undefined, que foi exatamente como isto quebrou.
const escapa = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** As três formas de obter o número, na ordem da T7-2. */
const MODOS = {
  ataque: {
    rotulo: "Ataque",
    dica: "dado de dano da arma",
    campo: "1d8",
    async valor(entrada) {
      const roll = await new Roll(entrada || "1d8").evaluate();
      return { n: roll.total, como: `${entrada} deu ${roll.total}`, roll };
    },
  },
  aparato: {
    rotulo: "Aparato ou poder mental",
    dica: "nível tecnológico ou grandeza",
    campo: "3",
    async valor(entrada) {
      const n = Number(entrada) || 0;
      return { n, como: `NT ou grandeza ${n} — não se rola`, roll: null };
    },
  },
  movimento: {
    rotulo: "Movimentação dupla ou outra ação",
    dica: "modificador de Destreza",
    campo: "0",
    async valor(entrada) {
      const mod = Number(entrada) || 0;
      return { n: 10 - mod, como: `10 − ${mod} de Destreza`, roll: null };
    },
  },
};

function formulario(linhas) {
  const opcoes = Object.entries(MODOS)
    .map(([k, m]) => `<option value="${k}">${m.rotulo}</option>`)
    .join("");

  const corpo = Array.from({ length: linhas }, (_, i) => `
    <div class="sd-ordem-linha">
      <input type="text" name="nome${i}" placeholder="Quem" value="">
      <select name="modo${i}">${opcoes}</select>
      <input type="text" name="valor${i}" placeholder="1d8" value="">
    </div>`).join("");

  return `
<form class="sd-dialogo sd-ordem">
  <p class="sd-explica">A ordem de ação sai da <strong>T7-2</strong>: o dado de dano
  da arma para quem ataca, o nível tecnológico ou a grandeza para aparato e poder
  mental, e <strong>10 − Destreza</strong> para quem só se move.</p>
  <p class="sd-explica">Age primeiro o <strong>menor</strong> resultado. Deixe a
  linha em branco para ignorá-la.</p>
  ${corpo}
</form>`;
}

async function pergunta(linhas) {
  const colhe = (form) => (form ? new FormDataExtended(form).object : null);
  const V2 = foundry.applications?.api?.DialogV2;
  const conteudo = formulario(linhas);
  if (V2) {
    return V2.wait({
      window: { title: "Ordem de Ação — Space Dragon" },
      content: conteudo,
      buttons: [
        { action: "ok", label: "Ordenar", default: true, callback: (_e, b) => colhe(b.form) },
        { action: "nao", label: "Cancelar", callback: () => null },
      ],
      rejectClose: false,
    });
  }
  return new Promise((ok) => {
    new Dialog({
      title: "Ordem de Ação — Space Dragon",
      content: conteudo,
      buttons: {
        ok: { label: "Ordenar", callback: (h) => ok(colhe((h[0] ?? h).querySelector("form"))) },
        nao: { label: "Cancelar", callback: () => ok(null) },
      },
      default: "ok",
      close: () => ok(null),
    }).render(true);
  });
}

/**
 * Abre a janela, rola o que precisa e publica a ordem no chat.
 *
 * `linhas` é quantos combatentes cabem no formulário.
 */
export async function abrirOrdem(linhas = 6) {
  const r = await pergunta(linhas);
  if (!r) return null;

  const rolls = [];
  const combatentes = [];

  for (let i = 0; i < linhas; i += 1) {
    const nome = String(r[`nome${i}`] ?? "").trim();
    if (!nome) continue;
    const modo = MODOS[r[`modo${i}`]] ?? MODOS.ataque;
    const { n, como, roll } = await modo.valor(String(r[`valor${i}`] ?? "").trim());
    if (roll) rolls.push(roll);
    combatentes.push({ nome, n, como, modo: modo.rotulo });
  }

  if (!combatentes.length) {
    ui.notifications.warn("Nenhum combatente foi preenchido.");
    return null;
  }

  // Do MENOR para o maior — é o contrário da iniciativa do Old Dragon 2.
  combatentes.sort((a, b) => a.n - b.n);
  const duracao = Math.max(...combatentes.map((c) => c.n)) * 2;

  const linhasHtml = combatentes
    .map((c, i) =>
      `<li class="sd-ordem-item"><span class="sd-pos">${i + 1}º</span>` +
      `<span class="sd-nome">${escapa(c.nome)}</span>` +
      `<span class="sd-alvo">${c.n}</span>` +
      `<span class="sd-conta">${c.como}</span></li>`
    )
    .join("");

  await ChatMessage.create({
    content:
      `<div class="title">Ordem de Ação</div>` +
      `<div class="sd-teste">` +
      `<ol class="sd-testes">${linhasHtml}</ol>` +
      `<p class="result">A rodada dura <strong>${duracao} segundos</strong> — ` +
      `o maior resultado × 2.</p>` +
      `<p class="sd-nota"><em>Age primeiro o menor resultado, pela T7-2.</em></p>` +
      `</div>`,
    speaker: ChatMessage.getSpeaker(),
    ...(rolls.length ? { rolls, sound: CONFIG.sounds.dice } : {}),
  });

  return { combatentes, duracao };
}

/** Rola 1d6 na T7-4 ou na T7-5 e publica o efeito. */
export async function rolarCriticoTabela(tabela, dados) {
  const roll = await new Roll("1d6").evaluate();
  const linha = dados.find((l) => l.d6 === roll.total);
  await ChatMessage.create({
    content:
      `<div class="title">${tabela}</div>` +
      `<div class="sd-teste">` +
      `<p class="result">1d6 deu <strong>${roll.total}</strong></p>` +
      `<p>${linha?.efeito ?? "—"}</p></div>`,
    speaker: ChatMessage.getSpeaker(),
    rolls: [roll],
    sound: CONFIG.sounds.dice,
  });
  return { roll, linha };
}

export function api() {
  return { ordem: abrirOrdem, rolarCriticoTabela };
}

console.debug(`${ID} | ordem de ação carregada`);
