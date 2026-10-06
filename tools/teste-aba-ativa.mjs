// Teste da aba ativa na ficha: o filete marca, a palavra não.
//
// ── POR QUE ISTO VIROU UM TESTE ─────────────────────────────────────────────
//
// Na barra de abas da ficha, o nome da aba aberta era pintado com
// `--sd-brilho`. Sobre a barra escura isso dava uma palavra em verde-fósforo no
// meio de cinco em branco — e a mesa relatou a mesma coisa duas vezes, em dias
// diferentes, antes de mandar o print que mostrou o que era.
//
// ── A ASSERÇÃO QUE MAIS IMPORTA ─────────────────────────────────────────────
//
// Que a aba ativa NÃO receba `--sd-brilho` como `color`. O filete pode (e
// deve) usar a cor de destaque; a palavra, não. A diferença entre as duas
// coisas é uma vírgula num seletor, e foi uma vírgula que causou isto.
//
// Uso: node tools/teste-aba-ativa.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(fileURLToPath(import.meta.url), "../..");
const CSS = fs
  .readFileSync(path.join(RAIZ, "spacedragon-module", "styles", "tema.css"), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "");

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };

const ABA_ATIVA = ".tabs .item.active";
const blocos = [...CSS.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
  seletores: m[1].split(",").map((x) => x.trim()).filter(Boolean),
  corpo: m[2],
}));

const daAbaAtiva = blocos.filter((b) => b.seletores.some((s) => s.endsWith(ABA_ATIVA)));
confere(daAbaAtiva.length > 0, "nenhuma regra para a aba ativa — o tema não a marca de jeito nenhum");

for (const b of daAbaAtiva) {
  // `color:` pode existir, mas NUNCA com a cor de destaque
  const cor = /(?:^|[;{\s])color:\s*([^;]+)/.exec(b.corpo)?.[1] ?? "";
  confere(!/--sd-brilho/.test(cor),
    `a aba ativa pinta o TEXTO com --sd-brilho ("${cor.trim()}") — é a palavra em ` +
    `verde-fósforo no meio das brancas que a mesa reclamou duas vezes`);

  // e o filete tem de continuar marcando: sem cor e sem traço, não se vê qual aba está aberta
  const temFilete = /border-bottom-color:\s*[^;]*--sd-brilho/.test(b.corpo);
  const temCor = cor.length > 0;
  confere(temFilete || temCor,
    "a regra da aba ativa não dá nem cor nem filete — não se saberia qual aba está aberta");
}

// ── O SUBLINHADO TEM DE TER COR PRÓPRIA ────────────────────────────────────
//
// `text-decoration` usa a cor do TEXTO quando ninguém diz o contrário. Assim
// que a cor do texto da aba ativa passou a ser forçada para branco, o traço
// foi junto: a aba aberta ficou marcada por um sublinhado branco sobre barra
// escura — invisível, que é o oposto do que se queria.
//
// Esta é a asserção que amarra as duas decisões: quem força a cor do texto
// precisa dizer, na mesma regra, de que cor é o traço.
for (const b of daAbaAtiva) {
  const forcaCor = /(?:^|[;{\s])color:\s*[^;]+!important/.test(b.corpo);
  if (!forcaCor) continue;
  confere(/text-decoration-color:/.test(b.corpo),
    "a aba ativa força a cor do texto e não declara text-decoration-color — " +
    "o sublinhado herda a cor da palavra e some na barra escura");
  const corTraco = /text-decoration-color:\s*([^;!]+)/.exec(b.corpo)?.[1]?.trim() ?? "";
  confere(/--sd-brilho/.test(corTraco),
    `o traço da aba ativa é "${corTraco}" — devia ser a cor de destaque, que é ` +
    "a única coisa marcando qual aba está aberta agora");
}

// Em algum lugar o filete PRECISA existir, ou a seleção fica invisível.
confere(
  daAbaAtiva.some((b) => /border-bottom-color:\s*[^;]*--sd-brilho/.test(b.corpo)),
  "nenhuma regra dá o filete de destaque à aba ativa — tirando a cor do texto, " +
  "sobrou nada marcando qual está aberta"
);

// A cor forçada: sem `color` declarado, a aba ativa cai na cor do sistema, que
// não é a das vizinhas nesta barra — e fica diferente sem ninguém ter escolhido.
confere(
  daAbaAtiva.some((b) => /(?:^|[;{\s])color:\s*[^;]+!important/.test(b.corpo)),
  "a aba ativa não força a cor do texto — ela cairia na cor do sistema, diferente " +
  "das abas vizinhas por acidente"
);

if (problemas.length) {
  for (const p of problemas) console.error(`  ✘ ${p}`);
  process.exit(1);
}
console.log(
  "  ✔ aba ativa: o texto na cor da barra (forçada, não herdada do sistema) e o " +
    "destaque no traço, com text-decoration-color próprio (senão o sublinhado herda o " +
    "branco da palavra e some) — a palavra nunca em --sd-brilho"
);
