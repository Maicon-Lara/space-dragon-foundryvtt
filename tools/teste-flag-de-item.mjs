// O id do módulo no caminho da flag dos ITENS de nave.
//
// ── O BUG QUE ISTO EXISTE PARA NÃO DEIXAR VOLTAR ────────────────────────────
//
// A ficha reconhece um cômodo pela flag do item, `flags.<id>.camaraDeNave`, e
// só então desenha o botão de instalar. Quando as naves vieram do módulo de
// Star Wars para cá, o id mudou de "starwars-sd" para "spacedragon" — e o id é
// parte do CAMINHO.
//
// A migração que eu escrevi cuidava da flag do ATOR e parava ali. O build
// continuou gravando o id antigo nos itens, e `marcarComodos` dá `continue` em
// quem não tem a flag: o item existia, a linha aparecia, e NENHUM botão de
// instalar era desenhado. Sem erro no console, porque não houve erro — houve um
// caminho que não casa.
//
// A mesa encontrou. Nenhum teste encontrou, e dois dos que existiam teriam
// encontrado se estivessem no `npm run build` — por isso o teste de ponta a
// ponta também confere que eles estão lá.
//
// ── AS TRÊS PONTAS ──────────────────────────────────────────────────────────
//
//   1. a FONTE DA VERDADE (tools/) grava sob o id novo;
//   2. a LEITURA aceita os dois, porque um item já embedado numa nave da mesa
//      é uma cópia e recompilar o pack não a toca;
//   3. a MIGRAÇÃO reescreve esses itens, inclusive nas naves cujo ATOR já tinha
//      sido migrado pela versão anterior da rotina.
//
// Uso: node tools/teste-flag-de-item.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { flagDeNave, ID_ANTIGO } from "../spacedragon-module/module/nave-pc-dados.js";
import { itensPorMigrar, porMigrar, migrarNave } from "../spacedragon-module/module/nave-migrar-flag.js";
import { equipamentosDoAtor } from "../spacedragon-module/module/nave-sistemas.js";

const RAIZ = path.resolve(fileURLToPath(import.meta.url), "../..");
const ID = "spacedragon";

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

/* ── 1. A FONTE DA VERDADE GRAVA SOB O ID NOVO ─────────────────────────────── */
//
// Medido nos packs-src gerados, e não no código que os gera: é o arquivo que o
// Foundry vai ler. Uma asserção sobre o código passaria com um literal esquecido
// em outro ramo do build.
{
  const dir = path.join(RAIZ, "packs-src");
  const comFlag = [];
  const comIdAntigo = [];
  for (const pack of fs.readdirSync(dir)) {
    const d = path.join(dir, pack);
    if (!fs.statSync(d).isDirectory()) continue;
    for (const f of fs.readdirSync(d)) {
      if (!f.endsWith(".json")) continue;
      const doc = JSON.parse(fs.readFileSync(path.join(d, f), "utf8"));
      const flags = doc.flags ?? {};
      for (const nome of ["camaraDeNave", "equipamentoDeNave"]) {
        if (flags[ID]?.[nome]) comFlag.push(`${pack}/${doc.name}`);
        if (flags[ID_ANTIGO]?.[nome]) comIdAntigo.push(`${pack}/${doc.name} (${nome})`);
      }
    }
  }
  // o número vem do livro: 12 câmaras da T10-2 (como item e como habilidade de
  // classe) e os equipamentos da T10-4. Um piso alto é o que impede este teste
  // de passar verde porque a varredura não achou nada.
  confere(comFlag.length >= 24,
    `só ${comFlag.length} itens de nave com a flag sob "${ID}" — eram 27 quando o bug ` +
    `foi achado, e menos que isso significa que a varredura falhou ou que o build parou ` +
    `de gravar a flag`);
  confere(comIdAntigo.length === 0,
    `${comIdAntigo.length} item(ns) ainda gravam a flag sob "${ID_ANTIGO}" — a ficha lê ` +
    `o id novo, e o botão de instalar não é desenhado em quem não casa:\n      ` +
    comIdAntigo.slice(0, 6).join("\n      "));
}

/* ── 2. A LEITURA ACEITA OS DOIS IDS ──────────────────────────────────────── */
//
// E aceita nas duas formas que um item aparece: `item.flags` cru (o objeto do
// pack, e o que os testes montam) e `item.getFlag()` (o documento vivo do
// Foundry). As duas existem no código real, lado a lado, e a que falha é sempre
// a que não foi testada.
{
  const novo = { flags: { [ID]: { camaraDeNave: { chave: "ponte" } } } };
  const antigo = { flags: { [ID_ANTIGO]: { camaraDeNave: { chave: "ponte" } } } };
  const vivo = {
    getFlag: (quem, nome) =>
      quem === ID_ANTIGO && nome === "camaraDeNave" ? { chave: "ponte" } : undefined,
  };

  confere(flagDeNave(novo, "camaraDeNave")?.chave === "ponte",
    "a leitura não acha a flag sob o id NOVO — é o caso comum, e nada funcionaria");
  confere(flagDeNave(antigo, "camaraDeNave")?.chave === "ponte",
    `a leitura não acha a flag sob "${ID_ANTIGO}" — os cômodos já dentro das naves da ` +
    `mesa são cópias feitas quando o id era esse, e recompilar o pack não as toca`);
  confere(flagDeNave(vivo, "camaraDeNave")?.chave === "ponte",
    "a leitura não usa getFlag() — no Foundry o item é um documento, e `flags` cru só " +
    "aparece nos objetos do pack");
  // O Foundry de verdade: getFlag LANÇA para escopo de pacote inativo. Sem o
  // módulo de Star Wars na mesa, ler o id antigo de um item comum (o tipo, a
  // classe, uma arma) não pode quebrar nada — foi assim que o arrastar parou.
  const doFoundry = {
    flags: {},
    getFlag: (quem) => {
      if (quem !== ID) throw new Error(`Flag scope "${quem}" is not valid or not currently active`);
      return undefined;
    },
  };
  let lancou = false;
  try { flagDeNave(doFoundry, "camaraDeNave"); } catch { lancou = true; }
  confere(!lancou, "ler a flag de um item sem ela LANÇA quando o módulo antigo não está ativo — " +
    "o arrastar de qualquer item na Ficha de Nave para no meio");
  confere(flagDeNave(doFoundry, "camaraDeNave") === null, "item comum, sem flag, devia dar null");
  confere(flagDeNave({}, "camaraDeNave") === null,
    "um item SEM flag de nave devolve algo em vez de null — e aí toda linha da ficha " +
    "viraria um cômodo");

  // e o leitor de equipamentos, que é o outro consumidor
  const ator = { items: [antigo, { flags: { [ID]: { equipamentoDeNave: { chave: "escudo" } } } }] };
  ator.items[0] = { flags: { [ID_ANTIGO]: { equipamentoDeNave: { chave: "balistico" } } } };
  const chaves = equipamentosDoAtor(ator);
  confere(chaves.has("balistico") && chaves.has("escudo"),
    `equipamentosDoAtor achou ${[...chaves].join(", ") || "nada"} — faltando o do id ` +
    `antigo, o +2 do Computador Balístico desaparece da nave que já o tinha`);
}

/* ── 3. A MIGRAÇÃO ALCANÇA OS ITENS ───────────────────────────────────────── */
{
  const itemAntigo = (id, nome, chave) => ({
    id,
    flags: { [ID_ANTIGO]: { [nome]: { chave } } },
  });

  // a nave que a mesa tem: o ATOR já foi migrado pela rotina anterior, os itens não
  const naveDaMesa = {
    id: "A1",
    name: "Corvo",
    items: [
      itemAntigo("i1", "camaraDeNave", "ponte"),
      itemAntigo("i2", "camaraDeNave", "maquinas"),
      itemAntigo("i3", "equipamentoDeNave", "balistico"),
      { id: "i4", flags: {} },                                   // um item qualquer
      { id: "i5", flags: { [ID]: { camaraDeNave: { chave: "arsenal" } } } },  // já ok
    ],
    getFlag: (quem, nome) => (quem === ID && nome === "nave" ? { tipo: "cargueiro" } : undefined),
  };

  const updates = itensPorMigrar(naveDaMesa);
  confere(updates.length === 3,
    `itensPorMigrar achou ${updates.length} item(ns) em vez de 3 — ou deixa cômodo para ` +
    `trás, ou mexe em item que não é de nave`);
  confere(updates.every((u) => u._id),
    "um update sem `_id` — updateEmbeddedDocuments não sabe em qual item mexer e falha calada");
  confere(updates.some((u) => u[`flags.${ID}.camaraDeNave`]?.chave === "ponte"),
    "a Ponte não foi para o update, e ela é um dos dois cômodos que o livro não deixa dispensar");
  confere(updates.some((u) => u[`flags.${ID}.equipamentoDeNave`]?.chave === "balistico"),
    "o equipamento não foi para o update — só as câmaras seriam consertadas");
  confere(!updates.some((u) => u._id === "i5"),
    "o item que JÁ tinha a flag nova foi reescrito — refazer migração sobrescreve o que a " +
    "mesa mexeu depois, que é o jeito mais discreto de perder trabalho");
  confere(!updates.some((u) => u._id === "i4"),
    "um item sem flag de nave entrou no update");

  // ── A PONTA QUE A VERSÃO ANTERIOR PERDIA ─────────────────────────────────
  //
  // `porMigrar()` tem de enxergar a nave cujo ATOR já está migrado. Era aqui o
  // furo: `navesPorMigrar()` a considerava pronta, a migração nunca rodava, e os
  // botões nunca voltavam.
  globalThis.game = { actors: [naveDaMesa], user: { isGM: true } };
  const alvos = porMigrar();
  confere(alvos.includes(naveDaMesa),
    "porMigrar() não enxerga a nave cujo ator já foi migrado mas cujos itens ficaram " +
    "atrás — era exatamente este o furo, e a nave abria certa e sem botão nenhum");

  // e a migração de fato escreve, numa chamada só
  (async () => {
    let chamadas = 0;
    let recebidos = null;
    naveDaMesa.update = async () => { /* o ator já está migrado: nada a fazer */ };
    naveDaMesa.updateEmbeddedDocuments = async (tipo, us) => {
      chamadas += 1;
      recebidos = { tipo, us };
    };
    const r = await migrarNave(naveDaMesa);
    confere(chamadas === 1,
      `updateEmbeddedDocuments foi chamado ${chamadas} vez(es) — doze cômodos em doze ` +
      `chamadas são doze idas ao servidor, e cada uma redesenha a ficha aberta`);
    confere(recebidos?.tipo === "Item", `migrou "${recebidos?.tipo}" em vez de "Item"`);
    confere(r.itens === 3, `o relatório diz ${r.itens} item(ns) em vez de 3`);
    fim();
  })();
}

/* ── 4. OS TESTES DE NAVE ESTÃO NO BUILD ──────────────────────────────────── */
//
// Dois testes que já existiam teriam pegado este bug — `teste-classes-nave` e
// `teste-equipamentos-nave`. Os dois estavam vermelhos e fora do
// `npm run build`, então ninguém os rodava. Um teste que não está na linha de
// validação é documentação, não rede.
//
// Hoje quem roda os testes é tools/roda-testes.mjs, que descobre todo
// `teste-*.mjs` sozinho. A guarda, então, é dupla: o `npm test` tem de chamar
// o runner, e o `npm run publicar` tem de chamar o `npm test` — senão o runner
// existe e ninguém o roda, que é o mesmo buraco de antes com outro nome.
{
  const pkg = JSON.parse(fs.readFileSync(path.join(RAIZ, "package.json"), "utf8"));
  const scripts = pkg.scripts ?? {};
  confere(/tools\/roda-testes\.mjs/.test(scripts.test ?? ""),
    "o script `test` do package.json não chama tools/roda-testes.mjs");
  confere(/npm test/.test(scripts.publicar ?? ""),
    "o script `publicar` não roda `npm test` — o zip sairia sem os testes");
  // E o runner precisa enxergar os três tipos de arquivo que ele promete.
  const runner = fs.readFileSync(path.join(RAIZ, "tools", "roda-testes.mjs"), "utf8");
  for (const padrao of [String.raw`/^teste-.*\.mjs$/`, 'n === "verifica.mjs"', 'n === "fumaca.mjs"']) {
    confere(runner.includes(padrao), `o runner não procura ${padrao}`);
  }
}

/* ── 5. NINGUÉM CHAMA getFlag NO ID ANTIGO ────────────────────────────────── */
//
// getFlag("starwars-sd", …) lança sem o módulo de Star Wars ativo. A leitura
// do id antigo passa por lerFlag (nave-pc-dados.js), que nunca lança.
{
  const pasta = path.join(RAIZ, "spacedragon-module", "module");
  for (const nome of fs.readdirSync(pasta).filter((n) => n.endsWith(".js"))) {
    const fonte = fs.readFileSync(path.join(pasta, nome), "utf8");
    confere(!/getFlag\??\.?\(\s*ID_ANTIGO/.test(fonte),
      `${nome} chama getFlag(ID_ANTIGO, …) — lança quando o módulo antigo não está ativo; use lerFlag`);
  }
}

function fim() {
  if (problemas.length) {
    for (const p of problemas) console.error(`  ✘ ${p}`);
    process.exit(1);
  }
  console.log(
    "  ✔ flag dos itens de nave: o build grava sob \"spacedragon\" e nenhum item ficou no id " +
      "antigo, a leitura aceita os dois (em flags cru e em getFlag), a migração alcança os " +
      "itens das naves cujo ator já estava migrado — numa chamada só —, e o runner de " +
      "testes está no npm test e no publicar"
  );
}
