// As câmaras da nave (T10-2) como itens de compêndio.
//
// Mesmo molde dos equipamentos da T10-4 (ver equipamentos-de-nave.mjs): o item
// é a porta de entrada, e o estado continua no schema da nave. Arrastar uma
// câmara a INSTALA — ou seja, leva o estado de "ausente" para "instalada".
//
// ── POR QUE ISTO IMPORTA MAIS AQUI DO QUE NOS EQUIPAMENTOS ──────────────────
//
// Porque é o que torna a nave montável. Hoje a ficha nasce com as doze câmaras
// e você desliga as que não tem; arrastando, você parte do casco e constrói o
// que quiser — que é como a mesa pensa a nave.
//
// ── O QUE É DO LIVRO E O QUE É DA CASA ──────────────────────────────────────
//
// A T10-2 (p. 176) só dá a câmara, a FINALIDADE e o EQUIPAMENTO que se acha
// nela; a descrição abre com esses dois, marcados como do livro. Preço de obra,
// prazo, efeito e o reparo de 25% são da opção "Nave modular (regra da casa)":
// o livro não põe preço em câmara nenhuma. Vão na descrição mesmo assim, e
// rotulados, porque quem olha a câmara no compêndio está decidindo se compra.

import { CAMARAS } from "../../spacedragon-module/module/camaras.js";
import { CAMARAS_BASE } from "../../spacedragon-module/module/nave-pc-dados.js";

const OD2I = "systems/olddragon2e/assets/icons";

const creditos = (n) => `${Number(n).toLocaleString("pt-BR")} créditos`;

export function descricaoDaCamara(c) {
  const partes = [];
  if (c.finalidade) partes.push(`Finalidade (T10-2): ${c.finalidade}.`);
  if (c.equipamento) partes.push(`Equipamento (T10-2): ${c.equipamento}.`);
  if (c.efeito) partes.push(`Efeito (regra da casa): ${c.efeito}`);
  if (c.obra) partes.push(`Obra (regra da casa): ${creditos(c.obra)}, ${c.prazo}.`);
  // O reparo em campo é 25% do valor e metade do prazo — regra da casa, não da
  // T10-2. É o número que a mesa procura quando a câmara já está danificada.
  if (c.obra) {
    partes.push(`Reparo em campo (regra da casa): ${creditos(Math.round(c.obra * 0.25))}, metade do prazo.`);
  }
  return partes.filter(Boolean).join(" ");
}

// Regra da casa: a nave é modular. A frase final diz a quem olha o compêndio
// se esta câmara vem de fábrica ou se compra — e como se compra.
const fraseDaRegra = (chave) =>
  CAMARAS_BASE.includes(chave)
    ? "Vem de fábrica em toda nave: sem ela a nave não voa."
    : "Regra da casa: a nave sai de fábrica só com a Ponte, a Sala de Máquinas e o casco. " +
      "Arraste esta câmara para a ficha da nave para comprá-la; a ficha confirma o preço e registra a obra no chat.";

export const camarasDeNave = Object.entries(CAMARAS).map(([chave, c]) => ({
  chave,
  nome: c.rotulo,
  obra: c.obra,
  img: `${OD2I}/misc.svg`,
  desc: `${descricaoDaCamara(c)} ${fraseDaRegra(chave)}`,
}));
