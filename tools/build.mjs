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
import { aventurasJournal } from "./data/aventuras-journal.mjs";
import { tiposComoRaca } from "./data/tipos-como-raca.mjs";
import { classesDeNave, comodosDaNave } from "./data/classes-de-nave.mjs";
import { equipamentosDeNave } from "./data/equipamentos-de-nave.mjs";
import { camarasDeNave } from "./data/camaras-de-nave.mjs";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(AQUI, "..");
const SRC = path.join(ROOT, "packs-src");
const OUT = path.join(ROOT, "spacedragon-module", "packs");

/* ── O ID DO MÓDULO, UMA VEZ SÓ ───────────────────────────────────
 *
 * A ficha de nave reconhece um cômodo pela FLAG do item, e não pelo nome:
 * `flags[<id do módulo>].camaraDeNave.chave`. O id faz parte do CAMINHO, e
 * quando as naves vieram do módulo de Star Wars para cá, o build continuou
 * gravando `flags["starwars-sd"]` enquanto a ficha já lia `flags["spacedragon"]`.
 *
 * O item existia, a lista aparecia — e NENHUM botão de instalar era desenhado,
 * porque `marcarComodos` procura a flag e dá `continue` quando não acha. Foi
 * assim que o seletor de cômodos sumiu da ficha, sem um erro no console para
 * dizer por quê.
 *
 * Literal nenhum: o id vem daqui, e trocar aqui troca nos dois lugares.
 */
const ID_MODULO = "spacedragon";

const P_CLASSES = "spacedragon-classes";
const P_ESPECIES = "spacedragon-especies";
const P_TABELAS = "spacedragon-tabelas";
const P_JOURNAL = "spacedragon-journal";
// O capítulo 10 do livro: tipos, câmaras e equipamentos de nave.
const P_NAVES = "spacedragon-naves";
// O id do compêndio para montar os UUIDs internos — a raça aponta para a
// habilidade dela, a classe para os cômodos, e tudo mora neste mesmo pack.
const NAVES_PACK = P_NAVES;
const P_MACROS = "spacedragon-macros";
const P_EQUIPAMENTO = "spacedragon-equipamento";
const P_PODERES = "spacedragon-poderes";
const P_APARATOS = "spacedragon-aparatos";
const P_BESTIARIO = "spacedragon-bestiario";

/* ── A ORDEM DAS PASTAS ───────────────────────────────────────────────────
 *
 * Toda pasta nascia com `sort: 0`. Com empate, o Foundry ordena pelo nome, e
 * a "10ª Grandeza" aparecia antes da "1ª", o "Mutante" antes do "Humano".
 * Agora cada pasta tem a posição dela, na ordem do livro.
 *
 * E não há mais pasta-raiz repetindo o nome do compêndio ("Classes" dentro de
 * "Space Dragon — Classes"): era um clique a mais para chegar em qualquer
 * coisa.
 */
const COR = {
  especie: "#2f5d7c",
  classe: "#5a3f7c",
  poder: "#5c2f7c",
};

/** Cor por pasta: sem isso o compêndio vira uma lista cinza indistinguível. */
const PALETA = {
  "Armas": "#7c4a2f",
  "Vestes e Proteção": "#2f6b6b",
  "Aparatos Tecnológicos": "#7c6b2f",
  "Feitos Científicos": "#2f7c5c",
  "Bestiário": "#7c2f3a",
  "Personagens de Exemplo": "#4a4a7c",
};

// ── Espécies ────────────────────────────────────────────────────────────────
function montaEspecies() {
  const docs = [];

  especies.forEach((esp, i) => {
    // Uma pasta por espécie, com a ESPÉCIE dentro e primeiro, e as habilidades
    // dela logo abaixo. Antes a espécie ficava numa pasta e as habilidades em
    // outra, e quem procurava o Mutante achava dois lugares.
    const sub = folderDoc(esp.nome, "Item", `sd-especie:${esp.nome}`, { sort: i + 1, color: COR.especie });
    docs.push(sub);

    const habs = (esp.habilidades ?? []).map((h, j) =>
      raceAbilityDoc(h, sub._id, `sd-race-ab:${esp.nome}`, 100 + j));
    docs.push(...habs);
    docs.push({
      ...raceDoc(esp, sub._id, habs.map((h) => itemUuid(P_ESPECIES, h._id))),
      sort: 0,
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
    // `data-degrau` é o que module/degraus.js lê para esconder o degrau que o
    // personagem ainda não alcançou — o sistema não sabe do 10º e do 20º.
    return `<p data-degrau="${nivel}">${cabeca}${txt}</p>`;
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

  classes.forEach((cls, i) => {
    // Uma pasta POR CLASSE, na ordem do livro: a classe e as especializações
    // à vista, e as habilidades numa subpasta. As habilidades entram sozinhas
    // na ficha com a classe; ficavam misturadas aos itens que o jogador
    // arrasta, e "Alcance Mental" aparecia antes de "Mentálico".
    const sub = folderDoc(cls.nome, "Item", `sd-classe:${cls.nome}`, { sort: i + 1, color: COR.classe });
    const pHabs = folderDoc(`${cls.nome} — Habilidades`, "Item", `sd-classe-hab:${cls.nome}`, { sort: 1, color: COR.classe });
    docs.push(sub, pHabs);

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
      .map((h, j) => classAbilityDoc(h, pHabs._id, `sd-class-ab:${cls.nome}`, j));
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
          pHabs._id, `sd-espec:${cls.nome}`, 100 + j
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
    }, lado === "aprimoramento" ? 100 : 200));
  }

  // As do Capítulo 11 são listas simples: a fórmula é 1dN, com N sendo o
  // tamanho da lista. A T11-1 tem ONZE entradas, então é 1d11 — não 1d10.
  // O segundo argumento do rollTableDoc é a POSIÇÃO no compêndio. Ele recebia
  // o tamanho da lista, e a T11-2 (9 resultados) aparecia antes da T2-1.
  for (const [nome, desc, lista, posicao] of [
    ["T11-1: Clichês de ficção científica",
     "Role para um gancho de aventura pulp.", CLICHES, 300],
    ["T11-2: Interesses de explorações",
     "O que motiva uma expedição, ou o que ela pode render.", INTERESSES, 400],
  ]) {
    docs.push(rollTableDoc({
      nome,
      desc,
      formula: `1d${lista.length}`,
      resultados: lista.map((texto, i) => ({ text: texto, range: [i + 1, i + 1] })),
    }, posicao));
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
    linhas.push(
      `Valor de proteção ${v.protecao}: é a BASE do coeficiente de proteção. ` +
      `A ficha soma ${v.protecao - 10 >= 0 ? "+" : ""}${v.protecao - 10} aos 10 dela e chega a ${v.protecao}.`
    );
  }
  if (v.movimento) linhas.push(`Reduz o movimento em ${v.movimento} metros.`);
  if (v.nota) linhas.push(v.nota);
  return linhas.join(" ");
}

function montaEquipamento() {
  const docs = [];
  const armas = folderDoc("Armas", "Item", "sd-armas", { sort: 1 });
  const vestes = folderDoc("Vestes e Proteção", "Item", "sd-vestes", { sort: 2 });
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
      // O escudo de energia é o único que SOMA. O resto é valor ABSOLUTO — o
      // livro faz CP = proteção das vestes + Destreza + bônus por nível —, e a
      // ficha do OD2 faz 10 + armadura + Destreza. Então o bônus é proteção −
      // 10: as Vestes médias (12) entram com +2, e a ficha chega aos 12 do
      // livro. O bônus por nível da T4-1 é o módulo que soma (atributos.js).
      // Os trajes que só se acrescentam à veste não têm proteção própria.
      tipo_armadura: v.bonus ? "escudo" : "",
      bonus_ca: v.bonus ? v.protecao : v.protecao == null ? 0 : v.protecao - 10,
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

  const porGrandeza = new Map();
  for (const p of PODERES) {
    if (!porGrandeza.has(p.grandeza)) porGrandeza.set(p.grandeza, []);
    porGrandeza.get(p.grandeza).push(p);
  }

  for (const g of [...porGrandeza.keys()].sort((a, b) => a - b)) {
    // `sort: g`: sem ele a 10ª vinha antes da 1ª, pela ordem do nome.
    const sub = folderDoc(`${g}ª Grandeza`, "Item", `sd-grandeza:${g}`, { sort: g, color: COR.poder });
    docs.push(sub);

    porGrandeza.get(g).forEach((p, i) => {
      docs.push(spellDoc({
        nome: p.nome,
        seedNome: p.seedNome,
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
  const pAparatos = folderDoc("Aparatos Tecnológicos", "Item", "sd-aparatos", { sort: 1 });
  const pFeitos = folderDoc("Feitos Científicos", "Item", "sd-feitos", { sort: 2 });
  docs.push(pAparatos, pFeitos);

  // Uma subpasta por nível tecnológico, que é o que limita quem constrói o
  // quê: 54 aparatos numa lista só não se percorrem. "Pai — Filho" no nome é
  // o que a aninhaPastas lê para pendurar a subpasta.
  const porNT = new Map();
  const pastaNT = (pai, a) => {
    const chave = `${pai.name}|${a.nt ?? "?"}`;
    if (!porNT.has(chave)) {
      const rotulo = a.nt === null || a.nt === undefined ? "NT variável" : `${a.nt}º NT`;
      const f = folderDoc(`${pai.name} — ${rotulo}`, "Item", `sd-nt:${pai.name}`, { sort: a.nt ?? 99 });
      docs.push(f);
      porNT.set(chave, f);
    }
    return porNT.get(chave);
  };

  APARATOS.forEach((a, i) => {
    docs.push(miscDoc({
      nome: a.nome,
      // Repassado: o id é semeado por ele, e sem isto consertar a caixa do nome
      // trocaria o UUID de 30 aparatos.
      seedNome: a.seedNome,
      desc: corpoAparato(a),
      cost: a.custo,
      ...(a.categoria ? { flags: { spacedragon: { aparato: { categoria: a.categoria, nt: a.nt ?? null, feito: !!a.feito } } } } : {}),
    }, pastaNT(a.feito ? pFeitos : pAparatos, a)._id, a.feito ? "sd-feito" : "sd-aparato", i * 10));
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
  const pCriaturas = folderDoc("Bestiário", "Actor", "sd-bestiario", { sort: 1 });
  const pExemplos = folderDoc("Personagens de Exemplo", "Actor", "sd-exemplos", { sort: 2 });
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
  // Três pastas pelo USO, e não uma "Testes de porcentagem" com os críticos e
  // o PV dentro. Os nomes das macros não mudam: o id é semeado por eles.
  const pTestes = folderDoc("Testes de porcentagem", "Macro", "sd-macros", { sort: 1 });
  const pMesa = folderDoc("Ferramentas da mesa", "Macro", "sd-macros-mesa", { sort: 2 });
  const pTabelas = folderDoc("Tabelas do livro", "Macro", "sd-macros-tabelas", { sort: 3 });
  const docs = [pTestes, pMesa, pTabelas];
  const macro = (pasta, sort, nome, comando, img) => docs.push(macroDoc({ nome, comando, img }, pasta._id, sort));

  macro(pTestes, 0, "Teste de porcentagem", "game.spacedragon.teste();", "icons/svg/d20-highlight.svg");
  TESTES.forEach((t, i) => {
    docs.push(macroDoc({
      nome: t.classe ? `${t.nome} (${t.classe})` : t.nome,
      comando: `game.spacedragon.teste("${t.chave}");`,
    }, pTestes._id, (i + 1) * 100));
  });

  macro(pMesa, 10, "Pontos de Vida do nível", "game.spacedragon.pv();", "icons/svg/heal.svg");
  macro(pMesa, 20, "Dano Crítico (Cosmonauta)", "game.spacedragon.critico();", "icons/svg/explosion.svg");
  macro(pMesa, 30, "Dia novo (alcance mental)", "game.spacedragon.descansar();", "icons/svg/sun.svg");
  macro(pMesa, 40, "Ordem de Ação", "game.spacedragon.ordem();", "icons/svg/clockwork.svg");
  macro(pMesa, 50, "Desativar Robôs (T3-2)", "game.spacedragon.desativarRobos();", "icons/svg/combat.svg");

  macro(pTabelas, 10, "T7-4: Acerto Crítico", "game.spacedragon.acertoCritico();", "icons/svg/target.svg");
  macro(pTabelas, 20, "T7-5: Falha Crítica", "game.spacedragon.falhaCritica();", "icons/svg/downgrade.svg");
  macro(pTabelas, 30, "T10-6: Acerto Crítico de Espaçonave", "game.spacedragon.acertoCriticoNave();", "icons/svg/explosion.svg");
  macro(pTabelas, 40, "T10-6: Falha Crítica de Espaçonave", "game.spacedragon.falhaCriticaNave();", "icons/svg/hazard.svg");
  macro(pTabelas, 50, "T11-3: Relíquia Tecnológica", "game.spacedragon.reliquia();", "icons/svg/item-bag.svg");
  macro(pTabelas, 60, "T11-4: Defeito de Relíquia", "game.spacedragon.defeitoDeReliquia();", "icons/svg/hazard.svg");
  return docs;
}

// ── Os journals, pela ordem dos capítulos ───────────────────────────────────
//
// Todos se chamavam "Space Dragon — …", o que dentro do compêndio "Space
// Dragon — Regras" só repetia o nome dez vezes. O capítulo no começo diz onde
// cada um fica no livro e ordena a lista.
//
// A chave é o título ORIGINAL, que é a semente do id (ver journalDoc): o UUID
// de quem já tem o journal no mundo não muda.
const CAPITULO_DO_JOURNAL = {
  "Space Dragon — regras de referência": [1, "Cap. 1 — Atributos"],
  "Space Dragon — Mutações do Homo novus": [2, "Cap. 2 — Mutações do Homo novus"],
  "Space Dragon — Testes de porcentagem": [3, "Cap. 3 — Testes de porcentagem"],
  "Space Dragon — Subatributos": [4, "Cap. 4 — Subatributos"],
  "Space Dragon — Créditos e Equipamento": [5, "Cap. 5 — Créditos e Equipamento"],
  "Space Dragon — Aventuras Espaciais": [6, "Cap. 6 — Aventuras Espaciais"],
  "Space Dragon — Combate e Danos": [7, "Cap. 7 — Combate e Danos"],
  "Space Dragon — Aparatos e Feitos Científicos": [8, "Cap. 8 — Aparatos e Feitos Científicos"],
  "Space Dragon — Espaçonaves e Estações": [10, "Cap. 10 — Espaçonaves e Estações"],
  "Space Dragon — Seção do Mestre": [11, "Cap. 11 — Seção do Mestre"],
};

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
  const journais = [...regras, mutacoesJournal, testesJournal, equipamentoJournal, aparatosJournal, combateJournal, navesJournal, mestreJournal, aventurasJournal];
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
  await compila(P_JOURNAL, journais.map((e) => {
    const cap = CAPITULO_DO_JOURNAL[e.title];
    if (!cap) throw new Error(`journal "${e.title}" sem capítulo em CAPITULO_DO_JOURNAL`);
    return journalDoc({ ...e, seedTitle: e.title, title: cap[1] }, cap[0] * 100);
  }));
  await compila(P_NAVES, buildNavesDocs());

  console.log("Concluído.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/* ── O PACK DE NAVES (CAPÍTULO 10) ─────────────────────────────────────────
 *
 * Os tipos (T10-1) como raça, as câmaras (T10-2) como habilidades de classe, e
 * os equipamentos (T10-4) como itens — as armas de verdade, os demais como
 * item comum.
 *
 * Isto veio do módulo de Star Wars, onde foi escrito primeiro porque foi lá que
 * a mesa precisou de naves. Mas o capítulo 10 é do LIVRO: uma mesa de Space
 * Dragon sem Star Wars ficava sem naves, o que é o contrário do que o livro
 * oferece.
 */
function buildNavesDocs() {
  const docs = [];
  const pasta = (nome, seed, opts = {}) => {
    const f = folderDoc(nome, "Item", seed, opts);
    docs.push(f);
    return f;
  };

  /* ── O QUE SE USA À VISTA, AS PEÇAS NUMA PASTA SÓ ──────────────────────
   *
   * O jogador e o Mestre usam três coisas daqui: o tipo de nave, as câmaras
   * para instalar e os equipamentos. O resto — o perfil de cada tipo, a
   * classe de cada tipo e os cômodos como habilidade — é engrenagem que o
   * criador de naves põe na ficha sozinho. Ficava tudo no mesmo nível, com
   * "Câmaras" e "Cômodos" lado a lado e doze nomes repetidos.
   */
  const fPecas = pasta("Peças da ficha de nave (automático)", "nave-pecas-pasta", { sort: 4 });
  const fEquip = pasta("Equipamentos adicionais (T10-4)", "nave-equip-pasta", { sort: 3 });
  equipamentosDeNave.forEach((e, i) => {
    /* ── AS ARMAS SÃO `weapon`, E NÃO `misc` ──────────────────────────────
     *
     * Todos os equipamentos da T10-4 nasciam `misc` — item genérico. A mesa
     * reportou o efeito: as armas «estão como item geral, não como arma, e não
     * geram ataque». É exatamente isso: o sistema só desenha o botão de rolar
     * dano para itens do tipo `weapon` com `damage` preenchido, e um `misc`
     * fica na mochila sem nada para clicar.
     *
     * As cinco de combate com dano declarado (disparadores, canhões,
     * metralhadora, mísseis) viram arma de verdade. O Computador Balístico, os
     * Defletores e o Escudo de Força continuam `misc`, e devem continuar: eles
     * não atiram, modificam o que atira — e um "ataque" de Escudo de Força na
     * ficha seria um botão que ninguém saberia o que faz.
     *
     * `ranged` porque é o que o sistema usa para o que dispara à distância, e
     * `two_handed` porque uma arma de nave não é empunhada por ninguém — o
     * campo existe para o cálculo de mãos livres do personagem, e deixá-la
     * como arma de uma mão a tornaria combinável com escudo.
     */
    const dano = e.dano;
    const doc = dano
      ? weaponDoc(
          {
            nome: e.nome,
            desc: e.desc,
            img: e.img,
            damage: dano,
            ranged: true,
            melee: false,
            two_handed: true,
            // o alcance é o do combate espacial, que o §10.6 não mede em
            // metros: quem decide se a nave alvo está ao alcance é o Mestre
            shoot_range: 0,
          },
          fEquip._id, "nave-equip", (i + 1) * 100000)
      : miscDoc({ nome: e.nome, desc: e.desc, img: e.img },
          fEquip._id, "nave-equip", (i + 1) * 100000);
    doc.flags[ID_MODULO] = { equipamentoDeNave: { chave: e.chave, grupo: e.grupo, cabe: e.cabe } };
    docs.push(doc);
  });

  /* ── OS TIPOS DE NAVE, COMO RAÇA ─────────────────────────────────────────
   *
   * A nave numa ficha de personagem É de um tipo, e tipo é o que a raça
   * significa no Old Dragon 2. Arrastar "Caça" para a ficha dá CP 28 e
   * movimento 150 m pela maquinaria do sistema — `natural_armor` e `movement`
   * —, sem automação nossa.
   *
   * Cada tipo leva uma habilidade de raça com o que a raça NÃO carrega: a BA e
   * a JP (que no sistema vêm da classe) e a fórmula de PV (que a mesa rola).
   */
  {
    const fTipos = pasta("Tipos de nave (T10-1)", "nave-tipo-pasta", { sort: 1 });
    const fPerfis = pasta("Perfis dos tipos (T10-1)", "nave-perfil-pasta", { sort: 1, parentId: fPecas._id });
    tiposComoRaca.forEach((t, i) => {
      const hab = raceAbilityDoc(t.habilidade, fPerfis._id, `nave-tipo:${t.chave}`, (i + 1) * 1000);
      docs.push(hab);
      const raca = raceDoc({ ...t }, fTipos._id, [itemUuid(NAVES_PACK, hab._id)]);
      raca.sort = (i + 1) * 100000;
      docs.push(raca);
    });
  }

  /* ── UMA CLASSE POR TIPO, E OS CÔMODOS COMO HABILIDADES ──────────────────
   *
   * No Old Dragon 2 a BA e a JP vêm da CLASSE, por nível — e na T10-1 elas
   * variam por tipo. Uma classe "Nave" genérica daria os mesmos números a
   * todos; uma por tipo traz os certos pela maquinaria do sistema.
   *
   * As doze habilidades são COMPARTILHADAS pelas oito classes: o cômodo é o
   * mesmo em qualquer nave, e o que muda é quais estão instalados — estado do
   * ator, não da classe. Um cômodo, uma descrição, um lugar para corrigir.
   */
  {
    const fComodos = pasta("Cômodos (T10-2)", "nave-comodo-pasta", { sort: 3, parentId: fPecas._id });
    const uuids = comodosDaNave.map((c, i) => {
      const hab = classAbilityDoc(c, fComodos._id, "nave-comodo", (i + 1) * 1000);
      docs.push(hab);
      return itemUuid(NAVES_PACK, hab._id);
    });

    const fClasses = pasta("Classes dos tipos (T10-1)", "nave-classe-pasta", { sort: 2, parentId: fPecas._id });
    classesDeNave.forEach((c, i) => {
      const cls = classDoc(c, fClasses._id, uuids);
      cls.sort = (i + 1) * 100000;
      docs.push(cls);
    });
  }

  const fCamaras = pasta("Câmaras (T10-2)", "nave-camara-pasta", { sort: 2 });
  camarasDeNave.forEach((c, i) => {
    const doc = miscDoc({ nome: c.nome, desc: c.desc, img: c.img, cost: `${c.obra}` },
      fCamaras._id, "nave-camara", (i + 1) * 100000);
    doc.flags[ID_MODULO] = { camaraDeNave: { chave: c.chave } };
    docs.push(doc);
  });

  return docs;
}
