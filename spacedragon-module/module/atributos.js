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
 * e assim por diante. Envolvemos os seis getters pelo libWrapper (envelope.js),
 * e tudo o que os lê passa a ver o número certo, sem tocar em nada que o ator
 * guarde em disco.
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
import { atorUsaFichaSD } from "./ficha.js";
import { envolver, MODELO_PERSONAGEM } from "./envelope.js";
import { atributoEfetivo, efeitosDe } from "./mutacoes.js";

const ID = "spacedragon";

/** Índice da faixa de atributo. Satura fora da escala de 1 a 29. */
function faixaDe(valor) {
  const v = Number(valor) || 0;
  if (v <= 1) return 0;
  if (v >= 29) return FAIXAS.length - 1;
  return FAIXAS.findIndex(([min, max]) => v >= min && v <= max);
}

/**
 * A opção está ligada? É lida a CADA acesso ao getter, e é isso que permite
 * ligar e desligar sem recarregar: nada é instalado nem removido, só a chave
 * vira. Funciona igual com o libWrapper de verdade e com a shim, que não tem
 * `unregister`.
 */
let modificadoresLigados = false;
let modificadoresEnvolvidos = false;

/**
 * Envolve os seis getters do protótipo do modelo de dados do personagem, uma
 * vez só, pelo libWrapper (ver envelope.js). O envelope decide a cada leitura:
 * opção ligada E ator na ficha do Space Dragon → a coluna do livro; senão, o
 * getter do sistema. Num mundo que também tenha o módulo Star Wars, o Jedi ao
 * lado continua na escala do Old Dragon 2.
 */
export function aplicarModificadores(ligado) {
  modificadoresLigados = !!ligado;
  const proto = CONFIG.Actor?.dataModels?.character?.prototype;
  if (!proto) {
    console.warn(`${ID} | modelo de dados do personagem não encontrado — modificadores ficam os do OD2`);
    return false;
  }
  if (!modificadoresEnvolvidos) {
    modificadoresEnvolvidos = true;
    for (const [atributo, campo] of Object.entries(CAMPO_NA_FICHA)) {
      const coluna = COLUNA_DERIVADA[atributo];
      if (!coluna) continue;
      envolver(`${MODELO_PERSONAGEM}.mod_${campo}`, function (wrapped) {
        if (!modificadoresLigados || !atorUsaFichaSD(this.parent)) return wrapped();
        // O atributo EFETIVO: o campo mais as mutações do Mutante (mutacoes.js).
        return Number(coluna[faixaDe(atributoEfetivo(this.parent, atributo, this[campo]))] ?? 0);
      });
    }
  }
  return modificadoresLigados;
}

/**
 * O bônus de CP por nível da T4-1: +1 a cada quatro níveis, +5 no 20º.
 *
 * NÃO é cumulativo — o valor da faixa É o bônus total —, e é por isso que a
 * conta é uma divisão e não uma soma: 4º–7º dá 1, 8º–11º dá 2, e o 20º, que
 * é a faixa própria dele, dá 5.
 */
export function bonusDeCP(nivel) {
  return Math.min(5, Math.floor((Number(nivel) || 1) / 4));
}

/**
 * O CP como o livro o monta.
 *
 * ── A CONTA DO LIVRO E A DA FICHA ───────────────────────────────────────────
 *
 * O livro: CP = proteção das vestes + ajuste de Destreza + bônus por nível +
 * aparatos + mutações + poderes. A ficha do OD2 faz 10 + armadura + Destreza.
 * As vestes do compêndio entram com proteção − 10, então a ficha já chega à
 * parte das vestes e da Destreza. Falta o bônus por nível, que o OD2 não tem —
 * e é ele que entra aqui, somado ao `ac_total`, que é o número que a ficha
 * mostra.
 *
 * Só para quem usa a ficha do Space Dragon: o personagem de Old Dragon 2 ao
 * lado continua com o CA do sistema dele.
 */
let cpEnvolvido = false;

export function aplicarCP() {
  const proto = CONFIG.Actor?.dataModels?.character?.prototype;
  const desc = proto && Object.getOwnPropertyDescriptor(proto, "ac_total");
  if (!desc?.get) {
    console.warn(`${ID} | ac_total não é getter — o bônus de CP por nível fica de fora`);
    return false;
  }
  if (cpEnvolvido) return true;
  cpEnvolvido = envolver(`${MODELO_PERSONAGEM}.ac_total`, function (wrapped) {
    const base = wrapped();
    // + o CP das mutações (Sexto Sentido ±2), além do bônus por nível
    return atorUsaFichaSD(this.parent) ? base + bonusDeCP(this.level) + efeitosDe(this.parent).cp : base;
  });
  return cpEnvolvido;
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

/**
 * As habilidades de classe saem em ordem de NÍVEL.
 *
 * ── POR QUE A CORREÇÃO NO COMPÊNDIO NÃO BASTOU ──────────────────────────────
 *
 * O compêndio passou a listar as habilidades ordenadas, mas a ficha não lê o
 * compêndio: lê o ATOR.
 *
 *     get class_abilities() { return actor.items.filter(i => i.type === "class_ability") }
 *
 * A ordem é a da coleção de itens do ator, fixada quando eles foram criados.
 * Toda ficha montada antes da correção continuou mostrando "Ataques Múltiplos"
 * (7º nível) antes de "Pilotar Naves" (1º) — e reordenar o compêndio não
 * alcança quem já tem os itens.
 *
 * Ordenar no getter conserta as fichas existentes sem pedir que ninguém
 * rearraste nada, e vale também para quem montar a classe à mão, item por item.
 *
 * O desempate é o `sort` do próprio item, que preserva a ordem do livro entre
 * habilidades do mesmo nível.
 */
let habilidadesEnvolvidas = false;

export function ordenarHabilidades(ligado) {
  const proto = CONFIG.Actor?.dataModels?.character?.prototype;
  if (!proto) return false;

  const desc = Object.getOwnPropertyDescriptor(proto, "class_abilities");
  if (!desc?.get) {
    console.warn(`${ID} | class_abilities não é getter — a ordem fica a do sistema`);
    return false;
  }
  if (!ligado) return false;
  if (habilidadesEnvolvidas) return true;

  habilidadesEnvolvidas = envolver(`${MODELO_PERSONAGEM}.class_abilities`, function (wrapped) {
    const lista = wrapped() ?? [];
    return [...lista].sort(
      (a, b) =>
        (Number(a.system?.level) || 1) - (Number(b.system?.level) || 1) ||
        (a.sort ?? 0) - (b.sort ?? 0)
    );
  });
  return habilidadesEnvolvidas;
}
