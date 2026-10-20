/**
 * O aviso de que o sistema está numa versão que o módulo não conferiu.
 *
 * ── POR QUE UM AVISO, E NÃO O `maximum` DO MANIFESTO ────────────────────────
 *
 * Os rótulos, os selos das mutações, o painel das câmaras e o da Ordem de Ação
 * dependem do HTML da ficha do Old Dragon 2. Se o sistema mudar esse HTML,
 * essas peças somem sem erro nenhum — a ficha só fica sem elas.
 *
 * O manifesto tem `compatibility.maximum`, mas ele não avisa: ele DESLIGA o
 * módulo para a mesa inteira assim que o sistema passa daquele número, até sair
 * versão nova do módulo. Para um módulo mantido por uma pessoa, isso troca um
 * risco (alguma peça pode sumir) por uma certeza (a mesa fica sem nada).
 *
 * Então: o manifesto diz em que versão o módulo foi conferido (`verified`), e
 * no `ready` o Mestre recebe UM aviso por versão nova do sistema. O módulo
 * segue funcionando; o Mestre sabe o que olhar.
 */

import { t as txt } from "./i18n.js";

const ID = "spacedragon";
const SISTEMA = "olddragon2e";

const partes = (v) => String(v ?? "").split(".").map((n) => Number.parseInt(n, 10) || 0);

/**
 * O sistema passou da versão conferida? Compara major e minor: correção
 * (2.6.0 → 2.6.3) não muda template, e avisar a cada uma ensina a ignorar.
 */
export function alemDoVerificado(atual, verificado) {
  if (!atual || !verificado) return false;
  const [a1, a2] = partes(atual);
  const [v1, v2] = partes(verificado);
  return a1 > v1 || (a1 === v1 && a2 > v2);
}

/** A versão conferida, lida do próprio manifesto carregado. */
function verificadoNoManifesto() {
  const sistemas = globalThis.game?.modules?.get?.(ID)?.relationships?.systems;
  for (const s of sistemas ?? []) {
    if (s?.id === SISTEMA) return s.compatibility?.verified ?? null;
  }
  return null;
}

export function registrarOpcaoDeVersao() {
  globalThis.game?.settings?.register?.(ID, "versaoAvisada", {
    scope: "world", config: false, type: String, default: "",
  });
}

/** No `ready`: avisa o Mestre, uma vez por versão do sistema. */
export function avisarVersaoDoSistema() {
  try {
    const game = globalThis.game;
    if (!game?.user?.isGM || game.system?.id !== SISTEMA) return false;
    const atual = game.system.version;
    const verificado = verificadoNoManifesto();
    if (!alemDoVerificado(atual, verificado)) return false;
    if (game.settings.get(ID, "versaoAvisada") === atual) return false;
    globalThis.ui?.notifications?.warn?.(txt("spacedragon.aviso.sistemaNovo", { atual, verificado }), { permanent: true });
    game.settings.set(ID, "versaoAvisada", atual);
    return true;
  } catch (e) {
    console.warn(`${ID} | não foi possível conferir a versão do sistema`, e);
    return false;
  }
}
