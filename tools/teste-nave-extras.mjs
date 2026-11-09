/**
 * As integrações da 1.37: aplicar o dano pessoal no alvo, os golpes como
 * efeitos do Qualidade de Vida e o painel "Meu posto".
 *
 * ⚠️ Com um Foundry de brinquedo: prova as contas e as gravações, não que a
 * API real e o outro módulo se comportem igual.
 *
 *   · [DANO-CARTAO]   lê o dano só do cartão do Qualidade de Vida;
 *   · [DANO-MARCA]    guarda o alvo só com o dano automático desligado;
 *   · [DANO-APLICA]   dono aplica uma vez, PV negativo vale, não dono não;
 *   · [DANO-NAVE]     com o motor ligado, nave absorve no Escudo;
 *   · [GOLPE-EFEITO]  efeitos sem modificadores, sem tocar nos outros;
 *   · [POSTO-ACHA]    o personagem acha o posto; o painel respeita a permissão.
 *
 *     node tools/teste-nave-extras.mjs
 */

import { instalarLang } from "./lang-de-teste.mjs";

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

let opcoes = {};
const QDV = "old-dragon-2-qualidade-de-vida";
const OCA = "od2-combat-automation";
let ativos = new Set([QDV]);
globalThis.game = {
  modules: { get: (m) => ({ active: ativos.has(m) }) },
  user: { targets: new Set() },
  actors: { getName: () => null },
  settings: { get: (m, k) => (m === QDV ? opcoes[`qdv.${k}`] : m === OCA ? opcoes[`oca.${k}`] : opcoes[k]) },
};
const avisos = [];
globalThis.ui = { notifications: { warn: (m) => avisos.push(m), info: () => {} } };
instalarLang();

const { danoDoCartao, danoDaMensagem, marcarCartao, aplicarDanoNoAlvo } = await import("../spacedragon-module/module/dano-no-alvo.js");
const { efeitosDosGolpes, sincronizarGolpes } = await import("../spacedragon-module/module/nave-golpes-qdv.js");

function setPath(obj, caminho, valor) {
  const partes = caminho.split(".");
  let o = obj;
  for (let i = 0; i < partes.length - 1; i += 1) o = o[partes[i]] ??= {};
  o[partes.at(-1)] = structuredClone(valor);
}
const novoAtor = (extra = {}) => ({
  id: "x", name: "Alvo", isOwner: true, flags: {}, system: { hp: { value: 5, max: 20 } },
  async update(m) { for (const [k, v] of Object.entries(m)) setPath(this, k, v); return this; },
  ...extra,
});

const cartaoQdv = (n) => `<div class="od2ca-card"><dl><dt>Alvo</dt><dd>Orc</dd><dt>Dano</dt><dd>${n}</dd></dl></div>`;

// [DANO-CARTAO]
confere(danoDoCartao(cartaoQdv(7)) === 7, "[DANO-CARTAO] lê o dano");
confere(danoDoCartao("<p>Dano 7</p>") === null, "[DANO-CARTAO] outro cartão não conta");

// [DANO-MARCA]
const msg = (content) => ({ content, flags: null, updateSource(d) { this.flags = d.flags; } });
game.user.targets = new Set([{ name: "Orc", document: { uuid: "Scene.a.Token.b" } }]);
opcoes = { "qdv.combatAutoDamage": true };
const ligado = msg(cartaoQdv(7));
confere(marcarCartao(ligado) === false && ligado.flags === null, "[DANO-MARCA] dano automático ligado: sem botão");
opcoes = { "qdv.combatAutoDamage": false };
const desligado = msg(cartaoQdv(7));
confere(marcarCartao(desligado) === true, "[DANO-MARCA] dano automático desligado: marca");
confere(desligado.flags.spacedragon.danoNoAlvo.alvo === "Scene.a.Token.b" && desligado.flags.spacedragon.danoNoAlvo.dano === 7, "[DANO-MARCA] guarda alvo e dano");
game.user.targets = new Set();
confere(marcarCartao(msg(cartaoQdv(7))) === false, "[DANO-MARCA] sem alvo marcado, nada");
opcoes = { "qdv.combatAutoDamage": false, aplicarDanoNoAlvo: false };
game.user.targets = new Set([{ name: "Orc", document: { uuid: "u" } }]);
confere(marcarCartao(msg(cartaoQdv(7))) === false, "[DANO-MARCA] a opção desliga");
opcoes = { "qdv.combatAutoDamage": false };

// O cartão de dano do próprio sistema, que é o do acerto normal
const i18nOriginal = game.i18n;
game.i18n = { localize: (k) => (k === "olddragon2e.chat.damage_with" ? "Dano com" : k) };
const doSistema = { ...msg(""), flavor: "<div class='title'>Dano com <strong>Espada</strong></div>", rolls: [{ total: 9 }] };
confere(danoDaMensagem(doSistema) === 9, "[DANO-CARTAO] lê o dano do cartão do sistema");
confere(marcarCartao(doSistema) === true && doSistema.flags.spacedragon.danoNoAlvo.dano === 9, "[DANO-MARCA] o cartão do sistema ganha o botão");
game.i18n = i18nOriginal;
ativos = new Set([OCA]);
opcoes = { "oca.autoDamage": true };
confere(marcarCartao(msg(cartaoQdv(7))) === false, "[DANO-MARCA] OD2 Combat Automation com dano automático: sem botão");
opcoes = { "oca.autoDamage": false };
confere(marcarCartao(msg(cartaoQdv(7))) === true, "[DANO-MARCA] OD2 Combat Automation sem dano automático: marca");
ativos = new Set([QDV]);
opcoes = { "qdv.combatAutoDamage": false };

// [DANO-APLICA]
const alvo = novoAtor();
globalThis.fromUuid = async () => alvo;
const dados = { alvo: "u", dano: 7 };
await aplicarDanoNoAlvo("m1", dados);
confere(alvo.system.hp.value === -2, "[DANO-APLICA] PV pode ficar negativo");
const n = avisos.length;
await aplicarDanoNoAlvo("m1", dados);
confere(alvo.system.hp.value === -2 && avisos.length === n + 1, "[DANO-APLICA] o mesmo cartão não aplica duas vezes");
const alheio = novoAtor({ isOwner: false });
globalThis.fromUuid = async () => alheio;
await aplicarDanoNoAlvo("m2", dados);
confere(alheio.system.hp.value === 5, "[DANO-APLICA] quem não é dono não aplica");

// [DANO-NAVE]
opcoes = { "qdv.combatAutoDamage": false, naveConves: true };
const nave = novoAtor({
  flags: { spacedragon: { nave: { tipo: "cargueiro", postos: {}, cine: { escudo: { atual: 5, max: 20 } } } } },
  system: { hp: { value: 50, max: 50 } },
});
globalThis.fromUuid = async () => nave;
await aplicarDanoNoAlvo("m3", dados);
confere(nave.flags.spacedragon.nave.cine.escudo.atual === 0 && nave.system.hp.value === 48, "[DANO-NAVE] 5 no Escudo, 2 no Casco");

// [GOLPE-EFEITO]
const meu = { id: "abc", name: "Meu efeito" };
const lista = efeitosDosGolpes([meu], { ponte: true, incendio: true });
confere(lista.length === 3 && lista[0] === meu, "[GOLPE-EFEITO] não mexe nos outros");
confere(lista.slice(1).every((e) => e.modifiers.length === 0), "[GOLPE-EFEITO] só aviso, sem modificadores");
confere(efeitosDosGolpes(lista, {}).length === 1, "[GOLPE-EFEITO] reparado, o efeito sai");
let salvos = 0;
const api = { get: () => [], set: async () => { salvos += 1; } };
confere(await sincronizarGolpes({}, { ponte: true }, api) === true && salvos === 1, "[GOLPE-EFEITO] grava o que mudou");
confere(await sincronizarGolpes({}, {}, api) === false && salvos === 1, "[GOLPE-EFEITO] nada mudou, nada grava");
confere(await sincronizarGolpes({}, { ponte: true }, undefined) === false, "[GOLPE-EFEITO] sem o Qualidade de Vida, nada acontece");

// [POSTO-ACHA]
globalThis.Hooks = { on() {}, once() {} };
const { postosDoAtor, painelMeuPosto } = await import("../spacedragon-module/module/nave-meu-posto.js");
const talik = { id: "t", name: "Talik", flags: {}, items: [] };
const dona = {
  id: "n", uuid: "Actor.n", name: "Madame", isOwner: true, items: [],
  flags: { spacedragon: { nave: { tipo: "cargueiro", postos: { leme: "Talik" }, cine: {} } } },
};
const achar = ({ nome }) => (nome === "Talik" ? talik : null);
const achados = postosDoAtor(talik, [dona], achar);
confere(achados.length === 1 && achados[0].posto === "leme", "[POSTO-ACHA] acha o Leme");
confere(postosDoAtor({ id: "z" }, [dona], achar).length === 0, "[POSTO-ACHA] quem não está em posto não vê");
const html = painelMeuPosto(achados);
confere(html.includes('data-acao="giro"') && html.includes('data-acao="fuga"'), "[POSTO-ACHA] botões do Leme");
const semDono = painelMeuPosto([{ nave: { ...dona, isOwner: false }, posto: "leme" }]);
confere(!semDono.includes("data-acao") && semDono.includes("dono"), "[POSTO-ACHA] sem permissão, sem botões");

if (problemas.length) {
  console.error(`✘ ${problemas.length} problema(s):\n  ${problemas.join("\n  ")}`);
  process.exit(1);
}
console.log("✔ Integrações da 1.37: conferem.");
