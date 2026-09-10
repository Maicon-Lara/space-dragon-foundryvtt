/**
 * As mutações do Homo novus (2.3).
 *
 * ── COMO O LIVRO MANDA SORTEAR ──────────────────────────────────────────────
 *
 * "Basta rolar 2d10 na tabela T2-1, comparando os resultados com as colunas de
 * aprimoramentos e degenerações, uma para cada dado. Caso a rolagem resulte em
 * números duplicados, ela deve ser refeita até que resulte em números
 * diferentes."
 *
 * A trava dos duplicados não é decoração: sem ela sairia "Recuperação acelerada
 * + Recuperação lenta", que se anulam. O balanço genético do cenário exige que
 * o que melhora e o que piora sejam coisas DIFERENTES.
 *
 * ── O QUE O MUTANTE NÃO TEM ─────────────────────────────────────────────────
 *
 * Tudo o mais é igual ao Homo sapiens, EXCETO o bônus de +2 num atributo, a
 * penalidade de -2 em outro, e o incremento a cada 4 níveis. Por isso o item de
 * espécie do Mutante vai com os ajustes zerados e `incrementoCadaNiveis: 0`.
 *
 * Este arquivo é TRANSCRIÇÃO. As quatro subtabelas (T2-2 a T2-5) vêm depois dos
 * pares, porque quatro mutações remetem a elas.
 */

/** T2-1: os dez pares. O índice é o que o 1d10 sorteia em cada coluna. */
export const PARES = [
  {
    indice: 1,
    aprimoramento: {
      nome: "Recuperação Acelerada",
      genotipo: "O organismo do personagem é mais eficiente em recuperar-se de ferimentos e traumas.",
      fenotipo: "Feridas fecham-se mais rapidamente.",
      funcionamento: "Personagens com esta mutação recuperam 2PV por nível por dia de descanso.",
    },
    degeneracao: {
      nome: "Recuperação Lenta",
      genotipo: "O organismo do mutante é mais lento em recuperar-se de ferimentos e traumas.",
      fenotipo: "Feridas fecham-se mais lentamente.",
      funcionamento: "Personagens com esta mutação recuperam 1PV por nível a cada 2 dias de descanso.",
    },
  },
  {
    indice: 2,
    aprimoramento: {
      nome: "Cognição Acelerada",
      genotipo: "O aprendizado do mutante ocorre mais rapidamente do que o normal.",
      fenotipo: "Facilidade de entendimento e memorização.",
      funcionamento: "O personagem com esta mutação recebe um bônus de 30% de XP.",
    },
    degeneracao: {
      nome: "Cognição Retardada",
      genotipo: "O aprendizado do mutante se dá mais lentamente que normal.",
      fenotipo: "Dificuldade de entendimento e memorização.",
      funcionamento: "O personagem com esta mutação recebe uma penalidade de 30% de XP.",
    },
  },
  {
    indice: 3,
    aprimoramento: {
      nome: "Mente Avançada",
      genotipo: "O cérebro do mutante é mais desenvolvido do que o normal.",
      fenotipo: "Massa encefálica proeminente.",
      funcionamento: "O personagem tem resistência mental de 5%, e um bônus de +2 em JPM.",
    },
    degeneracao: {
      nome: "Mente Simplificada",
      genotipo: "O cérebro do mutante é menos desenvolvido do que o normal.",
      fenotipo: "Massa encefálica reduzida.",
      funcionamento: "O personagem tem uma penalidade de -2 em JPM, e não pode ter Intelecto superior a 10.",
    },
  },
  {
    indice: 4,
    aprimoramento: {
      nome: "Sistema Imunológico Evoluído",
      genotipo: "Os anticorpos do personagem combatem agentes nocivos com muita eficácia.",
      fenotipo: "Saúde inabalável.",
      funcionamento: "Garante um bônus de +2 em qualquer JPF para resistir a doenças, infecções e outros males que não envolvam ferimentos ou traumas físicos.",
    },
    degeneracao: {
      nome: "Sistema Imunológico Vulnerável",
      genotipo: "Os anticorpos do personagem não conseguem combater agentes nocivos com eficácia.",
      fenotipo: "Vulnerabilidade a doenças.",
      funcionamento: "Confere uma penalidade de -2 em qualquer JPF para resistir a doenças, infecções e outros males que não envolvam ferimentos ou traumas físicos.",
    },
  },
  {
    indice: 5,
    aprimoramento: {
      nome: "Longevidade",
      genotipo: "O organismo do mutante envelhece mais devagar.",
      fenotipo: "Envelhecimento tardio.",
      funcionamento: "A expectativa de vida do personagem é de 100 a 120 anos, e a maturidade acontece aos 30. Ao atingir o 10° nível de classe e a cada dois níveis subsequentes poderá escolher um atributo e aumentá-lo em 1 ponto.",
    },
    degeneracao: {
      nome: "Baixa Expectativa de Vida",
      genotipo: "O organismo do mutante envelhece mais rapidamente.",
      fenotipo: "Envelhecimento precoce.",
      funcionamento: "A expectativa de vida do personagem é de 40 a 50 anos, e a maturidade acontece aos 10. Ao atingir o 10° nível de classe e a cada dois níveis subsequentes deve-se escolher um atributo e diminuí-lo em 1 ponto.",
    },
  },
  {
    indice: 6,
    aprimoramento: {
      nome: "Funções Vitais Superiores",
      genotipo: "As funções vitais do personagem se dão em ritmo mais acelerado que o normal.",
      fenotipo: "Aspecto saudável.",
      funcionamento: "O DV da classe do personagem torna-se uma categoria maior. O d4 é substituído por d6, o d6 por d8, o d8 por d10 e o d10 por d12.",
    },
    degeneracao: {
      nome: "Funções Vitais Debilitadas",
      genotipo: "As funções vitais do personagem se dão em ritmo mais lento que o normal.",
      fenotipo: "Aspecto doentio.",
      funcionamento: "O DV da classe do personagem torna-se uma categoria menor. O d4 torna-se d2, o d6 torna-se d4, o d8 torna-se d6 e o d10 torna-se d8.",
    },
  },
  {
    indice: 7,
    aprimoramento: {
      nome: "Sentido Ampliado",
      genotipo: "Um dos sentidos do mutante se destaca dos demais.",
      fenotipo: "Vários — veja a subtabela.",
      funcionamento: "Role 1d6 e compare o resultado com a tabela a seguir.",
    },
    degeneracao: {
      nome: "Sentido Diminuído",
      genotipo: "Um dos sentidos do mutante é deficiente.",
      fenotipo: "Vários — veja a subtabela.",
      funcionamento: "Role 1d6 e compare o resultado com a tabela",
    },
  },
  {
    indice: 8,
    aprimoramento: {
      nome: "Atributo Ampliado",
      genotipo: "Um dos atributos do personagem se destaca dos demais.",
      fenotipo: "Vários — veja a subtabela.",
      funcionamento: "Role 1d6 e compare o resultado com a tabela a seguir:",
    },
    degeneracao: {
      nome: "Atributo Diminuído",
      genotipo: "Um dos atributos do personagem é deficiente.",
      fenotipo: "Vários — veja a subtabela.",
      funcionamento: "Role 1d6 e compare o resultado com a tabela a seguir:",
    },
  },
  {
    indice: 9,
    aprimoramento: {
      nome: "Poderes Mentais",
      genotipo: "O cérebro do mutante desenvolveu a capacidade inata de realizar um poder mental.",
      fenotipo: "Loucura aparente.",
      funcionamento: "Escolha um poder mental de 1ª grandeza. O personagem pode realizá-lo uma vez por dia sem penalidades. Este uso é algo adicional, além do alcance mental diário do personagem caso ele seja um mentálico. Ele pode tentar realizá-lo mais vezes por dia com um teste de Realizar poder mental se o valor do atributo conferir uma porcentagem para isso. Uma falha nessa jogada, contudo, causa 1d6 pontos de dano mental ao mutante e impede que ele faça novas tentativas naquele dia.",
    },
    degeneracao: {
      nome: "Dissonância Mental",
      genotipo: "O personagem tem uma instabilidade mental, representada por uma dupla personalidade.",
      fenotipo: "Personalidades conflitantes.",
      funcionamento: "O personagem tem uma dupla personalidade, seguindo as regras do poder mental Criar dupla personalidade no capítulo 9. Ambas as personalidades são tratadas como personagens separados de nível 1.",
    },
  },
  {
    indice: 10,
    aprimoramento: {
      nome: "Superpoderes",
      genotipo: "O mutante é capaz de feitos incríveis e inexplicados pela ciência.",
      fenotipo: "Variável",
      funcionamento: "Escolha uma magia arcana ou divina de 1º círculo da lista do Old Dragon – o personagem pode conjurar essa magia uma vez por dia. O mestre tem a palavra final sobre quaisquer detalhes da magia que precisarem ser adaptados. O Old Dragon é um RPG de fantasia clássica e está disponível gratuitamente no site da Redbox Editora.",
    },
    degeneracao: {
      nome: "Involução",
      genotipo: "Algumas capacidades mentais e motoras do mutante apresentam lentidão.",
      fenotipo: "Falta de cognição para certas tarefas.",
      funcionamento: "Escolha um entre testes de atributo, jogadas de proteção ou rolagens de ataque. Você sempre rolará 2d20 para o tipo de rolagem escolhida e ficará com o pior resultado.",
    },
  },];

/** T2-2: Atributo Ampliado — 1d6. */
export const T2_2 = [
  { d6: 1, atributo: "forca", ajuste: +3, fenotipo: "Corpo musculoso" },
  { d6: 2, atributo: "destreza", ajuste: +3, fenotipo: "Corpo esguio e boa coordenação motora" },
  { d6: 3, atributo: "constituicao", ajuste: +3, fenotipo: "Aparência saudável" },
  { d6: 4, atributo: "intelecto", ajuste: +3, fenotipo: "Massa encefálica proeminente" },
  { d6: 5, atributo: "ciencia", ajuste: +3, fenotipo: "Facilmente distraído e absorto em pensamentos" },
  { d6: 6, atributo: "comunicacao", ajuste: +3, fenotipo: "Aptidão para socialização" },
];

/** T2-4: Atributo Diminuído — 1d6. Espelha a T2-2, com o sinal trocado. */
export const T2_4 = [
  { d6: 1, atributo: "forca", ajuste: -3, fenotipo: "Corpo franzino" },
  { d6: 2, atributo: "destreza", ajuste: -3, fenotipo: "Corpo pesado e coordenação motora prejudicada" },
  { d6: 3, atributo: "constituicao", ajuste: -3, fenotipo: "Aparência doentia" },
  { d6: 4, atributo: "intelecto", ajuste: -3, fenotipo: "Massa encefálica diminuída" },
  { d6: 5, atributo: "ciencia", ajuste: -3, fenotipo: "Comportamento animalesco" },
  { d6: 6, atributo: "comunicacao", ajuste: -3, fenotipo: "Introspecção inata" },
];

/** T2-3: Sentido Ampliado — 1d6. */
export const T2_3 = [
  { d6: 1, sentido: "Visão", fenotipo: "Olhos proeminentes ou de coloração diferenciada",
    funcionamento: "Enxerga no escuro e à distância, e recebe +1 para usar armas à distância. Gatunos recebem +1 em jogadas de percepção envolvendo a visão." },
  { d6: 2, sentido: "Audição", fenotipo: "Orelhas proeminentes ou pontudas",
    funcionamento: "+1 em jogadas de proteção de reflexos, e escuta sons com o dobro da capacidade de um humano. Gatunos recebem +1 em jogadas de percepção envolvendo a audição." },
  { d6: 3, sentido: "Olfato", fenotipo: "Nariz aquilino ou ausência de narina",
    funcionamento: "Capacidade olfativa duas vezes maior que a de um humano; prende a respiração por turnos iguais a Constituição × 20. Gatunos recebem +1 em jogadas de percepção envolvendo o olfato." },
  { d6: 4, sentido: "Tato", fenotipo: "Pele com cor ou textura diferenciada",
    funcionamento: "Reconhece qualquer tipo de material pelo toque e ignora 2 pontos de dano de qualquer tipo, podendo zerá-lo." },
  { d6: 5, sentido: "Paladar", fenotipo: "Língua longa ou bifurcada",
    funcionamento: "Precisa de apenas metade do alimento que um humano precisaria, e o corpo é imune a doenças e venenos." },
  { d6: 6, sentido: "Sexto Sentido", fenotipo: "Percepção rápida e quase premonitiva do perigo",
    funcionamento: "+2 em qualquer Jogada de Proteção de Reflexos (JPR) e no coeficiente de proteção." },
];

/** T2-5: Sentido Diminuído — 1d6. */
export const T2_5 = [
  { d6: 1, sentido: "Visão", fenotipo: "Olhos pequenos ou com ausência de íris",
    funcionamento: "Incapaz de enxergar bem com muita luz e ao longe, e recebe −1 para usar armas à distância. Gatunos recebem −1 em jogadas de percepção envolvendo a visão." },
  { d6: 2, sentido: "Audição", fenotipo: "Orelhas pouco desenvolvidas ou parcialmente cobertas",
    funcionamento: "−1 em jogadas de proteção de reflexos, e escuta sons com apenas metade da capacidade de um humano. Gatunos recebem −1 em jogadas de percepção envolvendo a audição." },
  { d6: 3, sentido: "Olfato", fenotipo: "Narinas parcialmente tampadas",
    funcionamento: "Capacidade olfativa duas vezes menor que a de um humano; prende a respiração por segundos iguais a Constituição × 5. Gatunos recebem −1 em jogadas de percepção envolvendo o olfato." },
  { d6: 4, sentido: "Tato", fenotipo: "Pele com cor ou textura diferenciada",
    funcionamento: "Baixa sensibilidade tátil: −2 no atributo Força, e sofre sempre +2 pontos de dano de qualquer tipo." },
  { d6: 5, sentido: "Paladar", fenotipo: "Língua com coloração diferente",
    funcionamento: "Precisa do dobro do alimento que um humano precisaria, e o corpo é suscetível a doenças e venenos: as jogadas de proteção para resistir falham automaticamente e o dano por doença ou veneno é dobrado." },
  { d6: 6, sentido: "Sexto Sentido", fenotipo: "Falta de noção precisa de perigo",
    funcionamento: "−2 em qualquer JPR e no coeficiente de proteção." },
];

/** Quais pares mandam rolar 1d6 numa subtabela depois de sorteados. */
export const SUBTABELA = {
  7: { aprimoramento: "T2_3", degeneracao: "T2_5" },   // Sentido ampliado / diminuído
  8: { aprimoramento: "T2_2", degeneracao: "T2_4" },   // Atributo ampliado / diminuído
};

export const SUBTABELAS = { T2_2, T2_3, T2_4, T2_5 };

/**
 * Sorteia o par de mutações: 2d10, um dado por coluna, REROLANDO enquanto os
 * dois derem o mesmo número.
 *
 * Devolve também as rolagens, porque a mesa quer ver os dados — inclusive as
 * tentativas descartadas, que explicam por que o resultado é o que é.
 */
export async function sortearMutacoes() {
  const tentativas = [];
  let a, d;
  do {
    const roll = await new Roll("2d10").evaluate();
    [a, d] = roll.dice[0].results.map((r) => r.result);
    tentativas.push({ roll, a, d, repetiu: a === d });
  } while (a === d && tentativas.length < 20);

  const par = (i) => PARES.find((p) => p.indice === i);
  return {
    aprimoramento: par(a).aprimoramento,
    degeneracao: par(d).degeneracao,
    indices: { aprimoramento: a, degeneracao: d },
    subtabelas: {
      aprimoramento: SUBTABELA[a]?.aprimoramento ?? null,
      degeneracao: SUBTABELA[d]?.degeneracao ?? null,
    },
    tentativas,
  };
}

// ── O SELETOR DA FICHA ──────────────────────────────────────────────────────
//
// O OD2 tem `variable_construction` na race_ability: declare `choices_count` e
// `available_options`, e a aba Raça da ficha desenha um dropdown, mostra a
// descrição da opção escolhida e ainda oferece "Personalizado". A escolha fica
// gravada em `actor.system.variable_construction_selections`.
//
// DUAS RENDERIZAÇÕES, UMA FONTE. Os mesmos PARES viram (a) as vinte habilidades
// soltas do compêndio, com Genótipo/Fenótipo/Funcionamento em HTML, e (b) as
// opções do dropdown. O sistema passa a descrição da opção por
// `escapeExpression` — HTML sairia como texto literal na tela —, então aqui só
// entra TEXTO PURO.
//
// AS QUATRO COM SUBTABELA JÁ VÊM ABERTAS nas seis variantes. Assim o jogador
// escolhe "8. Atributo Ampliado — Constituição +3" de uma vez, em vez de rolar
// 1d10 e depois 1d6. Quem preferir rolar continua achando pelo número.

import { NOME, ondeAnotarTexto } from "./onde-anotar.mjs";

const slug = (s) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
   .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const SUB_DO_LADO = {
  aprimoramento: { "Atributo Ampliado": T2_2, "Sentido Ampliado": T2_3 },
  degeneracao: { "Atributo Diminuído": T2_4, "Sentido Diminuído": T2_5 },
};

/** As opções do dropdown para um lado do balanço genético. */
export function opcoesDe(lado) {
  const out = [];
  for (const p of PARES) {
    const m = p[lado];
    const n = String(p.indice).padStart(2, "0");
    const sub = SUB_DO_LADO[lado][m.nome];

    if (!sub) {
      out.push({
        key: `${n}-${slug(m.nome)}`,
        name: `${p.indice}. ${m.nome}`,
        description: m.funcionamento,
      });
      continue;
    }
    for (const l of sub) {
      const rotulo = l.atributo
        ? `${NOME[l.atributo]} ${l.ajuste > 0 ? "+" : ""}${l.ajuste}`
        : l.sentido;
      const detalhe = l.atributo
        ? `${l.fenotipo}. ${l.ajuste > 0 ? "+" : ""}${l.ajuste} em ${ondeAnotarTexto(l.atributo)}.`
        : `${l.fenotipo}. ${l.funcionamento}`;
      out.push({
        key: `${n}-${slug(rotulo)}`,
        name: `${p.indice}. ${m.nome} — ${rotulo}`,
        description: detalhe,
      });
    }
  }
  return out;
}
