// Journal de regras. A primeira página é a mais importante do módulo:
// os dois jogos não têm os mesmos atributos, e a equivalência engana.

import { MODIFICADOR_CONVERTIDO, DIVERGE_DA_FICHA } from "./conversao.mjs";
import { TABELAS, FAIXAS, ROTULOS, ATRIBUTOS } from "./atributos.mjs";

const sinal = (n) => (n > 0 ? `+${n}` : n === 0 ? "—" : `${n}`);

const tabelaModificadores = () =>
  "<table><thead><tr><th>Atributo</th><th>Modificador</th></tr></thead><tbody>" +
  MODIFICADOR_CONVERTIDO.map((f) =>
    `<tr><td>${f.de === f.ate ? f.de : `${f.de}–${f.ate}`}</td><td>${sinal(f.mod)}</td></tr>`
  ).join("") +
  "</tbody></table>";

/** As tabelas NATIVAS, para consulta — não são o que a ficha do OD2 usa. */
function tabelaNativa(chave) {
  const t = TABELAS[chave];
  const cols = Object.keys(t[0]);
  const cab = cols.map((c) => `<th>${c}</th>`).join("");
  const linhas = t.map((linha, i) => {
    const [min, max] = FAIXAS[i];
    const faixa = min === max ? `${min}` : `${min}–${max}`;
    const cels = cols.map((c) => {
      const v = linha[c];
      return `<td>${Array.isArray(v) ? v.join(" / ") : typeof v === "number" && c !== "clonagem" && c !== "poderMental" && c !== "seguidores" && c !== "idiomas" ? sinal(v) : v}</td>`;
    }).join("");
    return `<tr><td><strong>${faixa}</strong></td>${cels}</tr>`;
  }).join("");
  return `<h3>${ROTULOS[chave].nome} <em>(${ROTULOS[chave].sigla})</em></h3>` +
         `<table><thead><tr><th>valor</th>${cab}</tr></thead><tbody>${linhas}</tbody></table>`;
}

export const regras = [
  {
    title: "Space Dragon no Old Dragon 2",
    pages: [
      {
        title: "Os atributos não são os mesmos",
        content: `
<h2>A equivalência</h2>
<p>Space Dragon tem seis atributos, e três deles têm nome próprio. A conversão
sai da <strong>Tabela 1.1</strong> do guia <em>Jogando Space Dragon com Old
Dragon 2</em>, de Francisco Martellini:</p>

<table>
<thead><tr><th>Space Dragon</th><th>Old Dragon 2</th></tr></thead>
<tbody>
<tr><td>Força</td><td>Força</td></tr>
<tr><td>Destreza</td><td>Destreza</td></tr>
<tr><td>Constituição</td><td>Constituição</td></tr>
<tr><td><strong>Ciência</strong></td><td><strong>Inteligência</strong></td></tr>
<tr><td><strong>Intelecto</strong></td><td><strong>Sabedoria</strong></td></tr>
<tr><td><strong>Comunicação</strong></td><td>Carisma</td></tr>
</tbody>
</table>

<p>⚠️ <strong>Intelecto vira Sabedoria, não Inteligência.</strong> É a troca que
mais engana, porque o nome puxa para o outro lado. O guia explica: o Intelecto
"tem uma semelhança maior com a Sabedoria do que com a Inteligência, sendo usado
inclusive nas Jogadas de Proteção".</p>

<p>Quem mapear pelo nome parecido inverte <em>Ciência</em> e <em>Intelecto</em>
na mesa inteira, e o erro só aparece quando um teste cai no atributo errado.</p>

<h2>Os modificadores convertidos</h2>
<p>No Space Dragon o valor médio é <strong>10–11</strong>; no Old Dragon 2, entre
<strong>9 e 12</strong>. O guia ajusta a tabela para a escala do OD2, mas mantém
as faixas acima de 20, que o OD2 não prevê.</p>

${tabelaModificadores()}

<p>⚠️ <strong>Onde a ficha do OD2 mostra o número errado.</strong> Ela calcula
pela tabela dela, que não vai além de 20 nem tem a faixa do 1 isolada. Nos
valores <strong>${DIVERGE_DA_FICHA.join(", ")}</strong> os dois discordam, e o
Mestre corrige à mão. Não há como consertar isso de dentro de um módulo.</p>
`,
      },
      {
        title: "As tabelas originais do Space Dragon",
        content: `
<h2>Para consulta, não para a ficha</h2>
<p>Estas são as tabelas <strong>nativas</strong> do Livro Básico (T1-1 a T1-6),
com a escala própria dele: de 1 a 29, em faixas de dois, com a faixa neutra em
<strong>10–11</strong>.</p>

<p>Elas <strong>não</strong> são o que a ficha do Old Dragon 2 usa — para jogar,
vale a conversão da página anterior. Ficam aqui porque muita coisa do livro
(subjugar, furtividade, clonagem, aptidão tecnológica, robôs desativados) sai
delas e não tem equivalente no OD2.</p>

${ATRIBUTOS.map(tabelaNativa).join("\n")}
`,
      },
      {
        title: "O que este módulo é",
        content: `
<h2>De onde vem o conteúdo</h2>
<p>Do <strong>Space Dragon — Livro Básico Aprimorado</strong>, de Igor Moreno,
convertido para o sistema <code>olddragon2e</code> pelas equivalências do guia de
Francisco Martellini.</p>

<p>Os créditos do livro declaram que <em>"todas as partes deste material podem ser
reproduzidas sem permissão especial, com exceção dos elementos gráficos, logo,
ilustrações e diagramação"</em>, sob <strong>Open Game License</strong> e
<strong>Creative Commons v3.0 by-sa</strong>. Este módulo traz o texto das regras
e <strong>nenhuma arte do livro</strong>.</p>

<h2>As porcentagens</h2>
<p>Space Dragon usa <code>%</code> em vários lugares — a resistência a poderes
mentais do Androide é de 5%, subjugar e furtividade são percentuais. O Old Dragon
2 não trabalha assim. Onde o número ainda estiver em porcentagem, ele está
<strong>transcrito, não convertido</strong>, e como convertê-lo é decisão da
mesa.</p>

<h2>O que ainda não está aqui</h2>
<p>Capítulos 3 (Classes), 5 (Equipamento), 8 (Aparatos), 9 (Poderes Mentais),
10 (Espaçonaves) e 11 (Seção do Mestre). O módulo cobre por enquanto os
Capítulos 1 e 2.</p>
`,
      },
    ],
  },
];
