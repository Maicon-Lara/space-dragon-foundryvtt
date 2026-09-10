// Capítulo 4 — Subatributos.
//
// PV, CP, BA, JP, Idiomas e Afiliação. É o capítulo que mais colide com a ficha
// do Old Dragon 2, e por três motivos:
//
//   · a defesa se chama CP (Coeficiente de Proteção) e é montada de outro jeito;
//   · a JP é UMA só, com três modificadores, e não três valores;
//   · a Afiliação não é alinhamento — ela decide a ESPECIALIZAÇÃO da classe.
//
// Cada seção diz, no fim, o que a ficha do OD2 faz de diferente.

/** T4-1: bônus de CP por nível. NÃO é cumulativo. */
export const T4_1 = [
  { niveis: "1–3", bonus: "—" },
  { niveis: "4–7", bonus: "+1" },
  { niveis: "8–11", bonus: "+2" },
  { niveis: "12–15", bonus: "+3" },
  { niveis: "16–19", bonus: "+4" },
  { niveis: "20", bonus: "+5" },
];

const tabelaT41 =
  "<table><thead><tr><th>nível do personagem</th><th>bônus no CP</th></tr></thead><tbody>" +
  T4_1.map((l) => `<tr><td>${l.niveis}</td><td>${l.bonus}</td></tr>`).join("") +
  "</tbody></table>";

/** Aviso de colisão com a ficha do OD2. */
const naFicha = (txt) =>
  `<p class='nota-casa'><em><strong>Na ficha do Old Dragon 2:</strong> ${txt}</em></p>`;

export const subatributos = {
  title: "Space Dragon — Subatributos",
  pages: [
    {
      title: "Pontos de Vida",
      content: `
<h2>Como se calcula</h2>
<p>Três coisas determinam os PV: a <strong>classe</strong> (que dá o dado de
vida), o <strong>nível</strong> (quantos dados) e a <strong>Constituição</strong>
(o modificador aplicado a toda rolagem de PV).</p>

<p><strong>No 1º nível não se rola.</strong> O personagem recebe o
<strong>máximo</strong> do dado de vida da classe, e aplica o modificador de
Constituição.</p>

<p>A cada novo nível, role o dado de vida da classe e aplique o modificador.</p>

<blockquote><p>Um mentálico de 1º nível recebe <strong>4</strong> PV — o máximo
do d4. Com Constituição 9, o modificador é <strong>−1</strong>, e ele começa com
<strong>3</strong> PV. No 2º nível rola 1d4, tira 3, aplica o −1, e ganha
2 PV.</p></blockquote>

<h2>Onde a morte acontece</h2>
<p>O personagem não morre em 0 PV: morre nos <strong>Danos Mortais</strong>, um
número negativo que sai da tabela <strong>T1-3</strong> da Constituição. Com
Constituição 10–11 são <strong>−10 PV</strong>; com 18–19, <strong>−14</strong>.</p>

${naFicha("a Constituição 9 dá −1 no Space Dragon e 0 no Old Dragon 2 — a faixa neutra é outra. Use o modificador da tabela T1-3, não o que a ficha exibe.")}
`,
    },
    {
      title: "Coeficiente de Proteção",
      content: `
<h2>CP, e não CA</h2>
<p>O <strong>Coeficiente de Proteção</strong> é o quanto o personagem evita ser
atingido. Um ataque precisa <strong>igualar ou superar</strong> o CP do alvo.</p>

<p><strong>CP = proteção das vestes + ajuste de Destreza + bônus por nível +
aparatos defensivos + mutações + poderes mentais.</strong></p>

<h2>O bônus por nível</h2>
<p>A cada quatro níveis o personagem fica melhor em evitar disparos. Os valores
<strong>não são cumulativos</strong>: cada um é o bônus <em>total</em> de quem
está naquela faixa.</p>

${tabelaT41}

<blockquote><p>Uma cosmonauta de 1º nível com vestes médias (proteção 12) e
Destreza 13 (ajuste +1) tem CP <strong>13</strong>. Ela ainda não chegou ao 4º
nível, então não há bônus de nível nenhum.</p></blockquote>

${naFicha("a ficha tem um campo de <strong>CA</strong>, que o OD2 monta de outro jeito. Anote o CP ali, mas calcule pela fórmula acima — o bônus por nível do Space Dragon não existe no OD2.")}
`,
    },
    {
      title: "Bônus de Ataque",
      content: `
<h2>Duas vertentes, não uma</h2>
<p>O ataque é <strong>1d20 + BA</strong>, e precisa igualar ou superar o CP do
alvo. Mas o BA se divide em dois, conforme a arma:</p>

<ul>
<li><strong>Corpo a corpo</strong> — base de ataque da classe + ajuste de
<strong>Força</strong> + aparatos + mutações + poderes mentais</li>
<li><strong>À distância</strong> — base de ataque da classe + ajuste de
<strong>Destreza</strong> + aparatos + mutações + poderes mentais</li>
</ul>

<p>A única diferença entre os dois é o atributo. Tudo o mais é igual.</p>

<blockquote><p>Um gatuno de 3º nível com Força 12 e Destreza 17 tem
<strong>+5</strong> com a pistola laser (base +2 da classe, mais +3 de Destreza)
e apenas <strong>+3</strong> com a faca de sobrevivência (base +2, mais +1 de
Força).</p></blockquote>

${naFicha("a ficha guarda um valor de BA só. Quem tem Força e Destreza diferentes precisa fazer as duas contas à mão.")}
`,
    },
    {
      title: "Jogadas de Proteção",
      content: `
<h2>Um valor, três modificadores</h2>
<p>A JP resiste ao que não é ataque direto. <strong>O valor base vem da tabela da
classe</strong> — é um só — e o que muda entre os três tipos é
<strong>qual atributo modifica a rolagem</strong>.</p>

<table>
<thead><tr><th>tipo</th><th>quando</th><th>modificador</th></tr></thead>
<tbody>
<tr><td><strong>JPR</strong> — reflexos</td><td>esquivar de explosões, desmoronamentos</td><td>Destreza</td></tr>
<tr><td><strong>JPF</strong> — física</td><td>infecções, venenos, o que debilita o corpo</td><td>Constituição</td></tr>
<tr><td><strong>JPM</strong> — mental</td><td>resistir a poderes mentais</td><td>Intelecto</td></tr>
</tbody>
</table>

<p>Role <strong>1d20</strong>, aplique o modificador adequado, e o resultado
precisa <strong>igualar ou superar</strong> o valor da tabela da classe.</p>

<p>Situações que não caem em nenhum dos três ficam a critério do Mestre, que
define a rolagem e os modificadores.</p>

${naFicha("o OD2 tem <strong>três</strong> valores de JP (JPD, JPC, JPS), um por atributo. O Space Dragon tem um só. Preencha os três campos com o mesmo número da tabela da classe.")}
`,
    },
    {
      title: "Idiomas e Afiliação",
      content: `
<h2>Idiomas</h2>
<p>Todo personagem começa sabendo <strong>falar dois</strong>: o dialeto do seu
planeta de origem e o <strong>idioma espacial</strong>, comum à maior parte da
galáxia.</p>

<p>A <strong>Comunicação</strong> concede idiomas adicionais pela tabela
<strong>T1-6</strong>: nenhum até 11, um com 12–13, e assim por diante até nove
com 28–29.</p>

<p>⚠️ <strong>Comunicação até 6 é analfabeto.</strong> O personagem
<em>fala</em>, mas não lê nem escreve — nem no idioma nativo, nem no espacial.
Quem não é proficiente na escrita também tem um sotaque que o denuncia como
estrangeiro.</p>

<h2>Afiliação</h2>
<p>A afiliação é o modo de pensar e agir do personagem. Não limita o que ele
pode fazer: é um guia de como ele agiria. Duas pessoas de mesma afiliação podem
ter condutas opostas, dependendo do motivo de a seguirem.</p>

<p><strong>E ela decide a especialização.</strong> A partir do 5º nível, a classe
só abre a especialização correspondente à afiliação do personagem.</p>

<ul>
<li><strong>Lealdade</strong> — votos a uma crença, governo ou organização,
formais ou inerentes. Costuma vir com um código de conduta. Mas lealdade a algo
não significa que esse algo seja bom: o código tanto pode ser preservar a vida
quanto dominar o universo.</li>
<li><strong>Neutralidade</strong> — tanto a indiferença aos assuntos de facções
rivais quanto a recusa deliberada de tomar partido. O neutro busca o que mais o
beneficia enquanto contraparte neutra, e serve bem de mediador.</li>
<li><strong>Rebeldia</strong> — comportamento errante e imprevisível, ou oposição
declarada a alguma regra. O rebelde pode pensar só em si ou servir a uma causa
subversiva; em geral é impulsivo e indisciplinado.</li>
</ul>

${naFicha("o campo de <strong>alinhamento</strong> do OD2 é Ordeiro/Neutro/Caótico, que é outra coisa. Anote a afiliação ali se ajudar, mas ela não é alinhamento — e é ela, não o alinhamento, que abre a especialização.")}
`,
    },
  ],
};
