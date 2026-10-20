/**
 * Os envelopes do módulo sobre o código do sistema, todos pelo libWrapper.
 *
 * ── POR QUE NÃO `Object.defineProperty` DIRETO ──────────────────────────────
 *
 * O módulo troca getters do modelo de dados do personagem (os seis `mod_*`,
 * `ac_total`, as três JP, `class_abilities`), o `getData` da ficha do sistema
 * e o `rollInitiative` do combate. Cada troca guardava o original e o chamava
 * de volta — funciona, até o dia em que OUTRO módulo troca o mesmo getter do
 * mesmo jeito. Aí quem carrega por último vence, o original que ele guardou
 * é o NOSSO envelope ou o do sistema conforme a ordem de carga, e o resultado
 * depende de uma ordem que ninguém controla. O módulo de Star Wars, que vive
 * na mesma mesa, mexe exatamente nesses pontos.
 *
 * O libWrapper existe para isso: cada módulo registra o envelope dele, a
 * biblioteca encadeia todos na ordem certa, e um conflito de verdade vira
 * aviso na tela em vez de número errado na ficha.
 *
 * ── A SHIM ──────────────────────────────────────────────────────────────────
 *
 * Sem o libWrapper instalado entra a shim oficial (libwrapper-shim.js): a
 * mesma chamada, sem o encadeamento entre módulos e sem o aviso de conflito.
 * O módulo funciona nos dois casos; a diferença é a proteção.
 *
 * ── O QUE FICA DE FORA ──────────────────────────────────────────────────────
 *
 * A Ordem de Ação troca a CLASSE de Combate (ordem-inversao.js), e não um
 * método dela. Isso o libWrapper não cobre, e continua como está, com o aviso
 * próprio de quando outro módulo faz o mesmo.
 */

import { libWrapper } from "./libwrapper-shim.js";

const ID = "spacedragon";

/**
 * Registra `fn` como envelope de `alvo`, um caminho a partir do escopo global
 * (`CONFIG.Actor.dataModels.character.prototype.mod_forca`). Para getters, o
 * caminho é o da propriedade; o libWrapper percebe que é getter.
 *
 * `fn` recebe o original como primeiro argumento (`wrapped`) e decide se o
 * chama: é o tipo MIXED, o padrão, que serve tanto para "ajuste em cima do
 * sistema" quanto para "desvio só quando a opção está ligada".
 *
 * Devolve `true` se registrou. Em caso de erro — alvo inexistente, registro
 * em dobro — avisa no console e devolve `false`: o módulo segue sem aquele
 * ajuste, que é o que já acontecia quando o getter não era encontrado.
 */
export function envolver(alvo, fn, tipo = "MIXED") {
  const lw = libWrapper ?? globalThis.libWrapper;
  if (!lw) {
    console.warn(`${ID} | libWrapper (nem a shim) não está disponível — ${alvo} fica como no sistema`);
    return false;
  }
  try {
    lw.register(ID, alvo, fn, tipo);
    return true;
  } catch (e) {
    console.warn(`${ID} | não foi possível envolver ${alvo}`, e);
    return false;
  }
}

/** O caminho do protótipo do modelo de dados do personagem, como o libWrapper o lê. */
export const MODELO_PERSONAGEM = "CONFIG.Actor.dataModels.character.prototype";

/**
 * O caminho de um método da ficha do sistema, achada pelo NOME da classe no
 * registro do Foundry. O sistema não exporta `OD2CharacterSheet`; ela está em
 * `CONFIG.Actor.sheetClasses.character["olddragon2e.OD2CharacterSheet"]`, e o
 * libWrapper aceita a chave com ponto entre colchetes.
 *
 * Devolve null se a ficha não está registrada.
 */
export function caminhoDaFicha(tipo, nomeDaClasse, metodo) {
  const registro = CONFIG.Actor?.sheetClasses?.[tipo] ?? {};
  const chave = Object.keys(registro).find((k) => registro[k]?.cls?.name === nomeDaClasse);
  if (!chave) return null;
  return `CONFIG.Actor.sheetClasses.${tipo}['${chave.replace(/'/g, "\\'")}'].cls.prototype.${metodo}`;
}
