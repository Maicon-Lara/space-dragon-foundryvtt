/**
 * A ficha Space Dragon, que aparece no seletor de ficha do ator.
 *
 * ── POR QUE UMA FICHA, E NÃO SÓ UMA OPÇÃO ───────────────────────────────────
 *
 * Porque é onde o Foundry já guarda essa escolha. Todo ator tem um botão
 * "Sheet" no cabeçalho da janela; registrar aqui faz a ficha Space Dragon
 * aparecer lá ao lado da do Old Dragon 2, e a escolha passa a ser POR
 * PERSONAGEM. Um mundo pode ter um cosmonauta com a ficha do Space Dragon e um
 * guerreiro de fantasia com a do sistema, na mesma mesa.
 *
 * Uma opção do módulo seria tudo ou nada, e estaria num menu que ninguém abre.
 *
 * ── O QUE ELA MUDA ──────────────────────────────────────────────────────────
 *
 * Nada no template: ela HERDA a ficha do Old Dragon 2 inteira. O que ela
 * acrescenta é uma classe no elemento da janela, `spacedragon-ficha`, e é essa
 * classe que liga tudo o que o módulo injeta — os testes de porcentagem, os
 * Danos Mortais, o alcance mental, o tema.
 *
 * Trocar para a ficha do sistema devolve o Old Dragon 2 puro, sem desinstalar
 * nada.
 *
 * ── POR QUE NO `init`, E DE ONDE VEM A CLASSE-BASE ──────────────────────────
 *
 * O sistema não exporta `OD2CharacterSheet`. Ela é alcançável pelo registro que
 * o próprio Foundry mantém, e esse registro só existe depois de o sistema rodar
 * o `init` dele — que roda antes do nosso, porque sistema carrega antes de
 * módulo.
 *
 * Se o nome mudar numa versão futura, `baseDaFicha()` devolve nulo, a ficha não
 * é registrada e o módulo segue funcionando sobre a ficha do sistema, que é
 * exatamente o que acontecia antes disto existir.
 */

import { chassiDe } from "./chassi.js";

const ID = "spacedragon";
export const MARCA_FICHA = "spacedragon-ficha";

/** A ficha de personagem do olddragon2e, tirada do registro do Foundry. */
function baseDaFicha() {
  const registro = CONFIG.Actor?.sheetClasses?.character ?? {};
  const achada = Object.values(registro).find((e) => e?.cls?.name === "OD2CharacterSheet")?.cls;
  if (!achada) {
    console.warn(
      `${ID} | OD2CharacterSheet não encontrada — a ficha Space Dragon não será registrada, ` +
      `e os ajustes continuam valendo sobre a ficha do sistema`
    );
  }
  return achada ?? null;
}

let Registrada = null;
let Base = null;

/**
 * Esta ficha É a do Space Dragon?
 *
 * Se a ficha própria não pôde ser registrada, a resposta é SIM para qualquer
 * ficha do sistema — senão desligar o registro desligaria o módulo inteiro, o
 * que seria pior do que não ter a opção.
 */
export function ehFichaSD(app) {
  if (!Registrada) return true;
  return app instanceof Registrada;
}

/**
 * ── QUANDO REGISTRAR ────────────────────────────────────────────────────────
 *
 * No `ready`, e não no `init`. No Foundry 13.351, `registerSheet` põe a ficha
 * numa FILA que só é processada depois do `init` — e depois do `setup` também.
 * No `init`, `CONFIG.Actor.sheetClasses` ainda está vazio: `baseDaFicha()` não
 * achava a ficha do sistema, a do módulo nunca era registrada, e o módulo
 * caía no "vale para todo mundo" sem ninguém perceber. Conferido na mesa: no
 * `ready` o registro está montado e a ficha nova entra na hora.
 *
 * `padrao` é a opção do mundo "Fichas Space Dragon como padrão".
 */
let Padrao = true;

export function registrarFicha(padrao = true) {
  Padrao = !!padrao;
  Base = baseDaFicha();
  if (!Base) return null;

  class SDCharacterSheet extends Base {
    static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
        // A classe extra é o que o módulo procura para saber que pode injetar.
        // O resto vem da ficha do sistema, inclusive o template.
        classes: [...super.defaultOptions.classes, MARCA_FICHA],
      });
    }

    /**
     * O botão de lançar da aba de Poderes, para quem tem o chassi do
     * Mentálico, segue o Cap. 9 do livro e não a magia vanciana do sistema
     * (ver poder-mental.js). Para os demais, o sistema como sempre.
     */
    _onSpellCast(event, options = {}) {
      if (chassiDe(this.actor) !== "Mentálico") return super._onSpellCast(event, options);
      // Antes de qualquer await: é um <a>, e o padrão do navegador não espera.
      event.preventDefault?.();
      const id = event.currentTarget?.closest?.(".item")?.dataset?.itemId;
      const item = this.actor.items.get(id);
      if (!item) return null;
      return import("./poder-mental.js").then(({ realizarPoder }) => realizarPoder(this.actor, item));
    }

    /**
     * A JP pela regra do livro: 1d20 + modificador ≥ JP da classe. O sistema
     * compara ao contrário (d20 ≤ JP + mod). Ver jp.js. Shift abre o
     * modificador de situação.
     */
    _onJPRoll(event) {
      event.preventDefault?.();
      const qual = event.currentTarget?.dataset?.jp;
      const shift = !!event.shiftKey;
      return import("./jp.js").then(async ({ rolarJP, perguntarSituacao, JPS }) => {
        if (!JPS[qual]) return null;
        const sit = shift ? await perguntarSituacao(JPS[qual].rotulo) : 0;
        if (sit === null) return null;
        return rolarJP(this.actor, qual, sit);
      });
    }
  }

  foundry.documents.collections.Actors.registerSheet(ID, SDCharacterSheet, {
    types: ["character"],
    label: "Ficha Space Dragon",
    // Padrão do mundo pela opção do módulo, que vem LIGADA: numa mesa de
    // Space Dragon, todo personagem abre nela sem ninguém marcar ator por
    // ator. Numa mesa mista com o Star Dragon, o GM desliga, e quem é do Space
    // Dragon escolhe no botão "Sheet" do ator.
    makeDefault: Padrao,
  });

  Registrada = SDCharacterSheet;
  console.log(`${ID} | ficha Space Dragon registrada`);
  return SDCharacterSheet;
}

/**
 * Registra um desenhista de ficha nos ganchos certos, sem disparar em dobro.
 *
 * ── POR QUE ISTO PRECISA DE CUIDADO ─────────────────────────────────────────
 *
 * O Foundry emite um gancho de render para CADA classe da cadeia de herança.
 * A ficha Space Dragon, sendo subclasse, dispara `renderSDCharacterSheet`,
 * `renderOD2CharacterSheet` E `renderActorSheet` na mesma renderização.
 *
 * A primeira versão disto ganchava o específico e caía no genérico "se o nome
 * da classe não for OD2CharacterSheet" — teste que a subclasse passa, porque o
 * nome dela é outro. Resultado: tudo era desenhado duas vezes.
 *
 * Aqui o genérico só entra para ficha que NÃO descende da do Old Dragon 2, que
 * é o caso de o sistema renomear a classe dele numa versão futura.
 */
export function ligarNaFicha(desenha) {
  Hooks.on("renderOD2CharacterSheet", desenha);
  Hooks.on("renderActorSheet", (app, el) => {
    if (Base && app instanceof Base) return;
    if (app?.constructor?.name === "OD2CharacterSheet") return;
    desenha(app, el);
  });
}

/**
 * Este ATOR usa a ficha Space Dragon?
 *
 * ── POR QUE NÃO BASTA `ator.sheet` ──────────────────────────────────────────
 *
 * Porque isto é chamado de dentro de um getter de dado derivado, e tocar em
 * `ator.sheet` ali instancia a ficha no meio do cálculo dela. A escolha está
 * gravada numa flag do próprio Foundry, e ler a flag não instancia nada.
 *
 * Flag ausente significa "use o padrão do mundo", e o padrão é o do sistema:
 * a ficha do módulo é registrada com `makeDefault: false` justamente para que
 * um mundo misto não vire Space Dragon inteiro sem ninguém pedir.
 */
export function atorUsaFichaSD(ator) {
  if (!Registrada) return true;
  // O próprio Foundry diz qual ficha o ator vai abrir — a escolhida no botão
  // "Sheet", ou a padrão do mundo, inclusive a que o GM configurar. Pedir a
  // CLASSE não instancia ficha nenhuma.
  const cls = ator?._getSheetClass?.();
  if (cls) return cls === Registrada || cls.prototype instanceof Registrada;
  // Sem isso (fora do Foundry, nos testes): a flag, e sem flag, o padrão.
  const escolhida = ator?.flags?.core?.sheetClass;
  if (!escolhida) return Padrao;
  return escolhida === `${ID}.${Registrada.name}`;
}
