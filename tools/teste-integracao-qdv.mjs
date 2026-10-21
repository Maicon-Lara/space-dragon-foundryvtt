/**
 * A convivência com o "Old Dragon 2: Qualidade de Vida" (module/integracao-qdv.js
 * e bonusExterno em jp.js).
 *
 * ── O QUE FOI MEDIDO NO CÓDIGO DELE (v0.10.110) ─────────────────────────────
 *
 *   · o gerenciador de efeitos troca jpd_total/jpc_total/jps_total no
 *     protótipo (defineProperty, sem libWrapper) e marca com
 *     `__od2QdvEffect_<getter>`;
 *   · a agonização é um ChatMessage com flags[QDV].agonizeActorUuid;
 *   · os botões de tesouro na ficha de monstro têm a classe
 *     od2qdv-monster-treasure-action;
 *   · o XP da criatura é lido com /-?\d+/ — "7.250 XP" dava 7.
 *
 *     node tools/teste-integracao-qdv.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bonusExterno } from "../spacedragon-module/module/jp.js";
import { uuidDaAgonizacao, QDV } from "../spacedragon-module/module/integracao-qdv.js";
import { xpSemMilhar } from "./lib.mjs";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

/* ── O efeito de JP que vem de baixo ───────────────────────────────────── */
{
  const s = { jp: 15, jpd_race_bonus: 0, mod_destreza: 1 };
  // o sistema daria 15 + 0 + 1 = 16; com "+2 JPD" do Qualidade de Vida, 18
  confere(bonusExterno(s, "jpd", 18) === 2, `o +2 do efeito saiu ${bonusExterno(s, "jpd", 18)}`);
  confere(bonusExterno(s, "jpd", 16) === 0, "sem efeito, o bônus externo tem de ser 0");
  confere(bonusExterno(s, "jpd", 13) === -3, "um efeito NEGATIVO (−3) também tem de passar");
  confere(bonusExterno(s, "jpd", NaN) === 0, "total inválido não pode virar NaN na JP");
  // e a JP do Space Dragon desce com o bônus: 15 − (1 + 2) = 12 no d20
  const jpSD = s.jp - s.mod_destreza - bonusExterno(s, "jpd", 18);
  confere(jpSD === 12, `a JP mostrada com +2 de efeito devia ser 12, deu ${jpSD}`);
}

/* ── A ordem dos envelopes ─────────────────────────────────────────────── */
{
  const jp = fs.readFileSync(path.join(RAIZ, "spacedragon-module", "module", "jp.js"), "utf8");
  confere(/__od2QdvEffect_jpd_total/.test(jp) && /setTimeout\(\(\) => aplicarJP\(\{ adiado: true \}\)/.test(jp),
    "a JP não espera o Qualidade de Vida envolver primeiro — o efeito dele cairia na escala errada");
  confere(/bonusExterno\(this, qual, deBaixo\)/.test(jp), "o envelope de JP voltou a descartar o que veio de baixo");
}

/* ── A agonização reconhecida ──────────────────────────────────────────── */
confere(uuidDaAgonizacao({ flags: { [QDV]: { agonizeActorUuid: "Actor.abc" } } }) === "Actor.abc",
  "o pedido de agonização do Qualidade de Vida não foi reconhecido");
confere(uuidDaAgonizacao({ flags: {} }) === null, "mensagem comum confundida com agonização");

/* ── Os botões de tesouro do OD2 somem só na Ficha de Ameaça ───────────── */
{
  const css = fs.readFileSync(path.join(RAIZ, "spacedragon-module", "styles", "spacedragon.css"), "utf8");
  confere(/\.spacedragon-ameaca \.od2qdv-monster-treasure-action\s*\{\s*display:\s*none/.test(css),
    "os botões de tesouro do Qualidade de Vida continuam na Ficha de Ameaça");
}

/* ── O XP sem milhar ───────────────────────────────────────────────────── */
for (const [texto, esperado] of [["7.250 XP", "7250"], ["37 XP", "37"], ["1.200 XP", "1200"], ["100", "100"]]) {
  confere(xpSemMilhar(texto) === esperado, `"${texto}" virou "${xpSemMilhar(texto)}", esperava "${esperado}"`);
}

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log("  ✔ Qualidade de Vida: o efeito de JP chega à rolagem, a ordem dos envelopes, a agonização trocada, o tesouro escondido e o XP sem milhar");
