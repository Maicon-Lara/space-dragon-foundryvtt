/**
 * Converte personagens do módulo Star Dragon (Star Wars) para Space Dragon.
 *
 *     node tools/converter.mjs <pasta-de-entrada> <pasta-de-saída>
 *
 * ── O QUE JÁ ESTAVA CERTO, E NÃO PRECISOU MUDAR ─────────────────────────────
 *
 * Os dois módulos rodam sobre o mesmo sistema, então os seis campos de atributo
 * são os mesmos. E a convenção deste módulo — Ciência no campo Inteligência,
 * Intelecto no campo Sabedoria, Comunicação no campo Carisma — foi escolhida
 * justamente pelo que cada atributo FAZ, e casa com o Star Wars:
 *
 *   Inteligência do Star Wars → CIÊNCIA       saber aplicado
 *   Sabedoria    do Star Wars → INTELECTO     vontade e percepção
 *   Carisma      do Star Wars → COMUNICAÇÃO   trato social
 *
 * Os números passam no lugar. Vale lembrar que a ESCALA é outra: 16 dá +2 na
 * tabela do Old Dragon 2 e +3 na do Space Dragon, porque a faixa neutra e os
 * degraus são diferentes. O personagem fica um pouco mais capaz — o que é
 * esperado, já que a escala do Space Dragon vai até 29.
 *
 * ── O QUE PRECISOU DE DECISÃO ───────────────────────────────────────────────
 *
 * ESPÉCIE. O Space Dragon tem três, e o Star Wars tem dezenas. Droide vira
 * Androide sem discussão. Mutante vira Mutante. O resto vira Humano, que é o
 * que o livro chama de "de longe a espécie inteligente mais comum da galáxia" —
 * e não Mutante, porque o Mutante ABRE MÃO do +2 num atributo, do −2 em outro e
 * do incremento a cada 4 níveis, e trocar isso por sotaque de cenário seria
 * mexer na mecânica do personagem sem ele pedir.
 *
 * CLASSE. A família manda, não a especialização:
 *
 *   Sensível à Força → Mentálico    ambos manifestam poder pela mente
 *   Técnico          → Cientista    ambos constroem e consertam
 *   Operativo        → Gatuno       ambos são furtividade e talento
 *   Veterano         → Cosmonauta   ambos são combate e pilotagem
 *
 * ⚠️ NENHUM DELES GANHA ESPECIALIZAÇÃO, e não é esquecimento: no Space Dragon
 * ela abre no 5º NÍVEL, e todos estes estão no 3º ou no 4º. Cada um recebe a
 * classe-base, e o relatório diz qual a Afiliação dele vai abrir quando chegar
 * lá.
 *
 * ── O QUE FICA COMO ESTAVA ──────────────────────────────────────────────────
 *
 * Pontos de vida, experiência, nível, nome, retrato e token. O dado de vida das
 * classes é outro — o Mentálico do Space Dragon é d4 e o Sensível à Força não
 * era —, mas os PV foram ganhos jogando, e zerá-los seria punir o jogador por
 * uma decisão de conversão.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const PACKS = path.resolve(AQUI, "..", "packs-src");

// ── As tabelas de conversão ────────────────────────────────────────────────

const ESPECIE = {
  "Droide": "Androide",
  "Mutante": "Mutante",
  // Tudo o que não é droide nem mutante vira Humano. Ver o cabeçalho.
  "*": "Humano",
};

/** A família da classe do Star Wars decide a classe do Space Dragon. */
const CLASSE = [
  [/Sensível à Força|Guardião|Consular|Sentinela|Vidente/i, "Mentálico"],
  [/Técnico|Médico de Campo|Engenheiro|Slicer/i, "Cientista"],
  [/Operativo|Espião|Contrabandista|Assassino|Sabotador/i, "Gatuno"],
  [/Veterano|Mercenário|Caçador de Recompensas|Emissário/i, "Cosmonauta"],
];

/** Qual especialização a Afiliação abre, para o relatório. */
const ESPECIALIZACAO = {
  Cientista: { ordeiro: "Pesquisador", neutro: "Inventor", caotico: "Niilógico" },
  Cosmonauta: { ordeiro: "Emissário", neutro: "Mercenário", caotico: "Caçador de Recompensas" },
  Gatuno: { ordeiro: "Espião", neutro: "Sabotador", caotico: "Pirata Espacial" },
  "Mentálico": { ordeiro: "Psiquista", neutro: "Radiestésico", caotico: "Hipercientista" },
};

const AFILIACAO = { ordeiro: "leal", neutro: "neutro", caotico: "rebelde" };

/**
 * Equipamento, por nome.
 *
 * A maioria casa um a um, e não por acaso: os dois livros bebem do mesmo
 * vocabulário de ficção científica pulp. Onde o dano diverge, vale o do Space
 * Dragon — é o item dele que está entrando na ficha.
 */
const EQUIPAMENTO = {
  // Armas
  "Bastão Eletrificado": "Bastão de choque",
  "Cassetete de Choque": "Bastão de choque",
  "Vibro-Adaga": "Faca de sobrevivência",
  "Vibro-Lâmina Curta": "Faca de sobrevivência",
  "Blaster Leve": "Pistola laser",
  // Vestes. O escudo pessoal vira o escudo de energia, que no Space Dragon é
  // exatamente isto: um cinto projetor sempre ativo, sem ocupar mão.
  "Gerador de Escudo Pessoal": "Escudo de energia",
  "Armadura de Combate Leve": "Vestes médias",
  "Armadura de Assalto": "Trajes de combate",
  // Aparatos tecnológicos que existem nos dois livros com outro nome.
  "Datapad": "Cilindro de Dados",
  "Comunicador (Comlink)": "Bracelete Radiocomunicador",
  "Bloqueador de Sinal (jammer)": "Bloqueador de Ondas de Rádio",
  "Cortador de Fusão": "Cortador Laser",
  "Visor Térmico": "Óculos de Visão Térmica",
  "Visor Noturno": "Óculos de Visão Noturna",
  "Medidor de Radiação": "Medidor de Radiação",
  "Traje Antirradiação": "Trajes Antirradiação",
  "Disruptor Positrônico": "Disruptor Positrônico",
};

/**
 * As mutações do Mutante, que são ESCOLHA e ficam guardadas fora do item.
 *
 * ── POR QUE ISTO PRECISA DE CONVERSÃO PRÓPRIA ───────────────────────────────
 *
 * A escolha do jogador vive em `system.variable_construction_selections`,
 * indexada pelo ID DO ITEM de habilidade. Trocar o item de Aprimoramento pelo
 * do Space Dragon troca o id, e a escolha passa a apontar para um item que não
 * existe mais: o mutante chega do outro lado sem nenhuma das duas mutações, e
 * sem erro nenhum na tela.
 *
 * A CHAVE também muda. Os dois módulos numeram os pares igual — a T2-1 é a
 * mesma —, mas as quatro mutações de atributo carregam o nome do atributo, e
 * aí os cenários divergem: onde o Star Wars diz "carisma", o Space Dragon diz
 * "comunicacao". É a mesma troca de nomes que a ficha inteira faz.
 */
const ATRIBUTO_NA_CHAVE = {
  carisma: "comunicacao-3",
  sabedoria: "intelecto-3",
  inteligencia: "ciencia-3",
  forca: "forca-3",
  destreza: "destreza-3",
  constituicao: "constituicao-3",
};

/** "08-carisma" → "08-comunicacao-3". O que não é atributo passa igual. */
function chaveDeMutacao(chave) {
  const m = String(chave ?? "").match(/^(\d{2})-(.+)$/);
  if (!m) return chave;
  const novo = ATRIBUTO_NA_CHAVE[m[2]];
  return novo ? `${m[1]}-${novo}` : chave;
}

/** Sem par no Space Dragon: ficam como estão, porque são genéricos. */
const MANTER = new Set(["Kit Médico (Medpac)", "Bastão Luminoso"]);

// ── O índice do compêndio ──────────────────────────────────────────────────

function indexa() {
  const porNome = new Map();
  for (const pack of fs.readdirSync(PACKS)) {
    const dir = path.join(PACKS, pack);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const arq of fs.readdirSync(dir)) {
      if (!arq.endsWith(".json")) continue;
      const doc = JSON.parse(fs.readFileSync(path.join(dir, arq), "utf8"));
      if (!doc.name || doc._key?.startsWith("!folders!")) continue;
      porNome.set(`${doc.type}:${doc.name}`, doc);
    }
  }
  return porNome;
}

const acha = (idx, tipo, nome) => idx.get(`${tipo}:${nome}`) ?? null;

/** Um documento do compêndio vira item embutido no ator: sem `folder`, sem `_key`. */
function embute(doc) {
  const { folder, _key, sort, ownership, ...resto } = doc;
  return { ...resto, sort: sort ?? 0 };
}

/** As habilidades que um item de raça ou classe referencia, pelos UUIDs. */
function habilidadesDe(idx, doc, campo) {
  const uuids = doc.system?.[campo] ?? [];
  const porId = new Map();
  for (const d of idx.values()) porId.set(d._id, d);
  return uuids.map((u) => porId.get(u.split(".").pop())).filter(Boolean).map(embute);
}

// ── A conversão ────────────────────────────────────────────────────────────

function converte(ator, idx, relatorio) {
  const nome = ator.name;
  const sis = ator.system ?? {};
  const alinhamento = sis.details?.alignment ?? "neutro";
  const nivel = Number(sis.level) || 1;

  const especieOrig = ator.items.find((i) => i.type === "race")?.name ?? "(sem espécie)";
  const classeOrig = ator.items.find((i) => i.type === "class")?.name ?? "(sem classe)";

  const especieNova = ESPECIE[especieOrig] ?? ESPECIE["*"];
  const classeNova = CLASSE.find(([rx]) => rx.test(classeOrig))?.[1] ?? "Cosmonauta";

  const raceDoc = acha(idx, "race", especieNova);
  const classDoc = acha(idx, "class", classeNova);
  if (!raceDoc || !classDoc) throw new Error(`${nome}: não achei ${especieNova} ou ${classeNova} no compêndio`);

  const itens = [
    embute(raceDoc),
    ...habilidadesDe(idx, raceDoc, "race_abilities"),
    embute(classDoc),
    ...habilidadesDe(idx, classDoc, "class_abilities"),
  ];

  // Equipamento: o que tem par vira o item do Space Dragon, o que não tem fica.
  const trocados = [];
  const mantidos = [];
  const perdidos = [];
  for (const it of ator.items) {
    if (!["weapon", "armor", "shield", "misc"].includes(it.type)) continue;
    const alvo = EQUIPAMENTO[it.name];
    if (!alvo) {
      if (MANTER.has(it.name)) {
        itens.push(it);
        mantidos.push(it.name);
      } else {
        perdidos.push(it.name);
      }
      continue;
    }
    const novo =
      acha(idx, "weapon", alvo) ?? acha(idx, "armor", alvo) ??
      acha(idx, "shield", alvo) ?? acha(idx, "misc", alvo);
    if (!novo) {
      perdidos.push(`${it.name} → ${alvo} (não achei no compêndio)`);
      continue;
    }
    itens.push({ ...embute(novo), system: { ...novo.system, is_equipped: it.system?.is_equipped ?? false } });
    trocados.push(`${it.name} → ${novo.name}`);
  }

  // As escolhas de mutação seguem o item, pelo NOME da habilidade.
  const escolhasVelhas = sis.variable_construction_selections ?? {};
  const escolhas = {};
  const mutacoes = [];
  for (const [idVelho, lista] of Object.entries(escolhasVelhas)) {
    const velho = ator.items.find((i) => i._id === idVelho);
    const novo = velho && itens.find((i) => i.type === "race_ability" && i.name === velho.name);
    if (!novo) continue;
    escolhas[novo._id] = lista.map((e) => ({ ...e, key: chaveDeMutacao(e.key) }));
    for (const e of lista) mutacoes.push(`${velho.name}: ${e.key} → ${chaveDeMutacao(e.key)}`);
  }

  relatorio.push({
    nome, nivel, mutacoes,
    especie: `${especieOrig} → ${especieNova}`,
    classe: `${classeOrig} → ${classeNova}`,
    afiliacao: AFILIACAO[alinhamento] ?? alinhamento,
    abrira: ESPECIALIZACAO[classeNova]?.[alinhamento] ?? "?",
    trocados, mantidos, perdidos,
  });

  return {
    ...ator,
    items: itens,
    system: {
      ...sis,
      // A Afiliação ocupa o campo de alinhamento. São eixos diferentes, e o
      // journal de Subatributos explica — mas a correspondência é a mesma que o
      // bestiário já usa.
      details: { ...(sis.details ?? {}), alignment: alinhamento },
      variable_construction_selections: escolhas,
    },
    flags: {
      ...(ator.flags ?? {}),
      // A ficha do módulo NÃO é padrão — num mundo misto isso trocaria a ficha
      // de todo mundo. Quem foi convertido já vem com ela marcada, e chega do
      // outro lado com os rótulos, a escala e os painéis do Space Dragon.
      core: { ...(ator.flags?.core ?? {}), sheetClass: "spacedragon.SDCharacterSheet" },
      spacedragon: { convertidoDe: `${especieOrig} / ${classeOrig}` },
    },
  };
}

// ── Execução ───────────────────────────────────────────────────────────────

const [entrada, saida] = process.argv.slice(2);
if (!entrada || !saida) {
  console.error("uso: node tools/converter.mjs <pasta-de-entrada> <pasta-de-saída>");
  process.exit(1);
}

const idx = indexa();
fs.mkdirSync(saida, { recursive: true });
const relatorio = [];

for (const arq of fs.readdirSync(entrada).filter((f) => f.endsWith(".json"))) {
  const ator = JSON.parse(fs.readFileSync(path.join(entrada, arq), "utf8"));
  if (ator.type !== "character") continue;
  const novo = converte(ator, idx, relatorio);
  fs.writeFileSync(path.join(saida, arq), JSON.stringify(novo, null, 2) + "\n", "utf8");
}

for (const r of relatorio) {
  console.log(`\n### ${r.nome} — ${r.nivel}º nível`);
  console.log(`  espécie : ${r.especie}`);
  console.log(`  classe  : ${r.classe}`);
  console.log(`  afiliação ${r.afiliacao} — no 5º nível abre ${r.abrira}`);
  if (r.trocados.length) console.log(`  equipamento:\n     ${r.trocados.join("\n     ")}`);
  if (r.mutacoes.length) console.log(`  mutações: ${r.mutacoes.join(" · ")}`);
  if (r.mantidos.length) console.log(`  mantidos como estavam: ${r.mantidos.join(", ")}`);
  if (r.perdidos.length) console.log(`  ⚠️ sem par no Space Dragon: ${r.perdidos.join(", ")}`);
}
console.log(`\n${relatorio.length} personagens convertidos em ${saida}`);
