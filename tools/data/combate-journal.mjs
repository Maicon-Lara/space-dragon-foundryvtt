// O journal do Capítulo 7.
//
// A ordem das páginas segue o livro: sequência de combate e declaração de turno
// (7.1–7.4), ordem de ação e surpresa (7.3, 7.5), ataques e as demais ações do
// turno (7.6–7.8), críticos, dano e, por último, os "outros perigos" da 7.9 —
// fogo, queda, vácuo, drenos. RD, "dano nunca negativo" e o mínimo de 1 no
// crítico já estão nas páginas de dano e de críticos e não se repetem lá.
//
// Na queda, o livro escreve "gravidades acima do normal que sejam superiores a
// 150% causam 1d8 de dano e gravidades acima causam 1d10", o que não fecha. A
// tabela lê 1d8 de 100% a 150% e 1d10 acima, e uma nota da casa avisa.

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
      title: "Sequência de combate",
      content: `
<h2>Turno e rodada</h2>
<p>O <strong>turno</strong> é a vez de cada personagem agir. Quando todos
agiram, passou uma <strong>rodada</strong> e o ciclo recomeça. Um turno dura
cerca de 6 segundos, mas isso varia demais para medir efeitos: a duração de
aparatos e poderes mentais conta pela <strong>duração da rodada</strong>, que
sai da ordem de ação (página seguinte).</p>

<h2>Os cinco passos</h2>
<p>O Mestre conduz o combate nesta ordem:</p>
<ol>
<li><strong>Jogada de surpresa</strong></li>
<li><strong>Declaração de turno</strong></li>
<li><strong>Ordem de ação</strong></li>
<li><strong>Resolução de turno</strong></li>
<li><strong>Retorno ao passo 2</strong></li>
</ol>

<h2>Declaração de turno</h2>
<p>Depois da surpresa, <strong>todos declaram</strong> o que vão fazer: os
jogadores pelos seus personagens, o Mestre por todo o resto. Vale qualquer coisa
que o Mestre ache plausível, dividida entre <strong>movimentação</strong> e
<strong>ação</strong>, em qualquer ordem. Só depois de declarar é que se
descobre quem age primeiro.</p>

<h3>Movimentação</h3>
<p>Qualquer locomoção sem veículo: andar, saltar, rolar, escalar, nadar,
deslizar. O personagem anda até o seu <strong>movimento final</strong>, já com
as penalidades de gravidade, terreno e carga do Capítulo 6. A movimentação pode
ser combinada com a ação, em qualquer ordem, ou com outra movimentação.
Movimentações pouco convencionais podem pedir um <strong>teste de
Destreza</strong>; falhar pode impedir a ação do turno, se ela ainda não foi
feita.</p>

<h3>Ação</h3>
<p>Tudo o que não é deslocamento: sacar uma arma, atirar, ativar um aparato,
usar um poder mental. <strong>Não se combinam duas ações no mesmo turno</strong>.
O Mestre decide se coisas simples, como gritar uma ordem ou largar uma arma
enquanto saca outra, são livres ou contam como ação.</p>

<h3>Movimentação dupla</h3>
<p>Abrindo mão da ação, o personagem se desloca até o <strong>dobro do
movimento</strong> no turno. O Mestre pode pedir testes se houver acrobacias ou
obstáculos no caminho.</p>

<p>A ordem de ação sai da <strong>ação</strong> do turno. Quem só se move, sem
ação, usa o mesmo valor da movimentação dupla: <strong>10 − modificador de
Destreza</strong>.</p>

<h2>Resolução de turno</h2>
<p>As ações declaradas se resolvem com rolagens, <strong>na ordem de
ação</strong>. Se algo que aconteceu antes tornar impossível o que um personagem
declarou, o Mestre decide o que acontece.</p>
`,
    },
    {
      title: "Ordem de ação",
      seedIndice: 0,
      content: `
<h2>Não é iniciativa</h2>
<p>⚠️ <strong>Esta é a maior diferença do Space Dragon para o Old Dragon 2 em
combate.</strong> Não se rola 1d20 nem se soma Destreza para ver quem vai
primeiro. O número sai da <strong>ação declarada</strong>:</p>

${tabela(["ação", "valor"], l72)}

<p><strong>Age primeiro o MENOR resultado.</strong> A faca age antes do rifle de
plasma, porque o dado dela é menor. <strong>Empate é simultâneo</strong>: os
efeitos se calculam ao mesmo tempo.</p>

<p><strong>A rodada dura o maior resultado × 2 segundos.</strong> Não é um tempo
fixo: uma rodada de escaramuça com facas é mais curta que uma de bombardeio. Um
efeito termina no fim da rodada em que a soma das durações das rodadas já
passadas iguala ou ultrapassa a duração dele.</p>

<p class='nota-casa'><em>O rastreador de combate do Foundry rola 1d20 e ordena do
maior para o menor — a fórmula errada e na ordem invertida. Use a macro
<strong>Ordem de Ação</strong>, no compêndio de Macros: ela pergunta o que cada
um vai fazer, rola o que precisa, ordena e diz quanto dura a rodada.</em></p>

<h2>Surpresa</h2>
<p>No início do combate — ou quando um evento inesperado interrompe o confronto
para todos —, <strong>cada personagem do grupo defensor</strong> faz a jogada de
surpresa. É uma <strong>JPR comum</strong>, com os ajustes da T7-1 a critério do
Mestre. O ajuste vale para o grupo todo, mas <strong>a JPR é individual</strong>.</p>

<p>Quem passa percebeu o início do combate. Quem falha está surpreso:
<strong>não age no primeiro turno</strong> e ainda leva <strong>−5 no CP</strong>
até o fim daquela rodada.</p>

${tabela(["situação", "modificador"], l71)}
`,
    },
    {
      title: "Atacando",
      seedIndice: 1,
      content: `
<h2>O ataque acerta com igual ou maior</h2>
<p>Role <strong>1d20</strong> e some o bônus de ataque. Se igualar ou superar o
<strong>CP</strong> do alvo, acertou.</p>

<ul>
<li><strong>À distância</strong> — o bônus vem da <strong>Destreza</strong>.
Com arma de fogo dá para atirar mesmo colado no alvo: o <strong>disparo à
queima-roupa</strong> (até 3 metros) tem <strong>+2 no ataque e no dano</strong>,
e contra oponente desarmado é acerto crítico.</li>
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

<p>Se o objeto arremessado <strong>não tem função ofensiva</strong>, conta-se
<strong>1d4</strong> como dado de dano para a ordem de ação.</p>

<p>Errando, a <strong>diferença</strong> entre o resultado e o CP é quantos
metros o objeto caiu longe do alvo: CP 18 e resultado 12 dão 6 metros. A direção
sai de 1d8.</p>

<h2>Usar aparato tecnológico</h2>
<p>Ativar um aparato que precise de ativação. Os aparatos ofensivos são tratados
como armas e seguem o <strong>ataque à distância</strong>. Desativar robôs com o
disruptor positrônico é o exemplo do livro.</p>
<ul>
<li>Ativar dá <strong>−4 no CP</strong> até o fim da rodada.</li>
<li>Atingido antes de agir, o personagem faz uma <strong>JPR</strong> para não
perder a ação.</li>
<li>A duração do efeito só começa a contar <strong>na rodada seguinte</strong>,
seja qual for a ordem de ação.</li>
</ul>

<h2>Usar poder mental</h2>
<p>Basta declarar o poder e escolher o alvo, se houver.</p>
<ul>
<li><strong>Não dá para se mover</strong> enquanto o poder é realizado, e o
mentálico fica com <strong>−4 no CP</strong>.</li>
<li>Atingido antes de agir, faz uma <strong>JPM</strong> para não perder a
ação.</li>
<li>A duração só começa a contar <strong>na rodada seguinte</strong>, seja qual
for a ordem de ação.</li>
</ul>

<p class='nota-casa'><em>A anulação e o contra-ataque mental — o alvo que resiste
e devolve o poder — estão no journal do Capítulo 9, Poderes Mentais.</em></p>

<h2>Outras ações</h2>
<p>Qualquer outra coisa: sacar ou recarregar uma arma, abrir uma porta. O Mestre
decide se dá para fazer e que regra aplicar. Na ordem de ação, vale
<strong>10 − modificador de Destreza</strong>.</p>

<h2>Modificadores</h2>
${l73}
`,
    },
    {
      title: "Críticos",
      seedIndice: 2,
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
      seedIndice: 3,
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

<p>Fogo, queda, vácuo, radiação e os drenos estão na página
<strong>Outros perigos</strong>.</p>

<p>A única forma de trazer um morto de volta é <strong>clonando</strong>, com o
feito científico apropriado. A Constituição do morto dá a chance de o
procedimento falhar. O clone é geneticamente idêntico, mas
<strong>não necessariamente tem a mesma personalidade</strong> — para isso é
preciso um poder mental que implante as memórias.</p>
`,
    },
    {
      title: "Outros perigos",
      content: `
<h2>Fogo, gelo e temperaturas extremas</h2>
<p>Dano térmico vem do contato com fogo, gelo ou da exposição a temperaturas
extremas. <strong>Trajes espaciais protegem</strong>; roupas comuns, não. São
três graus:</p>
<table><thead><tr><th>grau</th><th>exemplos</th><th>dano por rodada</th></tr></thead>
<tbody>
<tr><td><strong>1º</strong></td><td>Queimadura superficial: contato rápido com superfície incandescente, fogo ou algo muito frio; exposição prolongada a sol escaldante ou a frio sem traje.</td><td>1d4</td></tr>
<tr><td><strong>2º</strong></td><td>Fogueira, pequenas explosões, substâncias congelantes; exposição moderada a calor muito alto ou a frio muito abaixo de 0 °C sem proteção.</td><td>1d6</td></tr>
<tr><td><strong>3º</strong></td><td>Lava, grandes explosões, congelamento imediato; exposição a temperaturas extremas sem proteção.</td><td>1d10</td></tr>
</tbody></table>

<h2>Queda e contusões</h2>
<p>Cair de <strong>mais de 3 metros</strong> causa dano <strong>a cada 3 metros
de altura</strong>, e o dado depende da gravidade relativa:</p>
<table><thead><tr><th>gravidade</th><th>dano a cada 3 m</th></tr></thead>
<tbody>
<tr><td>menos de 50%</td><td>nenhum</td></tr>
<tr><td>de 50% até abaixo de 100%</td><td>1d4</td></tr>
<tr><td>100%</td><td>1d6</td></tr>
<tr><td>acima de 100%, até 150%</td><td>1d8</td></tr>
<tr><td>acima de 150%</td><td>1d10</td></tr>
</tbody></table>
<p>Cair em superfície macia ou líquida, ou amortecer de outro jeito, reduz o
dano no quanto o Mestre decidir. A mesma regra serve para o dano contundente de
ser atingido por objetos pesados ou de bater em obstáculos num voo
descontrolado.</p>

<p class='nota-casa'><em>O livro é ambíguo nas gravidades altas: diz que as
"superiores a 150% causam 1d8 de dano e gravidades acima causam 1d10". A tabela
é a leitura deste módulo — 1d8 até 150% e 1d10 acima disso.</em></p>

<h2>Afogamento e sufocamento</h2>
<p>Sem oxigênio, qualquer um prende a respiração por <strong>Constituição × 10
segundos</strong> — menos, a critério do Mestre, se estiver correndo ou nadando.
Acabado o tempo, faz uma <strong>JPF</strong> para se manter consciente. Falhar
leva o personagem <strong>direto a −1 PV</strong>, a caminho da morte, e ele
<strong>falha automaticamente</strong> em todas as JPF que precisaria fazer.
Trajes espaciais ou aquáticos e cilindros de oxigênio evitam isso.</p>

<h2>Corrosão ácida</h2>
<p>Exposto a ácido sem proteção, o personagem sofre <strong>dano
regressivo</strong>. No contato o ácido causa automaticamente
<strong>1d4, 1d6 ou 1d8</strong>, conforme a força corrosiva. A cada rodada
seguinte causa o mesmo dado com <strong>−1 cumulativo</strong>: um ácido fraco
faz 1d4−1 na segunda rodada, 1d4−2 na terceira, e assim por diante. Para quando
uma rolagem der 0 ou menos.</p>
<p>Um novo ácido, enquanto outro age, causa dano normalmente, mas a regressão
anterior continua — a menos que o novo seja mais forte. Há ácidos acima de 1d8,
potencialmente letais, e o Mestre pode decidir que o ácido avaria as vestes, o
que é perigoso em trajes sob pressão.</p>

<h2>Veneno e infecções</h2>
<p>Pegam-se por ingestão, inoculação ou simples contato. Os efeitos variam, e
podem ou não ser letais; em geral uma <strong>JPF</strong> anula ou ameniza.</p>

<h2>Dano massivo</h2>
<p>Quem sofre, <strong>de uma só vez</strong> (um único ataque, uma queda), dano
igual ou maior que <strong>35 + Constituição</strong> faz uma
<strong>JPF</strong> para não morrer na hora. Passando, vai
<strong>imediatamente a 0 PV</strong> — mesmo que o dano não bastasse para
isso. Algumas especializações forçam essa JPF seja qual for o dano.</p>

<h2>Contaminação radioativa</h2>
<p>Quem é exposto a radiação significativa faz uma <strong>JPF a cada mês</strong>
seguinte. Falha: perde <strong>1d2 de Constituição para sempre</strong>.
<strong>Dois sucessos seguidos</strong> o livram da radiação. Até lá,
<strong>cada JPF</strong> feita contra a radiação — passando ou não — reduz em
<strong>5%</strong> a chance de clonagem dele.</p>

<h2>Descompressão</h2>
<p>A descompressão brusca de uma nave ou de um traje pressurizado pede uma
<strong>JPF</strong> para não desmaiar por <strong>1d10 minutos</strong>. Mesmo
um sucesso por pouca margem pode dar <strong>−2 em todos os testes por 1d4
horas</strong>.</p>

<h2>Vácuo espacial</h2>
<p>Exposto ao vácuo sem proteção, o personagem <strong>perde a consciência na
hora</strong> e está <strong>morto em Constituição × 5 segundos</strong>. Mesmo
socorrido e tirado do vácuo, faz uma <strong>JPF</strong> para não morrer de
falha cardíaca, e sofre os efeitos da descompressão por <strong>1d6
dias</strong>.</p>

<h2>Dreno de vida</h2>
<p>Alguns poderes mentais e outros perigos drenam um <strong>dado de vida</strong>.
O jogador rola de novo o DV da classe e <strong>tira o resultado dos PV
totais</strong>, junto com os bônus de Constituição ou mutação. Rola-se mesmo
acima do 9º nível, quando os PV por nível já são fixos.</p>
<ul>
<li><strong>Não se perde nível</strong> nem se regride na classe.</li>
<li>DV drenados só voltam com <strong>feitos científicos e poderes
mentais</strong>.</li>
<li>Com os DV reduzidos a <strong>0, morre na hora</strong>.</li>
<li>Quem tem DV drenado faz uma JPF como a da descompressão; a falha não
desacorda, mas dá <strong>−2 em todos os testes por 1d4 horas</strong>.</li>
</ul>

<h2>Dreno de atributo</h2>
<p>Criaturas, aparatos e poderes mentais podem reduzir atributos; recalculam-se
as estatísticas do personagem. Os pontos voltam sozinhos:</p>
<table><thead><tr><th>atributo</th><th>recupera</th></tr></thead>
<tbody>
<tr><td>Força, Destreza, Constituição</td><td>1 ponto a cada 2 dias</td></tr>
<tr><td>Intelecto, Ciência</td><td>1 ponto por semana</td></tr>
<tr><td>Comunicação</td><td>1 ponto por mês</td></tr>
</tbody></table>

<h2>Dano mental</h2>
<p>Alguns poderes mentais ferem o alvo ou o próprio usuário. Dano mental é
<strong>dreno de Intelecto</strong> e segue as mesmas regras. O mentálico que o
sofre <strong>perde na hora qualquer bônus de alcance mental</strong>, mesmo que
o Intelecto não caia a 11 ou menos.</p>

<h2>Morte inevitável</h2>
<p>Cair num poço de lava, levar um raio desintegrador, estar numa nave que
explode: quando não há como sobreviver, <strong>não há jogada de
proteção</strong>.</p>
`,
    },
  ],
};
