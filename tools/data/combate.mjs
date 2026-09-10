// Capítulo 7 — Combate e Danos.
//
// ── A DIVERGÊNCIA QUE MAIS PESA NA MESA ─────────────────────────────────────
//
// A ORDEM DE AÇÃO não é iniciativa. Não se rola 1d20 nem se soma Destreza para
// ver quem vai primeiro:
//
//   · quem ataca rola o DADO DE DANO DA ARMA;
//   · quem usa aparato ou poder mental usa o NÍVEL TECNOLÓGICO ou a GRANDEZA;
//   · quem só se move usa 10 menos o modificador de Destreza;
//   · age primeiro o MENOR resultado;
//   · e a rodada dura o MAIOR resultado × 2 segundos.
//
// Ou seja: a faca age antes do rifle de plasma, e a rodada tem duração
// variável. Nada disso existe no Old Dragon 2, e o rolador de iniciativa do
// sistema faz outra coisa — ver module/ordem.js.
//
// ── O RESTO QUE NÃO CASA ────────────────────────────────────────────────────
//
//   · O ataque compara com o CP do alvo, e precisa IGUALAR OU SUPERAR.
//   · Crítico multiplica o dano por 2 — ou mais, se for cosmonauta — e ainda
//     permite rolar 1d6 na T7-4 para um efeito extra.
//   · Falha crítica é o 1 natural, com 1d6 na T7-5.
//   · Danos mortais variam de −5 a −19 pela Constituição. No OD2 é −10 fixo.

/** T7-1: ajustes que o Mestre soma à jogada de surpresa. */
export const T7_1 = [
  { situacao: "Outro grupo em silêncio", mod: -1 },
  { situacao: "Outro grupo camuflado", mod: -2 },
  { situacao: "Outro grupo furtivo", mod: -3 },
  { situacao: "Baixa luminosidade ou visibilidade", mod: -2 },
  { situacao: "Grupo atento", mod: +3 },
  { situacao: "Grupo relaxado", mod: -1 },
];

/** T7-2: de onde sai o número da ordem de ação, por tipo de ação. */
export const T7_2 = [
  { acao: "Atacar à distância, corpo a corpo ou em área", valor: "Rolagem do dado de dano da arma" },
  { acao: "Usar aparato tecnológico ou poder mental", valor: "Nível tecnológico ou grandeza mental" },
  { acao: "Movimentação dupla e outras ações", valor: "10 − modificador de Destreza" },
];

/**
 * T7-3: modificadores de combate, em quatro blocos.
 *
 * O livro os separa por natureza, e a separação importa: os de distância
 * dependem do alcance da arma, os de tamanho são penalidades brutais para
 * mirar em ponto específico, e o de carga mexe no DANO, não no ataque.
 */
export const T7_3 = {
  "Situacionais": [
    { situacao: "Alvo cego ou atordoado", mod: "+5", nota: "Defensor sem condições de se defender com eficiência." },
    { situacao: "Alvo indefeso", mod: "+20", nota: "Só não acerta em caso de falha crítica." },
    { situacao: "Alvo caído", mod: "+1", nota: "Caído mas consciente e tentando se defender." },
    { situacao: "Atacando de nível superior", mod: "+2", nota: "Em escadas, rampas, rochas." },
    { situacao: "Pelas costas do alvo", mod: "+2", nota: "Apenas gatunos recebem este bônus." },
    { situacao: "Atacando enquanto pilota ou monta", mod: "−3", nota: "Quando dá para soltar os controles por um instante, ou montado num animal." },
    { situacao: "Atacando com duas armas", mod: "−4 e −6", nota: "−4 para a arma principal, que precisa ser média, e −6 para a secundária." },
  ],
  "Distância": [
    { situacao: "Tiro à queima-roupa", mod: "+2", nota: "Arma de fogo contra alvo a até 3 metros. Se o oponente estiver desarmado, é acerto crítico." },
    { situacao: "Distância média", mod: "−2", nota: "Alcance mínimo da arma multiplicado por 2." },
    { situacao: "Longa distância", mod: "−4", nota: "Alcance mínimo da arma multiplicado por 3." },
  ],
  "Alvos por tamanho": [
    { situacao: "Moeda, alvo de até 2 cm", mod: "−20", nota: "Ataques nos olhos, e só contra alvos sem capacete." },
    { situacao: "Maçã, alvo de até 10 cm", mod: "−15", nota: "Ataques no coração, e só contra alvos sem vestes de proteção." },
    { situacao: "Melancia, alvo de até 20 cm", mod: "−10", nota: "Ataques na cabeça, e só contra alvos sem capacete." },
  ],
  "Modificador de dano": [
    { situacao: "Ataque em carga", mod: "+2 no dano", nota: "Move-se em linha reta até o alvo. Dá +2 no dano corpo a corpo, ao custo de −2 no CP até o próximo turno." },
  ],
};

/** T7-4: acertos críticos, em 1d6. */
export const T7_4 = [
  { d6: 1, efeito: "Acerto em área vital, dano ×2." },
  { d6: 2, efeito: "Ferimento: dano ×2 e a movimentação do alvo cai à metade." },
  { d6: 3, efeito: "Ferimento: dano ×2 e −2 nos ataques desferidos pelo alvo." },
  { d6: 4, efeito: "Vestes avariadas: dano ×2 e −2 no CP." },
  { d6: 5, efeito: "Ataque extra contra inimigo ao alcance da arma." },
  { d6: 6, efeito: "Morte." },
];

/** T7-5: falhas críticas, em 1d6. */
export const T7_5 = [
  { d6: 1, efeito: "Derruba a arma." },
  { d6: 2, efeito: "Desequilíbrio: −1 no CP." },
  { d6: 3, efeito: "Arma temporariamente danificada." },
  { d6: 4, efeito: "Arma permanentemente danificada." },
  { d6: 5, efeito: "Atinge um aliado próximo ao alvo." },
  { d6: 6, efeito: "Queda: −1 no CP, e uma ação de movimento para se levantar." },
];
