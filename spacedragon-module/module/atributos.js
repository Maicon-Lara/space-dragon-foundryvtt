/**
 * Os modificadores de atributo passam a ser os do Space Dragon.
 *
 * ── O PROBLEMA ──────────────────────────────────────────────────────────────
 *
 * As duas escalas não são a mesma coisa com nomes diferentes:
 *
 *                      Old Dragon 2        Space Dragon
 *   faixa neutra       9–12                10–11
 *   teto               20 (+4)             29 (+9)
 *   degraus            irregulares         de dois em dois, sempre
 *
 * Constituição 9 dá 0 no Old Dragon 2 e −1 no Space Dragon. Destreza 20 dá +4
 * lá e +5 aqui — e Destreza 29, que existe no Space Dragon, o Old Dragon 2 nem
 * sabe ler.
 *
 * Isso contamina tudo o que deriva dos atributos: base de ataque, coeficiente
 * de proteção, pontos de vida, jogadas de proteção. Um módulo de conteúdo não
 * consegue consertar isso escrevendo texto: quem calcula é o sistema.
 *
 * ── A EMENDA ────────────────────────────────────────────────────────────────
 *
 * O sistema expõe os modificadores como GETTERS no modelo de dados do
 * personagem — `get mod_forca() { return calculateAttributeModifier(this.forca) }`
 * e assim por diante. Trocamos os seis getters no protótipo, e tudo o que os lê
 * passa a ver o número certo, sem tocar em nada que o ator guarde em disco.
 *
 * Nenhum dado é reescrito. Desligar a opção, ou o módulo, devolve o sistema ao
 * que ele era.
 *
 * ── A ESCOLHA DE CADA CAIXA ─────────────────────────────────────────────────
 *
 * A ficha do Old Dragon 2 tem uma caixa derivada por atributo, e a ficha
 * oficial do Space Dragon também. Elas casam uma a uma:
 *
 *   FOR → ajuste de ataque e dano corpo a corpo   (T1-1)
 *   DES → ajuste de ataque à distância e proteção (T1-2)
 *   CON → ajuste de pontos de vida e proteção     (T1-3)
 *   INT → proteção mental                         (T1-4, campo Sabedoria)
 *   CIE → aptidão tecnológica                     (T1-5, campo Inteligência)
 *   COM → ajuste de reação                        (T1-6, campo Carisma)
 *
 * ⚠️ As duas últimas são PORCENTAGEM, não modificador de d20. O lang do módulo
 * troca os rótulos para "APT. TEC" e "REAÇÃO" justamente para que ninguém as
 * some numa rolagem de ataque. O sistema não usa nenhuma das duas em conta
 * alguma, então mostrá-las ali é ganho puro.
 */

import { FAIXAS, CAMPO_NA_FICHA, COLUNA_DERIVADA } from "./dados.js";

const ID = "spacedragon";

/** Índice da faixa de atributo. Satura fora da escala de 1 a 29. */
function faixaDe(valor) {
  const v = Number(valor) || 0;
  if (v <= 1) return 0;
  if (v >= 29) return FAIXAS.length - 1;
  return FAIXAS.findIndex(([min, max]) => v >= min && v <= max);
}

/** Os seis getters, do nome do campo na ficha para a coluna do livro. */
function getters() {
  const saida = {};
  for (const [atributo, campo] of Object.entries(CAMPO_NA_FICHA)) {
    const coluna = COLUNA_DERIVADA[atributo];
    if (!coluna) continue;
    saida[`mod_${campo}`] = function () {
      return Number(coluna[faixaDe(this[campo])] ?? 0);
    };
  }
  return saida;
}

/**
 * Troca os getters no protótipo do modelo de dados do personagem.
 *
 * Guarda os originais para que a opção possa ser desligada sem recarregar.
 */
let originais = null;

export function aplicarModificadores(ligado) {
  const proto = CONFIG.Actor?.dataModels?.character?.prototype;
  if (!proto) {
    console.warn(`${ID} | modelo de dados do personagem não encontrado — modificadores ficam os do OD2`);
    return false;
  }

  if (ligado) {
    const novos = getters();
    if (!originais) {
      originais = {};
      for (const nome of Object.keys(novos)) {
        originais[nome] = Object.getOwnPropertyDescriptor(proto, nome);
      }
    }
    for (const [nome, fn] of Object.entries(novos)) {
      Object.defineProperty(proto, nome, { get: fn, configurable: true });
    }
    return true;
  }

  if (originais) {
    for (const [nome, desc] of Object.entries(originais)) {
      if (desc) Object.defineProperty(proto, nome, desc);
    }
  }
  return false;
}

/** Mostra as duas escalas lado a lado, para conferir na mesa. */
export function compararEscalas() {
  const linhas = FAIXAS.map(([min, max], i) => ({
    valor: min === max ? `${min}` : `${min}–${max}`,
    "Space Dragon": COLUNA_DERIVADA.forca[i],
    "Old Dragon 2": od2(min),
  }));
  console.table(linhas);
  return linhas;
}

/** A tabela do próprio Old Dragon 2, para a comparação acima. */
function od2(v) {
  if (v < 2) return -4;
  if (v < 4) return -3;
  if (v < 6) return -2;
  if (v < 9) return -1;
  if (v < 13) return 0;
  if (v < 15) return 1;
  if (v < 17) return 2;
  if (v < 19) return 3;
  return 4;
}
