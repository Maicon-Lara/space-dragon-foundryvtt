// Journal de regras.
//
// Tudo aqui sai do *Space Dragon — Livro Básico Aprimorado* e de nenhuma outra
// fonte. As tabelas são as nativas (T1-1 a T1-6), com a escala do próprio jogo:
// de 1 a 29, em faixas de dois, com a faixa neutra em 10–11.

import { TABELAS, FAIXAS, ROTULOS, ATRIBUTOS } from "./atributos.mjs";
import { CAMPO_NA_FICHA, NOME } from "./onde-anotar.mjs";
import { subatributos } from "./subatributos.mjs";

const sinal = (n) => (n > 0 ? `+${n}` : n === 0 ? "—" : `${n}`);

/** Colunas que são contagem ou porcentagem, e não modificador com sinal. */
const SEM_SINAL = new Set(["clonagem", "poderMental", "seguidores", "idiomas", "robos", "alcanceAdicional"]);

function tabelaNativa(chave) {
  const t = TABELAS[chave];
  const cols = Object.keys(t[0]);
  const cab = cols.map((c) => `<th>${c}</th>`).join("");
  const linhas = t.map((linha, i) => {
    const [min, max] = FAIXAS[i];
    const faixa = min === max ? `${min}` : `${min}–${max}`;
    const cels = cols.map((c) => {
      const v = linha[c];
      if (Array.isArray(v)) return `<td>${v.join(" / ")} kg</td>`;
      if (typeof v === "number" && !SEM_SINAL.has(c)) return `<td>${sinal(v)}</td>`;
      return `<td>${v}</td>`;
    }).join("");
    return `<tr><td><strong>${faixa}</strong></td>${cels}</tr>`;
  }).join("");
  return `<h3>${ROTULOS[chave].nome} <em>(${ROTULOS[chave].sigla})</em></h3>` +
         `<table><thead><tr><th>valor</th>${cab}</tr></thead><tbody>${linhas}</tbody></table>`;
}

const ROTULO_FICHA = {
  forca: "Força", destreza: "Destreza", constituicao: "Constituição",
  inteligencia: "Inteligência", sabedoria: "Sabedoria", carisma: "Carisma",
};

const linhaOndeAnotar = ATRIBUTOS.map((a) => {
  const campo = ROTULO_FICHA[CAMPO_NA_FICHA[a]];
  const mudou = campo !== NOME[a];
  return `<tr><td>${mudou ? `<strong>${NOME[a]}</strong>` : NOME[a]}</td>` +
         `<td>${mudou ? `<strong>${campo}</strong>` : campo}</td></tr>`;
}).join("");

export const regras = [
  {
    title: "Space Dragon — regras de referência",
    pages: [
      {
        title: "Os seis atributos",
        content: `
<h2>A escala do Space Dragon</h2>
<p>Os atributos vão de <strong>1 a 29</strong>, em faixas de dois. A faixa
neutra — onde o modificador é zero — é <strong>10–11</strong>, e é ali que fica
o humano comum.</p>

<p>Na criação, role <strong>3d6 seis vezes</strong> e distribua os resultados
entre <strong>Força</strong>, <strong>Destreza</strong>,
<strong>Constituição</strong>, <strong>Intelecto</strong>,
<strong>Ciência</strong> e <strong>Comunicação</strong>, como preferir. Depois
aplique os modificadores da espécie.</p>

<p><strong>Cada atributo tem colunas próprias.</strong> Não existe "o
modificador" único: a Força dá capacidade de carga em quilos, a Ciência devolve
um <em>dado</em> de robôs desativados, a Comunicação diz quantos seguidores o
personagem pode ter. As seis tabelas estão na página seguinte.</p>

<h2>Onde anotar cada um na ficha</h2>
<p>A ficha do sistema Old Dragon 2 tem seis campos de atributo, rotulados com os
nomes dele. Três dos atributos do Space Dragon têm nome próprio, então este
módulo adota a colocação abaixo:</p>

<table>
<thead><tr><th>Space Dragon</th><th>campo na ficha</th></tr></thead>
<tbody>${linhaOndeAnotar}</tbody>
</table>

<p>⚠️ <strong>Isto é convenção deste módulo, não regra do jogo.</strong> Nenhum
número muda: os modificadores continuam sendo os das tabelas do Space Dragon, e
a faixa neutra continua sendo 10–11. A tabela acima só diz <em>onde escrever</em>
cada valor.</p>

<p>A colocação sai do que o próprio livro diz que cada atributo faz: a
<strong>Ciência</strong> é aptidão tecnológica e saber aplicado; o
<strong>Intelecto</strong> é proteção mental e força de vontade; a
<strong>Comunicação</strong> é reação, seguidores e idiomas.</p>

<h2>O que a ficha do OD2 calcula errado</h2>
<p>A ficha calcula o modificador pela tabela <em>dela</em>, que tem faixa neutra
em 9–12 e para em 20. A do Space Dragon tem faixa neutra em <strong>10–11</strong>
e vai até <strong>29</strong>.</p>

<p><strong>Ignore o modificador que a ficha exibe</strong> e use o das tabelas da
página seguinte. É a diferença mais importante deste módulo, e não há como
consertá-la de dentro de um módulo — quem calcula é o sistema.</p>
`,
      },
      {
        title: "As seis tabelas de atributo",
        content: `
<h2>T1-1 a T1-6</h2>
<p>As tabelas do <em>Livro Básico Aprimorado</em>, transcritas. São elas que
mandam — não o modificador que a ficha do Old Dragon 2 exibe.</p>

${ATRIBUTOS.map(tabelaNativa).join("\n")}
`,
      },
      {
        title: "O que este módulo é",
        content: `
<h2>De onde vem o conteúdo</h2>
<p>Do <strong>Space Dragon — Livro Básico Aprimorado</strong>, de Igor Moreno, e
de nenhuma outra fonte. As regras não foram convertidas: estão transcritas como
o livro as escreve.</p>

<p>Os créditos do livro declaram que <em>"todas as partes deste material podem ser
reproduzidas sem permissão especial, com exceção dos elementos gráficos, logo,
ilustrações e diagramação"</em>, sob <strong>Open Game License</strong> e
<strong>Creative Commons v3.0 by-sa</strong>. Este módulo traz o texto das regras
e <strong>nenhuma arte do livro</strong>.</p>

<h2>As porcentagens</h2>
<p>Space Dragon usa <code>%</code> em muita coisa: subjugar, furtividade,
clonagem, aptidão tecnológica, operar máquinas, pilotar naves, a chance de
realizar um poder mental. O Old Dragon 2 não trabalha assim, e o módulo
<strong>não converte</strong> — as porcentagens estão como o livro as escreve, e
se resolvem rolando percentual na mesa.</p>

<h2>O que ainda não está aqui</h2>
<p>Capítulos 6 (Aventuras Espaciais), 10 (Espaçonaves e Estações)
e 11 (Seção do Mestre).</p>
`,
      },
    ],
  },
  subatributos,
];
