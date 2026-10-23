/**
 * As opções de mundo que o código lê, num lugar que não depende de ficha.
 *
 * ── POR QUE ESTE ARQUIVO NASCEU ─────────────────────────────────────────────
 *
 * `camadaLigada` morava em nave-ficha.js, que foi apagado junto com o Combate
 * Tático. Ela não tinha nada a ver com aquela ficha — lia uma opção de mundo —
 * e teria ido embora de carona.
 *
 * `regraDeNave`, que morava ao lado, NÃO veio: ela escolhia entre o modo
 * Tático e o modo Livro, e sem o Tático não há escolha a fazer. Trazer uma
 * função que só pode devolver um valor seria manter a pergunta depois de a
 * resposta virar única.
 */

const ID = "spacedragon";

/**
 * Se a mesa ligou uma das camadas opcionais da tripulação.
 *
 * Fora do Foundry — nos testes — não há settings, e todas contam como
 * DESLIGADAS. Isso deixa o teste exercitar o código sem simular as opções, e
 * faz o padrão ser o conservador: uma camada que a mesa não ligou não aparece.
 */
export function camadaLigada(qual) {
  try {
    return globalThis.game?.settings?.get?.(ID, qual) === true;
  } catch {
    return false;
  }
}

/** As três camadas opcionais do §7, com o nome da opção de mundo de cada uma. */
export const CAMADAS = [
  { chave: "camadaEnergia", rotulo: "Energia do reator" },
  { chave: "camadaAvarias", rotulo: "Controle de avarias" },
  { chave: "camadaFuga", rotulo: "Fuga como relógio" },
];

/* ── O QUE É DO LIVRO E O QUE É ACRÉSCIMO, NO COMBATE DE NAVES ──────────────
 *
 * O Cap. 10 do livro base dá a T10-6, o disparo (1d20 + BA da nave + BA de quem
 * opera), ativar equipamento, a manobra evasiva, a T10-5 e a penalidade por
 * avaria. Isso vale sempre.
 *
 * Duas coisas que a ficha faz NÃO são do livro, e por isso viram opção:
 *
 *   naveCombateCompilado  os cinco postos com as quinze ações, a câmara
 *                         danificada que cala a nave e as três camadas — tudo
 *                         das Regras Compiladas (SW-SUP-Naves);
 *   naveModular           a regra da casa: a nave sai de fábrica com Ponte,
 *                         Sala de Máquinas e casco, e o resto se compra pela
 *                         T10-2, com limite por tamanho.
 *
 * As duas nascem LIGADAS: é como a mesa joga hoje, e uma atualização não pode
 * mudar a regra de quem não pediu. Quem quer só o livro desliga.
 *
 * Fora do Foundry (nos testes) contam como ligadas, pelo mesmo motivo: os
 * testes que já existiam descrevem a ficha com as regras ligadas.
 */
export function regraDeNave(qual) {
  try {
    const v = globalThis.game?.settings?.get?.(ID, qual);
    return v === undefined ? true : v === true;
  } catch {
    return true;
  }
}

export const combateCompilado = () => regraDeNave("naveCombateCompilado");
export const naveModular = () => regraDeNave("naveModular");

/**
 * As cinco opções de nave. `aoMudar` redesenha as Fichas de Nave abertas: quem
 * troca a opção quer ver o efeito sem fechar a ficha.
 *
 * As camadas existiam no código e eram lidas por `camadaLigada`, mas nunca
 * tinham sido registradas: nenhuma mesa conseguia ligá-las.
 */
export function registrarOpcoesDeNave(aoMudar = () => {}) {
  // Uma chamada por opção, com o nome por extenso: o teste de idioma acha as
  // chaves lendo `name: "..."` no código, e um nome montado ficaria invisível.
  const reg = (chave, padrao, textos) =>
    globalThis.game.settings.register(ID, chave, {
      ...textos,
      scope: "world",
      config: true,
      type: Boolean,
      default: padrao,
      onChange: () => aoMudar(),
    });
  reg("naveCombateCompilado", true, {
    name: "spacedragon.opcao.naveCombateCompilado.nome",
    hint: "spacedragon.opcao.naveCombateCompilado.dica",
  });
  reg("naveModular", true, {
    name: "spacedragon.opcao.naveModular.nome",
    hint: "spacedragon.opcao.naveModular.dica",
  });
  reg("camadaEnergia", false, {
    name: "spacedragon.opcao.camadaEnergia.nome",
    hint: "spacedragon.opcao.camadaEnergia.dica",
  });
  reg("camadaAvarias", false, {
    name: "spacedragon.opcao.camadaAvarias.nome",
    hint: "spacedragon.opcao.camadaAvarias.dica",
  });
  reg("camadaFuga", false, {
    name: "spacedragon.opcao.camadaFuga.nome",
    hint: "spacedragon.opcao.camadaFuga.dica",
  });
}
