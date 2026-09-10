// A página de referência das mutações.
//
// ── POR QUE JOURNAL, E NÃO UM COMPÊNDIO DE ITENS ────────────────────────────
//
// As mutações não são itens que o jogador arrasta: são as duas escolhas que a
// raça Mutante já oferece na ficha, no seletor do OD2. Vinte `race_ability`
// soltas seriam o MESMO conteúdo numa segunda cópia, e a cópia arrastável
// competiria com o seletor — dois lugares para dizer a mesma coisa, e nenhuma
// garantia de que dizem o mesmo.
//
// O que a ficha não cabe é o texto de três campos do livro: Genótipo (o que o
// corpo fez), Fenótipo (o que aparece) e Funcionamento (o que a mesa rola). A
// descrição de uma opção de dropdown é uma linha de texto puro. Então o texto
// integral fica aqui, e o seletor carrega o resumo.

import { PARES, T2_2, T2_3, T2_4, T2_5 } from "./mutacoes.mjs";
import { NOME, CAMPO_NA_FICHA } from "./onde-anotar.mjs";

const ROTULO_FICHA = {
  forca: "Força", destreza: "Destreza", constituicao: "Constituição",
  inteligencia: "Inteligência", sabedoria: "Sabedoria", carisma: "Carisma",
};

const SUBTABELAS = {
  "Atributo Ampliado": { nome: "T2-2: Atributo Ampliado", col2: "Atributo", linhas: T2_2 },
  "Atributo Diminuído": { nome: "T2-4: Atributo Diminuído", col2: "Atributo", linhas: T2_4 },
  "Sentido Ampliado": { nome: "T2-3: Sentido Ampliado", col2: "Sentido", linhas: T2_3 },
  "Sentido Diminuído": { nome: "T2-5: Sentido Diminuído", col2: "Sentido", linhas: T2_5 },
};

function subtabelaHTML(sub) {
  const linhas = sub.linhas.map((l) =>
    l.atributo
      // Os DOIS nomes: o livro diz "Intelecto", e quem mexe na ficha do OD2
      // precisa saber que isso é Sabedoria. É a razão de o módulo existir.
      ? `<tr><td>${l.d6}</td><td><strong>${NOME[l.atributo]}</strong> ${l.ajuste > 0 ? "+" : ""}${l.ajuste}` +
        (ROTULO_FICHA[CAMPO_NA_FICHA[l.atributo]] !== NOME[l.atributo]
          ? `<br><em style="opacity:.7">campo ${ROTULO_FICHA[CAMPO_NA_FICHA[l.atributo]]} da ficha</em>` : "") +
        `</td><td>${l.fenotipo}</td></tr>`
      : `<tr><td>${l.d6}</td><td><strong>${l.sentido}</strong></td><td>${l.fenotipo}. ${l.funcionamento}</td></tr>`
  ).join("");
  return `<p><strong>${sub.nome}</strong> — role 1d6:</p>` +
    `<table><thead><tr><th>1d6</th><th>${sub.col2}</th><th>Efeito</th></tr></thead>` +
    `<tbody>${linhas}</tbody></table>`;
}

const bloco = (indice, m) =>
  `<h3>${indice}. ${m.nome}</h3>` +
  `<p><em>Genótipo:</em> ${m.genotipo}</p>` +
  `<p><em>Fenótipo:</em> ${m.fenotipo}</p>` +
  `<p><strong>Funcionamento:</strong> ${m.funcionamento}</p>` +
  (SUBTABELAS[m.nome] ? subtabelaHTML(SUBTABELAS[m.nome]) : "");

const coluna = (lado) => PARES.map((p) => bloco(p.indice, p[lado])).join("\n");

const COMO_ESCOLHER = `
<h2>O balanço genético</h2>
<p>Todo aprimoramento vem com uma degeneração. Não há um sem o outro.</p>

<p><strong>Rolando:</strong> role <strong>2d10</strong> na <strong>T2-1</strong>, um dado
na coluna de aprimoramentos e outro na de degenerações. As duas tabelas roláveis
estão no compêndio <strong>Tabelas</strong>.</p>

<p><strong>Escolhendo:</strong> o item de raça <strong>Mutante</strong> traz dois
seletores na ficha, <em>Aprimoramento</em> e <em>Degeneração</em>, com as vinte
mutações já listadas. As quatro que mandariam rolar 1d6 numa subtabela aparecem
abertas nas seis variantes, então a escolha é uma só.</p>

<p>⚠️ <strong>Os dois números têm de ser diferentes.</strong> É a trava do livro:
sem ela sairia <em>Recuperação Acelerada</em> com <em>Recuperação Lenta</em>, que
se anulam. Quem rola rerrola os dois dados até darem números distintos.</p>

<p>O Mutante <strong>não recebe</strong> o +2 num atributo, o −2 em outro nem o
incremento a cada 4 níveis do Humano. As mutações ocupam esse lugar.</p>
`;

export const mutacoesJournal = {
  title: "Space Dragon — Mutações do Homo novus",
  pages: [
    { title: "Como se escolhe", content: COMO_ESCOLHER },
    { title: "Aprimoramentos", content: `<h2>T2-1 — coluna de aprimoramentos</h2>\n${coluna("aprimoramento")}` },
    { title: "Degenerações", content: `<h2>T2-1 — coluna de degenerações</h2>\n${coluna("degeneracao")}` },
  ],
};
