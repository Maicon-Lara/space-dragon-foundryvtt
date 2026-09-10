// As 13 especializações do Capítulo 3, transcritas do LIVRO BÁSICO.
//
// ── DE ONDE ESTE TEXTO VEIO, E DE ONDE NÃO VEIO ─────────────────────────────
//
// Do *Space Dragon — Livro Básico Aprimorado*, páginas 37 a 52. Uma versão
// anterior deste arquivo trazia o texto do *guia de conversão para Old
// Dragon 2*, que é outro documento e diz outra coisa: onde o livro escreve
// "localizar e sabotar máquinas", o guia escreve "sabotagem"; onde o livro diz
// "crédito tecnológico", o guia diz "desconto tecnológico"; e o guia inventa um
// modificador de "aptidão tecnológica" que a T1-5 não tem. As palavras
// "cosmonauta", "furtividade" e "aptidão tecnológica" não aparecem uma única
// vez no livro básico.
//
// ── NÃO SÃO TRÊS POR CLASSE ─────────────────────────────────────────────────
//
// O Gatuno tem QUATRO: "um de afiliação neutra pode tornar-se um sabotador ou
// assassino". As outras três classes têm uma por Afiliação.
//
// ── COMO ELAS FUNCIONAM, E POR QUE NÃO SÃO CLASSES IRMÃS ────────────────────
//
// A especialização NÃO substitui a classe. Ela é escolhida no 5º nível e
// CONGELA uma coluna da progressão da classe-base ali, redirecionando aquele
// avanço para outra coisa. Quem não escolher nenhuma segue a tabela inteira até
// o 20º.
//
// O Emissário é o exemplo limpo: no 5º ele para de progredir em dano crítico,
// mas passa a usar aquela mesma progressão para outro fim. Cada degrau troca
// uma coisa por outra.
//
// ── O DESENCONTRO COM O OD2 ─────────────────────────────────────────────────
//
// O `class_ability` do OD2 tem degraus fixos em 3, 6 e 10. O Space Dragon usa
// 5, 10 e 20. Só o 10 coincide. Então `level: 5` marca onde começa, `level10`
// recebe o segundo degrau, e o terceiro vai na descrição, marcado. Fingir que
// cabe onde não cabe seria pior.

export const especializacoes = [
  {
    nome: "Pesquisador",
    classe: "Cientista",
    afiliacao: "leal",
    n5: "o cientista que almeja tornar-se um pesquisador começa a se dedicar academicamente a partir do 5° nível, parando de progredir em sua habilidade de operar máquinas, mas aumentando seu crédito tecnológico em 1% e mantendo esse progresso a cada novo nível. No entanto, abdica do uso de qualquer arma a não ser seus próprios artefatos.",
    n10: "Ao atingir o 10° nível ele pode usar a porcentagem de operar máquinas de seu nível como probabilidade de possuir alguma informação ou artefato relevante a qualquer questão com que se deparar, mas qualquer aparato tecnológico que criar ou feito que realizar é considerado dois níveis tecnológicos acima do listado nas regras, o que permite que pesquisadores construam aparatos ou realizem feitos apenas até o 8° nível tecnológico, que corresponde ao 10° devido a essa penalidade.",
    n20: "No 20° nível seu crédito tecnológico é considerado como sendo 100%, mas seu código de ética o proíbe de causar qualquer tipo de dano a seres vivos em combate, e o impele a pregar que ninguém deve fazê-lo.",
  },
  {
    nome: "Inventor",
    classe: "Cientista",
    afiliacao: "neutro",
    n5: "o personagem que seguir a carreira de inventor tem o acesso ao 4° nível tecnológico no 5° nível na classe, e progride a cada dois níveis subsequentes, atingindo o 10° nível tecnológico no 17° nível de cientista. Seu crédito tecnológico, entretanto, passa a ser adicionado ao custo de qualquer aparato ou feito científico.",
    n10: "No 10° nível esse prejuízo tecnológico dobra, mas o inventor é capaz de combinar até três artefatos diferentes em um, com uma rolagem bem-sucedida de operar máquinas. As regras para combinação de aparatos serão tratadas no capítulo 8.",
    n20: "No 20° nível seu prejuízo tecnológico faz com que qualquer aparato ou feito custe duas vezes mais, mas ele se torna capaz de criar qualquer tipo de máquina e realizar todo tipo de experiência. As regras para novos aparatos e feitos devem ser discutidas com o mestre de jogo.",
  },
  {
    nome: "Niilógico",
    classe: "Cientista",
    afiliacao: "rebelde",
    n5: "o cientista que seguir esta especialização começa a questionar a busca científica pelo conhecimento a partir do 5° nível, quando passa a ser capaz de sabotar máquinas como um gatuno com um terço de seus níveis de cientista.",
    n10: "No 10° nível o niilógico convence-se de que o conhecimento verdadeiro jamais será obtido pelos humanos, e passa a repudiar os avanços tecnológicos convencionais. Ele para de progredir em sua capacidade de operar máquinas e seu crédito tecnológico é ignorado, mas pode optar por reprogramar robôs ao invés de desativá-los. Um “D” na tabela T3-2 significa que o robô é automaticamente reprogramado para obedecer ao cientista indefinidamente, e um “A” simboliza que o robô será controlável por horas. Os demais robôs não são afetados.",
    n20: "No 20° nível os niilógicos reconhecem que a sabedoria absoluta está diluída nas mentes de todos os seres do universo, inclusive daqueles que já morreram. Eles tornam-se capazes de manifestar poderes mentais de 1ª grandeza, com alcance mental diário igual ao bônus do atributo Intelecto.",
  },
  {
    nome: "Emissário",
    classe: "Homem Espacial",
    afiliacao: "leal",
    n5: "homens espaciais que sigam esta especialização interrompem a progressão de dano crítico no 5° nível, mas podem usar essa mesma progressão até o 20º nível como multiplicador do ajuste de reação de seu atributo Comunicação. Essa multiplicação não é cumulativa, e deve ser refeita cada vez que o multiplicador mudar. Os emissários também passam a receber, mensalmente, um salário equivalente a $20.000 x seu nível. Um emissário de 5° nível, portanto, tem uma verba de 100.000 créditos disponível a cada mês, que aumenta conforme adquire novos níveis.",
    n10: "Atingindo o 10° nível os emissários param de progredir em desarmar e subjugar, mas terão uma nave patrocinada pelo governo ou instituição a que representa, sendo custeadas despesas com combustível e reparos. Eles também podem ter uma tripulação composta por um número de pessoas igual ao número máximo de seguidores de seu atributo Comunicação.47",
    n20: "No 20° nível sua tripulação triplica, e ele pode usar a porcentagem de desarme e submissão desse nível como probabilidade de qualquer criatura inteligente ter uma reação amigável com ele.",
  },
  {
    nome: "Mercenário",
    classe: "Homem Espacial",
    afiliacao: "neutro",
    n5: "mercenários trabalham para quem pagar mais e iniciam sua especialização no 5° nível, quando param de progredir em pilotar naves, mas escolhem uma arma com a qual ficam mais perigosos do que nunca. Seus danos críticos com essa arma serão sempre um multiplicador acima do indicado pela tabela T3-5. Portanto, um mercenário de 5° nível teria o dano crítico com sua arma de preferência igual a x4, e um de 18° nível teria x6.",
    n10: "Ao atingir o 10° nível o mercenário receberá uma penalidade de -4 ao usar qualquer arma senão a de sua preferência, com a qual terá um bônus de +2 em rolagens de ataque. Entretanto esse bônus só é aplicado ao primeiro ataque do turno, e a partir desse nível mercenários não mais poderão efetuar manobras de submissão e desarme em seus adversários no mesmo turno. Eles poderão, entretanto, sacrificar seu segundo ataque para ter uma chance maior de causar um dano crítico. Rola-se um teste com a probabilidade de desarme do 1° nível, caso seja bem-sucedido permite que o mercenário role seu segundo ataque normalmente. Caso o ataque seja efetivo ele é considerado crítico independentemente do resultado no dado, e se o resultado for um natural o oponente corre risco de morte por dano massivo. Se a rolagem de porcentagem inicial falhar, contudo, o mercenário não poderá realizar nenhuma outra ação nesse turno. A JP do mercenário também para de progredir no 10° nível.",
    n20: "No 20° nível o mercenário pode usar apenas a arma que escolheu, mas poderá realizar o teste para aumentar a chance de crítico nos dois ataques do turno, mantendo a base de ataque de cada um deles.",
  },
  {
    nome: "Caçador de Recompensas",
    classe: "Homem Espacial",
    afiliacao: "rebelde",
    n5: "ao atingir o 5° nível o caçador de recompensas passa a ser capaz de utilizar aparatos tecnológicos ofensivos e operar máquinas com uma rolagem bem-sucedida usando a porcentagem de desarmar e subjugar. O personagem para de progredir em desarmar e subjugar com esses fins e a nova progressão passa a aumentar para a nova aplicação.",
    n10: "A partir do 10° nível o caçador de recompensas pode optar por tentar realizar um ataque extra em seu turno com uma rolagem de desarmar, usando a porcentagem do 5° nível. Essa rolagem deve ser feita logo após o primeiro ataque, e um sucesso indica que o personagem poderá realizar mais dois ataques com a BA do segundo ataque conforme a tabela T3-5, mas uma falha impede o caçador de recompensas de realizar qualquer outra ação naquele turno. O ataque extra pode ser substituído por uma tentativa de desarme ou submissão de acordo com as regras dessas ações.",
    n20: "Ao atingir o 20° nível o caçador de recompensas poderá usar qualquer aparato tecnológico como um cientista do mesmo nível, e sempre poderá realizar 3 ataques em seu turno, com o ataque extra tendo a base de ataque do segundo.",
  },
  {
    nome: "Espião",
    classe: "Gatuno",
    afiliacao: "leal",
    n5: "um gatuno que seja leal a alguma organização ou governo pode tornar-se um espião a partir do 5° nível. Ele para de progredir em localizar e sabotar máquinas, mas os talentos de abrir portas e esconder-se nas sombras passam a ter uma porcentagem igual e progredir de forma idêntica ao de esgueirar-se e furtar. O espião também pode usar a progressão de seu talento de ocultar-se para se fazer passar por outra pessoa com uma rolagem bem-sucedida, aplicando o ajuste de reação do seu atributo Comunicação.",
    n10: "A partir do 10° nível o espião pode usar sua porcentagem de escalar superfícies como probabilidade de possuir alguma informação relevante ao que estiver investigando, seja através de contatos ou registros. Também passa a poder utilizar aparatos tecnológicos defensivos como um cientista.",
    n20: "No 20° nível o espião atinge praticamente a perfeição, com seus talentos de ocultar-se, esgueirar-se, abrir portas e furtar igualando sua porcentagem de 99% de escalar superfícies.",
  },
  {
    nome: "Sabotador",
    classe: "Gatuno",
    afiliacao: "neutro",
    n5: "sabotadores começam a especializar-se no 5° nível, quando passam a ser capazes de localizar e sabotar máquinas com mais eficiência, mas param de progredir em sua capacidade de furtar e ataque pelas costas. Esse bônus de eficiência é igual à diferença entre sua capacidade de escalar superfícies e 100%. Por exemplo, um sabotador que atingiu o 5° nível teria um bônus de +16% em sua probabilidade de localizar e sabotar máquinas, visto que sua probabilidade de escalar superfícies nesse nível é de 84%. Esse bônus não é cumulativo e deve ser somado à probabilidade de sabotagem a cada novo nível, resultando numa nova porcentagem.",
    n10: "Ao atingir o 10° nível os sabotadores param de progredir em qualquer talento exceto o de localizar e sabotar máquinas, mas são capazes de criar armadilhas utilizando máquinas sabotadas. A dificuldade para desarmar essa armadilha será inversamente proporcional à porcentagem de sabotar máquinas do criador de acordo com seu nível. Um sabotador de 10° nível, portanto, pode criar uma armadilha com apenas 27% de chance de desarme, visto que sua probabilidade de sabotar máquinas é de 73%, contando seu bônus de especialização, mas sem considerar qualquer bônus de atributo. Detalhes do funcionamento da armadilha devem ser discutidos com o mestre de jogo.",
    n20: "No 20° nível o sabotador é capaz de sabotar máquinas com 99% de chance e criar armadilhas com apenas 1% de probabilidade de desarme.",
  },
  {
    nome: "Assassino",
    classe: "Gatuno",
    afiliacao: "neutro",
    n5: "gatunos neutros podem passar a trabalhar cometendo assassínios por encomenda a partir do 5° nível. Eles param de progredir nos talentos de escalar superfícies e, localização e sabotagem de máquinas, mas seu ataque pelas costas recebe um bônus de 1 ponto, tornando-se x3 nesse nível, x4 ao atingir o 6° nível e assim por diante.43",
    n10: "No 10° nível ele para de progredir em abrir fechaduras, mas recebe uma chance de 20% de qualquer ataque bem-sucedido que realizar ser considerado um ataque pelas costas, exceto aqueles que já seguiriam essa regra. Ele também se torna capaz de desenvolver venenos, cujos efeitos devem ser discutidos com o mestre.",
    n20: "No 20° nível todos os ataques realizados pelo assassino são considerados ataques pelas costas, e um acerto crítico seu pede que o alvo realize uma JPF para não morrer, de acordo com a regra de dano massivo.",
  },
  {
    nome: "Pirata Espacial",
    classe: "Gatuno",
    afiliacao: "rebelde",
    n5: "a partir do 5° nível gatunos rebeldes podem optar por tornarem-se piratas espaciais. Eles param de progredir em abrir portas e furtar, mas passam a poder empregar o crédito tecnológico do atributo Ciência da mesma forma que cientistas, para qualquer negociação, não apenas as de cunho tecnológico. O dobro dessa porcentagem também pode ser usado como probabilidade de extorquir com sucesso uma pessoa. Eles também se tornam proficientes no uso de escudos de energia.",
    n10: "No 10° nível um pirata não mais progride em esgueirar-se, em ocultar-se e no talento de localizar e sabotar máquinas, mas pode utilizar a progressão de ocultar-se como a probabilidade de conseguir realizar um ataque adicional em seu turno. Esse segundo ataque é realizado utilizando seu bônus de ataque de 7 níveis inferiores. Ele também é capaz de usar qualquer aparato tecnológico, inclusive pilotar naves, com um teste bem sucedido de operar máquinas como um cientista com metade de seus níveis de gatuno, e pode ter uma tripulação composta por um número de pessoas igual ao número máximo de seguidores de seu atributo Comunicação, com número mínimo de 2.",
    n20: "No 20° nível o pirata poderá sempre realizar dois ataques em seu turno, com a diferença do bônus de ataque caindo para 5 níveis abaixo. Ele também poderá usar o dobro do crédito tecnológico em suas negociações e quatro vezes o crédito em suas extorsões. Ele sempre terá uma tripulação fiel composta por um número de pessoas igual a três vezes o número máximo de seguidores de seu atributo Comunicação, com um mínimo de 4.",
  },
  {
    nome: "Psiquista",
    classe: "Mentálico",
    afiliacao: "leal",
    n5: "psiquistas devotam-se completamente ao desenvolvimento e estudo da psiquê humana. No 5° nível eles ganham acesso diretamente à 4ª grandeza mental, pulando mas englobando a 3ª. Sua progressão de grandeza mental segue o modelo de uma nova a cada dois níveis, efetivamente atingindo a 10ª grandeza no 17° nível. Sua base de ataque também para de progredir no 5° nível.",
    n10: "Ao atingir o 10° nível a dedicação do mentálico é tanta que sua JP para de progredir, mas seu alcance mental diário passa ser equivalente ao de 2 níveis superiores. Desta forma, um psiquista de 10° nível tem o alcance mental do 12° nível, e atinge o alcance de 100% no 14° nível, e não no 16°. Essa progressão acelerada, contudo, faz com que o personagem, de acordo com a tabela, perca 1 ou 2 pontos de vida de seu total ao subir de nível ao invés de ganhá-los até o 17° nível, quando essa penalidade se intensifica. Ao chegar ao 17° nível e a cada nível subsequente o mentálico deve vencer uma JPF para não perder 1 ponto de Constituição permanentemente.",
    n20: "Ao chegar no 20° nível o mentálico deve fazer uma JPF para não morrer instantaneamente de sobrecarga mental. Seu alcance mental diário chega a 200% e ele pode realizar qualquer poder mental sem rolagem de probabilidade.",
  },
  {
    nome: "Radiestésico",
    classe: "Mentálico",
    afiliacao: "neutro",
    n5: "os radiestésicos são mentálicos que canalizam a energia do ambiente ao seu redor para si, e a utilizam em poderes mentais. No 5° nível os radiestésicos podem canalizar o poder mental de todos os seres vivos inteligentes amigáveis ou neutros ao seu redor a até metros. Esse poder mental extra corresponde à soma do alcance mental bônus do atributo Intelecto de cada um dos indivíduos. Esse bônus, entretanto, não pode ultrapassar a faixa de 1/4 do alcance mental do radiestésico. O personagem também não mais poderá adicionar seu próprio alcance mental bônus ao seu alcance diário, e sua JP para de progredir, já que a mente do personagem se mistura cada vez mais com o ambiente ao seu redor.",
    n10: "Atingindo o 10° nível o radiestésico pode passar a canalizar até 1/3 de seu alcance diário do ambiente ao seu redor a até metros, mas sua base de ataque para de progredir. O personagem passa a ser um canalizador de energia, e quaisquer descargas elétricas ou similares têm 30% de chance de serem atraídas até ele, incluindo raios e disparos de armas. Ele também passa a interferir em ondas eletromagnéticas involuntariamente.",
    n20: "No 20° nível o radiestésico poderá canalizar o poder mental de todos ao seu redor a até 100 metros, e com o limite do bônus subindo para metade de seu alcance mental diário, efetivamente ultrapassando os 200%. Nesse estágio, entretanto, o radiestésico tem 80% de chance de ser afetado por qualquer descarga de energia ocorrida no alcance de sua área de absorção. O personagem também interfere em ondas eletromagnéticas a seu bel-prazer.",
  },
  {
    nome: "Hipercientista",
    classe: "Mentálico",
    afiliacao: "rebelde",
    n5: "mentálicos que seguem o caminho de hipercientistas buscam as bases da filosofia mentálica na ciência, explorando a lenda de que o primeiro membro da classe foi um cientista. A partir do 5° nível um hipercientista passa a ser capaz de utilizar aparatos defensivos livremente, mas a progressão de sua grandeza mental sofre uma interrupção e só continua no 9° nível, com o acesso à 4ª grandeza mental. Seu alcance mental diário também só progredirá a cada dois níveis dali em diante. Um hipercientista de 5° nível, portanto, tem o alcance mental de 9% que só voltará a progredir no 7° nível, quando aumenta para 13% - porcentagem do 6° nível - que seria a progressão de um mentálico comum.",
    n10: "No 10° nível o hipercientista passa a ser capaz de usar qualquer aparato tecnológico com uma rolagem de operar máquinas como um cientista da metade de seus níveis de mentálico. Sua progressão de grandeza mental sofre outra parada, voltando a progredir ao atingir o 13° nível e a 5ª grandeza. Como hipercientistas não atingem a capacidade mental total de um ser humano no 16° nível eles recebem 2 pontos de vida a cada novo nível a partir do 17°, mas suas bases de ataque e JP continuam não progredindo.",
    n20: "Ao chegar no 20° nível os hipercientistas poderão utilizar quaisquer aparatos tecnológicos como um cientista do mesmo nível que o seu, e poderão criá-los de modo igual a um cientista com metade de seus níveis de mentálico. Entretanto, qualquer poder mental que o hipercientista deseje fazer necessitará de uma rolagem percentual para determinar seu sucesso, como explicado no capítulo 9.",
  },
];
