// Teste do layout que encolhe: as container queries das fichas.
//
// ── POR QUE ESTE TESTE EXISTE ───────────────────────────────────────────────
//
// Três erros possíveis aqui, e os três são SILENCIOSOS — o CSS continua válido,
// o navegador não reclama, e a regra simplesmente não vale:
//
//   1. `@container nome (…)` com um nome que ninguém declarou. A regra não acha
//      contêiner e é letra morta. Aconteceu na primeira versão deste bloco: a
//      Ficha de Ameaça não tinha `container-type`, e a regra dos atributos
//      nunca se aplicava.
//
//   2. `@media (max-width: …)` para adaptar uma ficha. Media query responde ao
//      tamanho da TELA; a ficha do Foundry é uma janela que o jogador arrasta, e
//      a tela não muda quando ele a encolhe. O layout parece responsivo no
//      navegador redimensionado e não funciona na mesa.
//
//   3. Um grid de três ou mais colunas sem versão estreita. Seis colunas numa
//      janela apertada não são seis campos pequenos: são seis rótulos ilegíveis
//      sobre seis números cortados.
//
// Uso: node tools/teste-responsivo.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(fileURLToPath(import.meta.url), "../..");
// `tema.css` saiu na 1.26.0: as cores voltaram a ser do sistema, e a folha era
// 100% cor. `nave.css` entrou com a Ficha de Nave.
const FOLHAS = [
  "spacedragon-module/styles/spacedragon.css",
  "spacedragon-module/styles/nave.css",
];

// As raízes de ficha, que o Foundry dimensiona pela janela e por isso não
// precisam de largura explícita. Qualquer OUTRO elemento com
// `container-type: inline-size` precisa — ver a conferência 5.
const RAIZES_DE_FICHA = new Set([".spacedragon-ameaca"]);

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

/** O CSS sem comentários: senão um exemplo comentado conta como regra. */
const semComentarios = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");

let houveContainer = false;

for (const rel of FOLHAS) {
  const css = semComentarios(fs.readFileSync(path.join(RAIZ, rel), "utf8"));
  const nome = path.basename(rel);

  // ── 1. todo @container nomeado tem contêiner declarado ──────────────────
  const declarados = new Set([...css.matchAll(/container-name:\s*([a-zA-Z-]+)/g)].map((m) => m[1]));
  const usados = [...css.matchAll(/@container\s+([a-zA-Z-]+)\s*\(/g)].map((m) => m[1]);
  for (const u of usados) {
    confere(declarados.has(u),
      `${nome}: @container "${u}" não tem container-name declarado — a regra é letra morta`);
  }
  // e o contrário: contêiner declarado e nunca consultado é peso morto, e
  // `container-type` não é gratuito (ele contém o eixo inline do elemento)
  for (const d of declarados) {
    confere(usados.includes(d), `${nome}: container-name "${d}" declarado e nunca usado`);
  }
  // nome sem tipo não cria contêiner nenhum
  const comTipo = (css.match(/container-type:\s*inline-size/g) ?? []).length;
  confere(comTipo >= declarados.size,
    `${nome}: ${declarados.size} container-name para ${comTipo} container-type — nome sem tipo não cria contêiner`);
  if (usados.length) houveContainer = true;

  // ── 2. nada de media query de LARGURA para adaptar ficha ────────────────
  // `prefers-color-scheme` e `print` são outra coisa, e continuam valendo.
  const mediaLargura = [...css.matchAll(/@media[^{]*\((min|max)-width[^{]*\{/g)].map((m) => m[0].trim());
  confere(mediaLargura.length === 0,
    `${nome}: @media de largura não enxerga a janela da ficha, só a tela — use @container: ${mediaLargura.join(" | ")}`);

  // ── 3. grid de 3+ colunas precisa de versão estreita ────────────────────
  //
  // Varre bloco a bloco. Para cada seletor com `repeat(N, …)` e N ≥ 3, exige
  // que o mesmo seletor reapareça dentro de algum `@container`.
  const dentroDeContainer = css
    .split(/@container/)
    .slice(1)
    .join("\n");

  for (const m of css.matchAll(/([^{}@]+)\{([^{}]*grid-template-columns:\s*repeat\((\d+)\s*,[^{}]*)\}/g)) {
    const [, seletor, , colunas] = m;
    if (Number(colunas) < 3) continue;
    const sel = seletor.trim().split("\n").pop().trim();
    // a classe final do seletor é o que a regra estreita precisa repetir
    const classe = sel.split(/\s+/).pop();
    confere(dentroDeContainer.includes(classe),
      `${nome}: "${sel}" tem ${colunas} colunas e nenhuma versão estreita em @container — ` +
      `numa ficha apertada isso vira ${colunas} rótulos ilegíveis`);
  }

  // ── 5. CONTAINMENT EXIGE LARGURA EXPLÍCITA ──────────────────────────────
  //
  // `container-type: inline-size` tira do elemento o dimensionamento pelo
  // conteúdo no eixo horizontal. Num pai que estica os filhos ninguém nota; num
  // pai que os alinha pelo início, o elemento COLAPSA até o mínimo. Foi assim
  // que o painel da Ordem de Ação saiu como uma coluna de 60px, com o título
  // quebrado em três linhas e o botão cortado.
  //
  // Não vale para a RAIZ de uma ficha: quem a dimensiona é a janela do Foundry.
  for (const m of css.matchAll(/([^{}@]+)\{([^{}]*container-type:\s*inline-size[^{}]*)\}/g)) {
    const sel = m[1].trim().split("\n").pop().trim();
    const corpo = m[2];
    // Lista EXPLÍCITA, e não um padrão de nome: a primeira versão disto usava
    // /^\.[a-z-]+(-ficha)?$/, que é guloso e também casava ".sd-ordem-ficha" —
    // justamente o elemento que o teste existe para cobrir. A sabotagem passou
    // batida, e a asserção não valia nada.
    if (RAIZES_DE_FICHA.has(sel)) continue;
    confere(/width:\s*100%/.test(corpo),
      `${nome}: "${sel}" tem container-type sem width explícita — num pai que ` +
      `não estica os filhos, ele colapsa até o mínimo`);
  }

  // ── 4. mínimo fixo que não cede ─────────────────────────────────────────
  //
  // `min-width: 230px` numa coluna de ficha empurra o conteúdo para fora quando
  // a ficha é mais estreita que isso. `min(230px, 100%)` cede.
  for (const m of css.matchAll(/([^{}@]+)\{[^{}]*min-width:\s*(\d{3,})px/g)) {
    const sel = m[1].trim().split("\n").pop().trim();
    confere(/barra|pct|input|button|select/.test(sel),
      `${nome}: "${sel}" exige ${m[2]}px de largura mínima — use min(${m[2]}px, 100%) para ceder`);
  }
}

confere(houveContainer, "nenhuma container query nas folhas — o layout não encolhe em lugar nenhum");

// ── 5. A ORDEM, E QUE A QUERY SOBRESCREVA ALGO ───────────────────────────
//
// `@container` não acrescenta especificidade: com a mesma do seletor base,
// vence quem vem DEPOIS no arquivo. Então todo seletor ajustado numa query
// precisa ter a regra base ANTES dela — e precisa TER uma regra base: query que
// não sobrescreve nada é query que não faz nada, e ninguém nota.
{
  const css = semComentarios(fs.readFileSync(path.join(RAIZ, FOLHAS[0]), "utf8"));
  const corte = css.indexOf("@container");
  const antes = css.slice(0, corte);
  const queries = css.slice(corte);

  for (const m of queries.matchAll(/([.][a-zA-Z][\w-]*(?:\s+[.][a-zA-Z][\w-]*)*)\s*[,{]/g)) {
    const sel = m[1].trim();
    const classe = sel.split(/\s+/).pop();
    confere(antes.includes(classe),
      `"${sel}" é ajustado numa @container, mas a classe ${classe} não tem regra ` +
      `antes dela — ou a base está depois (e vence), ou a query não ajusta nada`);
  }
}

// ── 6. O CARTÃO DO CHAT SE BASTA ──────────────────────────────────────────
//
// O cartão saiu ilegível na mesa: texto claro sobre o pergaminho claro do chat.
// A cor herdada do chat muda com o tema do Foundry, com o sistema e com
// qualquer módulo de interface — então o cartão não pode depender dela.
//
// A regra é o PAR: fundo e cor declarados juntos. Fundo sem cor herda o texto
// do tema (foi exatamente o bug); cor sem fundo aposta no que o chat vai fazer.
{
  const css = semComentarios(fs.readFileSync(path.join(RAIZ, FOLHAS[0]), "utf8"));

  const luminancia = (hex) => {
    const n = hex.replace("#", "");
    const c = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255)
      .map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const contraste = (a, b) => {
    const [maior, menor] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
    return (maior + 0.05) / (menor + 0.05);
  };

  const bloco = (sel) => {
    const i = css.indexOf(sel);
    return i < 0 ? "" : css.slice(i, css.indexOf("}", i));
  };

  /* ── O CARTÃO DO CHAT, DEPOIS QUE AS CORES SAÍRAM ───────────────────────
   *
   * Este bloco media o contraste do cartão e exigia fundo e cor DECLARADOS
   * JUNTOS — metade do par vinha do tema do Foundry, e as duas andavam
   * separadas.
   *
   * Desde a 1.26.0 o módulo não pinta: o cartão usa as cores do chat do
   * sistema, que já são legíveis por construção. Exigir o par agora cobraria
   * exatamente o que foi removido a pedido da mesa.
   *
   * A medição de contraste fica, e vale QUANDO houver cor: se alguém voltar a
   * pintar o cartão, a régua da WCAG volta a valer sem que ninguém precise
   * lembrar de reativá-la.
   */
  const principal = bloco(".chat-message .sd-teste {");
  const fundo = principal.match(/background:\s*(#[0-9a-fA-F]{6})/)?.[1];
  const cor = principal.match(/color:\s*(#[0-9a-fA-F]{6})/)?.[1];
  confere(!(fundo && !cor) && !(cor && !fundo),
    `o cartão do chat declara ${fundo ? "fundo sem cor" : "cor sem fundo"} — ` +
    "a metade que falta vem do tema, e as duas andam separadas");

  if (fundo && cor) {
    const r = contraste(cor, fundo);
    confere(r >= 4.5, `contraste do cartão ${r.toFixed(2)}:1 — a WCAG pede 4,5:1 para texto normal`);
  }

  // O texto de apoio também: ele é mais leve DE PROPÓSITO, mas leve demais é
  // o mesmo bug de novo, só que mais discreto.
  const apoio = bloco(".chat-message .sd-teste .sd-nota,");
  const corApoio = apoio.match(/color:\s*(#[0-9a-fA-F]{6})/)?.[1];
  if (corApoio && fundo) {
    const r = contraste(corApoio, fundo);
    confere(r >= 4.5, `contraste do texto de apoio ${r.toFixed(2)}:1 — a WCAG pede 4,5:1`);
  }

  // E nada de `opacity` no cartão do chat: opacidade sobre cor herdada foi
  // metade do problema original, porque esconde o quanto o contraste caiu.
  confere(!/opacity:/.test(principal),
    "o cartão do chat não deve usar opacity — ela mascara a queda de contraste");
}

// ── 7. BOTÃO ESTILIZADO DECLARA O PAR COR+FUNDO ──────────────────────────
//
// O erro de hoje, três vezes seguidas e em três lugares diferentes: estilizar
// um elemento (largura, altura, padding) e NÃO declarar cor nem fundo. O texto
// herda a cor do tema e cai sobre o fundo que o tema der — e as duas pontas
// mudam de forma independente. No botão "declarar" isso saiu como um botão SEM
// TEXTO na mesa: só a borda aparecia.
//
// A primeira versão desta conferência procurava a palavra "button" no SELETOR,
// e por isso nunca olhou o bloco certo: o botão é identificado por classe
// (.sd-ordem-declarar). Agora o caminho vai do HTML ao CSS — as classes que o
// JS põe num <button> é que são cobradas.
{
  const css = semComentarios(fs.readFileSync(path.join(RAIZ, FOLHAS[0]), "utf8"));
  const dir = path.join(RAIZ, path.dirname(path.dirname(FOLHAS[0])), "module");
  const classesDeBotao = new Set();

  for (const f of fs.readdirSync(dir).filter((n) => n.endsWith(".js"))) {
    const js = fs.readFileSync(path.join(dir, f), "utf8");
    for (const m of js.matchAll(/<button[^>]*class="([^"]+)"/g)) {
      for (const c of m[1].split(/\s+/)) if (c && !c.includes("$")) classesDeBotao.add(c);
    }
  }
  confere(classesDeBotao.size > 0, "nenhuma classe de <button> encontrada — a varredura falhou");

  // A folha tem um padrão BASE para botão? (uma regra sobre o elemento, com o
  // par declarado). A ficha de Nave tem; o painel da Ordem de Ação não tinha, e
  // foi por isso que o botão dele saiu sem texto.
  const temBaseDeBotao = [...css.matchAll(/([^{}@]*button[^{}@]*)\{([^{}]*)\}/g)].some(
    ([, sel, corpo]) =>
      !/:hover|:focus|:disabled/.test(sel) &&
      /(^|[;{\s])color\s*:/.test(corpo) &&
      /background(-color)?\s*:/.test(corpo)
  );

  for (const c of [...classesDeBotao].sort()) {
    // Só cobra de quem o CSS ASSUME: se o módulo não estiliza o botão, ele fica
    // com a aparência do tema, que é coerente consigo mesma. O erro é estilizar
    // pela metade.
    const i = css.indexOf(`.${c}`);
    if (i < 0) continue;
    const corpo = css.slice(i, css.indexOf("}", i));
    if (!/(width|height|padding|flex|font|border)\s*:/.test(corpo)) continue;
    const temCor = /(^|[;{\s])color\s*:/.test(corpo);
    const temFundo = /background(-color)?\s*:/.test(corpo);
    /* ── OU OS DOIS, OU NENHUM ─────────────────────────────────────────
     *
     * A regra nunca foi "declare cor e fundo": era "não declare METADE". Uma
     * metade vem do tema do Foundry, e as duas andam separadas — foi assim que
     * o botão saiu sem texto.
     *
     * Desde a 1.26.0 o módulo não pinta mais nada: as cores voltaram a ser do
     * sistema, e só a tipografia é nossa. Então NENHUM dos dois é o estado
     * normal, e exigir o par passaria a cobrar justamente o que foi removido.
     */
    if (!temCor && !temFundo) continue;
    confere(temCor && temFundo,
      `.${c} é um <button> que o CSS estiliza, e declara ${temCor ? "cor sem fundo" : temFundo ? "fundo sem cor" : "nem cor nem fundo"} — ` +
      `a metade que falta vem do tema, e foi assim que o botão saiu sem texto`);
  }
}

// ── 8. PAINEL DO MÓDULO DECLARA O PAR COR+FUNDO ───────────────────────────
//
// A REGRA DO PROJETO, aprendida caro em 2026-10-05: painel que declara fundo e
// não declara cor fica refém do tema do Foundry. Com o VTT em tema escuro, o
// texto vem claro e cai sobre o fundo claro do próprio painel — e o sintoma
// aparece num lugar de cada vez, parecendo bugs diferentes.
//
// Vale só para o que o MÓDULO cria. Janela de terceiro não se pinta: tentar isso
// quebrou a interface da mesa.
{
  const css = semComentarios(fs.readFileSync(path.join(RAIZ, FOLHAS[0]), "utf8"));
  for (const m of css.matchAll(/(^|\})\s*(\.[a-z][\w-]*(?:\.[a-z][\w-]*)?)\s*\{([^{}]*)\}/gm)) {
    const sel = m[2];
    const corpo = m[3];
    // só os blocos que montam um PAINEL (têm caixa), não os de ajuste fino
    if (!/(padding|border)\s*:/.test(corpo)) continue;
    const temCor = /(^|[;{\s])color\s*:/.test(corpo);
    const temFundo = /background(-color)?\s*:/.test(corpo);
    if (!temCor && !temFundo) continue; // não assume aparência: pode herdar
    confere(temCor && temFundo,
      `"${sel}" declara ${temCor ? "cor sem fundo" : "fundo sem cor"} — ` +
      `a metade que falta vem do tema do Foundry, e as duas pontas andam separadas`);
  }
}

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log(
  "  ✔ layout que encolhe: todo @container tem contêiner declarado (e todo " +
    "contêiner é usado), nenhuma @media de largura onde a janela é que muda, " +
    "todo grid de 3+ colunas tem versão estreita, e as queries vêm depois das " +
    "regras base, e o cartão do chat com contraste próprio medido"
);
