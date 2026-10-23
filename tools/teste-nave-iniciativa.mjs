/**
 * A iniciativa da nave, que não tem atributo nenhum.
 *
 * ── O QUE ESTE TESTE GARANTE ────────────────────────────────────────────────
 *
 *   · na Ordem de Ação do módulo, a nave declara pela T10-6: disparo vale o
 *     dano da arma, equipamento vale o BA, manobra vale a JP — e nenhuma opção
 *     pede Destreza;
 *   · o valor fixo da T10-6 não se rola e não aparece no formulário da macro,
 *     que é de personagens;
 *   · na iniciativa padrão do OD2, a nave recebe na memória a Destreza e a
 *     Sabedoria de quem está no Leme, ou 10 sem piloto com ficha — e o
 *     personagem ao lado não é tocado;
 *   · os ganchos entram no `init`, antes dos do sistema.
 *
 *     node tools/teste-nave-iniciativa.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { opcoesDeOrdem, opcoesDaNave } from "../spacedragon-module/module/ordem-ficha.js";
import { MODOS } from "../spacedragon-module/module/ordem.js";
import {
  atributosDaIniciativa, prepararNaves, nomeDoPiloto, PILOTO_MEDIANO,
} from "../spacedragon-module/module/nave-iniciativa.js";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

const arma = (id, nome, damage, type = "weapon") => ({ id, name: nome, type, system: { damage } });
const nave = (extra = {}) => ({
  name: "Falcão",
  flags: { spacedragon: { nave: { tipo: "particular", postos: { leme: "Rhea" }, ...extra } } },
  items: [arma("a1", "Disparadores Laser", "2d10"), arma("a2", "Canhões de Energia", "5d10")],
  system: { ba: 12, jpd_total: 16, destreza: 0, sabedoria: 0 },
});

/* ── A T10-6 na Ordem de Ação ─────────────────────────────────────────────── */
{
  const n = nave();
  const lista = opcoesDeOrdem(n);
  const por = (chave) => lista.find((l) => l.chave === chave);
  // as 2 armas, o disparo genérico, o equipamento e a manobra
  confere(lista.length === 5, `a nave com 2 armas devia ter 5 opções, tem ${lista.length}`);
  confere(por("arma:a1")?.campo === "2d10" && por("arma:a1")?.modo === "ataque", "disparar os disparadores devia rolar 2d10");
  confere(por("equipamento")?.modo === "fixo" && por("equipamento")?.campo === "12", "ativar equipamento devia valer o BA da nave (12)");
  confere(por("manobra")?.modo === "fixo" && por("manobra")?.campo === "16", "a manobra devia valer a JP da nave (16)");
  confere(!lista.some((l) => l.modo === "movimento"), "a nave não devia ter opção que pede Destreza");
  confere(JSON.stringify(opcoesDaNave(n)) === JSON.stringify(lista), "opcoesDeOrdem da nave devia ser opcoesDaNave");

  const personagem = { name: "Rhea", flags: {}, items: [arma("p1", "Pistola Laser", "1d6")], system: { mod_destreza: 2 } };
  const doPersonagem = opcoesDeOrdem(personagem);
  confere(doPersonagem.some((l) => l.modo === "movimento" && l.campo === "2"), "o personagem continua com a T7-2");
  confere(!doPersonagem.some((l) => l.modo === "fixo"), "o personagem não devia receber o valor fixo da nave");
}

/* ── O valor fixo ─────────────────────────────────────────────────────────── */
{
  const r = await MODOS.fixo.valor("16");
  confere(r.n === 16 && r.roll === null, "o valor fixo da T10-6 não se rola");
  const fonte = fs.readFileSync(path.join(RAIZ, "spacedragon-module", "module", "ordem.js"), "utf8");
  confere(/\.filter\(\(\[, m\]\) => !m\.soNave\)/.test(fonte), "o formulário da macro devia esconder o modo só de nave");
}

/* ── A iniciativa padrão do OD2: o piloto ─────────────────────────────────── */
{
  confere(JSON.stringify(atributosDaIniciativa({ name: "Rhea", system: { destreza: 15, sabedoria: 12 } }))
    === JSON.stringify({ destreza: 15, sabedoria: 12, piloto: "Rhea" }), "com piloto, os atributos são os dele");
  const sem = atributosDaIniciativa(null);
  confere(sem.destreza === PILOTO_MEDIANO && sem.sabedoria === PILOTO_MEDIANO && sem.piloto === null,
    "sem piloto, a nave testa contra o piloto mediano");
  confere(atributosDaIniciativa({ system: { destreza: 14, sabedoria: 0 } }).piloto === null,
    "piloto com atributo zerado não serve: o sistema daria 'inválido'");

  const n = nave();
  confere(nomeDoPiloto(n) === "Rhea", "o piloto é quem está no Leme");
  const rhea = { name: "Rhea", flags: {}, system: { destreza: 15, sabedoria: 12 } };
  const outro = { name: "Kael", flags: {}, system: { destreza: 9, sabedoria: 11 } };
  const feitos = prepararNaves([{ actor: n }, { actor: outro }], (nome) => (nome === "Rhea" ? rhea : null));
  confere(n.system.destreza === 15 && n.system.sabedoria === 12, "a nave devia receber os atributos do piloto");
  confere(outro.system.destreza === 9 && outro.system.sabedoria === 11, "o personagem ao lado não devia mudar");
  confere(feitos.length === 1 && feitos[0].piloto === "Rhea", "só a nave entra no relatório");

  const vazia = nave({ postos: {} });
  prepararNaves([{ actor: vazia }], () => null);
  confere(vazia.system.destreza === PILOTO_MEDIANO, "a nave sem ninguém no Leme testa contra 10");
}

/* ── Os ganchos entram no init ────────────────────────────────────────────── */
{
  const fonte = fs.readFileSync(path.join(RAIZ, "spacedragon-module", "module", "spacedragon.js"), "utf8");
  const init = fonte.slice(fonte.indexOf('Hooks.once("init"'), fonte.indexOf('Hooks.once("ready"'));
  confere(/ligarIniciativaDasNaves\(\);/.test(init), "a iniciativa das naves devia ser ligada no init, antes dos ganchos do sistema");
}

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log("  ✔ iniciativa da nave: T10-6 na Ordem de Ação, piloto na iniciativa padrão do OD2");
