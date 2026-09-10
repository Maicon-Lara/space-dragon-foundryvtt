/**
 * Um DOM de brinquedo, só com o que o painel usa.
 *
 * ── POR QUE NÃO jsdom ───────────────────────────────────────────────────────
 *
 * Porque o que precisa ser testado é minúsculo e específico: quatro seletores
 * de classe e um insertAdjacentHTML. Puxar uma dependência de dezenas de megas
 * para isso seria desproporcional, e o projeto não tem nenhuma dependência de
 * teste hoje.
 *
 * ── O QUE ELE COBRE ─────────────────────────────────────────────────────────
 *
 * Seletores por classe, simples ou descendentes (".class-abilities .item"),
 * `dataset`, `textContent`, `remove()`, `addEventListener` e
 * `insertAdjacentHTML("beforeend")`. É o suficiente para provar que o painel
 * ACHA as habilidades e ENFIA os botões no lugar certo.
 *
 * ⚠️ Não é um navegador. Não cobre CSS, layout, nem eventos de verdade. Se um
 * dia o painel precisar de algo além disto, é sinal de que chegou a hora do
 * jsdom.
 */

/**
 * Parser de HTML bem restrito: tags simples, atributos com aspas duplas — e
 * atributos SEM valor, como `disabled` e `selected`.
 *
 * A primeira versão exigia `nome="valor"` sempre, e um `disabled` solto fazia a
 * tag inteira não casar: o <input> sumia da árvore e o teste acusava um campo
 * que na verdade existia. HTML de verdade tem atributos nus.
 */
const TAG = /<(\/?)([a-z0-9]+)((?:\s+[a-z-]+(?:="[^"]*")?)*)\s*(\/?)>/gi;
const ATRIBUTO = /([a-z-]+)(?:="([^"]*)")?/gi;

class No {
  constructor(tag = "div", atributos = {}) {
    this.tag = tag;
    this.atributos = atributos;
    this.filhos = [];
    this.pai = null;
    this.texto = "";
    this.ouvintes = [];
  }

  /**
   * Um classList de verdade, com add/remove/contains.
   *
   * A primeira versão devolvia um array puro, e `classList.contains(...)`
   * estourava — Array tem `includes`, não `contains`. O erro caía no try/catch
   * do painel e virava um aviso no console, que é exatamente o modo de falhar
   * que este arquivo existe para impedir.
   */
  get classList() {
    const dono = this;
    const lista = () => (dono.atributos.class ?? "").split(/\s+/).filter(Boolean);
    return {
      contains: (c) => lista().includes(c),
      includes: (c) => lista().includes(c),
      add: (...cs) => {
        const l = lista();
        for (const c of cs) if (!l.includes(c)) l.push(c);
        dono.atributos.class = l.join(" ");
      },
      remove: (...cs) => {
        dono.atributos.class = lista().filter((c) => !cs.includes(c)).join(" ");
      },
      toString: () => lista().join(" "),
      get length() { return lista().length; },
    };
  }

  /** Só o setter: substitui os filhos pelo HTML dado. */
  set innerHTML(html) {
    this.filhos = [];
    this.texto = "";
    for (const no of analisa(html)) this.anexa(no);
  }

  get innerHTML() {
    return this.filhos.map((f) => f.tag).join("");
  }

  get dataset() {
    const d = {};
    for (const [k, v] of Object.entries(this.atributos)) {
      if (!k.startsWith("data-")) continue;
      // data-item-id → itemId, como o DOM de verdade faz.
      const nome = k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      d[nome] = v;
    }
    return d;
  }

  get textContent() {
    return this.texto + this.filhos.map((f) => f.textContent).join("");
  }

  /**
   * O setter existe porque o código de verdade escreve nele.
   *
   * Sem ele a atribuição estoura: módulo ESM roda em modo estrito, e atribuir a
   * uma propriedade que só tem getter lança TypeError. O erro caía no
   * try/catch da injeção e virava um aviso no console — de novo, o modo de
   * falhar que este arquivo existe para impedir.
   */
  set textContent(v) {
    this.filhos = [];
    this.texto = String(v);
  }

  anexa(no) {
    no.pai = this;
    this.filhos.push(no);
    return no;
  }

  remove() {
    if (!this.pai) return;
    this.pai.filhos = this.pai.filhos.filter((f) => f !== this);
    this.pai = null;
  }

  addEventListener(tipo, fn) {
    this.ouvintes.push({ tipo, fn });
  }

  /** Dispara um clique, como o navegador faria. */
  clique(extra = {}) {
    const ev = { preventDefault() {}, stopPropagation() {}, currentTarget: this, ...extra };
    for (const o of this.ouvintes) if (o.tipo === "click") o.fn(ev);
  }

  *descendentes() {
    for (const f of this.filhos) {
      yield f;
      yield* f.descendentes();
    }
  }

  /** Só `.classe`, `tag` e descendência por espaço. É tudo o que o painel usa. */
  casa(parte) {
    if (parte.startsWith(".")) return this.classList.includes(parte.slice(1));
    return this.tag === parte;
  }

  querySelectorAll(seletor) {
    const partes = seletor.trim().split(/\s+/);
    let atuais = [...this.descendentes()].filter((n) => n.casa(partes[0]));
    for (const p of partes.slice(1)) {
      atuais = atuais.flatMap((n) => [...n.descendentes()].filter((d) => d.casa(p)));
    }
    return [...new Set(atuais)];
  }

  querySelector(seletor) {
    return this.querySelectorAll(seletor)[0] ?? null;
  }

  /** O nome da tag em CAIXA ALTA, como no DOM de verdade. */
  get tagName() {
    return this.tag.toUpperCase();
  }

  /** O irmão seguinte. O painel de alcance mental usa para achar o <ol> de
   *  poderes que vem logo depois do cabeçalho da Grandeza. */
  get nextElementSibling() {
    if (!this.pai) return null;
    const i = this.pai.filhos.indexOf(this);
    return this.pai.filhos[i + 1] ?? null;
  }

  insertAdjacentHTML(posicao, html) {
    const novos = analisa(html);
    if (posicao === "beforeend") {
      for (const no of novos) this.anexa(no);
      return;
    }
    if (posicao === "afterbegin") {
      for (const no of novos) no.pai = this;
      this.filhos = [...novos, ...this.filhos];
      return;
    }
    throw new Error(`posição não suportada: ${posicao}`);
  }
}

/** HTML → nós. Ignora o que não for tag, exceto para acumular texto. */
export function analisa(html) {
  const raiz = new No("#fragmento");
  let atual = raiz;
  let pos = 0;
  TAG.lastIndex = 0;
  let m;
  while ((m = TAG.exec(html))) {
    const texto = html.slice(pos, m.index);
    if (texto) atual.texto += texto;
    pos = TAG.lastIndex;

    const [, fecha, tag, attrs, autoFecha] = m;
    if (fecha) {
      if (atual.pai) atual = atual.pai;
      continue;
    }
    const atributos = {};
    ATRIBUTO.lastIndex = 0;
    let a;
    while ((a = ATRIBUTO.exec(attrs ?? ""))) atributos[a[1].toLowerCase()] = a[2] ?? "";

    const no = atual.anexa(new No(tag.toLowerCase(), atributos));
    if (!autoFecha && !["br", "hr", "img", "input"].includes(tag.toLowerCase())) atual = no;
  }
  const resto = html.slice(pos);
  if (resto) atual.texto += resto;
  return raiz.filhos;
}

/** Monta uma raiz a partir de HTML. */
export function monta(html) {
  const raiz = new No("body");
  for (const no of analisa(html)) raiz.anexa(no);
  return raiz;
}

export { No };
