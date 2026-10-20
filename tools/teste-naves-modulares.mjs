/**
 * Regra da casa: a nave é modular.
 *
 * Toda nave sai de fábrica com o mínimo para voar e manter todos vivos —
 * Ponte de Comando, Sala de Máquinas, e o casco com o suporte de vida (o CP do
 * tipo). O resto se compra, pelo preço da T10-2, dentro do que o tamanho
 * comporta; passar do limite é aviso, não trava.
 *
 * ── O QUE ESTE TESTE GARANTE ────────────────────────────────────────────────
 *
 *   · a nave nova tem só o mínimo, e nenhuma câmara comprada;
 *   · a compra diz preço, prazo e se passa do limite do tamanho;
 *   · a câmara de fábrica não conta contra o limite, nem quando é reinstalada;
 *   · a câmara ausente aparece como "comprar", e não como "não tem";
 *   · o painel nomeia o casco, e a ficha intercepta o arrastar da câmara.
 *
 *     node tools/teste-naves-modulares.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  naveVazia, resumoDasCamaras, compraDeCamara, CAMARAS_BASE, CHAVES_DAS_CAMARAS,
  reparoDeCamara, metadeDoPrazo, tamanhoDaNave,
} from "../spacedragon-module/module/nave-pc-dados.js";
import * as camarasJs from "../spacedragon-module/module/camaras.js";
import { botaoDoComodo, painelDasCamaras } from "../spacedragon-module/module/nave-pc-ficha.js";
import { CAMARAS } from "../spacedragon-module/module/camaras.js";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

const nave = (tamanho, camaras = {}) => ({ ...naveVazia(), tamanho, camaras });

/* ── A nave nova: só o mínimo ──────────────────────────────────────────── */
{
  const r = resumoDasCamaras(nave("Média"), { cp: 26 });
  confere(r.fabrica.map((l) => l.chave).join() === "ponte,maquinas", `de fábrica saiu ${r.fabrica.map((l) => l.chave)}`);
  confere(r.fabrica.every((l) => l.estado === "instalada"), "a Ponte e a Sala de Máquinas não vieram instaladas");
  confere(r.compradas.length === 0, `a nave nova já veio com câmara comprada: ${r.compradas.map((l) => l.rotulo)}`);
  confere(r.orcamento.livres === 2 && r.orcamento.usadas === 0, `limite da Média: ${r.orcamento.usadas} de ${r.orcamento.livres}, esperava 0 de 2`);
  confere(r.casco.cp === 26, "o casco não carregou o CP do tipo");
  confere(CHAVES_DAS_CAMARAS.length === 12, "a T10-2 tem doze câmaras");
}

/* ── Comprar dentro e fora do limite ──────────────────────────────────── */
{
  const c = compraDeCamara("laboratorio", nave("Média"));
  confere(c && c.obra === CAMARAS.laboratorio.obra && c.prazo === CAMARAS.laboratorio.prazo,
    "a compra não trouxe o preço e o prazo da T10-2");
  confere(c && !c.excede, "a primeira câmara de uma nave Média não passa do limite");

  const cheia = nave("Média", { laboratorio: "instalada", arsenal: "danificada" });
  confere(compraDeCamara("hospital", cheia)?.excede === true,
    "a terceira câmara de uma nave Média devia avisar que passa do limite (a danificada ocupa lugar)");
  confere(compraDeCamara("laboratorio", cheia) === null, "comprar o que já está instalado devia dar null");
  confere(compraDeCamara("arsenal", cheia) === null, "a danificada se repara, não se compra de novo");

  confere(compraDeCamara("aposentos", nave("Pequena"))?.excede === true,
    "na nave Pequena qualquer câmara extra passa do limite: é cabine e motor");
  confere(compraDeCamara("aposentos", nave(""))?.excede === false,
    "sem tamanho definido não há limite para acusar");
}

/* ── A câmara de fábrica arrancada ─────────────────────────────────────── */
{
  const semPonte = nave("Pequena", { ponte: "ausente" });
  const c = compraDeCamara("ponte", semPonte);
  confere(c?.deFabrica === true && c.excede === false,
    "reinstalar a Ponte custa a obra, mas não conta contra o limite do tamanho");
  const r = resumoDasCamaras(semPonte);
  confere(r.fabrica.find((l) => l.chave === "ponte")?.estado === "ausente", "o painel não mostrou a Ponte arrancada");
  confere(CAMARAS_BASE.length === 2, "o mínimo de fábrica em câmaras é Ponte e Sala de Máquinas");
}

/* ── O botão e o painel ────────────────────────────────────────────────── */
{
  const b = botaoDoComodo("laboratorio", "ausente");
  confere(/>comprar</.test(b), "a câmara ausente devia dizer \"comprar\"");
  confere(/créditos/.test(b) && b.includes(CAMARAS.laboratorio.prazo), "a dica do comprar não traz preço e prazo");
  confere(/>instalada</.test(botaoDoComodo("ponte", "instalada")), "a câmara instalada mudou de rótulo");

  const ator = { name: "Andorinha", system: { ac_total: 28 }, items: [] };
  const html = painelDasCamaras(ator, nave("Pequena", { aposentos: "instalada" }));
  confere(/Casco e suporte de vida/.test(html) && /CP 28/.test(html), "o painel não nomeia o casco com o CP");
  confere(/1 de 0/.test(html) && /passou do que o tamanho comporta/.test(html),
    "a nave Pequena com Aposentos devia acusar 1 de 0, acima do limite");
  confere(/Compradas: Aposentos da Tripulação/.test(html), "o painel não lista o que foi comprado");
}

/* ── O tamanho, mesmo quando a nave não o gravou ───────────────────────── */
{
  confere(tamanhoDaNave({ tamanho: "Média" }) === "Média", "o tamanho gravado tem de valer");
  confere(tamanhoDaNave({ tipo: "cargueiro" }) === "Gigantesca",
    "nave criada só com o tipo (como o criador fazia) devia ter o tamanho do tipo");
  confere(tamanhoDaNave({}, "Caça") === "Pequena", "sem tipo gravado, o nome da raça dá o tamanho");
  confere(tamanhoDaNave({}, "Outra coisa") === "", "raça que não é tipo de nave não inventa tamanho");
  const r = resumoDasCamaras({ ...naveVazia(), tipo: "particular" });
  confere(r.conhecido && r.orcamento.livres === 2, "a nave do criador (só tipo) não mostrou o limite da Média");

  // os cômodos do compêndio levam a flag de câmara (o build a jogava fora)
  const pasta = path.join(RAIZ, "packs-src", "spacedragon-naves");
  if (fs.existsSync(pasta)) {
    const comodos = fs.readdirSync(pasta).filter((f) => f.includes("__class_ability__"))
      .map((f) => JSON.parse(fs.readFileSync(path.join(pasta, f), "utf8")));
    const semFlag = comodos.filter((d) => !d.flags?.spacedragon?.camaraDeNave?.chave).map((d) => d.name);
    confere(comodos.length === 12 && semFlag.length === 0,
      `cômodos sem a flag de câmara no compêndio: ${semFlag.join(", ") || `(${comodos.length} cômodos)`}`);
  }
  const criador = fs.readFileSync(path.join(RAIZ, "spacedragon-module", "module", "nave-nova.js"), "utf8");
  confere(/aplicarTipo\(tipo\)/.test(criador), "o criador de naves voltou a gravar só a chave do tipo, sem o tamanho");
}

/* ── O reparo da danificada: 25% da obra, metade do prazo ──────────────── */
{
  const avariada = nave("Média", { laboratorio: "danificada" });
  const r = reparoDeCamara("laboratorio", avariada);
  confere(r?.custo === Math.round(CAMARAS.laboratorio.obra * 0.25), `o reparo custou ${r?.custo}, esperava 25% da obra`);
  confere(reparoDeCamara("laboratorio", nave("Média")) === null, "só a danificada se repara");
  for (const [prazo, metade] of [["1 semana", "4 dias"], ["2 semanas", "1 semana"], ["3 dias", "2 dias"], ["1,5 semana", "6 dias"], ["3 semanas", "11 dias"]]) {
    confere(metadeDoPrazo(prazo) === metade, `metade de ${prazo} deu ${metadeDoPrazo(prazo)}, esperava ${metade}`);
  }
  const b = botaoDoComodo("laboratorio", "danificada");
  confere(/reparar/.test(b), "a dica da danificada não oferece o reparo");
  confere(!("camaraOperacional" in camarasJs) && !("decidirCamara" in camarasJs),
    "camaraOperacional/decidirCamara voltaram — liam o estado cru, sem o padrão de fábrica");
}

/* ── A ficha liga o clique e o arrastar à compra ───────────────────────── */
{
  const fonte = fs.readFileSync(path.join(RAIZ, "spacedragon-module", "module", "nave-pc-ficha.js"), "utf8");
  confere(/=== "ausente"\) return this\.#comprarCamara\(chave\)/.test(fonte),
    "o clique em uma câmara ausente não passa pela compra");
  confere(/async _onDropItem\(event, data\)/.test(fonte) && /camaraDeNave/.test(fonte.slice(fonte.indexOf("async _onDropItem"))),
    "a ficha não intercepta a câmara arrastada do compêndio");
  confere(/super\._onDropItem\(event, data\)/.test(fonte), "o arrastar de outros itens deixou de ir para o sistema");
  confere(/porPainelDasCamaras\(raiz, this\.actor\)/.test(fonte), "o painel das câmaras não é desenhado na ficha");
  confere(/=== "danificada"\) return this\.#repararOuArrancar\(chave\)/.test(fonte),
    "o clique numa câmara danificada não oferece o reparo");
}

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log(
  "  ✔ naves modulares: a nave nova tem só Ponte, Sala de Máquinas e casco; a compra traz preço, prazo e o " +
    "aviso de limite; a de fábrica não conta no limite; \"comprar\" no botão; clique e arrastar passam pela compra"
);
