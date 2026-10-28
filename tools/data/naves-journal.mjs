// O journal do Capítulo 10.

import {
  NAVES, VEICULOS, FONTES, DADO_DE_GASTO, T10_5,
  T10_6_ORDEM, T10_6_CRITICOS, T10_6_FALHAS,
  PILOTAGEM_IMPROVISADA, SERVICOS_ESTACAO,
} from "./naves.mjs";
import { EQUIPAMENTOS_DE_NAVE } from "../../spacedragon-module/module/equipamentos-nave.js";
import { LADO_POR_TAMANHO } from "../../spacedragon-module/module/nave-token.js";
import { XP_POR_TIPO } from "../../spacedragon-module/module/nave-xp.js";
import { TIPOS } from "../../spacedragon-module/module/tipos-de-nave.js";
import { AVARIAS } from "../../spacedragon-module/module/nave-combate.js";
import { CAMARAS } from "../../spacedragon-module/module/camaras.js";

/* ── O GUIA RÁPIDO: os números vêm das mesmas fontes que a ficha usa ───────── */

/** Uma cena de combate espacial: quantos metros vale um quadrado. */
const METROS_POR_QUADRADO = 10;
const quadrados = (m) => (Math.round((m / METROS_POR_QUADRADO) * 10) / 10).toLocaleString("pt-BR");
const metrosDe = (mov) => Number(String(mov ?? "").match(/\d+/)?.[0] ?? 0);

const linhasDeMovimento = Object.values(TIPOS)
  .map((t) => `<tr><td>${t.rotulo}</td><td>${t.tamanho}</td><td>${t.mov}</td>` +
    `<td>${quadrados(metrosDe(t.mov))}</td><td>${LADO_POR_TAMANHO[t.tamanho]}×${LADO_POR_TAMANHO[t.tamanho]}</td></tr>`)
  .join("");

const linhasDeAlcance = Object.values(EQUIPAMENTOS_DE_NAVE)
  .filter((e) => e.efeito?.arma?.alcance)
  .map((e) => {
    const [c, m, l] = e.efeito.arma.alcance;
    return `<tr><td>${e.rotulo}</td><td>${e.efeito.arma.dano}</td>` +
      `<td>${c} m · ${quadrados(c)}</td><td>${m} m · ${quadrados(m)}</td><td>${l} m · ${quadrados(l)}</td></tr>`;
  })
  .join("");

// as avarias saem da lista única do disparo (nave-combate.js): o guia não
// pode dizer um prazo e a ficha contar outro
const AVARIAS_DO_GUIA = Object.values(AVARIAS)
  .map((a) => `<tr><td>${a.rotulo}</td><td>${a.efeito}</td>` +
    `<td>${a.prazo ? `${a.prazo} rodada(s)` : "sai no fim da rodada"}</td>` +
    `<td>${a.camara ? CAMARAS[a.camara].rotulo : "—"}</td></tr>`)
  .join("");

const linhasDeXP = Object.entries(TIPOS)
  .map(([chave, t]) => `<tr><td>${t.rotulo}</td><td>${XP_POR_TIPO[chave].toLocaleString("pt-BR")}</td></tr>`)
  .join("");

const tab = (cab, linhas) =>
  `<table><thead><tr>${cab.map((c) => `<th>${c}</th>`).join("")}</tr></thead>` +
  `<tbody>${linhas}</tbody></table>`;

const linhaVeiculo = (n) =>
  `<tr><td><strong>${n.nome}</strong>${n.desc ? `<br><em>${n.desc}</em>` : ""}</td>` +
  `<td>${n.tamanho}</td><td>${n.tripulacao}</td><td>${n.pv}</td>` +
  `<td>${n.ba}</td><td>${n.cp}</td><td>${n.jp}</td><td>${n.mov}</td></tr>`;

const COLS = ["tipo", "tamanho", "tripulação", "PV", "BA", "CP", "JP", "movimento"];

const d6 = (linhas) =>
  tab(["1d6", "efeito"], linhas.map((l) => `<tr><td><strong>${l.d6}</strong></td><td>${l.efeito}</td></tr>`).join(""));

export const navesJournal = {
  title: "Space Dragon — Espaçonaves e Estações",
  pages: [
    {
      title: "A nave como personagem",
      content: `
<h2>Ela tem ficha, com outras contas</h2>
<p>Uma espaçonave tem <strong>PV, BA, CP e JP</strong>, como qualquer personagem.
Três coisas mudam:</p>

<ul>
<li><strong>Os PV são rolados</strong>, não fixos. Um caça tem 1d100; um cruzador,
2d1000.</li>
<li><strong>A JP não vem de atributo nenhum.</strong> O modificador dela sai de um
<em>teste de pilotagem</em> — o piloto rola primeiro, e o quanto ele foi bem
decide o bônus da nave.</li>
<li><strong>O ataque soma dois bônus</strong>: o BA da nave e o BA à distância de
quem estiver operando a arma.</li>
</ul>

<h2>Regra da casa: a nave é modular</h2>
<p><em>Opcional, ligada por padrão: desligue em <strong>Configurações › Space Dragon › Nave modular</strong> para jogar só com o livro. Desligada, a aba Câmaras só marca o que a nave tem.</em></p>
<p>Toda nave sai de fábrica com o <strong>mínimo para voar e manter todos vivos</strong>:</p>
<ul>
<li><strong>Ponte de Comando</strong> — sem ela, não se pilota nem se opera arma ou escudo;</li>
<li><strong>Sala de Máquinas</strong> — motor, gerador e tanques;</li>
<li><strong>casco e suporte de vida</strong> — a defesa contra o vácuo, que é o CP do tipo de nave.</li>
</ul>
<p>As outras câmaras da T10-2 — Aposentos, Arsenal, Laboratório e as demais — <strong>se
compram</strong>, pelo preço e prazo de obra da tabela. O tamanho limita quantas cabem além
das de fábrica: <strong>Pequena 0, Média 2, Gigantesca 4, Colossal 6</strong>. Passar do
limite é decisão do Mestre (nave de enredo, reforma), e a ficha avisa.</p>
<p>Na ficha, a aba <em>Câmaras</em> mostra o que veio de fábrica, o que foi comprado e o
limite. Para comprar, clique em <em>comprar</em> na câmara ou arraste-a do compêndio; a
ficha confirma o preço e registra a obra no chat. Os créditos saem de quem paga, à mão.</p>

<h2>T10-1: Tipos de Espaçonaves</h2>
${tab(COLS, NAVES.map(linhaVeiculo).join(""))}

<h2>T10-7: Veículos terrestres, aquáticos e aéreos</h2>
<p>Mesmas colunas, mesmas regras.</p>
${tab(COLS, VEICULOS.map(linhaVeiculo).join(""))}

<h2>Gente atirando em nave, e nave atirando em gente</h2>
<p>Personagens <strong>podem</strong> atacar naves com armas comuns. O CP alto
torna difícil, não impossível — e granadas e mísseis forçam uma
<strong>JP da nave</strong>, o que costuma render mais.</p>

<p>No sentido contrário a regra muda, porque exploradores espaciais desviam de
laser: os alvos fazem uma <strong>JPR</strong> e, passando, sofrem
<strong>metade do dano</strong>. Role o ataque para cada alvo, somando o BA da
nave e o do operador. <strong>A cada 20 pontos no resultado, os alvos levam −2
na JPR</strong> — um ataque de 37 dá −2; um de 41 dá −4.</p>
`,
    },
    {
      title: "Pilotagem",
      content: `
<h2>Quando se rola</h2>
<p>Para o <strong>cosmonauta</strong>, manobra rotineira — decolar, aterrissar,
manobrar normalmente — <strong>não pede teste</strong>. Pedem teste as viagens
longas, as entradas em atmosfera, o combate e as situações de tensão: fuga, mau
funcionamento.</p>

<p>⚠️ <strong>Para todas as outras classes, qualquer situação exige teste.</strong></p>

<h2>Pilotagem improvisada</h2>
<p>Quem não é cosmonauta pilota com o que tem:</p>
<ul>${Object.entries(PILOTAGEM_IMPROVISADA)
  .map(([c, r]) => `<li><strong>${c}</strong> — ${r}</li>`).join("")}</ul>

<p>Se o talento usado parou de progredir por causa de uma especialização, vale a
porcentagem <strong>do nível em que parou</strong>.</p>

<h2>Nave avariada pilota pior</h2>
<p>O Mestre desconta uma penalidade percentual conforme a gravidade das avarias,
em degraus de 5%, até o teto de <strong>50%</strong>. Um cosmonauta de 1º nível
com 80% e penalidade de 20% testa com 60%.</p>

<p>Para quem quiser precisão, o livro sugere <strong>5% de penalidade a cada 10%
de PV perdidos</strong>. Uma nave de 200 PV que sofreu 70 de dano perdeu mais de
30% e menos de 40%: penalidade de 15%.</p>

<p>⚠️ Mesmo que a penalidade zere a porcentagem, ainda se rola — a falha crítica
e o sucesso crítico continuam existindo.</p>

<h2>T10-5: o teste de pilotagem vira o modificador da JP</h2>
<p>Antes de qualquer JP da nave, o piloto testa. O resultado dele dá o
modificador do d20 da nave.</p>

${tab(["resultado do teste", "modificador na JP"],
  T10_5.map((l) => `<tr><td>${l.resultado}</td><td>${l.mod > 0 ? `+${l.mod}` : l.mod}</td></tr>`).join(""))}
`,
    },
    {
      title: "Energia e combustível",
      content: `
<h2>Um tanque só, de 0% a 100%</h2>
<p>Não importa quantos reservatórios a nave tenha: o combustível é
<strong>uma porcentagem</strong>, de 0 a 100. Ela cai ao cruzar o espaço, ao
manobrar, ao decolar e ao aterrissar.</p>

<p>O preço da tabela é <strong>por ponto percentual</strong>. Abastecer 10%
custa dez vezes o valor listado.</p>

<h2>T10-3: Fontes de Energia</h2>
${tab(["fonte", "raridade", "custo por ponto % (P/M/G/C)", "autonomia"],
  FONTES.map((f) => `<tr><td>${f.fonte}</td><td>${f.raridade}</td><td>${f.custo}</td><td>${f.autonomia}</td></tr>`).join(""))}

<h2>Quanto se gasta: não há tabela</h2>
<p>O livro é explícito ao dizer que <em>"não há uma tabela de quanto combustível
uma espaçonave gasta"</em>. No lugar, um procedimento em dois passos:</p>

<ol>
<li>A <strong>autonomia da fonte</strong> escolhe o dado:
${Object.entries(DADO_DE_GASTO).map(([a, d]) => `<strong>${a}</strong> usa ${d}`).join(", ")}.</li>
<li>O Mestre atribui de <strong>1 a 3</strong> conforme o quanto a ação custa, e
rola essa quantidade de dados.</li>
</ol>

<blockquote><p>Uma nave a reator atômico (autonomia alta, d2) numa manobra cara
(3) rola <strong>3d2</strong> — de 3% a 6% do tanque.</p></blockquote>
`,
    },
    {
      title: "Combate espacial",
      content: `
<h2>A ordem de ação é outra</h2>
<p>⚠️ <strong>A T10-6 não é a T7-2.</strong> A ordem de ação das naves usa valores
diferentes dos personagens:</p>

${tab(["ação", "valor"], T10_6_ORDEM.map((l) => `<tr><td>${l.acao}</td><td>${l.valor}</td></tr>`).join(""))}

<p>Continua valendo o resto: age primeiro o <strong>menor</strong> resultado.</p>
<p><em>Os cinco postos da tripulação, as quinze ações e a câmara danificada que cala a nave não são do livro: vêm das Regras Compiladas. Ficam ligados por padrão e se desligam em <strong>Configurações › Space Dragon › Combate de naves das Regras Compiladas</strong>.</em></p>

<h2>As ações</h2>
<ul>
<li><strong>Disparo de armas</strong> — 1d20 mais o BA da nave mais o BA à
distância de quem opera. Iguala ou supera o CP da nave alvo e causa dano. Dá
para disparar <strong>uma vez por arma instalada</strong>, desde que haja gente
controlando cada uma.</li>
<li><strong>Ativar equipamento</strong> — escudos, defletores. O Mestre pode
pedir um teste de operar máquinas, com penalidade se houver avaria.</li>
<li><strong>Manobras evasivas</strong> — <strong>só naves pequenas</strong>.
Permitem usar a <strong>JP no lugar do CP</strong> para evitar um ataque, mas só
uma vez a cada <strong>5 rodadas</strong>, sempre pedem teste de pilotagem, e
falhar significa não poder fazer a JP. Costumam gastar combustível.</li>
</ul>

<h2>T10-6: Acertos críticos de espaçonave</h2>
${d6(T10_6_CRITICOS)}

<h2>T10-6: Falhas críticas de espaçonave</h2>
${d6(T10_6_FALHAS)}
`,
    },
    {
      title: "Estações espaciais",
      content: `
<h2>O que existe numa estação</h2>
<p>Todas as câmaras que existem numa nave existem nas estações, em maior número
e tamanho. Estações populosas têm qualquer serviço que se precise, salvo o
Mestre decidir o contrário pela função e pela localização dela.</p>

<p>Muitas têm armamento, e <strong>agem de forma hostil</strong> contra naves não
identificadas ou suspeitas.</p>

<h2>T10-8: Serviços em Estações Espaciais</h2>
${tab(["serviço", "preço", "o que é"],
  SERVICOS_ESTACAO.map((s) => `<tr><td><strong>${s.servico}</strong></td><td>${s.preco}</td><td>${s.desc}</td></tr>`).join(""))}

<h2>Naves são masmorras no espaço</h2>
<p>O livro faz questão de dizer: uma tripulação explorando uma nave abandonada é
um <em>dungeon crawl</em> com laser no lugar de espada. Salas a investigar,
inimigos a derrotar, tesouros a achar. As armadilhas são sistemas de segurança,
os mortos-vivos são robôs, e o enigma mágico vira senha de acesso.</p>

<p>E dá para inverter: se os inimigos acoplarem a nave deles à do grupo, são os
personagens que defendem a própria masmorra dos invasores.</p>
`,
    },
    // Por último, de propósito: o id da página leva a posição dela (lib.mjs
    // › journalDoc), e uma página no meio trocaria o id das que vêm depois.
    {
      title: "Guia rápido de combate espacial",
      content: `
<p>O resumo da mesa para o combate de naves. O que é do <strong>livro</strong> está
marcado assim; o que é <strong>regra da casa</strong> também. Os críticos e as falhas
estão na página <em>Combate espacial</em>.</p>

<h2>O mapa (regra da casa)</h2>
<p>Uma cena só para naves, com <strong>${METROS_POR_QUADRADO} m por quadrado</strong>. Em
<em>Configurar Cena › Grid</em>: distância <strong>${METROS_POR_QUADRADO}</strong>, unidade
<strong>m</strong>. O disparo da Ficha de Nave mede a distância pela escala da cena; fora de
metros, ele avisa e a faixa é escolhida à mão.</p>
${tab(["tipo", "tamanho", "movimento (livro)", "quadrados por turno", "token"], linhasDeMovimento)}
<p>Movimentação dupla dobra o movimento. O token é posto no tamanho do tipo ao criar a
nave ou trocar o tipo; o Mestre pode redimensionar à mão depois.</p>

<h2>Alcance das armas (regra da casa)</h2>
<p>A T10-4 dá só o dano. As faixas seguem as armas pessoais (T5-1): curta sem
penalidade, média <strong>−2</strong>, longa <strong>−4</strong>; além da longa, fora de alcance.</p>
${tab(["arma", "dano", "curta", "média (−2)", "longa (−4)"], linhasDeAlcance)}

<h2>A rodada (livro)</h2>
<p>A ordem de ação é a <strong>T10-6</strong>, e age primeiro o <strong>menor</strong> valor:</p>
${tab(["ação", "valor"], T10_6_ORDEM.map((l) => `<tr><td>${l.acao}</td><td>${l.valor}</td></tr>`).join(""))}
<ul>
<li><strong>Disparo de armas</strong> — 1d20 + BA da nave + BA à distância de quem opera,
contra o CP do alvo. Uma vez por arma instalada, com alguém em cada uma. O Computador
Balístico dá +2, com a Ponte operacional.</li>
<li><strong>Ativar equipamento</strong> — escudos, defletores. O Mestre pode pedir Operar
Máquinas, com penalidade se houver avaria.</li>
<li><strong>Manobra evasiva</strong> — só naves pequenas, uma vez a cada 5 rodadas, com teste
de pilotagem: a nave usa a <strong>JP no lugar do CP</strong> para evitar um ataque. Falhar
o teste é não poder fazer a JP. Costuma gastar combustível.</li>
</ul>

<h2>A JP da nave (livro, T10-5)</h2>
<p>Antes de qualquer JP da nave, o piloto testa pilotagem, e o resultado vira o
modificador do d20:</p>
${tab(["resultado do teste", "modificador na JP"],
  T10_5.map((l) => `<tr><td>${l.resultado}</td><td>${l.mod > 0 ? `+${l.mod}` : l.mod}</td></tr>`).join(""))}

<h2>Iniciativa (Old Dragon 2)</h2>
<p>Com a Ordem de Ação desligada (o padrão), a mesa usa a iniciativa do Old Dragon 2:
<strong>1d20 ≤ maior entre Destreza e Intelecto</strong>, uma vez por combate; quem passa age
antes dos PNJs, quem falha, depois. A nave testa com quem está no <strong>Leme</strong>. O botão
<em>Rolar iniciativa</em> fica no topo da aba de ataques da ficha de personagem e da de nave.</p>

<h2>O disparo, com a tripulação (1.31)</h2>
<p>A Ficha de Nave soma sozinha tudo o que a rodada pôs em jogo, e o cartão no chat mostra
cada parte:</p>
<ul>
<li><strong>Ataque:</strong> BA da nave + Balístico + artilheiro + faixa, mais Firmar (+2),
alvo travado pelos Sensores (+2), Rajada (−5), nave suprimida (−2), interferência do alvo (−2)
e as avarias (armas −5, sensores −2). Sem Ponte, ou em pane geral, a nave não atira.</li>
<li><strong>CP do alvo:</strong> o da ficha, mais o Escudo de força, a energia nos Escudos
(+2 por ponto) e o casco avariado (−5).</li>
<li><strong>Dano:</strong> o dado da arma, +1 dado de energia nas Armas (num acerto),
+1 da Rajada e, <strong>por margem (casa)</strong>, +1 dado a cada 5 pontos acima do CP. Depois o
multiplicador da mesa (casa, ×1 a ×3) e o ×2 do crítico.</li>
<li><strong>Crítico e falha:</strong> o 1d6 da T10-6 é rolado no próprio cartão, e as avarias
do crítico entram no alvo.</li>
<li><strong>Metralhadora:</strong> os 4 ataques saem no mesmo cartão.</li>
<li><strong>Aplicar:</strong> o Mestre clica no botão do cartão. O escudo absorve, o PV desce
e as avarias entram com a rodada do combate.</li>
</ul>

<h2>Escudo como reserva (regra da casa)</h2>
<p>Em vez de +10 no CP, o Escudo de força absorve dano por combate: <strong>20</strong> (Média),
<strong>50</strong> (Gigantesca), <strong>100</strong> (Colossal). Cada ponto de energia nos Escudos
absorve mais 5 na rodada. Num combate novo ele volta cheio. Desligue em
<em>Configurações › Space Dragon</em> para usar o +10 do livro.</p>

<h2>Avarias (Controle de avarias)</h2>
${tab(["avaria", "efeito", "prazo", "câmara se o prazo vencer"], AVARIAS_DO_GUIA)}
<p>Vêm do crítico da T10-6 e, <strong>na casa</strong>, de todo acerto que tire <strong>10% ou mais do
PV máximo</strong> do alvo (1d6: motor, armas, casco, sensores, escudos, tripulação). A Engenharia
<strong>Repara</strong> uma por ação. Prazo vencido: a câmara fica danificada (obra a 25%, metade do
prazo), e a penalidade continua até o Reparar.</p>

<h2>Energia e Calor (camada de energia)</h2>
<p>O reator dá <strong>2 / 3 / 4 / 6</strong> pontos por rodada (P / M / G / C). Um ponto compra
+2 na JP, +2 no CP ou +1 dado de dano; <strong>dois pontos compram uma ação extra</strong> para um
posto. A energia não acumula. O <strong>Calor</strong>, sim: +1 por ponto forçado e por ação extra;
no fim da rodada a nave perde 1 e o Mestre rola <strong>1d6 ≤ Calor</strong> para avaria na Sala de
Máquinas. A Engenharia pode <strong>Ventilar</strong> (−2).</p>

<h2>XP de nave abatida (regra da casa)</h2>
<p>O livro não dá XP a naves. No fim do combate, as naves inimigas entram nos derrotados
do cartão do Qualidade de Vida com estes valores, e a XP vai para a tripulação. O Mestre
troca o valor de uma nave no Painel de Voo dela.</p>
${tab(["tipo", "XP"], linhasDeXP)}
`,
    },
  ],
};
