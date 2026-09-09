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
  try {

    CONFIG.Actor.dataModels.personagem = PersonagemModel;
    CONFIG.Actor.dataModels.criatura = CriaturaModel;
    CONFIG.Item.dataModels.especie = EspecieModel;
    CONFIG.Item.dataModels.habilidade = HabilidadeModel;

    // `?? ActorSheet` era uma bomba: se o global não existir no v13, isso lança
    // ReferenceError AQUI, no init, e nada mais se registra — nem o modelo de
    // dados, nem a ficha. O ator cai na ficha padrão, que não calcula nada, e o
    // sintoma ("a ficha não tem os cálculos") não aponta para a causa.
    const desregistrar = (colecao, base) => {
    try { colecao.unregisterSheet("core", base); } catch (e) {
      console.warn("Space Dragon | não desregistrei a ficha padrão:", e.message);
    }
    };

    const { Actors } = foundry.documents.collections;
    desregistrar(Actors, foundry.appv1?.sheets?.ActorSheet ?? globalThis.ActorSheet);
    Actors.registerSheet("spacedragon", FichaPersonagem, {
    types: ["personagem"],
    makeDefault: true,
    label: "Ficha de Personagem",
    });

    const { Items } = foundry.documents.collections;
    desregistrar(Items, foundry.appv1?.sheets?.ItemSheet ?? globalThis.ItemSheet);
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
    console.log("Space Dragon | modelos e fichas registrados");
  } catch (e) {
    // Sem isto, um erro aqui deixa o sistema meio-carregado e silencioso.
    console.error("Space Dragon | FALHA NO INIT — as fichas vão abrir sem cálculo:", e);
    ui.notifications?.error("Space Dragon: falha ao iniciar o sistema. Veja o console (F12).");
  }
});

Hooks.once("ready", () => {
  console.log("Space Dragon | pronto");
});
