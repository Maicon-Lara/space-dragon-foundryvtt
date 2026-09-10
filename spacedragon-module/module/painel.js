/**
 * O painel de testes de porcentagem na ficha.
 *
 * ── O PROBLEMA QUE ELE RESOLVE ──────────────────────────────────────────────
 *
 * Metade das habilidades do Space Dragon é uma porcentagem que MUDA COM O
 * NÍVEL, e várias ainda somam uma coluna de atributo. A ficha do Old Dragon 2
 * mostra a descrição da habilidade, que é texto fixo: "80% no 1º nível, subindo
 * 1 ponto por nível". Quem está no 7º tem de fazer a conta de cabeça toda vez,
 * e ainda lembrar de somar a Destreza.
 *
 * Este painel mostra o número JÁ CALCULADO para o nível e os atributos daquela
 * ficha, e cada linha rola.
 *
 * ── POR QUE INJETADO, E NÃO UMA FICHA NOVA ──────────────────────────────────
 *
 * Uma ficha própria significaria manter uma cópia do template do sistema, que
 * muda a cada versão dele, para ganhar um painel. Injetar custa um gancho de
 * render e sai inteiro quando o módulo é desligado.
 *
 * `renderOD2CharacterSheet` DISPARA — medido, e o módulo Star Wars já usa esse
 * gancho para o painel de Grandezas. O comentário antigo dizendo que ganchos de
 * render não funcionam no OD2 estava errado.
 *
 * ── O QUE ELE NÃO FAZ ───────────────────────────────────────────────────────
 *
 * Aplicar efeito de especialização. O sabotador que soma a diferença entre
 * escalar e 100%, o espião que copia uma coluna na outra — nada disso é
 * automático, e o painel diz isso em vez de fingir. O modificador de situação
 * do diálogo é onde essas coisas entram.
 */

import { CAMPO_NA_FICHA, NOME_ATRIBUTO, SIGLA, TESTES } from "./dados.js";
import { preparar, rolar } from "./testes.js";

const ID = "spacedragon";
const MARCA = "spacedragon-painel";

/**
 * A classe-base por trás do item de classe da ficha.
 *
 * A especialização é um item de classe próprio, rotulado
 * "Emissário — Cosmonauta": a especialização primeiro, porque é o nome que o
 * jogador procura. A classe-base é o último segmento.
 *
 *   "Cosmonauta"              → "Cosmonauta"
 *   "Emissário — Cosmonauta"  → "Cosmonauta"
 *
 * O separador é o travessão com espaços, o mesmo que o build escreve. Um hífen
 * comum não conta: "Caçador de Recompensas" tem espaços mas nenhum travessão, e
 * partir no lugar errado faria a ficha não achar teste nenhum.
 */
function classeBase(ator) {
  const nome = ator.system?.class?.name ?? "";
  const partes = nome.split(" — ");
  return partes[partes.length - 1].trim();
}

/**
 * Quais testes valem para esta ficha. Os sem classe — clonagem — valem para
 * todo mundo.
 */
function testesDe(ator) {
  const base = classeBase(ator);
  return TESTES.filter((t) => !t.classe || t.classe === base);
}

/** O valor de um atributo do Space Dragon, no campo do OD2 onde ele é anotado. */
const atributoDe = (ator, a) => Number(ator.system?.[CAMPO_NA_FICHA[a]]) || 0;

function valoresDe(ator) {
  const v = {};
  for (const a of Object.keys(CAMPO_NA_FICHA)) v[a] = atributoDe(ator, a);
  return v;
}

const sinal = (n) => (n > 0 ? `+${n}` : `${n}`);

function linha(ator, teste, nivel, valores) {
  const { base, ajuste, alvo } = preparar(teste.chave, { nivel, valores });
  const d6 = teste.dado === "1d6";

  // De onde saiu o número. Sem isto o painel é uma caixa-preta, e a mesa não
  // tem como perceber que o atributo está em branco na ficha.
  const contas = [`${base.cru ?? base.valor} <em>(nível ${nivel})</em>`];
  if (ajuste) {
    contas.push(
      `${sinal(ajuste.valor)} <em>${ajuste.rotulo}, ` +
      `${SIGLA[ajuste.atributo]} ${ajuste.valorAtributo || "—"}</em>`
    );
  }

  const faltando =
    ajuste && !ajuste.valorAtributo
      ? ` <span class="sd-alerta" title="Preencha ${NOME_ATRIBUTO[ajuste.atributo]} ` +
        `no campo ${CAMPO_NA_FICHA[ajuste.atributo]} da ficha">⚠</span>`
      : "";

  return (
    `<li class="sd-linha" data-teste="${teste.chave}">` +
    `<a class="sd-rolar" data-teste="${teste.chave}" ` +
    `title="${game.i18n.localize("spacedragon.painel.rolar")}">` +
    `<i class="fa-thin fa-dice-d20"></i></a>` +
    `<span class="sd-nome">${teste.nome}${teste.segredo ? " 🤫" : ""}${faltando}</span>` +
    `<span class="sd-alvo">${d6 ? `1–${alvo}` : `${alvo}%`}</span>` +
    `<span class="sd-conta">${contas.join(" ")}</span>` +
    `</li>`
  );
}

function montaPainel(ator) {
  const lista = testesDe(ator);
  if (!lista.length) return null;

  const nivel = Number(ator.system?.level) || 1;
  const valores = valoresDe(ator);

  const linhas = lista.map((t) => linha(ator, t, nivel, valores)).join("");

  return (
    `<div class="${MARCA}">` +
    `<label class="tab-title">${game.i18n.localize("spacedragon.painel.titulo")}</label>` +
    `<p class="sd-explica">Rola <strong>1d100</strong> e passa com ` +
    `<strong>menor ou igual</strong>. 🤫 marca a rolagem que o livro manda o Mestre fazer.</p>` +
    `<ol class="sd-lista">${linhas}</ol>` +
    `<p class="sd-explica">Efeito de especialização não entra sozinho — ` +
    `use o modificador de situação, no botão de rolagem.</p>` +
    `</div>`
  );
}

/**
 * Injeta o painel na aba de Classe, logo depois da lista de habilidades.
 *
 * `html` chega como jQuery no appv1 e como HTMLElement se o sistema migrar;
 * normalizar aqui evita que a migração quebre o painel em silêncio.
 */
export function ligarPainel() {
  Hooks.on("renderOD2CharacterSheet", (app, html) => {
    const raiz = html?.[0] ?? html;
    if (!raiz?.querySelector) return;

    // Idempotente: o Foundry pode renderizar a mesma ficha várias vezes.
    raiz.querySelector(`.${MARCA}`)?.remove();

    const ator = app.actor;
    if (!ator?.system?.class) return;

    const painel = montaPainel(ator);
    if (!painel) return;

    const alvo =
      raiz.querySelector(".character-tab-class .class-abilities") ??
      raiz.querySelector(".character-tab-class");
    if (!alvo) return;

    alvo.insertAdjacentHTML("afterend", painel);

    for (const a of raiz.querySelectorAll(`.${MARCA} .sd-rolar`)) {
      a.addEventListener("click", (ev) => {
        ev.preventDefault();
        const chave = ev.currentTarget.dataset.teste;
        const teste = TESTES.find((t) => t.chave === chave);
        // Sem diálogo: o painel já sabe nível e atributos. Segurar shift abre o
        // diálogo, para quando houver modificador de situação.
        if (ev.shiftKey) return game.spacedragon.teste(chave, ator);
        return rolar(
          chave,
          { nivel: Number(ator.system?.level) || 1, valores: valoresDe(ator), situacional: 0 },
          { ator, publico: !teste?.segredo }
        );
      });
    }
  });

  console.log(`${ID} | painel de testes ligado ao renderOD2CharacterSheet`);
}
