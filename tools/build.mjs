/**
 * Build do módulo Space Dragon.
 *
 *   tools/data/*.mjs  →  packs-src/*.json  →  LevelDB em spacedragon-module/packs/
 *
 * `packs-src` é fonte de LEITURA, não de verdade: quem manda é tools/data.
 * Editar packs-src à mão é perder o trabalho no próximo build.
 *
 *     npm run build
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compilePack } from "@foundryvtt/foundryvtt-cli";

import {
  folderDoc, raceDoc, raceAbilityDoc, classDoc, classAbilityDoc, journalDoc, rollTableDoc, macroDoc,
  weaponDoc, armorDoc, spellDoc, miscDoc, monsterDoc,
  itemUuid, writeSource, aninhaPastas, pintaPastas, makeId, stats,
} from "./lib.mjs";
import { especies } from "./data/especies.mjs";
import { classes } from "./data/classes.mjs";
import { especializacoes } from "./data/especializacoes.mjs";
import { PARES } from "./data/mutacoes.mjs";
import { regras } from "./data/regras.mjs";
import { mutacoesJournal } from "./data/mutacoes-journal.mjs";
import { TESTES } from "./data/testes.mjs";
import { testesJournal } from "./data/testes-journal.mjs";
import { ARMAS, VESTES, TIPOS, PORTES } from "./data/equipamento.mjs";
import { equipamentoJournal } from "./data/equipamento-journal.mjs";
import { PODERES } from "./data/poderes.mjs";
import { APARATOS, CATEGORIAS_POR_CLASSE } from "./data/aparatos.mjs";
import { aparatosJournal } from "./data/aparatos-journal.mjs";
import { combateJournal } from "./data/combate-journal.mjs";
import { navesJournal } from "./data/naves-journal.mjs";
import { CRIATURAS } from "./data/bestiario.mjs";
import { mestreJournal } from "./data/mestre-journal.mjs";
import { CLICHES, INTERESSES } from "./data/mestre.mjs";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(AQUI, "..");
const SRC = path.join(ROOT, "packs-src");
const OUT = path.join(ROOT, "spacedragon-module", "packs");

const P_CLASSES = "spacedragon-classes";
const P_ESPECIES = "spacedragon-especies";
const P_TABELAS = "spacedragon-tabelas";
const P_JOURNAL = "spacedragon-journal";
const P_MACROS = "spacedragon-macros";
const P_EQUIPAMENTO = "spacedragon-equipamento";
const P_PODERES = "spacedragon-poderes";
const P_APARATOS = "spacedragon-aparatos";
const P_BESTIARIO = "spacedragon-bestiario";

/** Cor por pasta: sem isso o compêndio vira uma lista cinza indistinguível. */
const PALETA = {
  "Espécies": "#2f5d7c",
  "Classes": "#5a3f7c",
  "Armas": "#7c4a2f",
  "Vestes e Proteção": "#2f6b6b",
  "Poderes Mentais": "#5c2f7c",
  "Aparatos Tecnológicos": "#7c6b2f",
  "Feitos Científicos": "#2f7c5c",
  "Bestiário": "#7c2f3a",
  "Personagens de Exemplo": "#4a4a7c",
};

// ── Espécies ────────────────────────────────────────────────────────────────
function montaEspecies() {
  const docs = [];
  const pasta = folderDoc("Espécies", "Item", "sd-especies");
  docs.push(pasta);

  especies.forEach((esp, i) => {
    // Mesma razão das classes: as habilidades da espécie ficam junto DELA.
    const sub = folderDoc(`Espécies — ${esp.nome}`, "Item", `sd-especie:${esp.nome}`);
    docs.push(sub);

    const habs = (esp.habilidades ?? []).map((h, j) =>
      raceAbilityDoc(h, sub._id, `sd-race-ab:${esp.nome}`, j));
    docs.push(...habs);
    docs.push({
      ...raceDoc(esp, pasta._id, habs.map((h) => itemUuid(P_ESPECIES, h._id))),
      sort: (i + 1) * 1000,
    });
  });
  return docs;
}

// ── Classes ─────────────────────────────────────────────────────────────────
//
// ── AS ESPECIALIZAÇÕES SÃO CLASSES, NÃO HABILIDADES ─────────────────────────
//
// No 5º nível o personagem ESCOLHE uma, e a partir dali sobe nela em vez de
// subir na classe-base. Isso é troca de classe, não ganho de habilidade.
//
// A primeira versão as fazia `class_ability` da classe-base, e a ficha ficava
// mostrando as três de uma vez — o cosmonauta lia Emissário, Mercenário e
// Caçador de Recompensas empilhados, sem nenhum ser o dele. É o mesmo desenho
// das Sendas do módulo Star Wars, e a solução é a mesma:
//
//   · cada especialização vira um item `class` próprio, "Cosmonauta —
//     Emissário", com a MESMA progressão de níveis da base;
//   · ela carrega as habilidades da classe-base POR REFERÊNCIA, mais a sua.
//     "Eles recebem poderes da classe base e novos das especializações";
//   · o jogador troca o item de classe na ficha quando escolhe.
//
// A classe-base continua existindo sozinha, para quem não se especializar.
//
// ── OS DEGRAUS DE 5, 10 E 20 ────────────────────────────────────────────────
//
// O `class_ability` do OD2 tem campos para 3º, 6º e 10º nível, e o template
// desenha a descrição PRIMEIRO e os degraus DEPOIS. Pôr o 20º na descrição
// fazia ele aparecer antes do bloco de 10º — fora de ordem na tela.
//
// Então os três degraus vão todos na descrição, em ordem. Perde-se a etiqueta
// que o sistema desenha; ganha-se o texto na ordem em que se lê.
//
// ── A COSTURA DOS DEGRAUS ───────────────────────────────────────────────────
//
// O texto foi transcrito para ser CONCATENADO, não empilhado. Cada bloco
// termina com o conector e o seguinte começa no número:
//
//   n5  "…não ser seus próprios artefatos. Ao atingir o"
//   n10 "10° nível ele pode usar a porcentagem…              …penalidade. No"
//   n20 "20° nível seu desconto tecnológico…"
//
// Empilhar isso com um rótulo produzia "No 10º nível. 10° nível o mercenário
// receberá…" — o número duas vezes, e um "Ao atingir o" pendurado no fim do
// bloco anterior.
//
// Então o conector MUDA DE BLOCO: sai do fim de um e vai para o começo do
// seguinte, onde ele sempre pertenceu. O texto do livro não é reescrito, só
// recortado no lugar certo.
const CONECTOR =
  /\s*(?:\d{1,3}\s+)?(No|A partir do|Ao atingir o|Atingindo o|Ao chegar no|Ao chegar ao|Já no|Chegando ao|atingindo o|ao atingir o)\s*$/;

/** Tira o conector do fim de um bloco e devolve os dois pedaços. */
function separaConector(txt) {
  const m = (txt ?? "").match(CONECTOR);
  if (!m) return { corpo: (txt ?? "").trim(), conector: null };
  return { corpo: txt.slice(0, m.index).trim(), conector: m[1] };
}

function degraus(e) {
  const a = separaConector(e.n5);
  const b = separaConector(e.n10);

  // O conector do bloco anterior abre o seguinte. Sem conector, o rótulo
  // genérico entra no lugar — algumas transcrições não têm nenhum.
  const abre = (conector, nivel, txt) => {
    if (!txt) return "";
    const jaTemNivel = new RegExp(`^${nivel}\\s*[°º]`).test(txt);
    const cabeca = conector
      ? `${conector} `
      : jaTemNivel ? "" : `No ${nivel}º nível `;
    return `<p>${cabeca}${txt}</p>`;
  };

  return (
    `<p><em>Especialização de ${e.classe}, para quem tem Afiliação ` +
    `<strong>${e.afiliacao}</strong>.</em></p>` +
    (a.corpo ? `<p>${a.corpo}</p>` : "") +
    abre(a.conector, 10, b.corpo) +
    abre(b.conector, 20, separaConector(e.n20).corpo)
  );
}

function montaClasses() {
  const docs = [];
  const pasta = folderDoc("Classes", "Item", "sd-classes");
  docs.push(pasta);

  classes.forEach((cls, i) => {
    // Uma subpasta POR CLASSE. Sem isso, as habilidades e especializações caem
    // numa lista única em ordem alfabética, e achar o que é do Gatuno vira
    // caça. O "Pai — Filho" no nome é o que a aninhaPastas lê para hierarquizar.
    const sub = folderDoc(`Classes — ${cls.nome}`, "Item", `sd-classe:${cls.nome}`);
    docs.push(sub);

    // ORDENADAS POR NÍVEL. O template do OD2 percorre `class_abilities` na
    // ordem do array, sem ordenar, então a ficha do Cosmonauta abria com
    // "Ataques Múltiplos" (7º) antes de "Pilotar Naves" (1º) — a ordem em que
    // eu declarei, não a ordem em que se ganha.
    //
    // O desempate é a posição de declaração, para que duas habilidades do
    // mesmo nível saiam na ordem do livro.
    const habs = (cls.habilidades ?? [])
      .map((h, ordem) => ({ ...h, ordem }))
      .sort((a, b) => (a.level ?? 1) - (b.level ?? 1) || a.ordem - b.ordem)
      .map((h, j) => classAbilityDoc(h, sub._id, `sd-class-ab:${cls.nome}`, j));
    docs.push(...habs);
    const uuidsBase = habs.map((h) => itemUuid(P_CLASSES, h._id));

    // A classe-base, para quem não se especializar.
    docs.push({
      ...classDoc(cls, sub._id, uuidsBase),
      sort: 0,
    });

    // Uma classe por especialização, herdando as habilidades da base.
    especializacoes
      .filter((e) => e.classe === cls.nome)
      .forEach((e, j) => {
        const hab = classAbilityDoc(
          { nome: e.nome, level: 5, desc: degraus(e) },
          sub._id, `sd-espec:${cls.nome}`, 100 + j
        );
        docs.push(hab);
        docs.push({
          ...classDoc({
            ...cls,
            // O _id continua semeado pela forma "Classe — Especialização", que
            // foi a que gerou os UUIDs: inverter o RÓTULO não pode trocar o
            // UUID de uma classe já em uso.
            seedNome: `${cls.nome} — ${e.nome}`,
            // A especialização vem primeiro porque é ela que o jogador procura.
            // "Emissário — Cosmonauta" acha na hora; "Cosmonauta — Emissário"
            // esconde o nome que importa atrás de um prefixo repetido três
            // vezes na lista.
            nome: `${e.nome} — ${cls.nome}`,
            flavor: `<p><em>${cls.nome} de Afiliação <strong>${e.afiliacao}</strong>.</em></p>`,
            descricao:
              `<p>Especialização escolhida no <strong>5º nível</strong>. A partir dali o ` +
              `personagem sobe nela, e não mais na classe-base — mas mantém tudo o que ` +
              `${cls.nome} já lhe deu.</p>` + degraus(e) + cls.descricao,
          }, sub._id, [...uuidsBase, itemUuid(P_CLASSES, hab._id)]),
          sort: (j + 1) * 10,
        });
      });
  });
  return docs;
}

// ── T2-1 como tabela rolável ────────────────────────────────────────────────
//
// Duas tabelas de 1d10, e não uma de 2d10: o livro manda rolar um dado em CADA
// coluna, e rerrolar se derem o mesmo número. Uma tabela de 2d10 somaria os
// dados, que é outra coisa.
function montaTabelas() {
  const docs = [];

  // As duas colunas da T2-1 são tabelas SEPARADAS de 1d10, e não uma de 2d10:
  // o livro manda rolar um dado em cada coluna e rerrolar se derem igual. Uma
  // tabela de 2d10 somaria os dados, que é outra coisa.
  for (const [nome, lado] of [
    ["T2-1: Mutações — Aprimoramentos", "aprimoramento"],
    ["T2-1: Mutações — Degenerações", "degeneracao"],
  ]) {
    const outra = lado === "aprimoramento" ? "Degenerações" : "Aprimoramentos";
    docs.push(rollTableDoc({
      nome,
      desc: `Role 1d10. Role também na tabela de ${outra}; se os dois dados derem o MESMO número, rerrole os dois.`,
      formula: "1d10",
      // `range` e `text` são os nomes que o rollTableDoc espera — conferidos na
      // lib, não deduzidos. Cada resultado ocupa uma face só.
      resultados: PARES.map((p) => ({ text: p[lado].nome, range: [p.indice, p.indice] })),
    }, PARES.length));
  }

  // As do Capítulo 11 são listas simples: a fórmula é 1dN, com N sendo o
  // tamanho da lista. A T11-1 tem ONZE entradas, então é 1d11 — não 1d10.
  for (const [nome, desc, lista] of [
    ["T11-1: Clichês de ficção científica",
     "Role para um gancho de aventura pulp.", CLICHES],
    ["T11-2: Interesses de explorações",
     "O que motiva uma expedição, ou o que ela pode render.", INTERESSES],
  ]) {
    docs.push(rollTableDoc({
      nome,
      desc,
      formula: `1d${lista.length}`,
      resultados: lista.map((texto, i) => ({ text: texto, range: [i + 1, i + 1] })),
    }, lista.length));
  }

  return docs;
}


// ── Equipamento ─────────────────────────────────────────────────────────────
//
// ── O QUE O CAMPO DO OD2 GUARDA E O QUE NÃO GUARDA ──────────────────────────
//
// A ficha tem `shoot_range` e `throw_range` como UM número cada, em metros. O
// Space Dragon dá TRÊS por arma — "15 / 30 / 45" —, onde a segunda distância
// custa −2 no ataque e a terceira −4. Guardamos a PRIMEIRA, que é a faixa sem
// penalidade, e a tripla inteira vai na descrição.
//
// Guardar a maior faria a ficha dizer que a pistola acerta a 45 metros sem
// penalidade nenhuma, que é falso; guardar a primeira erra para menos, e errar
// para menos é o que se pode conferir na descrição.
/** "15 / 30 / 45" → 15. "Corporal · 3 / 6 / 9" → 3. */
function primeiraFaixa(alcance) {
  const m = String(alcance ?? "").match(/(\d+)\s*\/\s*\d+\s*\/\s*\d+/);
  return m ? Number(m[1]) : 0;
}

const ehCorpoACorpo = (a) => /M/.test(a.tipo ?? "") || /Corporal/i.test(a.alcance ?? "");

/**
 * Só de arremesso: tipo A sem F nem D.
 *
 * A distinção não é cosmética. `weaponDoc` tipa como `throwing` a arma que tem
 * alcance de arremesso e NÃO tem alcance de tiro, e como `ranged` se tiver os
 * dois — e a automação de combate do módulo Qualidade de Vida ABORTA o ataque
 * de qualquer `ranged` sem munição equipada. Uma granada tipada como `ranged`
 * simplesmente não rola.
 */
const soArremesso = (a) => /A/.test(a.tipo ?? "") && !/[FD]/.test(a.tipo ?? "");

function descricaoArma(a) {
  const linhas = [];
  if (a.tipo) linhas.push(`Tipo: ${a.tipo.split("/").map((t) => TIPOS[t] ?? t).join(" e ")}.`);
  if (a.porte) linhas.push(`Porte ${PORTES[a.porte]}.`);
  if (a.alcance) {
    // A penalidade por faixa só existe onde há faixa. "Corporal" não tem
    // distância nenhuma, e dizer "Corporal metros" era ruído.
    const temFaixa = /\d+\s*\/\s*\d+\s*\/\s*\d+/.test(a.alcance);
    linhas.push(
      temFaixa
        ? `Alcance: ${a.alcance} metros — a segunda faixa dá −2 no ataque e a terceira −4.`
        : `Alcance: ${a.alcance}.`
    );
  }
  if (/m²/.test(a.dano ?? "")) {
    linhas.push("Dano em área: todos na área fazem JPR. Quem falha sofre o dano inteiro, quem passa sofre metade.");
  }
  if (a.preco === null) linhas.push("Sem preço de tabela: é de cultura primitiva, e só se consegue com gente dessas culturas.");
  if (a.nota) linhas.push(a.nota);
  return linhas.join(" ");
}

function descricaoVeste(v) {
  const linhas = [];
  if (v.acrescimo) {
    linhas.push("Não dá proteção própria: soma-se à veste em uso, com o peso, o preço e a penalidade de movimento.");
  } else if (v.bonus) {
    linhas.push(`Bônus de +${v.protecao} somado ao coeficiente de proteção.`);
  } else {
    linhas.push(`Valor de proteção ${v.protecao}: é a BASE do coeficiente de proteção, não um bônus somado a 10.`);
  }
  if (v.movimento) linhas.push(`Reduz o movimento em ${v.movimento} metros.`);
  if (v.nota) linhas.push(v.nota);
  return linhas.join(" ");
}

function montaEquipamento() {
  const docs = [];
  const armas = folderDoc("Armas", "Item", "sd-armas");
  const vestes = folderDoc("Vestes e Proteção", "Item", "sd-vestes");
  docs.push(armas, vestes);

  ARMAS.forEach((a, i) => {
    const corpo = ehCorpoACorpo(a);
    const arremesso = soArremesso(a);
    docs.push(weaponDoc({
      nome: a.nome,
      desc: descricaoArma(a),
      damage: a.dano ?? "",
      cost: a.preco === null ? "" : `${a.preco.toLocaleString("pt-BR")} créditos`,
      weight_in_grams: Math.round((a.peso ?? 0) * 1000),
      melee: corpo,
      ranged: !corpo,
      // A arma que só tem alcance de arremesso é `throwing` no OD2, não
      // `ranged` — ver o comentário em weaponDoc.
      shoot_range: corpo || arremesso ? 0 : primeiraFaixa(a.alcance),
      // A arma corpo a corpo com faixa numérica pode ser arremessada: a faca e
      // as lanças trazem "Corporal · 3 / 6 / 9".
      throw_range: corpo || arremesso ? primeiraFaixa(a.alcance) : 0,
      two_handed: a.porte === "G",
      versatile: a.porte === "P" || a.porte === "M",
    }, armas._id, "sd-arma", i * 10));
  });

  VESTES.forEach((v, i) => {
    docs.push(armorDoc({
      nome: v.nome,
      desc: descricaoVeste(v),
      // O escudo de energia é o único que SOMA. O resto é valor absoluto, e o
      // OD2 não tem campo para isso — o número vai na descrição, e o campo de
      // bônus fica zerado para a ficha não somar duas vezes.
      tipo_armadura: v.bonus ? "escudo" : "",
      bonus_ca: v.bonus ? v.protecao : 0,
      cost: `${v.preco.toLocaleString("pt-BR")} créditos`,
      weight_in_grams: Math.round((v.peso ?? 0) * 1000),
    }, vestes._id, "sd-veste", i * 10));
  });

  return docs;
}

// ── Poderes Mentais ─────────────────────────────────────────────────────────
//
// Uma subpasta por Grandeza. Cento e um poderes numa lista única seriam
// impossíveis de percorrer, e a Grandeza é justamente o que o mentálico precisa
// saber antes do nome — ela limita o que ele alcança e custa do orçamento
// diário.
function montaPoderes() {
  const docs = [];
  const raiz = folderDoc("Poderes Mentais", "Item", "sd-poderes");
  docs.push(raiz);

  const porGrandeza = new Map();
  for (const p of PODERES) {
    if (!porGrandeza.has(p.grandeza)) porGrandeza.set(p.grandeza, []);
    porGrandeza.get(p.grandeza).push(p);
  }

  for (const g of [...porGrandeza.keys()].sort((a, b) => a - b)) {
    const sub = folderDoc(`Poderes Mentais — ${g}ª Grandeza`, "Item", `sd-grandeza:${g}`);
    docs.push(sub);

    porGrandeza.get(g).forEach((p, i) => {
      docs.push(spellDoc({
        nome: p.nome,
        // A tradição é `arcane` por falta de uma quinta: o Space Dragon não tem
        // arcano nem divino. O lang do módulo troca o rótulo.
        school: "arcane",
        circle: p.grandeza,
        range: p.alcance,
        duration: p.duracao,
        // Não há campo de JP por poder: quando um pede jogada de proteção, está
        // escrito no texto dele, e cada um pede a sua.
        jp: "nenhuma",
        desc: `<p>${p.texto}</p>`,
      }, sub._id, `sd-poder:${g}`, i * 10));
    });
  }
  return docs;
}

// ── Aparatos e Feitos ───────────────────────────────────────────────────────
//
// Ambos viram `misc`. O OD2 não tem tipo para "aparato", e forçá-los em `weapon`
// tornaria o Lança-chamas atacável e a Mochila a Jato também — `misc` é o que
// a ficha trata como equipamento que se carrega e se usa.
//
// FEITO CIENTÍFICO não é objeto: é procedimento, e ninguém o carrega. Vai para
// pasta separada, e a descrição deixa isso claro logo na primeira linha.
function corpoAparato(a) {
  const linhas = [];
  linhas.push(a.feito
    ? `Feito científico de ${a.nt === null ? "nível tecnológico variável" : `${a.nt}º nível tecnológico`}. É um procedimento, não um objeto: só o cientista o realiza, e não há o que carregar.`
    : `Aparato ${a.categoria.toLowerCase()} de ${a.nt === null ? "nível tecnológico variável" : `${a.nt}º nível tecnológico`}.`);
  if (!a.feito) {
    // Quem NÃO pode usar é a informação que falta na hora de comprar.
    const podem = Object.entries(CATEGORIAS_POR_CLASSE)
      .filter(([, cats]) => cats.includes(a.categoria))
      .map(([classe]) => classe);
    linhas.push(`Operam: ${podem.join(", ")}.`);
  }
  linhas.push(`Custo ${a.custo}. Tempo de construção ${a.tempo}.`);
  linhas.push(a.texto);
  return linhas.join(" ");
}

function montaAparatos() {
  const docs = [];
  const pAparatos = folderDoc("Aparatos Tecnológicos", "Item", "sd-aparatos");
  const pFeitos = folderDoc("Feitos Científicos", "Item", "sd-feitos");
  docs.push(pAparatos, pFeitos);

  APARATOS.forEach((a, i) => {
    docs.push(miscDoc({
      nome: a.nome,
      desc: corpoAparato(a),
      cost: a.custo,
    }, a.feito ? pFeitos._id : pAparatos._id, a.feito ? "sd-feito" : "sd-aparato", i * 10));
  });
  return docs;
}

// ── Bestiário ───────────────────────────────────────────────────────────────
//
// Os oito personagens de exemplo ficam em pasta separada das criaturas. São
// coisas diferentes: um é o cientista de 1º nível que o Mestre usa como PNJ ou
// como modelo de ficha; o outro é o Zork que ataca a base.
function montaBestiario() {
  const docs = [];
  const pCriaturas = folderDoc("Bestiário", "Actor", "sd-bestiario");
  const pExemplos = folderDoc("Personagens de Exemplo", "Actor", "sd-exemplos");
  docs.push(pCriaturas, pExemplos);

  CRIATURAS.forEach((c, i) => {
    const exemplo = /\(Nível \d+\)/.test(c.nome);
    docs.push(monsterDoc(c, exemplo ? pExemplos._id : pCriaturas._id, "sd-bicho", i * 10));
  });
  return docs;
}

// ── Guarda: todo teste tem de achar a habilidade dele ───────────────────────
//
// O painel da ficha enfia o botão de rolagem DENTRO da habilidade de classe,
// casando por nome. Se alguém renomear "Talentos de Gatuno" em classes.mjs e
// esquecer o testes.mjs, o botão some sem erro nenhum — a ficha só fica sem
// ele, e ninguém percebe até a mesa.
//
// Então o build quebra aqui em vez de publicar um painel mudo.
function conferePonteiros() {
  const existentes = new Set(
    classes.flatMap((c) => (c.habilidades ?? []).map((h) => h.nome))
  );
  const orfas = TESTES
    .filter((t) => t.habilidade && !existentes.has(t.habilidade))
    .map((t) => `${t.chave} → "${t.habilidade}"`);

  if (orfas.length) {
    for (const o of orfas) console.error(`  ✘ ${o}`);
    console.error("  habilidades disponíveis:", [...existentes].sort().join(", "));
    throw new Error(
      `${orfas.length} teste(s) apontam para habilidade que não existe em classes.mjs`
    );
  }
  console.log(`  ✔ ponteiros: ${TESTES.filter((t) => t.habilidade).length} testes ligados a habilidades`);
}

// ── Macros ──────────────────────────────────────────────────────────────────
//
// Uma macro geral e uma por teste. As específicas existem porque é assim que a
// mesa usa: o gatuno quer um botão "Furtar" na barra, não um menu onde escolher
// furtar toda vez.
//
// O COMANDO É UMA LINHA SÓ, de propósito. Toda a regra vive em
// module/testes.js; a macro apenas chama. Assim atualizar o módulo atualiza a
// regra, inclusive para as macros que já foram arrastadas para a barra.
function montaMacros() {
  const docs = [];
  const pasta = folderDoc("Testes de porcentagem", "Macro", "sd-macros");
  docs.push(pasta);

  docs.push(macroDoc({
    nome: "Teste de porcentagem",
    comando: "game.spacedragon.teste();",
    img: "icons/svg/d20-highlight.svg",
  }, pasta._id, 0));

  docs.push(macroDoc({
    nome: "Pontos de Vida do nível",
    comando: "game.spacedragon.pv();",
    img: "icons/svg/heal.svg",
  }, pasta._id, 10));

  docs.push(macroDoc({
    nome: "Ordem de Ação",
    comando: "game.spacedragon.ordem();",
    img: "icons/svg/clockwork.svg",
  }, pasta._id, 30));

  docs.push(macroDoc({
    nome: "T7-4: Acerto Crítico",
    comando: "game.spacedragon.acertoCritico();",
    img: "icons/svg/target.svg",
  }, pasta._id, 40));

  docs.push(macroDoc({
    nome: "T7-5: Falha Crítica",
    comando: "game.spacedragon.falhaCritica();",
    img: "icons/svg/downgrade.svg",
  }, pasta._id, 50));

  docs.push(macroDoc({
    nome: "T10-6: Acerto Crítico de Espaçonave",
    comando: "game.spacedragon.acertoCriticoNave();",
    img: "icons/svg/explosion.svg",
  }, pasta._id, 60));

  docs.push(macroDoc({
    nome: "T10-6: Falha Crítica de Espaçonave",
    comando: "game.spacedragon.falhaCriticaNave();",
    img: "icons/svg/hazard.svg",
  }, pasta._id, 70));

  docs.push(macroDoc({
    nome: "Dano Crítico (Cosmonauta)",
    comando: "game.spacedragon.critico();",
    img: "icons/svg/explosion.svg",
  }, pasta._id, 20));

  TESTES.forEach((t, i) => {
    docs.push(macroDoc({
      nome: t.classe ? `${t.nome} (${t.classe})` : t.nome,
      comando: `game.spacedragon.teste("${t.chave}");`,
    }, pasta._id, (i + 1) * 100));
  });
  return docs;
}

// ── Compilação ──────────────────────────────────────────────────────────────
async function compila(nome, docs) {
  const srcDir = path.join(SRC, nome);
  fs.rmSync(srcDir, { recursive: true, force: true });
  fs.mkdirSync(srcDir, { recursive: true });
  writeSource(srcDir, docs);

  const outDir = path.join(OUT, nome);
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  await compilePack(srcDir, outDir, { log: false });

  const pastas = docs.filter((d) => d._key?.startsWith("!folders!")).length;
  console.log(`  ✔ ${nome}: ${docs.length} documentos → LevelDB (${pastas} pasta(s))`);
}

async function main() {
  console.log("Montando o Space Dragon…");
  conferePonteiros();

  let cls = aninhaPastas(montaClasses());
  pintaPastas(cls, PALETA);
  await compila(P_CLASSES, cls);

  let esp = aninhaPastas(montaEspecies());
  pintaPastas(esp, PALETA);
  await compila(P_ESPECIES, esp);

  await compila(P_TABELAS, montaTabelas());
  const journais = [...regras, mutacoesJournal, testesJournal, equipamentoJournal, aparatosJournal, combateJournal, navesJournal, mestreJournal];
  let best = aninhaPastas(montaBestiario());
  pintaPastas(best, PALETA);
  await compila(P_BESTIARIO, best);

  let ap = aninhaPastas(montaAparatos());
  pintaPastas(ap, PALETA);
  await compila(P_APARATOS, ap);

  let pod = aninhaPastas(montaPoderes());
  pintaPastas(pod, PALETA);
  await compila(P_PODERES, pod);

  let eq = aninhaPastas(montaEquipamento());
  pintaPastas(eq, PALETA);
  await compila(P_EQUIPAMENTO, eq);

  await compila(P_MACROS, montaMacros());
  await compila(P_JOURNAL, journais.map((e, i) => journalDoc(e, (i + 1) * 1000)));

  console.log("Concluído.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
