// O journal do Capítulo 8 e da T3-2.
//
// Os 80 aparatos e feitos viram itens; aqui fica a regra que os governa e a
// tabela de desativar robôs, que é do Capítulo 3 mas só faz sentido junto do
// disruptor.
//
// As seções 8.1 a 8.5 e 8.7 são regra solta, sem item que as carregue: por
// isso cada uma vira página (ou parte de página) aqui. A 8.7 estava colada, por
// erro de transcrição, no texto do Visor de realidade alternativa; saiu de lá
// e mora na página "Inventando novos aparatos e feitos".
//
// O livro chama a coluna da T1-5 de "aptidão tecnológica", mas a 8.4 fala em
// "afinidade tecnológica" e a especialização de inventor em "desconto
// tecnológico". É o mesmo número; as páginas usam o nome da tabela e avisam.

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

<h2>Feitos científicos</h2>
<p>Feitos são experiências e operações. Em geral levam <strong>mais tempo</strong>
que a construção de um aparato, a maioria dos resultados é
<strong>permanente</strong>, e muitos envolvem um <strong>paciente</strong>, que
recebe o resultado.</p>

<p>Salvo quando a descrição diz outra coisa, o acesso a recursos e o
procedimento são os mesmos de criar e consertar aparatos (veja
<em>Criando e consertando</em>). A diferença principal: muitos feitos
<strong>não podem ser interrompidos</strong> — o cientista se dedica a eles
durante todo o tempo necessário. Outros levam semanas ou meses e, por isso, já
têm margem natural para pausas.</p>

<h2>Nível tecnológico</h2>
<p>O <strong>NT</strong> mede o quanto o aparato é avançado. Aparatos de
<strong>1º NT</strong> são mundanos e relativamente simples de criar; os de
<strong>10º NT</strong> são tecnologia tão avançada que pessoas comuns duvidam
que existam, e poucos entendem como funcionam.</p>

<p>O NT limita o que o cientista consegue <strong>construir</strong> — não o
que consegue <strong>usar</strong>: não há limite de nível para usar.</p>

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
    {
      title: "Usando aparatos",
      content: `
<h2>Em geral, sem rolagem</h2>
<p>Nenhum aparato pede rolagem para ser usado, a menos que outra regra — uma
especialização de classe, por exemplo — diga o contrário. Muitos trazem regras
de uso próprias na descrição. Quando há rolagem, o sucesso indica uso correto e
sem problemas; a falha pode ter efeitos desastrosos.</p>

<h2>Identificar e operar</h2>
<ul>
<li><strong>Identificar</strong> para que serve um aparato é um teste de
<strong>Ciência</strong>.</li>
<li>A critério do Mestre, o <strong>cientista</strong> pode ter de passar num
teste de <strong>operar máquinas</strong> para usar um aparato de funcionamento
e finalidade desconhecidos, criado por outra pessoa, de procedência obscura,
danificado, ou muito acima do nível tecnológico dele.</li>
</ul>

<h2>Quem não tem proficiência</h2>
<p>Quando a única saída é um membro de outra classe usar um aparato que não
opera (pela categoria) ou que desconhece, rola-se um teste com a porcentagem de
<strong>aptidão tecnológica</strong> da Ciência (T1-5), se houver. Sucesso: usa
o aparato <strong>provisoriamente</strong>. Falha: um <strong>defeito da
T11-4</strong> (seção do Mestre, journal do Cap. 11).</p>

<p>Testes só devem ser pedidos se houver chance real de falha.</p>
`,
    },
    {
      title: "Criando e consertando",
      content: `
<h2>Criando</h2>
<p>O cientista cria qualquer aparato que seu nível tecnológico alcance, desde
que tenha os materiais ou componentes e instalações adequadas. Considera-se que
tem os materiais se pagar o <strong>custo</strong> da descrição, com
<strong>desconto</strong> de uma porcentagem igual à <strong>aptidão
tecnológica</strong> da Ciência (T1-5).</p>

<ul>
<li>O tempo para <strong>obter</strong> os materiais fica a critério do Mestre,
que pode até <strong>vetar</strong> a criação se as circunstâncias não
ajudarem — falta de componente ou de laboratório, por exemplo.</li>
<li>O <strong>tempo de criação</strong> está na descrição (de horas a semanas)
e pode ser <strong>dividido</strong> quantas vezes for preciso, contanto que o
cientista trabalhe no mesmo laboratório ou leve o projeto para outro.</li>
<li>Os créditos são <strong>pagos no início</strong> da criação. Também dá
para comprar os componentes de antemão e construir depois.</li>
<li>O cientista pode <strong>começar o jogo</strong> já com quaisquer aparatos
que seu nível tecnológico e sua renda inicial permitam.</li>
</ul>

<p class='nota-casa'><em>A 8.4 chama esse número de "afinidade tecnológica"; a
coluna da T1-5 se chama <strong>aptidão tecnológica</strong> e vai de −25% a
+45%. O livro não comenta o valor negativo: pela conta, "descontar" −10% é
pagar 10% a mais. O inventor é exceção — o desconto dele vira acréscimo (veja
a especialização e a página seguinte).</em></p>

<h2>Consertando</h2>
<p>Para reparar um aparato, o cientista paga <strong>25% do custo
total</strong> e leva <strong>até metade do tempo</strong> de construção
original.</p>

<p>O mesmo procedimento serve para <strong>adaptar</strong> um aparato feito por
outra pessoa ou de operação complicada, e para <strong>produzir mais
cargas</strong> de aparatos com número fixo de usos.</p>
`,
    },
    {
      title: "Inventando novos aparatos e feitos",
      content: `
<h2>Para o que a lista não cobre</h2>
<p>A regra se divide entre cientistas comuns e inventores.</p>

<h2>Cientistas comuns</h2>
<p>Quem não seguiu especialização, ou virou pesquisador ou niilógico, pode
alterar qualquer aparato ou feito ao qual tenha acesso pelo nível tecnológico
para uma finalidade diferente da original: uma mochila a jato vira propulsor
subaquático, um detector de mentiras reage a uma palavra. O
<strong>custo é o mesmo</strong> do original, e o <strong>tempo de criação
dobra</strong>.</p>

<h2>Inventores</h2>
<ul>
<li><strong>A partir do 10º nível:</strong> combina as características de
<strong>3 aparatos distintos</strong> num só, desde que estejam ao alcance do
seu nível tecnológico e que passe num teste simples de <strong>operar
máquinas</strong> — um membro biônico com cortador laser e visor de precisão
acoplados, por exemplo. O custo é a <strong>soma</strong> dos aparatos
combinados mais o prejuízo tecnológico do inventor; o tempo se calcula do mesmo
jeito.</li>
<li><strong>No 20º nível:</strong> cria aparatos e feitos novos livremente,
apresentando a proposta ao Mestre. O Mestre define o NT; o custo é
<strong>1d10 por NT × $10.000</strong>, e depois se aplica o prejuízo
tecnológico. O tempo de criação ou realização é o Mestre quem define.</li>
</ul>

<p class='nota-casa'><em>O "prejuízo tecnológico" vem da especialização: o
desconto da aptidão tecnológica do inventor passa a ser <strong>somado</strong>
ao custo de qualquer aparato ou feito, dobra no 10º nível, e no 20º faz tudo
custar o dobro. A 8.7 diz "soma dos aparatos combinados"; que o tempo também
seja a soma dos tempos é a leitura de "calculado da mesma forma".</em></p>
`,
    },
  ],
};
