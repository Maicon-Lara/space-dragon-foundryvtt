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
 * O nome da habilidade escrito no `<li>`.
 *
 * ── POR QUE DO DOM, E NÃO DE `ator.items` ───────────────────────────────────
 *
 * Foi assim que a primeira versão falhou em silêncio. `data-item-id` aponta
 * para a habilidade dentro de `actor.system.class_abilities`, que o sistema
 * resolve a partir dos UUIDs do COMPÊNDIO. Nem sempre esses documentos estão
 * embutidos no ator, e `ator.items.get(id)` devolvia `undefined` — o laço
 * pulava tudo e a ficha ficava sem botão nenhum, sem erro no console.
 *
 * O template escreve `<span><strong>{{ability.name}}</strong>:</span>` dentro
 * de `.ability`. O nome está ali, sempre, venha o documento de onde vier.
 */
function nomeDaHabilidade(li) {
  const forte = li.querySelector(".ability strong");
  return forte ? forte.textContent.trim().replace(/:$/, "") : null;
}

/** Desenha os testes dentro de cada habilidade de classe da ficha. */
function injeta(app, elemento) {
  try {
    // Por capacidade, e não por `instanceof HTMLElement`: o gancho entrega
    // jQuery no appv1 e elemento cru se o sistema migrar, e depender de um
    // global que pode não existir já derrubou script deste projeto antes.
    const raiz = elemento?.querySelectorAll ? elemento : elemento?.[0];
    const ator = app?.actor ?? app?.document;
    if (!raiz?.querySelectorAll || ator?.type !== "character") return;
    if (!ator.system?.class) return;

    // Idempotente: o Foundry pode renderizar a mesma ficha várias vezes.
    for (const velho of raiz.querySelectorAll(`.${MARCA}`)) velho.remove();

    const nivel = Number(ator.system?.level) || 1;
    const valores = valoresDe(ator);
    let postos = 0;

    for (const li of raiz.querySelectorAll(".class-abilities .item")) {
      const nome = nomeDaHabilidade(li);
      if (!nome) continue;

      const lista = TESTES.filter((t) => t.habilidade === nome);
      if (!lista.length) continue;

      li.insertAdjacentHTML("beforeend", bloco(lista, nivel, valores));
      postos += lista.length;
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

    if (!postos) {
      console.debug(`${ID} | nenhum teste casou em ${ator.name}. Rode game.spacedragon.diagnostico()`);
    }
  } catch (e) {
    // Nunca quebrar a ficha do sistema por causa de um botão do módulo.
    console.warn(`${ID} | testes não puderam ser desenhados`, e);
  }
}

/**
 * Diz por que a ficha aberta não mostrou botão, comparando os nomes que o
 * módulo espera com os que estão desenhados na tela.
 */
export function diagnostico() {
  const app = Object.values(ui.windows).find((w) => w?.actor?.type === "character");
  if (!app) return ui.notifications.warn("Abra a ficha de um personagem primeiro.");

  const raiz = app.element?.[0] ?? app.element;
  const naTela = [...(raiz?.querySelectorAll(".class-abilities .item") ?? [])]
    .map(nomeDaHabilidade)
    .filter(Boolean);
  const esperados = [...new Set(TESTES.map((t) => t.habilidade).filter(Boolean))];

  console.group(`${ID} | diagnóstico — ${app.actor.name}`);
  console.log("classe na ficha :", app.actor.system?.class?.name ?? "(nenhuma)");
  console.log("nível           :", app.actor.system?.level);
  console.log("habilidades na tela:", naTela);
  console.log("nomes que o módulo espera:", esperados);
  console.log("casaram:", naTela.filter((n) => esperados.includes(n)));
  console.groupEnd();
  return { naTela, esperados };
}

export function ligarPainel() {
  // Os dois ganchos disparam neste sistema. Usamos o específico e caímos no
  // genérico se ele sumir numa versão futura — sem desenhar duas vezes.
  Hooks.on("renderOD2CharacterSheet", injeta);
  Hooks.on("renderActorSheet", (app, el) => {
    if (app?.constructor?.name !== "OD2CharacterSheet") injeta(app, el);
  });

  console.log(`${ID} | testes ligados às habilidades de classe na ficha`);
}
