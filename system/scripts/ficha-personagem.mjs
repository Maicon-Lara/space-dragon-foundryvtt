/**
 * Ficha do personagem.
 *
 * ApplicationV2, que é o que o Foundry 13 espera. O modelo já calculou tudo em
 * `prepareDerivedData`; aqui só se ARRUMA para a tela e se ligam as rolagens.
 *
 * As três rolagens do sistema, e por que são três e não uma:
 *   · teste de atributo — 1d20 contra o próprio valor, sucesso em MENOR ou igual
 *   · ataque            — 1d20 + BA contra o CP do alvo, sucesso em MAIOR ou igual
 *   · jogada de proteção— 1d20 + mod contra o valor da classe, MAIOR ou igual
 *
 * O sentido da comparação inverte entre a primeira e as outras duas. Trocar isso
 * é o erro mais fácil de cometer e o mais difícil de perceber na mesa.
 */

import { ATRIBUTOS, ROTULOS } from "./atributos.mjs";

const { ActorSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

/** O que cada atributo mostra embaixo do número. Sai direto das tabelas T1-x. */
const DERIVADOS = {
  forca: [
    { campo: "ataque", rotulo: "atq", sinal: true, titulo: "Ajuste de ataque e dano corpo-a-corpo" },
    { campo: "subjugar", rotulo: "subj", sufixo: "%", sinal: true, titulo: "Subjugar (cosmonauta)" },
  ],
  destreza: [
    { campo: "ataque", rotulo: "atq", sinal: true, titulo: "Ajuste de ataque à distância e proteção" },
    { campo: "furtividade", rotulo: "furt", sufixo: "%", sinal: true, titulo: "Furtividade, furtar e desarmar" },
  ],
  constituicao: [
    { campo: "pv", rotulo: "PV", sinal: true, titulo: "Ajuste de pontos de vida e proteção" },
    { campo: "clonagem", rotulo: "clone", sufixo: "%", titulo: "Probabilidade de clonagem bem-sucedida" },
  ],
  intelecto: [
    { campo: "protecaoMental", rotulo: "JPM", sinal: true, titulo: "Proteção mental" },
    { campo: "poderMental", rotulo: "poder", sufixo: "%", titulo: "Realizar e aprender poder mental" },
  ],
  ciencia: [
    { campo: "aptidao", rotulo: "apt", sufixo: "%", sinal: true, titulo: "Aptidão tecnológica" },
    { campo: "robos", rotulo: "robôs", titulo: "Quantidade de robôs desativados" },
  ],
  comunicacao: [
    { campo: "reacao", rotulo: "reação", sufixo: "%", sinal: true, titulo: "Ajuste de reação" },
    { campo: "seguidores", rotulo: "seg", titulo: "Número máximo de seguidores" },
  ],
};

const JPS = [
  { chave: "reflexos", sigla: "JPR", campoBase: "jpr", origem: "modificador de Destreza",
    titulo: "Reflexos — esquivar de explosões, desmoronamentos" },
  { chave: "fisica", sigla: "JPF", campoBase: "jpf", origem: "modificador de Constituição",
    titulo: "Física — infecções, venenos, o que debilita o corpo" },
  { chave: "mental", sigla: "JPM", campoBase: "jpm", origem: "proteção mental do Intelecto",
    titulo: "Mental — resistir a poderes mentais" },
];

const AFILIACOES = { lealdade: "Lealdade", neutralidade: "Neutralidade", rebeldia: "Rebeldia" };

const sinalDe = (n) => (n > 0 ? `+${n}` : `${n}`);

export class FichaPersonagem extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["spacedragon", "ficha", "personagem"],
    position: { width: 720, height: 780 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: {
      testarAtributo: FichaPersonagem.#testarAtributo,
      atacar: FichaPersonagem.#atacar,
      rolarJP: FichaPersonagem.#rolarJP,
    },
  };

  static PARTS = {
    corpo: { template: "systems/spacedragon/templates/personagem.hbs" },
  };

  async _prepareContext(options) {
    const ctx = await super._prepareContext(options);
    const sys = this.actor.system;

    ctx.actor = this.actor;
    ctx.system = sys;
    ctx.afiliacoes = AFILIACOES;
    ctx.schemaNotas = sys.schema.getField("notas");

    ctx.atributos = ATRIBUTOS.map((chave) => {
      const at = sys.atributos[chave];
      return {
        chave,
        nome: ROTULOS[chave].nome,
        sigla: ROTULOS[chave].sigla,
        valor: at.valor,
        // O que a ficha mostra ao lado do número é TUDO que se soma a ele:
        // a espécie mais o ajuste avulso. Mostrar só um dos dois faria a conta
        // do total parecer errada.
        ajuste: at.daEspecie + at.ajuste,
        total: at.total,
        derivados: DERIVADOS[chave].map((d) => {
          const bruto = at.linha[d.campo];
          const txt = d.sinal && typeof bruto === "number" ? sinalDe(bruto) : String(bruto);
          return { rotulo: d.rotulo, valor: txt + (d.sufixo ?? ""), titulo: d.titulo };
        }),
      };
    });

    ctx.jps = JPS.map((jp) => ({ ...jp, base: sys.jp[jp.chave].base, mod: sys.jp[jp.chave].mod }));

    // A espécie sai do modelo (que a achou entre os itens), não de uma busca
    // repetida aqui — uma fonte só, e a ficha nunca discorda do cálculo.
    const esp = sys.especie;
    ctx.especie = esp
      ? {
          nome: esp.name,
          ajustes: esp.system.ajustesAtivos.map(({ atributo, valor }) => ({
            valor, sigla: ROTULOS[atributo].sigla, nome: ROTULOS[atributo].nome,
          })),
        }
      : null;

    return ctx;
  }

  // ── Rolagens ──────────────────────────────────────────────────────────────

  /**
   * Teste de atributo: 1d20, e o sucesso é rolar IGUAL OU MENOR que o atributo.
   * É o oposto de ataque e JP, e por isso vive numa função separada em vez de
   * um parâmetro — para ninguém trocar o sinal sem perceber.
   */
  static async #testarAtributo(event, alvo) {
    const chave = alvo.dataset.atributo;
    const at = this.actor.system.atributos[chave];
    const roll = await new Roll("1d20").evaluate();
    const passou = roll.total <= at.total;

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `Teste de <strong>${ROTULOS[chave].nome}</strong> — precisa ${at.total} ou menos` +
              ` · <strong>${passou ? "sucesso" : "falha"}</strong>`,
    });
  }

  /** Ataque: 1d20 + BA. Quem decide o acerto é o CP do alvo, na mesa. */
  static async #atacar(event, alvo) {
    const tipo = alvo.dataset.tipo;                       // "corpo" | "distancia"
    const ba = this.actor.system.ba[tipo];
    const roll = await new Roll("1d20 + @ba", { ba }).evaluate();
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `Ataque <strong>${tipo === "corpo" ? "corpo a corpo" : "à distância"}</strong>` +
              ` — precisa igualar ou superar o CP do alvo`,
    });
  }

  /** JP: 1d20 + modificador, contra o valor que a classe dá. */
  static async #rolarJP(event, alvo) {
    const chave = alvo.dataset.jp;
    const jp = this.actor.system.jp[chave];
    const def = JPS.find((j) => j.chave === chave);
    const roll = await new Roll("1d20 + @mod", { mod: jp.mod }).evaluate();
    const passou = roll.total >= jp.base;

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `<strong>${def.sigla}</strong> — precisa ${jp.base} ou mais` +
              ` · <strong>${passou ? "sucesso" : "falha"}</strong>`,
    });
  }
}
