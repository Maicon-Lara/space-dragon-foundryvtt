/**
 * O combate de naves das Regras Compiladas e a nave modular são OPCIONAIS.
 *
 * O Cap. 10 do livro base vale sempre. Os postos com as ações, a câmara
 * danificada que cala a nave e as camadas vêm das Regras Compiladas; a compra
 * de câmaras com limite por tamanho é regra da casa. As duas viram opção de
 * mundo, ligadas por padrão, para a mesa poder jogar só com o livro.
 *
 * ── O QUE ESTE TESTE GARANTE ────────────────────────────────────────────────
 *
 *   · sem settings (fora do Foundry) e por padrão, as duas contam como ligadas,
 *     e as camadas como desligadas — a ficha de hoje não muda;
 *   · as cinco opções são registradas, com o padrão certo e redesenho ao trocar;
 *   · sem a nave modular, a câmara ausente diz "não tem", o clique só marca e o
 *     painel vira referência, sem compra nem limite;
 *   · sem as Regras Compiladas, a câmara não se danifica, a nave não é "calada"
 *     pelos avisos, a aba Tripulação mostra o combate do livro e as camadas
 *     somem mesmo ligadas.
 *
 *     node tools/teste-naves-opcionais.mjs
 */

import {
  regraDeNave, combateCompilado, naveModular, camadaLigada, registrarOpcoesDeNave,
} from "../spacedragon-module/module/opcoes.js";
import {
  botaoDoComodo, seguinteNaFicha, painelDasCamaras, painelDeVoo,
  porPainelDaTripulacao, porPainelDasCamadas, MARCA_TRIPULACAO,
} from "../spacedragon-module/module/nave-pc-ficha.js";
import { naveVazia } from "../spacedragon-module/module/nave-pc-dados.js";

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

const nave = (camaras = {}) => ({ ...naveVazia(), tamanho: "Média", camaras });
const ator = { name: "Falcão", items: [], system: { hp: { value: 50, max: 100 } } };

/** Põe opções de mundo falsas; `valores` ausentes lançam, como o Foundry faz. */
function comOpcoes(valores) {
  globalThis.game = {
    settings: {
      get: (_mod, chave) => {
        if (!(chave in valores)) throw new Error(`opção não registrada: ${chave}`);
        return valores[chave];
      },
    },
  };
}

/** Uma ficha mínima: a raiz acha a aba, a aba guarda o HTML inserido. */
function fichaFalsa() {
  const aba = {
    html: "",
    querySelector: () => null,
    insertAdjacentHTML(_onde, html) { this.html += html; },
  };
  return { aba, raiz: { querySelector: () => aba } };
}

/* ── Fora do Foundry: o comportamento de hoje ─────────────────────────────── */
{
  delete globalThis.game;
  confere(combateCompilado() === true, "sem settings, as Regras Compiladas deviam contar como ligadas");
  confere(naveModular() === true, "sem settings, a nave modular devia contar como ligada");
  confere(camadaLigada("camadaEnergia") === false, "sem settings, as camadas deviam contar como desligadas");
}

/* ── Opção registrada mas nunca tocada: o Foundry devolve o padrão ────────── */
{
  comOpcoes({});
  confere(regraDeNave("naveModular") === true, "opção que lança ao ler devia contar como ligada");
}

/* ── O registro ───────────────────────────────────────────────────────────── */
{
  const registradas = {};
  let redesenhos = 0;
  globalThis.game = { settings: { register: (_m, chave, cfg) => { registradas[chave] = cfg; } } };
  registrarOpcoesDeNave(() => { redesenhos += 1; });
  const esperado = { naveCombateCompilado: true, naveModular: true, camadaEnergia: false, camadaAvarias: false, camadaFuga: false };
  for (const [chave, padrao] of Object.entries(esperado)) {
    const cfg = registradas[chave];
    confere(!!cfg, `a opção ${chave} não foi registrada`);
    if (!cfg) continue;
    confere(cfg.default === padrao, `${chave} devia nascer ${padrao}, nasceu ${cfg.default}`);
    confere(cfg.scope === "world" && cfg.config === true && cfg.type === Boolean, `${chave} não é opção de mundo visível`);
    confere(cfg.name === `spacedragon.opcao.${chave}.nome`, `${chave} com nome errado: ${cfg.name}`);
    cfg.onChange?.(false);
  }
  confere(redesenhos === 5, `trocar cada opção devia redesenhar as fichas (${redesenhos} de 5)`);
}

/* ── Tudo ligado: a ficha de sempre ───────────────────────────────────────── */
{
  comOpcoes({ naveCombateCompilado: true, naveModular: true, camadaEnergia: true, camadaAvarias: false, camadaFuga: false });
  const comprar = botaoDoComodo("laboratorio", "ausente");
  confere(comprar.includes(">comprar<"), "com a nave modular, a câmara ausente devia dizer 'comprar'");
  confere(botaoDoComodo("ponte", "instalada").includes('data-proximo="danificada"'),
    "com as Regras Compiladas, a instalada devia ir para danificada");
  confere(painelDasCamaras(ator, nave()).includes("camaras-limite"), "com a nave modular, o painel devia mostrar o limite");

  const semPonte = painelDeVoo(ator, nave({ ponte: "ausente" }));
  confere(semPonte.includes("voo-avisos"), "com as Regras Compiladas, a nave sem Ponte devia avisar que não pilota");

  const t = fichaFalsa();
  porPainelDaTripulacao(t.raiz, ator);
  confere(t.aba.html.includes("sw-posto-nome"), "com as Regras Compiladas, a aba devia ter os postos");

  const c = fichaFalsa();
  confere(porPainelDasCamadas(c.raiz, ator) === true, "com as Regras Compiladas e a energia ligada, a camada devia aparecer");
}

/* ── Sem a nave modular ───────────────────────────────────────────────────── */
{
  comOpcoes({ naveCombateCompilado: true, naveModular: false });
  const ausente = botaoDoComodo("laboratorio", "ausente");
  confere(ausente.includes(">não tem<"), `sem a nave modular, a ausente devia dizer 'não tem': ${ausente}`);
  confere(!/créditos/.test(ausente), "sem a nave modular, a dica não devia falar em preço");
  confere(ausente.includes('data-proximo="instalada"'), "sem a nave modular, clicar na ausente devia marcar instalada");

  const painel = painelDasCamaras(ator, nave({ laboratorio: "instalada" }));
  confere(painel.includes("camaras-referencia"), "sem a nave modular, o painel devia ser a referência");
  confere(!painel.includes("camaras-limite"), "sem a nave modular, o painel não devia mostrar limite");
  confere(painel.includes("Laboratório"), "o painel de referência devia listar o que a nave tem");
}

/* ── Sem as Regras Compiladas ─────────────────────────────────────────────── */
{
  comOpcoes({ naveCombateCompilado: false, naveModular: true, camadaEnergia: true, camadaAvarias: true, camadaFuga: true });
  confere(seguinteNaFicha("instalada", { compilado: false }) === "ausente", "sem as Regras Compiladas, instalada devia ir para ausente");
  confere(seguinteNaFicha("ausente", { compilado: false }) === "instalada", "sem as Regras Compiladas, ausente devia ir para instalada");
  confere(seguinteNaFicha("danificada", { compilado: false }) === "instalada", "a danificada que sobrou devia voltar a instalada");
  confere(seguinteNaFicha("instalada") === "danificada", "o padrão de seguinteNaFicha devia ser o ciclo das Regras Compiladas");
  confere(botaoDoComodo("ponte", "instalada").includes('data-proximo="ausente"'),
    "sem as Regras Compiladas, o botão da instalada não devia oferecer 'danificada'");

  const semPonte = painelDeVoo(ator, nave({ ponte: "ausente" }));
  confere(!semPonte.includes("voo-avisos"), "sem as Regras Compiladas, câmara ausente não cala a nave");

  const t = fichaFalsa();
  porPainelDaTripulacao(t.raiz, ator);
  confere(t.aba.html.includes(MARCA_TRIPULACAO) && t.aba.html.includes("T10-6"),
    "sem as Regras Compiladas, a aba Tripulação devia mostrar o combate do livro");
  confere(!t.aba.html.includes("sw-posto-nome"), "sem as Regras Compiladas, os postos não deviam aparecer");

  const c = fichaFalsa();
  confere(porPainelDasCamadas(c.raiz, ator) === false && c.aba.html === "",
    "sem as Regras Compiladas, as camadas não deviam aparecer mesmo ligadas");
}

delete globalThis.game;

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log("  ✔ naves opcionais: Regras Compiladas e nave modular ligam e desligam, camadas registradas");
