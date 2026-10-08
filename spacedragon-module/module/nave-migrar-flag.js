/**
 * Migra as naves criadas quando as regras moravam no módulo de Star Wars.
 *
 * ── POR QUE ISTO É OBRIGATÓRIO, E NÃO UM CUIDADO EXTRA ──────────────────────
 *
 * As naves guardam tudo numa flag do módulo: tipo, câmaras, postos, tanque. A
 * flag leva o id do módulo no caminho — era `flags.starwars-sd.nave`, e passou
 * a ser `flags.spacedragon.nave` quando as regras do capítulo 10 vieram para
 * cá, que é onde elas sempre deveriam ter estado.
 *
 * Sem migração, a nave não dá erro: ela ABRE VAZIA. O tipo some, as câmaras
 * somem, os postos somem — e a ficha, que lê a flag nova e não acha nada,
 * mostra uma nave recém-criada no lugar da que a mesa construiu. É pior que um
 * erro, porque parece que a nave foi apagada.
 *
 * ── E O MESMO VALE PARA OS ITENS DENTRO DELA ────────────────────────────────
 *
 * O id está em DOIS lugares, e eu só tinha visto um. Além da flag do ator, cada
 * cômodo e cada equipamento é um ITEM com a sua própria flag —
 * `flags.<id>.camaraDeNave` e `flags.<id>.equipamentoDeNave` —, e é por ela que
 * a ficha reconhece a linha e desenha o botão de instalar.
 *
 * Recompilar o compêndio conserta os itens do PACK e mais nada: um item
 * embedado é uma cópia feita no dia do arrasto, e nada no Foundry a atualiza
 * quando o pack muda. Então a nave da mesa ficou com doze cômodos sob o id
 * antigo, e os botões de instalar simplesmente não foram desenhados — sem erro
 * no console, porque quem não acha a flag faz `continue`.
 *
 * ── POR QUE A FLAG ANTIGA FICA ──────────────────────────────────────────────
 *
 * A cópia é feita, a original não é removida. Se a migração sair errada, os
 * dados ainda estão lá para uma segunda tentativa; e um mundo que role as duas
 * versões do módulo (um jogador atualizou, outro não) continua funcionando dos
 * dois lados. O custo é uma flag órfã de alguns kilobytes.
 */

const ID = "spacedragon";
const ID_ANTIGO = "starwars-sd";
const FLAG = "nave";

/** As flags de item que carregam o id do módulo no caminho. */
const FLAGS_DE_ITEM = ["camaraDeNave", "equipamentoDeNave"];

/** Os atores que têm a flag antiga de nave e ainda não têm a nova. */
export function navesPorMigrar() {
  const todos = globalThis.game?.actors ?? [];
  return [...todos].filter((a) => {
    try {
      const velha = a.getFlag?.(ID_ANTIGO, FLAG);
      if (!velha || typeof velha !== "object") return false;
      const nova = a.getFlag?.(ID, FLAG);
      // já migrada: não refaz. Refazer sobrescreveria o que a mesa mexeu depois
      // da migração, que é o jeito mais discreto de perder trabalho.
      return !nova || typeof nova !== "object";
    } catch {
      return false;
    }
  });
}

/**
 * Os itens deste ator cuja flag de nave está sob o id antigo.
 *
 * Devolve já em forma de update embedado — `{_id, flags…}` —, porque é assim
 * que `updateEmbeddedDocuments` recebe, e porque quem chama não precisa saber
 * qual das duas flags era.
 */
export function itensPorMigrar(ator) {
  const updates = [];
  for (const item of ator?.items ?? []) {
    const mudanca = {};
    for (const nome of FLAGS_DE_ITEM) {
      const velha = item?.flags?.[ID_ANTIGO]?.[nome];
      if (!velha) continue;
      // já tem a nova: não mexe, pelo mesmo motivo do ator
      if (item?.flags?.[ID]?.[nome]) continue;
      mudanca[`flags.${ID}.${nome}`] = velha;
    }
    if (Object.keys(mudanca).length) updates.push({ _id: item.id, ...mudanca });
  }
  return updates;
}

/**
 * Copia a flag de uma nave e dos itens dela, e aponta a ficha para a classe nova.
 *
 * O `sheetClass` também carrega o id do módulo: uma nave migrada que continuasse
 * apontando para `starwars-sd.NaveSheet` abriria a ficha do outro módulo — ou
 * nenhuma, se ele não estiver instalado, que é justamente o caso de quem joga
 * Space Dragon sem Star Wars.
 */
export async function migrarNave(ator) {
  const mudancas = {};

  const velha = ator.getFlag(ID_ANTIGO, FLAG);
  if (velha && !ator.getFlag(ID, FLAG)) mudancas[`flags.${ID}.${FLAG}`] = velha;

  const ficha = ator.getFlag("core", "sheetClass");
  if (ficha === `${ID_ANTIGO}.NaveSheet`) {
    mudancas["flags.core.sheetClass"] = `${ID}.NaveSheet`;
  }
  if (Object.keys(mudancas).length) await ator.update(mudancas);

  // os itens vão numa chamada só: doze cômodos em doze updates separados são
  // doze idas ao servidor, e cada uma redesenha a ficha de quem a tem aberta
  const itens = itensPorMigrar(ator);
  if (itens.length) await ator.updateEmbeddedDocuments("Item", itens);

  return {
    nome: ator.name,
    trocouFicha: "flags.core.sheetClass" in mudancas,
    itens: itens.length,
  };
}

/**
 * Tudo o que precisa de migração: a nave sem a flag nova, e a nave que já tem a
 * flag mas cujos itens ficaram atrás.
 *
 * As duas listas são necessárias porque elas se separaram na prática: as naves
 * da mesa já tinham sido migradas pela versão anterior desta rotina, que só
 * olhava o ator. Elas abriam certo e não desenhavam nenhum botão de instalar —
 * e `navesPorMigrar()` as considerava prontas.
 */
export function porMigrar() {
  const atores = navesPorMigrar();
  const vistos = new Set(atores.map((a) => a.id));
  const comItens = [...(globalThis.game?.actors ?? [])].filter((a) => {
    if (vistos.has(a.id)) return false;
    try {
      return itensPorMigrar(a).length > 0;
    } catch {
      return false;
    }
  });
  return [...atores, ...comItens];
}

/** Migra todas, em série, e devolve o relatório. */
export async function migrarNaves() {
  const feitas = [];
  for (const a of porMigrar()) {
    try {
      feitas.push({ ...(await migrarNave(a)), ok: true });
    } catch (e) {
      feitas.push({ nome: a.name, ok: false, erro: e?.message ?? String(e) });
    }
  }
  return feitas;
}

/**
 * Roda a migração sozinha, uma vez, e avisa o que fez.
 *
 * Automática porque o custo de esquecer é alto e o de rodar é zero: ela só toca
 * atores que têm a flag antiga e não têm a nova. Quem não tem nave nenhuma não
 * percebe que isto existe.
 */
export async function migrarNavesNoReady() {
  if (!globalThis.game?.user?.isGM) return;   // só o Mestre escreve no mundo
  const pendentes = porMigrar();
  if (!pendentes.length) return;

  const feitas = await migrarNaves();
  const ok = feitas.filter((f) => f.ok);
  const itens = ok.reduce((t, f) => t + (f.itens ?? 0), 0);
  console.log(`${ID} | ${ok.length} nave(s) e ${itens} item(ns) migrado(s)`, feitas);

  // o aviso nomeia os itens porque é o que a mesa vai NOTAR: os botões de
  // instalar voltando à lista de cômodos
  const sobreItens = itens
    ? ` ${itens} cômodo(s) e equipamento(s) voltaram a ser reconhecidos — os botões de instalar estão de volta.`
    : "";
  globalThis.ui?.notifications?.info?.(
    `${ok.length} nave(s) trazida(s) para o Space Dragon.${sobreItens}`
  );
  for (const f of feitas.filter((x) => !x.ok)) {
    globalThis.ui?.notifications?.error?.(`Não consegui migrar "${f.nome}": ${f.erro}`);
  }
}
