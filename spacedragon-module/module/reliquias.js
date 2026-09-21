/**
 * Relíquias tecnológicas (T11-3) e os defeitos delas (T11-4).
 *
 * ── O QUE O BLOCO DA CRIATURA JÁ DIZ ────────────────────────────────────────
 *
 * A linha de prêmios do livro traz iniciais antes do XP — "PRÊMIOS O,D,U 100
 * XP" —, e elas são "O, D e U para relíquias ofensivas, defensivas e
 * utilitárias" (11.6). O alienígena derrotado larga uma relíquia de cada letra
 * que carregar, e o XP é outra coisa.
 *
 * ── A T11-3 NÃO É UMA TABELA, SÃO SETE ──────────────────────────────────────
 *
 * Tipo de relíquia (1d20), nível tecnológico (1d20), tipo de aparato (1d6),
 * instabilidade (1d10), particularidades (1d10), criadores (1d10) e
 * consequências de uso (1d10). Rola-se tudo. Quando a criatura diz a letra, ela
 * decide o tipo de aparato, e o d6 não é rolado — é o único ponto em que a
 * geração a partir do bestiário difere da geração solta.
 *
 * ── O ITEM DE VERDADE ───────────────────────────────────────────────────────
 *
 * Sorteada a categoria e o nível tecnológico, o módulo procura no compêndio de
 * Aparatos um aparato que caiba, e o cartão traz o link para arrastar para a
 * ficha. O compêndio grava categoria e NT em `flags.spacedragon.aparato`, e não
 * na frase da descrição, justamente para esta busca.
 *
 * ⚠️ A instabilidade é chance de FALHA, e o livro manda mantê-la em segredo dos
 * jogadores: o cartão vai sussurrado ao Mestre.
 */

import { RELIQUIAS, DEFEITOS } from "./dados.js";

const ID = "spacedragon";

export const CATEGORIA_POR_LETRA = { O: "Ofensivo", D: "Defensivo", U: "Utilitário" };

// "Relíquia ofensivo" não é português. A categoria do aparato é masculina no
// compêndio ("Aparato ofensivo") e a relíquia é feminina.
const RELIQUIA_ADJETIVO = { Ofensivo: "ofensiva", Defensivo: "defensiva", "Utilitário": "utilitária" };

const TABELA = {
  tipo: "Tipo de relíquia (1d20)",
  aparato: "Tipo de aparato (1d6)",
  nt: "Nível tecnológico (1d20)",
  instabilidade: "Instabilidade (1d10)",
  particularidade: "Particularidades (1d10)",
  criador: "Criadores (1d10)",
  consequencia: "Consequências de uso (1d10)",
};

/** "1–3" ou "20" → a linha que contém o valor rolado. */
export function daFaixa(linhas, valor) {
  for (const l of linhas ?? []) {
    const [min, max] = String(l.faixa).split(/[–-]/).map((n) => Number(n.trim()));
    if (valor >= min && valor <= (Number.isFinite(max) ? max : min)) return l.r;
  }
  return null;
}

const rola = async (formula) => (await new Roll(formula).evaluate()).total;

/** As letras O, D e U do campo de relíquias da criatura. */
export function letrasDe(ator) {
  const s = String(ator?.system?.treasure ?? "").toUpperCase();
  return [...new Set(s.replace(/[^ODU]/g, "").split(""))];
}

/**
 * Uma relíquia inteira. `categoria` vem da letra do bloco, quando há; sem ela,
 * o tipo de aparato sai no d6.
 */
export async function rolarReliquia({ categoria = null } = {}) {
  const dados = {};
  const d = async (chave, formula) => {
    const valor = await rola(formula);
    dados[chave] = { valor, texto: daFaixa(RELIQUIAS[TABELA[chave]], valor) };
    return dados[chave].texto;
  };

  const tipo = await d("tipo", "1d20");
  if (tipo === "Aparato tecnológico") {
    if (categoria) dados.aparato = { valor: null, texto: categoria, daCriatura: true };
    else await d("aparato", "1d6");
  }
  await d("nt", "1d20");
  await d("instabilidade", "1d10");
  await d("particularidade", "1d10");
  await d("criador", "1d10");
  await d("consequencia", "1d10");

  // "Duas relíquias em uma — role novamente": é uma segunda relíquia inteira.
  const dupla = /role novamente/i.test(dados.particularidade.texto ?? "")
    ? await rolarReliquia({ categoria })
    : null;

  return { ...dados, categoria: dados.aparato?.texto ?? categoria ?? null, dupla };
}

/** Um aparato do compêndio que caiba na categoria e no nível sorteados. */
export async function aparatoQueCabe(categoria, ntTexto) {
  const nt = Number(String(ntTexto ?? "").match(/\d+/)?.[0]) || null;
  const pack = game.packs?.get?.(`${ID}.${ID}-aparatos`);
  if (!pack || !categoria) return null;
  const index = await pack.getIndex({ fields: ["flags.spacedragon.aparato"] });
  const candidatos = index.filter((e) => {
    const a = e.flags?.[ID]?.aparato;
    return a && !a.feito && a.categoria === categoria;
  });
  if (!candidatos.length) return null;
  // O do nível sorteado; se aquele nível não tem aparato dessa categoria, o
  // mais próximo ABAIXO, que é o que o Mestre conseguiria construir.
  const noNivel = candidatos.filter((e) => e.flags[ID].aparato.nt === nt);
  const abaixo = candidatos.filter((e) => (e.flags[ID].aparato.nt ?? 99) <= (nt ?? 99));
  const lista = noNivel.length ? noNivel : (abaixo.length ? abaixo : candidatos);
  const escolhido = lista[Math.floor(Math.random() * lista.length)];
  return { uuid: `Compendium.${pack.collection}.Item.${escolhido._id}`, nome: escolhido.name, nt: escolhido.flags[ID].aparato.nt, exato: !!noNivel.length };
}

const linha = (rotulo, d) =>
  d ? `<li><strong>${rotulo}:</strong> ${d.texto}${d.valor ? ` <em>(${d.valor})</em>` : d.daCriatura ? " <em>(do bloco da criatura)</em>" : ""}</li>` : "";

async function corpoDaReliquia(r) {
  const partes = [
    linha("Tipo", r.tipo),
    linha("Aparato", r.aparato),
    linha("Nível tecnológico", r.nt),
    linha("Instabilidade", r.instabilidade),
    linha("Particularidade", r.particularidade),
    linha("Criadores", r.criador),
    linha("Consequência de uso", r.consequencia),
  ].join("");

  let sugestao = "";
  if (r.tipo?.texto === "Aparato tecnológico" && r.categoria) {
    const item = await aparatoQueCabe(r.categoria, r.nt?.texto);
    if (item) {
      sugestao =
        `<p>Do compêndio: @UUID[${item.uuid}]{${item.nome}}` +
        (item.exato ? "" : ` <em>(${item.nt}º NT — não há aparato ${r.categoria.toLowerCase()} no nível sorteado)</em>`) +
        `</p>`;
    }
  }

  const quebra = /inutilizada/i.test(r.instabilidade?.texto ?? "")
    ? `<p><em>A relíquia quebra na primeira utilização: role o defeito na T11-4.</em></p>`
    : "";

  return `<ul class="sd-parcelas">${partes}</ul>${sugestao}${quebra}` +
    (r.dupla ? `<hr><p><strong>Duas relíquias em uma:</strong></p>${await corpoDaReliquia(r.dupla)}` : "");
}

/**
 * Gera e manda ao chat. Vai sussurrado: "é interessante manter a porcentagem
 * de instabilidade das relíquias em segredo dos jogadores" (11.6).
 */
export async function gerarReliquia({ categoria = null, titulo = "Relíquia tecnológica" } = {}) {
  const r = await rolarReliquia({ categoria });
  await ChatMessage.create({
    content: `<div class="title">${titulo}</div><div class="sd-teste">${await corpoDaReliquia(r)}</div>`,
    whisper: ChatMessage.getWhisperRecipients("GM"),
    speaker: ChatMessage.getSpeaker(),
  });
  return r;
}

/** Uma relíquia por letra do bloco da criatura. */
export async function gerarDaCriatura(ator) {
  const letras = letrasDe(ator);
  if (!letras.length) {
    ui.notifications.info(`${ator?.name ?? "A criatura"} não carrega relíquia nenhuma — o bloco só dá o prêmio em XP.`);
    return [];
  }
  const saida = [];
  for (const l of letras) {
    saida.push(await gerarReliquia({
      categoria: CATEGORIA_POR_LETRA[l],
      titulo: `Relíquia ${RELIQUIA_ADJETIVO[CATEGORIA_POR_LETRA[l]]} — ${ator.name}`,
    }));
  }
  return saida;
}

/** T11-4, que muda conforme o que a relíquia é. */
export async function rolarDefeito(tipo = "ofensivo") {
  const valor = await rola("1d10");
  const l = DEFEITOS.find((x) => x.d === valor);
  const chave = { ofensivo: "ofensivo", defensivo: "defensivo", utilitario: "utilitario" }[String(tipo).toLowerCase()] ?? "ofensivo";
  const texto = l?.defeito ?? l?.porTipo?.[chave] ?? "—";
  await ChatMessage.create({
    content:
      `<div class="title">Defeito de relíquia — T11-4</div><div class="sd-teste">` +
      `<p class="result">1d10 <strong>${valor}</strong></p><p>${texto}</p>` +
      (l?.porTipo ? `<p><em>Linha que muda com o tipo; esta é a de relíquia ${chave}.</em></p>` : "") +
      `</div>`,
    whisper: ChatMessage.getWhisperRecipients("GM"),
    speaker: ChatMessage.getSpeaker(),
  });
  return { valor, texto };
}

/** Diálogo do menu: categoria à escolha, para relíquia achada fora de combate. */
export async function abrirReliquia() {
  const V2 = foundry.applications?.api?.DialogV2;
  if (!V2?.wait) return gerarReliquia({});
  const opcoes = ["Sortear no d6", "Ofensivo", "Defensivo", "Utilitário"]
    .map((c) => `<option value="${c === "Sortear no d6" ? "" : c}">${c}</option>`).join("");
  const r = await V2.wait({
    window: { title: "Relíquia tecnológica — T11-3" },
    content:
      `<p class="sd-explica">Sete rolagens montam a relíquia. O cartão vai sussurrado ao Mestre, porque a instabilidade é segredo.</p>` +
      `<div class="form-group"><label>Tipo de aparato</label><select name="cat">${opcoes}</select></div>`,
    buttons: [
      { action: "ok", label: "Rolar", default: true, callback: (_e, b) => b.form.elements.cat.value || null },
      { action: "nao", label: "Cancelar", callback: () => undefined },
    ],
    rejectClose: false,
  });
  if (r === undefined) return null;
  return gerarReliquia({ categoria: r });
}
