// O journal do Capítulo 11.

import {
  CLICHES, INTERESSES, RELIQUIAS, SUPERFICIES, ATMOSFERAS,
  FAUNA_FLORA_SOCIEDADE, DRAGOES_T11_10,
} from "./mestre.mjs";
import { DRAGOES } from "./bestiario.mjs";

const tab = (cab, linhas) =>
  `<table><thead><tr>${cab.map((c) => `<th>${c}</th>`).join("")}</tr></thead>` +
  `<tbody>${linhas}</tbody></table>`;

const numerada = (lista) =>
  tab(["d" + lista.length, "resultado"],
    lista.map((x, i) => `<tr><td><strong>${i + 1}</strong></td><td>${x}</td></tr>`).join(""));

const reliquias = Object.entries(RELIQUIAS).map(([titulo, linhas]) =>
  `<h3>${titulo}</h3>` +
  tab(["rolagem", "resultado"], linhas.map((l) => `<tr><td>${l.faixa}</td><td>${l.r}</td></tr>`).join(""))
).join("\n");

const superficies = tab(
  ["1d10", "superfície", "fauna", "flora", "temperatura"],
  SUPERFICIES.map((s) =>
    `<tr><td><strong>${s.d}</strong></td><td><strong>${s.superficie}</strong></td>` +
    `<td>${s.fauna}</td><td>${s.flora}</td><td>${s.temp}</td></tr>`).join("")
);

const atmosferas = tab(
  ["1d10", "atmosfera", "respirável", "efeito colateral"],
  ATMOSFERAS.map((a) =>
    `<tr><td><strong>${a.d}</strong></td><td><strong>${a.atmosfera}</strong></td>` +
    `<td>${a.respiravel ? "sim" : "<strong>não</strong>"}</td><td>${a.efeito}</td></tr>`).join("")
);

const ffs = tab(
  ["1d8", "fauna predominante", "flora predominante", "organização social"],
  FAUNA_FLORA_SOCIEDADE.map((f) =>
    `<tr><td><strong>${f.d}</strong></td><td>${f.fauna}</td><td>${f.flora}</td><td>${f.social}</td></tr>`).join("")
);

const t1110 = tab(
  ["", ...DRAGOES_T11_10.colunas],
  DRAGOES_T11_10.linhas.map((l) =>
    `<tr><td><strong>${l.rotulo}</strong></td>${l.v.map((x) => `<td>${x}</td>`).join("")}</tr>`).join("")
);

const listaDragoes = DRAGOES.map((d) =>
  `<h3>${d.nome}${d.cientifico ? ` <em>${d.cientifico}</em>` : ""}</h3>` +
  `<p><em>${d.tipo}</em></p>` +
  (d.tamanho_dragao ? `<p><strong>Tamanhos:</strong> ${d.tamanho_dragao}</p>` : "") +
  (d.habitat ? `<p><strong>Habitat:</strong> ${d.habitat}</p>` : "") +
  (d.grandeza ? `<p><strong>Grandeza mental:</strong> ${d.grandeza}</p>` : "") +
  (d.texto ? `<p>${d.texto}</p>` : "")
).join("\n");

export const mestreJournal = {
  title: "Space Dragon — Seção do Mestre",
  pages: [
    {
      title: "Clichês e ganchos",
      content: `
<h2>O gênero é o pulp</h2>
<p>A ficção científica que o Space Dragon emula é a das revistas e quadrinhos da
primeira metade do século 20, e a dos desenhos animados repetidos à exaustão na
infância.</p>

<p>O livro faz questão de dizer que a mesa <strong>não precisa ficar presa
nisso</strong>: cyberpunk existencialista, monstro gigante japonês, ópera
espacial cômica, faroeste no espaço ou monges com espada laser cabem todos, com
pouco ou nenhum ajuste de regra.</p>

<h2>T11-1: Clichês de ficção científica pulp</h2>
${numerada(CLICHES)}

<h2>T11-2: Interesses de explorações</h2>
<p>Créditos não ficam jogados por aí. A riqueza vem de <strong>negociar o que se
traz</strong> de uma expedição: acadêmicos pagam por escrituras de planetas
abandonados, cientistas por um espécime vivo de planta carnívora, colecionadores
por arma arcaica.</p>

<p>O quanto vale depende da relevância do achado e da negociação na mesa.</p>

${numerada(INTERESSES)}
`,
    },
    {
      title: "Relíquias tecnológicas",
      content: `
<h2>Sete rolagens montam uma relíquia</h2>
<p>A T11-3 não é uma tabela: são sete, cada uma com o seu dado. Role todas.</p>

<p>⚠️ A <strong>instabilidade</strong> é a chance de a relíquia falhar. Um 10
significa que ela quebra na primeira utilização — o achado vira uma cena, não um
item.</p>

${reliquias}
`,
    },
    {
      title: "Gerando planetas",
      content: `
<h2>Superfície</h2>
<p>A superfície é o terreno da exploração, e ela puxa o clima e a chance de o
planeta ser habitado. Um planeta pode ter <strong>vários biomas</strong>: role
mais de uma vez.</p>

${superficies}

<h2>T11-6: Atmosfera</h2>
<p>A coluna que decide a sessão é <strong>respirável</strong>. Numa atmosfera não
respirável, sem traje espacial não há exploração.</p>

${atmosferas}

<h2>T11-7 a T11-9: Fauna, flora e sociedade</h2>
<p>A T11-5 já sugere fauna e flora pela superfície. Estas três existem para rolar
<strong>separadamente</strong>, quando se quer um planeta que contrarie o
esperado.</p>

${ffs}
`,
    },
    {
      title: "Dragões",
      content: `
<h2>Nove dragões, uma tabela</h2>
<p>Os dragões do Space Dragon <strong>não têm bloco de atributos próprio</strong>.
Todos usam a T11-10, e o que muda de um para o outro é o <strong>tamanho</strong>
em que aparecem, o habitat, a grandeza mental e o ataque especial.</p>

<p>Por isso eles não estão no compêndio de Bestiário: não há ator a montar sem
antes escolher a idade.</p>

<h2>T11-10: Características de Dragões</h2>
${t1110}

<h2>Os nove</h2>
${listaDragoes}
`,
    },
  ],
};
