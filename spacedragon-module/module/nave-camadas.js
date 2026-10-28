/**
 * As três camadas opcionais do §7, desenhadas na Ficha de Nave.
 *
 * ── POR QUE SÃO OPCIONAIS, E DESLIGADAS POR PADRÃO ──────────────────────────
 *
 * Porque cada uma é um jogo a mais dentro da rodada: distribuir energia,
 * correr contra prazos, avançar dois relógios. Uma mesa casual não quer nenhum
 * deles, e três painéis mortos numa ficha que já é cheia custam mais do que
 * valem. Quem liga, liga.
 *
 * A REGRA não mora aqui — mora em tripulacao.js, que tem teste e não sabe o
 * que é Foundry. Isto é desenho: lê o estado, chama as funções de lá, e devolve
 * HTML. Quando a conta e o pixel moram no mesmo arquivo, corrigir a conta vira
 * mexer no pixel.
 */

import {
  ENERGIA_POR_TAMANHO, DESTINOS_DE_ENERGIA, energiaDoReator, efeitoDaEnergia,
  energiaGasta, PRAZO_DE_AVARIA, prazoDaAvaria, MARCAS_DO_PERSEGUIDOR,
  quemFechaPrimeiro,
} from "./tripulacao.js";
import { camadaLigada } from "./opcoes.js";
import { t as txt } from "./i18n.js";
import { ETAPAS } from "./nave-salto.js";
import { AVARIAS, lerAvaria, calorNoFimDaRodada } from "./nave-combate.js";

export const MARCA_CAMADAS = "sw-painel-camadas";
export const CLASSE_ENERGIA = "sw-energia-btn";
export const CLASSE_RELOGIO = "sw-relogio-btn";

/* ── ENERGIA DO REATOR ─────────────────────────────────────────────────────── */

/**
 * «A cada rodada o reator dá os pontos do tamanho. A Engenharia distribui; o
 * que sobra NÃO ACUMULA.»
 *
 * O "não acumula" é o que torna a camada uma decisão: guardar para a rodada
 * seguinte seria sempre a jogada certa, e aí não haveria escolha nenhuma. Por
 * isso a sobra aparece como sobra, e não como reserva.
 */
export function painelDeEnergia(nave, tamanho) {
  const atual = nave?.energia ?? {};
  // o "Forçar o reator" soma ao que o reator dá nesta rodada; antes ele gravava
  // os +2 e o painel não os contava, e a energia forçada não tinha onde entrar
  const total = energiaDoReator(tamanho) + (Number(atual.extra) || 0);
  const gasto = energiaGasta(atual);
  const sobra = total - gasto;
  const efeito = efeitoDaEnergia(atual, true);

  const destino = ([chave, d]) => {
    const n = Number(atual[chave]) || 0;
    const custo = d.custo ?? 1;
    return (
      `<div class="energia-destino">` +
      `<span class="energia-nome">${d.rotulo}</span>` +
      `<button type="button" class="${CLASSE_ENERGIA}" data-destino="${chave}" data-passo="-1"` +
      `${n <= 0 ? " disabled" : ""} title="${txt("spacedragon.nave.camadas.tirarPonto")}">−</button>` +
      `<span class="energia-pontos">${n}</span>` +
      `<button type="button" class="${CLASSE_ENERGIA}" data-destino="${chave}" data-passo="1"` +
      `${sobra < custo ? " disabled" : ""} title="${d.livro}">+</button>` +
      `<span class="energia-efeito">${d.livro}</span>` +
      `</div>`
    );
  };

  const resumo = [
    efeito.jp ? `JP +${efeito.jp}` : null,
    efeito.cp ? `CP +${efeito.cp}` : null,
    efeito.dadosDeDano ? txt("spacedragon.nave.camadas.dadosDeDano", { n: efeito.dadosDeDano }) : null,
    efeito.acoesExtras ? txt("spacedragon.nave.camadas.acoesExtras", { n: efeito.acoesExtras }) : null,
  ].filter(Boolean).join(" · ");
  // o Calor é a única coisa da camada que ACUMULA: mostrar o de agora e o que
  // ele vai ser no fim da rodada é o que deixa a aposta à vista
  const calor = Math.max(0, Number(nave?.calor) || 0);
  const calorDepois = calorNoFimDaRodada(nave);

  return (
    `<div class="camada camada-energia">` +
    `<div class="camada-cabeca"><strong>${txt("spacedragon.nave.camadas.energia")}</strong>` +
    // "sobram 2 de 3" e não "2 de 3": o número sozinho é ambíguo entre o que
    // se gastou e o que resta, e quem lê no meio da rodada não vai conferir
    `<span class="camada-sobra${sobra < 0 ? " excedeu" : ""}">` +
    `${sobra < 0 ? txt("spacedragon.nave.camadas.alemDoReator", { n: -sobra }) : txt("spacedragon.nave.camadas.sobram", { sobra, total })}</span></div>` +
    Object.entries(DESTINOS_DE_ENERGIA).map(destino).join("") +
    (resumo ? `<div class="camada-resumo">${txt("spacedragon.nave.camadas.nestaRodada", { resumo })}</div>` : "") +
    `<div class="camada-resumo${calorDepois > 0 ? " calor" : ""}">` +
    txt("spacedragon.nave.camadas.calor", { calor, depois: calorDepois }) + `</div>` +
    `<div class="camada-nota">${txt("spacedragon.nave.camadas.naoAcumula")}</div>` +
    `</div>`
  );
}

/* ── CONTROLE DE AVARIAS ───────────────────────────────────────────────────── */

/**
 * «Cada avaria do crítico acontece numa câmara e vira emergência com prazo.»
 *
 * O painel mostra as rodadas que RESTAM, e não a rodada em que a avaria
 * aconteceu. A mesa precisa saber quanto tempo tem, e fazer essa subtração de
 * cabeça no meio do combate é exatamente o que se perde.
 */
export function painelDeAvarias(nave, rodadaAtual) {
  const avarias = nave?.avarias ?? {};
  const ativas = Object.entries(avarias)
    .filter(([chave, v]) => AVARIAS[chave] && lerAvaria(v))
    .map(([chave, v]) => {
      const a = lerAvaria(v);
      const p = prazoDaAvaria(chave, a.rodada, rodadaAtual);
      return { chave, ...(p ?? { prazo: null }), venceu: a.vencida || Boolean(p?.venceu) };
    });

  const linha = (a) => {
    const d = AVARIAS[a.chave];
    const estado = a.prazo == null
      ? txt("spacedragon.nave.camadas.semPrazo")
      : a.venceu
        ? txt("spacedragon.nave.camadas.prazoVencido")
        : txt("spacedragon.nave.camadas.restam", { restam: a.restam, prazo: a.prazo });
    return (
      `<li class="${a.venceu ? "avaria-venceu" : "avaria-corre"}">` +
      `<strong>${d.rotulo}</strong> (${d.efeito}) — ${estado}` +
      `</li>`
    );
  };

  return (
    `<div class="camada camada-avarias">` +
    `<div class="camada-cabeca"><strong>${txt("spacedragon.nave.camadas.avarias")}</strong>` +
    `<span class="camada-sobra">${txt("spacedragon.nave.camadas.rodada", { rodada: rodadaAtual ?? "—" })}</span></div>` +
    (ativas.length
      ? `<ul class="camada-lista">${ativas.map(linha).join("")}</ul>`
      : `<div class="camada-nota">${txt("spacedragon.nave.camadas.semAvaria")}</div>`) +
    `<div class="camada-nota">${txt("spacedragon.nave.camadas.resolver")}</div>` +
    `</div>`
  );
}

/* ── FUGA COMO RELÓGIO ─────────────────────────────────────────────────────── */

/**
 * «Fugir é completar o salto antes de o perseguidor fechar o relógio dele.»
 *
 * Os dois relógios lado a lado, porque a corrida é a informação — ver só o
 * próprio progresso não diz se vale continuar fugindo ou virar e lutar.
 */
export function painelDeFuga(nave) {
  const f = nave?.fuga ?? {};
  const etapas = Math.max(0, Math.min(ETAPAS.length, Math.floor(Number(f.etapas) || 0)));
  const marcas = Math.max(0, Math.min(MARCAS_DO_PERSEGUIDOR, Math.floor(Number(f.perseguidor) || 0)));
  const quem = quemFechaPrimeiro(etapas, marcas);

  const relogio = (nome, feitoCru, total, lado) => {
    // Clampa AQUI também, e não só no cálculo acima: `"○".repeat(3 - 99)`
    // lança RangeError, e um RangeError no meio do desenho derruba a ficha
    // INTEIRA, não só a camada. A flag pode trazer qualquer coisa: versão
    // antiga, macro de mesa, edição à mão.
    //
    // Hoje esta linha é REDUNDANTE — quem chama já clampou, e por isso a
    // sabotagem que a remove não faz teste nenhum falhar. Ela fica porque
    // `relogio` é uma função de desenho que não deve confiar em quem a chama:
    // no dia em que outro painel a usar, o clamp de lá pode não existir. Está
    // marcado como redundante para ninguém procurar o teste que a cobre.
    // Math.floor porque `repeat` TRUNCA: com 1.7, `repeat(1.7)` dá 1 marca
    // cheia e `repeat(3 - 1.7)` dá 1 vazia — o relógio perde uma casa e fica
    // com duas onde a regra dá três. Arredondar para baixo também é o certo
    // pela regra: uma etapa pela metade não está vencida.
    const feito = Math.max(0, Math.min(total, Math.floor(Number(feitoCru) || 0)));
    return (
    `<div class="relogio">` +
    `<span class="relogio-nome">${nome}</span>` +
    `<button type="button" class="${CLASSE_RELOGIO}" data-lado="${lado}" data-passo="-1"` +
    `${feito <= 0 ? " disabled" : ""}>−</button>` +
    `<span class="relogio-marcas">${"●".repeat(feito)}${"○".repeat(total - feito)}</span>` +
    `<button type="button" class="${CLASSE_RELOGIO}" data-lado="${lado}" data-passo="1"` +
    `${feito >= total ? " disabled" : ""}>+</button>` +
    `</div>`);
  };

  const veredito = {
    salto: txt("spacedragon.nave.camadas.salta"),
    perseguidor: txt("spacedragon.nave.camadas.alcanca"),
  }[quem] ?? txt("spacedragon.nave.camadas.ninguem");

  return (
    `<div class="camada camada-fuga">` +
    `<div class="camada-cabeca"><strong>${txt("spacedragon.nave.camadas.fuga")}</strong></div>` +
    relogio(txt("spacedragon.nave.camadas.salto"), etapas, ETAPAS.length, "salto") +
    relogio(txt("spacedragon.nave.camadas.perseguidor"), marcas, MARCAS_DO_PERSEGUIDOR, "perseguidor") +
    `<div class="camada-resumo">${veredito}</div>` +
    `<div class="camada-nota">${txt("spacedragon.nave.camadas.duasMarcas")}</div>` +
    `</div>`
  );
}

/* ── O CONJUNTO ────────────────────────────────────────────────────────────── */

/**
 * As camadas que a mesa ligou, e nada mais.
 *
 * Devolve string vazia quando nenhuma está ligada: um cabeçalho "Camadas" sem
 * camada nenhuma é pior que ausência, porque sugere que algo falhou.
 */
export function painelDasCamadas(nave, { tamanho, rodada } = {}) {
  const partes = [];
  if (camadaLigada("camadaEnergia")) partes.push(painelDeEnergia(nave, tamanho));
  if (camadaLigada("camadaAvarias")) partes.push(painelDeAvarias(nave, rodada));
  if (camadaLigada("camadaFuga")) partes.push(painelDeFuga(nave));
  if (!partes.length) return "";
  return `<section class="${MARCA_CAMADAS}">${partes.join("")}</section>`;
}
