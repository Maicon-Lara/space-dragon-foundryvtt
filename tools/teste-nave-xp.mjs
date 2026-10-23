/**
 * A XP de nave abatida (regra da casa) no fim de combate do Qualidade de Vida.
 *
 * ── O QUE ESTE TESTE GARANTE ────────────────────────────────────────────────
 *
 *   · a tabela por tipo da T10-1, e o valor da ficha vencendo a tabela;
 *   · a nave inimiga entra nos derrotados; a dos jogadores, não;
 *   · quem recebe é a tripulação: os personagens do combate, os dos postos das
 *     naves dos jogadores e, sem ninguém, os personagens dos donos — nunca uma
 *     nave;
 *   · o cartão ganha as linhas das naves, o total certo e o botão de distribuir
 *     quando não o tinha, com o atributo que o Qualidade de Vida procura.
 *
 *     node tools/teste-nave-xp.mjs
 */

import {
  XP_POR_TIPO, xpDaNave, tipoDaNave, retratoDoCombate, premioComNaves, cartaoComNaves,
} from "../spacedragon-module/module/nave-xp.js";
import { TIPOS } from "../spacedragon-module/module/tipos-de-nave.js";

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

const nave = (id, nome, nave, { dono = false, pv = [0, 300] } = {}) => ({
  id, name: nome, type: "character", hasPlayerOwner: dono,
  flags: { spacedragon: { nave } }, system: { hp: { value: pv[0], max: pv[1] }, race: { name: "" } },
});
const pessoa = (id, nome) => ({ id, name: nome, type: "character", flags: {}, system: {} });

/* ── A tabela ─────────────────────────────────────────────────────────────── */
{
  confere(Object.keys(TIPOS).every((t) => XP_POR_TIPO[t] > 0), "todo tipo da T10-1 devia ter XP na tabela");
  confere(XP_POR_TIPO.caca === 405 && XP_POR_TIPO.cruzador === 2615 && XP_POR_TIPO.naveMae === 7250, "valores da tabela combinada");
  confere(xpDaNave({ tipo: "caca" }) === 405, "caça vale 405");
  confere(xpDaNave({ tipo: "caca", xp: 1000 }) === 1000, "o valor da ficha vence a tabela");
  confere(xpDaNave({ tipo: "caca", xp: 0 }) === 0, "o Mestre pode zerar uma nave na ficha");
  confere(xpDaNave({ tipo: "caca", xp: null }) === 405 && xpDaNave({ tipo: "caca", xp: "" }) === 405, "campo vazio volta à tabela");
  confere(tipoDaNave({}, "Cargueiro") === "cargueiro", "sem tipo gravado, o tipo vem do nome da raça");
  confere(xpDaNave({}, "Nave inventada") === 0, "nave sem tipo conhecido não vale XP");
}

/* ── O retrato do combate ─────────────────────────────────────────────────── */
{
  const rhea = pessoa("p1", "Rhea");
  const kael = pessoa("p2", "Kael");
  const nossa = nave("n1", "Falcão", { tipo: "particular", postos: { leme: "Rhea", artilharia: "Kael" } }, { dono: true });
  const pirata = nave("n2", "Corsário", { tipo: "caca" }, { pv: [-5, 50] });
  const pirata2 = nave("n3", "Corsário Pesado", { tipo: "escolta", xp: 700 });
  const atores = { Rhea: rhea, Kael: kael };
  const r = retratoDoCombate(
    [{ actor: nossa }, { actor: pirata, name: "Corsário 1" }, { actor: pirata2 }],
    { achar: (n) => atores[n] ?? null },
  );
  confere(r.inimigas.length === 2, `duas naves inimigas, achei ${r.inimigas.length}`);
  confere(r.inimigas[0].name === "Corsário 1" && r.inimigas[0].xp === 405 && r.inimigas[0].hp === -5,
    "a inimiga leva o nome do combatente, a XP do tipo e o PV");
  confere(r.inimigas[1].xp === 700, "a inimiga com valor na ficha usa o da ficha");
  confere(!r.inimigas.some((n) => n.name === "Falcão"), "a nave dos jogadores não é abatida por eles");
  confere(r.tripulacao.map((a) => a.name).join() === "Kael,Rhea", "quem recebe é a tripulação dos postos");

  const semPostos = nave("n4", "Vespa", { tipo: "caca", postos: {} }, { dono: true });
  const r2 = retratoDoCombate([{ actor: semPostos }, { actor: pirata }], { personagensDosDonos: () => [rhea] });
  confere(r2.tripulacao.map((a) => a.name).join() === "Rhea", "sem ninguém nos postos, recebem os personagens dos donos");

  const r3 = retratoDoCombate([{ actor: kael }, { actor: nossa }, { actor: pirata }], { achar: (n) => atores[n] ?? null });
  confere(r3.tripulacao.length === 2, "o personagem do combate e os dos postos, sem repetir");
}

/* ── O prêmio e o cartão ──────────────────────────────────────────────────── */
{
  // o cartão como o Qualidade de Vida o monta num combate só de naves
  const cartao = `
    <div class="od2ca-card od2ca-xp-summary">
      <div class="od2ca-title">Combate finalizado</div>
      <strong>Monstros participantes</strong>
      <ul><li>Nenhuma criatura derrotada com XP foi encontrada.</li></ul>
      <div class="od2ca-xp-total"><strong>XP total:</strong> 0 XP</div>

    </div>`;
  const premio = { combatName: "", creatures: [], totalXp: 0, recipients: [{ actorId: "n1", name: "Falcão" }] };
  const retrato = {
    inimigas: [{ name: "Corsário", xp: 405, hp: 0, maxHp: 50 }, { name: "Cruzador Imperial", xp: 2615, hp: -10, maxHp: 900 }],
    tripulacao: [pessoa("p1", "Rhea"), pessoa("p2", "Kael")],
  };
  const novo = premioComNaves(premio, retrato, (id) => id === "n1");
  confere(novo.totalXp === 3020, `total devia ser 3020, deu ${novo.totalXp}`);
  confere(!novo.recipients.some((r) => r.actorId === "n1"), "a nave não pode receber XP");
  confere(novo.recipients.length === 2, "Rhea e Kael recebem");
  confere(novo.creatures.length === 2, "as duas naves entram nos derrotados");

  const html = cartaoComNaves(cartao, novo, retrato.inimigas, false);
  confere(!html.includes("Nenhuma criatura derrotada"), "a linha de 'nenhuma criatura' devia sair");
  confere(html.includes("<strong>Corsário</strong>: 405 XP") && html.includes("2.615 XP"), "as naves deviam aparecer com a XP");
  confere(html.includes("3.020 XP"), "o total devia ser refeito");
  confere(html.includes('data-od2ca-action="distribute-xp"'), "o botão de distribuir devia aparecer");

  // com monstros já na lista, as naves se somam a eles
  const comMonstro = cartao.replace("<li>Nenhuma criatura derrotada com XP foi encontrada.</li>", "<li><strong>Zork</strong>: 37 XP</li>");
  const html2 = cartaoComNaves(comMonstro, { totalXp: 442, recipients: [{ actorId: "p1" }] }, [retrato.inimigas[0]], true);
  confere(html2.includes("Zork") && html2.includes("Corsário"), "o monstro fica e a nave entra");
  confere((html2.match(/data-od2ca-action="distribute-xp"/g) ?? []).length === 1, "um botão só");

  // sem ninguém para receber, não há botão
  const html3 = cartaoComNaves(cartao, { totalXp: 405, recipients: [] }, [retrato.inimigas[0]], false);
  confere(!html3.includes("distribute-xp"), "sem quem receba, o botão não devia aparecer");
}

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log("  ✔ XP de nave abatida: tabela da casa, tripulação recebe, cartão do Qualidade de Vida ajustado");
