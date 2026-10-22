/**
 * O custo total dos itens, que a ficha do Old Dragon 2 calcula pelo `total_cost`.
 *
 * ── O BUG QUE ISTO CONSERTA ─────────────────────────────────────────────────
 *
 * O getter do sistema (OD2EquipmentDataModel) faz `cost.match(/\d+/)[0]` sem
 * olhar se achou alguma coisa. Custo sem nenhum dígito — "Sem custo" e "A
 * critério do Mestre", oito feitos do Cap. 8 — dá TypeError no meio do
 * Handlebars, porque a ficha desenha `system.total_cost` em cada linha do
 * inventário (misc-card.hbs).
 *
 * O item ERA criado no ator; o que quebrava era o redesenho. Para a mesa,
 * parecia que o aparato "não arrastava" — e, com um deles já no ator, a ficha
 * inteira parava de redesenhar, e nenhum arrastar seguinte aparecia também.
 *
 * ── E O QUE ELE AINDA ACERTA DE PASSAGEM ────────────────────────────────────
 *
 * O mesmo getter lê só o PRIMEIRO grupo de dígitos e põe "PO" no fim: "$180.000"
 * aparecia na ficha como "180 PO". Custo em créditos ($ ou "créditos") agora é
 * lido inteiro, com o ponto de milhar, e multiplicado pela quantidade.
 *
 * Custo em PO/PP/PC (um item do Old Dragon 2 numa mesa mista) continua com o
 * sistema: o envelope só desvia o que é do Space Dragon ou o que quebraria.
 */

import { envolver } from "./envelope.js";

/** O protótipo onde o sistema define `total_cost`. Armas, vestes e escudos herdam dele. */
export const ALVO_CUSTO = "CONFIG.Item.dataModels.misc.prototype.total_cost";

/** "$180.000", "$ 40000", "80.000 créditos": um preço só, que pode ser multiplicado. */
const PRECO_FECHADO = /^(?:\$\s*(?:\d{1,3}(?:\.\d{3})+|\d+)|(?:\d{1,3}(?:\.\d{3})+|\d+)\s*cr[eé]ditos?)$/i;

/** 1234567 → "1.234.567", sem depender do ICU do navegador. */
export function milhar(n) {
  return String(Math.trunc(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * O custo total do Space Dragon, ou `null` para devolver a conta ao sistema.
 *
 *   "Variável" ×1           → "Variável"        (o sistema quebraria)
 *   "$180.000" ×2           → "$360.000"        (o sistema diria "180 PO")
 *   "80.000 créditos" ×1    → "80.000 créditos" (o sistema diria "80 PO")
 *   "$10.000 por NT" ×3     → "$10.000 por NT"  (regra de preço: não multiplica)
 *   "10 PO", "", 0          → null              (a conta do sistema)
 */
export function custoTotal(custo, quantidade = 1) {
  if (typeof custo !== "string") return null;
  const texto = custo.trim();
  if (!texto) return null;
  if (!/\d/.test(texto)) return texto;

  const dolar = texto.includes("$");
  const creditos = /cr[eé]dito/i.test(texto);
  if (!dolar && !creditos) return null;
  // "$10.000 por NT", "$200.000 + $20.000 por 1d12 extra": é regra de preço, não
  // preço fechado; multiplicar pela quantidade apagaria o "por".
  if (!PRECO_FECHADO.test(texto)) return texto;

  const achado = texto.match(/\d{1,3}(?:\.\d{3})+|\d+/);
  const valor = Number(achado[0].replace(/\./g, ""));
  const qtd = Number(quantidade);
  if (!Number.isFinite(valor) || !Number.isFinite(qtd) || qtd <= 0 || valor <= 0) return texto;

  const total = milhar(valor * qtd);
  return dolar ? `$${total}` : `${total} créditos`;
}

/** Liga o envelope no `ready`. Devolve se registrou. */
export function ligarCusto() {
  if (!globalThis.CONFIG?.Item?.dataModels?.misc) return false;
  return envolver(ALVO_CUSTO, function (wrapped) {
    const nosso = custoTotal(this.cost, this.quantity);
    if (nosso !== null) return nosso;
    try {
      return wrapped();
    } catch {
      // Qualquer outro formato que o sistema não saiba ler: o texto como está,
      // e não uma ficha que para de desenhar.
      return this.cost ?? "";
    }
  });
}
