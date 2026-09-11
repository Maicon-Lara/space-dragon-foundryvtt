// Biblioteca de geração dos compêndios de "Star Dragon (Star Wars no OD2)".
// Derivada da lib do módulo Ekhoria (mesmo autor); MODULE_ID parametrizado.
// Constrói documentos no formato-fonte do foundryvtt-cli (um JSON por documento,
// com o campo "_key") e compila para LevelDB.

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ID_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

// ID determinístico de 16 caracteres derivado de uma "seed".
// Determinístico = o mesmo conteúdo sempre gera o mesmo _id, então as
// referências por UUID permanecem estáveis entre builds (e entre mundos que
// já importaram o conteúdo).
export function makeId(seed) {
  const hash = crypto.createHash("sha1").update(String(seed)).digest();
  let id = "";
  for (let i = 0; i < 16; i++) id += ID_ALPHABET[hash[i] % ID_ALPHABET.length];
  return id;
}

// Normaliza uma lista de restrição (raças/alinhamentos) para o formato que o
// sistema olddragon2e espera: um array de UM elemento contendo os valores
// separados por vírgula. O sistema faz `races[0].split(',')`, então uma lista
// com vários itens faria ele ler só o primeiro (o bug do "só Humano").
export function csvRestricao(lista) {
  return Array.isArray(lista) && lista.length ? [lista.join(", ")] : [];
}

// Converte a descrição de HTML para texto puro.
//
// Por que: no olddragon2e o campo `system.description` muda de contrato conforme
// o tipo do item. Classe, habilidade, magia e monstro são renderizados com
// {{{ }}} e aceitam HTML. Mas weapon/armor/misc aparecem em
// `templates/sheets/*-sheet.hbs` dentro de um <textarea>, que exibe tag como
// texto, e a lista de equipamento da ficha passa por {{truncate ... 35}} — um
// corte cego que, caindo no meio de uma tag, deixa elemento aberto e faz as
// tabelas seguintes da ficha aninharem umas nas outras.
//
// O conteúdo oficial do OD2 segue essa mesma divisão: 0 de 96 itens do pack
// `equipment` têm HTML na descrição, enquanto 139 de 179 das classes têm.
//
// A autoria em `data/*.mjs` continua em HTML (é mais legível e as notas são
// compartilhadas com journals); a conversão acontece só na saída.
export function htmlParaTexto(html) {
  if (!html) return "";
  return String(html)
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\s*li[^>]*>/gi, "• ")
    .replace(/<\s*\/\s*(p|div|li|tr|h[1-6]|ul|ol)\s*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&hellip;/g, "…")
    .replace(/&times;/g, "×")
    .replace(/&quot;/g, '"')
    .replace(/&(?:#0?39|apos);/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&") // por último: senão reintroduz entidade
    .replace(/[ \t]+/g, " ")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Slug simples para usar em seeds.
export function slug(s) {
  return String(s)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Ícones empacotados pelo próprio sistema OD2 (garantidos para qualquer usuário).
const OD2I = "systems/olddragon2e/assets/icons";
const ICONS = {
  class: `${OD2I}/level-up.svg`,
  class_ability: `${OD2I}/kit.svg`,
  race: `${OD2I}/alignment.svg`,
  race_ability: `${OD2I}/diamond.svg`,
};

// Tradução do tipo de dano: PT (como está no livro) → enum do sistema OD2
// (slashing/piercing/bludgeoning). Os dados-fonte ficam em português; um valor
// já em inglês passa direto, e ausência vira "none".
const DANO_PT_EN = { cortante: "slashing", perfurante: "piercing", impactante: "bludgeoning" };
function damageType(v) {
  if (!v) return "none";
  return DANO_PT_EN[v] ?? v;
}

// Ícone semântico por palavra-chave.
//
// Sem isto, 194 habilidades dividiam kit.svg e 61 aparatos dividiam misc.svg:
// abrir o compêndio era uma parede de linhas idênticas. As regras abaixo usam
// só os 35 ícones que o próprio olddragon2e empacota — a mesma regra que o
// projeto já seguia para não depender de caminho de ícone core.
//
// Ordem importa: vence a primeira regra que casar, então o específico vem
// antes do genérico ("Força Bruta" é músculo, não a Força mística).
const REGRAS_ICONE = [
  // Sabre de luz e suas sete formas
  [/shii-cho|makashi|soresu|ataru|djem so|niman|juyo|vaapad|forma de sabre|formas de sabre|mudar de guarda|sabre/, "slashing"],
  // Cultura mandaloriana
  [/mandalor|resol'?nare|beskar|do cla|de cla|eco da senda/, "legiao-shield"],
  // Físico bruto (antes da Força: "Força Bruta" não é mística)
  [/forca bruta|furia|desarmar|subjugar|manopla/, "unarmed"],
  // A Força e a mente
  [/forca|nexo|comunhao|presciencia|extrassensorial|oculto|corrupcao|tentacao|luz e sombra|apice da mente|mente superior|dominio da senda|cerebro|mente|disciplina|tatica/, "brain"],
  // Talentos de Operativo: familia unica, antes de "assassin" levar so um deles
  [/talentos de|infiltracao|fantasma|espia|contraband|oficios do submundo/, "bag"],
  // Ataque furtivo antes do combate genérico
  [/furtiv|ataque furtivo|golpe fatal|execucao|assassin/, "piercing"],
  // Tiro e armas de energia
  [/armado e perigoso|marcar alvo|mira|blaster|canhao|pistola|repetidor|desintegrador|disruptor|paralisante|lanca-chamas|arma de energia/, "ranged"],
  // Explosivos e arremesso
  [/granada|detonita|missil|carga de|bomba/, "throw"],
  // Combate corpo a corpo
  [/combate|ataque|ataques multiplos|dano critico|acao ousada|adestramento|duelo/, "melee"],
  // Defesa
  [/defletor|escudo|cupula|blindad|vontade|inabalavel|inquebravel|resistencia|resistente|a dor/, "shield"],
  // Medicina
  [/medicina|medico|medpac|bacta|estimulante|injetor|cura|regeneracao/, "magic-potion"],
  // Pilotagem e veículo
  [/pilotar|piloto|voo|nave|veiculo/, "vehicle"],
  // Movimento e mobilidade
  [/jetpack|propulsao|botas|aderencia|lancador de cabo|anfibio|nautico|aquatic/, "movement"],
  // Percepção, sensores e visores
  [/percepcao|instinto|sensor|visor|visao|detector|analisador|medidor|holocamera|varredura|noturno|termic|lekku/, "diamond"],
  // Dados, comunicação e tradução
  [/datapad|cilindro de dados|comlink|comunicador|projetor|holografic|traducao|protocolo|baliza|rastread|bloqueador|jammer|idiomas/, "magic-scroll"],
  // Implantes e cibernética
  [/cibernetic|membro|orgao|neural|positronic|robotic|implante/, "magic-ring"],
  // Cristais
  [/cristal|kyber|gema/, "gem"],
  // Contenção e recipientes
  [/algema|coleira|laco|cilindro|capsula|mochila/, "container"],
  // Trajes e proteção corporal
  [/traje|respirador|oxigenio|antirradiacao|armadura|casca|escama|garras/, "armor"],
  // Técnico, oficina e sabotagem
  [/aparato|maquina|droide|sistema|invencao|inventor|oficina|engenho|armadilha|tecnolog|desativar|sequestrar|quebrar|consertar|operar|sabotagem|slicer|cortador|broca|compressor|teletransport/, "kit"],
  // Social, reputação e comércio
  [/embaixador|enviado|mecenas|reputacao|mercado|desconto|submundo|lenda|seducao|lideranca|negocia/, "coins"],
];

// Remove acentos e caixa para as regras acima casarem sem depender de grafia.
function normaliza(s) {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

// Ícone das CLASSES. Tabela própria, separada de REGRAS_ICONE, porque os nomes
// de classe ("Operativo — Sabotador", "Veterano — Mercenário") não casam com o
// vocabulário de habilidade — e misturar as duas listas faria regra de classe
// pegar habilidade por acidente.
//
// Ordem: senda mandaloriana e formas de sabre primeiro, porque aparecem
// combinadas com a classe-base no nome ("Sensível à Força — Guardião (Ataru)").
const ICONES_CLASSE = [
  [/mandalor|resol'?nare|beskar/, "legiao-shield"],
  [/guardiao|ataru|makashi|soresu|djem so|niman|juyo|vaapad|shii-cho|sabre/, "slashing"],
  [/sensivel a forca|consular|sentinela|vidente/, "brain"],
  [/tecnico|engenheiro|medico de campo|slicer/, "kit"],
  [/operativo|assassino|contrabandista|espiao|sabotador/, "bag"],
  [/veterano|mercenario|cacador de recompensas|emissario/, "melee"],
];

export function iconeClasse(nome, padrao) {
  const alvo = normaliza(nome);
  for (const [regra, icone] of ICONES_CLASSE) {
    if (regra.test(alvo)) return `${OD2I}/${icone}.svg`;
  }
  return padrao;
}

export function iconeSemantico(texto, padrao) {
  const alvo = normaliza(texto);
  for (const [regra, icone] of REGRAS_ICONE) {
    if (regra.test(alvo)) return `${OD2I}/${icone}.svg`;
  }
  return padrao;
}

// Nível Tecnológico de um aparato.
//
// A fonte preferencial é o campo `nt` do item. O texto entra como fallback,
// mas SÓ no padrão de declaração do início ("Utilitário, NT 3."): descrições
// citam o NT de OUTROS itens nas equivalências com o ED-07, e uma busca solta
// por /NT \d/ classifica errado — foi o que fez o Sensor de Movimento parecer
// NT 1 (o NT é do Visor Térmico, que ele cita) e a Máquina do Tempo, NT 10,
// parecer NT 1 (a regex pegava só o primeiro dígito).
export function nivelTecnologico(it) {
  if (Number.isInteger(it.nt)) return it.nt;
  const m = /^<p><strong>(?:Utilit[áa]rio|Ofensivo|Defensivo)[^<]*?,\s*NT\s*(\d+)/.exec(it.desc ?? "");
  return m ? Number(m[1]) : null;
}

// Ícone de arma conforme o tipo (alcance ou tipo de dano).
function weaponIcon(it) {
  if (it.ranged || it.melee === false) return `${OD2I}/ranged.svg`;
  const t = damageType(it.damage_type);
  return `${OD2I}/${["slashing", "piercing", "bludgeoning"].includes(t) ? t : "melee"}.svg`;
}

// "Usuário" que assina os documentos gerados. O Foundry valida este campo como
// um ID de documento: EXATAMENTE 16 caracteres alfanuméricos. Com qualquer
// outro tamanho, o mundo inteiro falha ao carregar com
// "lastModifiedBy: must be a valid 16-character alphanumeric ID".
const BUILD_USER_ID = "spacedragonbld01";
if (!/^[A-Za-z0-9]{16}$/.test(BUILD_USER_ID)) {
  throw new Error(
    `BUILD_USER_ID inválido (${BUILD_USER_ID.length} chars): precisa ter exatamente 16 caracteres alfanuméricos.`
  );
}

// _stats padrão. systemVersion é substituído automaticamente pelo Foundry.
export function stats() {
  return {
    compendiumSource: null,
    duplicateSource: null,
    coreVersion: "13.342",
    systemId: "olddragon2e",
    systemVersion: "This is auto replaced",
    createdTime: 0,
    modifiedTime: 0,
    lastModifiedBy: BUILD_USER_ID,
    exportSource: null,
  };
}

// Pasta (folder) que agrupa, dentro de um pack, uma classe/raça com suas habilidades.
export function folderDoc(name, contentType /* "Item" */, seedPrefix, opts = {}) {
  const id = makeId(`folder:${seedPrefix}:${name}`);
  return {
    name,
    sorting: "m",
    folder: opts.parentId ?? null,
    type: contentType,
    _id: id,
    description: "",
    sort: opts.sort ?? 0,
    color: opts.color ?? null,
    flags: {},
    _stats: { ...stats(), exportSource: undefined },
    _key: `!folders!${id}`,
  };
}

// Transforma a hierarquia que hoje só existe no NOME da pasta em hierarquia de
// verdade. O projeto já nomeia por convenção — "Operativo — Assassino",
// "Sensível à Força — Guardião (Ataru)" —, então a própria convenção vira a
// regra: se existe uma pasta com o nome do prefixo, a pasta vira filha dela e
// fica só com o sufixo no rótulo.
//
// Duas formas de prefixo, aplicadas em laço até estabilizar (para encadear
// Sensível à Força > Guardião > Ataru):
//   "Pai — Filho"   (travessão)
//   "Pai (Filho)"   (parêntese, usado pelas Formas de Sabre)
//
// O _id continua derivado do nome COMPLETO original, então renomear aqui não
// muda ID nenhum: referências por UUID seguem válidas.
export function aninhaPastas(docs) {
  const pastas = docs.filter((d) => d._key?.startsWith("!folders!"));
  const porId = new Map(pastas.map((f) => [f._id, f]));

  // Nome curto -> pasta. Só registra o primeiro: nomes repetidos (várias
  // "Senda Mandaloriana", uma por classe) não devem virar pai de ninguém.
  const porNome = new Map();
  const ambiguos = new Set();
  const registra = (nome, pasta) => {
    if (ambiguos.has(nome)) return;
    if (porNome.has(nome) && porNome.get(nome) !== pasta) {
      porNome.delete(nome);
      ambiguos.add(nome);
      return;
    }
    porNome.set(nome, pasta);
  };
  for (const f of pastas) registra(f.name, f);

  // Evita ciclo: um pai não pode ser descendente do próprio filho.
  const ehDescendente = (possivel, ancestral) => {
    let atual = possivel;
    while (atual?.folder) {
      if (atual.folder === ancestral._id) return true;
      atual = porId.get(atual.folder);
    }
    return false;
  };

  let mudou = true;
  while (mudou) {
    mudou = false;
    for (const pasta of pastas) {
      const travessao = pasta.name.lastIndexOf(" — ");
      const parenteses = pasta.name.match(/^(.+) \(([^)]+)\)$/);

      let pai = null;
      let rotulo = null;
      if (travessao > 0) {
        pai = porNome.get(pasta.name.slice(0, travessao)) ?? null;
        if (pai) rotulo = pasta.name.slice(travessao + 3);
      }
      if (!pai && parenteses) {
        pai = porNome.get(parenteses[1]) ?? null;
        if (pai) rotulo = parenteses[2];
      }

      if (!pai || pai === pasta) continue;
      if (pasta.folder === pai._id && pasta.name === rotulo) continue;
      if (ehDescendente(pai, pasta)) continue;

      pasta.folder = pai._id;
      pasta.name = rotulo;
      registra(rotulo, pasta); // permite descer mais um nível na volta do laço
      mudou = true;
    }
  }
  return docs;
}

// daily_uses por nível (1..15). Se a habilidade tem `usos_dia`, aplica esse
// número de usos a partir do nível em que ela é obtida.
function dailyUses(ability) {
  const level = ability.level ?? 1;
  const usos = ability.usos_dia ?? 0;
  const o = {};
  for (let i = 1; i <= 15; i++) o[String(i)] = i >= level ? usos : 0;
  return o;
}

// Item do tipo class_ability.
export function classAbilityDoc(ability, folderId, seedPrefix, sort) {
  const id = makeId(`class_ability:${seedPrefix}:${ability.nome}`);
  return {
    folder: folderId,
    name: ability.nome,
    type: "class_ability",
    _id: id,
    img: ability.img || iconeSemantico(ability.nome, ICONS.class_ability),
    system: {
      description: ability.desc || "",
      level: ability.level ?? 1,
      level3: ability.level3 || "",
      level6: ability.level6 || "",
      level10: ability.level10 || "",
      rogue_talents: ability.rogue_talents || [],
      daily_uses: dailyUses(ability),
    },
    effects: [],
    flags: {},
    _stats: stats(),
    sort: sort,
    ownership: { default: 0 },
    _key: `!items!${id}`,
  };
}

// A ficha do OD2 renderiza equipment_restrictions como TEXTO, não HTML: uma
// tag aqui chega crua ao jogador ("<strong>Exceção...</strong>" escrito na
// ficha). Falha o build em vez de publicar isso.
function textoPuro(cls, campo) {
  const v = cls.equipment_restrictions?.[campo] ?? "Sem restrições.";
  if (/<[a-z/][^>]*>/i.test(v)) {
    throw new Error(
      `equipment_restrictions.${campo} de "${cls.nome}" tem HTML — este campo é texto puro:
  ${v}`
    );
  }
  return v;
}

// Item do tipo class.
export function classDoc(cls, folderId, abilityUuids) {
  // `seedNome` é o nome COMPLETO ("Operativo — Espião"); `nome` é o que o
  // jogador lê na ficha ("Espião"). O _id continua semeado pelo completo para
  // que encurtar o rótulo não troque o UUID de nenhuma classe já em uso.
  const id = makeId(`class:${cls.seedNome ?? cls.nome}`);
  return {
    folder: folderId,
    name: cls.nome,
    type: "class",
    _id: id,
    img: cls.img || iconeClasse(cls.nome, ICONS.class),
    system: {
      flavor: cls.flavor || "",
      description: cls.descricao || "",
      hp: cls.dv ?? null,
      high_level_hp_bonus: cls.high_level_hp_bonus ?? null,
      equipment_restrictions: {
        weapons: textoPuro(cls, "weapons"),
        armors: textoPuro(cls, "armors"),
        magic_items: textoPuro(cls, "magic_items"),
      },
      restrictions: {
        // O sistema olddragon2e lê estes campos como UMA string separada por
        // vírgulas (pega só o [0] e faz split). Um array de N itens faria o
        // sistema enxergar apenas o primeiro — por isso juntamos numa string.
        alignments: csvRestricao(cls.restricao_alinhamentos),
        races: csvRestricao(cls.restricao_racas),
      },
      levels: cls.levels,
      class_abilities: abilityUuids,
    },
    effects: [],
    flags: {},
    _stats: stats(),
    sort: 0,
    ownership: { default: 0 },
    _key: `!items!${id}`,
  };
}

// Item do tipo race_ability.
export function raceAbilityDoc(ability, folderId, seedPrefix, sort) {
  const id = makeId(`race_ability:${seedPrefix}:${ability.nome}`);
  const jp = ability.jp || {};
  const sys = {
    description: ability.desc || "",
    xp: ability.xp ?? null,
    jp: {
      jpc: !!jp.jpc,
      jpd: !!jp.jpd,
      jps: !!jp.jps,
    },
    bonus_damage: ability.bonus_damage ?? 0,
    bonus_damage_condition: ability.bonus_damage_condition ?? "none",
    bonus_damage_condition_2: ability.bonus_damage_condition_2 ?? "none",
    rogue_talent: ability.rogue_talent ?? "none",
    rogue_talent_2: ability.rogue_talent_2 ?? "none",
    daily_uses: ability.daily_uses ?? 0,
    // ATENÇÃO: natural_armor é a CA BASE, não um bônus. O sistema faz
    // `get ac_base() { ... if (naturalArmor) return naturalArmor; ... return 10 }`
    // — ele RETORNA o valor no lugar dos 10 padrão, não soma.
    //
    // O módulo escrevia 1 aqui para dizer "+1 natural na CA", e o resultado era
    // um Wookiee com ac_base 1 e CA total −3: toda criatura da galáxia acertava
    // nele automaticamente. Escreva a CA base final (11 para um "+1 natural").
    natural_armor: ability.natural_armor ?? 0,
    load_modifier: ability.load_modifier ?? 0,
    max_load_override: ability.max_load_override ?? 0,
    armor_weight_modifier: ability.armor_weight_modifier ?? 0,
  };
  if (ability.natural_weapon) {
    sys.natural_weapon = {
      damage: ability.natural_weapon.damage ?? "",
      damage_type: ability.natural_weapon.damage_type ?? "none",
      weapon_size: ability.natural_weapon.weapon_size ?? "none",
    };
  }
  if (ability.variable_construction) {
    sys.variable_construction = {
      choices_count: ability.variable_construction.choices_count ?? 0,
      available_options: ability.variable_construction.available_options ?? [],
    };
  }
  return {
    folder: folderId,
    name: ability.nome,
    type: "race_ability",
    _id: id,
    img: ability.img || iconeSemantico(ability.nome, ICONS.race_ability),
    system: sys,
    effects: [],
    flags: {},
    _stats: stats(),
    sort: sort,
    ownership: { default: 0 },
    _key: `!items!${id}`,
  };
}

// Item do tipo race.
export function raceDoc(race, folderId, abilityUuids) {
  const id = makeId(`race:${race.nome}`);
  const sys = {
    flavor: race.flavor || "",
    description: race.descricao || "",
    movement: race.movement ?? 9,
    movement_fly: race.movement_fly ?? 0,
    movement_notes: race.movement_notes || "",
    infravision: race.infravision ?? 0,
    infravision_notes: race.infravision_notes || "",
    alignment_tendency: race.alignment_tendency || "none",
    alignment_notes: race.alignment_notes || "",
    race_abilities: abilityUuids,
  };
  if (race.movement_swim != null) sys.movement_swim = race.movement_swim;
  return {
    folder: folderId,
    name: race.nome,
    type: "race",
    _id: id,
    img: race.img || ICONS.race,
    system: sys,
    effects: [],
    flags: {},
    _stats: stats(),
    sort: 0,
    ownership: { default: 0 },
    _key: `!items!${id}`,
  };
}

// JournalEntry com páginas de texto (HTML).
// Marca como callout os parágrafos que começam com o sinal de aviso.
function destacaAvisos(html) {
  return String(html).replace(
    /<p>(\s*(?:&#9888;|⚠)\s*)/g,
    '<p class="spacedragon-aviso">$1'
  );
}

export function journalDoc(entry, sort) {
  const id = makeId(`journal:${entry.title}`);
  const pages = (entry.pages || [{ title: entry.title, content: entry.content }]).map(
    (p, i) => {
      const pid = makeId(`journal-page:${entry.title}:${p.title}:${i}`);
      return {
        sort: (i + 1) * 100000,
        name: p.title,
        type: "text",
        _id: pid,
        title: { show: true, level: 1 },
        image: {},
        // `spacedragon-doc` é o gancho de escopo do CSS do módulo: sem ele, estilizar
        // tabela e título vazaria para os journals do sistema e de outros módulos.
        // Parágrafos de aviso (⚠) viram callout — o marcador já estava no texto.
        text: {
          format: 1,
          content: `<div class="odo-markdown spacedragon-doc">${destacaAvisos(p.content)}</div>`,
        },
        video: { controls: true, volume: 0.5 },
        src: null,
        system: {},
        ownership: { default: -1 },
        flags: {},
        _stats: stats(),
        _key: `!journal.pages!${id}.${pid}`,
      };
    }
  );
  return {
    folder: null,
    name: entry.title,
    _id: id,
    pages,
    flags: {},
    sort: sort,
    ownership: { default: 0 },
    _stats: stats(),
    _key: `!journal!${id}`,
  };
}

// Item do tipo spell (magia).
export function spellDoc(spell, folderId, seedPrefix, sort) {
  // `seedNome` preserva o UUID quando só o RÓTULO muda. Foi preciso ao
  // consertar a caixa dos nomes — "Medidor De Radiação" virou "Medidor de
  // Radiação" —, e sem isto 45 itens teriam trocado de id, quebrando a
  // referência de quem já os tinha arrastado para uma ficha.
  const id = makeId(`spell:${seedPrefix}:${spell.seedNome ?? spell.nome}`);
  const traditions = { arcane: "null", divine: "null", necromancer: "null", illusionist: "null" };
  traditions[spell.school] = String(spell.circle);
  return {
    folder: folderId,
    name: spell.nome,
    type: "spell",
    _id: id,
    img: `${OD2I}/${spell.school}.svg`,
    system: {
      odo_id: slug(spell.nome),
      school: spell.school,
      circle: String(spell.circle),
      ...traditions,
      reverse: !!spell.reverse,
      range: spell.range || "",
      duration: spell.duration || "",
      jp: spell.jp || "nenhuma",
      description: spell.desc || "",
    },
    effects: [],
    flags: {},
    _stats: stats(),
    sort: sort,
    ownership: { default: 0 },
    _key: `!items!${id}`,
  };
}

// Campos comuns do equipamento (cost, peso, etc.).
function equipmentBase(it) {
  return {
    odo_id: slug(it.nome),
    // weapon/armor/misc: a ficha exibe num <textarea>. Ver htmlParaTexto().
    description: htmlParaTexto(it.desc),
    // Munição vem em conjunto (o Virote do SRD traz 20); o resto é unitário.
    quantity: it.quantity ?? 1,
    cost: it.cost || "",
    weight_in_load: it.weight_in_load ?? 0,
    weight_in_grams: it.weight_in_grams ?? 0,
    magic_item: !!it.magic_item,
    is_equipped: false,
  };
}

// Item do tipo weapon (arma).
export function weaponDoc(it, folderId, seedPrefix, sort) {
  const id = makeId(`weapon:${seedPrefix}:${it.nome}`);
  return {
    folder: folderId,
    name: it.nome,
    type: "weapon",
    _id: id,
    img: it.img || weaponIcon(it),
    system: {
      ...equipmentBase(it),
      // O sistema tem quatro tipos: melee, ranged, throwing e ammunition.
      // Uma arma sem alcance de tiro e COM alcance de arremesso é `throwing`,
      // não `ranged` — é o caso das granadas e do Detonador Térmico.
      //
      // Isso não é cosmético. A automação de combate do módulo Qualidade de
      // Vida ABORTA o ataque de qualquer arma `ranged` sem munição equipada
      // (`if (ammunition.required && !ammunition.item) return;`), e dispensa
      // munição para `throwing`. Tipadas como `ranged`, as granadas nem
      // rolavam.
      type: it.ammunition
        ? "ammunition"
        : it.melee === false || it.ranged
          ? (it.throw_range && !it.shoot_range ? "throwing" : "ranged")
          : "melee",
      damage_type: damageType(it.damage_type),
      damage: it.damage || "",
      bonus_damage: it.bonus_damage ?? 0,
      bonus_ba: it.bonus_ba ?? 0,
      bonus_ca: it.bonus_ca ?? 0,
      shoot_range: it.shoot_range ?? 0,
      throw_range: it.throw_range ?? 0,
      arrow: !!it.arrow,
      bolt: !!it.bolt,
      bolt_small: !!it.bolt_small,
      polearm: !!it.polearm,
      two_handed: !!it.two_handed,
      versatile: !!it.versatile,
    },
    effects: [],
    flags: {},
    _stats: stats(),
    sort: sort,
    ownership: { default: 0 },
    _key: `!items!${id}`,
  };
}

// Item do tipo armor (armadura).
// Item do tipo armor — ou shield.
//
// A ficha do OD2 tem uma CAIXA SEPARADA para escudo
// (templates/partials/tabs/character-tab-equipment.hbs), com card próprio. Um
// escudo tipado como `armor` cai na lista de armaduras, no box errado, e as
// classes que dizem "pode usar escudo" / "sem escudo" ficam sem como conferir.
// O schema dos dois tipos é idêntico (ambos têm bonus_ca), então só o `type`
// muda.
//
// O SEED DO _id continua "armor:": trocar para "shield:" renomearia o UUID dos
// escudos e quebraria quem já os tem na ficha. O seed é interno; o tipo é o
// que a ficha lê.
export function armorDoc(it, folderId, seedPrefix, sort) {
  const id = makeId(`armor:${seedPrefix}:${it.nome}`);
  const ehEscudo = /^escudo$/i.test((it.tipo_armadura ?? "").trim());
  return {
    folder: folderId,
    name: it.nome,
    type: ehEscudo ? "shield" : "armor",
    _id: id,
    img: it.img || `${OD2I}/armor.svg`,
    system: { ...equipmentBase(it), bonus_ca: it.bonus_ca ?? 0 },
    effects: [],
    flags: {},
    _stats: stats(),
    sort: sort,
    ownership: { default: 0 },
    _key: `!items!${id}`,
  };
}

// Item do tipo misc (equipamento geral / consumível).
export function miscDoc(it, folderId, seedPrefix, sort) {
  // `seedNome` preserva o UUID quando só o RÓTULO muda. Foi preciso ao
  // consertar a caixa dos nomes — "Medidor De Radiação" virou "Medidor de
  // Radiação" —, e sem isto 45 itens teriam trocado de id, quebrando a
  // referência de quem já os tinha arrastado para uma ficha.
  const id = makeId(`misc:${seedPrefix}:${it.seedNome ?? it.nome}`);
  return {
    folder: folderId,
    name: it.nome,
    type: "misc",
    _id: id,
    img: it.img || iconeSemantico(it.nome, `${OD2I}/misc.svg`),
    system: equipmentBase(it),
    effects: [],
    flags: {},
    _stats: stats(),
    sort: sort,
    ownership: { default: 0 },
    _key: `!items!${id}`,
  };
}

// RollTable (tabela de rolagem). `resultados` é um array de
// { range: [min, max], text, img? }.
export function rollTableDoc(table, sort) {
  const id = makeId(`table:${table.nome}`);
  const results = table.resultados.map((r, i) => {
    const rid = makeId(`table-result:${table.nome}:${i}`);
    // Schema do Foundry 13 — conferido contra olddragon2e.rollable-tables:
    // o texto vive em `description` (não `text`), `type` é a string "text"
    // (não o 0 antigo) e o ponteiro para documento é `documentUuid`.
    return {
      type: "text",
      weight: 1,
      range: r.range,
      drawn: false,
      _id: rid,
      name: "",
      description: r.text,
      documentUuid: null,
      flags: {},
      img: r.img || `${OD2I}/d6.svg`,
      _key: `!tables.results!${id}.${rid}`,
    };
  });
  return {
    folder: null,
    name: table.nome,
    _id: id,
    img: table.img || `${OD2I}/d6.svg`,
    description: table.desc || "",
    results,
    replacement: true,
    displayRoll: true,
    flags: {},
    _stats: stats(),
    formula: table.formula,
    sort: sort,
    ownership: { default: 0 },
    _key: `!tables!${id}`,
  };
}

// ID do módulo — precisa bater com o "id" do module.json.
export const MODULE_ID = "spacedragon";

// Caminho de UUID de um item dentro de um pack deste módulo.
export function itemUuid(packName, itemId) {
  return `Compendium.${MODULE_ID}.${packName}.Item.${itemId}`;
}

// Escreve os documentos de um pack como arquivos JSON-fonte (um por documento).
// ── Notas da casa ───────────────────────────────────────────────────────────
// A prosa que explica POR QUE um número saiu diferente do livro ("Correção da
// casa", "de onde veio a ideia", o de-para com o Space Dragon) é documentação
// de conversão: serve a quem mantém o repositório, não a quem está jogando.
// Ela vive marcada como <p class='nota-casa'> nos arquivos de tools/data/ e é
// removida aqui, no único ponto por onde todo doc passa antes de virar pack.
//
// Mesma convenção do compêndio em Markdown do cofre, cujo build_docx.py corta
// os blocos "Correção da casa" antes de distribuir.
//
// Para gerar o módulo COM as notas:  NOTAS_CASA=1 npm run build
const MANTER_NOTAS = process.env.NOTAS_CASA === "1";
const RE_NOTA = /(?:<hr\s*\/?>)?\s*<p class='nota-casa'>[\s\S]*?<\/p>/g;

function limpaNotas(valor) {
  if (typeof valor === "string") {
    return valor.includes("class='nota-casa'") ? valor.replace(RE_NOTA, "") : valor;
  }
  if (Array.isArray(valor)) return valor.map(limpaNotas);
  if (valor && typeof valor === "object") {
    const o = {};
    for (const [k, v] of Object.entries(valor)) o[k] = limpaNotas(v);
    return o;
  }
  return valor;
}

export function writeSource(srcDir, docs) {
  fs.rmSync(srcDir, { recursive: true, force: true });
  fs.mkdirSync(srcDir, { recursive: true });
  for (const bruto of docs) {
    const doc = MANTER_NOTAS ? bruto : limpaNotas(bruto);
    const kind = doc._key.startsWith("!folders!") ? "folder" : doc.type || "doc";
    const fname = `${slug(doc.name)}__${kind}__${doc._id}.json`;
    fs.writeFileSync(
      path.join(srcDir, fname),
      JSON.stringify(doc, null, 2) + "\n",
      "utf8"
    );
  }
  return docs.length;
}

// Item do tipo Macro. O compêndio de macros existe para dar ao jogador um
// botão arrastável — a LÓGICA fica no script do módulo (game.stardragon.*),
// não aqui. Assim atualizar o módulo atualiza a regra, e uma macro já
// arrastada para a barra continua valendo.
export function macroDoc(macro, folderId, sort) {
  const id = makeId(`macro:${macro.nome}`);
  return {
    folder: folderId ?? null,
    name: macro.nome,
    type: "script",
    _id: id,
    img: macro.img || "icons/svg/dice-target.svg",
    scope: "global",
    command: macro.comando,
    author: "swspacedragonbld",
    ownership: { default: 2 }, // Observador: o jogador precisa poder executar
    flags: {},
    _stats: stats(),
    sort: sort ?? 0,
    _key: `!macros!${id}`,
  };
}

// Pinta as pastas e faz o filho herdar a cor do pai.
//
// Roda DEPOIS de aninhaPastas(), porque só então a hierarquia existe: até ali
// "Guardião (Ataru)" é uma pasta de raiz com nome comprido, não filha de
// "Sensível à Força". Herdar é o que faz a cor marcar família em vez de virar
// enfeite — o Foundry não propaga cor de pasta sozinho.
//
// Pasta sem cor na paleta e sem pai colorido fica `null`, que é o padrão do
// Foundry. Nada quebra por falta de entrada.
export function pintaPastas(docs, paleta) {
  const pastas = docs.filter((d) => d._key?.startsWith("!folders!"));
  const porId = new Map(pastas.map((f) => [f._id, f]));

  for (const p of pastas) {
    // Sobe até achar alguém com cor própria na paleta.
    let atual = p;
    let visitados = 0;
    while (atual && visitados++ < 20) {
      const cor = paleta[atual.name];
      if (cor) {
        p.color = cor;
        break;
      }
      atual = atual.folder ? porId.get(atual.folder) : null;
    }
  }
  return pastas.filter((p) => p.color).length;
}

// ── Ator do tipo monster ────────────────────────────────────────────────────
//
// ── POR QUE UM CONSTRUTOR PRÓPRIO, E NÃO O DO MÓDULO STAR WARS ──────────────
//
// O do Star Wars parte de um bloco NUMÉRICO: separa "14+5" em dado e bônus,
// deriva PV do DV, monta itens de ataque. O bloco do Space Dragon é TEXTO com
// parênteses explicativos — "CP 14 (COURAÇA GROSSA +1)", "DV 3+1 (13/25)" —, e
// o esquema do OD2 guarda esses campos como string. Jogar o texto inteiro no
// campo preserva a explicação que o livro dá; parsear jogaria fora.
//
// O único número que precisa sair do texto são os PV, para a barra do token
// funcionar. O livro já os dá entre parênteses: "(13/25)" é média e máximo.

/** "humanoide robótico médio rebelde" → o conceito que o OD2 desenha. */
const CONCEITO_SD = [
  [/robótic|autômato|robô/i, "Constructo"],
  [/amórfic|gosma|geleia|bolha/i, "Gosma"],
  [/vegetal|planta/i, "Planta"],
  [/inseto|aracníd|crustáceo|anelídeo/i, "Inseto"],
  [/dragão|réptil/i, "Dragão"],
  [/humanoide/i, "Humanoide"],
];

const TAMANHO_SD = {
  minúsculo: "miudo", miúdo: "miudo", pequeno: "pequeno", pequena: "pequeno",
  médio: "medio", média: "medio", grande: "grande",
  imenso: "imenso", gigante: "imenso", colossal: "colossal",
};

// Leal, neutro e rebelde entram nos três campos do OD2. A correspondência é
// POSICIONAL, não conceitual: Afiliação e alinhamento são eixos diferentes, e o
// journal de Subatributos explica isso. O lang do módulo troca os rótulos.
const AFILIACAO_SD = { leal: "ordeiro", neutro: "neutro", rebelde: "caotico" };

const semAcento = (s) =>
  String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function conceitoDe(tipo) {
  for (const [rx, c] of CONCEITO_SD) if (rx.test(tipo)) return c;
  return "Besta";
}

function tamanhoDe(tipo) {
  for (const [palavra, valor] of Object.entries(TAMANHO_SD)) {
    // `\\b` e não `\b`: num template literal, `\b` é o caractere de backspace,
    // e o RegExp recebia um controle invisível no lugar da borda de palavra.
    // Todo monstro saía "médio" porque nada casava.
    if (new RegExp(`\\b${semAcento(palavra)}\\b`).test(semAcento(tipo))) return valor;
  }
  return "medio";
}

function afiliacaoDe(tipo) {
  for (const [palavra, valor] of Object.entries(AFILIACAO_SD)) {
    if (new RegExp(`\\b${palavra}\\b`).test(semAcento(tipo))) return valor;
  }
  return "neutro";
}

/**
 * Os pontos de vida, do que o livro escreve na linha de DV.
 *
 *   "3+1 (13/25)"  → 13 de 25. Os parênteses são média e máximo.
 *   "1D8+1 (5)"    → 5, quando o livro dá um número só.
 *   "1 PV"         → 1. A medusa elétrica não tem dado de vida nenhum:
 *                    ela tem literalmente um ponto de vida.
 */
function pvDoDV(dv) {
  const t = String(dv ?? "");
  const faixa = t.match(/\((\d+)\s*\/\s*(\d+)\)/);
  if (faixa) return { value: Number(faixa[1]), max: Number(faixa[2]) };
  const so = t.match(/\((\d+)\)/);
  if (so) return { value: Number(so[1]), max: Number(so[1]) };
  const literal = t.match(/^(\d+)\s*PV$/i);
  if (literal) return { value: Number(literal[1]), max: Number(literal[1]) };
  return null;
}

/** "10M ESCALANDO 6M" → { mv: "10", mvo: "6" }. */
function movimentoDe(mov) {
  const t = semAcento(mov);
  const out = {};
  const base = t.match(/^(\d+)\s*m/);
  if (base) out.mv = base[1];
  const nadando = t.match(/nadando\s*(\d+)/);
  if (nadando) out.mvn = nadando[1];
  const voando = t.match(/voando\s*(\d+)/);
  if (voando) out.mvv = voando[1];
  const outro = t.match(/(?:escalando|escavando|deslizando)\s*(\d+)/);
  if (outro) out.mvo = outro[1];
  return out;
}

const QUADRADOS = { miudo: 1, pequeno: 1, medio: 1, grande: 2, imenso: 3, colossal: 4 };

export function monsterDoc(c, folderId, seedPrefix, sort) {
  // `seedNome` preserva o UUID quando só o RÓTULO muda. Foi preciso ao
  // consertar a caixa dos nomes — "Medidor De Radiação" virou "Medidor de
  // Radiação" —, e sem isto 45 itens teriam trocado de id, quebrando a
  // referência de quem já os tinha arrastado para uma ficha.
  const id = makeId(`monster:${seedPrefix}:${c.seedNome ?? c.nome}`);
  const conceito = conceitoDe(c.tipo);
  const tamanho = tamanhoDe(c.tipo);
  const img = `systems/olddragon2e/assets/concepts/${
    { Humanoide: "humanoide", Constructo: "constructo", Gosma: "gosma", Planta: "planta",
      Inseto: "inseto", "Dragão": "dragao", Besta: "besta" }[conceito]
  }-${tamanho}.webp`;

  // Os seis atributos, RM e RD não existem em monstro de OD2. Entram no topo da
  // descrição, que é onde a mesa vai procurá-los.
  const at = c.atributos ?? {};
  const linhaAt = Object.entries(at)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([k, v]) => `<strong>${k}</strong> ${v}`)
    .join(" · ");

  const extras = [];
  if (c.rm) extras.push(`<strong>Resistência mental</strong> ${c.rm}`);
  if (c.rd) extras.push(`<strong>Redução de dano</strong> ${c.rd}`);

  const desc =
    (c.cientifico ? `<p><em>${c.cientifico}</em></p>` : "") +
    (linhaAt ? `<p>${linhaAt}</p>` : "") +
    (extras.length ? `<p>${extras.join(" · ")}</p>` : "") +
    (c.texto ? `<p>${c.texto}</p>` : "");

  const system = {
    odo_id: slug(c.nome),
    concept: conceito,
    size: tamanho,
    alignment: afiliacaoDe(c.tipo),
    habitat: c.habitat ?? "",
    description: desc,
    described_attacks: c.ataques ?? "",
    encounters: c.encontros ?? "",
    xp: c.premios ?? "",
    dv: c.dv ?? "",
    ca: c.cp ?? "",
    jp: c.jp ?? "",
    mo: c.moral ?? "",
    ...movimentoDe(c.movimento),
  };
  const pv = pvDoDV(c.dv);
  if (pv) system.hp = pv;

  const lado = QUADRADOS[tamanho] ?? 1;
  return {
    name: c.nome,
    type: "monster",
    _id: id,
    img,
    system,
    prototypeToken: {
      name: c.nome,
      displayName: 20,
      actorLink: false,
      appendNumber: true,
      texture: { src: img, scaleX: 1, scaleY: 1 },
      width: lado,
      height: lado,
      disposition: -1,
      displayBars: 40,
      bar1: { attribute: "hp" },
    },
    items: [],
    effects: [],
    folder: folderId,
    flags: {},
    _stats: stats(),
    sort,
    ownership: { default: 0 },
    _key: `!actors!${id}`,
  };
}
