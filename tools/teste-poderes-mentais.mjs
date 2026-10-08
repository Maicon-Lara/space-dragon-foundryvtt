// Teste do que a aba de Poderes esconde do sistema.
//
// ── POR QUE ISTO É TESTADO ──────────────────────────────────────────────────
//
// O Old Dragon 2 traz na ficha três coisas que o Space Dragon não tem: espaços
// de magia, usos por dia e a ESCOLA (arcana, divina, necromante, ilusionista).
// No Space Dragon o poder é mental — quem o realiza vem da classe e da
// Grandeza, e não há escola a escolher.
//
// Um "A" de Arcana na ficha de um cosmonauta é categoria de outro jogo, e quem
// lê fica procurando onde escolhê-la.
//
// ── A ASSERÇÃO QUE MAIS IMPORTA ─────────────────────────────────────────────
//
// Que o seletor case com o HTML QUE O SISTEMA ESCREVE. A tag é
// `<div class="spell-school-tag arcane-tag">`, e esconder só `.arcane-tag`
// deixaria passar divina e as outras duas; esconder só `.spell-school-tag`
// dependeria de o sistema manter esse nome. Os cinco juntos cobrem as duas
// formas.
//
// Uso: node tools/teste-poderes-mentais.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(fileURLToPath(import.meta.url), "../..");
const css = fs
  .readFileSync(path.join(RAIZ, "spacedragon-module", "styles", "spacedragon.css"), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "");

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

/* ── A ESCOLA DE MAGIA NÃO APARECE ─────────────────────────────────────────── */
//
// ── POR QUE O ESCOPO É A FICHA, E NÃO A ABA ─────────────────────────────────
//
// A primeira versão escopava em `.sd-poderes-mentais`, que só é posto na aba de
// quem é da classe MENTÁLICO. O Sensível à Força do módulo de Star Wars não é —
// e ele é justamente quem tem poderes em quantidade. A marca de escola
// continuava aparecendo na ficha dele, ao lado das correntes da Força (Luz,
// Sombra, Universal), que são a categoria dele.
//
// Duas categorias de jogos diferentes na mesma linha, e uma delas sem sentido
// nenhum ali.
{
  // as quatro tradições do sistema, mais o nome genérico da tag
  const ALVOS = [
    ["spell-school-tag", "o nome da tag, que cobre qualquer escola nova"],
    ["arcane-tag", "Arcana"],
    ["divine-tag", "Divina"],
    ["necromancer-tag", "Necromante"],
    ["illusionist-tag", "Ilusionista"],
  ];
  for (const [classe, oQueE] of ALVOS) {
    confere(css.includes(`.spacedragon-ficha .${classe}`),
      `a ficha não esconde .${classe} (${oQueE}) — no Space Dragon não há escola de magia, ` +
      `e a marca é categoria de outro jogo`);
  }

  // e escondem de verdade
  const i = css.indexOf(".spacedragon-ficha .spell-school-tag");
  const bloco = css.slice(i, css.indexOf("}", i));
  confere(/display:\s*none/.test(bloco), "a regra existe mas não esconde nada");
  confere(/!important/.test(bloco),
    "sem !important a regra perde para o CSS do sistema, que desenha a tag");
}

/* ── O ESCOPO NÃO PODE SER A ABA MENTAL ────────────────────────────────────── */
//
// `sd-poderes-mentais` é posto por mental.js, e só em quem é da classe
// Mentálico — a condição está lá: `if (classeBase(ator) !== "Mentálico") return;`.
//
// Escopar a escola de magia nessa classe deixa de fora o Sensível à Força do
// módulo de Star Wars, que usa a mesma ficha e tem mais poderes que ninguém.
// Foi o erro da primeira versão, e a mesa o encontrou em minutos.
{
  for (const linha of css.split("\n")) {
    if (!/school-tag|arcane-tag|divine-tag|necromancer-tag|illusionist-tag/.test(linha)) continue;
    if (!linha.trim().startsWith(".")) continue;
    confere(!linha.includes("sd-poderes-mentais"),
      `"${linha.trim()}" escopa a escola na aba MENTAL — ela só existe para a classe ` +
      `Mentálico, e o Sensível à Força da mesma ficha continuaria vendo a marca`);
  }
}

/* ── O ESCOPO: SÓ NA FICHA DO SPACE DRAGON ─────────────────────────────────── */
//
// Numa mesa mista, o personagem de Old Dragon 2 ao lado PRECISA da escola — é
// ela que diz quem pode lançar o quê. Esconder sem escopo apagaria a regra da
// ficha dele.
{
  for (const linha of css.split("\n")) {
    if (!/school-tag|arcane-tag|divine-tag/.test(linha)) continue;
    if (!linha.trim().startsWith(".")) continue;
    confere(linha.includes(".spacedragon-ficha"),
      `"${linha.trim()}" esconde a escola sem escopo — o personagem de Old Dragon 2 ` +
      `da mesma mesa perderia a marca, e lá ela é regra`);
  }
}

/* ── E O QUE JÁ SE ESCONDIA CONTINUA ───────────────────────────────────────── */
//
// Espaços e usos por dia saíram pelo mesmo motivo, e numa regra vizinha: um
// `display: none` perdido leva junto o alinhamento da linha flex.
{
  for (const classe of ["spell-slots", "spell-daily-uses"]) {
    confere(css.includes(`.sd-poderes-mentais .${classe}`),
      `a ficha deixou de esconder .${classe} — o Space Dragon não tem espaços nem usos/dia`);
  }
}

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log(
  "  ✔ poderes mentais: a escola de magia escondida nas quatro tradições e no nome da tag, " +
    "com !important e SÓ na ficha Space Dragon (o personagem de OD2 ao lado continua vendo a " +
    "dele), e os espaços e usos por dia seguem fora"
);
