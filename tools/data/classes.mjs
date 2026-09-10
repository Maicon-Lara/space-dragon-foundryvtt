// As quatro classes do Capítulo 3 do Livro Básico Aprimorado.
//
// ── OS NOMES SÃO OS DO LIVRO ────────────────────────────────────────────────
//
// A classe de combate e pilotagem chama-se HOMEM ESPACIAL. A palavra
// "cosmonauta" não aparece uma única vez no livro básico: ela é do *guia de
// conversão para Old Dragon 2*, que este módulo não usa. Mesma coisa com os
// talentos do Gatuno — são "esgueirar-se", "ocultar-se" e "localizar e sabotar
// máquinas", não furtividade e sabotagem.
//
// ── O QUE CABE NO OD2 E O QUE NÃO CABE ──────────────────────────────────────
//
// O campo `levels` do sistema OD2 guarda três números por nível: `ba`, `jp` e
// `xp`. A progressão do Space Dragon tem coisas que não são número:
//
//   · a base de ataque do Homem Espacial vira "+9/+3" quando ele ganha o
//     segundo ataque — o OD2 não tem campo para ataque múltiplo;
//   · o dano crítico é "x2", "x3", "x4";
//   · o dado de vida vira "+1 PV" a partir do 10º nível;
//   · quase toda coluna de classe é PORCENTAGEM.
//
// Então: o `levels` recebe o que o OD2 sabe ler, e a TABELA INTEIRA vai na
// descrição, em HTML. Nada se perde, e a ficha calcula o que consegue.
//
// ── AS PORCENTAGENS ROLAM SOZINHAS ──────────────────────────────────────────
//
// Tudo o que é porcentagem se resolve em 1d100 com sucesso no MENOR OU IGUAL, e
// o módulo traz um compêndio de macros que faz a conta: a porcentagem da tabela
// pelo nível, mais a coluna do atributo, mais o que a mesa mandar. Ver
// tools/data/testes.mjs.

import { CIENTISTA, HOMEM_ESPACIAL, GATUNO, MENTALICO, TALENTOSGATUNO } from "./progressao.mjs";
import { ondeAnotar } from "./onde-anotar.mjs";

/** "1.500" → 1500. O livro usa ponto como separador de milhar. */
const num = (s) => Number(String(s).replace(/\./g, "").replace(/[^\d-]/g, "")) || 0;

/** "+9/+3" → 9. O OD2 só tem um campo de BA; o resto fica na tabela. */
const baPrincipal = (s) => Number(String(s).match(/-?\d+/)?.[0] ?? 0);

/** Converte a progressão para o `levels` que o sistema OD2 lê. */
function levelsOD2(tabela) {
  const out = {};
  for (const linha of tabela) {
    out[linha.nivel] = {
      ba: baPrincipal(linha.ba),
      jp: num(linha.jp),
      ...(num(linha.xp) ? { xp: num(linha.xp) } : {}),
    };
  }
  return out;
}

/** A tabela do livro, inteira, como HTML — inclusive o que o OD2 não guarda. */
function tabelaHTML(titulo, tabela, rotulos) {
  const cols = Object.keys(tabela[0]);
  const cab = cols.map((c) => `<th>${rotulos[c] ?? c}</th>`).join("");
  const linhas = tabela
    .map((r) => "<tr>" + cols.map((c) => `<td>${r[c]}</td>`).join("") + "</tr>")
    .join("");
  return `<p><strong>${titulo}</strong></p><table><thead><tr>${cab}</tr></thead><tbody>${linhas}</tbody></table>`;
}

const R = {
  nivel: "nível", xp: "XP", dv: "DV", ba: "BA", jp: "JP",
  operarMaquinas: "operar máquinas", ntMaximo: "NT máximo",
  pilotarNaves: "pilotar naves", desarmarSubjugar: "desarmar e subjugar", danoCritico: "dano crítico",
  alcanceMental: "alcance mental", grandezaMental: "grandeza mental limite",
  destrancarPortas: "destrancar portas", localizarSabotar: "localizar e sabotar máquinas",
  escalarSuperficies: "escalar superfícies", esgueirarSe: "esgueirar-se",
  ocultarSe: "ocultar-se", furtar: "furtar",
  ouvirBarulhos: "ouvir barulhos", ataquePelasCostas: "ataque pelas costas",
};

/** Aviso comum: a ficha do OD2 não guarda o que o livro pede aqui. */
const SO_NA_TABELA = (o) =>
  `<p class='nota-casa'><em>${o} não tem campo na ficha do Old Dragon 2 — ` +
  `consulte a tabela acima.</em></p>`;

/** O convite à macro. Aparece em toda habilidade que se resolve em 1d100. */
const ROLA = (nome) =>
  `<p class='nota-casa'><em>O compêndio <strong>Macros</strong> tem um botão ` +
  `<strong>${nome}</strong>: ele soma a porcentagem do seu nível à coluna do ` +
  `atributo e rola o 1d100.</em></p>`;

/** As especializações de uma classe, com a Afiliação que abre cada uma. */
const espec = (...pares) =>
  "<p><strong>Especializações</strong> — a Afiliação decide qual está aberta:</p><ul>" +
  pares.map(([nome, af]) => `<li><strong>${nome}</strong> — ${af}</li>`).join("") +
  "</ul>";

export const classes = [
  {
    nome: "Cientista",
    dv: 4,
    levels: levelsOD2(CIENTISTA),
    flavor: "<p>O que entende a máquina, e por isso a desmonta.</p>",
    descricao:
      "<p>Domina a tecnologia da galáxia: constrói aparatos, realiza feitos científicos e desliga " +
      "robôs com o equipamento certo.</p>" +
      tabelaHTML("T3-1: Cientista", CIENTISTA, R) +
      SO_NA_TABELA("<em>Operar Máquinas</em> e o <em>Nível Tecnológico Máximo</em>") +
      espec(["Pesquisador", "leal"], ["Inventor", "neutro"], ["Niilógico", "rebelde"]),
    habilidades: [
      { nome: "Operar Máquinas", level: 1,
        desc: "<p>Porcentagem de sucesso ao operar e consertar máquinas. Começa em <strong>80%</strong> " +
              "no 1º nível e sobe 1 ponto por nível, chegando a 99% no 20º.</p>" +
              "<p>Rola-se <strong>1d100</strong>, e passa com resultado <strong>menor ou igual</strong>. " +
              "O livro não dá modificador de atributo para este teste.</p>" +
              ROLA("Operar máquinas") },
      { nome: "Nível Tecnológico Máximo", level: 1,
        desc: "<p>O teto do que o Cientista consegue <em>construir</em> — não do que consegue usar. " +
              "Sobe um degrau a cada dois níveis: <strong>1º</strong> no nível 1, <strong>2º</strong> no 3, " +
              "e assim até o <strong>10º</strong> no nível 19.</p>" },
      { nome: "Desativar Robôs", level: 1,
        desc: "<p>Com um <strong>disruptor positrônico</strong>, desativa robôs. " +
              "<strong>Não é teste de porcentagem</strong>: rola-se <strong>1d20</strong> contra a tabela " +
              "<strong>T3-2</strong>, pelo nível do disruptor, e o resultado precisa ser <strong>igual ou " +
              "maior</strong>. Um “A” na tabela desativa automaticamente.</p>" +
              `<p>A <strong>quantidade</strong> de robôs sai da T1-5 da ${ondeAnotar("ciencia")}, e é um ` +
              "<strong>dado</strong>, não um número fixo: 1d2 com Ciência 10–11, 1d6 com 16–17, " +
              "1d20 com 28–29.</p>" +
              "<p class='nota-casa'><em>A T3-2 e o disruptor são do Capítulo 8, que o módulo ainda não " +
              "traz — por isso não há macro para este.</em></p>" },
      { nome: "Crédito Tecnológico", level: 1,
        desc: `<p>O <strong>desconto</strong> que a ${ondeAnotar("ciencia")} concede em qualquer gasto ` +
              "com equipamento, pela T1-5: nenhum até 11, <strong>10%</strong> com 12–13, subindo até " +
              "<strong>50%</strong> com 28–29.</p>" +
              "<p>Não é bônus de rolagem nenhum — é preço. Várias especializações mexem justamente " +
              "nele.</p>" },
    ],
  },

  {
    nome: "Homem Espacial",
    dv: 8,
    levels: levelsOD2(HOMEM_ESPACIAL),
    flavor: "<p>O piloto, o soldado, quem encara o vácuo de frente.</p>",
    descricao:
      "<p>Aventureiros e desbravadores da imensidão sideral: pilotos, mercenários, guarda-costas ou " +
      "soldados. Usam <strong>qualquer arma, veste ou escudo</strong>, sem restrição, e são proficientes " +
      "em aparatos defensivos e utilitários — mas <strong>não ofensivos</strong>.</p>" +
      "<p>Os atributos principais são <strong>Força e Destreza, em escala igual</strong>. Ganha " +
      "<strong>ataques múltiplos</strong> conforme sobe, e é a única classe com <strong>dano " +
      "crítico</strong> na progressão.</p>" +
      tabelaHTML("T3-5: Homem Espacial", HOMEM_ESPACIAL, R) +
      SO_NA_TABELA("O <em>ataque múltiplo</em> (+9/+3) e o <em>dano crítico</em> (×2, ×3, ×4, ×5)") +
      espec(["Emissário", "leal"], ["Mercenário", "neutro"], ["Caçador de Recompensas", "rebelde"]),
    habilidades: [
      { nome: "Ataques Múltiplos", level: 7,
        desc: "<p>A partir do <strong>7º nível</strong> a base de ataque ganha um segundo valor " +
              "(<code>+7/+1</code>), que é um <strong>ataque adicional na mesma rodada</strong>. No 10º " +
              "vira <code>+10/+4</code>, e assim por diante até <code>+15/+9</code> no 20º.</p>" +
              "<p class='nota-casa'><em>A ficha do OD2 guarda só o primeiro valor. O segundo ataque " +
              "está na tabela e é aplicado à mão.</em></p>" },
      { nome: "Pilotar Naves", level: 1,
        desc: "<p>Porcentagem de sucesso ao pilotar. <strong>80%</strong> no 1º nível, subindo 1 ponto " +
              "por nível.</p>" +
              "<p>Falhar não é bater: é <strong>encontrar dificuldade de pilotagem, ou se perder no " +
              "caminho</strong>. O Mestre pode pedir testes seguidos em situações difíceis ou viagens " +
              "longas.</p>" +
              ROLA("Pilotar naves") },
      { nome: "Desarmar e Subjugar", level: 1,
        desc: "<p>Custa <strong>um dos ataques da rodada, ou os dois</strong>. O adversário precisa ser " +
              "<strong>desarmado antes</strong> de poder ser subjugado.</p>" +
              "<p>A porcentagem da tabela é a <strong>mesma para os dois</strong> — 20% no 1º nível, 88% " +
              "no 20º. O que muda é o atributo que ajusta:</p><ul>" +
              `<li><strong>Desarmar</strong> soma a coluna <em>Ocultar-se, Furtar e Desarmar</em> da ${ondeAnotar("destreza")}</li>` +
              `<li><strong>Subjugar</strong> soma a coluna <em>Subjugar</em> da ${ondeAnotar("forca")}</li>` +
              "</ul>" +
              ROLA("Desarmar / Subjugar") },
      { nome: "Dano Crítico", level: 1,
        desc: "<p>O multiplicador de dano num acerto crítico: <strong>×2</strong> do 1º ao 5º nível, " +
              "<strong>×3</strong> do 6º ao 11º, <strong>×4</strong> do 12º ao 17º, <strong>×5</strong> " +
              "do 18º em diante.</p>" +
              "<p>Não é uma chance, é um multiplicador — não há o que rolar aqui.</p>" },
    ],
  },

  {
    nome: "Gatuno",
    dv: 6,
    levels: levelsOD2(GATUNO),
    flavor: "<p>Quem entra sem ser visto e sai sem ser lembrado.</p>",
    descricao:
      "<p><strong>Oito talentos</strong>, cada um com a sua coluna. Seis são porcentagem e se resolvem " +
      "em <strong>1d100</strong>: <em>“se o teste resultar num valor menor ou igual ao valor do talento, " +
      "o gatuno é bem-sucedido”</em>. Os outros dois não — ouvir barulhos é 1d6 dentro de uma faixa, e " +
      "ataque pelas costas é multiplicador de dano.</p>" +
      tabelaHTML("T3-3: Gatuno", GATUNO, R) +
      tabelaHTML("T3-4: Talentos de Gatuno", TALENTOSGATUNO, R) +
      SO_NA_TABELA("Os oito talentos") +
      espec(["Espião", "leal"], ["Sabotador", "neutro"], ["Assassino", "neutro"], ["Pirata Espacial", "rebelde"]) +
      "<p class='nota-casa'><em>A Afiliação neutra abre <strong>duas</strong> no Gatuno: sabotador ou " +
      "assassino. As outras classes têm uma por Afiliação.</em></p>",
    habilidades: [
      { nome: "Destrancar Portas", level: 1,
        desc: "<p><strong>15%</strong> no 1º nível, <strong>80%</strong> no 20º.</p>" +
              "<p>Uma tentativa <strong>por porta</strong>, e só com os instrumentos em mãos.</p>" +
              `<p>Soma a coluna <em>Esgueirar-se e Destrancar Portas</em> da ${ondeAnotar("destreza")}.</p>` +
              ROLA("Destrancar portas") },
      { nome: "Localizar e Sabotar Máquinas", level: 1,
        desc: "<p><strong>20%</strong> no 1º nível, <strong>82%</strong> no 20º.</p>" +
              "<p>Um uso <strong>por máquina</strong>, e só com os instrumentos. Como o gatuno procura a " +
              "máquina, ou o que a sabotagem faz, é criatividade do jogador — o talento só diz se " +
              "deu certo.</p>" +
              `<p>Soma a coluna <em>Localizar e Sabotar Máquinas</em> da ${ondeAnotar("ciencia")}, que ` +
              "<strong>atrasa três degraus</strong>: só a partir de Ciência 16 há bônus.</p>" +
              ROLA("Localizar e sabotar máquinas") },
      { nome: "Escalar Superfícies", level: 1,
        desc: "<p><strong>80%</strong> no 1º nível, <strong>99%</strong> no 20º. Vale para toda " +
              "superfície íngreme.</p>" +
              "<p>Cada sucesso vale <strong>3 metros</strong>. Falhar derruba, com <strong>1d6 de " +
              "dano por 3 metros já escalados</strong> — falhar na primeira jogada não machuca.</p>" +
              "<p>Sem modificador de atributo.</p>" +
              ROLA("Escalar superfícies") },
      { nome: "Esgueirar-se", level: 1,
        desc: "<p>Mover-se em silêncio e passar por lugares estreitos. <strong>20%</strong> no 1º nível, " +
              "<strong>88%</strong> no 20º.</p>" +
              "<p>⚠️ <strong>Quem rola é o Mestre.</strong> O gatuno vai achar que passou até algo provar " +
              "o contrário — mostrar o dado apagaria a regra.</p>" +
              "<p>Quem se deslocou assim pode usar o <strong>ataque pelas costas</strong>.</p>" +
              `<p>Soma a coluna <em>Esgueirar-se e Destrancar Portas</em> da ${ondeAnotar("destreza")}.</p>` +
              ROLA("Esgueirar-se") },
      { nome: "Ocultar-se", level: 1,
        desc: "<p><strong>10%</strong> no 1º nível, <strong>78%</strong> no 20º — o talento mais difícil " +
              "da tabela.</p>" +
              "<p>⚠️ <strong>Também é rolagem do Mestre</strong>, pelo mesmo motivo.</p>" +
              "<p>Escondido, o gatuno só se move <strong>esgueirando-se</strong>: movimento comum ou " +
              "falha revelam a posição. Atacar sempre revela, mas o ataque feito escondido tem os " +
              "benefícios do <strong>ataque pelas costas</strong>.</p>" +
              `<p>Soma a coluna <em>Ocultar-se, Furtar e Desarmar</em> da ${ondeAnotar("destreza")} — que ` +
              "é <strong>outra</strong> coluna, mais fraca que a de esgueirar-se.</p>" +
              ROLA("Ocultar-se") },
      { nome: "Furtar", level: 1,
        desc: "<p>Afanar os pertences de quem não estiver prestando atenção. <strong>20%</strong> no 1º " +
              "nível, <strong>88%</strong> no 20º.</p>" +
              "<p>⚠️ Rolar o <strong>dobro do alvo ou mais</strong> faz <strong>todos em volta " +
              "perceberem</strong> a tentativa, inclusive a vítima.</p>" +
              `<p>Soma a coluna <em>Ocultar-se, Furtar e Desarmar</em> da ${ondeAnotar("destreza")}.</p>` +
              ROLA("Furtar") },
      { nome: "Ouvir Barulhos", level: 1,
        desc: "<p><strong>Não é porcentagem.</strong> Rola-se <strong>1d6</strong>, e o gatuno é " +
              "bem-sucedido se o resultado cair dentro da faixa do seu nível: <strong>1–2</strong> até o " +
              "4º nível, <strong>1–3</strong> do 5º ao 9º, <strong>1–4</strong> do 10º ao 15º e " +
              "<strong>1–5</strong> do 16º em diante.</p>" +
              ROLA("Ouvir barulhos") },
      { nome: "Ataque pelas Costas", level: 1,
        desc: "<p>Um gatuno que tenha se <strong>esgueirado ou ocultado</strong> ataca com " +
              "<strong>+2 na rolagem</strong> e o dano final <strong>multiplicado</strong> pelo valor da " +
              "tabela: <strong>×2</strong> até o 5º nível, subindo até <strong>×5</strong> no 18º.</p>" +
              "<p>Depois desse ataque ele revela a posição a todos no combate, e deixa de se beneficiar " +
              "do talento.</p>" +
              "<p>Não é uma chance — não há o que rolar.</p>" },
    ],
  },

  {
    nome: "Mentálico",
    dv: 4,
    levels: levelsOD2(MENTALICO),
    flavor: "<p>A mente como ferramenta, e como arma.</p>",
    descricao:
      "<p>Manifesta <strong>poderes mentais</strong>, divididos em <strong>grandezas de 1 a 10</strong>.</p>" +
      "<p>⚠️ <strong>Duas coisas diferentes, que é fácil confundir:</strong> o <em>alcance mental</em> da " +
      "tabela abaixo é um <strong>orçamento diário</strong>, não uma chance de acertar; a " +
      "<strong>chance</strong> de reproduzir e aprender um poder sai inteira da tabela do " +
      "<strong>Intelecto</strong>.</p>" +
      tabelaHTML("T3-6: Mentálicos", MENTALICO, R) +
      SO_NA_TABELA("O <em>alcance mental</em> e a <em>grandeza mental limite</em>") +
      espec(["Psiquista", "leal"], ["Radiestésico", "neutro"], ["Hipercientista", "rebelde"]),
    habilidades: [
      { nome: "Alcance Mental", level: 1,
        desc: "<p>Um <strong>orçamento diário em porcentagem</strong>: <strong>1%</strong> no 1º nível, " +
              "<strong>100%</strong> no 16º, <strong>150%</strong> no 20º.</p>" +
              "<p>Usar um poder <strong>desconta um percentual igual à grandeza dele</strong>. Um poder de " +
              "3ª grandeza custa 3%.</p>" +
              "<blockquote><p>Um mentálico de 1º nível tem 1%, e portanto usa <strong>um</strong> poder de " +
              "1ª grandeza por dia. Um de 4º nível tem 6%, e usa <strong>seis</strong>.</p></blockquote>" +
              `<p>O total diário é expandido pela coluna <em>Alcance Mental Adicional</em> da ${ondeAnotar("intelecto")}.</p>` +
              "<p class='nota-casa'><em>Não há rolagem aqui: é um recurso que se gasta.</em></p>" },
      { nome: "Reproduzir e Aprender Poder Mental", level: 1,
        desc: "<p>A chance de reproduzir e aprender qualquer poder mental que o mentálico tentar " +
              "realizar. Rola-se <strong>1d100</strong> e passa com <strong>menor ou igual</strong>.</p>" +
              `<p>⚠️ <strong>A chance vem inteira da ${ondeAnotar("intelecto")}</strong>, pela T1-4 — a ` +
              "tabela da classe <strong>não entra</strong>. Abaixo de Intelecto 10 não há chance nenhuma; " +
              "com 10–11 são <strong>15%</strong>, e com 28–29, <strong>100%</strong>.</p>" +
              ROLA("Reproduzir e aprender poder mental") },
      { nome: "Grandeza Mental Limite", level: 1,
        desc: "<p>O teto da Grandeza de poder que o mentálico alcança. Sobe um degrau a cada dois " +
              "níveis: <strong>1ª</strong> no nível 1, <strong>2ª</strong> no 3, e assim até a " +
              "<strong>10ª</strong> no 19º.</p>" },
      { nome: "O Corpo Fica para Trás", level: 16,
        desc: "<p>No <strong>16º nível</strong> o mentálico atinge 100% da capacidade mental, e o corpo " +
              "não acompanha: <strong>base de ataque e jogadas de proteção param de progredir</strong>, " +
              "e ele <strong>não ganha mais pontos de vida</strong> ao subir de nível.</p>" +
              "<p class='nota-casa'><em>Está na tabela: do 17º ao 20º a coluna de DV é um traço, e o BA " +
              "e a JP não mudam mais.</em></p>" },
    ],
  },
];
