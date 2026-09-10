// A página que explica os testes de porcentagem e lista os alvos.
//
// Ela existe porque a regra é curta mas contraintuitiva para quem vem do Old
// Dragon 2: lá se quer o número ALTO, aqui se quer o BAIXO. E porque a mesa
// precisa de um lugar para conferir de onde cada parcela do alvo saiu quando o
// cartão do chat mostrar um número que ninguém esperava.

import { TESTES } from "./testes.mjs";
import { CIENTISTA, HOMEM_ESPACIAL, GATUNO, MENTALICO, TALENTOSGATUNO } from "./progressao.mjs";
import { TABELAS, rotuloColuna } from "./atributos.mjs";
import { NOME, ondeAnotar } from "./onde-anotar.mjs";

const PROG = { CIENTISTA, HOMEM_ESPACIAL, GATUNO, MENTALICO, TALENTOSGATUNO };

/** "1º nível → 20%, 20º → 88%", que é o que a mesa quer saber de relance. */
function extremos(f) {
  if (f.tabela) {
    const t = PROG[f.tabela];
    return `${t[0][f.coluna]} no 1º nível, ${t[t.length - 1][f.coluna]} no 20º`;
  }
  const t = TABELAS[f.atributo];
  const baixo = t[0][f.coluna];
  const alto = t[t.length - 1][f.coluna];
  return `${baixo}% com ${NOME[f.atributo]} 1, ${alto}% com 28–29`;
}

const linhas = TESTES.map((t) => {
  const dado = t.dado ?? "1d100";
  const ajuste = t.ajuste
    ? `<strong>${NOME[t.ajuste.atributo]}</strong> — coluna <em>${rotuloColuna(t.ajuste.coluna, t.ajuste.atributo)}</em>`
    : "<em>nenhum</em>";
  return `<tr><td><strong>${t.nome}</strong>${t.segredo ? " ⚠️" : ""}</td>` +
         `<td>${t.classe ?? "qualquer"}</td><td>${dado}</td>` +
         `<td>${extremos(t.base)}</td><td>${ajuste}</td></tr>`;
}).join("");

export const testesJournal = {
  title: "Space Dragon — Testes de porcentagem",
  pages: [
    {
      title: "A regra",
      content: `
<h2>Rola 1d100, passa no menor ou igual</h2>
<p>O livro escreve assim, na descrição dos talentos de Gatuno:</p>

<blockquote><p>Para usar seus talentos, o gatuno deve rolar um dado de
porcentagem (2d10 com a indicação de dezena e unidade ou 1d100). Se o teste
resultar num valor <strong>menor ou igual</strong> ao valor do talento, o gatuno
é bem-sucedido.</p></blockquote>

<p>Vale para todos os testes de porcentagem do jogo, não só os do Gatuno.</p>

<p>⚠️ <strong>É o contrário do d20 do Old Dragon 2</strong>, onde se quer o
resultado alto. Essa é a razão de o sistema não conseguir rolar isto sozinho:
não é uma fórmula diferente, é uma comparação diferente. Nenhum campo da ficha
resolve.</p>

<h2>De onde sai o alvo</h2>
<p>Duas parcelas, e nem todo teste tem as duas:</p>

<ul>
<li>a <strong>porcentagem da tabela da classe</strong>, pelo nível;</li>
<li>a <strong>coluna do atributo</strong>, que soma ou subtrai.</li>
</ul>

<p>Dois testes não vêm de classe nenhuma: <em>reproduzir e aprender poder
mental</em> e <em>clonagem</em> saem inteiros da tabela do atributo.</p>

<h2>As macros fazem a conta</h2>
<p>O compêndio <strong>Macros</strong> tem uma por teste, mais uma geral. Cada
uma lê o nível e os atributos da ficha do token selecionado, deixa
<strong>corrigir tudo</strong> antes de rolar, e o cartão de chat mostra de onde
cada parcela saiu.</p>

<p>⚠️ <strong>O que as macros não fazem:</strong> aplicar os efeitos de
especialização. O bônus do sabotador, a troca de coluna do espião, o congelamento
do assassino — nada disso é automático. Entram no campo <em>modificador de
situação</em>.</p>

<p>Os campos vêm preenchidos com o que o módulo conseguiu ler da ficha. Como o
Space Dragon mora numa ficha de outro jogo — a ${ondeAnotar("ciencia")}, por
exemplo — vale conferir antes de rolar.</p>

<h2>Duas rolagens são do Mestre</h2>
<p><strong>Esgueirar-se</strong> e <strong>ocultar-se</strong>. O livro é
explícito: o gatuno vai achar que passou até algo provar o contrário. As macros
desses dois mandam o cartão <strong>sussurrado ao Mestre</strong>.</p>
`,
    },
    {
      title: "Todos os testes",
      content: `
<h2>Alvo e modificador de cada um</h2>
<table>
<thead><tr><th>teste</th><th>classe</th><th>dado</th><th>base</th><th>modificador de atributo</th></tr></thead>
<tbody>${linhas}</tbody>
</table>

<p>⚠️ marca as rolagens que o livro manda o Mestre fazer.</p>

<h2>O que não é teste de porcentagem</h2>
<ul>
<li><strong>Ouvir barulhos</strong> é 1d6, e passa dentro de uma faixa que
cresce de 1–2 a 1–5. A macro rola e compara.</li>
<li><strong>Desativar robôs</strong> é 1d20 contra a T3-2, pelo nível do
disruptor, e o resultado precisa ser <em>maior</em> ou igual. Depende do
Capítulo 8, que o módulo ainda não traz.</li>
<li><strong>Ataque pelas costas</strong> e <strong>dano crítico</strong> são
multiplicadores de dano, não chances.</li>
<li><strong>Alcance mental</strong> é orçamento diário: usar um poder desconta
um percentual igual à grandeza dele. Não se rola.</li>
<li><strong>Crédito tecnológico</strong> é desconto em compras.</li>
</ul>
`,
    },
  ],
};
