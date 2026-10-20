/**
 * O aviso de versão do sistema (module/versao.js): compara major.minor, e só
 * avisa uma vez por versão. Ver o cabeçalho de versao.js para o porquê de ser
 * aviso, e não o `maximum` do manifesto.
 *
 *     node tools/teste-versao.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { alemDoVerificado, avisarVersaoDoSistema } from "../spacedragon-module/module/versao.js";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

for (const [atual, verificado, esperado] of [
  ["2.6.0", "2.6.0", false], ["2.6.3", "2.6.0", false], ["2.7.0", "2.6.0", true],
  ["3.0.0", "2.6.0", true], ["2.5.9", "2.6.0", false], ["2.10.0", "2.6.0", true], ["", "2.6.0", false],
]) {
  confere(alemDoVerificado(atual, verificado) === esperado,
    `${atual} contra ${verificado} deu ${alemDoVerificado(atual, verificado)}, esperava ${esperado}`);
}

// Um Foundry de brinquedo: Mestre, sistema 2.7.0, módulo conferido na 2.6.0.
const avisos = [];
const opcoes = new Map();
globalThis.ui = { notifications: { warn: (m) => avisos.push(m) } };
globalThis.game = {
  user: { isGM: true },
  system: { id: "olddragon2e", version: "2.7.0" },
  modules: new Map([["spacedragon", { relationships: { systems: new Set([{ id: "olddragon2e", compatibility: { verified: "2.6.0" } }]) } }]]),
  settings: { get: (m, k) => opcoes.get(k) ?? "", set: (m, k, v) => opcoes.set(k, v) },
};
confere(avisarVersaoDoSistema() === true && avisos.length === 1, "o Mestre não foi avisado da versão nova");
confere(avisarVersaoDoSistema() === false && avisos.length === 1, "avisou de novo a mesma versão");
globalThis.game.user.isGM = false;
globalThis.game.system.version = "2.8.0";
confere(avisarVersaoDoSistema() === false, "jogador não deve receber o aviso");

const manifesto = JSON.parse(fs.readFileSync(path.join(RAIZ, "spacedragon-module", "module.json"), "utf8"));
const od2 = manifesto.relationships.systems.find((s) => s.id === "olddragon2e");
confere(od2?.compatibility?.verified, "o manifesto não diz em que versão do sistema o módulo foi conferido");
confere(!od2?.compatibility?.maximum,
  "o manifesto ganhou `maximum` — ele DESLIGA o módulo quando o sistema atualiza; o aviso de versao.js faz o papel");

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log("  ✔ versão: avisa o Mestre uma vez quando o OD2 passa do major.minor conferido, e o manifesto não tem teto que desligue o módulo");
