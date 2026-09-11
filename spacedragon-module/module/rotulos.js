/**
 * Os rótulos do Space Dragon, trocados NA FICHA e não no idioma.
 *
 * ── POR QUE SAIU DO `lang` ──────────────────────────────────────────────────
 *
 * Porque o `lang` é GLOBAL. Trocar `olddragon2e.inteligencia` para "Ciência"
 * vale para o mundo inteiro, e num mundo que também tenha o módulo Star Wars o
 * Jedi passa a ver "CIE" onde ele quer dizer Inteligência.
 *
 * Pior: os dois módulos disputavam oito chaves — `spell`, `spells`, `circle`,
 * `arcane_spell` e companhia. Quem carregasse por último vencia, e o resultado
 * dependia da ordem de carga, que ninguém controla.
 *
 * Aqui a troca acontece no DOM, só na ficha Space Dragon. Um cosmonauta vê
 * Ciência e CP; um Jedi ao lado, na ficha dele, continua vendo Inteligência e
 * CA. Cada ficha fala a língua do próprio cenário.
 *
 * ── O QUE CONTINUA NO `lang` ────────────────────────────────────────────────
 *
 * Só o que ACRESCENTA sem renomear nada: os níveis 16º a 20º e a 10ª Grandeza.
 * Esses não colidem com ninguém, porque o sistema não os define.
 *
 * ── COMO ELE ACHA CADA RÓTULO ───────────────────────────────────────────────
 *
 * Pelo campo que está do lado, não pelo texto. Trocar "INT" por texto seria
 * ambíguo — no Space Dragon "INT" é Intelecto, e no Old Dragon 2 é
 * Inteligência —, então cada regra se ancora num `name` ou num `data-` que o
 * template do sistema escreve.
 */

import { ehFichaSD } from "./ficha.js";

const ID = "spacedragon";

/**
 * Atributo: o rótulo curto ao lado do dado, e o rótulo do modificador.
 *
 * As três primeiras linhas não mudam de nome — mudam de ESCALA, o que é outro
 * arquivo. As três últimas mudam de nome, e duas delas deixam de ser
 * modificador de d20 para virar porcentagem, o que o rótulo precisa dizer.
 */
const ATRIBUTOS = {
  inteligencia: { curto: "CIE", longo: "Ciência", mod: "APT. TEC" },
  sabedoria: { curto: "INT", longo: "Intelecto", mod: "PROT. M." },
  carisma: { curto: "COM", longo: "Comunicação", mod: "REAÇÃO" },
};

/** Jogada de Proteção: o Old Dragon 2 nomeia pelo atributo, o Space Dragon pelo efeito. */
const JP = {
  jpd: { curto: "JPR", longo: "Jogada de Proteção de Reflexos" },
  jpc: { curto: "JPF", longo: "Jogada de Proteção Física" },
  jps: { curto: "JPM", longo: "Jogada de Proteção Mental" },
};

/** Troca o texto de um elemento preservando o ícone, que é filho dele. */
function texto(el, novo) {
  if (!el) return;
  for (const no of [...el.childNodes]) {
    if (no.nodeType === 3) no.remove();
  }
  el.append(novo);
}

/** O `<label>` irmão de um campo, que é onde o sistema põe o rótulo. */
function rotuloDe(raiz, seletor) {
  const campo = raiz.querySelector(seletor);
  return campo?.parentElement?.querySelector("label") ?? null;
}

function troca(app, elemento) {
  try {
    const raiz = elemento?.querySelectorAll ? elemento : elemento?.[0];
    const ator = app?.actor ?? app?.document;
    if (!raiz?.querySelector || ator?.type !== "character") return;
    if (!ehFichaSD(app)) return;

    // ── Atributos ──
    for (const [campo, r] of Object.entries(ATRIBUTOS)) {
      const link = raiz.querySelector(`.stat-roll[data-stat="${campo}"]`);
      if (link) {
        texto(link, r.curto);
        link.setAttribute("title", `Rolar ${r.longo}`);
        link.dataset.statLabel = r.longo;
      }
      const mod = rotuloDe(raiz, `input[name="system.mod_${campo}"]`);
      if (mod) mod.textContent = r.mod;
    }

    // ── Coeficiente de Proteção ──
    const ca = raiz.querySelector(".ca");
    if (ca) {
      const titulo = ca.querySelector("label.font-bold");
      if (titulo) titulo.textContent = "CP | Coeficiente de Proteção";
      const curto = ca.querySelector(".ca-total label");
      if (curto) curto.textContent = "CP";
    }

    // ── Jogadas de Proteção ──
    for (const [campo, r] of Object.entries(JP)) {
      for (const link of raiz.querySelectorAll(`.jp-roll[data-jp="${campo}"]`)) {
        texto(link, r.curto);
        link.setAttribute("title", `Rolar ${r.longo}`);
        link.dataset.jpLabel = r.curto;
      }
    }

    // ── Aba de Poderes ──
    // O Space Dragon chama de Grandeza o que o sistema chama de Círculo, e de
    // Poder Mental o que ele chama de Magia.
    // Só os NÓS DE TEXTO: escrever em `textContent` apagaria os filhos, e o
    // painel de alcance mental já pendurou o custo da Grandeza aqui dentro.
    for (const c of raiz.querySelectorAll(".character-tab-spells .circle")) {
      for (const no of [...c.childNodes]) {
        if (no.nodeType === 3 && /Círculo/i.test(no.textContent)) {
          no.textContent = no.textContent.replace(/Círculo/i, "Grandeza");
        }
      }
    }
    const cabecaPoderes = raiz.querySelector(".character-tab-spells .spell .list .name");
    if (cabecaPoderes) cabecaPoderes.textContent = "Poder Mental";
    const abaPoderes = raiz.querySelector('.tabs [data-tab="spells"]');
    if (abaPoderes) texto(abaPoderes, "Poderes");

    // ── Restrições de equipamento ──
    // "Armaduras" vira "Vestes" e "Itens Mágicos" vira "Aparatos Tecnológicos".
    for (const li of raiz.querySelectorAll(".equipment-restrictions li")) {
      const forte = li.querySelector("strong");
      if (!forte) continue;
      const t = forte.textContent;
      if (/Armadura/i.test(t)) forte.textContent = "Vestes:";
      else if (/Mágic/i.test(t)) forte.textContent = "Aparatos Tecnológicos:";
    }
  } catch (e) {
    console.warn(`${ID} | rótulos não puderam ser trocados`, e);
  }
}

export function ligarRotulos() {
  // Depois dos outros desenhistas: a aba de Poderes precisa existir para o
  // rótulo de Grandeza ser trocado, e quem a completa é o painel de alcance
  // mental.
  Hooks.on("renderOD2CharacterSheet", troca);
  console.log(`${ID} | rótulos do Space Dragon trocados na ficha, não no idioma`);
}

export { troca as trocaRotulos };
