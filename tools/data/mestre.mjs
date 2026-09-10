// Capítulo 11 — as tabelas da Seção do Mestre.
//
// São ferramentas de geração: role e use. Por isso viram tabela rolável no
// Foundry sempre que couber, e journal quando a tabela tem mais de uma coluna
// de resultado.

/** T11-1: clichês de ficção científica pulp. Rolável. */
export const CLICHES = [
  "Espécie alienígena inteligente faz contato",
  "Máquinas se rebelam contra seus criadores",
  "Espaçonave cai em um planeta hostil",
  "Ocorre uma guerra de dimensões galácticas",
  "Pesquisadores buscam a origem da espécie humana",
  "Androide ou ginoide se envolve amorosamente com um humano",
  "Nave apresenta defeitos e fica à deriva no espaço",
  "Heroína é raptada por um vilão maligno",
  "Viagem no tempo altera o universo como é conhecido",
  "Cientista louco brinca de divindade",
  "A nave dos protagonistas é raptada por outra nave gigantesca",
];

/** T11-2: interesses de explorações — o que motiva ou recompensa uma expedição. */
export const INTERESSES = [
  "Registro de espécie alienígena inteligente",
  "Máquina ancestral poderosa",
  "Recuperação de espaçonave acidentada",
  "Fonte de energia inesgotável e disputada",
  "Documentos ancestrais sobre a espécie humana",
  "Coleta de amostra vegetal alienígena",
  "Captura de espécime animal alienígena",
  "Relíquia tecnológica valiosa",
  "Segredo de estado ou militar",
];

/**
 * T11-3: relíquias tecnológicas.
 *
 * Não é uma tabela: são SEIS, cada uma com o próprio dado. Rola-se todas para
 * montar uma relíquia.
 */
export const RELIQUIAS = {
  "Tipo de relíquia (1d20)": [
    { faixa: "1–3", r: "Arma" }, { faixa: "4–6", r: "Veste" },
    { faixa: "7–9", r: "Item mundano" }, { faixa: "10–18", r: "Aparato tecnológico" },
    { faixa: "19", r: "Veículo" }, { faixa: "20", r: "Nave" },
  ],
  "Tipo de aparato (1d6)": [
    { faixa: "1–2", r: "Ofensivo" }, { faixa: "3–4", r: "Defensivo" }, { faixa: "5–6", r: "Utilitário" },
  ],
  "Nível tecnológico (1d20)": [
    { faixa: "1–3", r: "1º NT" }, { faixa: "4–6", r: "2º NT" }, { faixa: "7–8", r: "3º NT" },
    { faixa: "9–10", r: "4º NT" }, { faixa: "11–12", r: "5º NT" }, { faixa: "13–14", r: "6º NT" },
    { faixa: "15–16", r: "7º NT" }, { faixa: "17–18", r: "8º NT" }, { faixa: "19", r: "9º NT" },
    { faixa: "20", r: "10º NT" },
  ],
  "Instabilidade (1d10)": [
    { faixa: "1", r: "10%" }, { faixa: "2", r: "20%" }, { faixa: "3", r: "30%" },
    { faixa: "4", r: "40%" }, { faixa: "5", r: "50%" }, { faixa: "6", r: "60%" },
    { faixa: "7", r: "70%" }, { faixa: "8", r: "80%" }, { faixa: "9", r: "90%" },
    { faixa: "10", r: "Um defeito ocorre na primeira utilização e a relíquia é inutilizada." },
  ],
  "Particularidades (1d10)": [
    { faixa: "1–5", r: "Nenhuma" }, { faixa: "6–7", r: "Formato diferenciado" },
    { faixa: "8–9", r: "Duas relíquias em uma — role novamente" },
    { faixa: "10", r: "Utilizável por qualquer classe" },
  ],
  "Criadores (1d10)": [
    { faixa: "1–5", r: "Humanos" }, { faixa: "6–7", r: "Espécie humanoide" },
    { faixa: "8–9", r: "Xhenianos" }, { faixa: "10", r: "Desconhecidos" },
  ],
  "Consequências de uso (1d10)": [
    { faixa: "1–5", r: "Nenhuma" }, { faixa: "6–7", r: "Instabilidade deteriora" },
    { faixa: "8–9", r: "Contaminação radioativa" }, { faixa: "10", r: "Relíquia inteligente" },
  ],
};

/** T11-5: superfícies planetárias, em 1d10. */
export const SUPERFICIES = [
  { d: 1, superficie: "Planícies", fauna: "Mamíferos, répteis e aves", flora: "Gramíneas", temp: "Moderada" },
  { d: 2, superficie: "Colinas", fauna: "Mamíferos e aves", flora: "Árvores diversas e gramíneas", temp: "Moderada" },
  { d: 3, superficie: "Montanhas", fauna: "Mamíferos, répteis e aves de rapina", flora: "Coníferas e gramíneas", temp: "Baixa" },
  { d: 4, superficie: "Vulcões", fauna: "Répteis", flora: "Líquen", temp: "Altíssima" },
  { d: 5, superficie: "Pântanos", fauna: "Insetos, répteis e fungos", flora: "Plantas aquáticas e manguezal", temp: "Moderada" },
  { d: 6, superficie: "Geleiras", fauna: "Mamíferos terrestres, aquáticos e peixes", flora: "Inexistente", temp: "Baixíssima" },
  { d: 7, superficie: "Tundras", fauna: "Mamíferos e aves", flora: "Líquen e gramíneas", temp: "Baixa" },
  { d: 8, superficie: "Desertos", fauna: "Répteis e insetos", flora: "Palmeiras e gramíneas", temp: "Altíssima de dia, baixíssima à noite" },
  { d: 9, superficie: "Florestas", fauna: "Mamíferos, insetos e répteis", flora: "Árvores diversas e gramíneas", temp: "Moderada" },
  { d: 10, superficie: "Cidades", fauna: "Mamíferos roedores, aves urbanas e domesticados", flora: "Arborização urbana", temp: "Moderada" },
];

/** T11-6: atmosfera, em 1d10. `respiravel` é o que decide se precisa de traje. */
export const ATMOSFERAS = [
  { d: 1, atmosfera: "Padrão", respiravel: true, efeito: "Nenhum." },
  { d: 2, atmosfera: "Tóxica", respiravel: false, efeito: "A exposição ao ar gera 50% de chance de contaminação por veneno." },
  { d: 3, atmosfera: "Rarefeita", respiravel: true, efeito: "Cansaço maior do que o normal." },
  { d: 4, atmosfera: "Poluída", respiravel: false, efeito: "A exposição ao ar gera 30% de chance de contaminação por doença." },
  { d: 5, atmosfera: "Úmida", respiravel: true, efeito: "Equipamentos eletrônicos podem apresentar defeitos e enferrujar." },
  { d: 6, atmosfera: "Radioativa", respiravel: false, efeito: "Permanência sem traje de proteção causa contaminação radioativa imediatamente." },
  { d: 7, atmosfera: "Seca", respiravel: true, efeito: "É necessário ingerir o dobro de líquido para evitar a desidratação." },
  { d: 8, atmosfera: "Anaeróbica", respiravel: false, efeito: "A falta de oxigênio torna impossível respirar." },
  { d: 9, atmosfera: "Desprotegida", respiravel: true, efeito: "Traje espacial é recomendado, pelos raios nocivos do sol do planeta." },
  { d: 10, atmosfera: "Ácida", respiravel: false, efeito: "Causa dano por ácido fraco a cada minuto de exposição, a personagens e objetos. O dano não regride." },
];

/** T11-7 a T11-9: fauna, flora e organização social, em 1d8. */
export const FAUNA_FLORA_SOCIEDADE = [
  { d: 1, fauna: "Mamíferos terrestres", flora: "Gramíneas", social: "Monarquia" },
  { d: 2, fauna: "Répteis terrestres", flora: "Árvores diversas", social: "Ditadura" },
  { d: 3, fauna: "Insetos terrestres e voadores", flora: "Líquen", social: "Democracia" },
  { d: 4, fauna: "Peixes, mamíferos e répteis aquáticos", flora: "Plantas aquáticas", social: "Hierarquia de castas" },
  { d: 5, fauna: "Aves aladas e terrestres", flora: "Vegetação alienígena", social: "Coletivismo" },
  { d: 6, fauna: "Fungos e micro-organismos", flora: "Inexistente", social: "Parlamentarismo" },
  { d: 7, fauna: "Role novamente", flora: "Role novamente", social: "Poder financeiro" },
  { d: 8, fauna: "Role novamente", flora: "Role novamente", social: "Sem organização formal" },
];

/**
 * T11-10: características de dragões.
 *
 * Os nove dragões não têm bloco de atributos próprio: todos usam esta tabela,
 * e o que muda entre eles é o TAMANHO em que aparecem, o habitat, a grandeza
 * mental e o ataque especial.
 */
export const DRAGOES_T11_10 = {
  colunas: ["jovem", "adulto", "ancião"],
  linhas: [
    { rotulo: "Atributos", v: [
      "FOR 25 · DES 10 · CON 17 · INT 16 · CIE 8 · COM 8",
      "FOR 33 · DES 10 · CON 21 · INT 20 · CIE 10 · COM 10",
      "FOR 45 · DES 10 · CON 31 · INT 30 · CIE 15 · COM 15",
    ] },
    { rotulo: "CP", v: ["14 (couraça grossa +4)", "26 (couraça grossa +16)", "44 (couraça grossa +34)"] },
    { rotulo: "JP", v: ["14", "11", "2"] },
    { rotulo: "DV", v: ["8+3 (35/67)", "14+5 (61/117)", "24+10 (106/202)"] },
    { rotulo: "Resistência mental", v: ["—", "25%", "70%"] },
    { rotulo: "Redução de dano", v: ["—", "10/energia", "25/energia"] },
    { rotulo: "Ataques", v: [
      "2 garras +14 (2d6+4) · 1 mordida +6 (1d8+1)",
      "2 garras +28 (4d6+12) · 1 mordida +18 (3d8+3)",
      "2 garras +49 (7d6+30) · 1 mordida +36 (6d8+6)",
    ] },
    { rotulo: "Movimento telepático", v: ["15 m", "25 m", "35 m"] },
    { rotulo: "Movimento", v: ["5 m, voando 10 m", "10 m, voando 20 m", "15 m, voando 30 m"] },
    { rotulo: "Prêmios", v: ["1.015 XP", "2.730 XP", "7.500 XP"] },
  ],
};
