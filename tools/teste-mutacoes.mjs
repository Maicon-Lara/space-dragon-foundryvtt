/**
 * As mutações do Mutante entram na ficha.
 *
 * ── AS ASSERÇÕES QUE MAIS IMPORTAM ──────────────────────────────────────────
 *
 * 1. Toda opção que o build põe no seletor tem uma entrada em EFEITOS. Uma
 *    mutação sem entrada não quebra nada — some do resumo e não ajusta a
 *    ficha, em silêncio. É esse silêncio que o teste impede.
 *
 * 2. O ±3 de cada Atributo Ampliado/Diminuído é o da T2-2/T2-4 transcrita em
 *    tools/data/mutacoes.mjs, e não um número digitado de novo.
 *
 * 3. O campo NÃO é alterado: o efetivo é calculado. Somar no campo faria o
 *    formulário regravar o valor somado a cada salvamento.
 *
 *     node tools/teste-mutacoes.mjs
 */

import { opcoesDe, T2_2, T2_4 } from "./data/mutacoes.mjs";
import {
  EFEITOS, efeitosDe, atributoEfetivo, dadoDeVidaComMutacao, mesmoNumero, mutacoesDe, ladoDa,
} from "../spacedragon-module/module/mutacoes.js";

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

/* ── 1. A tabela cobre o seletor, e só ele ─────────────────────────────── */
for (const lado of ["aprimoramento", "degeneracao"]) {
  const chaves = opcoesDe(lado).map((o) => o.key);
  for (const k of chaves) confere(EFEITOS[lado][k], `${lado} "${k}" está no seletor e não tem efeito em mutacoes.js`);
  for (const k of Object.keys(EFEITOS[lado])) confere(chaves.includes(k), `${lado} "${k}" está em mutacoes.js e não existe no seletor`);
}

/* ── 2. Os atributos batem com a T2-2 e a T2-4 ─────────────────────────── */
for (const [lado, tabela] of [["aprimoramento", T2_2], ["degeneracao", T2_4]]) {
  for (const linha of tabela) {
    const ef = EFEITOS[lado][`08-${linha.atributo}-3`];
    confere(ef?.atributo?.[linha.atributo] === linha.ajuste,
      `${lado} ${linha.atributo}: mutacoes.js dá ${ef?.atributo?.[linha.atributo]}, a tabela do livro dá ${linha.ajuste}`);
  }
}

/* ── 3. Um ator de brinquedo, como o Foundry o entrega ──────────────────── */
function opcoes(lado) {
  return { variable_construction: { available_options: opcoesDe(lado) } };
}
function ator({ aprimoramento, degeneracao, nomes = false, ...campos }) {
  const itens = new Map([
    ["apr", { name: "Aprimoramento", flags: nomes ? {} : { spacedragon: { mutacao: "aprimoramento" } }, system: { variable_construction: opcoes("aprimoramento").variable_construction } }],
    ["deg", { name: "Degeneração", flags: nomes ? {} : { spacedragon: { mutacao: "degeneracao" } }, system: { variable_construction: opcoes("degeneracao").variable_construction } }],
    ["outra", { name: "Herança Humana", flags: {}, system: {} }],
  ]);
  const sel = {};
  if (aprimoramento) sel.apr = [{ key: aprimoramento }];
  if (degeneracao) sel.deg = [{ key: degeneracao }];
  sel.outra = [{ key: "08-forca-3" }]; // habilidade que não é de mutação: ignorada
  return { items: itens, system: { variable_construction_selections: sel, ...campos } };
}

{
  const a = ator({ aprimoramento: "08-forca-3", degeneracao: "03-mente-simplificada", forca: 12, sabedoria: 17 });
  confere(atributoEfetivo(a, "forca") === 15, `Força 12 com Atributo Ampliado deu ${atributoEfetivo(a, "forca")}, esperava 15`);
  confere(a.system.forca === 12, "o campo de Força foi alterado — o efetivo tem de ser calculado, não gravado");
  confere(atributoEfetivo(a, "intelecto") === 10, `Intelecto 17 com Mente Simplificada deu ${atributoEfetivo(a, "intelecto")}, esperava 10 (o teto)`);
  confere(atributoEfetivo(a, "destreza") === 0, "atributo em branco tem de continuar em branco, e não virar o ajuste");
  const ef = efeitosDe(a);
  confere(ef.jp.jps === -2, `Mente Simplificada deu JPM ${ef.jp.jps}, esperava −2`);
  confere(ef.mesa.length === 0, "Força +3 e Mente Simplificada não têm nada para a mesa, e o resumo listou algo");
  confere(mutacoesDe(a).length === 2, "a habilidade que não é de mutação entrou na conta");
}
{
  // personagem montado antes da flag: o lado vem do nome da habilidade
  const a = ator({ aprimoramento: "07-sexto-sentido", degeneracao: "07-tato", nomes: true, forca: 10 });
  const ef = efeitosDe(a);
  confere(ladoDa({ name: "Degeneração" }) === "degeneracao", "sem flag, o nome da habilidade não deu o lado");
  confere(ef.jp.jpd === 2 && ef.cp === 2, `Sexto Sentido ampliado deu JPR ${ef.jp.jpd} e CP ${ef.cp}, esperava +2 e +2`);
  confere(atributoEfetivo(a, "forca") === 8, `Tato diminuído com Força 10 deu ${atributoEfetivo(a, "forca")}, esperava 8`);
  confere(ef.mesa.some((m) => /\+2 pontos/.test(m.texto)), "o +2 de dano sofrido do Tato diminuído não foi para o resumo");
  confere(mesmoNumero(a) === "07", `os dois do número 7 não foram apontados como repetidos (deu ${mesmoNumero(a)})`);
}
{
  const a = ator({ aprimoramento: "07-visao", degeneracao: "06-funcoes-vitais-debilitadas" });
  const ef = efeitosDe(a);
  confere(ef.bad === 1, `Visão ampliada deu ${ef.bad} na BA à distância, esperava +1`);
  confere(ef.dv === -1, "Funções Vitais Debilitadas não baixou o dado de vida");
  confere(mesmoNumero(a) === null, "6 e 7 foram apontados como repetidos");
}

/* ── 4. A escada do dado de vida ───────────────────────────────────────── */
for (const [dado, passos, esperado] of [[4, 1, 6], [10, 1, 12], [12, 1, 12], [4, -1, 2], [8, -1, 6], [8, 0, 8], [0, 1, 0]]) {
  confere(dadoDeVidaComMutacao(dado, passos) === esperado, `d${dado} com ${passos} deu d${dadoDeVidaComMutacao(dado, passos)}, esperava d${esperado}`);
}

/* ── 5. Sem mutação, nada muda ─────────────────────────────────────────── */
{
  const humano = { items: new Map(), system: { variable_construction_selections: {}, forca: 13 } };
  confere(atributoEfetivo(humano, "forca") === 13, "um Humano teve o atributo alterado");
  confere(atributoEfetivo(null, "forca") === 0, "ator ausente quebrou a conta");
}

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log(
  "  ✔ mutações: as 40 opções do seletor têm efeito, os ±3 batem com a T2-2/T2-4, o campo não é " +
    "alterado, teto, JP, CP, BA, dado de vida e a trava dos números repetidos"
);
