/**
 * Qual das quatro classes do livro está por trás do item de classe do ator.
 *
 * ── POR QUE ISTO EXISTE ─────────────────────────────────────────────────────
 *
 * O alcance mental, os pontos de vida e o dano crítico dependem da tabela da
 * classe, e o módulo achava a tabela pelo NOME: "Hipercientista — Mentálico"
 * termina em "Mentálico", então é Mentálico.
 *
 * Isso quebra no primeiro suplemento de cenário. O Star Wars para Space Dragon
 * veste as mesmas quatro classes com outros nomes — o Mentálico vira
 * "Sensível à Força", o Cosmonauta vira "Veterano" — sem mudar um número da
 * tabela. Pelo nome, o módulo não reconheceria nenhuma.
 *
 * ── A FLAG ──────────────────────────────────────────────────────────────────
 *
 * O item de classe pode dizer o chassi dele:
 *
 *     flags.spacedragon.chassi = "Mentálico"
 *
 * E uma habilidade de classe pode dizer qual habilidade do livro ela é, para
 * receber os mesmos botões de teste:
 *
 *     flags.spacedragon.habilidade = "Talentos de Gatuno"
 *
 * É DADO, e não código: o suplemento declara no próprio compêndio, e o
 * Foundry copia as flags para o ator quando a classe é arrastada para a
 * ficha. Nenhum módulo precisa chamar nada deste aqui.
 *
 * Sem a flag vale o nome, como sempre valeu. E por ser flag no ITEM, uma
 * classe de outro módulo que só tenha o mesmo nome — o "Veterano" do Star
 * Dragon, que é Old Dragon 2 — não é confundida com o Cosmonauta.
 */

import { PROGRESSAO } from "./dados.js";

export const CHASSIS = ["Cientista", "Cosmonauta", "Gatuno", "Mentálico"];

/** "Hipercientista — Mentálico" → "Mentálico"; a flag, se houver, manda. */
export function chassiDe(ator) {
  const cls = ator?.system?.class ?? ator?.items?.find?.((i) => i.type === "class");
  const declarado = cls?.flags?.spacedragon?.chassi;
  if (declarado) return declarado;
  const partes = (cls?.name ?? "").split(" — ");
  return partes[partes.length - 1].trim();
}

/**
 * O nome da habilidade do livro por trás de uma habilidade de classe da ficha.
 *
 * O painel lê o nome no DOM (o id do <li> não é confiável neste sistema) e
 * procura o item com esse nome no ator para ver se ele declara outro.
 */
export function habilidadeDe(ator, nome) {
  const item = ator?.items?.find?.((i) => i.type === "class_ability" && i.name === nome);
  return item?.flags?.spacedragon?.habilidade ?? nome;
}

/**
 * ── A PROGRESSÃO DA ESPECIALIZAÇÃO ──────────────────────────────────────────
 *
 * A especialização troca colunas da tabela da classe a partir do 5º nível: o
 * Sabotador soma à Sabotagem a diferença entre Escalar e 100%, o Mercenário
 * congela Pilotar e sobe o crítico, o Consular pula para a 4ª Grandeza. O
 * motor lia sempre a tabela do livro, e a especialização só existia no texto
 * — o jogador tinha de somar o bônus à mão, como modificador de situação.
 *
 * O item de classe pode trazer a própria tabela, nível a nível:
 *
 *     flags.spacedragon.progressao = {
 *       fonte: "Sabotador",
 *       colunas: { sabotagem: { "5": "51% / 1d8", … }, escalar: { … } },
 *       ajuste:  { sabotagem: 2 },   // multiplica o ajuste POSITIVO do atributo
 *     }
 *
 * As colunas têm os nomes das do livro (dados.js › PROGRESSAO). Nível que a
 * especialização não declara — o 1º ao 4º — cai na tabela do livro.
 */
export function progressaoDe(ator) {
  const cls = ator?.system?.class ?? ator?.items?.find?.((i) => i.type === "class");
  const p = cls?.flags?.spacedragon?.progressao;
  return p?.colunas ? p : null;
}

/** A célula da coluna no nível: a da especialização, se ela declarar; senão a do livro. */
export function celulaDe(progressao, tabela, coluna, nivel) {
  const propria = progressao?.colunas?.[coluna]?.[String(nivel)];
  if (propria !== undefined && propria !== null && propria !== "") return propria;
  const col = PROGRESSAO[tabela]?.[coluna] ?? [];
  return col[Math.min(Math.max(nivel, 1), col.length) - 1];
}
