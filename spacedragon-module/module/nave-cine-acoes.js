/**
 * O Combate Cinematográfico na mesa: os cliques do painel, o duelo, o disparo,
 * o impacto aplicado pelo Mestre, o fim da rodada e o fim do combate.
 *
 * ── O QUE MORA ONDE ─────────────────────────────────────────────────────────
 *
 *   nave-cinematico.js  a regra (puro, testado);
 *   nave-cine-ficha.js  o estado e o desenho (puro, testado);
 *   este arquivo        o que só existe dentro do Foundry: Roll, ChatMessage,
 *                       DialogV2, o combate e os tokens. Ele lê, chama as
 *                       funções de lá, e grava.
 *
 * A ficha (nave-pc-ficha.js) só chama `ligarCine` e `dispararCine`, e o cartão
 * de disparo chama `aplicarImpactoCineDaMensagem` — com isso a ficha de sempre
 * quase não muda, e desligar a opção devolve tudo como era. O PV que a escala
 * troca fica guardado, e o painel tem o botão de voltar a ele.
 */

import {
  GRAU, VANTAGENS, FALHA_CINE, EFEITO_NA_CAMARA, DANO_A_BORDO, EXTRA_CAMARA_AUSENTE,
  EXPLOSAO_DO_ARSENAL, chanceDoDuelo, grauDoTeste, iniciativaDoDuelo, termosCine, atingeCamara,
  camaraDoD12, golpeNaCamara, registrarGolpe, penalidadesDeCamara, fimDaRodadaCine,
  depoisDoCombate, recarregar, podeRepararAgora, cascoAbaixoDaMetade, aplicarDanoCine, tensaoDaRodada,
  pedeEvento, D12, precisaFechar, rodadaQueAcabou,
} from "./nave-cinematico.js";
import {
  cineDe, aplicarEscala, limparRodadaCine, acaoCine, escolherPrioridade, prioridadeConta,
  cpCine, formulaDoDanoCine, ajusteDaArmaCine, aplicarImpactoCine, marcarTurno, normalizarEscudo,
  adicionarVantagem, vantagensContra, podeManobrar, firmouNestaRodada, guardarPvDoLivro,
  comRodada, armasLivres,
  CLASSE_CINE_ACAO, CLASSE_CINE_CAMPO, CLASSE_CINE_DUELO, CLASSE_CINE_VANTAGEM,
  CLASSE_CINE_PRIORIDADE, CLASSE_CINE_RESOLVER, CLASSE_CINE_ENCERRAR, CLASSE_CINE_ESCALA,
  CLASSE_CINE_LIVRO,
} from "./nave-cine-ficha.js";
import { naveDe, estadoDoComodo, updateDaNave, tamanhoDaNave } from "./nave-pc-dados.js";
import { bonusDeAtaque, equipamentosDoAtor, podeAtacar } from "./nave-sistemas.js";
import { tipoDaNave } from "./nave-xp.js";
import { ehNave } from "./nave-marca.js";
import { camadaLigada } from "./opcoes.js";
import { CAMARAS } from "./camaras.js";
import { t as txt } from "./i18n.js";

const ID = "spacedragon";
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const rodadaAtual = () => Number(globalThis.game?.combat?.round) || 0;
const sinal = (n) => (n > 0 ? `+${n}` : `${n}`);
const CAMARAS_DO_D12 = new Set(D12.map((d) => d.camara));

async function rolar(formula) {
  return new globalThis.Roll(formula).evaluate();
}

async function cartao(ator, titulo, linhas = [], { rolls = [], flags = null } = {}) {
  await globalThis.ChatMessage?.create?.({
    speaker: globalThis.ChatMessage?.getSpeaker?.({ actor: ator }),
    content:
      `<div class="spacedragon-cartao sd-cine">` +
      `<h4>${titulo}</h4>` +
      `<ul>${linhas.filter(Boolean).map((l) => `<li>${l}</li>`).join("")}</ul>` +
      `</div>`,
    ...(rolls.length ? { rolls } : {}),
    ...(flags ? { flags } : {}),
  });
}

/** O token desta nave na cena, para a Vantagem, a Trava e a Supressão. */
function tokenDaNave(ator, token) {
  return token?.id ?? ator?.getActiveTokens?.()?.[0]?.id ?? null;
}

/** As outras naves em cena, com o estado cinematográfico de cada uma. */
function navesEmCena() {
  try {
    return (globalThis.canvas?.tokens?.placeables ?? [])
      .filter((t) => t?.actor && ehNave(t.actor))
      .map((t) => ({ token: t.id, ator: t.actor, cine: cineDe(naveDe(t.actor, ID)) }));
  } catch {
    return [];
  }
}

/** Alguém em cena interferiu nesta nave para o duelo desta rodada? */
function interferida(meuToken, rodada) {
  return navesEmCena().some((n) => n.cine.interferencia?.alvo === meuToken && Number(n.cine.interferencia.ate) === rodada);
}

/** Alguém em cena suprimiu esta nave (−4 nos ataques, sem Manobra de risco)? */
function suprimida(meuToken, rodada) {
  return navesEmCena().some((n) => n.cine.supressao?.alvo === meuToken && Number(n.cine.supressao.ate) >= rodada);
}

/** Alguém em cena venceu esta nave no duelo e escolheu Bloqueio? */
function bloqueada(meuToken, rodada) {
  return navesEmCena().some((n) => vantagensContra(n.cine, meuToken, rodada).includes("bloqueio"));
}

function estadosDasCamaras(nave) {
  return Object.fromEntries(Object.keys(CAMARAS).map((k) => [k, estadoDoComodo(nave, k)]));
}

/**
 * O combatente desta nave. Pelo TOKEN primeiro: dois tokens não vinculados do
 * mesmo ator têm o mesmo `actorId`, e procurar pelo ator acharia sempre o
 * primeiro — a iniciativa do segundo caça iria para o primeiro.
 */
function combatenteDaNave(combate, ator, meuToken) {
  const lista = combate?.combatants;
  if (!lista?.find) return null;
  return (meuToken && lista.find((c) => c.tokenId === meuToken)) ??
    (ator?.isToken ? null : lista.find((c) => c.actorId === ator?.id)) ?? null;
}

/* ── O PAINEL ─────────────────────────────────────────────────────────────── */

/**
 * Liga os cliques e os campos do painel. Delegado na raiz e uma vez só, como
 * os outros da ficha: ela redesenha a cada gravação.
 *
 * `ctx` = { ator, token, editavel: () => bool, gravar: (antes, depois) => Promise }
 */
export function ligarCine(raiz, ctx) {
  if (!raiz?.dataset || raiz.dataset.sdCine === "1") return;
  raiz.dataset.sdCine = "1";

  raiz.addEventListener("change", async (ev) => {
    const campo = ev.target?.closest?.(`.${CLASSE_CINE_CAMPO}`);
    if (!campo || !ctx.editavel()) return;
    const nave = naveDe(ctx.ator, ID);
    const cine = cineDe(nave);
    const bruto = String(campo.value ?? "").trim();
    const caminho = campo.dataset.campo;
    if (caminho === "recarga") {
      cine.recarga = /^\d*d\d+$/i.test(bruto) ? bruto : null;
    } else if (caminho === "escudo.atual" || caminho === "escudo.max") {
      cine.escudo = { ...cine.escudo, [caminho.split(".")[1]]: Math.max(0, Math.trunc(Number(bruto) || 0)) };
    } else if (caminho === "agilidade" || caminho === "pilotar") {
      cine[caminho] = Math.trunc(Number(bruto) || 0);
    } else return;
    await ctx.gravar(nave, { ...nave, cine });
  });

  raiz.addEventListener("click", async (ev) => {
    const alvoDoClique = ev.target?.closest?.(
      [CLASSE_CINE_ACAO, CLASSE_CINE_DUELO, CLASSE_CINE_VANTAGEM, CLASSE_CINE_PRIORIDADE,
        CLASSE_CINE_RESOLVER, CLASSE_CINE_ENCERRAR, CLASSE_CINE_ESCALA,
        CLASSE_CINE_LIVRO].map((c) => `.${c}`).join(","),
    );
    if (!alvoDoClique) return;
    ev.preventDefault();
    ev.stopPropagation();
    if (!ctx.editavel()) return;
    const cl = alvoDoClique.classList;
    try {
      if (cl.contains(CLASSE_CINE_ESCALA)) return await aplicarEscalaDaNave(ctx);
      if (cl.contains(CLASSE_CINE_LIVRO)) return await voltarAoLivro(ctx);
      if (cl.contains(CLASSE_CINE_DUELO)) return await duelo(ctx);
      if (cl.contains(CLASSE_CINE_VANTAGEM)) return await vantagem(ctx, alvoDoClique.dataset.vantagem);
      if (cl.contains(CLASSE_CINE_PRIORIDADE)) return await prioridade(ctx, alvoDoClique.dataset.prioridade);
      if (cl.contains(CLASSE_CINE_RESOLVER)) return await acao(ctx, "resolver", { camara: alvoDoClique.dataset.camara });
      if (cl.contains(CLASSE_CINE_ENCERRAR)) return await encerrar(ctx);
      if (cl.contains(CLASSE_CINE_ACAO)) return await acao(ctx, alvoDoClique.dataset.acao);
    } catch (e) {
      console.error(`${ID} | Combate Cinematográfico`, e);
    }
    return null;
  });
}

/**
 * A escala troca o PV de dados pelo Casco. Pergunta antes, e guarda o PV de
 * antes na própria nave: o botão "Voltar ao PV do livro" o devolve.
 */
async function aplicarEscalaDaNave(ctx, { confirmar = true } = {}) {
  const nave = naveDe(ctx.ator, ID);
  const tipo = tipoDaNave(nave, ctx.ator?.system?.race?.name ?? "");
  const jaGuardado = cineDe(nave).pvLivro;
  const cine = guardarPvDoLivro(cineDe(nave), ctx.ator?.system?.hp);
  const r = aplicarEscala(cine, tipo, { temEscudo: equipamentosDoAtor(ctx.ator, ID).has("escudo") });
  if (!r) {
    globalThis.ui?.notifications?.warn?.(txt("spacedragon.cine.aviso.semTipo"));
    return;
  }
  if (confirmar) {
    const V2 = globalThis.foundry?.applications?.api?.DialogV2;
    const ok = await V2?.confirm?.({
      window: { title: txt("spacedragon.cine.escala") },
      content: `<p>${jaGuardado
        ? txt("spacedragon.cine.aviso.confirmarEscalaDeNovo", { pv: jaGuardado.max, escudo: r.cine.escudo.max, casco: r.hp.max })
        : txt("spacedragon.cine.aviso.confirmarEscala", {
          pv: Number(ctx.ator?.system?.hp?.max) || 0, escudo: r.cine.escudo.max, casco: r.hp.max,
        })}</p>`,
      rejectClose: false,
    });
    if (!ok) return;
  }
  await ctx.gravar(nave, { ...nave, cine: r.cine });
  await ctx.ator.update({ "system.hp.max": r.hp.max, "system.hp.value": r.hp.value });
  globalThis.ui?.notifications?.info?.(txt("spacedragon.cine.aviso.escalaAplicada", {
    escudo: r.cine.escudo.max, casco: r.hp.max,
  }));
}

async function voltarAoLivro(ctx) {
  const nave = naveDe(ctx.ator, ID);
  const cine = cineDe(nave);
  if (!cine.pvLivro) return;
  // CÓPIA, e o PV primeiro: o objeto lido pode ser o mesmo que a gravação da
  // flag apaga por caminho, e aí o valor sumiria antes de chegar ao PV
  const pv = { max: Number(cine.pvLivro.max) || 0, value: Number(cine.pvLivro.value) || 0 };
  await ctx.ator.update({ "system.hp.max": pv.max, "system.hp.value": pv.value });
  await ctx.gravar(nave, { ...nave, cine: { ...cine, pvLivro: null } });
  globalThis.ui?.notifications?.info?.(txt("spacedragon.cine.aviso.voltouAoLivro", { pv: pv.max }));
}

async function prioridade(ctx, chave) {
  const nave = naveDe(ctx.ator, ID);
  const r = escolherPrioridade(cineDe(nave), chave, { rodada: rodadaAtual() });
  if (r.erro) return globalThis.ui?.notifications?.warn?.(r.erro);
  return ctx.gravar(nave, { ...nave, cine: r.cine });
}

async function vantagem(ctx, chave) {
  const marcado = [...(globalThis.game?.user?.targets ?? [])][0] ?? null;
  if (!marcado || !VANTAGENS[chave]) return globalThis.ui?.notifications?.warn?.(txt("spacedragon.cine.aviso.semAlvo"));
  const nave = naveDe(ctx.ator, ID);
  const cine = cineDe(nave);
  const rodada = rodadaAtual();
  // «Com Crítico, escolhe duas» — o Crítico do duelo DESTA rodada
  const critico = cine.duelo?.grau === "critico" && Number(cine.duelo?.rodada) === rodada;
  const novo = adicionarVantagem(cine, marcado.id, marcado.name ?? "", chave, { critico, rodada });
  await ctx.gravar(nave, { ...nave, cine: novo });
  return cartao(ctx.ator, txt("spacedragon.cine.cartao.vantagem"), [
    `<strong>${VANTAGENS[chave].rotulo}</strong> → ${esc(marcado.name ?? "?")}: ${VANTAGENS[chave].efeito}`,
  ]);
}

/* ── O DUELO DE PILOTOS ──────────────────────────────────────────────────── */

/** A iniciativa de quem «perde todo duelo»: abaixo de qualquer grau. */
export const INICIATIVA_DE_QUEM_PERDE = 0;

async function duelo(ctx) {
  const ator = ctx.ator;
  const nave = naveDe(ator, ID);
  const cine = cineDe(nave);
  const rodada = rodadaAtual();
  const meuToken = tokenDaNave(ator, ctx.token);
  const pen = penalidadesDeCamara(cine.avarias);
  const hp = ator.system?.hp ?? {};
  const { chance, partes } = chanceDoDuelo({
    pilotar: cine.pilotar,
    agilidade: cine.agilidade,
    cascoBaixo: cascoAbaixoDaMetade(hp.value, hp.max),
    avarias: cine.avarias,
    motores: Number(cine.motores) === rodada,
    interferencia: interferida(meuToken, rodada),
  });

  const rolls = [];
  let grau;
  let d100 = null;
  if (pen.perdeDuelo) {
    grau = GRAU.desastre;
  } else {
    const r = await rolar("1d100");
    rolls.push(r);
    d100 = r.total;
    grau = grauDoTeste(pen.pilotarSo5 ? 5 : chance, d100);
  }

  await ctx.gravar(nave, { ...nave, cine: { ...cine, duelo: { rodada, grau: grau.chave } } });

  // A ordem da rodada: quem venceu o grupo antes dele, quem perdeu depois.
  // Com a Ordem de Ação (T7-2) ligada, o rastreador é dela — gravar aqui
  // brigaria com ela (e a inversão do rastreador poria os vencedores por último).
  const combate = globalThis.game?.combat;
  const ordemDoModulo = camadaLigada("ordemDeAcao") || camadaLigada("ordemNoCombate");
  let notaDaOrdem = null;
  if (ordemDoModulo) {
    notaDaOrdem = txt("spacedragon.cine.cartao.ordemDeAcao");
  } else {
    const combatente = combatenteDaNave(combate, ator, meuToken);
    if (combatente && combate?.setInitiative) {
      const valor = pen.perdeDuelo
        ? INICIATIVA_DE_QUEM_PERDE
        : iniciativaDoDuelo({ grau: grau.chave, tamanho: tamanhoDaNave(nave, ator.system?.race?.name ?? ""), grupo: Boolean(ator.hasPlayerOwner) });
      await combate.setInitiative(combatente.id, valor);
    }
  }

  const conta = partes.map(([r, v]) => `${sinal(v)}% ${r}`).join(", ");
  await cartao(ator, txt("spacedragon.cine.cartao.duelo", { nave: esc(ator.name) }), [
    pen.perdeDuelo ? txt("spacedragon.cine.cartao.perdeDuelo") : txt("spacedragon.cine.cartao.chance", { chance: pen.pilotarSo5 ? 5 : chance, conta }),
    d100 !== null ? txt("spacedragon.cine.cartao.rolou", { d100 }) : null,
    `<strong>${grau.rotulo}</strong> · ${txt("spacedragon.cine.cartao.jp", { jp: sinal(grau.jp) })}`,
    txt("spacedragon.cine.cartao.vencedor"),
    notaDaOrdem,
  ], { rolls });
}

/* ── AS AÇÕES DE POSTO ───────────────────────────────────────────────────── */

async function acao(ctx, chave, { camara = null } = {}) {
  const ator = ctx.ator;
  const nave = naveDe(ator, ID);
  const rodada = rodadaAtual();
  // agir é começar o turno: o que valia «até o próximo turno» da nave acaba
  const cine = marcarTurno(cineDe(nave), rodada);
  const marcado = [...(globalThis.game?.user?.targets ?? [])][0] ?? null;
  const meuToken = tokenDaNave(ator, ctx.token);
  const pen = penalidadesDeCamara(cine.avarias);
  const rolls = [];
  const linhas = [];
  let novo = cine;
  let hpNovo = null;

  if (chave === "giro") {
    const impede = podeManobrar({
      tamanho: tamanhoDaNave(nave, ator.system?.race?.name ?? ""),
      bloqueada: bloqueada(meuToken, rodada),
      suprimida: suprimida(meuToken, rodada),
    });
    const MOTIVO = {
      tamanho: txt("spacedragon.cine.aviso.manobraTamanho"),
      bloqueio: txt("spacedragon.cine.aviso.manobraBloqueio"),
      supressao: txt("spacedragon.cine.aviso.manobraSupressao"),
    };
    if (impede) return globalThis.ui?.notifications?.warn?.(MOTIVO[impede]);
    const hp = ator.system?.hp ?? {};
    const chance = Number(cine.pilotar) + Number(cine.agilidade) + pen.pilotar +
      (prioridadeConta(cine, "motores", rodada) ? 20 : 0) + (cascoAbaixoDaMetade(hp.value, hp.max) ? -20 : 0);
    const r = await rolar("1d100");
    rolls.push(r);
    const g = grauDoTeste(pen.pilotarSo5 ? 5 : chance, r.total);
    const ok = g.ordem >= GRAU.sucesso.ordem;
    novo = { ...cine, giro: { valor: ok ? 4 : -2, rodada } };
    linhas.push(txt("spacedragon.cine.acao.giro", { chance, d100: r.total, resultado: ok ? "+4" : "−2" }));
  } else if (chave === "recarregar") {
    if (pen.semRecarga || pen.semEscudo) return globalThis.ui?.notifications?.warn?.(txt("spacedragon.cine.aviso.semRecarga"));
    if (!cine.recarga) return globalThis.ui?.notifications?.warn?.(txt("spacedragon.cine.aviso.semEscudoDeForca"));
    const r = await rolar(cine.recarga);
    rolls.push(r);
    novo = { ...cine, escudo: { ...cine.escudo, atual: recarregar(cine.escudo.atual, cine.escudo.max, r.total) } };
    linhas.push(txt("spacedragon.cine.acao.recarregou", { n: r.total, escudo: novo.escudo.atual, max: cine.escudo.max }));
  } else if (chave === "reparo") {
    if (!podeRepararAgora(cine.ultimoReparo, rodada)) return globalThis.ui?.notifications?.warn?.(txt("spacedragon.cine.aviso.reparoSeguido"));
    const r = await rolar("1d10");
    rolls.push(r);
    const hp = ator.system?.hp ?? {};
    hpNovo = Math.min(Number(hp.max) || Infinity, (Number(hp.value) || 0) + r.total);
    novo = { ...cine, ultimoReparo: rodada };
    linhas.push(txt("spacedragon.cine.acao.reparou", { n: r.total, casco: hpNovo }));
  } else if (chave === "forcar") {
    const r = await rolar("1d6");
    rolls.push(r);
    novo = comRodada(cine, rodada, (d) => ({ ...d, forcado: true }));
    if (r.total === 1) {
      const g = golpeNaCamara(estadoDoComodo(nave, "maquinas"), cine.avarias.maquinas);
      novo = normalizarEscudo({ ...novo, avarias: registrarGolpe(cine.avarias, "maquinas", g.tipo, rodada) });
      linhas.push(txt("spacedragon.cine.acao.forcouMal", { d6: r.total }));
    } else {
      linhas.push(txt("spacedragon.cine.acao.forcou", { d6: r.total }));
    }
  } else {
    const r = acaoCine(cine, chave, { alvo: marcado?.id ?? null, alvoNome: marcado?.name ?? "", rodada, camara });
    if (r.erro) return globalThis.ui?.notifications?.warn?.(r.erro);
    novo = r.cine;
    linhas.push(r.linha);
  }

  await ctx.gravar(nave, { ...nave, cine: novo });
  if (hpNovo !== null) await ator.update({ "system.hp.value": hpNovo });
  return cartao(ator, txt("spacedragon.cine.cartao.acao", { nave: esc(ator.name) }), linhas, { rolls });
}

/* ── O DISPARO ───────────────────────────────────────────────────────────── */

/**
 * O míssil (§6) não rola contra o CP: ele chega no fim da rodada e o alvo faz
 * JP. O cartão rola o dano e deixa o botão — o Mestre aplica só se a JP falhar.
 */
async function lancarMissil(ctx, { item, arma, alvo, rodada }) {
  const ator = ctx.ator;
  const rd = await rolar(String(arma?.dano || "4d10"));
  const nomeAlvo = esc(alvo?.name ?? "");
  const impacto = alvo?.document?.uuid
    ? { modo: "cine", alvo: alvo.document.uuid, nome: alvo.name ?? "", dano: rd.total, camara: null, rodada }
    : null;
  await globalThis.ChatMessage?.create?.({
    speaker: globalThis.ChatMessage?.getSpeaker?.({ actor: ator }),
    content:
      `<div class="spacedragon-cartao sd-disparo sd-cine">` +
      `<h4>${txt("spacedragon.cine.disparo.titulo", { arma: esc(item?.name ?? arma.nome), alvo: nomeAlvo || "?" })}</h4>` +
      `<ul><li>${txt("spacedragon.cine.disparo.missil", { dano: rd.total })}</li></ul>` +
      (impacto ? `<button type="button" class="sd-aplicar-impacto">${txt("spacedragon.nave.disparo.aplicar", { alvo: nomeAlvo || "?" })}</button>` : "") +
      `</div>`,
    rolls: [rd],
    ...(impacto ? { flags: { [ID]: { impacto } } } : {}),
  });
  return { acerto: null, impacto };
}

/**
 * O disparo no Cinematográfico. Rola tudo aqui (ataque, dano, d12 e os
 * extras), e deixa o cartão com o botão de aplicar, como o disparo de sempre:
 * a nave inimiga é do Mestre, e é ele quem grava nela.
 */
export async function dispararCine(ctx, { item, chave, arma }) {
  const ator = ctx.ator;
  const nave = naveDe(ator, ID);
  const rodada = rodadaAtual();
  // o turno só começa quando o tiro sai: cancelar a janela não gasta o Firmar
  // nem o Giro da rodada anterior
  const cine = marcarTurno(cineDe(nave), rodada);
  const pen = penalidadesDeCamara(cine.avarias);
  const alvo = [...(globalThis.game?.user?.targets ?? [])][0] ?? null;
  const nomeAlvo = esc(alvo?.name ?? alvo?.actor?.name ?? "");
  const nomeArma = esc(item?.name ?? arma.nome);

  if (!podeAtacar(nave) || pen.semArmas) {
    globalThis.ui?.notifications?.warn?.(txt("spacedragon.nave.disparo.semPonte", { nave: esc(ator.name) }));
    return null;
  }
  if (chave === "misseis") {
    await ctx.gravar(nave, { ...nave, cine });
    return lancarMissil(ctx, { item, arma, alvo, rodada });
  }

  const nomeArt = String(nave?.postos?.artilharia ?? "").trim();
  const bad = Number(globalThis.game?.actors?.getName?.(nomeArt)?.system?.bad);
  const livres = armasLivres(cine, rodada);
  const opcoesCamara = D12.map((d, i) => `<option value="${d.camara}">${i + 1}. ${CAMARAS[d.camara]?.rotulo ?? d.camara}</option>`).join("");
  const V2 = globalThis.foundry?.applications?.api?.DialogV2;
  if (!V2) return null;
  const escolha = await V2.wait({
    window: { title: txt("spacedragon.janela.disparo", { arma: nomeArma }) },
    content:
      (pen.armasParadas ? `<p><em>${txt("spacedragon.cine.aviso.armasParadas", { n: pen.armasParadas })}</em></p>` : "") +
      `<div class="form-group"><label>${txt("spacedragon.nave.disparo.artilheiro")}</label>` +
      `<input type="number" name="artilheiro" value="${Number.isFinite(bad) ? bad : ""}"></div>` +
      `<div class="form-group"><label>${txt("spacedragon.nave.disparo.situacao")}</label>` +
      `<input type="number" name="situacao" value="0"></div>` +
      `<div class="form-group"><label>${txt("spacedragon.cine.disparo.rajada")}</label><input type="checkbox" name="rajada"></div>` +
      (livres > 0
        ? `<div class="form-group"><label>${txt("spacedragon.cine.disparo.prioridadeArmas", { n: livres })}</label><input type="checkbox" name="armas" checked></div>`
        : "") +
      `<div class="form-group"><label>${txt("spacedragon.cine.disparo.mirar")}</label><input type="checkbox" name="mirar"></div>` +
      `<div class="form-group"><label>${txt("spacedragon.cine.disparo.escolherCamara")}</label><select name="camara">${opcoesCamara}</select></div>`,
    buttons: [
      { action: "rolar", label: txt("spacedragon.botao.rolar"), default: true, callback: (_ev, b) => Object.fromEntries(new FormData(b.form)) },
      { action: "cancelar", label: txt("spacedragon.botao.cancelar") },
    ],
    rejectClose: false,
  });
  if (!escolha || typeof escolha !== "object") return null;
  await ctx.gravar(nave, { ...nave, cine });
  const rajada = escolha.rajada === "on";
  const mirar = escolha.mirar === "on";
  const usaArmas = livres > 0 && escolha.armas === "on";
  // o <select> é do cliente: só vale uma das doze
  const camaraEscolhida = CAMARAS_DO_D12.has(escolha.camara) ? escolha.camara : null;

  const alvoAtor = alvo?.actor ?? null;
  const alvoEhNave = Boolean(alvoAtor && ehNave(alvoAtor));
  const naveAlvo = alvoEhNave ? naveDe(alvoAtor, ID) : {};
  const cineAlvo = alvoEhNave ? cineDe(naveAlvo) : cineDe({});
  const alvoToken = alvo?.id ?? null;
  const meuToken = tokenDaNave(ator, ctx.token);

  const termos = termosCine({
    ba: ator.system?.ba ?? 0,
    balistico: bonusDeAtaque(nave, equipamentosDoAtor(ator, ID)),
    artilheiro: escolha.artilheiro,
    rodada,
    vantagem: vantagensContra(cine, alvoToken, rodada),
    caudaContraMim: vantagensContra(cineAlvo, meuToken, rodada).includes("cauda"),
    firmar: firmouNestaRodada(cine, rodada),
    rajada,
    mirarSistema: mirar,
    supressao: suprimida(meuToken, rodada),
    avarias: cine.avarias,
    situacao: escolha.situacao,
  });
  const ajuste = alvoEhNave ? ajusteDaArmaCine(chave, tamanhoDaNave(naveAlvo, alvoAtor?.system?.race?.name ?? "")) : 0;
  if (ajuste) termos.push([chave === "canhoes" ? "canhão contra nave pequena" : "metralhadora contra nave pequena", ajuste]);
  const formula = ["1d20", ...termos.map(([, n]) => (n > 0 ? `+ ${n}` : `- ${Math.abs(n)}`))].join(" ");
  const cpBase = alvoAtor?.system?.ac_total ?? alvoAtor?.system?.ac ?? null;
  const cpInfo = cpCine(cpBase, alvoEhNave ? cineAlvo : {}, rodada);

  const rolls = [];
  const linhas = [];
  const r = async (f) => { const x = await rolar(f); rolls.push(x); return x; };
  const ataque = await r(formula);
  const natural = ataque.dice?.[0]?.total;
  const acerto = natural === 20 || (natural !== 1 && (!cpInfo || ataque.total >= cpInfo.cp));

  linhas.push(`${formula.replace(/^1d20/, `<strong>${ataque.total}</strong> (d20: ${natural})`)}` +
    (cpInfo ? ` · ${txt("spacedragon.cine.disparo.contra", { cp: cpInfo.cp })}` : ""));
  linhas.push(`<small>${[...termos, ...(cpInfo?.partes ?? [])].map(([t2, v]) => `${sinal(v)} ${t2}`).join(", ")}</small>`);

  let novoCine = cine;
  let impacto = null;
  if (natural === 1) {
    const d = await r("1d6");
    const f = FALHA_CINE[d.total];
    linhas.push(`<em>${txt("spacedragon.cine.disparo.falha", { d6: d.total, efeito: f.texto })}</em>`);
    if (f.camara) {
      const g = golpeNaCamara(estadoDoComodo(nave, f.camara), cine.avarias[f.camara]);
      novoCine = normalizarEscudo({ ...cine, avarias: registrarGolpe(cine.avarias, f.camara, g.tipo, rodada) });
    }
  }
  if (acerto) {
    const fDano = formulaDoDanoCine(chave, arma, { rajada, armas: usaArmas ? 1 : 0 });
    if (usaArmas) novoCine = comRodada(novoCine, rodada, (d) => ({ ...d, armasUsadas: d.armasUsadas + 1 }));
    const rd = await r(fDano);
    const dano = rd.total * (natural === 20 ? 2 : 1);
    linhas.push(txt("spacedragon.cine.disparo.acerto", { dano, formula: fDano }) + (natural === 20 ? ` <strong>${txt("spacedragon.cine.disparo.critico")}</strong>` : ""));

    // a câmara: decidida com o Escudo de AGORA; o Mestre recalcula o golpe ao aplicar
    const previa = aplicarDanoCine({ escudo: alvoEhNave ? cineAlvo.escudo.atual : 0, casco: 0, dano });
    const travado = Boolean(alvoToken && cine.trava === alvoToken);
    let camara = null;
    let extraAusente = 0;
    let extraArsenal = 0;
    if (alvoEhNave && atingeCamara({
      total: ataque.total, cp: cpInfo?.cp ?? 0, natural, noCasco: previa.noCasco, travado, mirarSistema: mirar,
    })) {
      if (mirar && camaraEscolhida) camara = camaraEscolhida;
      else {
        const d12 = await r("1d12");
        camara = camaraDoD12(d12.total)?.camara ?? null;
        linhas.push(txt("spacedragon.cine.disparo.d12", { d12: d12.total }));
      }
      if (camara) {
        // os dois extras saem rolados já, para o clique do Mestre servir a
        // qualquer estado da câmara na hora de aplicar
        extraAusente = (await r(EXTRA_CAMARA_AUSENTE)).total;
        if (camara === "arsenal") extraArsenal = (await r(EXPLOSAO_DO_ARSENAL)).total;
        const g = golpeNaCamara(estadoDoComodo(naveAlvo, camara), cineAlvo.avarias[camara]);
        if (g.tipo === "ausente") {
          linhas.push(txt("spacedragon.cine.disparo.ausente", { camara: CAMARAS[camara].rotulo, n: extraAusente }));
        } else {
          linhas.push(txt("spacedragon.cine.disparo.camara", {
            camara: CAMARAS[camara].rotulo,
            estado: g.tipo === "fora" ? txt("spacedragon.cine.fora") : txt("spacedragon.cine.avaria"),
            efeito: esc(EFEITO_NA_CAMARA[camara]?.[g.tipo === "fora" ? "fora" : "avaria"] ?? ""),
          }));
          linhas.push(`<em>${txt("spacedragon.cine.disparo.aBordo", { dano: DANO_A_BORDO })}</em>`);
        }
      }
    }
    // «O PRÓXIMO acerto no Casco desse alvo»: chegou ao Casco, a trava se gasta
    if (travado && previa.noCasco > 0) novoCine = { ...novoCine, trava: null };
    if (alvo?.document?.uuid) {
      impacto = { modo: "cine", alvo: alvo.document.uuid, nome: alvo.name ?? "", dano, camara, extraAusente, extraArsenal, rodada };
    }
  } else {
    linhas.push(txt("spacedragon.nave.disparo.erro"));
  }

  if (novoCine !== cine) await ctx.gravar(nave, { ...nave, cine: novoCine });

  const botao = impacto
    ? `<button type="button" class="sd-aplicar-impacto">${txt("spacedragon.nave.disparo.aplicar", { alvo: nomeAlvo || "?" })}</button>`
    : "";
  await globalThis.ChatMessage?.create?.({
    speaker: globalThis.ChatMessage?.getSpeaker?.({ actor: ator }),
    content:
      `<div class="spacedragon-cartao sd-disparo sd-cine">` +
      `<h4>${txt("spacedragon.cine.disparo.titulo", { arma: nomeArma, alvo: nomeAlvo || "?" })}</h4>` +
      `<ul>${linhas.map((l) => `<li>${l}</li>`).join("")}</ul>${botao}</div>`,
    rolls,
    ...(impacto ? { flags: { [ID]: { impacto } } } : {}),
  });
  return { acerto, impacto };
}

/** O clique do Mestre no cartão do Cinematográfico. */
export async function aplicarImpactoCineDaMensagem(msg, imp) {
  const doc = await globalThis.fromUuid?.(imp.alvo);
  const ator = doc?.actor ?? doc;
  if (!ator?.update) return;
  const hp = Number(ator.system?.hp?.value) || 0;
  if (!ehNave(ator)) {
    await ator.update({ "system.hp.value": hp - (Number(imp.dano) || 0) });
  } else {
    const nave = naveDe(ator, ID);
    const r = aplicarImpactoCine(cineDe(nave), hp, imp, { estados: estadosDasCamaras(nave) });
    const mud = updateDaNave(nave, { ...nave, cine: r.cine }, ID) ?? {};
    await ator.update({ ...mud, "system.hp.value": r.casco });
    const golpe = r.golpe
      ? ` ${txt("spacedragon.cine.aviso.golpe", {
        camara: CAMARAS[r.golpe.camara]?.rotulo ?? "?",
        tipo: r.golpe.tipo === "fora" ? txt("spacedragon.cine.fora") : r.golpe.tipo === "ausente" ? txt("spacedragon.cine.ausente") : txt("spacedragon.cine.avaria"),
      })}`
      : "";
    globalThis.ui?.notifications?.info?.(txt("spacedragon.cine.aviso.aplicado", {
      alvo: esc(ator.name), escudo: r.noEscudo, casco: r.noCasco,
    }) + golpe);
  }
  await msg.setFlag(ID, "impacto", { ...imp, aplicado: true });
}

/* ── O FIM DA RODADA E O FIM DO COMBATE ──────────────────────────────────── */

/**
 * Fecha a `rodada` do `combate` para uma nave: cobra incêndios e brechas,
 * espalha o fogo, recarrega pela Prioridade Escudos e limpa o que valia até o
 * fim da rodada. Uma vez por rodada e por combate (`precisaFechar`).
 *
 * Grava direto no ator (não há ficha aberta: quem chama é o rastreador).
 * Devolve true se fechou.
 */
export async function fecharRodadaDaNave(ator, { combate, rodada }) {
  const inicio = cineDe(naveDe(ator, ID));
  if (!precisaFechar(inicio.fimRodada, combate, rodada)) return false;
  // Rola primeiro, com o que a nave tinha; decide depois, com o que ela TEM —
  // enquanto o dado rolava, o Mestre pode ter aplicado um tiro, alguém pode ter
  // apagado um fogo, e a rodada nova pode já ter escolhas próprias.
  const previa = fimDaRodadaCine(inicio.avarias, { rodada, estados: estadosDasCamaras(naveDe(ator, ID)) });
  const rolls = [];
  const rolado = {};
  for (const d of previa.danos) {
    const r = await rolar(d.formula);
    rolls.push(r);
    rolado[d.camara] = r.total;
  }
  const vezes = prioridadeConta(inicio, "escudos", rodada);
  let recarga = 0;
  if (vezes && inicio.recarga) {
    for (let i = 0; i < vezes; i += 1) {
      const r = await rolar(inicio.recarga);
      rolls.push(r);
      recarga += r.total;
    }
  }

  const nave = naveDe(ator, ID);
  const cine = cineDe(nave);
  if (!precisaFechar(cine.fimRodada, combate, rodada)) return false;
  const f = fimDaRodadaCine(cine.avarias, { rodada, estados: estadosDasCamaras(nave) });
  const linhas = [];
  let dano = 0;
  for (const d of f.danos) {
    // só cobra o que ainda queima e já tem o dado rolado (fogo apagado no meio
    // não cobra; câmara que pegou fogo no meio fica para a próxima rodada)
    if (!(d.camara in rolado)) continue;
    dano += rolado[d.camara];
    linhas.push(txt("spacedragon.cine.fimRodada.dano", {
      camara: CAMARAS[d.camara]?.rotulo ?? d.camara,
      familia: d.familia === "incendio" ? txt("spacedragon.cine.incendio") : txt("spacedragon.cine.brecha"),
      n: rolado[d.camara],
    }));
  }
  for (const e of f.espalhou) {
    linhas.push(txt("spacedragon.cine.fimRodada.espalhou", { de: CAMARAS[e.de]?.rotulo ?? e.de, para: CAMARAS[e.para]?.rotulo ?? e.para }));
  }
  const pen = penalidadesDeCamara(f.avarias);
  let escudo = cine.escudo.atual;
  if (recarga && !pen.semRecarga && !pen.semEscudo) {
    escudo = recarregar(escudo, cine.escudo.max, recarga);
    linhas.push(txt("spacedragon.cine.fimRodada.recarga", { escudo, max: cine.escudo.max }));
  }
  if (pen.semEscudo) escudo = 0;

  const novo = limparRodadaCine({ ...cine, avarias: f.avarias, escudo: { ...cine.escudo, atual: escudo } }, rodada, { combate });
  const mud = updateDaNave(nave, { ...nave, cine: novo }, ID) ?? {};
  if (dano) mud["system.hp.value"] = (Number(ator.system?.hp?.value) || 0) - dano;
  if (Object.keys(mud).length) await ator.update(mud);
  // a nave sem nada a cobrar não enche o chat: só quem tem fogo, brecha ou recarga
  if (linhas.length) await cartao(ator, txt("spacedragon.cine.cartao.fimRodada", { nave: esc(ator.name), rodada }), linhas, { rolls });
  return true;
}

/**
 * Fecha a rodada para todas as naves do combate, uma vez por ator (dois tokens
 * vinculados do mesmo ator são a mesma nave). O lembrete de Evento sai uma vez.
 */
export async function fecharRodadaDoCombate(combate, rodada) {
  const vistos = new Set();
  let fechou = 0;
  for (const c of combate?.combatants ?? []) {
    const ator = c?.actor;
    if (!ator || !ehNave(ator)) continue;
    const chave = ator.uuid ?? ator.id;
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    // uma nave que falha não leva as outras junto
    try {
      if (await fecharRodadaDaNave(ator, { combate: combate.id, rodada })) fechou += 1;
    } catch (e) {
      console.error(`${ID} | fechar a rodada ${rodada} de ${ator.name}`, e);
    }
  }
  if (fechou && pedeEvento(rodada + 1)) {
    await globalThis.ChatMessage?.create?.({
      content: `<div class="spacedragon-cartao sd-cine"><p><strong>${txt("spacedragon.cine.fimRodada.evento", { tensao: tensaoDaRodada(rodada + 1) })}</strong></p></div>`,
    });
  }
  return fechou;
}

/** A chave, nas opções da atualização, da rodada de antes da mudança. */
export const OPCAO_RODADA_ANTES = "spacedragonRodadaAntes";

/** No `preUpdateCombat`: guarda nas opções a rodada de ANTES da mudança. */
export function guardarRodadaAntes(combate, mudanca, opcoes) {
  if (mudanca && "round" in mudanca && opcoes) opcoes[OPCAO_RODADA_ANTES] = Number(combate?.round) || 0;
}

/**
 * Os fechamentos em FILA: avançar duas rodadas depressa (2→3→4) não pode pôr
 * dois fechamentos lendo e gravando a mesma nave ao mesmo tempo.
 */
let fila = Promise.resolve();

/** Este cliente é o do Mestre ativo? Só ele cobra o fim da rodada. */
function souOMestreAtivo() {
  const jogo = globalThis.game;
  const mestre = jogo?.users?.activeGM ?? null;
  return mestre ? mestre.id === jogo?.user?.id : Boolean(jogo?.user?.isGM);
}

/**
 * O gancho do rastreador: quando o rastreador AVANÇA, fecha a rodada que
 * acabou. Roda num cliente só — o do Mestre ativo —, senão cada cliente aberto
 * cobraria o fogo de novo. A rodada de antes vem das `opcoes` (guardada no
 * `preUpdateCombat`) e, sem ela, de `combat.previous`.
 */
export async function fecharRodadaPeloRastreador(combate, mudanca, opcoes = {}) {
  if (!souOMestreAtivo()) return 0;
  const antes = opcoes?.[OPCAO_RODADA_ANTES] ?? combate?.previous?.round;
  const rodada = rodadaQueAcabou(mudanca?.round, antes);
  if (rodada === null) {
    // avançou e nada fechou: a rodada de antes chegou igual à nova — o aviso
    // existe para isso não passar em silêncio numa versão do Foundry diferente
    if (Number(mudanca?.round) > 1 && Number(antes) === Number(mudanca?.round)) {
      console.warn(`${ID} | o rastreador avançou para a rodada ${mudanca.round}, mas a rodada anterior não chegou ao gancho: nenhuma nave fechou a rodada`);
    }
    return 0;
  }
  const vez = fila.then(() => fecharRodadaDoCombate(combate, rodada)).catch((e) => {
    console.error(`${ID} | fechar a rodada das naves`, e);
    return 0;
  });
  fila = vez;
  return vez;
}

async function encerrar(ctx) {
  const ator = ctx.ator;
  // Encerrar é do Mestre ativo: é ele quem cobra o fim das rodadas, e um
  // jogador cobrando a mesma rodada ao mesmo tempo cobraria duas vezes.
  if (!souOMestreAtivo()) return globalThis.ui?.notifications?.warn?.(txt("spacedragon.cine.aviso.encerrarSoMestre"));
  // A última rodada não termina pelo rastreador: cobra-se aqui, na fila e antes
  // de limpar (o §2 cobra o fim de TODA rodada, inclusive a última). Encerre
  // antes de apagar o combate do rastreador.
  const combate = globalThis.game?.combat;
  const aberta = Number(combate?.round) || 0;
  if (combate?.id && aberta > 0) {
    const vez = fila.then(() => fecharRodadaDaNave(ator, { combate: combate.id, rodada: aberta }));
    fila = vez.catch(() => 0);
    await vez;
  }
  const nave = naveDe(ator, ID);
  const cine = cineDe(nave);
  const { ultimoTeste, danificadas } = depoisDoCombate(cine.avarias);
  const camaras = { ...(nave.camaras ?? {}) };
  for (const k of danificadas) if (estadoDoComodo(nave, k) === "instalada") camaras[k] = "danificada";
  const novo = {
    ...limparRodadaCine(cine, Infinity),
    porRodada: {},
    avarias: {},
    duelo: null,
    ultimoReparo: null,
    motores: null,
    firmar: null,
    giro: null,
    turno: null,
    trava: null,
    fimRodada: null,
    escudo: { ...cine.escudo, atual: cine.escudo.max },
  };
  await ctx.gravar(nave, { ...nave, camaras, cine: novo });
  const nome = (k) => CAMARAS[k]?.rotulo ?? k;
  const SEP = ", ";
  const listaDanificadas = danificadas.map(nome).join(SEP);
  const listaTeste = ultimoTeste.map(nome).join(SEP);
  await cartao(ator, txt("spacedragon.cine.cartao.encerrar", { nave: esc(ator.name) }), [
    danificadas.length ? txt("spacedragon.cine.encerrarDanificadas", { lista: listaDanificadas }) : null,
    ultimoTeste.length ? txt("spacedragon.cine.encerrarTeste", { lista: listaTeste }) : null,
    !danificadas.length && !ultimoTeste.length ? txt("spacedragon.cine.encerrarLimpo") : null,
  ]);
}

/**
 * As ações internas, para o teste com um Foundry de brinquedo
 * (tools/teste-nave-cine-mesa.mjs). A ficha não usa: ela entra por `ligarCine`.
 */
export const PARA_TESTE = { duelo, acao, vantagem, prioridade, encerrar, aplicarEscalaDaNave, voltarAoLivro };
