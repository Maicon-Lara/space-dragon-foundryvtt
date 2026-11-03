/**
 * A convivência com os módulos que leem os PV: Heartbeat e Health Estimate.
 *
 * ── O PROBLEMA ──────────────────────────────────────────────────────────────
 *
 * Os dois procuram os PV no caminho do D&D 5e, `system.attributes.hp`. O Old
 * Dragon 2 os guarda em `system.hp` (`value` e `max`), e o Heartbeat não tem
 * predefinição para o `olddragon2e`: a cada mudança de PV ele avisava
 * "Heartbeat | HP Data Path incorrect." e não fazia nada.
 *
 * Ele também só reage a atores do tipo `character` e `npc`. No OD2 a criatura
 * é `monster`, que entra na lista de tipos adicionais. A nave do Space Dragon
 * é um `character` com PV em `system.hp`, e funciona sem nada a mais.
 *
 * ── O QUE ESTE ARQUIVO FAZ ──────────────────────────────────────────────────
 *
 * No `ready`, só para o Mestre, e só com o módulo ativo, ele acerta as opções
 * de mundo desses módulos. Um caminho que o Mestre JÁ trocou para outra coisa
 * é respeitado: só o padrão deles, que não serve aqui, é corrigido.
 *
 *   · Heartbeat: `hpPath` e `maxhpPath` relativos ao ATOR.
 *   · Health Estimate: `core.custom.FractionHP` relativo ao TOKEN, e aponta
 *     para o OBJETO (`actor.system.hp`), não para o `value`.
 */

import { t as txt } from "./i18n.js";

export const HEARTBEAT = "heartbeat";
export const HEALTH_ESTIMATE = "healthEstimate";

export const PV_OD2 = {
  hpPath: "system.hp.value",
  maxhpPath: "system.hp.max",
  tipos: ["monster"],
  // o Health Estimate lê a partir do token
  fracao: "actor.system.hp",
};

/** Os caminhos que não servem no OD2: o padrão deles, ou o que já foi tentado à mão. */
const ERRADOS_HEARTBEAT = new Set(["", "system.attributes.hp.value", "system.attributes.hp.max", "attributes.hp.value", "attributes.hp.max"]);
const ERRADOS_ESTIMATE = new Set([
  "system.attributes.hp", "actor.system.attributes.hp", "system.hp", "system.hp.value", "actor.system.hp.value",
]);

/**
 * O que trocar no Heartbeat, dadas as opções atuais. Devolve `{ chave: valor }`
 * só com o que muda; vazio quando já está certo.
 */
export function ajustesHeartbeat({ hpPath, maxhpPath, additionalActorTypes } = {}) {
  const mudar = {};
  if (ERRADOS_HEARTBEAT.has(String(hpPath ?? "").trim())) mudar.hpPath = PV_OD2.hpPath;
  if (ERRADOS_HEARTBEAT.has(String(maxhpPath ?? "").trim())) mudar.maxhpPath = PV_OD2.maxhpPath;

  const tipos = String(additionalActorTypes ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const faltam = PV_OD2.tipos.filter((t) => !tipos.map((s) => s.toLowerCase()).includes(t));
  if (faltam.length) mudar.additionalActorTypes = [...tipos, ...faltam].join(", ");
  return mudar;
}

/** O que trocar no Health Estimate: o caminho, ou `null` se já está certo. */
export function ajusteHealthEstimate(fracaoHP) {
  const atual = String(fracaoHP ?? "").trim();
  // vazio funciona (ele cai no `primaryTokenAttribute` do sistema, que é "hp"),
  // mas fica explícito para não depender disso
  return atual === "" || ERRADOS_ESTIMATE.has(atual) ? PV_OD2.fracao : null;
}

function opcao(modulo, chave) {
  try {
    return globalThis.game.settings.get(modulo, chave);
  } catch {
    return undefined; // a opção não existe nesta versão do módulo
  }
}

async function gravar(modulo, mudancas) {
  for (const [chave, valor] of Object.entries(mudancas)) {
    await globalThis.game.settings.set(modulo, chave, valor);
  }
}

async function acertarHeartbeat() {
  const mudar = ajustesHeartbeat({
    hpPath: opcao(HEARTBEAT, "hpPath"),
    maxhpPath: opcao(HEARTBEAT, "maxhpPath"),
    additionalActorTypes: opcao(HEARTBEAT, "additionalActorTypes"),
  });
  // A janela de "Heartbeat Configuration" que ele abre para sistema sem
  // predefinição grava os tipos marcados por cima dos nossos, e nenhum vem
  // marcado. Com os caminhos já certos, ela não tem mais o que oferecer.
  if (opcao(HEARTBEAT, "hasSeenRecommendation") === false) {
    mudar.hasSeenRecommendation = true;
    fecharJanelaDoHeartbeat();
    // ela pode abrir depois deste `ready`: ele espera um `fetch` antes
    const Hooks = globalThis.Hooks;
    const id = Hooks?.on?.("renderDialog", (app) => {
      if (!ehJanelaDoHeartbeat(app)) return;
      Hooks.off("renderDialog", id);
      app.close?.();
    });
    if (id !== undefined) setTimeout(() => Hooks.off("renderDialog", id), 30000);
  }
  if (!Object.keys(mudar).length) return false;
  await gravar(HEARTBEAT, mudar);
  return "hpPath" in mudar || "maxhpPath" in mudar || "additionalActorTypes" in mudar;
}

const ehJanelaDoHeartbeat = (app) => String(app?.title ?? "").includes("Heartbeat Configuration");

function fecharJanelaDoHeartbeat() {
  for (const app of Object.values(globalThis.ui?.windows ?? {})) {
    if (ehJanelaDoHeartbeat(app)) app.close?.();
  }
}

async function acertarHealthEstimate() {
  const atual = opcao(HEALTH_ESTIMATE, "core.custom.FractionHP");
  if (atual === undefined) return false; // o provedor dele para este sistema não usa a opção
  const novo = ajusteHealthEstimate(atual);
  if (!novo) return false;
  await gravar(HEALTH_ESTIMATE, { "core.custom.FractionHP": novo });
  return true;
}

export function ligarIntegracaoPV() {
  const game = globalThis.game;
  if (!game?.user?.isGM) return;
  const ativo = (id) => game.modules?.get?.(id)?.active;

  const tarefas = [];
  if (ativo(HEARTBEAT)) tarefas.push(["Heartbeat", acertarHeartbeat()]);
  if (ativo(HEALTH_ESTIMATE)) tarefas.push(["Health Estimate", acertarHealthEstimate()]);
  if (!tarefas.length) return;

  Promise.all(tarefas.map(([nome, p]) => p.then((mudou) => (mudou ? nome : null)).catch((e) => {
    console.error(`spacedragon | não deu para configurar os PV no ${nome}`, e);
    return null;
  }))).then((nomes) => {
    const ajustados = nomes.filter(Boolean);
    if (ajustados.length) {
      globalThis.ui?.notifications?.info?.(txt("spacedragon.aviso.pvConfigurado", { modulos: ajustados.join(", ") }));
    }
  });
}
