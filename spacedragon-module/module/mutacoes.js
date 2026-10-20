/**
 * As mutações do Mutante, aplicadas na ficha.
 *
 * ── DE ONDE VEM A ESCOLHA ───────────────────────────────────────────────────
 *
 * O Mutante tem duas habilidades de espécie com seletor — "Aprimoramento" e
 * "Degeneração" — e o sistema guarda o que foi escolhido em
 * `system.variable_construction_selections[<id da habilidade no ator>]`, uma
 * lista de `{ key }`. As chaves são as do build (tools/data/mutacoes.mjs →
 * `opcoesDe`): "08-forca-3", "03-mente-simplificada" e assim por diante.
 *
 * A mesma chave existe dos DOIS lados ("07-visao" é Visão ampliada de um lado
 * e diminuída do outro), então o lado vem da habilidade: a flag
 * `spacedragon.mutacao` que o build grava e, para personagens montados antes
 * dela, o nome da habilidade.
 *
 * ── O QUE ENTRA SOZINHO E O QUE FICA COM A MESA ─────────────────────────────
 *
 * Entra o que é NÚMERO FIXO na ficha: atributo ±3 (Atributo Ampliado e
 * Diminuído), −2 de Força (Tato diminuído), o teto de Intelecto 10 (Mente
 * Simplificada), JPR e JPM, CP, ataque à distância (Visão) e a categoria do
 * dado de vida (Funções Vitais).
 *
 * Fica com a mesa o que depende de SITUAÇÃO ("+2 em JPF contra doenças"), de
 * tempo de jogo (XP, descanso, envelhecimento) ou de escolha narrativa (o
 * poder mental, a magia, a dupla personalidade). Esses aparecem num resumo na
 * aba de Espécie, com o texto do livro, para ninguém esquecer que existem.
 *
 * ── O VALOR DIGITADO NÃO MUDA ───────────────────────────────────────────────
 *
 * O +3 de Força NÃO é somado ao campo `system.forca`. Se fosse, o formulário
 * da ficha regravaria o valor somado a cada salvamento, e o +3 viraria +6,
 * +9... O campo guarda o atributo rolado; o módulo calcula o EFETIVO na hora
 * em que precisa (modificador, testes de porcentagem) e mostra o ajuste ao
 * lado do campo.
 *
 * ⚠️ Quem já tinha somado o +3 à mão no campo precisa tirar: o ajuste agora
 * entra sozinho.
 */

import { CAMPO_NA_FICHA } from "./dados.js";

/**
 * O efeito de cada opção, por lado e chave.
 *
 *   atributo  { forca: +3 }        soma ao atributo efetivo
 *   teto      { intelecto: 10 }    o atributo efetivo não passa disto
 *   jp        { jpd: +1, jps: -2 } soma ao modificador da jogada (1d20 + mod ≥ JP)
 *   cp        +2                   soma ao Coeficiente de Proteção
 *   bad       +1                   soma à BA de ataque à distância
 *   dv        +1 / −1              sobe ou desce uma categoria do dado de vida
 *   mesa      texto                o que a ficha não faz; vai para o resumo
 *
 * tools/teste-mutacoes.mjs confere que TODA opção do build tem uma entrada
 * aqui: uma mutação nova no livro não pode passar calada.
 */
const atrib = (a, n) => ({ atributo: { [a]: n } });
const ATRIBUTOS = ["forca", "destreza", "constituicao", "intelecto", "ciencia", "comunicacao"];

export const EFEITOS = {
  aprimoramento: {
    "01-recuperacao-acelerada": { mesa: "Recupera 2 PV por nível por dia de descanso." },
    "02-cognicao-acelerada": { mesa: "+30% de XP." },
    "03-mente-avancada": { jp: { jps: +2 }, mesa: "Resistência mental de 5%." },
    "04-sistema-imunologico-evoluido": { mesa: "+2 em JPF contra doenças, infecções e males que não sejam ferimento." },
    "05-longevidade": { mesa: "Do 10º nível em diante, a cada dois níveis, +1 num atributo à escolha." },
    "06-funcoes-vitais-superiores": { dv: +1 },
    "07-visao": { bad: +1, mesa: "Enxerga no escuro e à distância. Gatunos: +1 em percepção pela visão." },
    "07-audicao": { jp: { jpd: +1 }, mesa: "Escuta com o dobro da capacidade humana. Gatunos: +1 em percepção pela audição." },
    "07-olfato": { mesa: "Olfato dobrado; prende a respiração por Constituição × 20 turnos. Gatunos: +1 em percepção pelo olfato." },
    "07-tato": { mesa: "Reconhece materiais pelo toque e ignora 2 pontos de qualquer dano." },
    "07-paladar": { mesa: "Metade do alimento; imune a doenças e venenos." },
    "07-sexto-sentido": { jp: { jpd: +2 }, cp: +2 },
    ...Object.fromEntries(ATRIBUTOS.map((a) => [`08-${a}-3`, atrib(a, +3)])),
    "09-poderes-mentais": { mesa: "Um poder mental de 1ª Grandeza, uma vez por dia, fora do alcance mental." },
    "10-superpoderes": { mesa: "Uma magia de 1º círculo do Old Dragon, uma vez por dia." },
  },
  degeneracao: {
    "01-recuperacao-lenta": { mesa: "Recupera 1 PV por nível a cada 2 dias de descanso." },
    "02-cognicao-retardada": { mesa: "−30% de XP." },
    "03-mente-simplificada": { jp: { jps: -2 }, teto: { intelecto: 10 } },
    "04-sistema-imunologico-vulneravel": { mesa: "−2 em JPF contra doenças, infecções e males que não sejam ferimento." },
    "05-baixa-expectativa-de-vida": { mesa: "Do 10º nível em diante, a cada dois níveis, −1 num atributo à escolha." },
    "06-funcoes-vitais-debilitadas": { dv: -1 },
    "07-visao": { bad: -1, mesa: "Enxerga mal com muita luz e ao longe. Gatunos: −1 em percepção pela visão." },
    "07-audicao": { jp: { jpd: -1 }, mesa: "Escuta com metade da capacidade humana. Gatunos: −1 em percepção pela audição." },
    "07-olfato": { mesa: "Olfato pela metade; prende a respiração por Constituição × 5 segundos. Gatunos: −1 em percepção pelo olfato." },
    "07-tato": { ...atrib("forca", -2), mesa: "Sofre sempre +2 pontos de qualquer dano." },
    "07-paladar": { mesa: "Dobro do alimento; JP contra doença e veneno falha sempre, e esse dano dobra." },
    "07-sexto-sentido": { jp: { jpd: -2 }, cp: -2 },
    ...Object.fromEntries(ATRIBUTOS.map((a) => [`08-${a}-3`, atrib(a, -3)])),
    "09-dissonancia-mental": { mesa: "Dupla personalidade (poder Criar Dupla Personalidade); cada uma é personagem de nível 1." },
    "10-involucao": { mesa: "Escolha atributo, JP ou ataque: nessas rolagens, 2d20 e fica o pior." },
  },
};

/** O lado de uma habilidade de espécie, ou null se ela não é de mutação. */
export function ladoDa(item) {
  const flag = item?.flags?.spacedragon?.mutacao;
  if (flag === "aprimoramento" || flag === "degeneracao") return flag;
  if (item?.name === "Aprimoramento") return "aprimoramento";
  if (item?.name === "Degeneração") return "degeneracao";
  return null;
}

/**
 * As mutações escolhidas pelo ator: `[{ lado, chave, nome, descricao }]`.
 * `nome` e `descricao` vêm das opções gravadas na própria habilidade, que são
 * o texto que o jogador viu no seletor.
 */
export function mutacoesDe(ator) {
  const selecoes = ator?.system?.variable_construction_selections ?? {};
  const saida = [];
  for (const [id, escolhas] of Object.entries(selecoes)) {
    const item = ator?.items?.get?.(id);
    const lado = ladoDa(item);
    if (!lado) continue;
    const opcoes = item?.system?.variable_construction?.available_options ?? [];
    for (const e of Array.isArray(escolhas) ? escolhas : []) {
      if (!e?.key || e.key === "custom") continue;
      const op = opcoes.find((o) => o.key === e.key);
      saida.push({ lado, chave: e.key, nome: op?.name ?? e.key, descricao: op?.description ?? "" });
    }
  }
  return saida;
}

const VAZIO = () => ({ atributo: {}, teto: {}, jp: { jpd: 0, jpc: 0, jps: 0 }, cp: 0, bad: 0, dv: 0, mesa: [], conhecidas: [] });

/**
 * Tudo o que as mutações do ator fazem, somado.
 *
 * `conhecidas` lista as que têm efeito na ficha; `mesa`, as que ficam com a
 * mesa, com o nome e o lembrete.
 */
export function efeitosDe(ator) {
  const total = VAZIO();
  for (const m of mutacoesDe(ator)) {
    const ef = EFEITOS[m.lado]?.[m.chave];
    if (!ef) {
      total.mesa.push({ nome: m.nome, texto: m.descricao });
      continue;
    }
    for (const [a, n] of Object.entries(ef.atributo ?? {})) total.atributo[a] = (total.atributo[a] ?? 0) + n;
    for (const [a, n] of Object.entries(ef.teto ?? {})) total.teto[a] = Math.min(total.teto[a] ?? Infinity, n);
    for (const [j, n] of Object.entries(ef.jp ?? {})) total.jp[j] += n;
    total.cp += ef.cp ?? 0;
    total.bad += ef.bad ?? 0;
    total.dv += ef.dv ?? 0;
    if (ef.atributo || ef.teto || ef.jp || ef.cp || ef.bad || ef.dv) total.conhecidas.push(m);
    if (ef.mesa) total.mesa.push({ nome: m.nome, texto: ef.mesa });
  }
  return total;
}

/**
 * O atributo EFETIVO: o valor do campo, mais o ajuste das mutações, limitado
 * pelo teto. `atributo` é o nome do Space Dragon (forca, intelecto, ciencia…).
 * `cru` é opcional: quem já leu o campo passa o número, e economiza a leitura.
 */
export function atributoEfetivo(ator, atributo, cru = undefined) {
  const base = Number(cru ?? ator?.system?.[CAMPO_NA_FICHA[atributo]]) || 0;
  if (!base) return base;
  const ef = efeitosDe(ator);
  const v = base + (ef.atributo[atributo] ?? 0);
  return Math.max(1, Math.min(v, ef.teto[atributo] ?? Infinity));
}

/** O dado de vida depois das mutações: d4 → d6 numa, d4 → d2 na outra. */
const ESCADA_DV = [2, 4, 6, 8, 10, 12];
export function dadoDeVidaComMutacao(dado, passos) {
  const d = Number(dado) || 0;
  if (!d || !passos) return d;
  const i = ESCADA_DV.indexOf(d);
  if (i < 0) return d;
  return ESCADA_DV[Math.max(0, Math.min(ESCADA_DV.length - 1, i + passos))];
}

/**
 * Aprimoramento e degeneração com o MESMO número da T2-1. O livro manda
 * rerrolar até darem números diferentes; a ficha do sistema não valida, então
 * o resumo avisa.
 */
export function mesmoNumero(ator) {
  const num = (lado) => mutacoesDe(ator).filter((m) => m.lado === lado).map((m) => m.chave.slice(0, 2));
  const ap = num("aprimoramento");
  return num("degeneracao").find((n) => ap.includes(n)) ?? null;
}
