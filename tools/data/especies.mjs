// Espécies do Capítulo 2 do Livro Básico Aprimorado.
//
// As regras vêm do Livro Básico Aprimorado e de nenhuma outra fonte. Onde o
// texto cita um atributo, a ficha diz também EM QUAL CAMPO da ficha do OD2
// anotá-lo — que é convenção deste módulo, não conversão de regra. Ver
// onde-anotar.mjs.

import { ondeAnotar } from "./onde-anotar.mjs";

/** Nota de rodapé comum: o que a ficha do OD2 não consegue aplicar sozinha. */
const AJUSTE_MANUAL =
  "<p class='nota-casa'><em>A ficha do Old Dragon 2 não aplica ajuste de espécie " +
  "sozinha: some o valor no atributo à mão.</em></p>";

export const especies = [
  {
    nome: "Humano",
    flavor: "<p><em>Homo sapiens</em> — a espécie mais comum da galáxia.</p>",
    movement: 9,
    infravision: 0,
    alignment_tendency: "none",
    alignment_notes: "Nenhuma: há culturas humanas com as mais diversas crenças e valores.",
    descricao:
      "<p>Primatas de um planeta esquecido e remoto. De longe a espécie inteligente mais comum da " +
      "galáxia, reivindicam o título de primeiros seres sapientes do universo — e, pela superioridade " +
      "numérica e influência, raramente encontram quem conteste.</p>" +
      "<p>Criaram o <em>Homo machina</em>, e são eles que regulam quais populações humanas divergiram " +
      "o bastante para virarem <em>Homo novus</em>.</p>" +
      "<p><strong>Maturidade</strong> aos 16 anos · <strong>expectativa de vida</strong> de cerca de " +
      "80 anos galácticos · <strong>altura</strong> de 1,60 m a 2,00 m.</p>",
    habilidades: [
      {
        nome: "Diversidade e Adaptabilidade",
        desc:
          "<p>A diversidade de genes e culturas concede <strong>+2 em um atributo à escolha do " +
          "jogador</strong> e <strong>−2 em outro</strong>.</p>" +
          "<p>A cada <strong>4 níveis</strong>, escolha um atributo e aumente-o em <strong>1 " +
          "ponto</strong>.</p>" + AJUSTE_MANUAL,
      },
    ],
  },

  {
    nome: "Androide",
    flavor: "<p><em>Homo machina</em> — indistinguível de um humano, e legalmente igual a ele.</p>",
    movement: 9,
    infravision: 0,
    alignment_tendency: "none",
    descricao:
      "<p>Robôs aprimorados por gerações até imitarem humanos com tal fidelidade que passaram a " +
      "reivindicar a condição de iguais — e a conquistaram. Não foram classificados como " +
      "<em>Homo sapiens</em>, mas a dependência que a sociedade tinha deles rendeu o nome " +
      "<em>Homo machina</em>.</p>" +
      "<p>Fazem tudo o que um humano faz, mas <strong>dispensam oxigênio, água e alimento</strong>. " +
      "Não têm sistema reprodutor: novos indivíduos nascem em laboratório.</p>" +
      "<p><strong>São construídos já adultos</strong> e não envelhecem, mas o cérebro positrônico não " +
      "tem memória infinita: a <strong>vida útil estimada é de 100 anos</strong>. A morte é relativa " +
      "— a personalidade é programada no cérebro e pode ser transplantada para outro corpo.</p>",
    habilidades: [
      {
        nome: "Resistência Física",
        desc: `<p>Mais fortes que humanos comuns: <strong>+2</strong> em ${ondeAnotar("forca")}.</p>` + AJUSTE_MANUAL,
      },
      {
        nome: "Corpo Robótico",
        desc:
          "<p><strong>Vence automaticamente qualquer Jogada de Proteção física</strong> — exceto os " +
          "testes de estabilização com pontos de vida negativos.</p>" +
          "<p><strong>Nunca recupera pontos de vida naturalmente.</strong> Sempre precisa de reparo " +
          "especializado.</p>" +
          "<p class='nota-casa'><em>No OD2 a JP física é a <strong>JPC</strong> (Constituição). " +
          "\"Vence automaticamente\" não é bônus: é sucesso sem rolar.</em></p>",
      },
      {
        nome: "Cérebro Positrônico",
        desc:
          "<p>O cérebro emula a mente humana com 95% de exatidão, o que dá <strong>5% de resistência " +
          "a poderes mentais</strong>.</p>" +
          `<p>A falha justamente na emulação social cobra o preço: <strong>−2</strong> em ${ondeAnotar("comunicacao")}.</p>` +
          AJUSTE_MANUAL,
      },
    ],
  },

  {
    nome: "Mutante",
    flavor: "<p><em>Homo novus</em> — todo aprimoramento vem com uma degeneração.</p>",
    movement: 9,
    infravision: 0,
    alignment_tendency: "none",
    descricao:
      "<p>A mistura dos genes humanos por quase um milhão de anos gerou variações tão distantes da " +
      "linha evolutiva padrão que se convencionou classificar quem as carrega como " +
      "<em>Homo novus</em>. A chance de um bebê humano nascer mutante é de cerca de " +
      "<strong>0,1%</strong> — mas com a população da galáxia passando dos trilhões, são milhões de " +
      "indivíduos. Em comunidades isoladas a probabilidade pode chegar a 100%.</p>" +
      "<p>Enfrentam mais resistência que os <em>Homo machina</em>, e em geral consideram o termo " +
      "\"mutante\" ofensivo.</p>" +
      "<p><strong>O balanço genético:</strong> todo aprimoramento evolutivo vem acompanhado de uma " +
      "degeneração. Não há um sem o outro.</p>",
    habilidades: [
      {
        nome: "Balanço Genético",
        desc:
          "<p>Role <strong>2d10</strong> na tabela <strong>T2-1</strong>: um dado na coluna de " +
          "<strong>aprimoramentos</strong>, o outro na de <strong>degenerações</strong>.</p>" +
          "<p><strong>Resultados iguais são rerrolados</strong> até saírem diferentes — sem isso " +
          "sairia, por exemplo, <em>Recuperação acelerada</em> com <em>Recuperação lenta</em>, que se " +
          "anulam.</p>" +
          "<p>Use a tabela rolável <strong>T2-1: Mutações</strong> do compêndio de Tabelas, e arraste " +
          "as duas mutações sorteadas do compêndio <strong>Mutações</strong> para a ficha.</p>",
      },
      {
        nome: "Herança Humana",
        desc:
          "<p>Fora as duas mutações, o Mutante é um Humano — mesmo movimento, mesma liberdade de " +
          "classe.</p>" +
          "<p><strong>Mas não recebe</strong> o bônus de +2 num atributo, a penalidade de −2 em outro, " +
          "nem o incremento de 1 ponto a cada 4 níveis. O livro é explícito: as mutações ocupam esse " +
          "lugar.</p>",
      },
    ],
  },
];
