/**
 * Modelos de dados dos itens.
 *
 * A espécie é o primeiro, e é o mais interessante: ela não é decoração, ela
 * MEXE nos atributos, e a ficha tem de refletir isso sem que ninguém some nada
 * à mão.
 */

import { ATRIBUTOS } from "./atributos.mjs";

const { NumberField, StringField, SchemaField, HTMLField, BooleanField, ArrayField } = foundry.data.fields;

/**
 * Espécie (Capítulo 2).
 *
 * ── POR QUE O AJUSTE É EDITÁVEL, E NÃO FIXO NO COMPÊNDIO ───────────────────
 *
 * As três espécies do livro tratam o ajuste de atributo de maneiras diferentes:
 *
 *   · Androide  +2 Força e -2 Comunicação — FIXO, o livro diz quais.
 *   · Humano    +2 em um atributo À ESCOLHA e -2 em outro — o jogador decide.
 *   · Mutante   NÃO tem esse bônus. O livro é explícito: o Homo novus é igual
 *               ao Homo sapiens "exceto o bônus natural de +2 em um atributo e
 *               a penalidade de -2 em outro, e o incremento a cada 4 níveis".
 *
 * Um campo fixo serviria só ao Androide. Por isso `ajustes` é editável na ficha
 * do item: o compêndio entrega o Androide já preenchido, e o jogador de Humano
 * preenche a escolha dele no próprio item.
 */
export class EspecieModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const ajustes = {};
    for (const a of ATRIBUTOS) ajustes[a] = new NumberField({ required: true, integer: true, initial: 0 });

    return {
      ajustes: new SchemaField(ajustes),

      /** Quantos pontos o jogador escolhe livremente (Humano: um +2 e um -2). */
      escolhaLivre: new BooleanField({ required: true, initial: false }),

      /**
       * De quantos em quantos níveis a espécie aumenta um atributo em 1.
       * Humano: 4. Androide e Mutante: 0, ou seja, nunca.
       */
      incrementoCadaNiveis: new NumberField({ required: true, integer: true, initial: 0, min: 0 }),

      maturidade: new StringField({ required: true, initial: "" }),
      expectativa: new StringField({ required: true, initial: "" }),
      descricao: new HTMLField({ required: true, initial: "" }),

      /** Os traços mecânicos: Corpo Robótico, Cérebro Positrônico, etc. */
      tracos: new ArrayField(
        new SchemaField({
          nome: new StringField({ required: true, initial: "" }),
          desc: new HTMLField({ required: true, initial: "" }),
        }),
        { initial: [] }
      ),
    };
  }

  /** Só os ajustes diferentes de zero, para a ficha resumir sem poluir. */
  get ajustesAtivos() {
    return ATRIBUTOS
      .filter((a) => this.ajustes[a] !== 0)
      .map((a) => ({ atributo: a, valor: this.ajustes[a] }));
  }
}

/** Traço, mutação, habilidade de classe — tudo que é "uma linha de regra". */
export class HabilidadeModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      // O livro apresenta toda mutação em três campos, e vale preservar a
      // forma: ela separa o que o corpo FEZ do que APARECE e do que a mesa ROLA.
      genotipo: new StringField({ required: true, initial: "" }),
      fenotipo: new StringField({ required: true, initial: "" }),
      funcionamento: new HTMLField({ required: true, initial: "" }),

      /** "aprimoramento" | "degeneracao" | "" para habilidade comum. */
      tipoMutacao: new StringField({ required: true, initial: "" }),
      /** A posição na T2-1, que é o que o 1d10 sorteia. */
      indiceT21: new NumberField({ required: false, integer: true, nullable: true, initial: null }),
    };
  }
}
