// O journal do Capítulo 9 — a regra dos poderes mentais.
//
// Os 112 poderes já são itens (poderes.mjs); o que faltava era a regra que os
// governa, das seções 9.1 a 9.6 e do quadro "Magias e poderes mentais". Ela
// não cabe em item nenhum, então mora aqui.
//
// ── O QUE A FICHA JÁ FAZ ────────────────────────────────────────────────────
//
// Boa parte desta regra está automatizada: realizar o poder, rolar o
// desconhecido, descontar a Grandeza e oferecer aprender (module/poder-mental.js);
// RM, anulação, choque mental e contra-ataque (module/anulacao.js). Cada página
// diz a regra do livro primeiro e, numa nota do módulo, como a ficha a aplica.
// Onde o módulo deixa algo para a mão (o dano mental no Intelecto, o efeito
// colateral, a concentração), a nota diz isso também.

const TIPOS = `
<h2>Mente e percepção</h2>
<p>Os mentálicos chamam seus poderes de ciência, mas ela está longe de ser
exata. Em geral os poderes manipulam a mente e a percepção que as pessoas têm do
ambiente: sentidos, memória, raciocínio, e até a personalidade e as funções
vitais de quem é afetado, pelos impulsos eletromagnéticos do cérebro.</p>

<h2>Quem resiste</h2>
<p>Humanos normalmente <strong>não têm</strong> resistência mental. Algumas
espécies humanoides têm padrões neurais parecidos, que dificultam o trabalho do
mentálico; espécies de mente mais simples não têm essa resistência. A regra
está em <em>Resistência mental (RM)</em>.</p>

<h2>O Espírito Galáctico</h2>
<p>Muitos poderes partem da teoria mentálica de que as mentes de todos os seres
vivos que já morreram se agrupam numa grande mente coletiva, o
<strong>Espírito Galáctico</strong>. Esses poderes resgatam a consciência de
mentes mortas, ou até a reencarnam num corpo mortal. O grande alvo de muitos
mentálicos é conectar-se ao Espírito Galáctico e atingir a sabedoria absoluta,
ou usar o próprio corpo para encarnar essa mente coletiva.</p>
`;

const GRANDEZA = `
<h2>Dez estágios</h2>
<p>A <strong>grandeza mental</strong> é a escala que diz a quais poderes cada
um tem acesso: dez estágios, de pouco acima da capacidade humana normal até
feitos que alguns têm por divinos.</p>

<h2>A grandeza é o preço</h2>
<p>Cada poder pertence a uma grandeza, que indica, aproximadamente, sua força —
e é também a <strong>porcentagem do alcance mental diário</strong> que o
mentálico desconta ao usá-lo. Um poder de 5ª grandeza custa
<strong>5%</strong>, <strong>mesmo que seja anulado ou não seja realizado com
sucesso</strong>.</p>

<p class='nota-casa'><em>Na aba de Poderes do Mentálico, o quadro de alcance
mostra o total do dia (classe + Intelecto), o gasto, o que resta e a Grandeza
limite. A grandeza de cada poder é o campo de círculo do item.</em></p>
`;

const USANDO = `
<h2>O que o mentálico sabe</h2>
<p>O mentálico pode executar qualquer poder dentro da sua grandeza limite, mas é
mais proficiente em uns que em outros. Começa o jogo conhecendo
<strong>2 poderes de 1ª grandeza</strong>, à escolha do jogador. Esses, e todos
os que aprender depois, ele realiza livremente, respeitando a grandeza máxima e
o alcance mental.</p>

<h2>Poder desconhecido</h2>
<p>Só se realiza com uma rolagem de porcentagem bem-sucedida, com o valor de
<strong>realizar e aprender poder mental</strong> do Intelecto (T1-4), feita
<strong>antes</strong> do poder.</p>
<ul>
<li><strong>Falha:</strong> não realiza, e mesmo assim desconta a grandeza do
alcance diário.</li>
<li><strong>Acima do dobro</strong> da chance: pode haver efeito colateral, a
critério do Mestre.</li>
<li><strong>Sucesso:</strong> realiza o poder e pode tentar memorizá-lo (veja
<em>Aprendendo poderes</em>).</li>
</ul>

<h2>Realizando</h2>
<p>Basta dizer a intenção ao Mestre e rolar, se for preciso. O Mestre pode pedir
detalhes: alvos, área, a intenção. O mentálico precisa estar
<strong>concentrado</strong> — se se mover ou fizer outra ação, o poder pode
falhar. Não há fala nem gesto.</p>

<p>Depois da ação, efetiva ou não, desconta-se a grandeza do alcance diário. O
mentálico <strong>nunca</strong> pode ultrapassar o alcance, sob risco de morte
se tentar. O alcance <strong>zera após 8 horas de descanso</strong>.</p>

<p class='nota-casa'><em>O botão de lançar da aba de Poderes realiza o poder por
esta regra, no lugar da magia do Old Dragon 2: confere a Grandeza limite e o
alcance (e recusa o que passaria do limite), rola o "realizar e aprender" se o
poder for desconhecido, desconta a Grandeza — também na falha — e, se um
desconhecido deu certo, oferece a rolagem de aprender. A caixa de "memorizar"
do sistema passou a significar <strong>conhecido</strong>: marque nela os dois
poderes iniciais. O link <strong>dia novo</strong> no quadro de alcance zera o
gasto depois do descanso. A concentração e o efeito colateral ficam com o
Mestre.</em></p>
`;

const APRENDENDO = `
<h2>Tentativa e erro</h2>
<p>Todo mentálico pode aprender um poder desconhecido. Primeiro, precisa
<strong>realizá-lo</strong> com a rolagem de porcentagem de
<em>Usando poderes</em>. Depois de realizado, faz uma <strong>segunda
rolagem</strong>, com a mesma chance, para memorizá-lo de vez: com sucesso, o
poder está aprendido e não pede mais rolagem.</p>

<ul>
<li>Se <strong>falhar a primeira</strong> rolagem (a de realizar), só pode
tentar aprender aquele poder depois de <strong>24 horas</strong> — mas pode
continuar tentando usá-lo.</li>
<li>Se essa rolagem passar do <strong>dobro</strong> da chance, só pode tentar
aprendê-lo, ou mesmo realizá-lo, depois de <strong>1d4 dias</strong>.</li>
</ul>

<p class='nota-casa'><em>A segunda rolagem é oferecida pelo próprio botão de
lançar, logo depois de um desconhecido realizado; com sucesso, o poder fica
marcado como conhecido. As esperas de 24 horas e de 1d4 dias não são
controladas pela ficha: ficam com a mesa.</em></p>
`;

const ANULACAO = `
<h2>Anular</h2>
<p>O mentálico que é <strong>alvo</strong> de um poder mental pode tentar anulá-lo
na hora. Gasta do próprio alcance diário uma porcentagem igual à
<strong>grandeza do poder</strong> usado pelo oponente e faz uma rolagem
resistida.</p>

<p>Pode gastar <strong>mais</strong> para ganhar bônus: <strong>+1 a cada 2%</strong>
a mais, cumulativo. Esse extra nunca pode passar da grandeza que já gastou para
anular.</p>

<h2>A rolagem</h2>
<p>Cada um rola <strong>1d6 + o próprio nível</strong>; o defensor soma o bônus
que pagou.</p>
<table>
<thead><tr><th>resultado</th><th>efeito</th></tr></thead>
<tbody>
<tr><td><strong>defensor maior</strong></td><td>o poder é anulado na hora</td></tr>
<tr><td><strong>atacante maior</strong></td><td>a anulação é ineficaz; o poder funciona normalmente</td></tr>
<tr><td><strong>empate</strong></td><td><strong>choque mental</strong>: 1d4 pontos de dano mental, JPM dos dois para não ficar atordoado por 6d10 segundos, e o poder original fracassa</td></tr>
</tbody>
</table>

<h2>Contra-ataque</h2>
<p>Se o defensor vencer com <strong>o dobro ou mais</strong> do resultado do
oponente, pode realizar na hora um novo poder contra o atacante. Esse poder pode
ser anulado normalmente pelo novo defensor — e é por isso que essas disputas
esgotam os mentálicos.</p>

<p class='nota-casa'><em><strong>Como a ficha faz.</strong> Realize o poder com
os tokens dos alvos marcados (tecla <strong>T</strong>). O cartão no chat traz um
botão <strong>Anular — Nome</strong> para cada alvo mentálico; sem alvo marcado,
aparece <strong>Anular este poder</strong>, que usa o token controlado ou o
personagem de quem clica. O dono do defensor clica e escolhe o gasto extra (+1 a
cada 2%, até a Grandeza); o módulo desconta o alcance, rola 1d6 + nível dos dois
e mostra o resultado.</em></p>

<p class='nota-casa'><em>No <strong>empate</strong>, o cartão rola 1d4 de dano
mental para <strong>cada um</strong> e a JPM dos dois; quem falha recebe os
6d10 segundos de atordoamento no chat. O dano mental é dreno de Intelecto e o
módulo <strong>não altera o atributo sozinho</strong>: ajuste a ficha à mão.
Vencendo pelo dobro, aparece <strong>Contra-atacar</strong>, que abre a lista de
poderes do defensor e realiza o escolhido contra o atacante — que, por sua vez,
recebe o próprio botão de anular.</em></p>
`;

const RM = `
<h2>Mentes parecidas demais</h2>
<p>Algumas criaturas resistem naturalmente aos poderes mentais, porque têm mente
parecida o bastante com a humana para causar interferência neural.</p>
<ul>
<li>Alienígenas com <strong>Intelecto 9 ou mais</strong> têm resistência
mental; com Intelecto menor, não têm.</li>
<li>Espécies com <strong>Intelecto 0</strong> são irracionais e, portanto,
<strong>imunes</strong> a poderes mentais.</li>
</ul>

<h2>A rolagem</h2>
<p>A RM é uma porcentagem. Cada vez que um mentálico usa um poder contra a
criatura, rola-se d%:</p>
<ul>
<li><strong>Igual ou acima</strong> da RM: o poder é efetivo.</li>
<li><strong>Abaixo</strong>: aquela criatura <strong>nunca mais</strong> poderá
ser afetada por aquele poder.</li>
</ul>
<p>O poder ineficaz é descontado do alcance mental normalmente.</p>

<p class='nota-casa'><em>Quando o poder é realizado com tokens marcados como alvo
(tecla <strong>T</strong>), o cartão rola a RM de cada criatura que tem o campo
<strong>RM</strong> preenchido na Ficha de Ameaça. Abaixo da RM, a criatura fica
imune àquele poder para sempre, e o módulo <strong>lembra</strong>: das próximas
vezes o cartão só avisa que ela é imune. A imunidade do Intelecto 0 não é
automática — é o Mestre quem a aplica.</em></p>
`;

const MAGIAS = `
<h2>Magias e poderes mentais</h2>
<p>Ao contrário dos efeitos pirotécnicos, que desafiam a física, dos magos da
fantasia medieval, os mentálicos lidam com mentes e com a percepção das pessoas.
Interpretar um mentálico é usar a criatividade para criar efeitos manipulando a
mente dos alvos.</p>

<p>Não se espera que o mentálico <strong>"colecione"</strong> todos os poderes,
como o mago anota magias no grimório. Aproveite os ganchos de história que os
poderes oferecem — trocar a personalidade de outros personagens, contatar uma
mente desencarnada. Como dá para tentar usar um poder sem dominá-lo, não se
preocupe se um poder aparecer uma única vez na campanha: ele já terá cumprido seu
papel.</p>

<p>Os 112 poderes, da 1ª à 10ª grandeza, estão no compêndio <strong>Poderes Mentais</strong>, prontos
para arrastar para a ficha.</p>
`;

export const poderesJournal = {
  title: "Space Dragon — Poderes Mentais",
  pages: [
    { title: "Tipos de poderes", content: TIPOS },
    { title: "Grandeza mental", content: GRANDEZA },
    { title: "Usando poderes", content: USANDO },
    { title: "Aprendendo poderes", content: APRENDENDO },
    { title: "Anulação e contra-ataque", content: ANULACAO },
    { title: "Resistência mental (RM)", content: RM },
    { title: "Magias e poderes mentais", content: MAGIAS },
  ],
};
