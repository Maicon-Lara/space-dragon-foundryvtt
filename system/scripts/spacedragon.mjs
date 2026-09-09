/**
 * Ponto de entrada do sistema Space Dragon.
 *
 * Registra os modelos de dados, a ficha e os poucos helpers de Handlebars que a
 * ficha usa. Nada de lógica de regra aqui — regra mora em modelos.mjs (o que se
 * calcula) e em atributos.mjs (as tabelas do livro).
 */

import { PersonagemModel, CriaturaModel } from "./modelos.mjs";
import { EspecieModel, HabilidadeModel } from "./modelos-item.mjs";
import { FichaPersonagem } from "./ficha-personagem.mjs";
import { FichaEspecie } from "./ficha-especie.mjs";
import { ATRIBUTOS, ROTULOS, TABELAS, tabela, faixaDe } from "./atributos.mjs";

Hooks.once("init", () => {
  console.log("Space Dragon | iniciando");

  CONFIG.Actor.dataModels.personagem = PersonagemModel;
  CONFIG.Actor.dataModels.criatura = CriaturaModel;
  CONFIG.Item.dataModels.especie = EspecieModel;
  CONFIG.Item.dataModels.habilidade = HabilidadeModel;

  const { Actors } = foundry.documents.collections;
  Actors.unregisterSheet("core", foundry.appv1?.sheets?.ActorSheet ?? ActorSheet);
  Actors.registerSheet("spacedragon", FichaPersonagem, {
    types: ["personagem"],
    makeDefault: true,
    label: "Ficha de Personagem",
  });

  const { Items } = foundry.documents.collections;
  Items.unregisterSheet("core", foundry.appv1?.sheets?.ItemSheet ?? ItemSheet);
  Items.registerSheet("spacedragon", FichaEspecie, {
    types: ["especie"],
    makeDefault: true,
    label: "Ficha de Espécie",
  });

  // `sinal` existe porque um modificador sem o "+" mente: "2" e "+2" são a
  // mesma coisa para o sistema e coisas diferentes para quem lê a ficha.
  Handlebars.registerHelper("sinal", (n) => (Number(n) > 0 ? `+${n}` : `${n}`));
  Handlebars.registerHelper("eq", (a, b) => a === b);
  Handlebars.registerHelper("checked", (v) => (v ? "checked" : ""));

  // As tabelas ficam acessíveis para macros e para conferência na mesa.
  game.spacedragon = { ATRIBUTOS, ROTULOS, TABELAS, tabela, faixaDe };
});

Hooks.once("ready", () => {
  console.log("Space Dragon | pronto");
});
