// O journal do Capítulo 8 e da T3-2.
//
// Os 80 aparatos e feitos viram itens; aqui fica a regra que os governa e a
// tabela de desativar robôs, que é do Capítulo 3 mas só faz sentido junto do
// disruptor.

import { APARATOS, CATEGORIAS_POR_CLASSE } from "./aparatos.mjs";
import { DESATIVAR_ROBOS, TIPOS_DE_ROBO, LETRAS } from "./robos.mjs";

const nt = (n) => (n === null ? "variável" : `${n}º`);

const porNivel = [...new Set(APARATOS.map((a) => a.nt))].sort((a, b) => (a ?? 99) - (b ?? 99));

const listaPorNivel = porNivel.map((n) => {
  const doNivel = APARATOS.filter((a) => a.nt === n);
  const linhas = doNivel.map((a) =>
    `<tr><td>${a.nome}</td><td>${a.feito ? "<em>feito</em>" : a.categoria}</td>` +
    `<td>${a.custo}</td><td>${a.tempo}</td></tr>`
  ).join("");
  return `<h3>${nt(n)} nível tecnológico</h3>` +
    `<table><thead><tr><th>nome</th><th>tipo</th><th>custo</th><th>tempo</th></tr></thead>` +
    `<tbody>${linhas}</tbody></table>`;
}).join("\n");

const cabecalhoRobos =
  `<th>nível do disruptor</th>` + TIPOS_DE_ROBO.map((t) => `<th>${t}</th>`).join("");

const linhasRobos = DESATIVAR_ROBOS.map((l) =>
  `<tr><td><strong>${l.nivel}º</strong></td>` +
  TIPOS_DE_ROBO.map((t) => {
    const v = l[t];
    return /^\d+$/.test(v) ? `<td>${v}</td>` : `<td><strong>${v}</strong></td>`;
  }).join("") + `</tr>`
).join("");

const quemUsa = Object.entries(CATEGORIAS_POR_CLASSE)
  .map(([classe, cats]) => `<tr><td><strong>${classe}</strong></td><td>${cats.join(", ")}</td></tr>`)
  .join("");

export const aparatosJournal = {
  title: "Space Dragon — Aparatos e Feitos Científicos",
  pages: [
    {
      title: "Como funcionam",
      content: `
<h2>Duas coisas diferentes</h2>
<p><strong>Aparatos tecnológicos</strong> são objetos: alguém os constrói, alguém
os carrega, alguém os usa. <strong>Feitos científicos</strong> são
procedimentos, e só o cientista os realiza — não há o que carregar.</p>

<h2>A categoria decide quem pode usar</h2>
<p>Todo aparato é <strong>ofensivo</strong>, <strong>defensivo</strong> ou
<strong>utilitário</strong>, e cada classe opera só as suas:</p>

<table>
<thead><tr><th>classe</th><th>opera</th></tr></thead>
<tbody>${quemUsa}</tbody>
</table>

<p>É a categoria que responde <em>"meu gatuno pode usar isto?"</em>. Por isso
ela está no item, e não perdida no meio da descrição.</p>

<h2>Nível tecnológico</h2>
<p>O <strong>NT</strong> mede o quanto o aparato é avançado. Ele limita o que o
cientista consegue <strong>construir</strong> — não o que consegue
<strong>usar</strong>: não há limite de nível para usar.</p>

<p>O <em>Nível Tecnológico Máximo</em> do Cientista sobe um degrau a cada dois
níveis de classe.</p>

<p>Dois itens têm <strong>NT variável</strong>: a <em>Injeção de adrenalina</em>
e os <em>Reparos robóticos</em>. O custo deles também é.</p>

<p class='nota-casa'><em>A T8-1 lista esses dois no 1º NT, e lista o
<em>Dispositivo rastreador</em> no 5º quando a entrada dele diz 2º. Onde a
tabela e a entrada discordam, este módulo segue a <strong>entrada</strong> —
ela traz custo e tempo, e a tabela é só um índice.</em></p>
`,
    },
    {
      title: "A lista",
      content: `
<h2>Os 80, por nível tecnológico</h2>
<p>Todos estão no compêndio <strong>Aparatos</strong>, prontos para arrastar.</p>
${listaPorNivel}
`,
    },
    {
      title: "Desativar robôs",
      content: `
<h2>O único teste em 1d20</h2>
<p>O Cientista com um <strong>disruptor positrônico</strong> desativa robôs. Role
<strong>1d20</strong>: o resultado precisa ser <strong>igual ou maior</strong>
que o número da tabela.</p>

<p>⚠️ <strong>É o sentido oposto do resto do jogo.</strong> Todo o resto do Space
Dragon é 1d100 com sucesso no <em>menor ou igual</em>. Aqui se quer o número
alto, como no Old Dragon 2.</p>

<h2>A linha é o disruptor, não o cientista</h2>
<p>O nível da tabela é o do <strong>disruptor positrônico</strong>, que é um
aparato e sobe pelas regras do Capítulo 8. Um cientista de 10º nível com um
disruptor de 3º usa a linha do <strong>3º</strong>.</p>

<h2>As três letras</h2>
<ul>${Object.entries(LETRAS).map(([k, v]) => `<li><strong>${k}</strong> — ${v}</li>`).join("")}</ul>

<h2>Quantos robôs</h2>
<p>A tabela diz <em>se</em> desativa. <strong>Quantos</strong> sai da
<strong>T1-5</strong> da Ciência, e é um <strong>dado</strong>: 1d2 com Ciência
10–11, 1d6 com 16–17, 1d20 com 28–29.</p>

<h2>T3-2: Desativar Robôs</h2>
<table>
<thead><tr>${cabecalhoRobos}</tr></thead>
<tbody>${linhasRobos}</tbody>
</table>
`,
    },
  ],
};
