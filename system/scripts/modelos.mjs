/**
 * Modelos de dados do Space Dragon.
 *
 * Tudo o que é DERIVADO — modificadores, CP, BA, JP, carga, idiomas — se
 * calcula aqui, em `prepareDerivedData`, e nunca se guarda no banco. Guardar
 * derivado é como um número na ficha fica velho quando a regra muda.
 *
 * O que o jogador digita: os seis atributos, o nível, os PV atuais, a proteção
 * das vestes e os bônus avulsos. O resto sai das tabelas do Capítulo 1.
 */

import { ATRIBUTOS, tabela } from "./atributos.mjs";

const { NumberField, StringField, SchemaField, HTMLField, ArrayField } = foundry.data.fields;

/** Um atributo: o valor rolado, e um espaço para o ajuste da espécie. */
const campoAtributo = () =>
  new SchemaField({
    valor: new NumberField({ required: true, integer: true, initial: 10, min: 1, max: 29 }),
    ajuste: new NumberField({ required: true, integer: true, initial: 0 }),
  });

/**
 * T4-1: bônus de CP por nível.
 *
 * NÃO é cumulativo — o valor é o bônus TOTAL de quem está naquela faixa, e o
 * livro diz isso com todas as letras. As faixas são de quatro níveis, mas
 * começam em 1-3: no 1º nível não há bônus nenhum, como o exemplo trabalhado
 * do livro demonstra (vestes 12 + Destreza 13 = CP 13, sem soma de nível).
 */
function bonusCPporNivel(nivel) {
  if (nivel >= 20) return 5;
  if (nivel >= 16) return 4;
  if (nivel >= 12) return 3;
  if (nivel >= 8) return 2;
  if (nivel >= 4) return 1;
  return 0;   // 1-3
}

export class PersonagemModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const atributos = {};
    for (const a of ATRIBUTOS) atributos[a] = campoAtributo();

    return {
      atributos: new SchemaField(atributos),

      nivel: new NumberField({ required: true, integer: true, initial: 1, min: 1 }),
      xp: new NumberField({ required: true, integer: true, initial: 0, min: 0 }),

      pv: new SchemaField({
        value: new NumberField({ required: true, integer: true, initial: 4 }),
        max: new NumberField({ required: true, integer: true, initial: 4, min: 0 }),
      }),

      // Base de ataque e de JP vêm da CLASSE. Enquanto não há item de classe
      // no compêndio, ficam editáveis à mão para a ficha já servir na mesa.
      base: new SchemaField({
        ataque: new NumberField({ required: true, integer: true, initial: 0 }),
        // UM valor de JP, e não três. O livro: "igual ou superior ao indicado
        // como valor da jogada de proteção NA TABELA DA CLASSE" — singular. O
        // que muda entre JPR, JPF e JPM é só qual atributo modifica a rolagem,
        // e a ficha oficial confirma: um campo "JP" e três ajustes.
        jp: new NumberField({ required: true, integer: true, initial: 15 }),
      }),

      vestes: new SchemaField({
        nome: new StringField({ required: true, initial: "" }),
        protecao: new NumberField({ required: true, integer: true, initial: 10, min: 0 }),
      }),

      /** Aparatos, mutações e poderes entram aqui até virarem itens. */
      extras: new SchemaField({
        // A ficha oficial separa o escudo dos demais ajustes de CP, e vale
        // manter: escudo se larga e se pega no meio do combate.
        escudo: new NumberField({ required: true, integer: true, initial: 0 }),
        cp: new NumberField({ required: true, integer: true, initial: 0 }),
        ataqueCorpo: new NumberField({ required: true, integer: true, initial: 0 }),
        ataqueDistancia: new NumberField({ required: true, integer: true, initial: 0 }),
      }),

      afiliacao: new StringField({
        required: true, initial: "neutralidade",
        choices: ["lealdade", "neutralidade", "rebeldia"],
      }),

      idiomas: new ArrayField(new StringField(), { initial: [] }),
      dvClasse: new StringField({ required: true, initial: "d4" }),
      notas: new HTMLField({ required: true, initial: "" }),
    };
  }

  prepareDerivedData() {
    const a = this.atributos;

    // ── a espécie ───────────────────────────────────────────────
    // O ajuste vem do ITEM, não de um campo digitado — assim trocar a espécie
    // troca os números da ficha inteira sozinho, até o CP e o BA.
    this.especie = this.parent?.items?.find((i) => i.type === "especie") ?? null;
    const daEspecie = this.especie?.system?.ajustes ?? null;

    // ── os seis atributos ───────────────────────────────────────
    // total = rolado + ajuste da espécie + ajuste avulso (mutação, aparato)
    for (const chave of ATRIBUTOS) {
      const at = a[chave];
      at.daEspecie = daEspecie?.[chave] ?? 0;
      at.total = at.valor + at.daEspecie + at.ajuste;
      at.linha = tabela(chave, at.total);   // a linha inteira da tabela T1-x
    }

    // ── Coeficiente de Proteção (4.2) ─────────────────────────────────────
    // vestes + ajuste de Destreza + bônus por nível + aparatos/mutações/poderes
    this.bonusNivelCP = bonusCPporNivel(this.nivel);
    this.cp = this.vestes.protecao
            + a.destreza.linha.ataque
            + this.bonusNivelCP
            + this.extras.escudo
            + this.extras.cp;

    // ── Bônus de Ataque (4.3) ─────────────────────────────────────────────
    // Corpo-a-corpo usa FORÇA; à distância usa DESTREZA. É a única diferença
    // entre os dois, e é o que o exemplo do livro demonstra.
    this.ba = {
      corpo: this.base.ataque + a.forca.linha.ataque + this.extras.ataqueCorpo,
      distancia: this.base.ataque + a.destreza.linha.ataque + this.extras.ataqueDistancia,
    };

    // ── Jogadas de Proteção (4.4) ─────────────────────────────────────────
    // Cada uma tem o seu atributo, e não são intercambiáveis.
    this.jp = {
      base: this.base.jp,
      reflexos: { base: this.base.jp, mod: a.destreza.linha.ataque },
      fisica: { base: this.base.jp, mod: a.constituicao.linha.pv },
      mental: { base: this.base.jp, mod: a.intelecto.linha.protecaoMental },
    };

    // ── Constituição: onde a morte acontece (T1-3) ────────────────────────
    this.pvMortais = a.constituicao.linha.mortais;

    // ── Carga (T1-1) ──────────────────────────────────────────────────────
    const [leve, media, pesada] = a.forca.linha.carga;
    this.carga = { leve, media, pesada };

    // ── Idiomas (4.5) ─────────────────────────────────────────────────────
    // Dois de graça: a língua do planeta natal e o idioma espacial. Comunicação
    // até 6 é ANALFABETO — sabe falar, não sabe ler nem escrever.
    this.idiomasAdicionais = a.comunicacao.linha.idiomas;
    this.analfabeto = a.comunicacao.total <= 6;

    this.seguidores = a.comunicacao.linha.seguidores;
    this.reacao = a.comunicacao.linha.reacao;

    // ── incremento de atributo por nível (2.1) ───────────────────────
    // Só o Humano tem: +1 num atributo a cada 4 níveis. A ficha conta quantos
    // pontos já foram ganhos, mas NÃO os distribui — quem escolhe é o jogador,
    // e ele lança a escolha no ajuste avulso.
    const cada = this.especie?.system?.incrementoCadaNiveis ?? 0;
    this.incrementosGanhos = cada > 0 ? Math.floor(this.nivel / cada) : 0;
  }
}

export class CriaturaModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      pv: new SchemaField({
        value: new NumberField({ required: true, integer: true, initial: 1 }),
        max: new NumberField({ required: true, integer: true, initial: 1, min: 0 }),
      }),
      dv: new StringField({ required: true, initial: "1" }),
      cp: new NumberField({ required: true, integer: true, initial: 10 }),
      ba: new NumberField({ required: true, integer: true, initial: 0 }),
      moral: new NumberField({ required: true, integer: true, initial: 7 }),
      xp: new NumberField({ required: true, integer: true, initial: 0 }),
      descricao: new HTMLField({ required: true, initial: "" }),
    };
  }
}
