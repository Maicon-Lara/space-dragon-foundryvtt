/**
 * O combate de naves numa conta só: o ataque, o CP do alvo, o dano, o crítico,
 * as avarias, o escudo e o Calor do reator.
 *
 * ── POR QUE ESTE ARQUIVO EXISTE ─────────────────────────────────────────────
 *
 * Até a 1.30 a tripulação era quase só texto. Firmar, Travar, Interferência,
 * a energia nos Escudos e nas Armas, o Escudo de força, a Ponte avariada e as
 * avarias do crítico tinham função pronta em tripulacao.js — e o disparo não
 * chamava nenhuma. A mesa apertava os botões, o chat dizia "+2", e o tiro saía
 * igual. Foi o que se viu no teste: nenhuma urgência, porque nada mudava.
 *
 * Aqui mora a conta inteira. O disparo da ficha (nave-pc-ficha.js) lê o estado
 * das duas naves, chama estas funções e só desenha o resultado.
 *
 * Nada aqui toca `game`, `canvas` ou `ui`: tools/teste-nave-combate.mjs testa
 * tudo em Node.
 *
 * ── O QUE É DO LIVRO E O QUE É DA CASA ──────────────────────────────────────
 *
 *   · Livro (Cap. 10): o ataque, o CP, o Escudo de força (+10 no CP), o
 *     Computador Balístico, o crítico da T10-6 e as penalidades dele.
 *   · Compiladas (§7): os postos e as três camadas.
 *   · Casa (1.31): dano por margem, multiplicador de dano, escudo como reserva,
 *     avaria por dano pesado, a ação extra paga com energia e o Calor.
 *
 * Cada regra da casa tem a opção dela (opcoes.js); este arquivo recebe as
 * opções como parâmetro e não lê settings.
 */

/* ── AS AVARIAS ──────────────────────────────────────────────────────────────
 *
 * Uma lista só. Antes eram três, que não batiam: a T10-6 falava em propulsão,
 * armas e casco; o Controle de avarias tinha prazo para motor, armas e
 * sensores; e AVARIA_VIRA_CAMARA ligava motor, armas e sensores a câmaras. O
 * casco do crítico não tinha prazo, e o sensor não tinha de onde vir.
 *
 * `prazo` em rodadas (Controle de avarias); `camara` é a que fica danificada se
 * o prazo vencer (sem câmara, ela só fica até o Reparar). Sem prazo, a avaria
 * sai sozinha no fim da rodada.
 */
export const AVARIAS = {
  motor: { rotulo: "Propulsão", efeito: "movimento à metade", camara: "maquinas", prazo: 3, movimento: 0.5 },
  armas: { rotulo: "Armas", efeito: "−5 nos ataques da nave", camara: "arsenal", prazo: 2, ataque: -5 },
  casco: { rotulo: "Casco", efeito: "−5 no CP", camara: "corredores", prazo: 3, cp: -5 },
  sensores: { rotulo: "Sensores", efeito: "−2 nos ataques; sem Travar alvo nem Varredura", camara: "ponte", prazo: 2, ataque: -2, semSensores: true },
  escudos: { rotulo: "Escudos", efeito: "o Escudo de força e a energia nos Escudos não valem", camara: "ponte", prazo: 2, semEscudo: true },
  pane: { rotulo: "Pane geral", efeito: "a nave não dispara nem ativa equipamento até ser reparada", camara: null, prazo: 1, semAtaque: true, semEscudo: true },
  tripulacao: { rotulo: "Tripulação abalada", efeito: "um posto, à escolha do Mestre, perde a ação nesta rodada", camara: null, prazo: null },
};

/** A ordem em que o Reparar ataca as avarias: a que mais trava a nave primeiro. */
export const PRIORIDADE_DE_REPARO = ["pane", "armas", "escudos", "casco", "motor", "sensores", "tripulacao"];

/* ── O CRÍTICO (T10-6) ───────────────────────────────────────────────────── */

export const CRITICO_T10_6 = {
  1: { texto: "Área crítica: dano ×2.", dobra: true },
  2: { texto: "Avaria na propulsão: dano ×2 e movimento à metade.", dobra: true, avaria: "motor" },
  3: { texto: "Avaria nas armas: dano ×2 e −5 nos ataques da nave alvo.", dobra: true, avaria: "armas" },
  4: { texto: "Casco avariado: dano ×2 e −5 no CP.", dobra: true, avaria: "casco" },
  5: { texto: "Ataque extra contra outra nave ao alcance.", ataqueExtra: true },
  6: { texto: "Pane geral na nave alvo.", avaria: "pane" },
};

/** Falha crítica (1 natural), 1d6. O texto é o de tools/data/naves.mjs. */
export const FALHA_T10_6 = {
  1: "As armas param de funcionar.",
  2: "Perda de controle momentânea: −5 no CP até o próximo turno.",
  3: "Arma temporariamente danificada.",
  4: "Arma permanentemente danificada.",
  5: "Atinge uma nave aliada próxima ao alvo.",
  6: "Perda de controle brusca: −10 no CP até o próximo turno, e um teste de pilotagem para retomar o controle.",
};

/* ── AVARIA POR DANO PESADO (casa, com o Controle de avarias) ────────────────
 *
 * Um acerto que tira 10% ou mais do PV máximo do alvo causa uma avaria, em
 * 1d6. É o que dá trabalho à Engenharia: pelo crítico, a avaria vinha em 5%
 * dos tiros, e o posto passava o combate sem ter o que reparar.
 */
export const LIMIAR_DE_AVARIA = 0.1;
export const AVARIA_POR_DANO = { 1: "motor", 2: "armas", 3: "casco", 4: "sensores", 5: "escudos", 6: "tripulacao" };

export function causaAvaria(dano, pvMax) {
  const max = Number(pvMax) || 0;
  if (max <= 0) return false;
  return (Number(dano) || 0) >= Math.ceil(max * LIMIAR_DE_AVARIA);
}

/* ── O ESTADO DAS AVARIAS ────────────────────────────────────────────────────
 *
 * `nave.avarias[chave]` é `{ rodada, vencida }`. Aceita também o número puro
 * (a rodada), que é como a 1.30 descrevia o campo.
 */
export function lerAvaria(valor) {
  if (valor === null || valor === undefined || valor === false) return null;
  if (typeof valor === "number") return { rodada: valor, vencida: false };
  if (typeof valor === "object") return { rodada: Number(valor.rodada) || 0, vencida: valor.vencida === true };
  return null;
}

export function avariasAtivas(nave) {
  return Object.entries(nave?.avarias ?? {})
    .filter(([chave, v]) => AVARIAS[chave] && lerAvaria(v))
    .map(([chave, v]) => ({ chave, ...lerAvaria(v) }));
}

/**
 * O que as avarias tiram da nave agora.
 *
 * O "Aguentem firme" do Comando cancela UMA penalidade até o fim da rodada: a
 * dos ataques, se houver, senão a do CP — as duas que o §7 cita.
 */
export function penalidadesDeAvaria(nave) {
  const p = { ataque: 0, cp: 0, movimento: 1, semAtaque: false, semEscudo: false, semSensores: false };
  for (const a of avariasAtivas(nave)) {
    const d = AVARIAS[a.chave];
    p.ataque += d.ataque ?? 0;
    p.cp += d.cp ?? 0;
    if (d.movimento) p.movimento = Math.min(p.movimento, d.movimento);
    if (d.semAtaque) p.semAtaque = true;
    if (d.semEscudo) p.semEscudo = true;
    if (d.semSensores) p.semSensores = true;
  }
  if (nave?.aguentem?.ativa) {
    if (p.ataque < 0) p.ataque = 0;
    else if (p.cp < 0) p.cp = 0;
  }
  return p;
}

/* ── O ESCUDO ────────────────────────────────────────────────────────────────
 *
 * Livro: o Escudo de força dá +10 no CP enquanto ativo.
 *
 * Casa (escudo como reserva): em vez de subir o CP, ele ABSORVE dano, até um
 * total por combate. O +10 transformava a luta em dezenas de rodadas de tiro
 * errado (a simulação deu 72 rodadas para uma Escolta derrubar uma Particular
 * com escudo); a reserva faz o escudo apanhar e cair, que é o que pede o
 * "desviem a energia para os escudos!".
 *
 * A reserva vale por COMBATE: o que foi absorvido é gravado junto do id do
 * combate, e num combate novo o escudo volta cheio sem ninguém apertar nada.
 */
export const RESERVA_DO_ESCUDO = { Pequena: 0, "Média": 20, Gigantesca: 50, Colossal: 100 };
export const ESCUDO_POR_PONTO = 5;
export const ESCUDO_CP = 10;

export function escudoFunciona(nave, { temEscudo = false, ponteOk = true } = {}) {
  return Boolean(temEscudo) && Boolean(ponteOk) && !penalidadesDeAvaria(nave).semEscudo;
}

/** Quanto o escudo ainda absorve neste combate, com a energia desta rodada. */
export function escudoRestante(nave, { tamanho, combate = null, temEscudo = false, ponteOk = true } = {}) {
  const energia = penalidadesDeAvaria(nave).semEscudo ? 0 : (Number(nave?.energia?.escudos) || 0) * ESCUDO_POR_PONTO;
  if (!escudoFunciona(nave, { temEscudo, ponteOk })) return energia;
  const max = RESERVA_DO_ESCUDO[tamanho] ?? 0;
  const e = nave?.escudo ?? {};
  const absorvido = e.combate && e.combate === combate ? Number(e.absorvido) || 0 : 0;
  return Math.max(0, max - absorvido) + energia;
}

/* ── O CP DO ALVO ────────────────────────────────────────────────────────── */

/**
 * O CP contra o qual o tiro rola, com cada parte à vista.
 *
 * `cpBase` é o CP da ficha do alvo (o `ac_total` do sistema).
 */
export function cpDoAlvo(nave, { cpBase, temEscudo = false, ponteOk = true, reserva = false } = {}) {
  const base = Number(cpBase);
  if (cpBase === null || cpBase === undefined || cpBase === "" || !Number.isFinite(base)) return null;
  const partes = [];
  const pen = penalidadesDeAvaria(nave);
  if (!reserva && escudoFunciona(nave, { temEscudo, ponteOk })) partes.push(["Escudo de força", ESCUDO_CP]);
  const escudos = Number(nave?.energia?.escudos) || 0;
  if (!reserva && escudos && !pen.semEscudo) partes.push(["energia nos Escudos", escudos * 2]);
  if (pen.cp) partes.push(["avaria no casco", pen.cp]);
  const cp = base + partes.reduce((s, [, v]) => s + v, 0);
  return { cp, base, partes };
}

/* ── O ATAQUE ────────────────────────────────────────────────────────────── */

/**
 * Os termos do ataque e, se for o caso, por que a nave não pode atirar.
 *
 *   · `atacante` e `alvo` são as flags de nave (naveDe);
 *   · `alvoToken` é o id do token alvo, para a trava;
 *   · `suprimida` diz se alguma nave em cena suprimiu esta (ver a ficha).
 */
export function termosDoAtaque({
  atacante = {}, alvo = {}, alvoToken = null, suprimida = false, rajada = false,
  ba = 0, balistico = 0, artilheiro = 0, faixa = 0, situacao = 0, ponteOk = true,
} = {}) {
  if (!ponteOk) return { bloqueio: "ponte", termos: [] };
  const pen = penalidadesDeAvaria(atacante);
  if (pen.semAtaque) return { bloqueio: "pane", termos: [] };

  const termos = [
    ["BA da nave", ba],
    ["Computador Balístico", balistico],
    ["artilheiro", artilheiro],
    ["faixa de alcance", faixa],
    ["Firmar (Leme)", atacante.firmar?.ativa ? 2 : 0],
    ["alvo travado (Sensores)", alvoToken && atacante.trava?.alvo === alvoToken ? 2 : 0],
    ["Rajada", rajada ? -5 : 0],
    ["suprimida", suprimida ? -2 : 0],
    ["interferência do alvo", alvo.interferencia ? -2 : 0],
    ["avarias", pen.ataque],
    ["situação", situacao],
  ]
    .map(([rotulo, v]) => [rotulo, Math.trunc(Number(v) || 0)])
    .filter(([, v]) => v !== 0);
  return { bloqueio: null, termos };
}

/** "1d20 + 12 + 2 - 5", sem os zeros. */
export function formulaDosTermos(termos = []) {
  return ["1d20", ...termos.map(([, n]) => (n > 0 ? `+ ${n}` : `- ${Math.abs(n)}`))].join(" ");
}

/* ── O DANO ──────────────────────────────────────────────────────────────── */

/** "2d10" → { n: 2, faces: 10, resto: "" }. Fórmula que não é NdF → null. */
export function lerDado(formula) {
  const m = String(formula ?? "").replace(/\s+/g, "").match(/^(\d*)d(\d+)(.*)$/i);
  if (!m) return null;
  return { n: Number(m[1] || 1), faces: Number(m[2]), resto: m[3] ?? "" };
}

/** Dano por margem (casa): +1 dado a cada 5 pontos acima do CP. */
export const MARGEM_POR_DADO = 5;
export function dadosPorMargem(total, cp) {
  const t = Number(total);
  const c = Number(cp);
  if (!Number.isFinite(t) || !Number.isFinite(c) || t < c) return 0;
  return Math.floor((t - c) / MARGEM_POR_DADO);
}

/**
 * A fórmula do dano de um acerto, com cada dado extra contado à parte.
 *
 * `energia` são os pontos nas Armas (camada de energia): valem no PRIMEIRO
 * acerto da rodada com aquela arma, porque o §7 diz "+1 dado de dano numa
 * arma", e na metralhadora isso viraria quatro dados.
 */
export function formulaDoDano(arma, { rajada = false, energia = 0, margem = 0 } = {}) {
  const d = lerDado(arma?.dano);
  if (!d) return { formula: String(arma?.dano ?? ""), extras: [] };
  const extras = [
    ["energia nas Armas", Math.max(0, Number(energia) || 0)],
    ["Rajada", rajada ? 1 : 0],
    ["margem sobre o CP", Math.max(0, Number(margem) || 0)],
  ].filter(([, v]) => v > 0);
  const n = d.n + extras.reduce((s, [, v]) => s + v, 0);
  return { formula: `${n}d${d.faces}${d.resto}`, extras };
}

/** O dano final: o multiplicador da mesa e o ×2 do crítico. */
export function danoFinal(rolado, { multiplicador = 1, critico = null } = {}) {
  const m = Math.max(1, Number(multiplicador) || 1);
  return Math.max(0, Math.round((Number(rolado) || 0) * m * (critico?.dobra ? 2 : 1)));
}

/* ── O IMPACTO NO ALVO ───────────────────────────────────────────────────────
 *
 * O que muda na nave alvo quando o Mestre aplica o tiro: o escudo absorve
 * primeiro (na reserva), o resto sai do PV, e as avarias entram com a rodada.
 * Devolve a nave nova e o PV novo; quem grava é a ficha.
 */
export function aplicarImpacto(nave = {}, {
  pv = 0, dano = 0, avarias = [], rodada = 0, reserva = false,
  tamanho, combate = null, temEscudo = false, ponteOk = true,
} = {}) {
  const nova = { ...nave, avarias: { ...(nave.avarias ?? {}) } };
  let resto = Math.max(0, Number(dano) || 0);
  let absorvido = 0;

  if (reserva && resto > 0) {
    const tem = escudoRestante(nave, { tamanho, combate, temEscudo, ponteOk });
    absorvido = Math.min(tem, resto);
    resto -= absorvido;
    if (absorvido > 0 && escudoFunciona(nave, { temEscudo, ponteOk })) {
      // a energia da rodada absorve primeiro, e só o que passar dela gasta a reserva
      const daEnergia = Math.min(absorvido, (Number(nave?.energia?.escudos) || 0) * ESCUDO_POR_PONTO);
      const doEscudo = absorvido - daEnergia;
      const antes = nave.escudo?.combate === combate ? Number(nave.escudo?.absorvido) || 0 : 0;
      nova.escudo = { combate, absorvido: antes + doEscudo };
    }
  }

  for (const chave of avarias) {
    if (!AVARIAS[chave]) continue;
    // a mesma avaria de novo reinicia o prazo, e não empilha a penalidade
    nova.avarias[chave] = { rodada: Number(rodada) || 0, vencida: false };
  }
  const pvNovo = (Number(pv) || 0) - resto;
  return { nave: nova, pv: pvNovo, absorvido, noPV: resto };
}

/* ── O REPARO ────────────────────────────────────────────────────────────── */

/** A avaria que o Reparar tira, pela prioridade; `escolhida` passa na frente. */
export function avariaParaReparar(nave, escolhida = null) {
  const ativas = avariasAtivas(nave).map((a) => a.chave);
  if (escolhida && ativas.includes(escolhida)) return escolhida;
  return PRIORIDADE_DE_REPARO.find((k) => ativas.includes(k)) ?? null;
}

export function repararAvaria(nave, chave) {
  if (!chave) return nave;
  const avarias = { ...(nave?.avarias ?? {}) };
  delete avarias[chave];
  return { ...nave, avarias };
}

/* ── O CALOR DO REATOR (casa, com a camada de energia) ───────────────────────
 *
 * A energia não acumula, e por isso ninguém abria mão de nada. O Calor
 * ACUMULA: é o preço de forçar o reator e de pagar ações extras, e ele cobra
 * no fim de cada rodada, num 1d6 que sai cada vez mais fácil.
 *
 *   · +1 por ponto acima do reator (o "Forçar o reator" dá +2) e por ação
 *     extra comprada com energia;
 *   · no fim da rodada a nave perde 1 sozinha, e o Mestre rola 1d6: num
 *     resultado ≤ Calor, a Sala de Máquinas pega uma avaria (Propulsão);
 *   · a Engenharia pode Ventilar: −2.
 */
export const CUSTO_DA_ACAO_EXTRA = 2;
export const CALOR_POR_VENTILAR = 2;

export function calorGanhoNaRodada(nave) {
  const e = nave?.energia ?? {};
  return (Number(e.extra) || 0) + (Number(e.acoes) || 0);
}

/** O Calor depois do resfriamento natural, antes do teste. */
export function calorNoFimDaRodada(nave) {
  const atual = Math.max(0, Number(nave?.calor) || 0);
  return Math.max(0, atual + calorGanhoNaRodada(nave) - 1);
}

export function calorAvaria(calor, d6) {
  const c = Number(calor) || 0;
  return c > 0 && Number(d6) <= c;
}

/* ── O FIM DA RODADA ─────────────────────────────────────────────────────────
 *
 * O que o botão de Fim da Rodada faz além de limpar os efeitos de rodada:
 *
 *   · com o Controle de avarias: a avaria cujo prazo venceu deixa a CÂMARA
 *     danificada (obra a 25%, metade do prazo). A penalidade continua até o
 *     Reparar — a câmara é estrago de estaleiro, a avaria é susto de combate;
 *   · sem prazo (Tripulação abalada): a avaria sai sozinha;
 *   · com a energia: o Calor, e a avaria que ele causar.
 *
 * `d6` é o dado do Calor, rolado por quem chama (a ficha manda ao chat).
 */
export function fimDaRodada(nave = {}, { rodada = 0, prazos = false, calor = false, d6 = null } = {}) {
  const nova = { ...nave, avarias: { ...(nave.avarias ?? {}) }, camaras: { ...(nave.camaras ?? {}) } };
  const eventos = [];

  for (const a of avariasAtivas(nave)) {
    const d = AVARIAS[a.chave];
    if (d.prazo === null) {
      delete nova.avarias[a.chave];
      continue;
    }
    if (!prazos || a.vencida || !rodada || !a.rodada) continue;
    if (rodada - a.rodada >= d.prazo) {
      nova.avarias[a.chave] = { rodada: a.rodada, vencida: true };
      if (d.camara) {
        nova.camaras[d.camara] = "danificada";
        eventos.push({ tipo: "camara", avaria: a.chave, camara: d.camara });
      }
    }
  }

  if (calor) {
    const c = calorNoFimDaRodada(nave);
    nova.calor = c;
    if (d6 !== null && calorAvaria(c, d6)) {
      nova.avarias.motor = { rodada: Number(rodada) || 0, vencida: false };
      eventos.push({ tipo: "calor", calor: c, d6 });
    }
  }
  return { nave: nova, eventos };
}
