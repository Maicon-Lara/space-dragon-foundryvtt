/**
 * O Combate Cinematográfico na Ficha de Nave: o estado e o desenho.
 *
 * ── POR QUE SEPARADO DA FICHA ───────────────────────────────────────────────
 *
 * Mesmo desenho de nave-camadas.js: a REGRA mora em nave-cinematico.js, o
 * ESTADO e o HTML moram aqui, e a ficha (nave-pc-ficha.js) só liga os cliques,
 * rola os dados e grava. Assim o painel inteiro tem teste em Node
 * (tools/teste-nave-cine-ficha.mjs), sem Foundry.
 *
 * ── ONDE O ESTADO MORA ──────────────────────────────────────────────────────
 *
 * Em `flags.spacedragon.nave.cine`. O Casco NÃO mora aqui: é o PV nativo
 * (`system.hp`), porque é dele que sai a barra do token — o mesmo motivo de o
 * PV de nave sempre ter morado lá (nave-pc-dados.js).
 */

import {
  ACOES_CINE, PRIORIDADES, VANTAGENS, GRAU, D12, FAMILIA_DA_CAMARA, EFEITO_NA_CAMARA,
  escalaDoTipo, tensaoDaRodada, penalidadesDeCamara, resolverAvaria,
  aplicarDanoCine as aplicarDanoCineLocal, golpeNaCamara as golpeNaCamaraLocal,
  registrarGolpe as registrarGolpeLocal,
} from "./nave-cinematico.js";
import { POSTOS } from "./tripulacao.js";
import { CAMARAS } from "./camaras.js";
import { t as txt } from "./i18n.js";

export const MARCA_CINE = "sd-painel-cine";
export const CLASSE_CINE_ACAO = "sd-cine-acao";
export const CLASSE_CINE_CAMPO = "sd-cine-campo";
export const CLASSE_CINE_DUELO = "sd-cine-duelo";
export const CLASSE_CINE_VANTAGEM = "sd-cine-vantagem";
export const CLASSE_CINE_PRIORIDADE = "sd-cine-prioridade";
export const CLASSE_CINE_RESOLVER = "sd-cine-resolver";
export const CLASSE_CINE_FIM = "sd-cine-fim";
export const CLASSE_CINE_ENCERRAR = "sd-cine-encerrar";
export const CLASSE_CINE_ESCALA = "sd-cine-escala";

/** As ações que a ficha aplica sozinha; as outras são decisão da mesa. */
export const AUTOMATICAS_CINE = new Set([
  "firmar", "giro", "recarregar", "reparo", "forcar", "resolver", "travar", "interferencia", "supressao",
]);

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

/* ── O ESTADO ────────────────────────────────────────────────────────────── */

export function cineVazio() {
  return {
    escudo: { atual: 0, max: 0 },
    recarga: null,
    agilidade: 0,
    pilotar: 0,
    prioridade: [],
    firmar: false,
    giro: 0,
    forcado: false,
    trava: null,
    interferencia: null,
    supressao: null,
    vantagens: {},
    avarias: {},
    duelo: null,
    ultimoReparo: null,
    // «Motores: +20% no duelo da PRÓXIMA rodada» — a rodada em que o bônus vale
    motores: null,
    // a Prioridade Armas vale num acerto só: «+1 dado de dano em UMA arma»
    armasUsadas: 0,
  };
}

/** O estado cinematográfico da nave, com o que faltar preenchido. */
export function cineDe(nave) {
  const c = nave?.cine ?? {};
  const base = cineVazio();
  return {
    ...base,
    ...c,
    escudo: { ...base.escudo, ...(c.escudo ?? {}) },
    prioridade: Array.isArray(c.prioridade) ? [...c.prioridade] : [],
    vantagens: { ...(c.vantagens ?? {}) },
    avarias: { ...(c.avarias ?? {}) },
    // A gravação por caminho (updateDaNave) não sabe trocar um objeto por null:
    // apaga as chaves de dentro e deixa um {} no lugar. Lido aqui, {} é nada.
    interferencia: c.interferencia?.alvo ? c.interferencia : null,
    supressao: c.supressao?.alvo ? c.supressao : null,
    duelo: c.duelo?.grau ? c.duelo : null,
  };
}

/**
 * A escala do tipo aplicada: o estado novo e o PV (Casco) novo.
 *
 * O Escudo e o Casco começam CHEIOS — aplicar a escala é preparar a nave para
 * o combate, e uma nave que entra pela metade seria uma surpresa ruim.
 */
export function aplicarEscala(cine, tipo, { temEscudo = false } = {}) {
  const e = escalaDoTipo(tipo, { temEscudo });
  if (!e) return null;
  return {
    cine: {
      ...cine,
      escudo: { atual: e.escudo, max: e.escudo },
      agilidade: e.agilidade,
      recarga: e.recarga,
    },
    hp: { value: e.casco, max: e.casco },
  };
}

/**
 * O que vale "até o fim da rodada" sai; o que vale "até o fim da PRÓXIMA"
 * (Interferência, Supressão) sai só quando o prazo dela passou.
 */
export function limparRodadaCine(cine, rodada = 0) {
  const r = Number(rodada) || 0;
  const vivo = (x) => (x && Number(x.ate) > r ? x : null);
  return {
    ...cine,
    firmar: false,
    giro: 0,
    prioridade: [],
    forcado: false,
    trava: null,
    vantagens: {},
    armasUsadas: 0,
    motores: (cine.prioridade ?? []).includes("motores") ? r + 1 : null,
    interferencia: vivo(cine.interferencia),
    supressao: vivo(cine.supressao),
  };
}

/**
 * As ações de posto que só mudam estado. As que rolam dado (giro, recarregar,
 * reparo, forcar) a ficha rola e depois chama `aplicarRolagemCine`.
 *
 * Devolve `{ cine, linha }` ou `{ erro }`.
 */
export function acaoCine(cine, acao, { alvo = null, alvoNome = "", rodada = 0, camara = null } = {}) {
  const r = Number(rodada) || 0;
  switch (acao) {
    case "firmar":
      return { cine: { ...cine, firmar: true }, linha: txt("spacedragon.cine.acao.firmou") };
    case "travar":
      if (!alvo) return { erro: txt("spacedragon.cine.aviso.semAlvo") };
      return { cine: { ...cine, trava: alvo }, linha: txt("spacedragon.cine.acao.travou", { alvo: esc(alvoNome) }) };
    case "interferencia":
      if (!alvo) return { erro: txt("spacedragon.cine.aviso.semAlvo") };
      return { cine: { ...cine, interferencia: { alvo, ate: r + 1 } }, linha: txt("spacedragon.cine.acao.interferiu", { alvo: esc(alvoNome) }) };
    case "supressao":
      if (!alvo) return { erro: txt("spacedragon.cine.aviso.semAlvo") };
      return { cine: { ...cine, supressao: { alvo, ate: r + 1 } }, linha: txt("spacedragon.cine.acao.suprimiu", { alvo: esc(alvoNome) }) };
    case "resolver": {
      const qual = camara ?? "maquinas";
      if (cine.avarias?.[qual]?.estado !== "avaria") return { erro: txt("spacedragon.cine.aviso.nadaAResolver") };
      return {
        cine: { ...cine, avarias: resolverAvaria(cine.avarias, qual) },
        linha: txt("spacedragon.cine.acao.resolveu", { camara: CAMARAS[qual]?.rotulo ?? qual }),
      };
    }
    default:
      return { erro: txt("spacedragon.cine.aviso.acaoDaMesa") };
  }
}

/** Prioridade: uma por rodada; com o reator forçado, duas. */
export function escolherPrioridade(cine, chave) {
  if (!PRIORIDADES[chave]) return { erro: txt("spacedragon.cine.aviso.acaoDaMesa") };
  if (penalidadesDeCamara(cine.avarias).semPrioridade) return { erro: txt("spacedragon.cine.aviso.semPrioridade") };
  const atual = cine.prioridade ?? [];
  const limite = cine.forcado ? 2 : 1;
  if (atual.length >= limite) {
    // trocar a escolha é permitido: a última substitui a mais antiga
    return { cine: { ...cine, prioridade: [...atual.slice(1), chave] } };
  }
  return { cine: { ...cine, prioridade: [...atual, chave] } };
}

/** Quantas vezes a Prioridade `chave` foi escolhida nesta rodada. */
export const prioridadeConta = (cine, chave) => (cine?.prioridade ?? []).filter((p) => p === chave).length;

/* ── O TIRO E O IMPACTO ──────────────────────────────────────────────────────
 *
 * Partes puras do disparo, para o teste: a ficha rola, estas decidem.
 */

/** O CP do alvo no Cinematográfico: o da ficha, com o Firmar e o Giro dele. */
export function cpCine(cpBase, cineAlvo = {}) {
  // Number(null) é 0: um alvo sem CP viraria CP 0 e todo tiro acertaria
  if (cpBase === null || cpBase === undefined || cpBase === "") return null;
  const base = Number(cpBase);
  if (!Number.isFinite(base)) return null;
  const partes = [
    ["Firmar do alvo", cineAlvo.firmar ? -2 : 0],
    ["Giro evasivo do alvo", Number(cineAlvo.giro) || 0],
  ].filter(([, v]) => v !== 0);
  return { cp: base + partes.reduce((s, [, v]) => s + v, 0), base, partes };
}

/**
 * Os dados de dano do acerto: o da arma, +1 da Rajada, +1 por Prioridade Armas
 * ainda não gasta. A metralhadora rola UMA vez 3d10 (§6), e não 4×1d10.
 */
export function formulaDoDanoCine(chave, arma, { rajada = false, armas = 0 } = {}) {
  const base = chave === "metralhadora" ? "3d10" : String(arma?.dano ?? "");
  const m = base.replace(/\s+/g, "").match(/^(\d*)d(\d+)(.*)$/i);
  if (!m) return base;
  const n = Number(m[1] || 1) + (rajada ? 1 : 0) + Math.max(0, Number(armas) || 0);
  return `${n}d${m[2]}${m[3] ?? ""}`;
}

/** Modificador de alvo por arma: canhão −4 e metralhadora +2 contra nave pequena. */
export function ajusteDaArmaCine(chave, tamanhoDoAlvo) {
  if (tamanhoDoAlvo !== "Pequena") return 0;
  if (chave === "canhoes") return -4;
  if (chave === "metralhadora") return 2;
  return 0;
}

/**
 * Aplica um impacto já rolado na nave alvo.
 *
 *   imp = { dano, camara, extraAusente, extraArsenal, rodada }
 *
 * O golpe na câmara é recalculado AQUI, com o estado da hora: entre o tiro e o
 * clique do Mestre, o escudo pode ter recarregado (e aí nada chega ao Casco) ou
 * outra arma pode já ter avariado a mesma câmara (e aí ela cai Fora).
 */
export function aplicarImpactoCine(cine, casco, imp = {}, { estados = {} } = {}) {
  const r = aplicarDanoCineLocal({ escudo: cine.escudo.atual, casco, dano: imp.dano });
  let novoCasco = r.casco;
  let avarias = { ...cine.avarias };
  const notas = [];
  let golpe = null;
  if (imp.camara && r.noCasco > 0) {
    const g = golpeNaCamaraLocal(estados[imp.camara], avarias[imp.camara]);
    golpe = { camara: imp.camara, tipo: g.tipo };
    if (g.tipo === "ausente") novoCasco -= Number(imp.extraAusente) || 0;
    else avarias = registrarGolpeLocal(avarias, imp.camara, g.tipo, imp.rodada);
    if (g.tipo === "fora" && imp.camara === "arsenal") novoCasco -= Number(imp.extraArsenal) || 0;
  }
  let escudo = r.escudo;
  if (penalidadesDeCamara(avarias).semEscudo) escudo = 0;
  return {
    cine: { ...cine, escudo: { ...cine.escudo, atual: escudo }, avarias },
    casco: novoCasco,
    noEscudo: r.noEscudo,
    noCasco: casco - novoCasco,
    golpe,
    notas,
  };
}

/* ── O DESENHO ───────────────────────────────────────────────────────────── */

function campo(chave, valor, { tipo = "number", rotulo, dica = "" } = {}) {
  return (
    `<label class="cine-campo" title="${esc(dica)}">${rotulo} ` +
    `<input type="${tipo}" class="${CLASSE_CINE_CAMPO}" data-campo="${chave}" value="${esc(valor ?? "")}">` +
    `</label>`
  );
}

function blocoDasTrilhas(cine, hp) {
  const casco = Number(hp?.value) || 0;
  const cascoMax = Number(hp?.max) || 0;
  return (
    `<div class="cine-trilhas">` +
    `<div class="cine-trilha cine-escudo">` +
    campo("escudo.atual", cine.escudo.atual, { rotulo: txt("spacedragon.cine.escudo") }) +
    ` / ` +
    campo("escudo.max", cine.escudo.max, { rotulo: "" }) +
    `</div>` +
    `<div class="cine-trilha cine-casco" title="${esc(txt("spacedragon.cine.cascoDica"))}">` +
    `${txt("spacedragon.cine.casco")} <strong>${casco}</strong> / ${cascoMax}</div>` +
    campo("agilidade", cine.agilidade, { rotulo: txt("spacedragon.cine.agilidade") }) +
    campo("recarga", cine.recarga ?? "", { tipo: "text", rotulo: txt("spacedragon.cine.recarga") }) +
    campo("pilotar", cine.pilotar, { rotulo: txt("spacedragon.cine.pilotar"), dica: txt("spacedragon.cine.pilotarDica") }) +
    `<button type="button" class="${CLASSE_CINE_ESCALA}" title="${esc(txt("spacedragon.cine.escalaDica"))}">` +
    `${txt("spacedragon.cine.escala")}</button>` +
    `</div>`
  );
}

function blocoDoDuelo(cine, rodada) {
  const d = cine.duelo;
  const grau = d && Number(d.rodada) === Number(rodada) ? GRAU[d.grau] : null;
  const vantagens = Object.entries(cine.vantagens ?? {});
  return (
    `<div class="cine-duelo">` +
    `<button type="button" class="${CLASSE_CINE_DUELO}">${txt("spacedragon.cine.duelo")}</button> ` +
    (grau
      ? `<span class="cine-grau">${txt("spacedragon.cine.grau", { grau: grau.rotulo, jp: (grau.jp > 0 ? "+" : "") + grau.jp })}</span>`
      : `<span class="cine-grau cine-sem">${txt("spacedragon.cine.semDuelo")}</span>`) +
    `<div class="cine-vantagens">${txt("spacedragon.cine.vantagem")} ` +
    Object.entries(VANTAGENS).map(([k, v]) =>
      `<button type="button" class="${CLASSE_CINE_VANTAGEM}" data-vantagem="${k}" title="${esc(v.efeito)}">${v.rotulo}</button>`).join("") +
    `</div>` +
    (vantagens.length
      ? `<ul class="cine-vantagens-ativas">${vantagens.map(([, v]) =>
        `<li>${VANTAGENS[v.chave]?.rotulo ?? v.chave} → ${esc(v.nome ?? "?")}</li>`).join("")}</ul>`
      : "") +
    `</div>`
  );
}

function blocoDaPrioridade(cine) {
  const pen = penalidadesDeCamara(cine.avarias);
  return (
    `<div class="cine-prioridade">${txt("spacedragon.cine.prioridade")} ` +
    Object.entries(PRIORIDADES).map(([k, p]) => {
      const n = prioridadeConta(cine, k);
      return `<button type="button" class="${CLASSE_CINE_PRIORIDADE}${n ? " ativa" : ""}" data-prioridade="${k}" ` +
        `title="${esc(p.efeito)}"${pen.semPrioridade ? " disabled" : ""}>${p.rotulo}${n > 1 ? " ×2" : ""}</button>`;
    }).join("") +
    (pen.semPrioridade ? ` <em>${txt("spacedragon.cine.aviso.semPrioridade")}</em>` : "") +
    `</div>`
  );
}

/**
 * Os postos: o nome de quem senta (o mesmo campo dos postos de sempre, para o
 * gravar da ficha valer igual) e as quatro ações de cada um.
 */
function blocoDosPostos(nave, classePosto) {
  const ocupantes = nave?.postos ?? {};
  return POSTOS.map((posto) => {
    const quem = String(ocupantes[posto.chave] ?? "").trim();
    const acoes = (ACOES_CINE[posto.chave] ?? []).map((a) => (AUTOMATICAS_CINE.has(a.chave)
      ? `<li class="posto-acao acao-auto"><button type="button" class="${CLASSE_CINE_ACAO}" data-posto="${posto.chave}" ` +
        `data-acao="${a.chave}" title="${esc(a.efeito)}">${a.rotulo}</button></li>`
      : `<li class="posto-acao acao-texto" title="${esc(a.efeito)}">${a.rotulo}</li>`)).join("");
    return (
      `<div class="posto${quem ? " posto-ocupado" : ""}">` +
      `<div class="posto-cabeca"><strong>${posto.rotulo}</strong> ` +
      `<input type="text" class="${classePosto}" data-posto="${posto.chave}" value="${esc(quem)}" placeholder="${esc(posto.quem)}">` +
      `</div><ul class="posto-acoes">${acoes}</ul></div>`
    );
  }).join("");
}

function blocoDasAvarias(cine) {
  const lista = D12.filter((d) => cine.avarias?.[d.camara]);
  if (!lista.length) return `<div class="cine-avarias cine-sem">${txt("spacedragon.cine.semAvarias")}</div>`;
  return (
    `<div class="cine-avarias"><strong>${txt("spacedragon.cine.avarias")}</strong><ul>` +
    lista.map((d) => {
      const a = cine.avarias[d.camara];
      const fora = a.estado === "fora";
      const efeito = EFEITO_NA_CAMARA[d.camara]?.[fora ? "fora" : "avaria"] ?? "";
      return `<li class="cine-avaria familia-${FAMILIA_DA_CAMARA[d.camara]}${fora ? " fora" : ""}">` +
        `<strong>${CAMARAS[d.camara]?.rotulo ?? d.camara}</strong>` +
        (fora ? ` <em>${txt("spacedragon.cine.fora")}</em>` : "") +
        ` — ${esc(efeito)}` +
        (fora ? "" : ` <button type="button" class="${CLASSE_CINE_RESOLVER}" data-camara="${d.camara}">${txt("spacedragon.cine.resolver")}</button>`) +
        `</li>`;
    }).join("") +
    `</ul></div>`
  );
}

/** O painel inteiro, na aba de Tripulação. */
export function painelCinematico(ator, nave, { rodada = null, classePosto = "sw-posto-nome" } = {}) {
  const cine = cineDe(nave);
  const tensao = rodada ? tensaoDaRodada(rodada) : null;
  return (
    `<section class="${MARCA_CINE}">` +
    `<h3>${txt("spacedragon.cine.titulo")}` +
    (tensao !== null ? ` <span class="cine-tensao">${txt("spacedragon.cine.tensao", { rodada, tensao })}</span>` : "") +
    `</h3>` +
    blocoDasTrilhas(cine, ator?.system?.hp) +
    blocoDoDuelo(cine, rodada) +
    blocoDaPrioridade(cine) +
    blocoDosPostos(nave, classePosto) +
    blocoDasAvarias(cine) +
    `<div class="cine-rodada">` +
    `<button type="button" class="${CLASSE_CINE_FIM}" title="${esc(txt("spacedragon.cine.fimDica"))}">${txt("spacedragon.cine.fim")}</button> ` +
    `<button type="button" class="${CLASSE_CINE_ENCERRAR}" title="${esc(txt("spacedragon.cine.encerrarDica"))}">${txt("spacedragon.cine.encerrar")}</button>` +
    `</div>` +
    `</section>`
  );
}
