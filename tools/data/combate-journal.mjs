// O journal do Capítulo 7.

import { T7_1, T7_2, T7_3, T7_4, T7_5 } from "./combate.mjs";

const tabela = (cab, linhas) =>
  `<table><thead><tr>${cab.map((c) => `<th>${c}</th>`).join("")}</tr></thead>` +
  `<tbody>${linhas}</tbody></table>`;

const l71 = T7_1.map((l) =>
  `<tr><td>${l.situacao}</td><td>${l.mod > 0 ? `+${l.mod}` : l.mod}</td></tr>`).join("");

const l72 = T7_2.map((l) => `<tr><td>${l.acao}</td><td>${l.valor}</td></tr>`).join("");

const l73 = Object.entries(T7_3).map(([bloco, linhas]) =>
  `<h3>${bloco}</h3>` + tabela(["situação", "mod."],
    linhas.map((l) => `<tr><td><strong>${l.situacao}</strong><br><em>${l.nota}</em></td><td>${l.mod}</td></tr>`).join("")
  )).join("\n");

const l74 = T7_4.map((l) => `<tr><td><strong>${l.d6}</strong></td><td>${l.efeito}</td></tr>`).join("");
const l75 = T7_5.map((l) => `<tr><td><strong>${l.d6}</strong></td><td>${l.efeito}</td></tr>`).join("");

export const combateJournal = {
  title: "Space Dragon — Combate e Danos",
  pages: [
    {
      title: "Ordem de ação",
      content: `
<h2>Não é iniciativa</h2>
<p>⚠️ <strong>Esta é a maior diferença do Space Dragon para o Old Dragon 2 em
combate.</strong> Não se rola 1d20 nem se soma Destreza para ver quem vai
primeiro. O número sai da <strong>ação declarada</strong>:</p>

${tabela(["ação", "valor"], l72)}

<p><strong>Age primeiro o MENOR resultado.</strong> A faca age antes do rifle de
plasma, porque o dado dela é menor.</p>

<p><strong>A rodada dura o maior resultado × 2 segundos.</strong> Não é um tempo
fixo: uma rodada de escaramuça com facas é mais curta que uma de bombardeio.</p>

<p class='nota-casa'><em>O rastreador de combate do Foundry rola 1d20 e ordena do
maior para o menor — a fórmula errada e na ordem invertida. Use a macro
<strong>Ordem de Ação</strong>, no compêndio de Macros: ela pergunta o que cada
um vai fazer, rola o que precisa, ordena e diz quanto dura a rodada.</em></p>

<h2>Surpresa</h2>
<p>Quem é surpreendido <strong>não age no primeiro turno</strong> e ainda leva
<strong>−5 no CP</strong> até o fim daquela rodada.</p>

${tabela(["situação", "modificador"], l71)}
`,
    },
    {
      title: "Atacando",
      content: `
<h2>O ataque acerta com igual ou maior</h2>
<p>Role <strong>1d20</strong> e some o bônus de ataque. Se igualar ou superar o
<strong>CP</strong> do alvo, acertou.</p>

<ul>
<li><strong>À distância</strong> — o bônus vem da <strong>Destreza</strong>.</li>
<li><strong>Corpo a corpo</strong> — o bônus vem da <strong>Força</strong>, e o
modificador de Força <strong>também soma ao dano</strong>.</li>
</ul>

<p>Dá para bater com a coronha de uma arma de fogo: o dano vira
<strong>1d4</strong>, e esse 1d4 substitui o dado da arma <em>inclusive na ordem
de ação</em>. Desarmado, o dano e a ordem de ação são o modificador de Força,
com mínimo de 1.</p>

<p>⚠️ Quem cai abaixo de 0 PV por golpe <strong>não cortante</strong> ou por
ataque desarmado fica <strong>inconsciente, não morrendo</strong>.</p>

<h2>Área e arremesso</h2>
<p>Rolagem normal de ataque à distância contra um CP de <strong>10 + 1 para cada
3 metros</strong> de distância. Uma granada a 15 metros é dificuldade 15.</p>

<p>Errando, a <strong>diferença</strong> entre o resultado e o CP é quantos
metros o objeto caiu longe do alvo. A direção sai de 1d8.</p>

<h2>Modificadores</h2>
${l73}
`,
    },
    {
      title: "Críticos",
      content: `
<h2>O 20 e o 1 naturais</h2>
<p>Um <strong>20 natural</strong> acerta sempre e <strong>dobra o dano</strong> —
ou mais, se o atacante for <strong>cosmonauta</strong>, que tem o multiplicador
próprio na tabela da classe. Opcionalmente, role 1d6 na T7-4 para um efeito
extra.</p>

<p>Um <strong>1 natural</strong> é falha crítica, com 1d6 na T7-5.</p>

<p>⚠️ Um acerto crítico <strong>sempre causa ao menos 1 de dano</strong>, mesmo
com todas as reduções.</p>

<h2>T7-4: Acertos Críticos</h2>
${tabela(["1d6", "resultado"], l74)}

<h2>T7-5: Falhas Críticas</h2>
${tabela(["1d6", "resultado"], l75)}

<p class='nota-casa'><em>As duas têm macro no compêndio, e o dano crítico do
cosmonauta tem a sua — ela aplica o multiplicador do nível ao dano final.</em></p>
`,
    },
    {
      title: "Dano, cura e morte",
      content: `
<h2>Dano</h2>
<p>O dano <strong>nunca é negativo</strong>, mas pode ser zerado por penalidades.
<strong>Redução de dano</strong> desconta um valor fixo de cada acerto sofrido:
quem tem RD 3 e leva 8 sofre 5.</p>

<h2>Os três estados</h2>
<ul>
<li><strong>Acima de 0</strong> — ferido, e a gravidade cresce conforme se
aproxima do zero.</li>
<li><strong>Em 0</strong> — <strong>inconsciente, porém estável</strong>. Ainda
não está morrendo.</li>
<li><strong>Abaixo de 0</strong> — a caminho da morte.</li>
</ul>

<h2>Estabilizar</h2>
<p>Com PV negativos, o personagem faz uma <strong>JPF</strong> a cada rodada, a
partir da seguinte àquela em que foi atingido. <strong>Falhar custa 1d4 PV</strong>;
passar o deixa <strong>estável</strong>, ainda em PV negativos mas fora de perigo
imediato.</p>

<p>Outro personagem pode gastar uma ação e fazer um <strong>teste de
Ciência</strong> para estabilizá-lo. Sucesso equivale a ter passado na JPF; e
mesmo <strong>falhando, o socorrista dá +4 na próxima rolagem</strong>.</p>

<p>⚠️ <strong>Androide só pode ser socorrido por um cientista.</strong></p>

<h2>Morte</h2>
<p>A morte vem no número de PV negativos que a <strong>Constituição</strong>
indica, entre <strong>−5 e −19</strong>. Não há jogada contra: chegou ali,
morreu.</p>

<p class='nota-casa'><em>No Old Dragon 2 a morte é sempre em −10 fixo. O valor
do personagem está no campo <strong>Danos Mortais</strong> do cabeçalho da
ficha, que este módulo põe no lugar das moedas.</em></p>

<h2>Recuperar</h2>
<ul>
<li><strong>Um dia de repouso total</strong> — 1 PV por nível. Mutações mudam
essa taxa.</li>
<li><strong>Tratamento médico</strong> — 1d4+1 PV por dia, se quem cuida passar
num teste de Ciência.</li>
<li><strong>Androides não se recuperam sozinhos.</strong> Dependem de reparos
feitos por cientistas.</li>
</ul>

<p>Alguns poderes mentais devolvem <strong>PV psicológicos</strong>, que se
perdem de novo depois de um tempo.</p>

<p>A única forma de trazer um morto de volta é <strong>clonando</strong>, com o
feito científico apropriado. A Constituição do morto dá a chance de o
procedimento falhar. O clone é geneticamente idêntico, mas
<strong>não necessariamente tem a mesma personalidade</strong> — para isso é
preciso um poder mental que implante as memórias.</p>
`,
    },
  ],
};
