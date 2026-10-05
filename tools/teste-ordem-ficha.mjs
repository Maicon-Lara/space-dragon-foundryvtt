// Teste do painel da Ordem de Ação na ficha (T7-2), sem Foundry.
//
// ── AS DUAS ASSERÇÕES QUE MAIS IMPORTAM ─────────────────────────────────────
//
// 1. O `!important` do CSS. A ficha do Old Dragon 2 dá `width: 100%` e altura
//    fixa a todo `input` e `button` dela. Sem desfazer isso, o painel aparece
//    — e aparece TORTO: o campo vira um risco e o botão engole a linha. O
//    sintoma não é a ausência do painel, é o painel errado, e foi o que custou
//    uma tarde de caça ao CSS no arquivo errado. Se alguém tirar o `!important`
//    numa limpeza, o teste quebra aqui.
//
// 2. A aba. `abaDeAtaques` tem de ignorar o que está dentro de `<nav>`: ali
//    mora o LINK da aba, não o painel dela, e injetar no link põe o painel na
//    barra de abas, onde ele parece outra coisa.
//
// Uso: node tools/teste-ordem-ficha.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { abaDeAtaques, opcoesDeOrdem, montarPainel } from "../spacedragon-module/module/ordem-ficha.js";
import { MODOS } from "../spacedragon-module/module/ordem.js";

const RAIZ = path.resolve(fileURLToPath(import.meta.url), "../..");
const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

/* ── AS CONTAS DA T7-2 ───────────────────────────────────────────────────── */
//
// Uma fonte só: o painel usa os MESMOS MODOS da janela do Mestre. Duas cópias
// da regra em dois arquivos é como ela passa a divergir sem ninguém notar.

confere(Object.keys(MODOS).length === 3, `${Object.keys(MODOS).length} modos, a T7-2 tem 3`);
{
  const { n, como, roll } = await MODOS.aparato.valor("4");
  confere(n === 4 && roll === null, "o aparato vale o NT, sem rolar");
  confere(/não se rola/.test(como), "a conta do aparato precisa dizer que não se rola");
}
{
  const { n, roll } = await MODOS.movimento.valor("3");
  confere(n === 7 && roll === null, `10 − 3 = 7, veio ${n}`);
}
{
  const { n } = await MODOS.movimento.valor("");
  confere(n === 10, "sem modificador de Destreza, 10");
}
{
  // Destreza alta leva abaixo de zero, e deve: quem é muito rápido age antes
  // de todo mundo.
  const { n } = await MODOS.movimento.valor("12");
  confere(n === -2, `Destreza muito alta pode dar negativo, veio ${n}`);
}

/* ── AS OPÇÕES DO JOGADOR ────────────────────────────────────────────────── */

const arma = (id, name, damage, is_equipped = false) => ({
  id, name, type: "weapon", system: { damage, is_equipped },
});
const ator = (itens, mod = 0) => ({
  id: "ator1", type: "character", items: itens, system: { mod_destreza: mod },
});

{
  const a = ator([
    arma("w1", "Faca", "1d4"),
    arma("w2", "Canhão", "1d12", true),
    arma("w3", "Sem dano", ""),
  ], 2);
  const ops = opcoesDeOrdem(a);

  // A equipada primeiro: é a que o jogador vai escolher na maioria das rodadas.
  confere(ops[0].chave === "arma:w2", `a arma equipada devia vir primeiro, veio ${ops[0].chave}`);
  // Arma sem dado de dano não entra: não há o que rolar, e a opção seria um
  // beco sem saída no meio do turno.
  confere(!ops.some((o) => o.chave === "arma:w3"), "arma sem dado de dano não deve virar opção");
  // O dado já vem preenchido — é o que torna o painel mais rápido que a janela
  confere(ops[0].campo === "1d12", `o campo devia trazer 1d12, veio ${ops[0].campo}`);

  // As três formas da T7-2 existem sempre, mesmo com armas na lista
  for (const c of ["ataque", "aparato", "movimento"]) {
    confere(ops.some((o) => o.chave === c), `falta a opção "${c}" da T7-2`);
  }
  // O modificador de Destreza vem da ficha: é o número que o jogador mais
  // erraria de cabeça.
  confere(ops.find((o) => o.chave === "movimento").campo === "2",
    "o campo de movimentação devia trazer o modificador de Destreza da ficha");
}
{
  // Ator sem arma nenhuma ainda tem de poder atacar
  const ops = opcoesDeOrdem(ator([]));
  confere(ops.length === 3, `sem armas, só as 3 formas da T7-2; veio ${ops.length}`);
  confere(ops[0].chave === "ataque" && ops[0].campo === MODOS.ataque.campo,
    "sem arma, o ataque genérico fica com o dado padrão");
}
confere(opcoesDeOrdem(undefined).length === 3, "ator ausente não quebra o painel");

/* ── O HTML ──────────────────────────────────────────────────────────────── */
{
  const html = montarPainel(ator([arma("w1", "Blaster", "1d8", true)], 1));
  for (const peca of ["sd-ordem-acao", "sd-ordem-valor", "sd-ordem-declarar", "sd-ordem-ficha"]) {
    confere(html.includes(peca), `o painel não tem .${peca}`);
  }
  confere((html.match(/selected/g) ?? []).length === 1, "exatamente uma opção vem selecionada");
  confere(html.includes('value="1d8"'), "o campo devia abrir com o dado da arma equipada");

  // O nome da arma é digitado pela mesa e vai para dentro de HTML — e para
  // dentro de um atributo. Sem escape, uma aspa no nome quebra a marcação.
  const perigoso = montarPainel(ator([arma("w1", 'Faca "do" <script>', "1d4", true)]));
  confere(!perigoso.includes("<script>"), "a tag no nome da arma precisa ser escapada");
  confere(perigoso.includes("&lt;script&gt;"), "o nome escapado devia aparecer no rótulo");
  // A aspa é o caso que fecha o atributo cedo e solta o resto do nome como
  // marcação. Depois do escape, nenhuma aspa crua do nome sobra no HTML.
  confere(!perigoso.includes('"do"'), "as aspas do nome da arma não podem sair cruas");
  confere(perigoso.includes("&quot;do&quot;"), "as aspas do nome deviam virar &quot;");
}

/* ── A ABA ───────────────────────────────────────────────────────────────── */
//
// DOM de mentira, com o mínimo: `querySelector`, `querySelectorAll` e `closest`.

function raizFalsa({ classes = [], dataTabs = [] } = {}) {
  const nos = new Map();
  for (const c of classes) nos.set(c, { marca: c, closest: () => null });
  const porDados = dataTabs.map((d) => ({
    marca: d.marca,
    closest: (sel) => (sel === "nav" && d.dentroDeNav ? { marca: "nav" } : null),
  }));
  return {
    querySelector: (sel) => nos.get(sel) ?? null,
    querySelectorAll: (sel) => (sel === '[data-tab="attacks"]' ? porDados : []),
  };
}

{
  const achou = abaDeAtaques(raizFalsa({ classes: [".character-tab-attacks"] }));
  confere(achou?.por === ".character-tab-attacks", "devia achar a aba pela classe do sistema");
}
{
  // A classe vence o [data-tab] genérico: é o nome que a ficha do sistema usa
  const achou = abaDeAtaques(raizFalsa({
    classes: [".character-tab-attacks"],
    dataTabs: [{ marca: "generico" }],
  }));
  confere(achou?.por === ".character-tab-attacks", "a classe do sistema tem precedência");
}
{
  // Só o link, dentro de <nav>: NÃO serve. Injetar ali põe o painel na barra
  // de abas, onde ele parece outra coisa.
  const achou = abaDeAtaques(raizFalsa({ dataTabs: [{ marca: "link", dentroDeNav: true }] }));
  confere(achou === null, "o link da aba (dentro de <nav>) não pode ser confundido com o painel");
}
{
  const achou = abaDeAtaques(raizFalsa({ dataTabs: [{ marca: "painel" }] }));
  confere(achou?.por === '[data-tab="attacks"]', "o [data-tab] fora de <nav> serve de reserva");
}
confere(abaDeAtaques(raizFalsa()) === null, "sem aba nenhuma, devolve null e o painel não é desenhado");

/* ── O CSS, QUE É METADE DESTE PAINEL ────────────────────────────────────── */
{
  const css = fs.readFileSync(path.join(RAIZ, "spacedragon-module", "styles", "spacedragon.css"), "utf8");
  const semComentarios = css.replace(/\/\*[\s\S]*?\*\//g, "");

  confere(semComentarios.includes(".sd-ordem-ficha"), "o CSS do painel não está na folha");

  // Os TRÊS pontos em que a ficha do sistema impõe tamanho. Cada um precisa de
  // `!important`, ou a regra perde — e perde em silêncio.
  const regra = (sel) => {
    const i = semComentarios.indexOf(sel);
    return i < 0 ? "" : semComentarios.slice(i, semComentarios.indexOf("}", i));
  };
  const valor = regra(".sd-ordem-ficha .sd-ordem-valor");
  const botao = regra(".sd-ordem-ficha .sd-ordem-declarar");
  confere(/flex:[^;]*!important/.test(valor), "o campo precisa de flex com !important");
  confere(/width:\s*auto\s*!important/.test(valor),
    "sem width:auto !important o campo herda o 100% da ficha e vira um risco");
  confere(/min-width:\s*0\s*!important/.test(valor),
    "sem min-width:0 o campo não encolhe dentro do flex");
  // A ALTURA foi descoberta na mesa, não no papel: a ficha impõe height fixo a
  // input e button, e sem desfazer isso o campo desalinha do botão.
  confere(/height:\s*auto\s*!important/.test(valor), "o campo precisa de height:auto !important");
  confere(/height:\s*auto\s*!important/.test(botao), "o botão precisa de height:auto !important");
  confere(/width:\s*auto\s*!important/.test(botao),
    "sem width:auto !important o botão engole a linha inteira");
  confere(/flex:\s*0 0 auto\s*!important/.test(botao), "o botão não deve crescer");

  // E o escopo: nada disto pode valer para input/button da ficha em geral.
  const linhas = semComentarios.split("\n").filter((l) => l.includes("!important") && l.includes("width"));
  confere(linhas.length > 0, "nenhuma regra de largura com !important — o teste acima mentiria");
  const vazando = semComentarios
    .split("}")
    .filter((b) => b.includes("!important"))
    .map((b) => b.split("{")[0].trim())
    .filter((sel) => sel && !sel.includes("sd-") && !sel.includes("spacedragon"));
  confere(vazando.length === 0,
    `!important fora do escopo do módulo: ${vazando.join(" | ")}`);
}

/* ── AS OPÇÕES ESTÃO REGISTRADAS ─────────────────────────────────────────── */
{
  const fonte = fs.readFileSync(path.join(RAIZ, "spacedragon-module", "module", "spacedragon.js"), "utf8");
  confere(/registrarOpcoesDaOrdem\(\)/.test(fonte), "as opções do painel não são registradas no init");
  confere(/ligarOrdemNaFicha\(\)/.test(fonte), "o painel não é ligado no ready");
  // A ordem importa: opção registrada depois de lida é opção que não existe.
  confere(fonte.indexOf("registrarOpcoesDaOrdem()") < fonte.indexOf("ligarOrdemNaFicha()"),
    "a opção tem de ser registrada antes de o painel a ler");

  const painel = fs.readFileSync(path.join(RAIZ, "spacedragon-module", "module", "ordem-ficha.js"), "utf8");
  // A decisão de projeto de ordem.js: não mexer no rastreador por padrão.
  confere(/default:\s*false/.test(painel.slice(painel.indexOf("ordemNoRastreador"))),
    "gravar no rastreador tem de vir DESLIGADO — ver a decisão declarada em ordem.js");
}

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log(
  "  ✔ ordem na ficha: as contas da T7-2 numa fonte só, a arma equipada primeiro " +
    "com o dado pronto, o nome escapado, a aba achada sem confundir o link do <nav>, " +
    "o !important nos pontos em que a ficha impõe largura E altura (e em nenhum outro), " +
    "e o rastreador desligado por padrão"
);
