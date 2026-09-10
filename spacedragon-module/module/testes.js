/**
 * Testes de porcentagem do Space Dragon.
 *
 * ── A REGRA ─────────────────────────────────────────────────────────────────
 *
 * Rola 1d100 e passa com MENOR OU IGUAL ao alvo. É o inverso do d20 do Old
 * Dragon 2, onde se quer o número alto, e é por isso que o sistema não tem como
 * rolar isto sozinho: não é uma fórmula diferente, é uma comparação diferente.
 *
 * O alvo tem duas parcelas fixas e uma da mesa:
 *
 *     alvo = porcentagem da tabela (pelo nível) + coluna do atributo + situação
 *
 * ── POR QUE UM DIÁLOGO, E NÃO UM BOTÃO NA FICHA ─────────────────────────────
 *
 * `renderActorSheet` não dispara no sistema olddragon2e: a ficha herda da
 * camada de compatibilidade `foundry.appv1.sheets.ActorSheet`, cujo nome
 * interno o Foundry usa para montar o nome do gancho, e ele não bate. Injetar
 * botão na ficha alheia daria trabalho e quebraria na próxima versão do
 * sistema. Um diálogo próprio não depende de gancho nenhum.
 *
 * ── POR QUE TODO CAMPO É EDITÁVEL ───────────────────────────────────────────
 *
 * O módulo LÊ nível e atributo da ficha quando consegue, mas o Space Dragon
 * mora numa ficha de outro jogo: a Ciência está escrita no campo Inteligência,
 * e nada garante que o jogador tenha preenchido. Então o que foi lido vem
 * preenchido e nada vem travado — se a leitura errou, corrige na hora, e o
 * cartão de chat mostra de onde cada parcela saiu.
 */

import {
  FAIXAS, CAMPO_NA_FICHA, NOME_ATRIBUTO, SIGLA,
  PROGRESSAO, ATRIBUTO, ROTULO_COLUNA, TESTES,
} from "./dados.js";

const porChave = (c) => TESTES.find((t) => t.chave === c);
const sinal = (n) => (n > 0 ? `+${n}` : `${n}`);

/** Índice da faixa de atributo. Satura fora da escala de 1 a 29. */
function faixaDe(valor) {
  if (valor <= 1) return 0;
  if (valor >= 29) return FAIXAS.length - 1;
  return FAIXAS.findIndex(([min, max]) => valor >= min && valor <= max);
}

/** "80%" → 80. "1-3" → 3, que é o teto da faixa de ouvir barulhos. */
function numero(cel) {
  if (typeof cel === "number") return cel;
  const s = String(cel ?? "");
  const faixa = s.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  if (faixa) return Number(faixa[2]);
  return Number(s.replace("%", "").replace(/[^\d-]/g, "")) || 0;
}

// ── Leitura da ficha ────────────────────────────────────────────────────────
//
// Caminhos em ordem de tentativa. O módulo não conhece o esquema interno do
// olddragon2e por contrato — conhece por observação —, então tenta o que é
// plausível e desiste em silêncio. Desistir aqui custa preencher um campo no
// diálogo; chutar custaria uma rolagem errada que ninguém percebe.
function leNumero(obj, caminhos) {
  for (const c of caminhos) {
    const v = c.split(".").reduce((o, k) => o?.[k], obj);
    const n = Number(v?.value ?? v);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

function nivelDe(ator) {
  const doItem = ator?.items?.find?.((i) => i.type === "class")?.system;
  return (
    leNumero(ator?.system, ["level", "nivel", "details.level", "attributes.level", "experience.level"]) ??
    leNumero(doItem, ["level", "nivel"]) ??
    null
  );
}

/**
 * O valor de um atributo do Space Dragon, lido do campo do OD2 onde este
 * módulo convenciona anotá-lo. Ver o journal "Onde anotar cada um na ficha".
 */
function atributoDe(ator, atributo) {
  const campo = CAMPO_NA_FICHA[atributo];
  return leNumero(ator?.system, [
    campo, `atributos.${campo}`, `attributes.${campo}`, `abilities.${campo}`,
  ]);
}

/** A classe escrita na ficha, se houver — só para pré-selecionar o teste. */
function classeDe(ator) {
  return ator?.items?.find?.((i) => i.type === "class")?.name ?? null;
}

// ── O cálculo ───────────────────────────────────────────────────────────────
/** A parcela que vem da tabela: da progressão pelo nível, ou do atributo. */
function baseDe(teste, { nivel, valores }) {
  const f = teste.base;
  if (f.tabela) {
    const col = PROGRESSAO[f.tabela]?.[f.coluna] ?? [];
    const cel = col[Math.min(Math.max(nivel, 1), col.length) - 1];
    return { valor: numero(cel), texto: `nível ${nivel}`, cru: cel };
  }
  const v = valores[f.atributo];
  const cel = ATRIBUTO[f.atributo]?.[f.coluna]?.[faixaDe(v)];
  return { valor: numero(cel), texto: `${NOME_ATRIBUTO[f.atributo]} ${v}`, cru: cel };
}

/** A parcela do atributo que ajusta a porcentagem da tabela. */
function ajusteDe(teste, { valores }) {
  if (!teste.ajuste) return null;
  const { atributo, coluna } = teste.ajuste;
  const v = valores[atributo];
  if (!Number.isFinite(v)) return null;
  return {
    valor: numero(ATRIBUTO[atributo]?.[coluna]?.[faixaDe(v)]),
    atributo,
    valorAtributo: v,
    rotulo: ROTULO_COLUNA[`${atributo}.${coluna}`] ?? coluna,
  };
}

/** Tudo o que o teste precisa saber antes de rolar. */
export function preparar(chave, { nivel, valores, situacional = 0 }) {
  const teste = porChave(chave);
  if (!teste) throw new Error(`Teste desconhecido: ${chave}`);
  const base = baseDe(teste, { nivel, valores });
  const ajuste = ajusteDe(teste, { valores });
  const alvo = base.valor + (ajuste?.valor ?? 0) + situacional;
  return { teste, base, ajuste, situacional, alvo };
}

// ── Rolagem e cartão ────────────────────────────────────────────────────────
//
// As classes .title/.result/.success/.failure são as do próprio olddragon2e
// (src/styles/chat.less), e o sistema só as estiliza dentro de #chat. Por isso
// o cartão as usa e o diálogo não.
export async function rolar(chave, ctx, { ator = null, publico = true } = {}) {
  const p = preparar(chave, ctx);
  const { teste, base, ajuste, situacional, alvo } = p;
  const formula = teste.dado ?? "1d100";

  const roll = await new Roll(formula).evaluate();
  const passou = roll.total <= alvo;

  const parcelas = [`<li>${base.cru ?? base.valor} <em>(${base.texto})</em></li>`];
  if (ajuste) {
    parcelas.push(
      `<li>${sinal(ajuste.valor)} <em>${ajuste.rotulo} — ` +
      `${SIGLA[ajuste.atributo]} ${ajuste.valorAtributo}</em></li>`
    );
  }
  if (situacional) parcelas.push(`<li>${sinal(situacional)} <em>situação</em></li>`);

  const veredito = passou
    ? `<strong class="success">Sucesso</strong>`
    : `<strong class="failure">Falha</strong>`;

  const comparador = teste.dado === "1d6" ? `cair em 1–${alvo}` : `≤ ${alvo}`;

  let aviso = "";
  if (alvo <= 0) {
    aviso = `<p class="result"><em>Alvo ${alvo}: não há chance nenhuma aqui.</em></p>`;
  } else if (formula === "1d100" && alvo >= 100) {
    aviso = `<p class="result"><em>Alvo ${alvo}: só um 100 falha.</em></p>`;
  }

  const corpo =
    `<div class="sd-teste">` +
    `<p class="result">${veredito} — rolou <strong>${roll.total}</strong>, precisava ${comparador}</p>` +
    `<ul class="sd-parcelas">${parcelas.join("")}</ul>` +
    aviso +
    (teste.nota ? `<p class="sd-nota"><em>${teste.nota}</em></p>` : "") +
    `</div>`;

  const dados = {
    content: `<div class="title">${teste.nome}${teste.classe ? ` — ${teste.classe}` : ""}</div>${corpo}`,
    speaker: ChatMessage.getSpeaker({ actor: ator ?? undefined }),
    rolls: [roll],
    sound: CONFIG.sounds.dice,
  };
  // Esgueirar-se e ocultar-se são rolagem do MESTRE por regra: o gatuno acha
  // que passou até algo provar o contrário. Mostrar o número ao jogador
  // apagaria a regra, então esses dois vão sussurrados.
  if (!publico) dados.whisper = ChatMessage.getWhisperRecipients("GM");

  await ChatMessage.create(dados);
  return { ...p, roll, passou };
}

// ── Diálogo ─────────────────────────────────────────────────────────────────
//
// DialogV2 com queda para o Dialog antigo: o módulo declara compatibilidade
// 13–14, e sobreviver a um mundo mais velho não custa nada.
async function pergunta({ titulo, conteudo, rotuloOk }) {
  const colhe = (form) => (form ? new FormDataExtended(form).object : null);
  const V2 = foundry.applications?.api?.DialogV2;
  if (V2) {
    return V2.wait({
      window: { title: titulo },
      content: conteudo,
      buttons: [
        { action: "ok", label: rotuloOk, default: true, callback: (_e, botao) => colhe(botao.form) },
        { action: "nao", label: "Cancelar", callback: () => null },
      ],
      rejectClose: false,
    });
  }
  return new Promise((ok) => {
    new Dialog({
      title: titulo,
      content: conteudo,
      buttons: {
        ok: { label: rotuloOk, callback: (html) => ok(colhe((html[0] ?? html).querySelector("form"))) },
        nao: { label: "Cancelar", callback: () => ok(null) },
      },
      default: "ok",
      close: () => ok(null),
    }).render(true);
  });
}

function atorDe(alvo) {
  const a = alvo ?? canvas?.tokens?.controlled?.[0]?.actor ?? game.user?.character ?? null;
  if (a && !a.isOwner) {
    ui.notifications.warn(`Você não tem permissão sobre ${a.name}.`);
    return null;
  }
  return a;
}

/** Quais atributos este teste precisa que estejam preenchidos. */
function atributosDe(teste) {
  const s = new Set();
  for (const f of [teste.base, teste.ajuste]) if (f?.atributo) s.add(f.atributo);
  return [...s];
}

/**
 * Abre o diálogo do teste. Sem `chave`, o menu começa pela classe da ficha.
 * É isto que a macro do compêndio chama.
 */
export async function abrirTeste(chave = null, alvo = null) {
  const ator = atorDe(alvo);
  const teste = chave ? porChave(chave) : null;
  if (chave && !teste) {
    ui.notifications.error(`Teste desconhecido: ${chave}`);
    return null;
  }

  const classe = classeDe(ator);
  const nivel = nivelDe(ator) ?? 1;

  const opcoes = TESTES.map((t) => {
    const sel = teste ? t.chave === teste.chave : classe && t.classe === classe;
    return `<option value="${t.chave}"${sel ? " selected" : ""}>` +
           `${t.classe ? `${t.classe} — ` : ""}${t.nome}</option>`;
  }).join("");

  // Todos os atributos que algum teste usa entram no formulário. Mostrar e
  // esconder conforme a escolha exigiria um listener dentro do diálogo;
  // deixá-los à vista custa três campos e ganha que o jogador veja o que está
  // em jogo antes de escolher.
  const usados = [...new Set(TESTES.flatMap(atributosDe))];
  const campos = usados.map((a) => {
    const v = atributoDe(ator, a) ?? "";
    const campo = CAMPO_NA_FICHA[a];
    const dica = campo === a ? "" : ` <em>(campo ${campo} da ficha)</em>`;
    return `<div class="form-group"><label>${NOME_ATRIBUTO[a]}${dica}</label>` +
           `<input type="number" name="attr_${a}" value="${v}" min="1" max="29"></div>`;
  }).join("");

  const quem = ator
    ? `Lido da ficha de <strong>${ator.name}</strong>`
    : "Nenhum token selecionado";

  const conteudo = `
<form class="sd-dialogo">
  <p class="sd-explica">Rola <strong>1d100</strong> e passa com <strong>menor ou igual</strong> ao alvo.
  ${quem} — corrija o que estiver errado antes de rolar.</p>
  <div class="form-group"><label>Teste</label><select name="chave">${opcoes}</select></div>
  <div class="form-group"><label>Nível</label><input type="number" name="nivel" value="${nivel}" min="1" max="20"></div>
  ${campos}
  <div class="form-group"><label>Modificador de situação</label><input type="number" name="situacional" value="0"></div>
  <p class="sd-explica">Bônus de especialização — sabotador, espião, assassino — entram como
  modificador de situação. O módulo não os aplica sozinho.</p>
</form>`;

  const r = await pergunta({
    titulo: "Teste de porcentagem — Space Dragon",
    conteudo,
    rotuloOk: "Rolar",
  });
  if (!r) return null;

  const valores = {};
  for (const a of usados) valores[a] = Number(r[`attr_${a}`]) || 0;

  const escolhido = porChave(String(r.chave));
  for (const a of atributosDe(escolhido)) {
    if (!valores[a]) {
      ui.notifications.warn(
        `${escolhido.nome} precisa do valor de ${NOME_ATRIBUTO[a]}, ` +
        `que este módulo anota no campo ${CAMPO_NA_FICHA[a]} da ficha.`
      );
      return null;
    }
  }

  return rolar(
    escolhido.chave,
    { nivel: Number(r.nivel) || 1, valores, situacional: Number(r.situacional) || 0 },
    { ator, publico: !escolhido.segredo }
  );
}

export const api = { abrirTeste, rolar, preparar, TESTES };
