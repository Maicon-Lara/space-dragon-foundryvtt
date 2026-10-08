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

/** Os atores que têm a flag antiga e ainda não têm a nova. */
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
 * Copia a flag de uma nave, e aponta a ficha para a nova classe.
 *
 * O `sheetClass` também carrega o id do módulo: uma nave migrada que continuasse
 * apontando para `starwars-sd.NaveSheet` abriria a ficha do outro módulo — ou
 * nenhuma, se ele não estiver instalado, que é justamente o caso de quem joga
 * Space Dragon sem Star Wars.
 */
export async function migrarNave(ator) {
  const velha = ator.getFlag(ID_ANTIGO, FLAG);
  const mudancas = { [`flags.${ID}.${FLAG}`]: velha };

  const ficha = ator.getFlag("core", "sheetClass");
  if (ficha === `${ID_ANTIGO}.NaveSheet`) {
    mudancas["flags.core.sheetClass"] = `${ID}.NaveSheet`;
  }
  await ator.update(mudancas);
  return { nome: ator.name, trocouFicha: "flags.core.sheetClass" in mudancas };
}

/** Migra todas, em série, e devolve o relatório. */
export async function migrarNaves() {
  const feitas = [];
  for (const a of navesPorMigrar()) {
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
  const pendentes = navesPorMigrar();
  if (!pendentes.length) return;

  const feitas = await migrarNaves();
  const ok = feitas.filter((f) => f.ok);
  console.log(`${ID} | ${ok.length} nave(s) migrada(s) do módulo de Star Wars`, feitas);
  globalThis.ui?.notifications?.info?.(
    `${ok.length} nave(s) trazida(s) para o Space Dragon. As regras de nave agora moram aqui.`
  );
  for (const f of feitas.filter((x) => !x.ok)) {
    globalThis.ui?.notifications?.error?.(`Não consegui migrar "${f.nome}": ${f.erro}`);
  }
}
