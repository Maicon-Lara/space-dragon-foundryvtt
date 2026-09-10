// O journal do Capítulo 5.
//
// As armas e as vestes viram itens; o que sobra é regra e preço, e regra e
// preço se leem, não se arrastam.

import { ARMAS, VESTES, ENCOMENDA, TIPOS, PORTES, CREDITOS_INICIAIS } from "./equipamento.mjs";

const cr = (n) => (n === null ? "—" : `$${n.toLocaleString("pt-BR")}`);
const kg = (n) => (n === null ? "—" : `${String(n).replace(".", ",")} kg`);

const linhasArmas = ARMAS.map((a) =>
  `<tr><td>${a.nome}</td><td>${a.tipo ?? "—"}</td><td>${a.porte ?? "—"}</td>` +
  `<td>${a.dano ?? "—"}</td><td>${a.alcance ?? "—"}</td><td>${cr(a.preco)}</td><td>${kg(a.peso)}</td></tr>`
).join("");

const linhasVestes = VESTES.map((v) => {
  const prot = v.protecao === null ? "—" : v.bonus ? `+${v.protecao}` : `${v.protecao}`;
  return `<tr><td>${v.nome}</td><td>${prot}</td>` +
    `<td>${v.movimento ? `${v.acrescimo ? "+" : ""}${v.movimento}` : "—"}</td>` +
    `<td>${v.acrescimo ? "+" : ""}${cr(v.preco)}</td><td>${v.acrescimo ? "+" : ""}${kg(v.peso)}</td></tr>`;
}).join("");

const linhasEncomenda = ENCOMENDA.map((e) =>
  `<tr><td>${e.servico}</td><td>${cr(e.preco)}</td><td>${e.beneficio}</td></tr>`
).join("");

const linhasCreditos = Object.entries(CREDITOS_INICIAIS)
  .map(([classe, dados]) => `<tr><td><strong>${classe}</strong></td><td>${dados}</td></tr>`)
  .join("");

export const equipamentoJournal = {
  title: "Space Dragon — Créditos e Equipamento",
  pages: [
    {
      title: "Créditos espaciais",
      content: `
<h2>Não há dinheiro físico</h2>
<p>Créditos são <strong>valores virtuais</strong>. Não existem cédulas nem moedas:
tudo anda no <strong>Cartão de Identificação Galáctico</strong>, que serve de
documento e é recarregado nas estações monetárias espalhadas pela galáxia, a
partir da conta pessoal no Banco Galáctico.</p>

<p>Todo personagem começa com o cartão, uma conta e uma quantia que depende da
classe.</p>

<h2>Quanto se começa</h2>
<p>Role os dados da sua classe e <strong>multiplique por 10.000</strong>.</p>

<table>
<thead><tr><th>classe</th><th>rolagem</th></tr></thead>
<tbody>${linhasCreditos}</tbody>
</table>

<blockquote><p>Um cosmonauta rola 2d10. Tirando 12, começa com
<strong>$120.000</strong>.</p></blockquote>

<p>Os créditos podem ser gastos <strong>antes de começar a jogar</strong>, para
comprar armas, vestes e equipamento.</p>

<p class='nota-casa'><em>Na ficha do Old Dragon 2 os créditos ficam no campo
<strong>CR</strong> do cabeçalho, que este módulo põe no lugar das peças de
ouro.</em></p>
`,
    },
    {
      title: "Armas",
      content: `
<h2>Como ler a tabela</h2>

<p><strong>Tipo</strong> — decide o modificador do ataque, pelo Capítulo 7:</p>
<ul>${Object.entries(TIPOS).map(([k, v]) => `<li><strong>${k}</strong> — ${v}</li>`).join("")}</ul>

<p><strong>Porte</strong> — muda o ataque conforme as mãos:</p>
<ul>${Object.entries(PORTES).map(([k, v]) => `<li><strong>${k}</strong> — ${v.replace(/^[a-zç]+ — /, "")}</li>`).join("")}</ul>

<p><strong>Alcance</strong> — três distâncias em metros, só para armas de fogo.
A primeira <strong>não tem penalidade</strong>; a segunda dá <strong>−2</strong>
e a terceira <strong>−4</strong> na rolagem de ataque. Arma corpo a corpo com
distância listada pode ser <strong>arremessada</strong>, e aí segue as mesmas
penalidades.</p>

<p><strong>Dano em área</strong> — quando o dano vem com uma medida em m², todos
na área fazem uma <strong>JPR</strong>: dano inteiro para quem falha,
<strong>metade</strong> para quem passa.</p>

<p><strong>Preço</strong> — em créditos. <strong>Arma sem preço é de cultura
primitiva</strong>, e não se compra: só se consegue com gente dessas culturas.</p>

<h2>Corte ou perfuração avaria a veste</h2>
<p>Quem é atingido por arma de projéteis, ou por qualquer arma que corte ou
perfure, faz uma <strong>JPR</strong>. Falhar <strong>por 5 ou mais</strong> dá
<strong>−2 no CP</strong> até a veste ser consertada.</p>

<h2>T5-1: Armas</h2>
<table>
<thead><tr><th>arma</th><th>tipo</th><th>porte</th><th>dano</th><th>alcance</th><th>preço</th><th>peso</th></tr></thead>
<tbody>${linhasArmas}</tbody>
</table>

<p class='nota-casa'><em>Todas estão no compêndio <strong>Equipamento</strong>,
prontas para arrastar. A ficha do Old Dragon 2 guarda <strong>uma</strong>
distância, então ela recebe a primeira faixa — a sem penalidade. As outras duas
estão na descrição de cada arma.</em></p>
`,
    },
    {
      title: "Vestes e proteção",
      content: `
<h2>A veste É o CP, não um bônus</h2>
<p>O <strong>valor de proteção</strong> da veste é a <strong>base</strong> do
coeficiente de proteção. Vestes médias dão CP 12 antes de qualquer outra coisa —
não "+12 sobre 10", como a classe de armadura do Old Dragon 2 funcionaria.</p>

<p>Sobre essa base entram o ajuste de Destreza, o bônus por nível da
<strong>T4-1</strong>, aparatos defensivos, mutações e poderes mentais.</p>

<p>O <strong>escudo de energia</strong> é a exceção: ele <strong>soma</strong>.
E não é carregado no braço — fica num cinto projetor, sempre ativo, sem ocupar
mão nenhuma.</p>

<p><strong>Redução de movimento</strong> — quantos metros a veste tira do
movimento base, antes dos modificadores de gravidade, terreno e carga.</p>

<h2>T5-2: Vestes e Itens de Proteção</h2>
<table>
<thead><tr><th>item</th><th>proteção</th><th>red. movimento</th><th>preço</th><th>peso</th></tr></thead>
<tbody>${linhasVestes}</tbody>
</table>

<p>Trajes <strong>aquáticos</strong> e <strong>espaciais</strong> não dão
proteção própria: somam-se à veste que já se está usando, com o peso, o preço e
a penalidade que trazem.</p>

<h2>T5-3: Vestes sob Encomenda</h2>
<table>
<thead><tr><th>serviço</th><th>preço</th><th>benefício</th></tr></thead>
<tbody>${linhasEncomenda}</tbody>
</table>

<p class='nota-casa'><em>A ficha do Old Dragon 2 soma o campo de bônus da
armadura à CA. Por isso as vestes vão com esse campo <strong>zerado</strong> e o
valor de proteção só na descrição — senão a ficha somaria duas vezes. Escreva o
CP à mão, pela fórmula do Capítulo 4.</em></p>
`,
    },
  ],
};
