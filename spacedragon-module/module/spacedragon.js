/**
 * Space Dragon — módulo de conteúdo para o sistema Old Dragon 2.
 *
 * O módulo é de compêndios. Este script existe por um motivo só: o Space Dragon
 * resolve meia dúzia de coisas em 1d100 com sucesso no MENOR OU IGUAL, e o Old
 * Dragon 2 não tem essa comparação em lugar nenhum. Não é uma fórmula que dê
 * para escrever no campo de rolagem da ficha — é o sentido do teste que é
 * outro.
 *
 * Nada aqui toca em `system.*`. O módulo não inventa campo no sistema de outra
 * pessoa; lê o que a ficha tem, mostra o que leu, e deixa corrigir.
 */

import { abrirTeste, rolar, preparar, TESTES } from "./testes.js";

const ID = "spacedragon";

Hooks.once("ready", () => {
  // A API que a macro do compêndio chama. Fica aqui, e não dentro da macro,
  // para que atualizar o módulo atualize a regra: uma macro já arrastada para
  // a barra continua valendo, porque ela só chama isto.
  game.spacedragon = { teste: abrirTeste, rolar, preparar, TESTES };

  console.log(`${ID} | ${TESTES.length} testes de porcentagem prontos — game.spacedragon.teste()`);
});
