/**
 * O caminho dos PV no Heartbeat e no Health Estimate (module/integracao-pv.js).
 *
 * O Heartbeat avisava "HP Data Path incorrect." porque lia
 * `system.attributes.hp.value`, e o OD2 guarda os PV em `system.hp`.
 *
 *     node tools/teste-integracao-pv.mjs
 */

import { ajustesHeartbeat, ajusteHealthEstimate, PV_OD2 } from "../spacedragon-module/module/integracao-pv.js";

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

/* ── Heartbeat ─────────────────────────────────────────────────────────── */
{
  // o padrão dele, que é o do D&D 5e
  const m = ajustesHeartbeat({ hpPath: "system.attributes.hp.value", maxhpPath: "system.attributes.hp.max", additionalActorTypes: "" });
  confere(m.hpPath === "system.hp.value", `hpPath saiu ${m.hpPath}`);
  confere(m.maxhpPath === "system.hp.max", `maxhpPath saiu ${m.maxhpPath}`);
  confere(m.additionalActorTypes === "monster", `os tipos saíram "${m.additionalActorTypes}"`);

  // já certo: nada a mudar
  const certo = ajustesHeartbeat({ hpPath: PV_OD2.hpPath, maxhpPath: PV_OD2.maxhpPath, additionalActorTypes: "Monster" });
  confere(Object.keys(certo).length === 0, `já configurado e ainda muda: ${JSON.stringify(certo)}`);

  // o caminho que o Mestre escolheu à mão é respeitado; os tipos dele ficam
  const mao = ajustesHeartbeat({ hpPath: "system.outro.value", maxhpPath: "system.outro.max", additionalActorTypes: "vehicle" });
  confere(!("hpPath" in mao) && !("maxhpPath" in mao), "um caminho escolhido pelo Mestre foi trocado");
  confere(mao.additionalActorTypes === "vehicle, monster", `os tipos do Mestre saíram "${mao.additionalActorTypes}"`);

  // o caminho tem de achar os PV num ator do OD2
  const ator = { system: { hp: { value: 7, max: 12 } } };
  const ler = (o, c) => c.split(".").reduce((a, k) => a?.[k], o);
  confere(ler(ator, m.hpPath) === 7 && ler(ator, m.maxhpPath) === 12, "o caminho não acha os PV de um ator do OD2");
}

/* ── Health Estimate ───────────────────────────────────────────────────── */
{
  confere(ajusteHealthEstimate("") === "actor.system.hp", "vazio devia virar actor.system.hp");
  confere(ajusteHealthEstimate("actor.system.attributes.hp") === "actor.system.hp", "o caminho do 5e não foi corrigido");
  confere(ajusteHealthEstimate("system.hp") === "actor.system.hp", "sem o `actor.` na frente não foi corrigido");
  confere(ajusteHealthEstimate("actor.system.hp") === null, "já certo e ainda muda");
  confere(ajusteHealthEstimate("actor.system.outro") === null, "um caminho escolhido pelo Mestre foi trocado");
  const token = { actor: { system: { hp: { value: 3, max: 9 } } } };
  const hp = "actor.system.hp".split(".").reduce((a, k) => a?.[k], token);
  confere(hp?.value === 3 && hp?.max === 9, "o caminho não acha o objeto de PV a partir do token");
}

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log("  ✔ PV: Heartbeat em system.hp.value/max com monster, Health Estimate em actor.system.hp, e o que o Mestre escolheu fica");
