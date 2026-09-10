// As quatro classes do Capítulo 3, convertidas para o Old Dragon 2.
//
// ── O QUE CABE NO OD2 E O QUE NÃO CABE ──────────────────────────────────────
//
// O campo `levels` do sistema OD2 guarda três números por nível: `ba`, `jp` e
// `xp`. A progressão do Space Dragon tem coisas que não são número:
//
//   · a base de ataque do Cosmonauta vira "+9/+3" quando ele ganha o segundo
//     ataque — o OD2 não tem campo para ataque múltiplo;
//   · o dano crítico é "x2", "x3", "x4";
//   · o dado de vida vira "+1 PV" a partir do 10º nível;
//   · quase toda coluna de classe é PORCENTAGEM.
//
// Então: o `levels` recebe o que o OD2 sabe ler, e a TABELA INTEIRA vai na
// descrição, em HTML. Nada se perde, e a ficha calcula o que consegue.
//
// ── AS ESPECIALIZAÇÕES SEGUEM A AFILIAÇÃO ───────────────────────────────────
//
// Doze especializações, três por classe, uma para cada Afiliação — leal,
// neutro, rebelde. É o padrão do livro, e é o que liga a Afiliação (Cap. 4.6) à
// escolha mecânica.

import { CIENTISTA, COSMONAUTA, GATUNO, MENTALICO, TALENTOSGATUNO } from "./progressao.mjs";

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
  realizarAprender: "realizar e aprender", grandezaMental: "grandeza mental",
  sabotagem: "sabotagem", escalar: "escalar", furtividade: "furtividade",
  furtar: "furtar", percepcao: "percepção", ataqueFurtivo: "ataque furtivo",
};

/** Aviso comum: a ficha do OD2 não guarda o que o livro pede aqui. */
const SO_NA_TABELA = (o) =>
  `<p class='nota-casa'><em>${o} não tem campo na ficha do Old Dragon 2 — ` +
  `consulte a tabela acima.</em></p>`;

/** As três especializações de uma classe, uma por Afiliação. */
const espec = (leal, neutro, rebelde) =>
  "<p><strong>Especializações</strong> — uma por Afiliação:</p><ul>" +
  `<li><strong>${leal}</strong> — leal</li>` +
  `<li><strong>${neutro}</strong> — neutro</li>` +
  `<li><strong>${rebelde}</strong> — rebelde</li></ul>` +
  "<p class='nota-casa'><em>A Afiliação do personagem decide qual delas ele pode seguir.</em></p>";

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
      espec("Pesquisador", "Inventor", "Niilógico"),
    habilidades: [
      { nome: "Operar Máquinas", level: 1,
        desc: "<p>Porcentagem de sucesso ao operar e consertar máquinas. Começa em <strong>80%</strong> " +
              "no 1º nível e sobe 1 ponto por nível, chegando a 99% no 20º.</p>" +
              "<p>Modificada pela <strong>Aptidão Tecnológica</strong> da Ciência <em>(Inteligência no OD2)</em>.</p>" },
      { nome: "Nível Tecnológico Máximo", level: 1,
        desc: "<p>O teto do que o Cientista consegue <em>construir</em> — não do que consegue usar. " +
              "Sobe um degrau a cada dois níveis: <strong>1º</strong> no nível 1, <strong>2º</strong> no 3, " +
              "e assim até o <strong>10º</strong> no nível 19.</p>" },
      { nome: "Desativar Robôs", level: 1,
        desc: "<p>Com o equipamento apropriado, desativa robôs. A <strong>quantidade</strong> sai da " +
              "tabela T1-5 da <strong>Ciência</strong> <em>(Inteligência no OD2)</em>, e é um " +
              "<strong>dado</strong>, não um número fixo: 1d2 com Ciência 10–11, 1d6 com 16–17, " +
              "1d20 com 28–29.</p>" },
    ],
  },

  {
    nome: "Cosmonauta",
    dv: 8,
    levels: levelsOD2(COSMONAUTA),
    flavor: "<p>O piloto, o soldado, quem encara o vácuo de frente.</p>",
    descricao:
      "<p>A classe de combate e de pilotagem. Ganha <strong>ataques múltiplos</strong> conforme sobe, " +
      "e é a única com <strong>dano crítico</strong> na progressão.</p>" +
      tabelaHTML("T3-3: Cosmonauta", COSMONAUTA, R) +
      SO_NA_TABELA("O <em>ataque múltiplo</em> (+9/+3) e o <em>dano crítico</em> (×2, ×3, ×4)") +
      espec("Emissário", "Mercenário", "Caçador de Recompensas"),
    habilidades: [
      { nome: "Ataques Múltiplos", level: 7,
        desc: "<p>A partir do <strong>7º nível</strong> a base de ataque ganha um segundo valor " +
              "(<code>+7/+1</code>), que é um <strong>ataque adicional na mesma rodada</strong>. No 10º " +
              "vira <code>+10/+4</code>, e assim por diante.</p>" +
              "<p class='nota-casa'><em>A ficha do OD2 guarda só o primeiro valor. O segundo ataque " +
              "está na tabela e é aplicado à mão.</em></p>" },
      { nome: "Pilotar Naves", level: 1,
        desc: "<p>Porcentagem de sucesso ao pilotar. <strong>80%</strong> no 1º nível, subindo 1 ponto " +
              "por nível.</p>" },
      { nome: "Desarmar e Subjugar", level: 1,
        desc: "<p>Porcentagem começando em <strong>20%</strong> e subindo 5 pontos por nível até o 11º, " +
              "depois mais devagar.</p>" +
              "<p><strong>Desarmar</strong> é modificado pela Destreza; <strong>Subjugar</strong>, pela " +
              "Força — cada um pela sua coluna na tabela do atributo.</p>" },
      { nome: "Dano Crítico", level: 1,
        desc: "<p>O multiplicador de dano num acerto crítico: <strong>×2</strong> do 1º ao 5º nível, " +
              "<strong>×3</strong> do 6º ao 11º, <strong>×4</strong> do 12º em diante.</p>" },
    ],
  },

  {
    nome: "Gatuno",
    dv: 6,
    levels: levelsOD2(GATUNO),
    flavor: "<p>Quem entra sem ser visto e sai sem ser lembrado.</p>",
    descricao:
      "<p>Seis talentos que evoluem em porcentagem, cada um com a sua coluna.</p>" +
      tabelaHTML("T3-4: Gatuno", GATUNO, R) +
      tabelaHTML("T3-5: Talentos de Gatuno", TALENTOSGATUNO, R) +
      SO_NA_TABELA("Os seis talentos") +
      espec("Espião", "Sabotador", "Pirata Espacial"),
    habilidades: [
      { nome: "Talentos de Gatuno", level: 1,
        desc: "<p>Seis talentos, cada um com progressão própria em porcentagem: <strong>Sabotagem</strong>, " +
              "<strong>Escalar</strong>, <strong>Furtividade</strong>, <strong>Furtar</strong>, " +
              "<strong>Percepção</strong> e <strong>Ataque Furtivo</strong>.</p>" +
              "<p><em>Furtividade</em> e <em>Furtar</em> são modificados pela Destreza; " +
              "<em>Sabotagem</em>, pela Aptidão Tecnológica da Ciência <em>(Inteligência no OD2)</em>.</p>" +
              "<p>Os valores por nível estão na tabela T3-5, na descrição da classe.</p>" },
    ],
  },

  {
    nome: "Mentálico",
    dv: 4,
    levels: levelsOD2(MENTALICO),
    flavor: "<p>A mente como ferramenta, e como arma.</p>",
    descricao:
      "<p>Manifesta <strong>poderes mentais</strong>. O quanto consegue realizar e aprender sai da " +
      "porcentagem da tabela, modificada pelo <strong>Intelecto</strong> <em>(Sabedoria no OD2)</em>.</p>" +
      tabelaHTML("T3-6: Mentálico", MENTALICO, R) +
      SO_NA_TABELA("O <em>alcance mental</em> e a <em>grandeza mental limite</em>") +
      espec("Psiquista", "Radiestésico", "Hipercientista"),
    habilidades: [
      { nome: "Poderes Mentais", level: 1,
        desc: "<p>A porcentagem de <strong>realizar e aprender</strong> um poder que ainda não domina " +
              "começa em <strong>1%</strong> no 1º nível e chega a <strong>150%</strong> no 20º.</p>" +
              "<p>Somada à coluna do <strong>Intelecto</strong> <em>(Sabedoria no OD2)</em>: com " +
              "Intelecto 10–11 são +15 pontos; com 28–29, +100.</p>" },
      { nome: "Alcance Mental", level: 1,
        desc: "<p>Quantos poderes o Mentálico manifesta por dia. O <strong>Intelecto</strong> " +
              "<em>(Sabedoria no OD2)</em> acrescenta alcance adicional pela tabela T1-4.</p>" },
      { nome: "Grandeza Mental Limite", level: 1,
        desc: "<p>O teto da Grandeza de poder que ele alcança. Sobe um degrau a cada dois níveis: " +
              "<strong>1ª</strong> no nível 1, <strong>2ª</strong> no 3, e assim por diante.</p>" },
    ],
  },
];
