/**
 * As 12 câmaras da nave, o salto hiperespacial e a tranca do Arsenal.
 *
 * Fica separado de `nave-modelo.js` porque aquele arquivo abre com
 * `const { fields } = foundry.data` e só carrega dentro do Foundry. Isto aqui é
 * dado puro, e o build o lê para gerar a tabela do journal a partir da MESMA
 * fonte que a ficha usa.
 */

/* ── AS 12 CÂMARAS (T10-2), A NAVE COMO BASE DE OPERAÇÕES ────────────────────
 *
 * O que é do LIVRO (T10-2, p. 176): o nome da câmara, a `finalidade` e o
 * `equipamento` que se costuma achar nela — só isso. O §10.2 deixa a presença,
 * a aparência e câmaras novas a critério do Mestre.
 *
 * O resto é REGRA DA CASA, do guia "Espaçonaves como Base de Operações" (a
 * opção "Nave modular"): `obra` (custo em créditos), `prazo` (tempo da obra),
 * o `efeito` de cada câmara e o reparo de câmara danificada (25% da obra,
 * metade do prazo). O livro não dá preço, prazo nem reparo para câmaras.
 * Três câmaras mexem no que esta ficha já faz, e por isso a ficha as lê em vez
 * de só listá-las:
 *
 *   ponte     dá +2 no ataque (o Computador Balístico) e, sem ela operacional,
 *             a nave não pilota nem opera armas;
 *   maquinas  é o que permite reparar em combate;
 *   emergencia é o que permite abandonar a nave a 0 PV.
 *
 * Os textos de `efeito` usam os termos do Space Dragon (cientista, alcance
 * mental, robôs, aeromotos); o guia de origem vinha de outro cenário.
 */
import { AVARIAS } from "./nave-combate.js";

export const ESTADOS_DE_CAMARA = ["instalada", "danificada", "ausente"];

export const CAMARAS = {
  ponte: {
    rotulo: "Ponte de Comando", obra: 120000, prazo: "2 semanas",
    finalidade: "Abrigar os controles do sistema de navegação da espaçonave",
    equipamento: "Assento do capitão, controles da nave, computador de bordo, controles do piloto automático, tela de radar, videocomunicador, comandos do escudo de energia, janela de observação",
    efeito: "Controle central. Abriga o Computador Balístico (+2 nos ataques da nave) e o piloto automático; é onde se rolam os 3 testes de pilotagem do salto hiperespacial. Sem ela operacional, a nave não pode ser pilotada nem operar escudos ou armas.",
    // O +2 do Computador Balístico NÃO mora aqui: ele é equipamento da T10-4,
    // e a Ponte apenas o habilita («exige a Ponte operacional»). Enquanto o
    // bônus estava na câmara, TODA nave com Ponte ganhava +2 — inclusive a que
    // nunca comprou o computador, que custa caro e cabe em qualquer tamanho
    // justamente porque é uma escolha.
    exigeParaAtacar: true, exigeParaPilotar: true, exigeParaEscudos: true,
    habilitaEquipamento: "balistico",
  },
  aposentos: {
    rotulo: "Aposentos da Tripulação", obra: 40000, prazo: "1 semana",
    finalidade: "Abrigar os tripulantes",
    equipamento: "Cama, banheiro, depósito de objetos pessoais, guardador de trajes, comunicadores pessoais",
    efeito: "Recuperação natural de PV e de alcance mental para a tripulação orgânica durante viagens no hiperespaço. Sem aposentos, a viagem simplesmente não recupera nada.",
    recuperaEmViagem: true,
  },
  maquinas: {
    rotulo: "Sala de Máquinas", obra: 200000, prazo: "3 semanas",
    finalidade: "Abrigar e controlar os motores e demais sistemas da nave",
    equipamento: "Motores, gerador de eletricidade, controles auxiliares",
    efeito: "Propulsão e geradores primários. É o que permite ao cientista testar operar e consertar máquinas para reativar a energia ou reparar a nave em combate. Espaço obrigatório do acelerador hiperespacial, e onde se gerenciam os tanques de combustível.",
    exigeParaReparar: true,
  },
  deposito: {
    rotulo: "Depósito", obra: 30000, prazo: "3 dias",
    finalidade: "Armazenar todo o equipamento extra da tripulação",
    equipamento: "Diversos",
    efeito: "Carga comercial, suprimentos, peças sobressalentes e pilhagem. Guarda veículos de apoio leves, como aeromotos ou vestes de combate pesadas. Indispensável para transporte de bens e contrabando.",
  },
  refeitorio: {
    rotulo: "Refeitório", obra: 25000, prazo: "3 dias",
    finalidade: "Sala para refeições e preparo de alimentos",
    equipamento: "Reidratador de alimentos, comida desidratada, mesas, talheres",
    efeito: "Prepara rações para expedições longas, mantém o moral e reduz o custo de suprimentos em travessias.",
  },
  arsenal: {
    rotulo: "Arsenal", obra: 80000, prazo: "1 semana",
    finalidade: "Estocar armas e vestes de combate",
    equipamento: "Tipos diversos de armas e vestes",
    efeito: "Estoque seguro das armas, munições e vestes reserva do grupo. Trancas digitais reforçadas: invadir exige Sabotagem com −20%. Permite recarga rápida de baterias energéticas antes das missões.",
  },
  hospital: {
    rotulo: "Ala Hospitalar", obra: 120000, prazo: "2 semanas",
    finalidade: "Local para tratar de ferimentos e traumas sofridos pelos tripulantes",
    equipamento: "Maca, mesa para cirurgia, instrumentos médicos, câmara hermética, trajes herméticos, kit de primeiros socorros",
    efeito: "Habilita os feitos científicos de Operação Cirúrgica, Curar Doença e Diagnosticar Doença, e dobra a recuperação natural de PV em viagem.",
    dobraRecuperacao: true,
  },
  laboratorio: {
    rotulo: "Laboratório", obra: 150000, prazo: "2 semanas",
    finalidade: "Local de trabalho para cientistas durante viagens",
    equipamento: "Materiais e componentes para aparatos tecnológicos, máquina para análise de materiais, ferramentas diversas, braço robótico, mesa de montagem",
    efeito: "Instalação obrigatória para o cientista construir aparatos (com o desconto da aptidão tecnológica) e fazer Reparos Robóticos em robôs e androides. Sem ele, criar aparatos exige alugar oficina externa.",
  },
  acoplagem: {
    rotulo: "Câmara de Acoplagem", obra: 100000, prazo: "1,5 semana",
    finalidade: "Entrada de pessoas de outra nave em uma abordagem",
    equipamento: "Controle de pressão, escotilha externa, corredor de acoplagem",
    efeito: "Conecta a nave a estações ou a outras naves no vácuo: abordagem tática, transferência de passageiros e embarque de carga.",
  },
  despressurizacao: {
    rotulo: "Câmara de Despressurização", obra: 60000, prazo: "1 semana",
    finalidade: "Aclimatar os tripulantes quando entram ou saem da nave no espaço",
    equipamento: "Trajes espaciais, escotilha externa, descontaminador",
    efeito: "Saída segura para atividade extraveicular no vácuo ou em superfícies tóxicas, sem perder pressão nem contaminar a nave.",
  },
  corredores: {
    rotulo: "Corredores", obra: 20000, prazo: "3 dias",
    finalidade: "Interligar câmaras",
    equipamento: "Portas, comunicadores, tubulações",
    efeito: "Ligam as câmaras. As portas blindadas podem ser seladas numa invasão, exigindo Sabotagem ou um cortador laser para abrir.",
  },
  emergencia: {
    rotulo: "Saída de Emergência", obra: 90000, prazo: "1 semana",
    finalidade: "Abrigar cápsulas de emergência",
    equipamento: "Cápsulas de emergência, comunicadores, despressurizador, escotilha externa, trajes espaciais",
    efeito: "As cápsulas de evacuação, com suporte de vida independente. A 0 PV, durante a contagem regressiva para a explosão — 1 segundo por PV do total —, é por ela que a tripulação escapa.",
    salvaA0PV: true,
  },
};

/**
 * O salto hiperespacial: três testes de Pilotar, na ordem, e cada um falha de
 * um jeito diferente. Rola-se na Ponte, e é ela que tem os instrumentos.
 *
 * "Falhas nos dois primeiros causam erros de navegação; falhas no terceiro
 * cancelam o salto."
 */
export const ETAPAS_DO_SALTO = [
  { chave: "distancia", rotulo: "Distância", erro: "a nave sai do hiperespaço longe demais, ou perto demais, do destino." },
  { chave: "direcao", rotulo: "Direção", erro: "a nave sai do hiperespaço na direção errada — outro sistema, outro setor." },
  { chave: "execucao", rotulo: "Execução", erro: "o salto não acontece: a nave fica onde está, e a sequência não pode ser abortada no meio." },
];

/** A tranca do Arsenal: invadir exige Sabotagem com esta penalidade. */
export const TRANCA_DO_ARSENAL = -20;

/**
 * A PONTE ENTRE O COMBATE TÁTICO E AS CÂMARAS.
 *
 * O crítico do dial causa uma avaria; a avaria é dano de cena, e o Engenheiro a
 * repara em combate. O que ela NÃO é, é dano estrutural — isso é a câmara.
 *
 * A conversa entre os dois acontece no fim da rodada: a avaria que o Engenheiro
 * não reparou deixa de ser susto e vira **câmara danificada**, que só a obra
 * conserta (regra da casa: 25% do custo, metade do prazo). Assim o combate não trava no meio —
 * a nave continua lutando — mas a conta chega, e o posto de Engenharia ganha
 * urgência: reparar naquela rodada evita a obra.
 *
 * Só as avarias DURADOURAS entram. O Leme e a Tripulação saem sozinhos no fim
 * da rodada, e é de propósito: são sustos, não estrago.
 *
 * Desde a 1.31 a lista sai de AVARIAS (nave-combate.js): motor → Sala de
 * Máquinas, armas → Arsenal, casco → Corredores, sensores e escudos → Ponte.
 */
export const AVARIA_VIRA_CAMARA = Object.fromEntries(
  Object.entries(AVARIAS).filter(([, a]) => a.camara).map(([k, a]) => [k, a.camara]),
);

/** Regra da casa (não é da T10-2): reparar custa 25% da obra e leva metade do tempo. */
export const REPARO_DE_CAMARA = 0.25;

/*
 * A pergunta "esta câmara está de pé?" mora em nave-sistemas.js (`operacional`),
 * e a decisão de comprar ou reparar em nave-pc-dados.js (`compraDeCamara`,
 * `reparoDeCamara`). Aqui ficavam `camaraOperacional` e `decidirCamara`, sem
 * ninguém que as chamasse — e a primeira lia o estado CRU, sem o padrão de
 * fábrica: por ela, uma nave nova não teria Ponte. Saíram para ninguém usá-las
 * achando que eram as certas.
 */
