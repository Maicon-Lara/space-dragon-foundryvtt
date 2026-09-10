// O journal do Capítulo 10.

import {
  NAVES, VEICULOS, FONTES, DADO_DE_GASTO, T10_5,
  T10_6_ORDEM, T10_6_CRITICOS, T10_6_FALHAS,
  PILOTAGEM_IMPROVISADA, SERVICOS_ESTACAO,
} from "./naves.mjs";

const tab = (cab, linhas) =>
  `<table><thead><tr>${cab.map((c) => `<th>${c}</th>`).join("")}</tr></thead>` +
  `<tbody>${linhas}</tbody></table>`;

const linhaVeiculo = (n) =>
  `<tr><td><strong>${n.nome}</strong>${n.desc ? `<br><em>${n.desc}</em>` : ""}</td>` +
  `<td>${n.tamanho}</td><td>${n.tripulacao}</td><td>${n.pv}</td>` +
  `<td>${n.ba}</td><td>${n.cp}</td><td>${n.jp}</td><td>${n.mov}</td></tr>`;

const COLS = ["tipo", "tamanho", "tripulação", "PV", "BA", "CP", "JP", "movimento"];

const d6 = (linhas) =>
  tab(["1d6", "efeito"], linhas.map((l) => `<tr><td><strong>${l.d6}</strong></td><td>${l.efeito}</td></tr>`).join(""));

export const navesJournal = {
  title: "Space Dragon — Espaçonaves e Estações",
  pages: [
    {
      title: "A nave como personagem",
      content: `
<h2>Ela tem ficha, com outras contas</h2>
<p>Uma espaçonave tem <strong>PV, BA, CP e JP</strong>, como qualquer personagem.
Três coisas mudam:</p>

<ul>
<li><strong>Os PV são rolados</strong>, não fixos. Um caça tem 1d100; um cruzador,
2d1000.</li>
<li><strong>A JP não vem de atributo nenhum.</strong> O modificador dela sai de um
<em>teste de pilotagem</em> — o piloto rola primeiro, e o quanto ele foi bem
decide o bônus da nave.</li>
<li><strong>O ataque soma dois bônus</strong>: o BA da nave e o BA à distância de
quem estiver operando a arma.</li>
</ul>

<h2>T10-1: Tipos de Espaçonaves</h2>
${tab(COLS, NAVES.map(linhaVeiculo).join(""))}

<h2>T10-7: Veículos terrestres, aquáticos e aéreos</h2>
<p>Mesmas colunas, mesmas regras.</p>
${tab(COLS, VEICULOS.map(linhaVeiculo).join(""))}

<h2>Gente atirando em nave, e nave atirando em gente</h2>
<p>Personagens <strong>podem</strong> atacar naves com armas comuns. O CP alto
torna difícil, não impossível — e granadas e mísseis forçam uma
<strong>JP da nave</strong>, o que costuma render mais.</p>

<p>No sentido contrário a regra muda, porque exploradores espaciais desviam de
laser: os alvos fazem uma <strong>JPR</strong> e, passando, sofrem
<strong>metade do dano</strong>. Role o ataque para cada alvo, somando o BA da
nave e o do operador. <strong>A cada 20 pontos no resultado, os alvos levam −2
na JPR</strong> — um ataque de 37 dá −2; um de 41 dá −4.</p>
`,
    },
    {
      title: "Pilotagem",
      content: `
<h2>Quando se rola</h2>
<p>Para o <strong>cosmonauta</strong>, manobra rotineira — decolar, aterrissar,
manobrar normalmente — <strong>não pede teste</strong>. Pedem teste as viagens
longas, as entradas em atmosfera, o combate e as situações de tensão: fuga, mau
funcionamento.</p>

<p>⚠️ <strong>Para todas as outras classes, qualquer situação exige teste.</strong></p>

<h2>Pilotagem improvisada</h2>
<p>Quem não é cosmonauta pilota com o que tem:</p>
<ul>${Object.entries(PILOTAGEM_IMPROVISADA)
  .map(([c, r]) => `<li><strong>${c}</strong> — ${r}</li>`).join("")}</ul>

<p>Se o talento usado parou de progredir por causa de uma especialização, vale a
porcentagem <strong>do nível em que parou</strong>.</p>

<h2>Nave avariada pilota pior</h2>
<p>O Mestre desconta uma penalidade percentual conforme a gravidade das avarias,
em degraus de 5%, até o teto de <strong>50%</strong>. Um cosmonauta de 1º nível
com 80% e penalidade de 20% testa com 60%.</p>

<p>Para quem quiser precisão, o livro sugere <strong>5% de penalidade a cada 10%
de PV perdidos</strong>. Uma nave de 200 PV que sofreu 70 de dano perdeu mais de
30% e menos de 40%: penalidade de 15%.</p>

<p>⚠️ Mesmo que a penalidade zere a porcentagem, ainda se rola — a falha crítica
e o sucesso crítico continuam existindo.</p>

<h2>T10-5: o teste de pilotagem vira o modificador da JP</h2>
<p>Antes de qualquer JP da nave, o piloto testa. O resultado dele dá o
modificador do d20 da nave.</p>

${tab(["resultado do teste", "modificador na JP"],
  T10_5.map((l) => `<tr><td>${l.resultado}</td><td>${l.mod > 0 ? `+${l.mod}` : l.mod}</td></tr>`).join(""))}
`,
    },
    {
      title: "Energia e combustível",
      content: `
<h2>Um tanque só, de 0% a 100%</h2>
<p>Não importa quantos reservatórios a nave tenha: o combustível é
<strong>uma porcentagem</strong>, de 0 a 100. Ela cai ao cruzar o espaço, ao
manobrar, ao decolar e ao aterrissar.</p>

<p>O preço da tabela é <strong>por ponto percentual</strong>. Abastecer 10%
custa dez vezes o valor listado.</p>

<h2>T10-3: Fontes de Energia</h2>
${tab(["fonte", "raridade", "custo por ponto % (P/M/G/C)", "autonomia"],
  FONTES.map((f) => `<tr><td>${f.fonte}</td><td>${f.raridade}</td><td>${f.custo}</td><td>${f.autonomia}</td></tr>`).join(""))}

<h2>Quanto se gasta: não há tabela</h2>
<p>O livro é explícito ao dizer que <em>"não há uma tabela de quanto combustível
uma espaçonave gasta"</em>. No lugar, um procedimento em dois passos:</p>

<ol>
<li>A <strong>autonomia da fonte</strong> escolhe o dado:
${Object.entries(DADO_DE_GASTO).map(([a, d]) => `<strong>${a}</strong> usa ${d}`).join(", ")}.</li>
<li>O Mestre atribui de <strong>1 a 3</strong> conforme o quanto a ação custa, e
rola essa quantidade de dados.</li>
</ol>

<blockquote><p>Uma nave a reator atômico (autonomia alta, d2) numa manobra cara
(3) rola <strong>3d2</strong> — de 3% a 6% do tanque.</p></blockquote>
`,
    },
    {
      title: "Combate espacial",
      content: `
<h2>A ordem de ação é outra</h2>
<p>⚠️ <strong>A T10-6 não é a T7-2.</strong> A ordem de ação das naves usa valores
diferentes dos personagens:</p>

${tab(["ação", "valor"], T10_6_ORDEM.map((l) => `<tr><td>${l.acao}</td><td>${l.valor}</td></tr>`).join(""))}

<p>Continua valendo o resto: age primeiro o <strong>menor</strong> resultado.</p>

<h2>As ações</h2>
<ul>
<li><strong>Disparo de armas</strong> — 1d20 mais o BA da nave mais o BA à
distância de quem opera. Iguala ou supera o CP da nave alvo e causa dano. Dá
para disparar <strong>uma vez por arma instalada</strong>, desde que haja gente
controlando cada uma.</li>
<li><strong>Ativar equipamento</strong> — escudos, defletores. O Mestre pode
pedir um teste de operar máquinas, com penalidade se houver avaria.</li>
<li><strong>Manobras evasivas</strong> — <strong>só naves pequenas</strong>.
Permitem usar a <strong>JP no lugar do CP</strong> para evitar um ataque, mas só
uma vez a cada <strong>5 rodadas</strong>, sempre pedem teste de pilotagem, e
falhar significa não poder fazer a JP. Costumam gastar combustível.</li>
</ul>

<h2>T10-6: Acertos críticos de espaçonave</h2>
${d6(T10_6_CRITICOS)}

<h2>T10-6: Falhas críticas de espaçonave</h2>
${d6(T10_6_FALHAS)}
`,
    },
    {
      title: "Estações espaciais",
      content: `
<h2>O que existe numa estação</h2>
<p>Todas as câmaras que existem numa nave existem nas estações, em maior número
e tamanho. Estações populosas têm qualquer serviço que se precise, salvo o
Mestre decidir o contrário pela função e pela localização dela.</p>

<p>Muitas têm armamento, e <strong>agem de forma hostil</strong> contra naves não
identificadas ou suspeitas.</p>

<h2>T10-8: Serviços em Estações Espaciais</h2>
${tab(["serviço", "preço", "o que é"],
  SERVICOS_ESTACAO.map((s) => `<tr><td><strong>${s.servico}</strong></td><td>${s.preco}</td><td>${s.desc}</td></tr>`).join(""))}

<h2>Naves são masmorras no espaço</h2>
<p>O livro faz questão de dizer: uma tripulação explorando uma nave abandonada é
um <em>dungeon crawl</em> com laser no lugar de espada. Salas a investigar,
inimigos a derrotar, tesouros a achar. As armadilhas são sistemas de segurança,
os mortos-vivos são robôs, e o enigma mágico vira senha de acesso.</p>

<p>E dá para inverter: se os inimigos acoplarem a nave deles à do grupo, são os
personagens que defendem a própria masmorra dos invasores.</p>
`,
    },
  ],
};
