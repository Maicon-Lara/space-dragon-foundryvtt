// Capítulo 5 — Créditos e Equipamento.
//
// ── O QUE VIRA ITEM E O QUE VIRA TEXTO ──────────────────────────────────────
//
// Armas (T5-1) e vestes (T5-2) viram itens arrastáveis, porque a ficha do Old
// Dragon 2 tem tipos para eles e calcula em cima: a veste alimenta o CP, a arma
// entra na lista de ataques. Serviços e itens gerais viram journal — não há o
// que a ficha faça com "Vestes sob medida, $50.000".
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

/** Créditos iniciais por classe: rola os dados e multiplica por 10.000. */
export const CREDITOS_INICIAIS = {
  Cosmonauta: "2d10",
  Gatuno: "2d8",
  Cientista: "2d6",
  "Mentálico": "2d4",
};
