// O journal do Capítulo 11.

import {
  CLICHES, INTERESSES, RELIQUIAS, DEFEITOS, SUPERFICIES, ATMOSFERAS,
  FAUNA_FLORA_SOCIEDADE, DRAGOES_T11_10,
} from "./mestre.mjs";
import { DRAGOES } from "./bestiario.mjs";

const tab = (cab, linhas) =>
  `<table><thead><tr>${cab.map((c) => `<th>${c}</th>`).join("")}</tr></thead>` +
  `<tbody>${linhas}</tbody></table>`;

const numerada = (lista) =>
  tab(["d" + lista.length, "resultado"],
    lista.map((x, i) => `<tr><td><strong>${i + 1}</strong></td><td>${x}</td></tr>`).join(""));

// A T11-4 tem três linhas que mudam com o tipo da relíquia; as outras sete são
// uma frase só. Por isso a coluna do defeito aceita as duas formas.
const defeitos = tab(["1d10", "defeito"], DEFEITOS.map((l) => {
  const corpo = l.defeito
    ? l.defeito
    : `<strong>Ofensivas e armas:</strong> ${l.porTipo.ofensivo}<br>` +
      `<strong>Defensivas e vestes:</strong> ${l.porTipo.defensivo}<br>` +
      `<strong>Utilitárias, itens mundanos, veículos e naves:</strong> ${l.porTipo.utilitario}`;
  return `<tr><td><strong>${l.d}</strong></td><td>${corpo}</td></tr>`;
}).join(""));

const reliquias = Object.entries(RELIQUIAS).map(([titulo, linhas]) =>
  `<h3>${titulo}</h3>` +
  tab(["rolagem", "resultado"], linhas.map((l) => `<tr><td>${l.faixa}</td><td>${l.r}</td></tr>`).join(""))
).join("\n");

const superficies = tab(
  ["1d10", "superfície", "fauna", "flora", "temperatura"],
  SUPERFICIES.map((s) =>
    `<tr><td><strong>${s.d}</strong></td><td><strong>${s.superficie}</strong></td>` +
    `<td>${s.fauna}</td><td>${s.flora}</td><td>${s.temp}</td></tr>`).join("")
);

const atmosferas = tab(
  ["1d10", "atmosfera", "respirável", "efeito colateral"],
  ATMOSFERAS.map((a) =>
    `<tr><td><strong>${a.d}</strong></td><td><strong>${a.atmosfera}</strong></td>` +
    `<td>${a.respiravel ? "sim" : "<strong>não</strong>"}</td><td>${a.efeito}</td></tr>`).join("")
);

// O livro imprime a T11-7, a T11-8 e a T11-9 lado a lado; aqui cada uma ganha
// a sua tabela, para o código de cada uma aparecer.
const coluna1d8 = (campo, rotulo) => tab(
  ["1d8", rotulo],
  FAUNA_FLORA_SOCIEDADE.map((f) =>
    `<tr><td><strong>${f.d}</strong></td><td>${f[campo]}</td></tr>`).join("")
);

const t1110 = tab(
  ["", ...DRAGOES_T11_10.colunas],
  DRAGOES_T11_10.linhas.map((l) =>
    `<tr><td><strong>${l.rotulo}</strong></td>${l.v.map((x) => `<td>${x}</td>`).join("")}</tr>`).join("")
);

const listaDragoes = DRAGOES.map((d) =>
  `<h3>${d.nome}${d.cientifico ? ` <em>${d.cientifico}</em>` : ""}</h3>` +
  `<p><em>${d.tipo}</em></p>` +
  (d.tamanho_dragao ? `<p><strong>Tamanhos:</strong> ${d.tamanho_dragao}</p>` : "") +
  (d.habitat ? `<p><strong>Habitat:</strong> ${d.habitat}</p>` : "") +
  (d.grandeza ? `<p><strong>Grandeza mental:</strong> ${d.grandeza}</p>` : "") +
  (d.texto ? `<p>${d.texto}</p>` : "")
).join("\n");

export const mestreJournal = {
  title: "Space Dragon — Seção do Mestre",
  pages: [
    {
      title: "Clichês e ganchos",
      content: `
<h2>O gênero é o pulp</h2>
<p>A ficção científica que o Space Dragon emula é a das revistas e quadrinhos da
primeira metade do século 20, e a dos desenhos animados repetidos à exaustão na
infância.</p>

<p>O livro faz questão de dizer que a mesa <strong>não precisa ficar presa
nisso</strong>: cyberpunk existencialista, monstro gigante japonês, ópera
espacial cômica, faroeste no espaço ou monges com espada laser cabem todos, com
pouco ou nenhum ajuste de regra.</p>

<h2>Liberdade criativa</h2>
<p>Uma campanha espacial se apoia na especulação, assim como um jogo medieval se
apoia no imaginário popular sobre uma época passada. Não é preciso ser biólogo
para criar uma espécie alienígena, nem astrofísico para dizer que o tempo se
distorce perto de um buraco negro: o charme do pulp está nesse embasamento
superficial na ciência, que o autor chama de <strong>superficiência</strong>.</p>

<p>A liberdade de criar é do Mestre, mas os jogadores também devem improvisar.
Só atirar com a pistola laser cansa, e uma viagem espacial pode ser semanas de
tédio. Se um personagem quer derrubar uma pedra sobre os oponentes com um tiro,
<strong>deixe</strong>; se um jogador propõe visitar o planeta natal do personagem,
que fica no caminho, <strong>encoraje</strong>. O livro não tem regra para toda
situação nem ensina a criar uma boa história: isso vem da imaginação do Mestre.</p>

<p>O jogo não pode virar um fardo. Faça os jogadores se interessarem pela
história e ficarem ansiosos pela próxima sessão: termine as sessões num momento
de tensão ou de reviravolta, crie complicações, traga personagens antigos de
volta. E não tenha medo de abusar dos clichês — eles existem porque funcionam.
Os da T11-1 servem de ganchos de aventura; não são os únicos, e uma história pode
ter vários ao mesmo tempo.</p>

<h2>T11-1: Clichês de ficção científica pulp</h2>
${numerada(CLICHES)}

<h2>T11-2: Interesses de explorações</h2>
<p>Créditos não ficam jogados por aí. A riqueza vem de <strong>negociar o que se
traz</strong> de uma expedição: acadêmicos pagam por escrituras de planetas
abandonados, cientistas por um espécime vivo de planta carnívora, colecionadores
por arma arcaica.</p>

<p>O quanto vale depende da relevância do achado e da negociação na mesa.</p>

${numerada(INTERESSES)}
`,
    },
    {
      title: "Evoluindo personagens",
      content: `
<h2>Experiência</h2>
<p>Os personagens costumam começar no 1º nível, como aspirantes a exploradores
espaciais, e sobem de nível acumulando pontos de experiência (XP). O novo nível
chega <strong>automaticamente</strong> quando o XP necessário é atingido.</p>

<p>O XP vem de dois desempenhos: o <strong>combativo</strong>, que conta só os
inimigos mortos ou derrotados, e o <strong>interpretativo</strong>, mais
subjetivo, que avalia o quanto o jogador decidiu as ações do personagem de acordo
com a personalidade, a história pessoal, a espécie e o alinhamento dele.</p>

<h2>XP de combate</h2>
<p>Cada alienígena do bestiário traz o XP que concede ao ser derrotado. Ao fim
do combate, somam-se os valores de todos os inimigos derrotados, e esse total é o
que <strong>cada personagem</strong> recebe, individualmente — não se divide pelo
grupo.</p>

<p>Se o inimigo derrotado for um humano com níveis de classe, ele vale
<strong>10% do XP necessário para atingir o nível em que está</strong>, na tabela
da classe dele, com <strong>mínimo de 100 XP</strong>.</p>

<p class='nota-casa'><em>Na ficha de personagem, o Mestre vê o prêmio de um
vilão com classe já calculado (10% do XP do nível, mínimo 100), ao lado do
XP.</em></p>

<h2>XP de interpretação (opcional)</h2>
<p>O livro propõe um sistema de premiação por interpretação e conduta, que o
Mestre adota se quiser:</p>
<ul>
<li>Cada jogador começa a sessão com <strong>100 pontos</strong>.</li>
<li>Boa interpretação, bom comportamento à mesa e boas ideias dão pontos;
atitude antijogo, falta de interpretação e má conduta tiram.</li>
<li>Os pontos ficam entre <strong>0 e 200</strong>.</li>
<li>Ao fim da sessão, o XP de interpretação é o <strong>nível do personagem ×
os pontos do jogador</strong>.</li>
</ul>

<h2>Experiência por exploração</h2>
<p>Uma campanha pode girar mais em torno de fazer contato com espécies
desconhecidas do que de atirar nelas. Nesse caso, o Mestre pode conceder o XP de
um alienígena na <strong>primeira vez</strong> que a espécie aparece na campanha,
premiando o grupo por ir aonde poucos foram.</p>
`,
    },
    {
      title: "Relíquias tecnológicas",
      seedIndice: 1,
      content: `
<h2>O que é uma relíquia</h2>
<p>Relíquia tecnológica é qualquer aparato antigo ou de fabricação alienígena
achado numa exploração: com inimigos, em estações abandonadas, em naves caídas ou
em qualquer lugar desabitado há muito tempo. O nome vem do valor comercial, nas
mãos certas, e das capacidades quase ilimitadas de uma época em que a ciência era
experimental e arriscada.</p>

<p>Qualquer arma, veste ou aparato dos capítulos 5 e 8 pode aparecer como
relíquia, assim como combinações de dois ou mais aparatos e relíquias inéditas;
veículos e naves saem do capítulo 10. Algumas estão deterioradas e inoperáveis;
outras funcionam de primeira ou depois de reparos feitos por um cientista. As
regras de uso e de restrição de classe são as mesmas dos itens comuns.</p>

<h2>Sete rolagens montam uma relíquia</h2>
<p>A T11-3 não é uma tabela: são sete, cada uma com o seu dado. Role todas e
depois escolha, nos capítulos 5, 8 ou 10, o item que se encaixa no resultado.</p>

${reliquias}

<h2>Instabilidade</h2>
<p>Toda relíquia tem uma chance de mau funcionamento, de <strong>10% a
90%</strong>, dada pela instabilidade. Cada vez que ela é ativada, faz-se uma
<strong>rolagem percentual</strong>: se o resultado ficar abaixo da porcentagem,
role 1d10 na T11-4 para o defeito, na linha do tipo da relíquia (ofensiva,
defensiva ou utilitária).</p>

<p>⚠️ Um 10 na instabilidade significa que um defeito ocorre na primeira
utilização e a relíquia fica inutilizada — o achado vira uma cena, não um
item.</p>

<p>O livro recomenda <strong>manter a instabilidade em segredo</strong> dos
jogadores. Um cientista pode estimar um valor aproximado com um teste
bem-sucedido de <strong>Ciência</strong>.</p>

<h2>T11-4: Defeitos de relíquias</h2>
<p>Três linhas (2, 4 e 6) mudam conforme o que a relíquia é: ofensivas e
armas; defensivas e vestes; ou utilitárias, itens mundanos, veículos e naves. No
2, por exemplo, a arma volta o efeito contra quem usa, a veste inverte o efeito e
a utilitária passa a pedir um teste de operar máquinas a cada turno.</p>
${defeitos}

<p class='nota-casa'><em>A macro <strong>T11-3: Relíquia Tecnológica</strong>
rola as sete tabelas de uma vez e sugere um aparato do compêndio, e a
<strong>T11-4</strong> rola o defeito. Na Ficha de Ameaça, o botão ao lado das
Relíquias gera o que aquele alienígena carrega, pelas letras O, D e U do
bloco.</em></p>
`,
    },
    {
      title: "Gerando planetas",
      seedIndice: 2,
      content: `
<p>Superfície, atmosfera, fauna, flora, sociedade, gravidade e nível
tecnológico: cada um tem a sua rolagem.</p>

<h2>Superfície</h2>
<p>A superfície é o terreno da exploração, e ela puxa o clima e a chance de o
planeta ser habitado. A T11-5 traz, para cada uma, a fauna e a flora mais comuns,
que também podem ser roladas à parte (T11-7 e T11-8). Um planeta pode ter
<strong>vários biomas</strong>: use mais de uma superfície para descrevê-lo.</p>

<h2>T11-5: Superfícies planetárias</h2>
${superficies}

<h2>T11-6: Atmosfera</h2>
<p>A atmosfera diz se o ar é respirável ou se são precisos traje pressurizado e
cilindro de oxigênio, e lista o efeito de ficar exposto a ela sem o traje
adequado. A coluna que decide a sessão é <strong>respirável</strong>: numa
atmosfera não respirável, sem traje espacial não há exploração.</p>

${atmosferas}

<p class='nota-casa'><em>O texto do livro manda rolar 1d6 na T11-6, mas a
tabela tem dez linhas, numeradas para 1d10. Aqui vale a tabela: 1d10.</em></p>

<h2>T11-7: Fauna predominante</h2>
<p>Um planeta pode ter muita fauna, mas uma expedição dificilmente encontra
todas as formas de vida. Role 1d8 para o tipo predominante de vida animal,
independentemente da superfície. Cada resultado é uma classe de forma de vida
alienígena, o que ajuda a escolher os inimigos da exploração.</p>

${coluna1d8("fauna", "fauna predominante")}

<h2>T11-8: Flora predominante</h2>
<p>A flora é mais pano de fundo que a fauna, mas pode pesar numa expedição. Use
a da superfície ou role 1d8 aqui.</p>

${coluna1d8("flora", "flora predominante")}

<h2>T11-9: Sociedade</h2>
<p>Só vale para planetas com vida inteligente, e diz como ela se organiza. Os
termos são gerais e pedem um pouco de ponderação: uma monarquia pode ter uma
linhagem de reis hereditários ou monarcas eleitos por um conselho de nobres. Esses
detalhes se decidem conforme a história.</p>

${coluna1d8("social", "organização social")}

<h2>Gravidade</h2>
<p>A gravidade pesa no movimento dos personagens, como o terreno e a carga. Nos
planetas habitados ela costuma ficar entre <strong>50% e 150%</strong>; nos
desabitados podem aparecer valores mais extremos.</p>

<p>Para uma gravidade na faixa habitável, role <strong>1d100 e some à base de
50%</strong>, arredondando para a dezena mais próxima. Gravidades extremas devem
ser estudadas com cuidado, porque outros fatores podem tornar o movimento
impossível.</p>

<h2>Nível tecnológico</h2>
<p>Em geral só se aplica a planetas habitados por vida inteligente: é até onde
chegou a tecnologia dos nativos, <strong>na mesma escala de NT da classe
cientista</strong>. Ajuda a decidir se os componentes e materiais de um aparato
ou de um feito científico podem ser conseguidos ali. Para sortear, role
<strong>1d10</strong>.</p>

<p>Ter tecnologia avançada não quer dizer que toda a sociedade tem acesso a ela,
nem que a domina por completo.</p>

<h2>Nomeando planetas</h2>
<p>Com muitos planetas explorados, vale catalogá-los. A dica do livro é usar os
resultados das tabelas T11-5 a T11-9 como parte do nome, para lembrar das
características, e acrescentar uma sigla que lembre o ponto mais marcante do
lugar.</p>

<p>Exemplo do livro: um planeta habitado por <strong>homens-lagarto</strong>, de
superfície pantanosa, atmosfera rarefeita, fauna predominante de répteis
aquáticos, flora de gramíneas e sem sociedade organizada pode se chamar
<strong>HL-53418</strong>: HL de homens-lagarto, e os dígitos são os resultados
da T11-5 (5, pântanos), T11-6 (3, rarefeita), T11-7 (4, aquáticos), T11-8 (1,
gramíneas) e T11-9 (8, sem organização formal).</p>
`,
    },
    {
      title: "Como ler o bloco de uma criatura",
      content: `
<h2>Alienígenas e outros inimigos</h2>
<p>Os inimigos mais comuns da galáxia são alienígenas — de criaturas rastejantes
sem inteligência a humanoides com mente e tecnologia desenvolvidas —, mas há
outros perigos. Todos os do bestiário seguem o mesmo modelo, explicado abaixo.
Antagonistas humanos usam as regras de criação de personagens (veja também
<strong>Classes como inimigos</strong>, no fim desta página).</p>

<h2>Introdução</h2>
<p>Nome popular, nome científico, morfologia, tamanho, afiliação (se houver) e
habitat. O tamanho segue uma escala comparada ao ser humano, que <strong>não é a
mesma</strong> das espaçonaves e outras estruturas:</p>
${tab(["tamanho", "altura"], [
  ["Pequeno", "até 1 m"], ["Médio", "até 2 m"], ["Grande", "até 4 m"],
  ["Imenso", "até 6 m"], ["Colossal", "mais de 6 m"],
].map(([t, a]) => `<tr><td><strong>${t}</strong></td><td>${a}</td></tr>`).join(""))}

<h2>Encontros</h2>
<p>Quantos indivíduos costumam aparecer juntos — o que diz como a espécie se
socializa: se vive em bandos, se tem covil ou se é errante.</p>

<h2>Prêmios</h2>
<p>Que relíquias tecnológicas a criatura pode carregar — <strong>O</strong>
(ofensivas), <strong>D</strong> (defensivas) e <strong>U</strong> (utilitárias) —
e o XP por derrotá-la. Algumas não carregam relíquia nenhuma e dão só o XP.</p>

<h2>Movimento</h2>
<p>Funciona como o dos personagens, com uma diferença: uma criatura
<strong>nativa</strong> de um planeta ignora as penalidades de gravidade dele, e
pode ignorar também as de terreno quando está dentro do seu habitat.</p>

<h2>Moral</h2>
<p>A disposição de continuar lutando numa situação desfavorável, de 0% a 100%.
Quando <strong>50% ou mais</strong> dos alienígenas de uma espécie são derrotados
num combate, todos os restantes daquela espécie fazem uma <strong>rolagem
percentual contra a moral</strong>. Resultado acima da moral é falha: a criatura
se rende ou tenta fugir. Moral 0% sempre foge; moral 100% nunca desiste.</p>

<h2>Atributos</h2>
<p>Os mesmos dos personagens: FOR, DES, CON, INT, CIE e COM. Alguns podem ser
<strong>zero</strong>:</p>
<ul>
<li><strong>INT 0</strong>: totalmente irracional — não pode ser alvo de poderes
mentais.</li>
<li><strong>CIE 0</strong>: totalmente primitivo.</li>
<li><strong>COM 0</strong>: incapaz de se comunicar de qualquer maneira.</li>
</ul>
<p>Atributo físico zerado é mais raro, salvo em formas de vida simples, como
musgos, plantas e fungos.</p>

<h2>Coeficiente de proteção (CP)</h2>
<p>A dificuldade de acertar a criatura. Parte dele pode vir de vestes e aparatos
defensivos, se a espécie for inteligente, ou de proteção natural. Esses bônus
aparecem separados, mas <strong>já estão somados</strong> ao CP.</p>

<h2>Jogada de proteção (JP)</h2>
<p>Um valor só, que já vale para JPF, JPR e JPM: não se aplica modificador
nenhum ao dado.</p>

<h2>Dados de vida (DV)</h2>
<p>O DV de alienígena é <strong>sempre d8</strong>. Role a quantidade indicada e
some o modificador ao total para os pontos de vida. Se preferir não rolar, use o
valor médio e o total de PV que aparecem ao lado, entre parênteses.</p>

<h2>Resistência mental (RM)</h2>
<p>A resistência mental inerente à criatura, em porcentagem, quando ela
tem uma.</p>

<h2>Redução de dano (RD)</h2>
<p>Escrita como <strong>x/tipo</strong>: a criatura absorve x pontos de qualquer
dano que sofrer, <strong>exceto</strong> do tipo listado. Uma criatura com RD
4/fogo reduz automaticamente 4 pontos de dano de qualquer fonte, menos de fogo,
ao qual é vulnerável.</p>

<h2>Ataques</h2>
<p>Quantos e quais ataques a criatura faz no turno, e o dano de cada um. Cada
linha é uma opção <strong>diferente</strong>, e as linhas não se intercalam. O
<strong>dado de dano</strong> do ataque, sem o modificador, define a ordem de
ação da criatura no combate.</p>

<p>Exemplo do livro: com "2 mordidas +4 (1d6+2)" e "1 garra +5 (1d4+3)", o
alienígena escolhe, no turno, entre 2 mordidas (bônus +4, dano 1d6+2) ou 1 garra
(bônus +5, dano 1d4+3).</p>

<h2>Descrição</h2>
<p>Poderes inerentes à espécie e detalhes de aparência e comportamento.</p>

<p class='nota-casa'><em>A Ficha de Ameaça do módulo tem um campo para cada
item do bloco. Ela rola os PV pelo DV (d8 mais o modificador) e, quando metade
de um grupo cai no combate, o chat pede a rolagem de Moral dos que restam. A RM
é rolada automaticamente quando um mentálico realiza um poder contra a criatura
(os detalhes estão no journal do Capítulo 9).</em></p>

<h2>Classes como inimigos</h2>
<p>É provável que o grupo enfrente vilões humanos. O bestiário traz fichas de 1º
e 5º níveis das quatro classes: cientista, cosmonauta, gatuno e mentálico. Para
um inimigo de outro nível, <strong>ajuste os DV e as habilidades de
classe</strong>.</p>

<p>O XP de um desses inimigos é <strong>10% do XP total do nível dele</strong> na
tabela da classe, com <strong>mínimo de 100 XP</strong>. Todas as fichas
consideram o personagem um <em>Homo sapiens</em>: ajuste as características da
espécie se o inimigo for <em>Homo machina</em> ou <em>Homo novus</em>.</p>
`,
    },
    {
      title: "Dragões",
      seedIndice: 3,
      content: `
<h2>Nove dragões, uma tabela</h2>
<p>Os dragões do Space Dragon <strong>não têm bloco de atributos próprio</strong>.
Todos usam a T11-10, e o que muda de um para o outro é o <strong>tamanho</strong>
em que aparecem, o habitat, a grandeza mental e o ataque especial.</p>

<p>Por isso eles não estão no compêndio de Bestiário: não há ator a montar sem
antes escolher a idade.</p>

<h2>T11-10: Características de Dragões</h2>
${t1110}

<h2>Os nove</h2>
${listaDragoes}
`,
    },
  ],
};
