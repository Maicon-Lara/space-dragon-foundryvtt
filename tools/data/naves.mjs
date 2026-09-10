// Capítulo 10 — Espaçonaves, Veículos e Estações.
//
// ── A NAVE É UM PERSONAGEM, COM OUTRAS CONTAS ───────────────────────────────
//
// Ela tem PV, BA, CP e JP como qualquer um — mas:
//
//   · os PV são ROLADOS (1d100, 2d1000…), não fixos;
//   · a JP não vem de atributo nenhum. O modificador dela sai de um TESTE DE
//     PILOTAGEM, pela T10-5: o piloto rola primeiro, e o quão bem ele foi
//     decide o bônus da JP da nave;
//   · o ataque soma o BA DA NAVE e o BA à distância de QUEM opera a arma.
//
// ── A ORDEM DE AÇÃO TAMBÉM MUDA ─────────────────────────────────────────────
//
// A T10-6 tem a sua própria, diferente da T7-2 dos personagens: disparo usa o
// dado de dano da arma, ativar equipamento usa o BÔNUS DE ATAQUE, e manobra
// evasiva ou movimento duplo usa o VALOR DA JOGADA DE PROTEÇÃO.
//
// ── COMBUSTÍVEL NÃO TEM TABELA ──────────────────────────────────────────────
//
// O livro é explícito: "não há uma tabela de quanto combustível uma espaçonave
// gasta". A regra é um procedimento — a autonomia da fonte escolhe o dado
// (baixa d6, média d4, alta d2), o Mestre atribui de 1 a 3 pela ação, e rola
// essa quantidade de dados.

/** T10-1: os oito tipos de espaçonave. */
export const NAVES = [
  { nome: "Caça", tamanho: "Pequena", tripulacao: "1", pv: "1d100", ba: "+16", cp: "28", jp: "14", mov: "150m", desc: "Nave individual de assalto" },
  { nome: "Cápsula de exploração e emergência", tamanho: "Pequena", tripulacao: "1 a 4", pv: "1d100", ba: "+10", cp: "28", jp: "16", mov: "120m", desc: "Pequena nave para evacuações de emergência e explorações" },
  { nome: "Cargueiro", tamanho: "Gigantesca", tripulacao: "50+", pv: "1d1000", ba: "+12", cp: "24", jp: "10", mov: "40m", desc: "Transporte de artigos de todos os tipos" },
  { nome: "Cruzador", tamanho: "Colossal", tripulacao: "100+", pv: "2d1000", ba: "+18", cp: "30", jp: "12", mov: "20m", desc: "Base militar espacial móvel" },
  { nome: "Escolta", tamanho: "Pequena", tripulacao: "1 a 4", pv: "2d100", ba: "+12", cp: "28", jp: "14", mov: "120m", desc: "Nave para escolta e abordagem" },
  { nome: "Espaçonave particular", tamanho: "Média", tripulacao: "1 a 10", pv: "3d100", ba: "+12", cp: "26", jp: "16", mov: "100m", desc: "Transporte de pequenos grupos de pessoas" },
  { nome: "Nave-mãe", tamanho: "Colossal", tripulacao: "1.000+", pv: "3d1000", ba: "+12", cp: "20", jp: "12", mov: "20m", desc: "Lar de populações inteiras" },
  { nome: "Transuniversal", tamanho: "Gigantesca", tripulacao: "100+", pv: "1d1000", ba: "+10", cp: "24", jp: "10", mov: "40m", desc: "Nave de transporte e lazer civil" },
];

/** T10-7: veículos terrestres, aquáticos e aéreos. Mesmas colunas das naves. */
export const VEICULOS = [
  { nome: "Aerocarro", tamanho: "Pequeno", tripulacao: "1 a 4", pv: "1d100", ba: "+10", cp: "22", jp: "14", mov: "40m" },
  { nome: "Aeroplano", tamanho: "Enorme", tripulacao: "1 a 20", pv: "1d1000", ba: "+12", cp: "24", jp: "10", mov: "120m" },
  { nome: "Cargueiro terrestre", tamanho: "Enorme", tripulacao: "1 a 20", pv: "1d1000", ba: "+12", cp: "24", jp: "10", mov: "30m" },
  { nome: "Hidrocarro", tamanho: "Pequeno", tripulacao: "1 a 4", pv: "1d100", ba: "+10", cp: "22", jp: "14", mov: "40m" },
  { nome: "Submarino", tamanho: "Grande", tripulacao: "1 a 10", pv: "3d100", ba: "+14", cp: "26", jp: "12", mov: "30m" },
  { nome: "Submersível", tamanho: "Médio", tripulacao: "1 a 6", pv: "2d100", ba: "+16", cp: "28", jp: "16", mov: "40m" },
  { nome: "Tanque de guerra", tamanho: "Grande", tripulacao: "1 a 10", pv: "3d100", ba: "+20", cp: "30", jp: "12", mov: "20m" },
  { nome: "Veículo de exploração", tamanho: "Médio", tripulacao: "1 a 6", pv: "2d100", ba: "+16", cp: "28", jp: "16", mov: "30m" },
];

/** T10-3: fontes de energia. O custo é por PONTO PERCENTUAL, por tamanho. */
export const FONTES = [
  { fonte: "Combustível líquido", raridade: "Comum", custo: "500 / 1.000 / 10.000 / 100.000", autonomia: "Média" },
  { fonte: "Incineração de detritos", raridade: "Incomum", custo: "50 / 100 / 1.000 / 10.000", autonomia: "Baixa" },
  { fonte: "Painéis termoenergéticos", raridade: "Rara", custo: "—", autonomia: "Variável" },
  { fonte: "Reatores atômicos", raridade: "Comum", custo: "1.000 / 10.000 / 100.000 / 1.000.000", autonomia: "Alta" },
];

/** O dado de gasto de combustível, pela autonomia da fonte. */
export const DADO_DE_GASTO = { Baixa: "d6", "Média": "d4", Alta: "d2" };

/** T10-5: o teste de pilotagem vira o modificador da JP da nave. */
export const T10_5 = [
  { resultado: "Falha crítica (rolou 100)", mod: -8 },
  { resultado: "Falha acima de 80", mod: -4 },
  { resultado: "Falha", mod: -2 },
  { resultado: "Sucesso", mod: +2 },
  { resultado: "Sucesso abaixo de 20", mod: +4 },
  { resultado: "Sucesso crítico (rolou 1)", mod: +8 },
];

/** T10-6: ordem de ação das espaçonaves. NÃO é a mesma da T7-2. */
export const T10_6_ORDEM = [
  { acao: "Disparo de armas", valor: "Rolagem dos dados de dano da arma" },
  { acao: "Ativar equipamento", valor: "Bônus de ataque da nave" },
  { acao: "Manobras evasivas e movimentação dupla", valor: "Valor da jogada de proteção" },
];

/** T10-6: acertos críticos de espaçonave, em 1d6. */
export const T10_6_CRITICOS = [
  { d6: 1, efeito: "Acerto em área crítica, dano ×2." },
  { d6: 2, efeito: "Avaria no sistema de propulsão: dano ×2 e a movimentação da nave cai à metade." },
  { d6: 3, efeito: "Avaria nas armas: dano ×2 e −5 nos ataques desferidos pela nave alvo." },
  { d6: 4, efeito: "Casco avariado: dano ×2 e −5 no CP." },
  { d6: 5, efeito: "Ataque extra contra outra nave ao alcance." },
  { d6: 6, efeito: "Pane geral na espaçonave." },
];

/** T10-6: falhas críticas de espaçonave, em 1d6. */
export const T10_6_FALHAS = [
  { d6: 1, efeito: "As armas param de funcionar." },
  { d6: 2, efeito: "Perda de controle momentânea: −5 no CP até o próximo turno." },
  { d6: 3, efeito: "Arma temporariamente danificada." },
  { d6: 4, efeito: "Arma permanentemente danificada." },
  { d6: 5, efeito: "Atinge uma nave aliada próxima ao alvo." },
  { d6: 6, efeito: "Perda de controle brusca: −10 no CP até o próximo turno, e um teste de pilotagem para retomar o controle." },
];

/**
 * Com que porcentagem cada classe pilota.
 *
 * Só o cosmonauta tem o talento. As outras improvisam com o que têm, e o livro
 * diz exatamente com o quê.
 */
export const PILOTAGEM_IMPROVISADA = {
  Cosmonauta: "O talento de pilotar naves. Manobra rotineira nem pede teste.",
  Cientista: "Metade da porcentagem de operar máquinas.",
  Gatuno: "A porcentagem de sabotagem.",
  "Mentálico": "A aptidão tecnológica da Ciência, se houver.",
};

/** T10-8: serviços de estação espacial. */
export const SERVICOS_ESTACAO = [
  { servico: "Abastecimento de espaçonave", preco: "Variável", desc: "Pela T10-3, conforme o combustível e o tamanho da nave." },
  { servico: "Estadia da tripulação", preco: "$5.000", desc: "Por pessoa e por dia, com refeições inclusas." },
  { servico: "Manutenção de rotina", preco: "$10.000 / $25.000 / $75.000", desc: "Reparo do que o tempo ou os acidentes danificaram, por tamanho (P, M, G)." },
  { servico: "Pouso e estadia no hangar", preco: "$10.000 / $50.000 / $100.000", desc: "Por tamanho de nave." },
];
