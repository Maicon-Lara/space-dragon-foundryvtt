/**
 * Ficha da espécie.
 *
 * Os traços são um array dentro do próprio item, e não itens embutidos. É a
 * escolha certa aqui porque um traço de espécie não existe sozinho: "Corpo
 * Robótico" fora do Androide não quer dizer nada, e não faz sentido arrastá-lo
 * para outra ficha.
 *
 * As mutações do Mutante são o caso oposto — o jogador SORTEIA duas de uma
 * lista de vinte — e por isso serão itens próprios, não traços.
 */

import { ATRIBUTOS, ROTULOS } from "./atributos.mjs";

const { ItemSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

export class FichaEspecie extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["spacedragon", "ficha", "especie"],
    position: { width: 520, height: 640 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: {
      adicionarTraco: FichaEspecie.#adicionarTraco,
      removerTraco: FichaEspecie.#removerTraco,
    },
  };

  static PARTS = {
    corpo: { template: "systems/spacedragon/templates/especie.hbs" },
  };

  async _prepareContext(options) {
    const ctx = await super._prepareContext(options);
    ctx.item = this.item;
    ctx.system = this.item.system;
    ctx.schemaDescricao = this.item.system.schema.getField("descricao");
    ctx.atributos = ATRIBUTOS.map((chave) => ({
      chave,
      nome: ROTULOS[chave].nome,
      sigla: ROTULOS[chave].sigla,
      valor: this.item.system.ajustes[chave],
    }));
    return ctx;
  }

  static async #adicionarTraco() {
    const tracos = [...this.item.system.tracos, { nome: "", desc: "" }];
    await this.item.update({ "system.tracos": tracos });
  }

  static async #removerTraco(event, alvo) {
    const i = Number(alvo.dataset.indice);
    const tracos = this.item.system.tracos.filter((_, j) => j !== i);
    await this.item.update({ "system.tracos": tracos });
  }
}
