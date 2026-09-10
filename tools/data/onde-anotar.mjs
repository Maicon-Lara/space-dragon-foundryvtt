// Onde anotar cada atributo na ficha do Old Dragon 2.
//
// ── ISTO NÃO É REGRA. É CONVENÇÃO DESTE MÓDULO. ─────────────────────────────
//
// As regras do módulo vêm todas do *Space Dragon — Livro Básico Aprimorado*, e
// de nenhuma outra fonte. Nenhum número aqui é convertido: a faixa neutra
// continua sendo 10–11, os modificadores continuam os das tabelas T1-1 a T1-6,
// e as porcentagens continuam porcentagens.
//
// O que este arquivo resolve é um problema de FORMULÁRIO. A ficha do sistema
// olddragon2e tem seis campos de atributo, rotulados com os nomes do Old
// Dragon 2. Space Dragon tem seis atributos, e três têm nome próprio. Alguém
// precisa decidir em qual campo escrever a Ciência — e essa decisão é do
// módulo, tomada a partir do que o PRÓPRIO LIVRO BÁSICO diz que cada atributo
// faz:
//
//   Ciência (T1-5)     — "aptidão tecnológica", quantidade de robôs
//                        desativados. É o atributo do saber aplicado.
//   Intelecto (T1-4)   — "proteção mental", realizar e aprender poder mental.
//                        É o atributo da vontade e da percepção.
//   Comunicação (T1-6) — seguidores, ajuste de reação, idiomas. É o atributo
//                        social.
//
// Daí a colocação abaixo. Trocar Ciência e Intelecto de campo não mudaria
// nenhuma regra do Space Dragon — mudaria apenas onde o número fica escrito.
// Mas mudaria o que a ficha do OD2 calcula sozinha em cima dele, e por isso a
// escolha está registrada em vez de implícita.
export const CAMPO_NA_FICHA = {
  forca: "forca",
  destreza: "destreza",
  constituicao: "constituicao",
  ciencia: "inteligencia",
  intelecto: "sabedoria",
  comunicacao: "carisma",
};

export const NOME = {
  forca: "Força", destreza: "Destreza", constituicao: "Constituição",
  ciencia: "Ciência", intelecto: "Intelecto", comunicacao: "Comunicação",
};

const ROTULO_DA_FICHA = {
  forca: "Força", destreza: "Destreza", constituicao: "Constituição",
  inteligencia: "Inteligência", sabedoria: "Sabedoria", carisma: "Carisma",
};

/**
 * "Ciência (o campo Inteligência da ficha)" — e só quando o rótulo difere.
 *
 * Repetir "Força (o campo Força da ficha)" seria ruído que esconderia as três
 * linhas em que a informação importa.
 */
export function ondeAnotar(atributo) {
  const campo = CAMPO_NA_FICHA[atributo];
  const rotulo = ROTULO_DA_FICHA[campo];
  return rotulo === NOME[atributo]
    ? `<strong>${NOME[atributo]}</strong>`
    : `<strong>${NOME[atributo]}</strong> <em>(o campo ${rotulo} da ficha)</em>`;
}

/** A mesma coisa em TEXTO PURO — para onde o HTML sai escapado (dropdowns). */
export function ondeAnotarTexto(atributo) {
  const campo = CAMPO_NA_FICHA[atributo];
  const rotulo = ROTULO_DA_FICHA[campo];
  return rotulo === NOME[atributo]
    ? NOME[atributo]
    : `${NOME[atributo]} (o campo ${rotulo} da ficha)`;
}
