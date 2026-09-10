// O journal do Capítulo 6.

import {
  TRIPULANTES, TERRENOS, DESLOCAMENTO, CARGA, REACAO,
  MOVIMENTO_BASE, GRAVIDADE,
} from "./aventuras.mjs";

const tab = (cab, linhas) =>
  `<table><thead><tr>${cab.map((c) => `<th>${c}</th>`).join("")}</tr></thead>` +
  `<tbody>${linhas}</tbody></table>`;

const cr = (n) => `$${n.toLocaleString("pt-BR")}`;

const tripulantes = tab(["tripulante", "preço por expedição"],
  TRIPULANTES.map((t) => `<tr><td><strong>${t.funcao}</strong></td><td>${cr(t.preco)}</td></tr>`).join(""));

const terrenos = tab(["terreno", "penalidade no movimento", "chance de se perder", "chance de encontro"],
  TERRENOS.map((t) =>
    `<tr><td><strong>${t.terreno}</strong></td>` +
    `<td>${t.penalidade ? `${t.penalidade} m` : "—"}</td>` +
    `<td>${t.perder}</td><td>${t.encontro}</td></tr>`).join(""));

const deslocamento = tab(["tempo", "distância"],
  DESLOCAMENTO.map((l) => `<tr><td>${l.tempo}</td><td>${l.distancia}</td></tr>`).join(""));

const carga = tab(["carga", "penalidade", "quando acontece"],
  CARGA.map((c) => `<tr><td><strong>${c.faixa}</strong></td><td>${c.penalidade}</td><td>${c.nota}</td></tr>`).join(""));

const reacao = tab(["afiliação da criatura", "chance-base"],
  Object.entries(REACAO).map(([a, r]) =>
    `<tr><td><strong>${a[0].toUpperCase()}${a.slice(1)}</strong></td><td>${r.texto}</td></tr>`).join(""));

export const aventurasJournal = {
  title: "Space Dragon — Aventuras Espaciais",
  pages: [
    {
      title: "A tripulação",
      content: `
<h2>Um de cada classe, mas não obrigatoriamente</h2>
<p>Uma expedição costuma ter <strong>um membro de cada classe</strong>, o que
garante que a maioria das situações caia na especialidade de alguém. Nada impede
vários da mesma classe, ou nenhum de alguma.</p>

<h2>Contratando gente</h2>
<p>Quando o grupo não basta, contrata-se. Os preços abaixo são por uma
<strong>expedição de cerca de um mês</strong>.</p>

${tripulantes}

<p><strong>Médico</strong> — pode criar aparatos e realizar feitos da
especialidade médica, mas a tripulação paga os materiais. O preço acima é para
integrar a tripulação: <strong>um tratamento avulso sai pela T5-5</strong>.
⚠️ Médicos <strong>recusam-se a entrar em combate</strong>, embora fiquem por
perto para os primeiros socorros.</p>

<p><strong>Especialista</strong> — autoridade acadêmica ou científica sobre um
assunto, que acompanha como consultor. Não é raro que o especialista seja o
<strong>contratante</strong> da expedição; e se ele quiser algo que a viagem
possa render, o preço da contratação cai.</p>
`,
    },
    {
      title: "Movimento",
      content: `
<h2>Tudo parte de ${MOVIMENTO_BASE} metros</h2>
<p>Todo personagem tem movimento base de <strong>${MOVIMENTO_BASE} metros</strong>.
O que muda esse número, <strong>nesta ordem</strong>:</p>

<ol>
<li>a <strong>gravidade</strong>, que transforma o base;</li>
<li>o <strong>terreno</strong>, que desconta do resultado;</li>
<li>a <strong>carga</strong>;</li>
<li>a <strong>veste</strong>.</li>
</ol>

<p>⚠️ O livro é explícito: <em>"a gravidade deve ser considerada antes do
terreno"</em>. A ordem muda o número.</p>

<h2>Gravidade</h2>
<p>A escala vai de <strong>${GRAVIDADE.minimo}%</strong> a
<strong>${GRAVIDADE.maximo}%</strong>, com <strong>${GRAVIDADE.padrao}%</strong>
sendo a do planeta de origem da espécie humana. Ela mexe em
<strong>três coisas ao mesmo tempo</strong>, e não na mesma direção:</p>

<ul>
<li><strong>Abaixo de 100%</strong> — o movimento vira uma porcentagem igual à
gravidade, o peso cai e a <strong>capacidade de carga sobe</strong>, na mesma
proporção.</li>
<li><strong>Acima de 100%</strong> — o movimento perde tantos metros quanto for
a gravidade extra, o peso sobe e a <strong>carga cai</strong>.</li>
</ul>

<blockquote><p>Gravidade <strong>80%</strong>: movimento 8 metros, peso 20%
menor, carga 20% maior.</p>
<p>Gravidade <strong>140%</strong>: movimento 6 metros, peso 40% maior, carga
40% menor.</p></blockquote>

<p>⚠️ Em <strong>0%</strong> ou <strong>acima de 200%</strong> não há locomoção
normal: falta peso ou sobra sobrecarga. Aparatos podem resolver, mas ficar muito
tempo nesses extremos deixa sequelas, a critério do Mestre.</p>

<h2>T6-2: Terreno</h2>
<p>⚠️ As duas porcentagens são <strong>do Mestre</strong>. O livro pede que ele
as role <strong>em segredo</strong>, depois de algum tempo naquele terreno.
Cabe aos jogadores deduzir que se perderam, ou se preparar para o que vem.</p>

${terrenos}

<h2>Carga</h2>
<p>Os três limites — leve, média e pesada — saem do atributo
<strong>Força</strong>, pela T1-1.</p>

${carga}

<h2>T6-3: Distância de deslocamento</h2>
<p>A partir do movimento <strong>final</strong>, depois de tudo aplicado.</p>

${deslocamento}
`,
    },
    {
      title: "Explorando",
      content: `
<h2>Contato com alienígenas</h2>
<p>Ao encontrar uma criatura inteligente, faz-se uma <strong>jogada de
reação</strong>. A chance-base vem da <strong>afiliação da criatura</strong>:</p>

${reacao}

<p>Sobre essa base soma-se o <strong>ajuste de reação da Comunicação</strong> de
quem tenta o contato. Rola-se percentual: <strong>igual ou abaixo</strong> e a
criatura age de modo amigável ou neutro; acima, hostil.</p>

<p>⚠️ <strong>O teste é por personagem</strong>, não um para o grupo. A mesma
criatura pode gostar de um e detestar outro.</p>

<p>Hostilidade pode ser revertida com presentes ou negociação.</p>

<p class='nota-casa'><em>O compêndio de Macros tem <strong>Reação de criatura
inteligente</strong>: some a chance-base da afiliação no modificador de
situação.</em></p>

<h2>Luz e visibilidade</h2>
<p>Nem sempre há sol, lua ou estrela — e quando há, pode não bastar. Cada
equipamento traz na descrição o quanto ilumina e por quanto tempo.</p>

<p>As mutações de visão mudam isso: <strong>visão ampliada</strong> enxerga a até
15 metros em ambiente mal iluminado, <strong>mas não na escuridão total</strong>;
<strong>visão diminuída</strong> tem metade da eficiência de um humano quando
falta luz.</p>

<h2>Operar máquinas achadas por aí</h2>
<p>Máquinas estranhas ou arcaicas, às vezes danificadas. O
<strong>cientista</strong> usa operar máquinas para consertar e depois de novo
para operar. O <strong>gatuno</strong> resolve com sabotagem. As outras classes
tentam com a aptidão tecnológica da Ciência.</p>

<h2>Acidentes e armadilhas</h2>
<p>Em geral se resolvem com <strong>jogadas de proteção</strong>, para evitar ou
amenizar. Podem ser dano direto ou efeito específico, como veneno ou
imobilização.</p>

<p>O <strong>gatuno</strong> procura e desarma armadilhas com sabotagem; as
outras classes tentam com a aptidão tecnológica.</p>

<h2>O que o Capítulo 7 resolve</h2>
<p>Falta de oxigênio e temperaturas extremas são citadas aqui, mas as regras de
dano estão no capítulo de Combate.</p>

<p><strong>Infecções e contaminações</strong> não têm regra fechada: o livro
sugere perda gradual de PV, dano de atributo em Força ou Constituição, e
penalidades em rolagens.</p>
`,
    },
  ],
};
