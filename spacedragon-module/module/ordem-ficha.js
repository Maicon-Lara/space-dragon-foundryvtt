/**
 * A declaração da Ordem de Ação na ficha do personagem (T7-2).
 *
 * ── POR QUE NA FICHA, SE A JANELA JÁ EXISTE ─────────────────────────────────
 *
 * A janela de ordem.js é do MESTRE: ele digita nome por nome, escolhe a ação de
 * cada um e informa o dado. Funciona, e continua existindo — mas põe no Mestre
 * um trabalho que é dos jogadores, e toda rodada, porque a T7-2 manda declarar
 * de novo a cada rodada.
 *
 * Este painel passa a declaração para quem declara. O jogador abre a aba de
 * ataques, escolhe "atacar com o blaster" e clica: a ficha rola o dado de dano
 * da arma — porque na T7-2 o valor da ordem É o dano — e manda o resultado ao
 * chat com a conta à vista.
 *
 * ── O QUE ELE NÃO FAZ POR PADRÃO ────────────────────────────────────────────
 *
 * Não escreve no rastreador de combate. Essa é uma decisão de projeto do módulo,
 * declarada em ordem.js: reescrever a iniciativa de um sistema alheio quebraria
 * todo módulo de combate instalado. Quem quer o valor no rastreador liga a opção
 * "Gravar no rastreador de combate" — e aí assume o atrito, de olhos abertos.
 *
 * A ordem na tela continua sendo a do Foundry, que é DECRESCENTE: o rastreador
 * vai mostrar a fila ao contrário da regra. É por isso que a opção vem
 * desligada, e é isso que o módulo Star Wars resolve por cima, com a inversão
 * da classe de Combate.
 *
 * ── A LIÇÃO DE CSS QUE ESTE PAINEL CARREGA ──────────────────────────────────
 *
 * A ficha do Old Dragon 2 dá `width: 100%` e altura fixa a todo `input` e
 * `button` dela. Um painel injetado que não desfaça isso sai com o campo
 * espremido num risco e o botão engolindo a linha. As regras de `.sd-ordem-*`
 * em spacedragon.css usam `!important` exatamente nesses pontos, e só neles.
 */

import { MODOS } from "./ordem.js";
import { ligarNaFicha } from "./ficha.js";

const ID = "spacedragon";
const MARCA = "sd-ordem-ficha";

/* ── ONDE O PAINEL ENTRA ───────────────────────────────────────────────────
 *
 * A ficha do sistema nomeia as abas por classe. As seis do personagem, lidas na
 * ficha real (Foundry 13 + olddragon2e, com o módulo ativo):
 *
 *   character-tab-attacks · character-tab-race · character-tab-class
 *   character-tab-spells · character-tab-equipment · character-tab-details
 *
 * A de ataques é a PRIMEIRA, e é a que este painel usa. As outras entram como
 * candidatos por segurança, para o caso de o sistema renomeá-la.
 *
 * O `[data-tab]` genérico vem por último e ignora o que está dentro de `<nav>`:
 * ali mora o LINK da aba, não o painel dela, e injetar no link põe o painel na
 * barra de abas.
 *
 * Sem nenhum candidato o painel NÃO é desenhado, e o console diz qual nome ele
 * procurou. Painel que aparece no lugar errado é pior que painel que não
 * aparece: o primeiro a mesa usa errado, o segundo ela reporta.
 */
const CANDIDATOS = [
  ".character-tab-attacks",
  ".monster-tab-attacks",   // a Ficha de Ameaça e a de monstro do sistema
  ".character-tab-attack",
  ".character-tab-combat",
];

export function abaDeAtaques(raiz) {
  for (const sel of CANDIDATOS) {
    const n = raiz.querySelector(sel);
    if (n) return { no: n, por: sel };
  }
  const porDados = [...raiz.querySelectorAll('[data-tab="attacks"]')].find((n) => !n.closest("nav"));
  if (porDados) return { no: porDados, por: '[data-tab="attacks"]' };
  return null;
}

/* ── AS OPÇÕES QUE O JOGADOR VÊ ────────────────────────────────────────────
 *
 * As armas do personagem primeiro, equipadas antes das guardadas, cada uma já
 * com o dado de dano dela no campo — é o que torna o painel mais rápido que a
 * janela do Mestre: ninguém precisa lembrar nem digitar o dado.
 *
 * Depois as três formas da T7-2, para o que não é arma: aparato ou poder (valor
 * fixo), e movimentação ou outra ação (10 − Destreza).
 */
export function opcoesDeOrdem(ator) {
  // `weapon` é do personagem; `monster_attack` é da criatura — o sistema usa
  // tipos diferentes para a mesma ideia, e a T7-2 não distingue: o que entra na
  // ordem é o DADO DE DANO, venha ele de uma arma empunhada ou de uma garra.
  const armas = (ator?.items ?? [])
    .filter((i) => ["weapon", "monster_attack"].includes(i.type)
      && String(i.system?.damage ?? "").trim())
    .sort((a, b) => Number(b.system?.is_equipped ?? 0) - Number(a.system?.is_equipped ?? 0));

  const lista = armas.map((a) => ({
    chave: `arma:${a.id}`,
    modo: "ataque",
    campo: String(a.system.damage).trim(),
    rotulo: a.type === "monster_attack"
      ? `${a.name} — ${String(a.system.damage).trim()}`
      : `Atacar com ${a.name} — ${String(a.system.damage).trim()}`,
  }));

  // Sem nenhuma arma cadastrada o jogador ainda precisa poder atacar: a opção
  // genérica fica sempre, com o dado em branco para ele digitar.
  lista.push({
    chave: "ataque",
    modo: "ataque",
    campo: armas.length ? String(armas[0].system.damage).trim() : MODOS.ataque.campo,
    rotulo: `Atacar — ${MODOS.ataque.dica}`,
  });
  lista.push({
    chave: "aparato",
    modo: "aparato",
    campo: MODOS.aparato.campo,
    rotulo: `${MODOS.aparato.rotulo} — ${MODOS.aparato.dica}`,
  });
  lista.push({
    chave: "movimento",
    modo: "movimento",
    // O modificador de Destreza já vem da ficha: é o número que o jogador mais
    // erraria de cabeça, e o único dos três que o ator sabe sozinho.
    campo: String(Number(ator?.system?.mod_destreza ?? 0)),
    rotulo: `${MODOS.movimento.rotulo} — ${MODOS.movimento.dica}`,
  });

  return lista;
}

const escapa = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** A escolha sobrevive ao redesenho da ficha, por ator. */
const escolhido = new Map();

export function montarPainel(ator) {
  const lista = opcoesDeOrdem(ator);
  const sel = lista.find((l) => l.chave === escolhido.get(ator?.id)) ?? lista[0];
  const opcoes = lista
    .map(
      (l) =>
        `<option value="${escapa(l.chave)}" data-modo="${escapa(l.modo)}" ` +
        `data-campo="${escapa(l.campo)}"${l.chave === sel.chave ? " selected" : ""}>` +
        `${escapa(l.rotulo)}</option>`
    )
    .join("");

  return (
    `<section class="${MARCA}">` +
    `<div class="sd-ordem-cabeca">` +
    `<strong>Ordem de Ação</strong>` +
    `<span class="sd-ordem-dica" title="T7-2: o valor vem da ação escolhida, e muda a cada rodada">` +
    `menor age primeiro</span>` +
    `</div>` +
    `<select class="sd-ordem-acao">${opcoes}</select>` +
    `<div class="sd-ordem-linha">` +
    `<input type="text" class="sd-ordem-valor" value="${escapa(sel.campo)}" ` +
    `title="O dado de dano, o NT ou a Grandeza, ou o modificador de Destreza. Dá para corrigir à mão.">` +
    `<button type="button" class="sd-ordem-declarar">declarar</button>` +
    `</div></section>`
  );
}

/* ── A DECLARAÇÃO ──────────────────────────────────────────────────────────── */

const ligado = (chave, padrao = false) => {
  try {
    return game.settings?.get?.(ID, chave) ?? padrao;
  } catch {
    return padrao;
  }
};

/**
 * A regra da Ordem de Ação está em uso?
 *
 * É o interruptor mestre. As opções de DETALHE — o painel na ficha, a gravação
 * no rastreador — descrevem como a regra aparece, e não fazem sentido sem ela.
 *
 * Fora do Foundry (nos testes) não há settings, e a resposta é `false`: o
 * padrão conservador é a iniciativa do sistema, porque inverter a ordem de um
 * combate sem alguém pedir é a mudança mais visível que um módulo pode fazer.
 */
export const regraDaOrdemLigada = () => ligado("ordemDeAcao", false);

async function declarar(ator, raiz) {
  const op = raiz.querySelector(".sd-ordem-acao")?.selectedOptions?.[0];
  if (!op) return;
  const modo = MODOS[op.dataset.modo] ?? MODOS.ataque;
  const entrada = String(raiz.querySelector(".sd-ordem-valor")?.value ?? "").trim();

  const { n, como, roll } = await modo.valor(entrada);

  // O rastreador só por opção, e só se houver combate: ver o cabeçalho.
  /* ── QUANDO O VALOR VAI PARA O RASTREADOR ─────────────────────────────────
   *
   * Pela opção própria, OU quando a declaração por rodada está ligada.
   *
   * Na mesa, a combinação natural era a que não funcionava: quem liga
   * "perguntar a ação a cada rodada" liga só aquela, porque é a que descreve o
   * que ele quer — e a gravação, numa segunda opção desligada por padrão,
   * ficava de fora. O jogador declarava pela ficha, o valor saía no chat, e o
   * rastreador continuava no número velho.
   *
   * Quem pede a declaração está pedindo que a ordem saia dela. As duas opções
   * continuam existindo para quem quer só uma das coisas.
   */
  let noRastreador = false;
  if (ligado("ordemNoRastreador") || ligado("ordemNoCombate")) {
    const tok = ator.getActiveTokens?.()[0]?.document;
    const c = tok && game.combat?.getCombatantByToken?.(tok.id);
    if (c) {
      await game.combat.setInitiative(c.id, n);
      noRastreador = true;
    }
  }

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: ator }),
    content:
      `<div class="title">Ordem de Ação</div>` +
      `<div class="sd-teste">` +
      `<p class="sd-acao">${escapa(op.textContent)}</p>` +
      `<p class="result"><strong>${n}</strong></p>` +
      `<p class="sd-conta">${escapa(como)}</p>` +
      `<p class="sd-nota"><em>Age primeiro o menor resultado, pela T7-2. ` +
      `A rodada dura o maior resultado da mesa × 2 segundos.</em></p>` +
      (noRastreador
        ? `<p class="sd-nota"><em>Gravado no rastreador — que ordena do maior para o ` +
          `menor, ao contrário da regra.</em></p>`
        : "") +
      `</div>`,
    ...(roll ? { rolls: [roll], sound: CONFIG.sounds?.dice } : {}),
  });
}

function ligarEventos(raiz, ator) {
  // A ficha do sistema salva em `change` e redesenha: sem isto, escolher a ação
  // no `select` dispararia um salvamento do ator e o painel sumiria no meio do
  // clique.
  for (const ev of ["change", "input"]) raiz.addEventListener(ev, (e) => e.stopPropagation());

  raiz.querySelector(".sd-ordem-acao")?.addEventListener("change", (e) => {
    const op = e.currentTarget.selectedOptions?.[0];
    if (!op) return;
    escolhido.set(ator.id, op.value);
    const campo = raiz.querySelector(".sd-ordem-valor");
    if (campo) campo.value = op.dataset.campo ?? "";
  });

  raiz.querySelector(".sd-ordem-declarar")?.addEventListener("click", () => declarar(ator, raiz));
}

export function registrarOpcoes() {
  /* ── O INTERRUPTOR DA REGRA ───────────────────────────────────────────────
   *
   * A Ordem de Ação é a T7-2 do Space Dragon: o valor vem da AÇÃO escolhida, e
   * o MENOR age primeiro. É o oposto da iniciativa do Old Dragon 2, em que se
   * rola uma vez por rodada e o maior age primeiro.
   *
   * As duas não convivem — ou a mesa usa uma, ou usa a outra —, e por isso esta
   * opção existe. DESLIGADA, o módulo não toca em nada: a iniciativa continua
   * sendo a do sistema, com a adaptação que o Space Dragon faz dela (o módulo
   * já ajusta os atributos e os modificadores em outro lugar).
   *
   * O padrão é DESLIGADO. Inverter a ordem de um combate é a mudança mais
   * visível que um módulo pode fazer numa mesa, e quem não pediu não deve ser
   * surpreendido — ainda mais numa regra em que o engano não aparece: a fila
   * fica na ordem errada e todo mundo joga a rodada inteira sem notar.
   *
   * As três opções abaixo são DETALHES de como a regra aparece, e só valem com
   * esta ligada.
   */
  game.settings.register(ID, "ordemDeAcao", {
    name: "Usar a Ordem de Ação (T7-2)",
    hint:
      "A regra do Space Dragon: o valor da iniciativa vem da AÇÃO que o personagem " +
      "escolhe, e o MENOR age primeiro. Desligada, a mesa usa a iniciativa normal do " +
      "Old Dragon 2 — uma rolagem por rodada, maior primeiro —, que é o padrão.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    requiresReload: true,
  });


  game.settings.register(ID, "ordemNoRastreador", {
    name: "Gravar a Ordem de Ação no rastreador de combate",
    hint:
      "O valor declarado vai para a iniciativa do combatente. Atenção: o rastreador do " +
      "Foundry ordena do MAIOR para o menor, e a T7-2 manda o menor agir primeiro — a " +
      "fila aparece ao contrário da regra. Deixe desligado, a menos que use um módulo " +
      "que inverta a ordenação.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
  });
}

export function ligarOrdemNaFicha() {
  /* ── PERSONAGEM E CRIATURA ────────────────────────────────────────────────
   *
   * `ligarNaFicha` do ficha.js resolve a cascata de ganchos da ficha de
   * PERSONAGEM (ela dispara três ganchos na mesma renderização, e ganchar os
   * três desenha em triplicado). A ficha de criatura é outra classe e tem o
   * gancho próprio — então o mesmo desenhista entra nos dois.
   *
   * Desenhar em dobro não é risco aqui: o desenhista remove o painel anterior
   * antes de inserir o novo. O risco seria o contrário — a criatura ficar sem
   * painel, e o Mestre sem declarar pelos PNJs.
   */
  const desenha = (app, elemento) => {
    try {
      /* ── A REGRA LIGA O PAINEL ────────────────────────────────────────
       *
       * Havia uma opção separada para o painel na ficha. Duas opções para a
       * mesma decisão: quem liga a T7-2 quer declarar a ação em algum lugar, e
       * a ficha é esse lugar — o painel É como a regra se usa, não um enfeite
       * dela.
       *
       * Com a regra desligada, o painel seria uma caixa que não leva a lugar
       * nenhum.
       */
      if (!regraDaOrdemLigada()) return;
      const raiz = elemento instanceof HTMLElement ? elemento : elemento?.[0];
      const ator = app?.actor ?? app?.document;
      // personagem, ajudante e criatura: a T7-2 vale para todo mundo que age
      // na rodada, e o Mestre declara pelos PNJs como o jogador pelo seu.
      if (!raiz || !["character", "retainer", "monster"].includes(ator?.type)) return;

      // Remove antes de desenhar: a ficha redesenha a cada mudança, e sem isto
      // o painel se acumularia a cada salvamento.
      raiz.querySelectorAll(`.${MARCA}`).forEach((n) => n.remove());

      const aba = abaDeAtaques(raiz);
      if (!aba) {
        console.warn(
          `${ID} | aba de ataques não encontrada (procurei ${CANDIDATOS.join(", ")} e ` +
            `[data-tab="attacks"]) — painel da Ordem de Ação não desenhado`
        );
        return;
      }

      aba.no.insertAdjacentHTML("afterbegin", montarPainel(ator));
      const painel = aba.no.querySelector(`.${MARCA}`);
      if (painel) ligarEventos(painel, ator);
    } catch (e) {
      // Nunca quebrar a ficha do sistema por causa de um painel do módulo.
      console.warn(`${ID} | painel da Ordem de Ação não pôde ser desenhado`, e);
    }
  };

  ligarNaFicha(desenha);
  Hooks.on("renderOD2MonsterSheet", desenha);
}
