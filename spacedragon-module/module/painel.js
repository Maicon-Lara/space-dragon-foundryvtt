/**
 * Os botões de rolagem dentro das habilidades de classe.
 *
 * ── O PROBLEMA QUE ELE RESOLVE ──────────────────────────────────────────────
 *
 * Metade das habilidades do Space Dragon é uma porcentagem que MUDA COM O
 * NÍVEL, e várias ainda somam uma coluna de atributo. A ficha do Old Dragon 2
 * mostra a descrição da habilidade, que é texto fixo: "80% no 1º nível, subindo
 * 1 ponto por nível". Quem está no 7º faz a conta de cabeça toda vez, e ainda
 * tem de lembrar de somar a Destreza.
 *
 * ── POR QUE DENTRO DA HABILIDADE, E NÃO NUM PAINEL À PARTE ──────────────────
 *
 * A primeira versão punha tudo num bloco depois da lista. Funcionava e era
 * feio: o jogador lia a descrição de Pilotar Naves num lugar e ia procurar o
 * número noutro, e as duas listas repetiam os mesmos nomes.
 *
 * Agora cada `class_ability` recebe os seus testes logo abaixo do próprio
 * texto. "Desarmar e Subjugar" ganha dois, "Talentos de Gatuno" ganha cinco —
 * a ligação vem do campo `habilidade` de cada teste, e o build quebra se algum
 * nome não casar.
 *
 * ── POR QUE INJETADO, E NÃO UMA FICHA NOVA ──────────────────────────────────
 *
 * Uma ficha própria significaria manter uma cópia do template do sistema, que
 * muda a cada versão dele. Injetar custa um gancho de render e sai inteiro
 * quando o módulo é desligado.
 *
 * `renderOD2CharacterSheet` DISPARA — o painel de Grandezas do módulo Star Wars
 * já usa esse gancho.
 *
 * ── O QUE ELE NÃO FAZ ───────────────────────────────────────────────────────
 *
 * Aplicar efeito de especialização. O sabotador que soma a diferença entre
 * escalar e 100%, o espião que copia uma coluna na outra — nada disso é
 * automático. Shift-clique abre o diálogo, que tem o campo de situação.
 */

import { CAMPO_NA_FICHA, NOME_ATRIBUTO, SIGLA, TESTES } from "./dados.js";
import { preparar, rolar } from "./testes.js";

const ID = "spacedragon";
const MARCA = "spacedragon-testes";

/** O valor de um atributo do Space Dragon, no campo do OD2 onde ele é anotado. */
const atributoDe = (ator, a) => Number(ator.system?.[CAMPO_NA_FICHA[a]]) || 0;

function valoresDe(ator) {
  const v = {};
  for (const a of Object.keys(CAMPO_NA_FICHA)) v[a] = atributoDe(ator, a);
  return v;
}

const sinal = (n) => (n > 0 ? `+${n}` : `${n}`);
const escapa = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

function linha(teste, nivel, valores) {
  const { base, ajuste, alvo } = preparar(teste.chave, { nivel, valores });
  const d6 = teste.dado === "1d6";

  // De onde saiu o número. Sem isto a linha é caixa-preta, e ninguém percebe
  // que o atributo está em branco na ficha.
  const contas = [`${base.cru ?? base.valor}`];
  if (ajuste) {
    contas.push(`${sinal(ajuste.valor)} ${SIGLA[ajuste.atributo]} ${ajuste.valorAtributo || "—"}`);
  }

  const semAtributo = ajuste && !ajuste.valorAtributo;
  const aviso = semAtributo
    ? ` <span class="sd-alerta" title="${escapa(
        `Preencha ${NOME_ATRIBUTO[ajuste.atributo]}, que este módulo anota no campo ` +
        `${CAMPO_NA_FICHA[ajuste.atributo]} da ficha.`
      )}">⚠</span>`
    : "";

  return (
    `<li class="sd-teste-linha">` +
    `<a class="sd-rolar" data-teste="${teste.chave}" ` +
    `title="Rolar ${escapa(teste.nome)} — clique com Shift para somar modificador de situação">` +
    `<i class="fa-thin fa-dice-d20"></i> ${escapa(teste.nome)}` +
    `${teste.segredo ? " 🤫" : ""}</a>` +
    `<span class="sd-alvo">${d6 ? `1–${alvo}` : `${alvo}%`}</span>` +
    `<span class="sd-conta">${contas.join(" ")}${aviso}</span>` +
    `</li>`
  );
}

function bloco(lista, nivel, valores) {
  const temSegredo = lista.some((t) => t.segredo);
  return (
    `<div class="${MARCA}">` +
    `<ul class="sd-testes">${lista.map((t) => linha(t, nivel, valores)).join("")}</ul>` +
    `<p class="sd-rodape">1d100, passa com <strong>menor ou igual</strong>. ` +
    `Shift-clique soma modificador de situação.` +
    (temSegredo ? " 🤫 vai sussurrado ao Mestre, como o livro manda." : "") +
    `</p></div>`
  );
}

/**
 * Injeta, em cada habilidade de classe da ficha, os testes que pertencem a ela.
 *
 * O casamento é pelo NOME do item, e não pelo id: o compêndio gera ids novos a
 * cada rebuild, mas o nome da habilidade é estável e é o que o autor controla.
 */
export function ligarPainel() {
  Hooks.on("renderOD2CharacterSheet", (app, html) => {
    const raiz = html?.[0] ?? html;
    if (!raiz?.querySelector) return;

    const ator = app.actor;
    if (!ator?.system?.class) return;

    // Idempotente: o Foundry pode renderizar a mesma ficha várias vezes.
    for (const velho of raiz.querySelectorAll(`.${MARCA}`)) velho.remove();

    const nivel = Number(ator.system?.level) || 1;
    const valores = valoresDe(ator);

    for (const li of raiz.querySelectorAll(".character-tab-class .class-abilities .item")) {
      const item = ator.items.get(li.dataset.itemId);
      if (!item) continue;

      const lista = TESTES.filter((t) => t.habilidade === item.name);
      if (!lista.length) continue;

      li.insertAdjacentHTML("beforeend", bloco(lista, nivel, valores));
    }

    for (const a of raiz.querySelectorAll(`.${MARCA} .sd-rolar`)) {
      a.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation(); // o <li> da habilidade abre a ficha do item
        const chave = ev.currentTarget.dataset.teste;
        const teste = TESTES.find((t) => t.chave === chave);
        // Shift abre o diálogo, para quando houver modificador de situação.
        // Sem shift rola direto: o nível e os atributos já estão aqui.
        if (ev.shiftKey) return game.spacedragon.teste(chave, ator);
        return rolar(
          chave,
          { nivel: Number(ator.system?.level) || 1, valores: valoresDe(ator), situacional: 0 },
          { ator, publico: !teste?.segredo }
        );
      });
    }
  });

  console.log(`${ID} | testes ligados às habilidades de classe na ficha`);
}
