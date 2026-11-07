/**
 * O Combate Cinematográfico de naves — REGRA DA CASA, ligada por opção de mundo.
 *
 * ── POR QUE ELE EXISTE ──────────────────────────────────────────────────────
 *
 * No teste da mesa, o combate do §10.6 (com as Compiladas por cima) ficou longo,
 * sem emoção e com metade da tripulação sem nada para fazer: uma Espaçonave
 * particular de 3d100 PV levava umas 27 rodadas para cair diante de um
 * disparador de 2d10. Nenhuma camada a mais salva essa conta.
 *
 * O Cinematográfico troca a escala, não as armas:
 *
 *   · Escudo + Casco, números pequenos e fixos por tipo (o Casco é o PV do
 *     token, para a barra descer na mesa);
 *   · duelo de pilotos no começo da rodada, que dá a ordem e uma Vantagem;
 *   · Tensão: +1 em todos os ataques por rodada, até +5;
 *   · o acerto que passa o CP por 5 ou mais e chega ao Casco atinge uma câmara
 *     (d12, na ordem das doze), e a câmara vira emergência a bordo.
 *
 * Fonte: o cofre, "Naves - Combate Cinematografico.md" (Novos Itens).
 *
 * ── O QUE NÃO ESTÁ AQUI ─────────────────────────────────────────────────────
 *
 * Ameaças (esquadrão, seções, moral), Talentos e Manias, Eventos e a fuga: são
 * a segunda entrega. Este arquivo tem só o núcleo.
 *
 * Nada aqui toca `game`, `canvas` ou `ui`: tools/teste-nave-cinematico.mjs
 * testa tudo em Node.
 */

/* ── A ESCALA (§1) ───────────────────────────────────────────────────────────
 *
 * Escudo só com Escudo de força instalado (que não cabe em nave pequena, T10-4).
 * Agilidade soma ao Pilotar no duelo e nas manobras; Recarga é o que o escudo
 * volta quando a Engenharia recarrega ou prioriza Escudos.
 */
export const ESCALA = {
  caca: { escudo: 0, casco: 20, agilidade: 20, recarga: null },
  capsula: { escudo: 0, casco: 15, agilidade: 20, recarga: null },
  escolta: { escudo: 0, casco: 30, agilidade: 20, recarga: null },
  particular: { escudo: 15, casco: 40, agilidade: 0, recarga: "1d10" },
  cargueiro: { escudo: 30, casco: 80, agilidade: -20, recarga: "2d10" },
  transuniversal: { escudo: 30, casco: 80, agilidade: -20, recarga: "2d10" },
  cruzador: { escudo: 60, casco: 150, agilidade: -40, recarga: "3d10" },
  naveMae: { escudo: 60, casco: 200, agilidade: -40, recarga: "3d10" },
};

/** A escala do tipo, com o Escudo zerado se a nave não tem Escudo de força. */
export function escalaDoTipo(tipo, { temEscudo = false } = {}) {
  const e = ESCALA[tipo];
  if (!e) return null;
  const comEscudo = Boolean(temEscudo) && e.escudo > 0;
  return {
    escudo: comEscudo ? e.escudo : 0,
    casco: e.casco,
    agilidade: e.agilidade,
    recarga: comEscudo ? e.recarga : null,
  };
}

/** Abaixo da metade do Casco: −20% em todo teste de Pilotar. */
export const PENALIDADE_CASCO_BAIXO = -20;
export function cascoAbaixoDaMetade(casco, max) {
  const c = Number(casco);
  const m = Number(max);
  return Number.isFinite(c) && Number.isFinite(m) && m > 0 && c < m / 2;
}

/* ── O DUELO DE PILOTOS (§3) ─────────────────────────────────────────────────
 *
 * A escala de graus é a da T10-5 (livro), e o modificador de JP vale para toda
 * JP da nave na rodada: o duelo É o teste de pilotagem da rodada.
 */
export const GRAUS = [
  { chave: "critico", rotulo: "Crítico", ordem: 6, jp: 8 },
  { chave: "otimo", rotulo: "Ótimo", ordem: 5, jp: 4 },
  { chave: "sucesso", rotulo: "Sucesso", ordem: 4, jp: 2 },
  { chave: "falha", rotulo: "Falha", ordem: 3, jp: -2 },
  { chave: "grave", rotulo: "Falha grave", ordem: 2, jp: -4 },
  { chave: "desastre", rotulo: "Desastre", ordem: 1, jp: -8 },
];
export const GRAU = Object.fromEntries(GRAUS.map((g) => [g.chave, g]));

/**
 * O grau de um teste de porcentagem.
 *
 * 01 é sempre Crítico e 100 sempre Desastre, seja qual for a chance — por isso
 * um piloto com 110% ainda erra no 100. `limiarGrave` é 80 pelo livro; a Mania
 * *Puxa para a esquerda* o baixa para 70.
 */
export function grauDoTeste(chance, d100, { limiarGrave = 80 } = {}) {
  const r = Math.trunc(Number(d100));
  const c = Number(chance) || 0;
  if (r <= 1) return GRAU.critico;
  if (r >= 100) return GRAU.desastre;
  if (r <= c) return r <= 20 ? GRAU.otimo : GRAU.sucesso;
  return r > limiarGrave ? GRAU.grave : GRAU.falha;
}

/** A chance do duelo: Pilotar + Agilidade + o que pesa nesta rodada. */
export function chanceDoDuelo({
  pilotar = 0, agilidade = 0, cascoBaixo = false, avarias = {}, motores = false, interferencia = false,
} = {}) {
  const partes = [
    ["Pilotar", Number(pilotar) || 0],
    ["Agilidade", Number(agilidade) || 0],
    ["Casco abaixo da metade", cascoBaixo ? PENALIDADE_CASCO_BAIXO : 0],
    ["Prioridade Motores", motores ? 20 : 0],
    ["Interferência inimiga", interferencia ? -20 : 0],
    ...penalidadesDeCamara(avarias).duelo,
  ].filter(([, v]) => v !== 0);
  return { chance: partes.reduce((s, [, v]) => s + v, 0), partes };
}

export const ORDEM_DO_TAMANHO = { Pequena: 0, "Média": 1, Gigantesca: 2, Colossal: 3 };

/**
 * Quem vence o duelo entre `a` e `b`: o grau maior; no empate, a nave menor;
 * no empate de tamanho, o grupo. Devolve "a", "b" ou "empate".
 */
export function vencedorDoDuelo(a = {}, b = {}) {
  const ga = GRAU[a.grau]?.ordem ?? 0;
  const gb = GRAU[b.grau]?.ordem ?? 0;
  if (ga !== gb) return ga > gb ? "a" : "b";
  const ta = ORDEM_DO_TAMANHO[a.tamanho] ?? 1;
  const tb = ORDEM_DO_TAMANHO[b.tamanho] ?? 1;
  if (ta !== tb) return ta < tb ? "a" : "b";
  if (Boolean(a.grupo) !== Boolean(b.grupo)) return a.grupo ? "a" : "b";
  return "empate";
}

/**
 * A iniciativa que põe a rodada na ordem do duelo.
 *
 * «Primeiro os inimigos que venceram o duelo, depois a nave do grupo, por fim
 * os que perderam.» Com UMA nave do grupo, ordenar pelo grau (e desempatar como
 * o próprio duelo desempata) produz exatamente essa ordem: quem venceu o grupo
 * tem número maior, quem perdeu, menor. O meio ponto do grupo é o desempate de
 * tamanho igual.
 */
export function iniciativaDoDuelo({ grau, tamanho, grupo = false } = {}) {
  const g = GRAU[grau]?.ordem ?? 0;
  const t = 3 - (ORDEM_DO_TAMANHO[tamanho] ?? 1);
  return g * 10 + t * 2 + (grupo ? 1 : 0);
}

export const VANTAGENS = {
  mira: { rotulo: "Mira", efeito: "+2 em todos os seus ataques contra ele." },
  cauda: { rotulo: "Na cauda", efeito: "Ele sofre −2 em todos os ataques contra você." },
  bloqueio: { rotulo: "Bloqueio", efeito: "Ele não pode fazer Manobra de risco." },
  posicao: { rotulo: "Posição", efeito: "Avança 1 etapa da fuga, ou apaga 1 marca do perseguidor." },
};

/* ── A TENSÃO (§2.1) ─────────────────────────────────────────────────────── */

export const TENSAO_MAXIMA = 5;

/** +0 na 1ª rodada, +1 na 2ª… até +5. Vale para os DOIS lados. */
export function tensaoDaRodada(rodada) {
  const r = Math.trunc(Number(rodada) || 0);
  return Math.max(0, Math.min(TENSAO_MAXIMA, r - 1));
}

/** A rodada em que a Tensão chega a +3 ou a +5 pede um Evento. */
export function pedeEvento(rodada) {
  const t = tensaoDaRodada(rodada);
  const antes = tensaoDaRodada(Number(rodada) - 1);
  return t !== antes && (t === 3 || t === 5);
}

/* ── O ATAQUE ────────────────────────────────────────────────────────────── */

/**
 * Os termos do ataque no Cinematográfico, cada um com nome, para o cartão.
 *
 *   · `vantagem`: a(s) minha(s) contra este alvo, chave ou lista ("mira" dá +2);
 *   · `caudaContraMim`: o alvo está na minha cauda (−2);
 *   · `firmar`: o Leme firmou nesta rodada (+2).
 */
export function termosCine({
  ba = 0, balistico = 0, artilheiro = 0, rodada = 0, vantagem = null, caudaContraMim = false,
  firmar = false, rajada = false, mirarSistema = false, supressao = false, avarias = {}, situacao = 0,
} = {}) {
  const pen = penalidadesDeCamara(avarias);
  return [
    ["BA da nave", ba],
    ["Computador Balístico", pen.semBalistico ? 0 : balistico],
    ["artilheiro", artilheiro],
    ["Tensão", tensaoDaRodada(rodada)],
    ["Mira (duelo)", [].concat(vantagem ?? []).includes("mira") ? 2 : 0],
    ["Na cauda (inimigo)", caudaContraMim ? -2 : 0],
    ["Firmar (Leme)", firmar ? 2 : 0],
    ["Rajada", rajada ? -4 : 0],
    ["Mirar sistema", mirarSistema ? -4 : 0],
    ["Supressão sofrida", supressao ? -4 : 0],
    ["avaria na Ponte", pen.ataque],
    ["situação", situacao],
  ]
    .map(([r, v]) => [r, Math.trunc(Number(v) || 0)])
    .filter(([, v]) => v !== 0);
}

/* ── O DANO: ESCUDO, DEPOIS CASCO (§5.1) ─────────────────────────────────── */

/** O dano vai primeiro ao Escudo; o que sobrar passa ao Casco. */
export function aplicarDanoCine({ escudo = 0, casco = 0, dano = 0 } = {}) {
  const e = Math.max(0, Number(escudo) || 0);
  const d = Math.max(0, Number(dano) || 0);
  const noEscudo = Math.min(e, d);
  const noCasco = d - noEscudo;
  return { escudo: e - noEscudo, casco: (Number(casco) || 0) - noCasco, noEscudo, noCasco };
}

export const MARGEM_DE_CAMARA = 5;
export const MARGEM_TRAVADO = 2;

/**
 * O acerto atinge uma câmara?
 *
 * Só se chegou ao Casco: dano no Escudo nunca atinge câmara. Com o Casco
 * atingido, vale o 20 natural, a margem de 5+ (ou 2+ contra alvo travado), ou
 * o *Mirar sistema* (que escolhe a câmara sem margem).
 */
export function atingeCamara({ total, cp, natural, noCasco = 0, travado = false, mirarSistema = false, margem = null } = {}) {
  if (!(Number(noCasco) > 0)) return false;
  if (Number(natural) === 20 || mirarSistema) return true;
  const precisa = margem ?? (travado ? MARGEM_TRAVADO : MARGEM_DE_CAMARA);
  return Number(total) - Number(cp) >= precisa;
}

/* ── AS CÂMARAS NO d12 (§5.2) ────────────────────────────────────────────────
 *
 * Na ordem da tabela das doze (camaras.js). Três famílias:
 *
 *   sistema   penalidade mecânica;
 *   incendio  dano no Casco no fim de cada rodada, e espalha em 2 rodadas;
 *   brecha    1d4 no Casco por rodada, e a câmara só se usa com traje.
 */
export const D12 = [
  { camara: "ponte", familia: "sistema" },
  { camara: "aposentos", familia: "incendio", dado: "1d6", dadoFora: "2d6" },
  { camara: "maquinas", familia: "sistema" },
  { camara: "deposito", familia: "incendio", dado: "1d6", dadoFora: "2d6" },
  { camara: "refeitorio", familia: "incendio", dado: "1d6", dadoFora: "2d6" },
  { camara: "arsenal", familia: "sistema" },
  { camara: "hospital", familia: "incendio", dado: "1d10", dadoFora: "2d10" },
  { camara: "laboratorio", familia: "incendio", dado: "1d10", dadoFora: "2d10" },
  { camara: "acoplagem", familia: "brecha", dado: "1d4" },
  { camara: "despressurizacao", familia: "brecha", dado: "1d4" },
  { camara: "corredores", familia: "brecha", dado: "1d4" },
  { camara: "emergencia", familia: "sistema" },
];
export const FAMILIA_DA_CAMARA = Object.fromEntries(D12.map((d) => [d.camara, d.familia]));

/** O que cada câmara atingida faz, enquanto avariada e quando cai Fora. */
export const EFEITO_NA_CAMARA = {
  ponte: { avaria: "−2 nos ataques da nave e −20% em Pilotar.", fora: "Sem armas, sem escudo; Pilotar só acerta com 5% ou menos." },
  aposentos: { avaria: "Incêndio: 1d6 no Casco por rodada.", fora: "Incêndio de 2d6." },
  maquinas: { avaria: "Sem Prioridade, sem recarga de escudo, −20% no duelo.", fora: "Escudo cai a 0; a nave perde todo duelo." },
  deposito: { avaria: "Incêndio: 1d6 por rodada.", fora: "2d6; a carga é perdida." },
  refeitorio: { avaria: "Incêndio: 1d6 por rodada.", fora: "2d6." },
  arsenal: { avaria: "Uma arma, escolhida pelo atacante, não dispara.", fora: "Explosão secundária: 2d10 no Casco, e outra arma não dispara." },
  hospital: { avaria: "Incêndio: 1d10 por rodada (oxigênio medicinal).", fora: "2d10." },
  laboratorio: { avaria: "Incêndio: 1d10 por rodada (químicos); quem entrar sem traje faz JPR ou leva 1d6.", fora: "2d10." },
  acoplagem: { avaria: "Brecha: comporta aberta, o inimigo aborda sem teste.", fora: "Câmara selada e perdida até a obra." },
  despressurizacao: { avaria: "Brecha: 1d4 por rodada.", fora: "Câmara selada e perdida até a obra." },
  corredores: { avaria: "Brecha: ir de uma câmara a outra custa duas ações, ou uma com traje.", fora: "Ponte e Sala de Máquinas isoladas: só se passa com traje." },
  emergencia: { avaria: "Cápsulas travadas: com o Casco a 0, não há fuga até resolver.", fora: "Cápsulas perdidas." },
};

/** A câmara do d12 (1 a 12). */
export function camaraDoD12(n) {
  return D12[Math.trunc(Number(n)) - 1] ?? null;
}

/** Quem estiver na câmara atingida faz JPR; se falhar, leva 1d6. */
export const DANO_A_BORDO = "1d6";
/** Câmara ausente: o tiro atravessa a estrutura vazia. */
export const EXTRA_CAMARA_AUSENTE = "1d10";
/** A explosão do Arsenal quando cai Fora. */
export const EXPLOSAO_DO_ARSENAL = "2d10";

/**
 * O que um acerto faz numa câmara.
 *
 *   · ausente  → +1d10 no Casco;
 *   · presente (instalada ou danificada — a danificada continua lá) → avaria;
 *     se já estava avariada ou Fora, cai Fora.
 */
export function golpeNaCamara(estadoDaCamara, avariaAtual = null) {
  if (estadoDaCamara !== "instalada" && estadoDaCamara !== "danificada") {
    return { tipo: "ausente", extra: EXTRA_CAMARA_AUSENTE };
  }
  if (avariaAtual?.estado === "avaria" || avariaAtual?.estado === "fora") {
    return { tipo: "fora", extra: null };
  }
  return { tipo: "avaria", extra: null };
}

/** Grava o golpe nas avarias de câmara da nave. Devolve o mapa novo. */
export function registrarGolpe(avarias = {}, camara, tipo, rodada = 0) {
  if (tipo !== "avaria" && tipo !== "fora") return { ...avarias };
  const atual = avarias[camara];
  return {
    ...avarias,
    [camara]: { estado: tipo, desde: atual?.desde ?? (Number(rodada) || 0) },
  };
}

/** Resolver tira a avaria; uma câmara Fora não se resolve em combate. */
export function resolverAvaria(avarias = {}, camara) {
  if (avarias[camara]?.estado !== "avaria") return { ...avarias };
  const novo = { ...avarias };
  delete novo[camara];
  return novo;
}

/**
 * As penalidades que as avarias de câmara impõem, somadas.
 *
 * `duelo` volta como termos com nome, para o cartão do duelo mostrar de onde
 * cada −20% veio.
 */
export function penalidadesDeCamara(avarias = {}) {
  const est = (k) => avarias?.[k]?.estado ?? null;
  const ponte = est("ponte");
  const maquinas = est("maquinas");
  const arsenal = est("arsenal");
  return {
    ataque: ponte === "avaria" ? -2 : 0,
    pilotar: ponte === "avaria" ? -20 : 0,
    duelo: [
      ["Ponte avariada", ponte === "avaria" ? -20 : 0],
      ["Sala de Máquinas avariada", maquinas === "avaria" ? -20 : 0],
    ].filter(([, v]) => v !== 0),
    semArmas: ponte === "fora",
    semEscudo: ponte === "fora" || maquinas === "fora",
    pilotarSo5: ponte === "fora",
    semBalistico: ponte === "fora",
    perdeDuelo: maquinas === "fora",
    semPrioridade: maquinas === "avaria" || maquinas === "fora",
    semRecarga: maquinas === "avaria" || maquinas === "fora",
    armasParadas: arsenal === "fora" ? 2 : arsenal === "avaria" ? 1 : 0,
    corredores: est("corredores"),
    capsulas: est("emergencia"),
  };
}

/* ── O FIM DA RODADA (§2, passo 4) ───────────────────────────────────────── */

export const RODADAS_PARA_ESPALHAR = 2;

/** As brechas que, Fora, viram «câmara selada e perdida até a obra» (§5.2). */
export const SELADAS_QUANDO_FORA = new Set(["acoplagem", "despressurizacao"]);

/**
 * Qual rodada o botão Fim da rodada fecha.
 *
 * A de agora — a não ser que o rastreador esteja no COMEÇO de uma rodada nova
 * (`inicio`: o primeiro turno dela) e a anterior não tenha sido fechada: aí o
 * Mestre avançou antes de clicar, e o que se fecha é a anterior, porque na nova
 * nada aconteceu ainda. Uma marca maior que a rodada de agora é de outro
 * combate e não conta. Devolve `null` se a rodada já foi fechada.
 */
export function rodadaAFechar(fechada, rodadaAtual, { inicio = false } = {}) {
  const r = Math.trunc(Number(rodadaAtual) || 0);
  if (r < 1) return null;
  let f = Math.trunc(Number(fechada) || 0);
  if (f > r) f = 0;
  const alvo = inicio && r > 1 && f < r - 1 ? r - 1 : r;
  return alvo > f ? alvo : null;
}

/**
 * O que o fim da rodada cobra das avarias de câmara.
 *
 *   · cada incêndio e cada brecha rola o dado dela (o Fora do incêndio dobra);
 *   · um incêndio que está há 2 rodadas sem ser apagado espalha para a câmara
 *     de número seguinte, se ela estiver instalada e ainda sem avaria.
 *
 * `estados` é o estado das câmaras (instalada/danificada/ausente). Devolve as
 * fórmulas a rolar e o mapa de avarias depois do fogo andar.
 */
export function fimDaRodadaCine(avarias = {}, { rodada = 0, estados = {} } = {}) {
  const danos = [];
  const novas = { ...avarias };
  const espalhou = [];
  D12.forEach((d, i) => {
    const a = avarias[d.camara];
    if (!a || (d.familia !== "incendio" && d.familia !== "brecha")) return;
    // Acoplagem e Despressurização Fora são «câmara selada e perdida»: não
    // vazam mais. Corredores Fora é outra coisa (Ponte e Máquinas isoladas) e
    // continua sendo brecha, que cobra 1d4.
    if (a.estado === "fora" && SELADAS_QUANDO_FORA.has(d.camara)) return;
    const formula = a.estado === "fora" && d.dadoFora ? d.dadoFora : d.dado;
    danos.push({ camara: d.camara, familia: d.familia, formula });
    if (d.familia !== "incendio") return;
    const desde = Number(a.desde) || 0;
    if (Number(rodada) - desde + 1 < RODADAS_PARA_ESPALHAR) return;
    const prox = D12[i + 1];
    if (!prox || novas[prox.camara] || estados[prox.camara] !== "instalada") return;
    novas[prox.camara] = { estado: "avaria", desde: Number(rodada) + 1 };
    espalhou.push({ de: d.camara, para: prox.camara });
  });
  return { danos, avarias: novas, espalhou };
}

/**
 * Depois do combate (§5.5): a avaria ativa ganha um último teste; a câmara
 * Fora fica danificada direto.
 */
export function depoisDoCombate(avarias = {}) {
  const ultimoTeste = [];
  const danificadas = [];
  for (const [camara, a] of Object.entries(avarias)) {
    if (a?.estado === "fora") danificadas.push(camara);
    else if (a?.estado === "avaria") ultimoTeste.push(camara);
  }
  return { ultimoTeste, danificadas };
}

/* ── A FALHA CRÍTICA (§5.4) ──────────────────────────────────────────────── */

export const FALHA_CINE = {
  1: { texto: "Arma emperrada: esta arma não dispara na próxima rodada." },
  2: { texto: "Arma emperrada: esta arma não dispara na próxima rodada." },
  3: { texto: "Superaquecimento: esta arma sofre −2 até alguém Resolver (Arsenal)." },
  4: { texto: "Perda de controle: −4 de CP até o próximo turno da nave." },
  5: { texto: "Fogo amigo: o tiro acerta uma nave aliada perto do alvo, se houver; senão, Arma emperrada." },
  6: { texto: "Sobrecarga: avaria na Sala de Máquinas.", camara: "maquinas" },
};

/* ── A ENGENHARIA: PRIORIDADE (§4) ───────────────────────────────────────── */

export const PRIORIDADES = {
  armas: { rotulo: "Armas", efeito: "+1 dado de dano em uma arma." },
  escudos: { rotulo: "Escudos", efeito: "No fim da rodada, o Escudo recupera a Recarga." },
  motores: { rotulo: "Motores", efeito: "+20% no duelo da próxima rodada e nas Manobras de risco desta." },
};

/** O Escudo depois de recarregar `rolado`, sem passar do máximo. */
export function recarregar(escudo, max, rolado) {
  return Math.min(Math.max(0, Number(max) || 0), Math.max(0, Number(escudo) || 0) + Math.max(0, Number(rolado) || 0));
}

/* ── OS POSTOS (§4) ──────────────────────────────────────────────────────────
 *
 * O que cada posto pode fazer. A ficha mostra a lista; o que tem efeito
 * mecânico simples (Firmar, Giro evasivo, Recarregar, Reparo, Travar,
 * Interferência) a ficha aplica — o resto é decisão da mesa.
 */
export const ACOES_CINE = {
  leme: [
    { chave: "firmar", rotulo: "Firmar", efeito: "+2 nos ataques dos artilheiros nesta rodada; −2 de CP até o próximo turno." },
    { chave: "giro", rotulo: "Giro evasivo", efeito: "Teste: +4 de CP até o próximo turno; falha, −2." },
    { chave: "manobra", rotulo: "Outra Manobra de risco", efeito: "Freio brusco, Rasante, Pelo terreno, Fingir de morto, Abalroar." },
    { chave: "salto", rotulo: "Calcular salto", efeito: "Avança uma etapa da fuga." },
  ],
  artilharia: [
    { chave: "certeiro", rotulo: "Tiro certeiro", efeito: "Disparo normal." },
    { chave: "rajada", rotulo: "Rajada", efeito: "−4; se acertar, +1 dado." },
    { chave: "supressao", rotulo: "Supressão", efeito: "Sem dano; o alvo sofre −4 e não faz Manobra de risco." },
    { chave: "mirar", rotulo: "Mirar sistema", efeito: "−4; se acertar o Casco, você escolhe a câmara." },
  ],
  engenharia: [
    { chave: "recarregar", rotulo: "Recarregar escudo", efeito: "O Escudo recupera a Recarga agora." },
    { chave: "reparo", rotulo: "Reparo de emergência", efeito: "+1d10 de Casco; não em duas rodadas seguidas." },
    { chave: "forcar", rotulo: "Forçar o reator", efeito: "Duas Prioridades; 1d6 = 1, avaria na Sala de Máquinas." },
    { chave: "resolver", rotulo: "Resolver avaria", efeito: "Resolve a avaria da Sala de Máquinas sem se deslocar." },
  ],
  sensores: [
    { chave: "travar", rotulo: "Travar alvo", efeito: "O próximo acerto no Casco desse alvo atinge câmara com margem 2+." },
    { chave: "varredura", rotulo: "Varredura", efeito: "Revela Escudo, Casco, avarias e intenção do alvo." },
    { chave: "interferencia", rotulo: "Interferência", efeito: "Um inimigo duela com −20% na próxima rodada." },
    { chave: "despistar", rotulo: "Despistar míssil", efeito: "+4 nas JP contra mísseis nesta rodada." },
  ],
  comando: [
    { chave: "ordem", rotulo: "Ordem", efeito: "Um posto age duas vezes (não o mesmo em rodadas seguidas)." },
    { chave: "sangue", rotulo: "Sangue frio", efeito: "Um aliado rerrola um dado." },
    { chave: "aguentem", rotulo: "Aguentem firme", efeito: "Anula a penalidade de uma avaria nesta rodada." },
    { chave: "abandonar", rotulo: "Abandonar a nave!", efeito: "Com o Casco a 0, todos na Ponte chegam à Saída de Emergência." },
  ],
};

/** O Reparo de emergência não pode ser repetido em rodadas seguidas. */
export function podeRepararAgora(ultimoReparo, rodada) {
  if (ultimoReparo === null || ultimoReparo === undefined) return true;
  return Number(rodada) - Number(ultimoReparo) >= 2;
}
