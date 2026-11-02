// Capítulo 5 — Créditos e Equipamento.
//
// ── O QUE VIRA ITEM E O QUE VIRA TEXTO ──────────────────────────────────────
//
// Armas (T5-1) e vestes (T5-2) viram itens arrastáveis, porque a ficha do Old
// Dragon 2 tem tipos para eles e calcula em cima: a veste alimenta o CP, a arma
// entra na lista de ataques. Os itens gerais (T5-4) também viram item, `misc`:
// a ficha não calcula nada com eles, mas soma o peso na carga, e é na mochila
// que eles vivem. Bens (aerocarro, aposentos…) e serviços (T5-3, T5-5) viram
// journal — não há o que a ficha faça com "Vestes sob medida, $50.000".
//
// ── ONDE OS DOIS JOGOS DIVERGEM ─────────────────────────────────────────────
//
//   · O ALCANCE é uma tripla "15 / 30 / 45" em metros: a primeira sem
//     penalidade, a segunda −2 e a terceira −4. O OD2 tem um campo de alcance
//     só. A tripla inteira fica na descrição.
//   · O TIPO da arma (F, D, M, A) decide o modificador do ataque pelo
//     Capítulo 7 — não é o mesmo eixo de "corpo a corpo / à distância" do OD2.
//   · O PORTE (P, M, G) muda o ataque conforme as mãos usadas, e o OD2 não tem
//     esse conceito.
//   · O DANO em ÁREA ("1d8 - 5m²") pede JPR a todos na área: dano inteiro para
//     quem falha, metade para quem passa.
//   · A VESTE dá um VALOR DE PROTEÇÃO absoluto (10, 11, 12…), que é a base do
//     CP — não um bônus somado a 10 como a CA do OD2.
//
// Preços estão em créditos espaciais. Arma sem preço é de cultura primitiva,
// e só se consegue com gente dessas culturas.

/** Os quatro tipos, como o livro os define. */
export const TIPOS = {
  F: "arma de fogo",
  D: "à distância",
  M: "marcial (corpo a corpo)",
  A: "arremesso",
};

/** Os três portes, com o que cada um faz na rolagem de ataque. */
export const PORTES = {
  P: "pequena — uma mão, ou duas por +2 no ataque",
  M: "média — duas mãos, ou uma por −2 no ataque",
  G: "grande — obrigatoriamente duas mãos",
};

/**
 * T5-1: Armas.
 *
 * `dano` e `alcance` ficam como o livro escreve, inclusive "Corporal" e as
 * áreas em m². `preco` nulo é arma sem preço de tabela.
 */
export const ARMAS = [
  { nome: "Anel de laser", tipo: "F", porte: null, dano: "1d2", alcance: "5 / 10 / 15", preco: 80000, peso: null },
  { nome: "Arco para flechas", tipo: "D", porte: "M", dano: null, alcance: "15 / 30 / 45", preco: null, peso: 0.5 },
  { nome: "Arma de raios", tipo: "F", porte: "P", dano: "1d6", alcance: "10 / 20 / 30", preco: 25000, peso: 0.5 },
  { nome: "Bastão de choque", tipo: "M", porte: "P", dano: "1d6", alcance: "Corporal", preco: 30000, peso: 1 },
  { nome: "Chicote neurônico", tipo: "M", porte: "P", dano: "1d8", alcance: "Corporal", preco: 50000, peso: 1 },
  { nome: "Dardo para zarabatana (1)", tipo: "D", porte: null, dano: "1d4", alcance: null, preco: null, peso: 0.1 },
  { nome: "Disparador protônico", tipo: "F", porte: "G", dano: "2d6", alcance: "15 / 30 / 45", preco: 150000, peso: 5 },
  { nome: "Espada de energia", tipo: "M", porte: "M", dano: "1d8", alcance: "Corporal", preco: 50000, peso: 2 },
  { nome: "Espada de lâmina", tipo: "M", porte: "M", dano: "1d8", alcance: "Corporal", preco: null, peso: 3 },
  { nome: "Faca de sobrevivência", tipo: "M/A", porte: "P", dano: "1d4", alcance: "Corporal · 3 / 6 / 9", preco: 5000, peso: 0.5 },
  { nome: "Flecha (20)", tipo: "D", porte: null, dano: "1d6", alcance: null, preco: null, peso: 1 },
  { nome: "Funda", tipo: "A", porte: "P", dano: "1d3", alcance: "10 / 20 / 30", preco: null, peso: null },
  { nome: "Fuzil de laser", tipo: "F", porte: "M", dano: "1d8", alcance: "15 / 30 / 45", preco: 35000, peso: 3 },
  { nome: "Granada elétrica (1)", tipo: "A", porte: "P", dano: "1d8 em 5m²", alcance: "10 / 20 / 30", preco: 10000, peso: 0.5 },
  { nome: "Granada explosiva (1)", tipo: "A", porte: "P", dano: "1d10 em 10m²", alcance: "10 / 20 / 30", preco: 30000, peso: 0.5 },
  { nome: "Lança de lâmina", tipo: "M/A", porte: "M", dano: "1d8", alcance: "Corporal · 3 / 6 / 9", preco: null, peso: 2.5 },
  { nome: "Lança elétrica", tipo: "M/A", porte: "M", dano: "1d6", alcance: "Corporal · 3 / 6 / 9", preco: 40000, peso: 2.5 },
  { nome: "Lança-granadas", tipo: "F", porte: "G", dano: null, alcance: "20 / 40 / 60", preco: 50000, peso: 10 },
  { nome: "Lança-mísseis", tipo: "F", porte: "G", dano: null, alcance: "25 / 50 / 70", preco: 70000, peso: 10 },
  { nome: "Machado", tipo: "M", porte: "M", dano: "1d8", alcance: "Corporal", preco: null, peso: 3 },
  { nome: "Míssil (1)", tipo: "F", porte: null, dano: "2d8 em 15m²", alcance: null, preco: 45000, peso: 2 },
  { nome: "Pistola autodestrutiva", tipo: "F/A", porte: "P", dano: "1d6 · 1d8 em 2m²", alcance: "10 / 20 / 30", preco: 60000, peso: 0.5 },
  { nome: "Pistola laser", tipo: "F", porte: "P", dano: "1d6", alcance: "15 / 30 / 45", preco: 20000, peso: 0.5 },
  { nome: "Pistola de projéteis", tipo: "F", porte: "P", dano: "1d8", alcance: "10 / 20 / 30", preco: 30000, peso: 0.5 },
  { nome: "Porrete", tipo: "M", porte: "M", dano: "1d4", alcance: "Corporal", preco: null, peso: 1 },
  { nome: "Potencializador", tipo: null, porte: null, dano: "+1d4", alcance: "+10 / +5 / +2", preco: 100000, peso: null,
    nota: "Acoplado a outra arma: soma 1d4 ao dano e estende o alcance." },
  { nome: "Projéteis (30)", tipo: "F", porte: null, dano: null, alcance: null, preco: 10000, peso: 0.5 },
  { nome: "Projéteis explosivos (10)", tipo: "F", porte: null, dano: "+1d4", alcance: null, preco: 40000, peso: 0.5,
    nota: "Somam 1d4 ao dano da arma em que forem usados." },
  { nome: "Rifle laser", tipo: "F", porte: "M", dano: "1d8", alcance: "15 / 30 / 45", preco: 30000, peso: 2 },
  { nome: "Rifle de plasma", tipo: "F", porte: "M", dano: "1d12", alcance: "15 / 30 / 45", preco: 70000, peso: 4 },
  { nome: "Rifle de projéteis", tipo: "F", porte: "M", dano: "1d10", alcance: "15 / 30 / 45", preco: 5000, peso: 4 },
  { nome: "Zarabatana", tipo: "D", porte: "P", dano: null, alcance: "10 / 20 / 30", preco: null, peso: 0.5 },
];

/**
 * T5-2: Vestes e Itens de Proteção.
 *
 * `protecao` é o VALOR ABSOLUTO que vira a base do CP, e não um bônus. O
 * escudo de energia é a exceção: `bonus: true` diz que ele SOMA ao total.
 *
 * Trajes aquáticos e espaciais não dão proteção nenhuma — são um acréscimo de
 * peso, preço e penalidade de movimento sobre a veste que se está usando.
 */
export const VESTES = [
  { nome: "Roupas comuns", protecao: 10, movimento: 0, preco: 5000, peso: 0.5 },
  { nome: "Vestes leves", protecao: 11, movimento: 0, preco: 20000, peso: 2 },
  { nome: "Vestes médias", protecao: 12, movimento: 0, preco: 40000, peso: 4 },
  { nome: "Trajes de combate", protecao: 14, movimento: 1, preco: 60000, peso: 6 },
  { nome: "Armadura defletora", protecao: 16, movimento: 3, preco: 100000, peso: 10 },
  { nome: "Trajes aquáticos", protecao: null, movimento: 4, preco: 50000, peso: 5, acrescimo: true,
    nota: "Somado à veste em uso. A redução de movimento cai para 2 dentro da água." },
  { nome: "Trajes espaciais", protecao: null, movimento: 5, preco: 100000, peso: 10, acrescimo: true,
    nota: "Somado à veste em uso." },
  { nome: "Escudo de energia", protecao: 2, movimento: 0, preco: 150000, peso: 0.5, bonus: true,
    nota: "Não é carregado no braço: fica num cinto projetor e está sempre ativo, sem ocupar mão." },
];

/** T5-3: Vestes sob Encomenda. */
export const ENCOMENDA = [
  { servico: "Material mais leve", preco: 40000, beneficio: "Reduz o peso das vestes em 2 kg." },
  { servico: "Reforço de vestes", preco: 60000, beneficio: "Aumenta o valor de proteção em +2." },
  { servico: "Vestes sob medida", preco: 50000, beneficio: "Reduz a penalidade de movimento em 2." },
];

/**
 * T5-4: Itens Gerais (p. 69–70).
 *
 * `peso` nulo é o "–" do livro: o item não pesa o bastante para contar.
 */
export const ITENS_GERAIS = [
  { nome: "Arpéu", desc: "Gancho triplo para escaladas.", preco: 5000, peso: 1 },
  { nome: "Barraca térmica de acampamento", desc: "Para 4 pessoas, com 2x2 metros.", preco: 100000, peso: 4 },
  { nome: "Bastão de luz descartável", desc: "Dura 1 hora e ilumina uma área de 10 m.", preco: 500, peso: 0.5 },
  { nome: "Bastão extensível", desc: "Estende-se a até 3 metros.", preco: 1000, peso: 0.5 },
  { nome: "Baterias", desc: "Para lanternas e outros instrumentos.", preco: 1000, peso: null },
  { nome: "Caixote pequeno", desc: "De material resistente, para até 200 kg.", preco: 2000, peso: 4 },
  { nome: "Cantil pequeno", desc: "Recipiente térmico para 1 litro de líquido.", preco: 5000, peso: 1 },
  { nome: "Cartão de identificação Galático", desc: "Segunda via, em caso de perda ou extravio.", preco: 1000, peso: null },
  { nome: "Cilindro de oxigênio", desc: "Para trajes pressurizados, com duração aproximada de 6 horas.", preco: 25000, peso: 4 },
  { nome: "Cobertor de sobrevivência", desc: "Feito de material resistente a calor e frio.", preco: 1000, peso: 1 },
  { nome: "Corda extensível", desc: "Estende-se a até 18 metros e suporta até 300 kg.", preco: 10000, peso: 3 },
  { nome: "Corrente", desc: "10 metros, para até 1 tonelada.", preco: 50000, peso: 20 },
  { nome: "Ferramentas de Gatuno", desc: "Ferramentas para arrombamento e sabotagem.", preco: 300000, peso: 1 },
  { nome: "Frasco de ácido", desc: "500 ml de ácido fraco, para uso científico ou como arma.", preco: 10000, peso: 0.5 },
  { nome: "Isqueiro", desc: "Para gerar fogo.", preco: 100, peso: null },
  { nome: "Lanterna de mão", desc: "A bateria dura 6 horas; ilumina até 20 metros.", preco: 5000, peso: 0.5 },
  { nome: "Mochila de expedição", desc: "Impermeável e com compartimentos.", preco: 20000, peso: 2 },
  { nome: "Papel e caneta", desc: "Pacote com 100 folhas e caneta adaptada à gravidade zero.", preco: 2000, peso: 1 },
  { nome: "Pá / picareta", desc: "Para escavações.", preco: 5000, peso: 1.5 },
  { nome: "Pé de cabra", desc: "Para arrombamentos e desobstruções.", preco: 10000, peso: 4 },
  { nome: "Ração espacial", desc: "Porção individual de alimentos desidratados ou pastosos. Suficiente para 1 dia.", preco: 10000, peso: 0.5 },
  { nome: "Saco grande", desc: "Para até 15 kg.", preco: 500, peso: null },
  { nome: "Sinalizador", desc: "Pistola de sinalização para emergências.", preco: 2000, peso: 0.5 },
  { nome: "Tranca eletrônica", desc: "Com identificação digital, para portas, correntes etc.", preco: 50000, peso: 1.5 },
];

/** T5-4: Itens Gerais (Bens) — p. 70. Não se carregam, então não têm peso. */
export const BENS = [
  { nome: "Aerocarro", desc: "Transporte urbano particular para até 4 pessoas.", preco: 1000000 },
  { nome: "Aeromoto", desc: "Transporte urbano individual.", preco: 600000 },
  { nome: "Aposentos permanentes", desc: "Residência permanente em um planeta ou estação espacial.", preco: 1500000 },
  { nome: "Espaçonave", desc: "Nave de porte médio para tripulação de até 10 pessoas.", preco: 5000000 },
  { nome: "Hidrocarro", desc: "Transporte aquático particular para até 4 pessoas.", preco: 1000000 },
];

/** T5-5: Serviços Científicos (p. 71). O "cap. 8" é o custo da lista de aparatos. */
export const SERVICOS_CIENTIFICOS = [
  { servico: "Identificar aparato ou relíquia tecnológica", preco: "Nível tecnológico × $1.000" },
  { servico: "Reparar aparato ou relíquia tecnológica", preco: "Nível tecnológico × $5.000" },
  { servico: "Criar aparato tecnológico", preco: "Dobro do preço no Capítulo 8" },
  { servico: "Realizar feito científico", preco: "Triplo do preço no Capítulo 8" },
];

/** Créditos iniciais por classe: rola os dados e multiplica por 10.000. */
export const CREDITOS_INICIAIS = {
  Cosmonauta: "2d10",
  Gatuno: "2d8",
  Cientista: "2d6",
  "Mentálico": "2d4",
};
