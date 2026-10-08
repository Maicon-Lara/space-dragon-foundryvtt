// Os botões de instalar aparecem com o ator que a mesa tem de verdade.
//
// ── O BUG QUE ISTO EXISTE PARA NÃO DEIXAR VOLTAR ────────────────────────────
//
// `marcarComodos` lia a chave do cômodo assim:
//
//     const item = ator.items.get(linha.dataset.itemId);
//     const chave = item?.getFlag(ID, "camaraDeNave")?.chave;
//     if (!chave) continue;
//
// Os cômodos chegam à nave como habilidades da CLASSE, e `data-item-id` aponta
// para a habilidade dentro de `actor.system.class_abilities`, que o sistema
// resolve a partir dos UUIDs do COMPÊNDIO. Esses documentos nem sempre estão
// embutidos no ator — então `items.get(id)` devolve `undefined`, o laço dá
// `continue` em todas as doze linhas, e a ficha abre sem um único botão.
//
// Sem erro no console, porque não houve erro.
//
// ── O QUE ME FAZ ESCREVER ESTE TESTE E NÃO OUTRO ────────────────────────────
//
// Esta falha JÁ estava vivida e JÁ estava escrita neste repositório, em
// painel.js, com a nota explicando a saída — ler o NOME do DOM, que está sempre
// lá. Eu reescrevi a leitura por `items.get` de novo, em código novo, com a
// lição num arquivo ao lado.
//
// E os testes de nave passavam todos, porque todos montavam o ator COM os itens
// dentro. O caso que a mesa vive era o único que nenhum deles cobria. Então a
// asserção central aqui é com `items` VAZIO: é o ator real, e é o que estava
// sem rede.
//
// Uso: node tools/teste-comodos-no-dom.mjs

import { marcarComodos, CLASSE_SELETOR } from "../spacedragon-module/module/nave-pc-ficha.js";
import { CAMARAS } from "../spacedragon-module/module/camaras.js";

const ID = "spacedragon";
const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

/* ── UM DOM MÍNIMO, COM O QUE O TEMPLATE DO SISTEMA ESCREVE ────────────────── */
//
// O sistema escreve `<span><strong>{{ability.name}}</strong>:</span>` dentro de
// `.ability`. Este DOM reproduz isso e nada mais — o suficiente para que a
// função sob teste encontre o que encontraria na ficha.

function linhaDeHabilidade(itemId, nome) {
  const botoes = [];
  const li = {
    dataset: { itemId },
    classes: new Set(),
    html: [],
    nomeExibido: nome,
  };
  li.classList = {
    add: (c) => li.classes.add(c),
    remove: (...cs) => cs.forEach((c) => li.classes.delete(c)),
    contains: (c) => li.classes.has(c),
  };
  li.querySelector = (sel) => {
    if (sel === ".ability strong" && nome != null) return { textContent: `${nome}:` };
    return null;
  };
  li.querySelectorAll = (sel) => (sel === `.${CLASSE_SELETOR}` ? botoes : []);
  li.insertAdjacentHTML = (onde, html) => {
    li.html.push(html);
    // um botão desenhado passa a ser achável, para o teste do redesenho
    botoes.push({ remove: () => botoes.splice(botoes.indexOf(this), 1) });
  };
  return li;
}

function raizCom(linhas) {
  return { querySelectorAll: (sel) => (sel === "[data-item-id]" ? linhas : []) };
}

/* ── 1. O ATOR SEM OS ITENS: O CASO DA MESA ────────────────────────────────── */
{
  const linhas = [
    linhaDeHabilidade("abc123", "Ponte de Comando"),
    linhaDeHabilidade("def456", "Sala de Máquinas"),
    linhaDeHabilidade("ghi789", "Arsenal"),
  ];
  // `items` vazio e `items.get` devolvendo undefined: é exatamente o ator da
  // mesa, com as habilidades resolvidas dos UUIDs do compêndio
  const ator = {
    items: { get: () => undefined, [Symbol.iterator]: function* () {} },
    getFlag: (quem, nome) =>
      quem === ID && nome === "nave" ? { tipo: "cargueiro", camaras: {} } : undefined,
  };

  const achados = marcarComodos(raizCom(linhas), ator);
  confere(achados === 3,
    `marcarComodos achou ${achados} cômodo(s) num ator SEM os itens embutidos — era 0 ` +
    `antes do conserto, e a ficha abria sem um único botão de instalar. É o ator da mesa: ` +
    `as habilidades vêm dos UUIDs do compêndio, e items.get() devolve undefined`);
  for (const l of linhas) {
    confere(l.html.length === 1,
      `"${l.nomeExibido}" recebeu ${l.html.length} botão(ões) em vez de 1`);
    confere(l.html[0]?.includes(`data-comodo=`),
      `o botão de "${l.nomeExibido}" saiu sem data-comodo, e o clique não sabe qual cômodo é`);
  }
  // a Ponte é base: nasce instalada, e o botão tem de dizer isso
  confere(linhas[0].html[0]?.includes("estado-instalada"),
    "a Ponte não nasceu instalada — ela é um dos dois cômodos que o texto veta dispensar");
  confere(linhas[0].html[0]?.includes('data-comodo="ponte"'),
    `o nome "Ponte de Comando" não virou a chave "ponte" — o mapa de rótulos não casou`);
  // o Arsenal não é base: nasce ausente
  confere(linhas[2].html[0]?.includes("estado-ausente"),
    "o Arsenal não nasceu ausente — só Ponte e Sala de Máquinas vêm de fábrica");
}

/* ── 2. E O CAMINHO ANTIGO CONTINUA ────────────────────────────────────────── */
//
// Quem TEM os itens embutidos (a nave convertida do Tático, o item arrastado à
// mão) deve continuar funcionando pela flag. Consertar um caminho quebrando o
// outro é trocar de bug.
{
  const linha = linhaDeHabilidade("xyz", null);   // sem nome no DOM: só a flag resolve
  const item = { flags: { [ID]: { camaraDeNave: { chave: "hospital" } } } };
  const ator = {
    items: { get: (id) => (id === "xyz" ? item : undefined) },
    getFlag: (q, n) => (q === ID && n === "nave" ? { tipo: "cargueiro", camaras: {} } : undefined),
  };
  confere(marcarComodos(raizCom([linha]), ator) === 1,
    "o cômodo que vem pela FLAG do item deixou de ser achado — a nave convertida do " +
    "Combate Tático e o item arrastado à mão usam esse caminho");
  confere(linha.html[0]?.includes('data-comodo="hospital"'),
    "a flag do item deu a chave errada");
}

/* ── 3. O PLANO B NÃO PODE PEGAR O QUE NÃO É CÔMODO ───────────────────────── */
//
// Casar por nome em QUALQUER linha faria um equipamento chamado "Arsenal" virar
// cômodo. O escopo é `.ability strong`, que é o que o template escreve para uma
// habilidade de classe — fora dela, o plano B não olha.
{
  const semAbility = {
    dataset: { itemId: "q1" },
    classes: new Set(),
    html: [],
    querySelector: () => null,                     // nenhum .ability strong
    querySelectorAll: () => [],
    insertAdjacentHTML: () => { throw new Error("desenhou botão em linha que não é cômodo"); },
  };
  semAbility.classList = { add: () => {}, remove: () => {}, contains: () => false };
  const ator = {
    items: { get: () => undefined },
    getFlag: (q, n) => (q === ID && n === "nave" ? {} : undefined),
  };
  let erro = null;
  try {
    confere(marcarComodos(raizCom([semAbility]), ator) === 0,
      "uma linha sem .ability virou cômodo — todo item da ficha ganharia botão");
  } catch (e) {
    erro = e.message;
  }
  confere(!erro, `o plano B desenhou botão fora de uma habilidade de classe: ${erro}`);

  // e um nome que não é de câmara nenhuma
  const outroNome = linhaDeHabilidade("q2", "Pilotar Naves");
  confere(marcarComodos(raizCom([outroNome]), ator) === 0,
    `"Pilotar Naves" é habilidade de classe e NÃO é cômodo — virou um, e a aba inteira ` +
    `de habilidades ganharia seletor de estado`);
}

/* ── 4. OS DOZE RÓTULOS CASAM, UM POR UM ──────────────────────────────────── */
//
// O plano B depende de o nome na ficha ser igual ao rótulo em camaras.js. São
// duas fontes separadas — o compêndio semeia o nome, o runtime guarda o rótulo
// —, e um acento trocado em qualquer uma delas devolve o bug em silêncio, só
// naquele cômodo.
{
  const ator = {
    items: { get: () => undefined },
    getFlag: (q, n) => (q === ID && n === "nave" ? { camaras: {} } : undefined),
  };
  const chaves = Object.keys(CAMARAS);
  confere(chaves.length === 12, `camaras.js tem ${chaves.length} câmaras, e a T10-2 traz 12`);

  for (const [chave, c] of Object.entries(CAMARAS)) {
    const linha = linhaDeHabilidade(`i-${chave}`, c.rotulo);
    marcarComodos(raizCom([linha]), ator);
    confere(linha.html[0]?.includes(`data-comodo="${chave}"`),
      `"${c.rotulo}" não resolveu para "${chave}" — o nome na ficha e o rótulo em ` +
      `camaras.js precisam bater letra por letra, acentos inclusive`);
  }
}

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log(
  "  ✔ cômodos no DOM: o botão de instalar aparece no ator SEM os itens embutidos (o da " +
    "mesa: as habilidades vêm dos UUIDs do compêndio e items.get() devolve undefined), a " +
    "flag do item continua valendo, o plano B não toca em quem não é cômodo, e os 12 " +
    "rótulos da T10-2 casam um por um"
);
