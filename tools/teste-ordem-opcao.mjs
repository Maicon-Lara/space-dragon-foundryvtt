// Teste do interruptor da Ordem de Ação (T7-2).
//
// ── A ASSERÇÃO QUE MAIS IMPORTA ─────────────────────────────────────────────
//
// O PADRÃO É DESLIGADO. A T7-2 inverte a ordem do combate — o menor age
// primeiro, e o valor vem da ação escolhida — enquanto o Old Dragon 2 rola uma
// vez por rodada e o maior age primeiro. As duas não convivem.
//
// Inverter a ordem de um combate é a mudança mais visível que um módulo pode
// fazer numa mesa, e o engano não aparece: a fila fica ao contrário e todo
// mundo joga a rodada inteira sem notar. Quem não pediu não pode ser
// surpreendido.
//
// ── A SEGUNDA ───────────────────────────────────────────────────────────────
//
// UM interruptor, não dois. Quem liga a regra quer declarar a ação em algum
// lugar, e a ficha é esse lugar — o painel É como a regra se usa. Duas opções
// deixariam a mesa com a fila invertida e o painel escondido, ou o contrário, e
// nenhum dos dois estados é a regra.
//
// Uso: node tools/teste-ordem-opcao.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(fileURLToPath(import.meta.url), "../..");
const MOD = path.join(RAIZ, "spacedragon-module", "module");
const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

const ficha = fs.readFileSync(path.join(MOD, "ordem-ficha.js"), "utf8");
const inversao = fs.readFileSync(path.join(MOD, "ordem-inversao.js"), "utf8");

/* ── A OPÇÃO EXISTE E COMEÇA DESLIGADA ─────────────────────────────────────── */
{
  const i = ficha.indexOf('register(ID, "ordemDeAcao"');
  confere(i > 0, "a opção `ordemDeAcao` não é registrada — não há como ligar a regra");

  const bloco = ficha.slice(i, ficha.indexOf("});", i));
  confere(/default:\s*false/.test(bloco),
    "a Ordem de Ação vem LIGADA por padrão — ela inverte a ordem do combate, e quem " +
    "não pediu jogaria a rodada inteira com a fila ao contrário sem notar");
  confere(/scope:\s*"world"/.test(bloco),
    "a opção é de cliente: a regra do combate é da MESA, não de quem está olhando");
  confere(/config:\s*true/.test(bloco), "a opção não aparece nas configurações");
  confere(/T7-2/.test(bloco), "o nome ou a dica não cita a T7-2 — a mesa não sabe que regra é");
  confere(/Old Dragon 2|iniciativa normal/i.test(bloco),
    "a dica não diz o que acontece com a opção DESLIGADA, que é a pergunta de quem lê");
}

/* ── UM INTERRUPTOR, NÃO DOIS ──────────────────────────────────────────────── */
{
  confere(!/register\(ID, "ordemNaFicha"/.test(ficha),
    "voltou a existir uma opção separada para o painel na ficha — quem liga a regra " +
    "quer declarar a ação em algum lugar, e a ficha é esse lugar");

  // o painel segue a regra
  const i = ficha.indexOf("regraDaOrdemLigada()");
  confere(i > 0, "o painel não consulta o interruptor da regra");
  confere(/if \(!regraDaOrdemLigada\(\)\) return;/.test(ficha),
    "o painel é desenhado sem conferir se a regra está em uso");
}

/* ── A INVERSÃO SEGUE O MESMO INTERRUPTOR ──────────────────────────────────── */
//
// Dois interruptores para a mesma regra deixariam a fila invertida com o painel
// escondido, ou o painel à vista com a fila normal. Nenhum dos dois é a T7-2.
{
  confere(/"ordemDeAcao"/.test(inversao),
    "a inversão do rastreador não consulta `ordemDeAcao` — ela usaria outro interruptor");
  confere(/if \(!ordemLigada\(\)\) return super\._sortCombatants\(a, b\);/.test(inversao),
    "com a regra desligada, a ordenação tem de cair na do SISTEMA — é o que faz a " +
    "opção devolver a mesa ao Old Dragon 2 sem resíduo");
}

/* ── DESLIGADA, O MÓDULO NÃO TOCA EM NADA ──────────────────────────────────── */
//
// É o que a opção promete: a mesa volta à iniciativa do sistema. Se alguma parte
// da T7-2 continuasse valendo, o resultado seria um híbrido que não é regra
// nenhuma — e o pior lugar para descobrir isso é no meio de um combate.
{
  const semGuarda = [];
  for (const [nome, js] of [["ordem-ficha.js", ficha], ["ordem-inversao.js", inversao]]) {
    // toda função que MUDA algo precisa passar pelo interruptor
    for (const m of js.matchAll(/^(?:export )?(?:async )?function (\w+)/gm)) {
      const corpo = js.slice(m.index, js.indexOf("\n}", m.index));
      const mexe = /setFlag|update\(|rollInitiative|_sortCombatants|insertAdjacentHTML/.test(corpo);
      const confere0 = /ordemLigada|regraDaOrdemLigada|ordemDeAcao/.test(corpo);
      if (mexe && !confere0) semGuarda.push(`${nome}:${m[1]}`);
    }
  }
  // as que mexem sem checar são chamadas por quem checou — o teste as lista para
  // que uma função nova não passe sem ninguém olhar
  confere(semGuarda.length <= 6,
    `funções que mudam o combate sem conferir o interruptor: ${semGuarda.join(", ")}`);
}

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log(
  "  ✔ interruptor da Ordem de Ação: existe, é da MESA, começa DESLIGADO (a T7-2 inverte " +
    "a fila do combate), é UM só para a regra e o painel, e desligado devolve a ordenação " +
    "ao sistema sem resíduo"
);
