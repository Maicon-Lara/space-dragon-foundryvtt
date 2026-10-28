/**
 * A Ficha de Nave feita sobre a ficha de PERSONAGEM.
 *
 * ── POR QUE ISTO EXISTE, SE JÁ HÁ UMA FICHA DE NAVE ─────────────────────────
 *
 * Porque a ficha de nave própria (nave-ficha.js) é um template nosso de 350
 * linhas e um CSS que acompanha. Ela funciona, mas tudo nela é nosso para
 * manter: o espaçamento, as abas, o comportamento ao encolher, o contraste em
 * cada tema. Um dia inteiro de correções de cor saiu daí.
 *
 * Esta herda a ficha do sistema inteira — como a Ficha Space Dragon faz — e só
 * acrescenta uma classe no elemento. Aparência, abas e tipografia vêm do
 * sistema, de graça, e acompanham as versões dele.
 *
 * ── O QUE MUDOU DE ONTEM PARA HOJE ──────────────────────────────────────────
 *
 * Ontem eu desaconselhei este caminho, e o motivo era o Combate Tático: dial,
 * manobras, hexes, Sobrecarga e planejar/revelar não cabem numa ficha de
 * personagem sem violência. SEM o Tático — que é o que o autor decidiu — sobra
 * um conjunto que cabe: CP, PV, BA, JP, esquiva, armas, câmaras, equipamentos,
 * combustível, postos, energia, avarias e fuga.
 *
 * A ficha própria continua existindo para quem usa o Tático. Esta é a do §10.6.
 *
 * ── O MAPA, DECIDIDO COM O AUTOR ────────────────────────────────────────────
 *
 *   Ataques       as armas da nave
 *   Raça          → "Tipo da nave" (T10-1)
 *   Classe        → "Câmaras" (T10-2), as alterações estruturais
 *   Poderes       → "Tripulação", os cinco postos
 *   Equipamentos  os adicionais da T10-4 e o combustível
 *   Detalhes      as notas
 *
 * NÃO há aba de atributos: uma nave não tem Força nem Intelecto. E a
 * movimentação é UMA só — os quatro campos do personagem (normal, escalada,
 * voo, natação) não têm equivalente.
 */

import {
  naveDe, estadoDoComodo, proximoEstado, comodosInstalados, FLAG, updateDaNave,
  CAMARAS_BASE, flagDeNave, resumoDasCamaras, compraDeCamara, creditos, reparoDeCamara,
  tamanhoDaNave,
} from "./nave-pc-dados.js";
import { linhasDoVoo, CUSTOS } from "./nave-voo.js";
import {
  avisosDaNave, bonusDeAtaque, equipamentosDoAtor, podeAtacar, operacional,
  podeUsarEscudos, podeRepararEmCombate,
} from "./nave-sistemas.js";
import { POSTOS, ACOES_DE_POSTO, AUTOMATIZA } from "./tripulacao.js";
import {
  painelDasCamadas, MARCA_CAMADAS, CLASSE_ENERGIA, CLASSE_RELOGIO,
} from "./nave-camadas.js";
import { MARCAS_DO_PERSEGUIDOR } from "./tripulacao.js";
import { ETAPAS } from "./nave-salto.js";
import { aplicarAcao, ehAutomatica, limparFimDaRodada } from "./nave-acoes.js";
import { CAMARAS } from "./camaras.js";
import {
  combateCompilado, naveModular, camadaLigada, danoPorMargem, escudoComoReserva, multiplicadorDeDano,
} from "./opcoes.js";
import { dadosExtrasDeDano } from "./tripulacao.js";
import {
  AVARIAS, CRITICO_T10_6, FALHA_T10_6, AVARIA_POR_DANO, causaAvaria, cpDoAlvo, termosDoAtaque,
  formulaDosTermos, formulaDoDano, dadosPorMargem, danoFinal, aplicarImpacto, fimDaRodada,
  calorNoFimDaRodada, penalidadesDeAvaria,
} from "./nave-combate.js";
import { ehNave } from "./nave-marca.js";
import { xpDaNave, XP_POR_TIPO, tipoDaNave } from "./nave-xp.js";
import {
  armaDoEquipamento, alcanceEscrito, faixaDoAlcance, penalidadeDaFaixa, FAIXAS, unidadeEmMetros,
} from "./nave-disparo.js";

import { t as txt } from "./i18n.js";

const ID = "spacedragon";
export const MARCA_NAVE_PC = "spacedragon-nave-pc";
export const MARCA_VOO = "sw-painel-voo";
export const CLASSE_XP = "sw-nave-xp";

/**
 * A classe-base: a Ficha Space Dragon, se o módulo vizinho a registrou; senão a
 * do sistema.
 *
 * Preferir a do vizinho não é capricho: ela já traz a JP pela regra do livro e o
 * lançamento de poder pelo Cap. 9. Herdar dela é herdar isso junto.
 */
function baseDaFicha() {
  const registro = CONFIG.Actor?.sheetClasses?.character ?? {};
  const classes = Object.values(registro).map((e) => e?.cls).filter(Boolean);
  const doVizinho = classes.find((c) => c.name === "SDCharacterSheet");
  const doSistema = classes.find((c) => c.name === "OD2CharacterSheet");
  const achada = doVizinho ?? doSistema ?? null;
  if (!achada) {
    console.warn(
      `${ID} | nem SDCharacterSheet nem OD2CharacterSheet no registro — ` +
      `a Ficha de Nave sobre personagem não será registrada`
    );
  }
  return achada;
}

/* ── OS RÓTULOS DAS ABAS ───────────────────────────────────────────────────
 *
 * Trocados no DOM, e não no `lang`: o idioma é GLOBAL, e renomear "Raça" para
 * "Tipo da nave" no lang faria o personagem comum da mesma mesa mostrar "Tipo
 * da nave" na ficha dele. Aqui a troca vale só dentro desta ficha.
 */
export const ROTULOS = {
  race: "Tipo",
  class: "Câmaras",
  spells: "Tripulação",
  equipment: "Equipamentos",
  attacks: "Armamento",
  details: "Detalhes",
};

/**
 * O que a ficha de personagem mostra e a nave não tem.
 *
 * Escondido por CSS (ver livro.css), e não removido do DOM: o sistema redesenha
 * a ficha a cada mudança, e o que se remove volta no próximo render. Esconder
 * sobrevive ao redesenho sem uma linha de JS.
 */
export const ESCONDIDOS = [
  "os seis atributos da barra lateral (por CSS, no bloco .stats) — e os modificadores valem 0 (atributos.js)",
  "XP, alinhamento e idiomas (marcados pela ficha, pelo caminho do schema)",
];

/**
 * Nada mais a esconder, e isto foi MEDIDO — não suposto.
 *
 * Eu tinha anotado "esconder escalada, voo e natação". Varrendo a ficha aberta,
 * esses campos NÃO EXISTEM: há um bloco `.mv` só, com um `system.current_movement`
 * derivado e desabilitado. E movimento a nave tem — vem do tipo, pela raça.
 *
 * Fica como aviso para a próxima vez que eu quiser esconder algo: a lista do
 * que sobra nasce do console, e não da memória.
 */
export const AINDA_A_ESCONDER = [];

/* ── O QUE A NAVE NÃO USA ─────────────────────────────────────────────────── */

/**
 * Os campos da ficha de personagem que não existem numa nave, pelo CAMINHO DO
 * SCHEMA e não pelo rótulo.
 *
 * Medidos no ator exportado da mesa, não adivinhados. O `name` do input vem do
 * schema do sistema; o rótulo vem da tradução. Casar pelo rótulo quebraria se a
 * mesa trocasse de idioma, e casar pela posição quebraria na próxima versão do
 * sistema.
 *
 * Nave não ganha XP (é comprada, reformada e perdida), não tem alinhamento e
 * não fala idioma nenhum — quem fala é a tripulação, e ela tem a ficha dela.
 */
export const CAMPOS_NAO_USADOS = [
  "system.current_xp",
  "system.details.alignment",
  "system.details.languages",
];

export const CLASSE_OCULTO = "sw-nave-nao-usa";

/**
 * De quem esconder: o campo, ou o bloquinho que o embrulha com o rótulo.
 *
 * ── A REGRA QUE EVITA O DESASTRE ──────────────────────────────────────────
 *
 * Sobe no máximo DOIS níveis, e para assim que o contêiner guardar outro campo
 * além deste. Sem esse freio, um `:has()` largo ou um `closest(".form-group")`
 * que não casasse acabaria escondendo o `<form>` — e a ficha abriria em branco.
 * Já quebramos a interface uma vez por mirar largo; aqui o pior caso é esconder
 * só o input e deixar o rótulo órfão, que é feio e não é fatal.
 */
export function alvoDoCampo(campo) {
  let alvo = campo;
  for (let i = 0; i < 2; i += 1) {
    const pai = alvo.parentElement;
    if (!pai) break;
    // a casca da ficha nunca é alvo, por mais vazia que pareça
    if (/^(FORM|SECTION|BODY|HTML|MAIN|ASIDE)$/.test(pai.tagName ?? "")) break;
    // o contêiner guarda outra coisa também: esconder levaria essa outra junto
    if ((pai.querySelectorAll?.("[name]")?.length ?? 0) > 1) break;
    alvo = pai;
  }
  return alvo;
}

/**
 * Marca o que a nave não usa. Esconder é do CSS; aqui só se põe a classe.
 *
 * Idempotente de propósito: roda a cada render, e a ficha redesenha a cada
 * alteração do ator.
 */
export function ocultarOQueNaveNaoUsa(raiz) {
  if (!raiz?.querySelector) return 0;
  let marcados = 0;
  for (const caminho of CAMPOS_NAO_USADOS) {
    for (const campo of raiz.querySelectorAll(`[name="${caminho}"]`) ?? []) {
      const alvo = alvoDoCampo(campo);
      if (alvo.classList?.contains(CLASSE_OCULTO)) continue;
      alvo.classList?.add(CLASSE_OCULTO);
      marcados += 1;
    }
  }
  return marcados;
}

/* ── O PAINEL DE VOO ──────────────────────────────────────────────────────── */

/**
 * O bloco que a mesa olha a cada rodada: CP, BA, JP, movimento, o tanque, e o
 * que o dano está custando ao piloto.
 *
 * ── DE ONDE VEM CADA NÚMERO ───────────────────────────────────────────────
 *
 * CP, BA e JP são GETTERS do sistema (`ac_total`, `ba`, `jpd_total`), montados a
 * partir da raça e da classe de nave. Eles não existem em `system` e não
 * aparecem num JSON do ator — já perdi dois ciclos de medição concluindo que
 * estavam quebrados quando o errado era onde eu olhava.
 *
 * A penalidade por avaria e o gasto de combustível vêm de nave-voo.js, que tem
 * teste. Aqui só se desenha.
 */
export function painelDeVoo(ator, nave) {
  const s = ator?.system ?? {};
  const l = linhasDoVoo({
    pv: s.hp?.value, pvMax: s.hp?.max,
    // os derivados do sistema, com queda para o que a flag guardou: numa ficha
    // sem raça nem classe de nave ainda se vê alguma coisa
    cp: s.ac_total ?? nave?.cp, ba: s.ba ?? nave?.ba, jp: s.jpd_total ?? nave?.jp,
    movimento: s.current_movement ? `${s.current_movement} m` : null,
    // o combustível é um OBJETO na flag ({atual, maximo, fonte}), e eu o lia
    // como número solto: `Number({...})` dá NaN, virava 0, e o bloco do tanque
    // nunca aparecia. Os testes não pegaram porque passavam valores soltos em
    // vez da nave de verdade — agora um deles usa `naveVazia()`.
    combustivel: nave?.combustivel?.atual, fonte: nave?.combustivel?.fonte,
    pilotagem: nave?.pilotagem,
  });

  const campo = (rotulo, valor, titulo = "") =>
    `<div class="voo-campo"${titulo ? ` title="${titulo}"` : ""}>` +
    `<span class="voo-rotulo">${rotulo}</span>` +
    `<span class="voo-valor">${valor}</span></div>`;

  const avaria = l.penalidade > 0
    ? `<div class="voo-avaria" title="${txt("spacedragon.nave.voo.avariaDica")}">` +
      txt("spacedragon.nave.voo.avaria", { pen: l.penalidade }) +
      (l.pilotagem ? txt("spacedragon.nave.voo.avariaPilotagem", { base: l.pilotagem.base, efetiva: l.pilotagem.efetiva }) : "") +
      `</div>`
    : "";

  const tanque = l.combustivel.fonte
    ? `<div class="voo-tanque" title="${txt("spacedragon.nave.voo.tanqueDica", { fonte: l.combustivel.fonte.rotulo, autonomia: l.combustivel.fonte.autonomia, gasto: l.combustivel.gastoPorDia })}">` +
      `<div class="voo-tanque-barra"><i style="width:${l.combustivel.porcento}%"></i></div>` +
      `<span>${txt("spacedragon.nave.voo.tanque", { porcento: l.combustivel.porcento, gasto: l.combustivel.gastoPorDia })}</span>` +
      `</div>`
    : "";

  // O +2 do Computador Balístico vem da PONTE, e some com ela. Mostrar o BA já
  // somado evita a conta de cabeça no meio do combate; mostrar as duas parcelas
  // evita a pergunta "de onde saiu esse número".
  // o +2 exige o Computador Balístico instalado E a Ponte operacional: são
  // duas condições, e o equipamento entra como item arrastado do compêndio
  const extra = bonusDeAtaque(nave, equipamentosDoAtor(ator, ID));
  const ba = extra
    ? `+${l.ba + extra} <small>${txt("spacedragon.nave.voo.baBalistico", { ba: l.ba, extra })}</small>`
    : `+${l.ba}`;

  // Os avisos dizem o que a câmara danificada ou ausente tira da nave: é a
  // espiral das Regras Compiladas. Só pelo livro, câmara não cala a nave.
  const avisos = combateCompilado()
    ? avisosDaNave(nave).map((a) => `<li class="voo-${a.grau}">${a.texto}</li>`).join("")
    : "";

  // A XP ao ser abatida (regra da casa, nave-xp.js): só o Mestre vê e edita.
  // Em branco vale a tabela do tipo, que aparece como sugestão no campo.
  const daTabela = XP_POR_TIPO[tipoDaNave(nave, ator?.system?.race?.name ?? "")] ?? 0;
  const xp = globalThis.game?.user?.isGM
    ? `<label class="voo-xp" title="${txt("spacedragon.nave.xp.dica", { tabela: daTabela })}">` +
      `${txt("spacedragon.nave.xp.rotulo")} ` +
      `<input type="number" min="0" step="1" class="${CLASSE_XP}" ` +
      `value="${nave?.xp ?? ""}" placeholder="${daTabela}"></label>`
    : "";

  return (
    `<section class="${MARCA_VOO}">` +
    `<div class="voo-linha">` +
      campo("CP", l.cp, txt("spacedragon.nave.voo.dicaCP")) +
      campo("BA", ba, txt("spacedragon.nave.voo.dicaBA")) +
      campo("JP", l.jp, txt("spacedragon.nave.voo.dicaJP")) +
      campo(txt("spacedragon.nave.voo.mov"), l.movimento) +
    `</div>` +
    avaria + tanque + xp +
    (avisos ? `<ul class="voo-avisos">${avisos}</ul>` : "") +
    `</section>`
  );
}

/**
 * Põe o painel na aba de ataques, sem duplicar.
 *
 * Remove o próprio painel antes de redesenhar: a ficha redesenha a cada
 * alteração do ator, e sem isso teríamos um painel por render.
 */
export function porPainelDeVoo(raiz, ator) {
  if (!raiz?.querySelector || !ator) return false;
  const aba = raiz.querySelector(".character-tab-attacks") ??
              raiz.querySelector('[data-tab="attacks"]:not(nav [data-tab="attacks"])');
  if (!aba) return false;
  // só o NOSSO painel sai, e a marca fica visível na mesma linha: a asserção do
  // teste lê o trecho antes do .remove() para distinguir nó nosso de nó do
  // sistema, e uma variável intermediária escondia isso dela
  aba.querySelector(`.${MARCA_VOO}`)?.remove();
  aba.insertAdjacentHTML("afterbegin", painelDeVoo(ator, naveDe(ator, ID)));
  return true;
}

/* ── O PAINEL DA TRIPULAÇÃO (§7) ──────────────────────────────────────────── */

export const MARCA_TRIPULACAO = "sw-painel-tripulacao";
export const CLASSE_POSTO = "sw-posto-nome";
export const CLASSE_ACAO = "sw-posto-acao";
export const CLASSE_FIM_RODADA = "sw-fim-rodada";
export const LISTA_TRIPULACAO = "sw-tripulacao-sugestoes";

/**
 * Os nomes que o campo de posto sugere: os personagens do mundo que NÃO são
 * naves.
 *
 * Uma nave na tripulação de outra nave não é um erro que valha impedir — o
 * livro tem caça acoplado em nave-mãe —, mas sugerir isso num campo que se
 * preenche depressa seria convidar o engano. A digitação livre continua: o
 * posto aceita «um droide qualquer» e o nome de um NPC que não tem ficha.
 */
export function sugestoesDeTripulacao() {
  const todos = globalThis.game?.actors ?? [];
  const nomes = [];
  for (const a of todos) {
    try {
      if (a?.type !== "character") continue;
      if (a.getFlag?.(ID, FLAG)?.tipo) continue;   // é uma nave
      if (a.name) nomes.push(a.name);
    } catch { /* um ator problemático não derruba a lista */ }
  }
  return [...new Set(nomes)].sort((x, y) => x.localeCompare(y, "pt-BR"));
}

/**
 * Os cinco postos, cada um com quem o ocupa e as opções da rodada.
 *
 * ── POR QUE AS OPÇÕES APARECEM MESMO COM O POSTO VAZIO ────────────────────
 *
 * Porque é lendo o que o posto FAZ que alguém decide ocupá-lo. Esconder as
 * opções até alguém sentar transforma a escolha num chute, e o §7 existe
 * justamente para que cada posto seja uma decisão com consequência.
 *
 * ── O QUE A FICHA APLICA E O QUE ELA SÓ DIZ ───────────────────────────────
 *
 * AUTOMATIZA lista o que vira efeito sozinho. O resto — Ordem, Sangue frio —
 * sai como texto porque depende de alguém escolher QUEM, e um menu de "escolha
 * o aliado" no meio da rodada custa mais tempo do que a mesa ganha. A ficha
 * marca os dois de forma diferente, para ninguém esperar uma automação que não
 * vem.
 */
export function painelDaTripulacao(ator, nave) {
  const ocupantes = nave?.postos ?? {};

  const linhas = POSTOS.map((posto) => {
    const quemEsta = String(ocupantes[posto.chave] ?? "").trim();
    // a Engenharia precisa da Sala de Máquinas: dizer isso ANTES evita a
    // descoberta no meio do combate, de que ninguém pode reparar nada
    const travado = posto.exigeCamara && !operacional(nave, posto.exigeCamara);
    const acoes = (ACOES_DE_POSTO[posto.chave] ?? [])
      .map((a) => {
        const auto = ehAutomatica(a.chave);
        const dica = String(a.nota ?? "").replace(/"/g, "&quot;");
        // a automática é BOTÃO, a de mesa é texto. A diferença tem de estar na
        // forma e não só na cor: um item que parece clicável e não é custa um
        // clique e uma dúvida toda vez.
        return auto
          ? `<li class="posto-acao acao-auto">` +
            `<button type="button" class="${CLASSE_ACAO}" data-posto="${posto.chave}" ` +
            `data-acao="${a.chave}" title="${dica}">${a.rotulo}</button></li>`
          : `<li class="posto-acao acao-texto" title="${dica}">${a.rotulo}</li>`;
      })
      .join("");

    return (
      `<div class="posto${travado ? " posto-travado" : ""}${quemEsta ? " posto-ocupado" : ""}">` +
      `<div class="posto-cabeca">` +
        `<strong>${posto.rotulo}</strong> ` +
        // ── O POSTO SE EDITA NA FICHA ──
        //
        // A tripulação troca de vaga no meio do combate: o piloto assume a
        // artilharia quando o artilheiro cai, alguém corre para a Engenharia
        // quando a Sala de Máquinas pega fogo. Um painel que só MOSTRA quem
        // está onde obriga a mesa a anotar isso fora da ficha, e aí a ficha
        // mente na rodada seguinte.
        //
        // O `placeholder` leva quem PODE ocupar o posto («Veterano /
        // Contrabandista»), que é a informação útil enquanto a vaga está
        // vazia — e some sozinho quando alguém senta.
        `<input type="text" class="${CLASSE_POSTO}" data-posto="${posto.chave}" ` +
        `value="${quemEsta.replace(/"/g, "&quot;")}" placeholder="${posto.quem}" ` +
        `list="${LISTA_TRIPULACAO}" title="${txt("spacedragon.nave.tripulacao.dicaPosto")}">` +
      `</div>` +
      `<div class="posto-faz">${posto.oQueFaz}</div>` +
      (travado
        ? `<div class="posto-aviso">${txt("spacedragon.nave.tripulacao.semMaquinas")}</div>`
        : "") +
      `<ul class="posto-acoes">${acoes}</ul>` +
      `</div>`
    );
  }).join("");

  return (
    `<section class="${MARCA_TRIPULACAO}">` +
    `<p class="tripulacao-nota">${txt("spacedragon.nave.tripulacao.nota")}</p>` +
    linhas +
    // ── O FIM DA RODADA ──
    //
    // Firmar, Supressão, Interferência, Aguentem firme e a energia valem «até o
    // fim da rodada». Sem um lugar para dizer que a rodada acabou, eles ficam
    // ligados para sempre — e o sintoma é uma nave que nunca sai do Firmar,
    // três sessões depois, sem ninguém ligar a causa.
    `<button type="button" class="${CLASSE_FIM_RODADA}" ` +
    `title="${txt("spacedragon.nave.tripulacao.fimDaRodadaDica")}">` +
    `${txt("spacedragon.nave.tripulacao.fimDaRodada")}</button>` +
    `<datalist id="${LISTA_TRIPULACAO}">` +
    sugestoesDeTripulacao().map((n) => `<option value="${n.replace(/"/g, "&quot;")}">`).join("") +
    `</datalist>` +
    `</section>`
  );
}

/**
 * O combate do LIVRO, para a mesa que desligou as Regras Compiladas.
 *
 * A aba não fica vazia: quem a abre procurando os postos encontra o que o
 * Cap. 10 diz, e o lugar onde a outra regra se liga.
 */
export function painelDoLivro() {
  return `<section class="${MARCA_TRIPULACAO} tripulacao-livro">${txt("spacedragon.nave.livro.combate")}</section>`;
}

/** Põe o painel na aba de Tripulação (a de poderes, renomeada). */
export function porPainelDaTripulacao(raiz, ator) {
  if (!raiz?.querySelector || !ator) return false;
  const aba = raiz.querySelector(".character-tab-spells") ??
              raiz.querySelector('[data-tab="spells"]:not(nav [data-tab="spells"])');
  if (!aba) return false;
  aba.querySelector(`.${MARCA_TRIPULACAO}`)?.remove();
  const html = combateCompilado() ? painelDaTripulacao(ator, naveDe(ator, ID)) : painelDoLivro();
  aba.insertAdjacentHTML("afterbegin", html);
  return true;
}

/* ── O GUIA DE MONTAGEM ───────────────────────────────────────────────────── */

export const MARCA_GUIA = "sw-guia-nave";

/**
 * Os passos para montar a nave, mostrados enquanto ela não está montada.
 *
 * ── POR QUE A FICHA PRECISA ENSINAR ───────────────────────────────────────
 *
 * Porque o sistema recusa em silêncio. Arrastar a classe antes da raça produz
 * uma notificação vermelha no canto que some em segundos, e nada muda na ficha;
 * arrastar um cômodo solto, idem. Quem não viu a notificação conclui que o item
 * está quebrado — foi o que aconteceu na mesa, duas vezes, com um aviso já
 * escrito na descrição da classe que ninguém leu, porque para ler a descrição é
 * preciso abrir o item, e quem está arrastando não abriu.
 *
 * O guia some sozinho quando a nave fica pronta: um aviso permanente vira
 * decoração e deixa de ser lido.
 */
export function guiaDeMontagem(ator) {
  const tem = (tipo) => (ator?.items ?? []).some?.((i) => i.type === tipo);
  const temRaca = tem("race");
  const temClasse = tem("class");
  if (temRaca && temClasse) return "";

  const passo = (feito, texto) =>
    `<li class="${feito ? "guia-feito" : "guia-falta"}">${feito ? "✔" : "○"} ${texto}</li>`;

  return (
    `<section class="${MARCA_GUIA}">` +
    `<strong>${txt("spacedragon.nave.guia.titulo")}</strong>` +
    `<ol>` +
    passo(temRaca, txt("spacedragon.nave.guia.tipo")) +
    passo(temClasse,
      txt("spacedragon.nave.guia.classe") +
      (temRaca ? "" : txt("spacedragon.nave.guia.recusa"))) +
    `</ol>` +
    `<p class="guia-nota">${txt("spacedragon.nave.guia.nota")}</p>` +
    `</section>`
  );
}

/** Põe o guia no alto da aba de ataques, acima do painel de voo. */
export function porGuiaDeMontagem(raiz, ator) {
  if (!raiz?.querySelector || !ator) return false;
  const aba = raiz.querySelector(".character-tab-attacks") ??
              raiz.querySelector('[data-tab="attacks"]:not(nav [data-tab="attacks"])');
  if (!aba) return false;
  aba.querySelector(`.${MARCA_GUIA}`)?.remove();
  const html = guiaDeMontagem(ator);
  if (html) aba.insertAdjacentHTML("afterbegin", html);
  return !!html;
}

/**
 * As camadas opcionais, abaixo dos postos — porque são extensões do §7, e é lá
 * que a mesa já está olhando quando pensa em tripulação.
 */
export function porPainelDasCamadas(raiz, ator) {
  if (!raiz?.querySelector || !ator) return false;
  const aba = raiz.querySelector(".character-tab-spells") ??
              raiz.querySelector('[data-tab="spells"]:not(nav [data-tab="spells"])');
  if (!aba) return false;
  aba.querySelector(`.${MARCA_CAMADAS}`)?.remove();
  // as camadas estendem os postos do §7: sem as Regras Compiladas, não há o
  // que estender, mesmo que a camada esteja ligada
  if (!combateCompilado()) return false;
  const nave = naveDe(ator, ID);
  const html = painelDasCamadas(nave, {
    tamanho: nave?.tamanho,
    rodada: globalThis.game?.combat?.round ?? null,
  });
  if (html) aba.insertAdjacentHTML("beforeend", html);
  return !!html;
}

/* ── O DISPARO DAS ARMAS DE NAVE ──────────────────────────────────────────── */

/** O botão de ataque que o sistema desenha para cada arma. */
export const SELETOR_ATAQUE = ".attack-roll";

/**
 * A arma de nave por trás de um botão de ataque, ou null.
 *
 * Null quer dizer "não é nossa": o clique segue para o sistema e para o
 * Qualidade de Vida como sempre. Só a arma com a flag de equipamento da T10-4
 * e dano declarado é disparada pela Ficha de Nave.
 */
export function armaDoBotao(botao, ator) {
  const linha = botao?.closest?.("[data-item-id]");
  const item = linha ? ator?.items?.get?.(linha.dataset?.itemId) : null;
  const chave = flagDeNave(item, "equipamentoDeNave", ID)?.chave ?? null;
  const arma = chave ? armaDoEquipamento(chave) : null;
  return arma ? { item, chave, arma } : null;
}

/** Distância em metros da nave ao alvo marcado, pelo mapa. Null sem os dois. */
function distanciaAoAlvo(ator, alvo) {
  try {
    const origem = ator?.getActiveTokens?.()?.[0];
    const grade = globalThis.canvas?.grid;
    if (!origem || !alvo || !grade?.measurePath) return null;
    const d = grade.measurePath([origem.center, alvo.center])?.distance;
    return Number.isFinite(d) ? Math.round(d) : null;
  } catch {
    return null;
  }
}

/**
 * Quem está na Artilharia e o BA à distância dele, se ele tem ficha no mundo.
 * Sem ficha (um NPC só de nome), o campo vem vazio e a mesa digita.
 */
function artilheiroDaNave(nave) {
  const nome = String(nave?.postos?.artilharia ?? "").trim();
  if (!nome) return null;
  const bad = Number(globalThis.game?.actors?.getName?.(nome)?.system?.bad);
  return { nome, bad: Number.isFinite(bad) ? bad : null };
}

/** O rótulo de cada faixa, com a chave por extenso para o teste de idioma. */
const ROTULO_DA_FAIXA = {
  curta: () => txt("spacedragon.nave.disparo.curta"),
  media: () => txt("spacedragon.nave.disparo.media"),
  longa: () => txt("spacedragon.nave.disparo.longa"),
};

const escapa = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

/* ── O DISPARO NO CHAT, E O DANO APLICADO PELO MESTRE ────────────────────────
 *
 * O jogador não grava na ficha da nave inimiga — ela é do Mestre. Então o tiro
 * sai como um cartão com o dano e as avarias, e o Mestre aplica com um clique:
 * o escudo absorve, o PV desce, as avarias entram com a rodada do combate.
 */
export const CLASSE_APLICAR = "sd-aplicar-impacto";

/**
 * Esta nave está suprimida? A Supressão mora na nave que suprime, apontando o
 * token alvo (nave-acoes.js); aqui se procura, nas naves em cena, quem aponta
 * para este token.
 */
function naveSuprimida(tokenId) {
  if (!tokenId) return false;
  try {
    return (globalThis.canvas?.tokens?.placeables ?? []).some((t) => {
      const a = t?.actor;
      return a && ehNave(a) && naveDe(a, ID).supressao?.alvo === tokenId;
    });
  } catch {
    return false;
  }
}

/** O cartão do disparo: a conta do ataque, cada tiro, o dano e as avarias. */
export function cartaoDoDisparo({
  nomeArma, faixa, nomeAlvo, termos = [], cpInfo = null, tiros = [], total = 0,
  avarias = [], multiplicador = 1, arma = {}, temAlvo = false,
}) {
  const conta = ["1d20", ...termos.map(([r, v]) => `${v > 0 ? "+" : "−"} ${Math.abs(v)} <small>(${r})</small>`)].join(" ");
  const cp = cpInfo
    ? txt("spacedragon.nave.disparo.contraCP", {
      alvo: nomeAlvo || "?", cp: cpInfo.cp,
      partes: cpInfo.partes?.length
        ? ` <small>(${cpInfo.base} ${cpInfo.partes.map(([r, v]) => `${v > 0 ? "+" : "−"} ${Math.abs(v)} ${r}`).join(" ")})</small>`
        : "",
    })
    : txt("spacedragon.nave.disparo.semAlvo");
  const linha = (t, i) => {
    const res = t.acerto ? txt("spacedragon.nave.disparo.acerto") : txt("spacedragon.nave.disparo.erro");
    const dano = t.dano !== undefined
      ? " · " + txt("spacedragon.nave.disparo.dano", { dano: t.dano, formula: t.formulaDano }) +
        (t.extras?.length ? ` <small>(${t.extras.map(([r, v]) => `+${v} ${r}`).join(", ")})</small>` : "")
      : "";
    const notas = t.notas.map((n) => `<br><em>${n}</em>`).join("");
    return `<li><strong>${t.total}</strong> <small>(d20: ${t.natural})</small> — ${res}${dano}${notas}</li>`;
  };
  return (
    `<div class="spacedragon-cartao sd-disparo">` +
    `<h4>${txt("spacedragon.nave.disparo.chat", { arma: nomeArma, faixa })}</h4>` +
    `<p>${conta}</p><p>${cp}</p>` +
    ((arma.ataques ?? 1) > 1 ? `<p>${txt("spacedragon.nave.disparo.varios", { n: arma.ataques })}</p>` : "") +
    `<ol>${tiros.map(linha).join("")}</ol>` +
    (total > 0
      ? `<p><strong>${txt("spacedragon.nave.disparo.total", { dano: total })}</strong>` +
        (multiplicador > 1 ? ` <small>${txt("spacedragon.nave.disparo.multiplicador", { n: multiplicador })}</small>` : "") + `</p>`
      : "") +
    (avarias.length
      ? `<p>${txt("spacedragon.nave.disparo.avarias", { lista: avarias.map((k) => `${AVARIAS[k].rotulo} (${AVARIAS[k].efeito})`).join("; ") })}</p>`
      : "") +
    (arma.jpDoAlvo ? `<p>${txt("spacedragon.nave.disparo.missil", { rodadas: arma.perseguePor ?? "?" })}</p>` : "") +
    (temAlvo && (total > 0 || avarias.length)
      ? `<button type="button" class="${CLASSE_APLICAR}">${txt("spacedragon.nave.disparo.aplicar", { alvo: nomeAlvo || "?" })}</button>`
      : "") +
    `</div>`
  );
}

/** O clique do Mestre no cartão: aplica o tiro na nave (ou no ator) alvo. */
async function aplicarImpactoDaMensagem(msg) {
  const imp = msg?.getFlag?.(ID, "impacto");
  if (!imp) return;
  if (!globalThis.game?.user?.isGM) {
    globalThis.ui?.notifications?.warn?.(txt("spacedragon.nave.disparo.soMestre"));
    return;
  }
  if (imp.aplicado) {
    globalThis.ui?.notifications?.warn?.(txt("spacedragon.nave.disparo.jaAplicado"));
    return;
  }
  const doc = await globalThis.fromUuid?.(imp.alvo);
  const ator = doc?.actor ?? doc;
  if (!ator?.update) return;
  const pv = Number(ator.system?.hp?.value) || 0;
  const combate = globalThis.game?.combat ?? null;
  let mudancas = {};
  let r = { pv: pv - (Number(imp.dano) || 0), absorvido: 0, noPV: Number(imp.dano) || 0 };
  if (ehNave(ator)) {
    const nave = naveDe(ator, ID);
    r = aplicarImpacto(nave, {
      pv, dano: imp.dano, avarias: imp.avarias ?? [], rodada: combate?.round ?? 0,
      reserva: escudoComoReserva(), tamanho: tamanhoDaNave(nave), combate: combate?.id ?? null,
      temEscudo: equipamentosDoAtor(ator, ID).has("escudo"), ponteOk: podeUsarEscudos(nave),
    });
    mudancas = updateDaNave(nave, r.nave, ID) ?? {};
  }
  await ator.update({ ...mudancas, "system.hp.value": r.pv });
  await msg.setFlag(ID, "impacto", { ...imp, aplicado: true });
  const escudo = r.absorvido ? txt("spacedragon.nave.disparo.escudoAbsorveu", { n: r.absorvido }) : "";
  globalThis.ui?.notifications?.info?.(txt("spacedragon.nave.disparo.aplicado", {
    alvo: escapa(ator.name), noPV: r.noPV, escudo,
  }));
}

/** O botão "Aplicar" dos cartões de disparo. Ligado no `ready`. */
export function ligarAplicarImpacto() {
  globalThis.Hooks?.on?.("renderChatMessageHTML", (msg, html) => {
    const b = html?.querySelector?.(`.${CLASSE_APLICAR}`);
    if (!b || b.dataset.ligado) return;
    b.dataset.ligado = "1";
    if (msg?.getFlag?.(ID, "impacto")?.aplicado) b.disabled = true;
    b.addEventListener("click", (ev) => {
      ev.preventDefault();
      aplicarImpactoDaMensagem(msg).catch((e) => console.error(`${ID} | aplicar o disparo falhou`, e));
    });
  });
  return true;
}

let Registrada = null;

/** Esta ficha é a de Nave sobre personagem? */
export function ehFichaDeNavePC(app) {
  return !!Registrada && app instanceof Registrada;
}

/**
 * Renomeia as abas e marca a ficha.
 *
 * Roda a cada render porque o sistema redesenha a ficha inteira a cada
 * alteração — um rótulo trocado uma vez só voltaria a "Raça" no primeiro
 * salvamento.
 */
export function renomearAbas(raiz) {
  if (!raiz) return 0;
  let trocados = 0;
  for (const item of raiz.querySelectorAll(".sheet-tabs .item, nav .item")) {
    const chave = item.dataset?.tab;
    const novo = ROTULOS[chave];
    if (!novo) continue;
    // só o texto, preservando ícone e qualquer marcação que o sistema ponha
    for (const no of item.childNodes) {
      if (no.nodeType === 3 && no.textContent.trim()) {
        no.textContent = ` ${novo} `;
        trocados += 1;
        break;
      }
    }
    if (!item.textContent.includes(novo)) {
      item.textContent = novo;
      trocados += 1;
    }
  }
  return trocados;
}


/* ── O SELETOR DE CÔMODOS ─────────────────────────────────────────────────
 *
 * A classe entrega os doze cômodos a toda nave — a aba de classe do sistema
 * não aceita habilidades avulsas, então a lista é sempre a das doze. O que a
 * ficha guarda é o ESTADO de cada uma, e é o que este seletor gira:
 * instalada → danificada → ausente → instalada.
 *
 * De fábrica vêm só a Ponte e a Sala de Máquinas, as duas que o texto veta
 * dispensar (§4 das Regras Compiladas). As outras dez começam ausentes e se
 * instalam clicando — dentro do orçamento que o tamanho dá, que a ficha mostra
 * e não trava.
 *
 * ── COMO O CÔMODO É RECONHECIDO ───────────────────────────────────────────
 *
 * Pela FLAG do item, e não pelo nome: `flags["spacedragon"].camaraDeNave.chave`
 * — lida pelos DOIS ids por `flagDeNave`, porque os cômodos que já estão dentro
 * das naves da mesa foram copiados quando o id ainda era "starwars-sd", e
 * recompilar o pack não toca num item embedado.
 * Nome muda com tradução e com revisão de texto; a flag é nossa e não muda.
 */
export const CLASSE_SELETOR = "sw-comodo-estado";

// regra da casa: o que a nave não tem se COMPRA, e o botão diz isso. Função,
// e não objeto, para a tradução ser lida na hora de desenhar.
const ROTULO_DO_ESTADO = (estado) => ({
  instalada: txt("spacedragon.nave.camara.instalada"),
  danificada: txt("spacedragon.nave.camara.danificada"),
  ausente: txt("spacedragon.nave.camara.comprar"),
})[estado];

const escapaAtributo = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/**
 * O seletor de um cômodo, dizendo o estado e o que o PRÓXIMO clique faz.
 *
 * O título nomeia a próxima ação em vez de descrever o ciclo inteiro. "Clique
 * para girar: instalada → danificada → ausente" obriga quem lê a localizar onde
 * está antes de saber o que vai acontecer; "clique para desinstalar" responde
 * direto — e deixa claro que desinstalar é possível, que foi a dúvida da mesa
 * quando o padrão passou a ser "instalada".
 */
/** As duas regras opcionais que mudam o seletor, lidas na hora de desenhar. */
export const regrasDaFicha = () => ({ modular: naveModular(), compilado: combateCompilado() });

/**
 * O estado seguinte, conforme as regras ligadas.
 *
 * Com as Regras Compiladas, o ciclo tem a câmara danificada. Sem elas, câmara
 * não se danifica (o livro não tem essa regra): a nave tem ou não tem, e uma
 * danificada que sobrou de antes volta a instalada no primeiro clique.
 */
export function seguinteNaFicha(estado, { compilado = true } = {}) {
  if (compilado) return proximoEstado(estado);
  return estado === "instalada" ? "ausente" : "instalada";
}

export function botaoDoComodo(chave, estado, regras = regrasDaFicha()) {
  const { modular = true, compilado = true } = regras;
  const rotulo = (estado === "ausente" && !modular)
    ? txt("spacedragon.nave.camara.naoTem")
    : (ROTULO_DO_ESTADO(estado) ?? estado);
  const seguinte = seguinteNaFicha(estado, { compilado });
  const c = CAMARAS[chave];
  const obra = creditos(c?.obra);
  const prazo = c?.prazo ?? txt("spacedragon.nave.camara.prazoDoMestre");
  const efeito = c?.efeito ?? "";
  const titulo = estado === "ausente"
    ? (modular
        ? txt("spacedragon.nave.camara.dicaComprar", { obra, prazo, efeito })
        : txt("spacedragon.nave.camara.dicaMarcar", { efeito }))
    : estado === "danificada"
      ? (compilado
          ? txt("spacedragon.nave.camara.dicaDanificada")
          : txt("spacedragon.nave.camara.dicaDanificadaLivro"))
      : (compilado
          ? txt("spacedragon.nave.camara.dicaInstalada")
          : txt("spacedragon.nave.camara.dicaInstaladaLivro"));
  return (
    `<button type="button" class="${CLASSE_SELETOR} estado-${estado}" ` +
    `data-comodo="${chave}" data-proximo="${seguinte}" ` +
    `title="${escapaAtributo(titulo)}">${rotulo}</button>`
  );
}

/* ── O PAINEL DAS CÂMARAS (regra da casa: a nave é modular) ─────────────── */

export const MARCA_CAMARAS = "sd-painel-camaras";

/**
 * O topo da aba Câmaras: o que veio de fábrica, o que foi comprado, e quanto
 * o tamanho ainda comporta. Sem isto a aba mostrava as doze câmaras em fila,
 * e as que a nave não tinha só ficavam um pouco mais claras.
 */
export function painelDasCamaras(ator, nave, regras = regrasDaFicha()) {
  if (regras.modular === false) return painelDeReferencia(nave);
  const r = resumoDasCamaras(nave, {
    cp: ator?.system?.ac_total ?? nave?.cp ?? null,
    raca: ator?.system?.race?.name ?? "",
  });
  const marca = (e) => (e === "instalada" ? "✔" : e === "danificada" ? "⚠" : "✘");
  const fabrica = r.fabrica
    .map((l) => `<li class="camara-${l.estado}">${marca(l.estado)} ${l.rotulo}` +
      (l.estado === "instalada" ? "" : ` <em>(${l.estado === "danificada"
        ? txt("spacedragon.nave.camaras.estaDanificada")
        : txt("spacedragon.nave.camaras.arrancada")})</em>`) +
      `</li>`)
    .join("");
  const cp = r.casco.cp;
  const casco = `<li class="camara-instalada">✔ ${txt("spacedragon.nave.camaras.casco")}` +
    (cp != null && cp !== "" ? ` <em>${txt("spacedragon.nave.camaras.cascoCP", { cp })}</em>` : "") + `</li>`;

  const o = r.orcamento;
  const limite = r.conhecido
    ? `<p class="camaras-limite${o.excedeu ? " excedeu" : ""}">` +
      txt("spacedragon.nave.camaras.limite", { usadas: o.usadas, livres: o.livres, tamanho: r.tamanho }) +
      (o.excedeu ? txt("spacedragon.nave.camaras.excedeu") : "") +
      (o.livres === 0 && !o.usadas ? txt("spacedragon.nave.camaras.pequena") : "") +
      `</p>`
    : `<p class="camaras-limite">${txt("spacedragon.nave.camaras.semTipo")}</p>`;

  const danificada = txt("spacedragon.nave.camaras.estaDanificada");
  const lista = r.compradas.map((l) => l.rotulo + (l.estado === "danificada" ? ` (${danificada})` : "")).join(", ");
  const compradas = r.compradas.length
    ? `<p class="camaras-compradas">${txt("spacedragon.nave.camaras.compradas", { lista })}</p>`
    : "";

  return (
    `<section class="${MARCA_CAMARAS}">` +
    txt("spacedragon.nave.camaras.deFabrica") +
    `<ul>${fabrica}${casco}</ul>` +
    limite + compradas +
    `<p class="camaras-dica">${txt("spacedragon.nave.camaras.dica")}</p>` +
    `</section>`
  );
}

/**
 * A aba Câmaras sem a regra da casa: nada de fábrica, compra nem limite. A
 * T10-2 fica como referência, e o seletor só marca o que a nave tem.
 */
export function painelDeReferencia(nave) {
  const tem = Object.keys(CAMARAS)
    .filter((c) => estadoDoComodo(nave, c) !== "ausente")
    .map((c) => CAMARAS[c].rotulo);
  const lista = tem.length ? tem.join(", ") : txt("spacedragon.nave.camaras.nenhuma");
  return (
    `<section class="${MARCA_CAMARAS} camaras-referencia">` +
    `<p>${txt("spacedragon.nave.camaras.referencia")}</p>` +
    `<p class="camaras-compradas">${txt("spacedragon.nave.camaras.tem", { lista })}</p>` +
    `</section>`
  );
}

/** Põe o painel no alto da aba Câmaras (a aba de classe), sem duplicar. */
export function porPainelDasCamaras(raiz, ator) {
  if (!raiz?.querySelector || !ator) return false;
  const aba = raiz.querySelector(".character-tab-class") ??
              raiz.querySelector('[data-tab="class"]:not(nav [data-tab="class"])');
  if (!aba) return false;
  aba.querySelector(`.${MARCA_CAMARAS}`)?.remove();
  aba.insertAdjacentHTML("afterbegin", painelDasCamaras(ator, naveDe(ator, ID)));
  return true;
}

/* ── O PLANO B: O NOME ESCRITO NA FICHA ─────────────────────────────── */

/** De rótulo para chave: "Ponte de Comando" → "ponte". Montado uma vez. */
const CHAVE_POR_ROTULO = new Map(
  Object.entries(CAMARAS).map(([chave, c]) => [c.rotulo.toLowerCase(), chave])
);

/**
 * A chave do cômodo lida do NOME escrito no `<li>`.
 *
 * ── POR QUE UM PLANO B, E POR QUE ESTE ─────────────────────────────
 *
 * Os cômodos chegam à nave como habilidades da CLASSE, e `data-item-id` aponta
 * para a habilidade dentro de `actor.system.class_abilities`, que o sistema
 * resolve a partir dos UUIDs do COMPÊNDIO. Esses documentos nem sempre estão
 * embutidos no ator: `ator.items.get(id)` devolve `undefined`, o laço dá
 * `continue`, e a ficha fica sem botão nenhum — sem erro no console, porque
 * não há erro.
 *
 * Isto não é novidade neste projeto: `painel.js` já tinha vivido a mesma falha
 * e já tinha a mesma saída, com a mesma nota escrita. Eu reescrevi a leitura
 * por `items.get` de novo aqui, em código novo, enquanto a lição estava num
 * arquivo ao lado. É por isso que o teste desta função simula o ator SEM os
 * itens: é o caso real da mesa, e era o único que nenhum teste cobria.
 *
 * O escopo é `.ability strong`, que é o que o template do sistema escreve para
 * uma habilidade de classe. Casar por nome em qualquer linha faria um
 * equipamento chamado "Arsenal" virar cômodo; dentro de `.ability`, não.
 */
function chavePeloNome(linha) {
  const forte = linha.querySelector?.(".ability strong");
  if (!forte) return null;
  const nome = forte.textContent.trim().replace(/:$/, "").toLowerCase();
  return CHAVE_POR_ROTULO.get(nome) ?? null;
}

/**
 * Põe o seletor em cada cômodo da aba de classe, e marca os ausentes.
 *
 * Devolve quantos cômodos encontrou — zero significa que a nave não tem a
 * classe, ou que a aba não está desenhada, e aí não há o que fazer.
 */
export function marcarComodos(raiz, ator) {
  if (!raiz || !ator) return 0;
  const nave = naveDe(ator, ID);
  const regras = regrasDaFicha();
  let achados = 0;

  for (const linha of raiz.querySelectorAll("[data-item-id]")) {
    const item = ator.items?.get?.(linha.dataset.itemId);
    const chave = flagDeNave(item, "camaraDeNave", ID)?.chave ?? chavePeloNome(linha);
    if (!chave) continue;
    achados += 1;

    const estado = estadoDoComodo(nave, chave);
    // a classe no elemento deixa o CSS apagar o que a nave não tem
    linha.classList.remove("comodo-instalada", "comodo-danificada", "comodo-ausente");
    linha.classList.add(`comodo-${estado}`);

    linha.querySelectorAll(`.${CLASSE_SELETOR}`).forEach((n) => n.remove());
    linha.insertAdjacentHTML("beforeend", botaoDoComodo(chave, estado, regras));
  }
  return achados;
}

/**
 * Manda toda Ficha de Nave aberta se redesenhar.
 *
 * Quem troca uma opção de mundo precisa ver o efeito sem fechar a ficha. Isto
 * varre os DOIS registros de janela do Foundry 13: `ui.windows`, onde moram as
 * Applications V1 — e a ficha É V1, porque a classe-base do sistema é —, e
 * `foundry.applications.instances`, para o dia em que o sistema migrar. Varrer
 * só um dos dois faz a opção parecer que não funcionou.
 */
export function redesenharFichasDeNave() {
  const janelas = [
    ...Object.values(globalThis.ui?.windows ?? {}),
    ...(globalThis.foundry?.applications?.instances?.values?.() ?? []),
  ];
  for (const app of janelas) {
    try {
      if (Registrada && app instanceof Registrada) app.render(false);
    } catch { /* uma janela que não gosta de render não derruba as outras */ }
  }
}

export function registrarFichaDeNavePC() {
  const Base = baseDaFicha();
  if (!Base) return null;

  class NaveSheet extends Base {
    static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
        classes: [...super.defaultOptions.classes, MARCA_NAVE_PC],
      });
    }

    /** O caminho da V2, para quando o sistema migrar. Faz o mesmo que a V1. */
    async _onRender(contexto, opcoes) {
      await super._onRender?.(contexto, opcoes);
      this.#prepararFicha(this.element);
    }

    /**
     * O clique que gira o estado do cômodo.
     *
     * Delegado na raiz e registrado uma vez: a ficha redesenha a cada
     * alteração, e um listener por botão se multiplicaria a cada render.
     */
    /**
     * Grava quem está em cada posto.
     *
     * No `change`, e não a cada tecla: gravar por tecla faria a ficha
     * redesenhar no meio de uma palavra e tirar o foco do campo. O `change`
     * dispara ao sair do campo ou no Enter, que é quando a pessoa terminou.
     *
     * Delegado e registrado uma vez, como o dos cômodos — a ficha redesenha a
     * cada alteração, e um listener por campo se multiplicaria a cada render.
     */
    /**
     * Os botões das camadas: energia e os dois relógios da fuga.
     *
     * Os limites são aplicados AQUI e não só no desenho. Um botão desabilitado
     * impede o clique, mas um estado gravado fora da faixa — por outra versão,
     * por uma macro, por edição à mão — continuaria fora até alguém notar.
     */
    /**
     * Os botões das ações de posto e o do fim da rodada.
     *
     * O cartão vai para o chat porque a ação é da MESA, e não da ficha: quem
     * firmou precisa que os artilheiros saibam do +2. Um efeito que só aparece
     * na ficha de quem clicou não chega a quem ele beneficia.
     */
    /**
     * Grava só o que mudou.
     *
     * Gravar a flag inteira de uma vez SUBSTITUI o que lá estava, e numa nave
     * operada por cinco pessoas — que é o ponto do §7 — isso atropela: quem
     * gravar depois escreve por cima com a versão que leu antes, e a alteração
     * do outro desaparece sem erro nenhum. O jogador vê o campo voltar ao que
     * era e conclui que a ficha não salvou.
     *
     * Gravando caminho a caminho, o merge é do servidor, e duas escritas em
     * campos diferentes convivem.
     */
    async #gravarNave(antes, depois) {
      const mudancas = updateDaNave(antes, depois, ID);
      if (!mudancas) return;
      await this.actor.update(mudancas);
    }

    #ligarAcoes(raiz) {
      if (!raiz?.dataset || raiz.dataset.swAcoes === "1") return;
      raiz.dataset.swAcoes = "1";
      raiz.addEventListener("click", async (ev) => {
        const fim = ev.target?.closest?.(`.${CLASSE_FIM_RODADA}`);
        const botao = ev.target?.closest?.(`.${CLASSE_ACAO}`);
        if (!fim && !botao) return;
        ev.preventDefault();
        ev.stopPropagation();
        if (!this.isEditable) return;

        const nave = naveDe(this.actor, ID);

        const falante = globalThis.ChatMessage?.getSpeaker?.({ actor: this.actor });

        if (fim) {
          // ── O FIM DA RODADA COBRA O QUE A RODADA DEVEU (nave-combate.js) ──
          //
          // Primeiro o Calor e os prazos, que leem a energia gasta; só depois a
          // limpeza, que a zera.
          const rodada = globalThis.game?.combat?.round ?? 0;
          const comCalor = camadaLigada("camadaEnergia");
          let d6 = null;
          const calor = calorNoFimDaRodada(nave);
          if (comCalor && calor > 0) {
            const roll = await new globalThis.Roll("1d6").evaluate();
            d6 = roll.total;
            await roll.toMessage({
              speaker: falante,
              flavor: txt("spacedragon.nave.camadas.calorTeste", {
                calor, d6,
                resultado: d6 <= calor ? txt("spacedragon.nave.camadas.calorAvaria") : txt("spacedragon.nave.camadas.calorOk"),
              }),
            });
          }
          const { nave: depois, eventos } = fimDaRodada(nave, {
            rodada, prazos: camadaLigada("camadaAvarias"), calor: comCalor, d6,
          });
          await this.#gravarNave(nave, limparFimDaRodada(depois));
          for (const e of eventos.filter((x) => x.tipo === "camara")) {
            await globalThis.ChatMessage?.create?.({
              speaker: falante,
              content: `<p>${txt("spacedragon.nave.camadas.camaraDanificada", {
                avaria: AVARIAS[e.avaria].rotulo, camara: CAMARAS[e.camara]?.rotulo ?? e.camara,
              })}</p>`,
            });
          }
          globalThis.ui?.notifications?.info?.(txt("spacedragon.aviso.fimDaRodada"));
          return;
        }

        if (botao.dataset.acao === "reparar" && !podeRepararEmCombate(nave)) {
          globalThis.ui?.notifications?.warn?.(txt("spacedragon.nave.tripulacao.semMaquinas"));
          return;
        }
        // Travar e Supressão apontam o token marcado (tecla T)
        const marcado = [...(globalThis.game?.user?.targets ?? [])][0] ?? null;
        const r = aplicarAcao(nave, botao.dataset.posto, botao.dataset.acao, {
          alvo: marcado?.id ?? null, alvoNome: escapa(marcado?.name ?? ""),
        });
        if (r.erro) {
          globalThis.ui?.notifications?.warn?.(r.erro);
          return;
        }
        await this.#gravarNave(nave, r.nave);

        const linhas = r.cartao.linhas.map((l) => `<li>${l.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")}</li>`).join("");
        await globalThis.ChatMessage?.create?.({
          speaker: globalThis.ChatMessage?.getSpeaker?.({ actor: this.actor }),
          content:
            `<div class="spacedragon-cartao">` +
            `<h4>${r.cartao.titulo}</h4>` +
            `<ul>${linhas}</ul>` +
            (r.cartao.nota ? `<p class="cartao-nota">${r.cartao.nota}</p>` : "") +
            `</div>`,
        });

        // a rolagem fica com a mesa, mas o dado é rolado aqui para não exigir
        // que alguém digite /r 1d6 no meio da rodada
        for (const rol of r.rolagens) {
          const roll = await new globalThis.Roll(rol.formula).evaluate();
          if (rol.curaPV) {
            // o casco recupera, sem passar do máximo
            const hp = this.actor.system?.hp ?? {};
            const novo = Math.min(Number(hp.max) || Infinity, (Number(hp.value) || 0) + roll.total);
            await this.actor.update({ "system.hp.value": novo });
          }
          await roll.toMessage({
            speaker: falante,
            flavor: txt("spacedragon.nave.tripulacao.cura", { pv: roll.total }),
          });
        }
      });
    }

    /**
     * O clique no ataque de uma arma de nave é da Ficha de Nave.
     *
     * Em CAPTURA, na raiz: o Qualidade de Vida também ouve ali, em captura, mas
     * liga o ouvinte dele depois, no gancho de render — e o nosso, ligado aqui,
     * roda primeiro. Parar o evento impede que ele cancele o tiro por falta de
     * munição e que o sistema role o ataque comum. Qualquer outro ataque
     * (armas pessoais, desarmado) passa direto.
     */
    #ligarDisparo(raiz) {
      if (!raiz?.dataset || raiz.dataset.swDisparo === "1") return;
      raiz.dataset.swDisparo = "1";
      raiz.addEventListener("click", (ev) => {
        const botao = ev.target?.closest?.(SELETOR_ATAQUE);
        if (!botao) return;
        const achada = armaDoBotao(botao, this.actor);
        if (!achada) return;
        ev.preventDefault();
        ev.stopPropagation();
        ev.stopImmediatePropagation();
        this.#disparar(achada).catch((e) => console.error(`${ID} | o disparo falhou`, e));
      }, true);
    }

    /**
     * O disparo: «1d20 + BA da nave + BA à distância de quem opera a arma», mais
     * o Computador Balístico e a faixa de alcance (regra da casa).
     */
    async #disparar({ item, arma }) {
      const ator = this.actor;
      const nave = naveDe(ator, ID);
      const alvo = [...(globalThis.game?.user?.targets ?? [])][0] ?? null;
      const nomeAlvo = escapa(alvo?.name ?? alvo?.actor?.name ?? "");
      const nomeArma = escapa(item?.name ?? arma.nome);
      const alcance = alcanceEscrito(arma.alcance);
      // A distância só vale em METROS: numa cena de personagem (1,5 m) ou em
      // pés, a régua é outra, e a faixa escolhida sozinha sairia errada sem
      // ninguém notar. Fora de metros, a mesa escolhe a faixa.
      const unidade = String(globalThis.canvas?.scene?.grid?.units ?? "").trim();
      const medida = distanciaAoAlvo(ator, alvo);
      const emMetros = unidadeEmMetros(unidade);
      const metros = emMetros ? medida : null;
      const auto = faixaDoAlcance(arma.alcance, metros);

      if (auto?.fora) {
        globalThis.ui?.notifications?.warn?.(txt("spacedragon.nave.disparo.fora", { alvo: nomeAlvo, metros, arma: nomeArma, alcance }));
        return null;
      }

      // sem Ponte não há armas (T10-2), e em pane geral a nave não dispara:
      // dizer antes da janela poupa a mesa de preencher um tiro que não sai
      if (!podeAtacar(nave)) {
        globalThis.ui?.notifications?.warn?.(txt("spacedragon.nave.disparo.semPonte", { nave: escapa(ator.name) }));
        return null;
      }
      if (penalidadesDeAvaria(nave).semAtaque) {
        globalThis.ui?.notifications?.warn?.(txt("spacedragon.nave.disparo.emPane", { nave: escapa(ator.name) }));
        return null;
      }

      const art = artilheiroDaNave(nave);
      const faixaInicial = auto?.chave ?? "curta";
      const opcoes = FAIXAS.map((f) =>
        `<option value="${f.chave}"${f.chave === faixaInicial ? " selected" : ""}>${ROTULO_DA_FAIXA[f.chave]()}</option>`).join("");
      const rotuloArt = art
        ? txt("spacedragon.nave.disparo.artilheiroNome", { nome: escapa(art.nome) })
        : txt("spacedragon.nave.disparo.artilheiro");
      const conteudo =
        (alcance ? `<p>${txt("spacedragon.nave.disparo.alcance", { alcance })}</p>` : "") +
        `<p>${metros !== null
          ? txt("spacedragon.nave.disparo.distancia", { alvo: nomeAlvo, metros })
          : medida !== null && !emMetros
            ? txt("spacedragon.nave.disparo.escala", { unidade: escapa(unidade || "?") })
            : txt("spacedragon.nave.disparo.semDistancia")}</p>` +
        `<div class="form-group"><label>${txt("spacedragon.nave.disparo.faixa")}</label>` +
        `<select name="faixa">${opcoes}</select></div>` +
        `<div class="form-group"><label>${rotuloArt}</label>` +
        `<input type="number" name="artilheiro" value="${art?.bad ?? ""}"></div>` +
        `<div class="form-group"><label>${txt("spacedragon.nave.disparo.situacao")}</label>` +
        `<input type="number" name="situacao" value="0"></div>` +
        // a Rajada do posto de Artilharia já vem marcada; dá para marcar aqui também
        `<div class="form-group"><label>${txt("spacedragon.nave.disparo.rajada")}</label>` +
        `<input type="checkbox" name="rajada"${nave.rajada?.ativa ? " checked" : ""}></div>`;

      const V2 = globalThis.foundry?.applications?.api?.DialogV2;
      if (!V2) return null;
      const escolha = await V2.wait({
        window: { title: txt("spacedragon.janela.disparo", { arma: nomeArma }) },
        content: conteudo,
        buttons: [
          {
            action: "rolar", label: txt("spacedragon.botao.rolar"), default: true,
            callback: (_ev, botao) => Object.fromEntries(new FormData(botao.form)),
          },
          { action: "cancelar", label: txt("spacedragon.botao.cancelar") },
        ],
        rejectClose: false,
      });
      if (!escolha || typeof escolha !== "object") return null;

      const faixa = escolha.faixa in ROTULO_DA_FAIXA ? escolha.faixa : "curta";
      const rajada = escolha.rajada === "on";

      // ── O ESTADO DAS DUAS NAVES ENTRA NA CONTA (nave-combate.js) ──
      //
      // Até a 1.30 o tiro só somava BA, Balístico, artilheiro e faixa: Firmar,
      // Travar, Interferência, a energia, o Escudo de força e as avarias
      // ficavam no chat e fora do dado.
      const alvoAtor = alvo?.actor ?? null;
      const alvoEhNave = Boolean(alvoAtor && ehNave(alvoAtor));
      const naveAlvo = alvoEhNave ? naveDe(alvoAtor, ID) : {};
      const alvoToken = alvo?.id ?? alvo?.document?.id ?? null;
      const meuToken = this.token?.id ?? ator.getActiveTokens?.()?.[0]?.id ?? null;
      const { termos } = termosDoAtaque({
        atacante: nave, alvo: naveAlvo, alvoToken, suprimida: naveSuprimida(meuToken), rajada,
        ba: ator.system?.ba ?? 0,
        balistico: bonusDeAtaque(nave, equipamentosDoAtor(ator, ID)),
        artilheiro: escolha.artilheiro,
        faixa: penalidadeDaFaixa(faixa),
        situacao: escolha.situacao,
      });
      const cpBase = alvoAtor?.system?.ac_total ?? alvoAtor?.system?.ac ?? null;
      const cpInfo = alvoEhNave
        ? cpDoAlvo(naveAlvo, {
          cpBase,
          reserva: escudoComoReserva(),
          temEscudo: equipamentosDoAtor(alvoAtor, ID).has("escudo"),
          ponteOk: podeUsarEscudos(naveAlvo),
        })
        : cpBase !== null && Number.isFinite(Number(cpBase)) ? { cp: Number(cpBase), base: Number(cpBase), partes: [] } : null;

      const formula = formulaDosTermos(termos);
      const margemLigada = danoPorMargem();
      const multiplicador = multiplicadorDeDano();
      const avariaPorDano = alvoEhNave && camadaLigada("camadaAvarias");
      const pvMax = Number(alvoAtor?.system?.hp?.max) || 0;
      // a energia nas Armas vale num acerto só: "+1 dado de dano numa arma"
      let energia = camadaLigada("camadaEnergia") ? dadosExtrasDeDano(nave) : 0;

      const rolls = [];
      const tiros = [];
      const avarias = [];
      let total = 0;
      const rolar = async (f) => {
        const r = await new globalThis.Roll(f).evaluate();
        rolls.push(r);
        return r;
      };

      // a metralhadora rola os QUATRO ataques; até a 1.30 rolava um só
      for (let i = 0; i < Math.max(1, Number(arma.ataques) || 1); i += 1) {
        const ataque = await rolar(formula);
        const natural = ataque.dice?.[0]?.total;
        const acerto = natural === 20 || (natural !== 1 && (!cpInfo || ataque.total >= cpInfo.cp));
        const tiro = { total: ataque.total, natural, acerto, notas: [] };

        if (natural === 1) {
          const d = await rolar("1d6");
          tiro.notas.push(txt("spacedragon.nave.disparo.falha", { d6: d.total, efeito: FALHA_T10_6[d.total] }));
        }
        if (acerto && arma.dano) {
          let critico = null;
          if (natural === 20) {
            const d = await rolar("1d6");
            critico = CRITICO_T10_6[d.total];
            tiro.notas.push(txt("spacedragon.nave.disparo.critico", { d6: d.total, efeito: critico.texto }));
            if (critico.avaria) avarias.push(critico.avaria);
          }
          const margem = margemLigada && cpInfo ? dadosPorMargem(ataque.total, cpInfo.cp) : 0;
          const { formula: fDano, extras } = formulaDoDano(arma, { rajada, energia, margem });
          energia = 0;
          const rDano = await rolar(fDano);
          const dano = danoFinal(rDano.total, { multiplicador, critico });
          total += dano;
          Object.assign(tiro, { dano, formulaDano: fDano, extras });
          if (avariaPorDano && causaAvaria(dano, pvMax)) {
            const d = await rolar("1d6");
            const k = AVARIA_POR_DANO[d.total];
            avarias.push(k);
            tiro.notas.push(txt("spacedragon.nave.disparo.avariaPorDano", { avaria: AVARIAS[k].rotulo, efeito: AVARIAS[k].efeito }));
          }
        }
        tiros.push(tiro);
      }

      // a Rajada do posto vale um disparo: gasta-se aqui
      if (nave.rajada?.ativa) await this.#gravarNave(nave, { ...nave, rajada: undefined });

      const cartao = cartaoDoDisparo({
        nomeArma, faixa: ROTULO_DA_FAIXA[faixa](), nomeAlvo, termos, cpInfo, tiros, total,
        avarias, multiplicador, arma, temAlvo: Boolean(alvo?.document?.uuid),
      });
      const impacto = alvo?.document?.uuid && (total > 0 || avarias.length)
        ? { alvo: alvo.document.uuid, nome: alvo.name ?? alvoAtor?.name ?? "", dano: total, avarias }
        : null;
      await globalThis.ChatMessage?.create?.({
        speaker: globalThis.ChatMessage?.getSpeaker?.({ actor: ator }),
        content: cartao,
        rolls,
        ...(impacto ? { flags: { [ID]: { impacto } } } : {}),
      });
      return { formula, tiros, total, avarias, faixa };
    }

    /** Grava a XP da nave abatida; em branco volta à tabela do tipo. */
    #ligarXP(raiz) {
      if (!raiz?.dataset || raiz.dataset.swXp === "1") return;
      raiz.dataset.swXp = "1";
      raiz.addEventListener("change", async (ev) => {
        const campo = ev.target?.closest?.(`.${CLASSE_XP}`);
        if (!campo || !this.isEditable) return;
        const nave = naveDe(this.actor, ID);
        const bruto = String(campo.value ?? "").trim();
        const xp = bruto === "" ? null : Math.max(0, Math.trunc(Number(bruto) || 0));
        await this.#gravarNave(nave, { ...nave, xp });
      });
    }

    #ligarCamadas(raiz) {
      if (!raiz?.dataset || raiz.dataset.swCamadas === "1") return;
      raiz.dataset.swCamadas = "1";
      raiz.addEventListener("click", async (ev) => {
        const energia = ev.target?.closest?.(`.${CLASSE_ENERGIA}`);
        const relogio = ev.target?.closest?.(`.${CLASSE_RELOGIO}`);
        if (!energia && !relogio) return;
        ev.preventDefault();
        ev.stopPropagation();
        if (!this.isEditable) return;

        const nave = naveDe(this.actor, ID);
        if (energia) {
          const destino = energia.dataset.destino;
          const passo = Number(energia.dataset.passo) || 0;
          const atual = { ...(nave.energia ?? {}) };
          // nunca negativo: "−1 ponto em escudos" não quer dizer nada
          atual[destino] = Math.max(0, (Number(atual[destino]) || 0) + passo);
          await this.#gravarNave(nave, { ...nave, energia: atual });
          return;
        }

        const lado = relogio.dataset.lado;
        const passo = Number(relogio.dataset.passo) || 0;
        const fuga = { ...(nave.fuga ?? {}) };
        const teto = lado === "salto" ? ETAPAS.length : MARCAS_DO_PERSEGUIDOR;
        const campo = lado === "salto" ? "etapas" : "perseguidor";
        fuga[campo] = Math.max(0, Math.min(teto, (Number(fuga[campo]) || 0) + passo));
        await this.#gravarNave(nave, { ...nave, fuga });
      });
    }

    #ligarPostos(raiz) {
      if (!raiz?.dataset || raiz.dataset.swPostos === "1") return;
      raiz.dataset.swPostos = "1";
      raiz.addEventListener("change", async (ev) => {
        const campo = ev.target?.closest?.(`.${CLASSE_POSTO}`);
        if (!campo?.dataset?.posto) return;
        if (!this.isEditable) return;
        const nave = naveDe(this.actor, ID);
        const quem = String(campo.value ?? "").trim();
        const postos = { ...(nave.postos ?? {}) };
        // vazio APAGA a chave em vez de gravar "": um posto vago é a ausência
        // do registro, e é o que `postosOcupados` conta
        if (quem) postos[campo.dataset.posto] = quem;
        else delete postos[campo.dataset.posto];
        await this.#gravarNave(nave, { ...nave, postos });
      });
    }

    #ligarComodos(raiz) {
      if (!raiz?.dataset || raiz.dataset.swComodos === "1") return;
      raiz.dataset.swComodos = "1";
      raiz.addEventListener("click", async (ev) => {
        const b = ev.target?.closest?.(`.${CLASSE_SELETOR}`);
        if (!b?.dataset?.comodo) return;
        ev.preventDefault();
        ev.stopPropagation();
        if (!this.isEditable) return;
        const nave = naveDe(this.actor, ID);
        const chave = b.dataset.comodo;
        const { modular, compilado } = regrasDaFicha();
        const atual = estadoDoComodo(nave, chave);
        // compra e reparo são das regras opcionais; sem elas, o clique só marca
        if (atual === "ausente" && modular) return this.#comprarCamara(chave);
        if (atual === "danificada" && compilado) return this.#repararOuArrancar(chave);
        const novo = seguinteNaFicha(atual, { compilado });
        await this.#gravarNave(nave, {
          ...nave,
          camaras: { ...(nave.camaras ?? {}), [chave]: novo },
        });
      });
    }

    /**
     * Regra da casa: comprar uma câmara.
     *
     * Confirma com o preço, o prazo e o que ela faz — e avisa se passa do que
     * o tamanho comporta, sem impedir. Confirmado, a câmara entra instalada e
     * a obra vai para o chat, que é o registro que a mesa consulta depois.
     * O dinheiro sai de quem paga, à mão: a nave não tem carteira.
     */
    async #comprarCamara(chave) {
      if (!this.isEditable) return null;
      const nave = naveDe(this.actor, ID);
      const est = estadoDoComodo(nave, chave);
      if (est !== "ausente") {
        const dados = { camara: CAMARAS[chave]?.rotulo ?? chave, nave: this.actor.name };
        globalThis.ui?.notifications?.info?.(est === "danificada"
          ? txt("spacedragon.aviso.camaraDanificada", { camara: dados.camara, nave: dados.nave })
          : txt("spacedragon.aviso.camaraJaInstalada", { camara: dados.camara, nave: dados.nave }));
        return null;
      }
      const compra = compraDeCamara(chave, nave, this.actor?.system?.race?.name ?? "");
      if (!compra) return null;

      const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;");
      // tudo que vem da mesa (nome da nave) entra escapado ANTES de ir ao texto
      const camara = esc(compra.rotulo);
      const nomeNave = esc(this.actor.name);
      const obra = creditos(compra.obra);
      const prazo = esc(compra.prazo);
      const tamanho = esc(compra.tamanho);
      const conteudo =
        `<p>${txt("spacedragon.nave.compra.em", { camara, nave: nomeNave })}</p>` +
        `<p>${txt("spacedragon.nave.compra.obra", { obra, prazo })}</p>` +
        `<p><em>${esc(compra.efeito)}</em></p>` +
        (compra.excede
          ? `<p class="camaras-excede">${txt("spacedragon.nave.compra.excede", { tamanho, livres: compra.livres, usadas: compra.usadas })}</p>`
          : "") +
        `<p>${txt("spacedragon.nave.compra.quemPaga")}</p>`;

      const V2 = globalThis.foundry?.applications?.api?.DialogV2;
      const ok = V2
        ? await V2.confirm({ window: { title: txt("spacedragon.janela.comprarCamara") }, content: conteudo, rejectClose: false })
        : globalThis.confirm?.(txt("spacedragon.nave.compra.confirmar", { camara: compra.rotulo, obra, prazo: compra.prazo }));
      if (!ok) return null;

      await this.#gravarNave(nave, { ...nave, camaras: { ...(nave.camaras ?? {}), [chave]: "instalada" } });
      await globalThis.ChatMessage?.create?.({
        speaker: globalThis.ChatMessage.getSpeaker?.({ actor: this.actor }),
        content:
          `<div class="sd-teste"><div class="title">${esc(txt("spacedragon.janela.comprarCamara"))}</div>` +
          `<p>${txt("spacedragon.nave.compra.chatInstalada", { camara, nave: nomeNave })}</p>` +
          `<p>${txt("spacedragon.nave.compra.chatObra", { obra, prazo })}</p>` +
          (compra.excede ? `<p>${txt("spacedragon.nave.compra.chatExcede", { tamanho })}</p>` : "") +
          `</div>`,
      });
      return chave;
    }

    /**
     * A câmara danificada: reparar (25% da obra, metade do prazo) ou arrancar.
     *
     * Antes o clique numa danificada a ARRANCAVA, e a única volta era comprá-la
     * de novo pelo preço cheio — embora a dica e a T10-2 falassem em reparo.
     */
    async #repararOuArrancar(chave) {
      if (!this.isEditable) return null;
      const nave = naveDe(this.actor, ID);
      const r = reparoDeCamara(chave, nave);
      if (!r) return null;
      const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;");
      const camara = esc(r.rotulo);
      const nomeNave = esc(this.actor.name);
      const custo = creditos(r.custo);
      const prazo = esc(r.prazo);

      const V2 = globalThis.foundry?.applications?.api?.DialogV2;
      const escolha = V2
        ? await V2.wait({
            window: { title: txt("spacedragon.janela.camaraDanificada") },
            content:
              `<p>${txt("spacedragon.nave.reparo.danificada", { camara, nave: nomeNave })}</p>` +
              `<p>${txt("spacedragon.nave.reparo.custo", { custo, prazo })}</p>`,
            buttons: [
              { action: "reparar", label: txt("spacedragon.botao.reparar"), default: true },
              { action: "arrancar", label: txt("spacedragon.botao.arrancar") },
              { action: "cancelar", label: txt("spacedragon.botao.cancelar") },
            ],
            rejectClose: false,
          })
        : (globalThis.confirm?.(txt("spacedragon.nave.reparo.confirmar", { camara: r.rotulo, custo })) ? "reparar" : null);

      if (escolha !== "reparar" && escolha !== "arrancar") return null;
      const novo = escolha === "reparar" ? "instalada" : "ausente";
      await this.#gravarNave(nave, { ...nave, camaras: { ...(nave.camaras ?? {}), [chave]: novo } });
      if (escolha === "reparar") {
        await globalThis.ChatMessage?.create?.({
          speaker: globalThis.ChatMessage.getSpeaker?.({ actor: this.actor }),
          content:
            `<div class="sd-teste"><div class="title">${esc(txt("spacedragon.janela.camaraDanificada"))}</div>` +
            `<p>${txt("spacedragon.nave.reparo.chatReparada", { camara, nave: nomeNave })}</p>` +
            `<p>${txt("spacedragon.nave.reparo.chatCusto", { custo, prazo })}</p></div>`,
        });
      }
      return escolha;
    }

    /**
     * Arrastar uma câmara do compêndio para a nave é COMPRÁ-LA.
     *
     * Antes o item caía no inventário como objeto solto, e nada mudava na nave.
     * Agora a câmara (reconhecida pela flag `camaraDeNave`) passa pela mesma
     * compra do botão, e nenhum item é criado. O resto segue para o sistema.
     */
    async _onDropItem(event, data) {
      // Qualquer falha AQUI devolve o item ao sistema: reconhecer câmara é um
      // extra, e não pode custar o arrastar do tipo, da classe ou de uma arma.
      let chave = null;
      try {
        const item = await globalThis.Item?.implementation?.fromDropData?.(data);
        chave = flagDeNave(item, "camaraDeNave", ID)?.chave ?? null;
      } catch { chave = null; }
      if (!chave || !CAMARAS[chave]) return super._onDropItem(event, data);
      event?.preventDefault?.();
      if (naveModular()) return this.#comprarCamara(chave);
      // sem a regra da casa, arrastar a câmara é dizer que a nave a tem
      const nave = naveDe(this.actor, ID);
      if (estadoDoComodo(nave, chave) === "instalada") return chave;
      await this.#gravarNave(nave, { ...nave, camaras: { ...(nave.camaras ?? {}), [chave]: "instalada" } });
      return chave;
    }

    /**
     * O caminho que REALMENTE roda nesta mesa.
     *
     * A cadeia medida no console é ActorSheet → OD2CharacterSheet →
     * SDCharacterSheet: Application **V1**. Numa ficha V1 o Foundry não chama
     * `_onRender` — chama `activateListeners`. Eu tinha deixado aqui só o
     * renomear das abas, e com isso o seletor de cômodos e a ocultação dos
     * campos nunca apareceriam, embora o teste passasse verde.
     *
     * Então os dois caminhos fazem o MESMO, e chamam a mesma função: o dia em
     * que o sistema migrar para V2, nada aqui precisa mudar.
     */
    activateListeners(html) {
      super.activateListeners?.(html);
      this.#prepararFicha(html instanceof HTMLElement ? html : html?.[0]);
    }

    /** Tudo o que a Ficha de Nave faz no DOM, num lugar só. */
    #prepararFicha(raiz) {
      if (!raiz) return;
      // ── O FOCO SOBREVIVE AO REDESENHO ──────────────────────────────────
      //
      // Toda gravação redesenha a ficha em TODOS os clientes que a têm aberta.
      // Numa nave operada por cinco pessoas isso acontece o tempo todo — e
      // quem estivesse digitando o nome de um tripulante via o campo ser
      // recriado e perder o foco no meio da palavra.
      //
      // Guardamos qual campo estava em foco e onde estava o cursor, e
      // devolvemos depois de redesenhar. O jogador continua digitando.
      const antes = this.#guardarFoco(raiz);
      try {
        renomearAbas(raiz);
        marcarComodos(raiz, this.actor);
        porPainelDasCamaras(raiz, this.actor);
        ocultarOQueNaveNaoUsa(raiz);
        porPainelDeVoo(raiz, this.actor);
        porPainelDaTripulacao(raiz, this.actor);
        porPainelDasCamadas(raiz, this.actor);
        porGuiaDeMontagem(raiz, this.actor);
        this.#ligarComodos(raiz);
        this.#ligarPostos(raiz);
        this.#ligarCamadas(raiz);
        this.#ligarAcoes(raiz);
        this.#ligarDisparo(raiz);
        this.#ligarXP(raiz);
      } catch (e) {
        console.warn(`${ID} | não pude preparar a Ficha de Nave`, e);
      }
      this.#devolverFoco(raiz, antes);
    }

    /** Qual campo nosso estava em foco, e onde o cursor estava nele. */
    #guardarFoco(raiz) {
      try {
        const alvo = raiz?.ownerDocument?.activeElement;
        if (!alvo || !raiz.contains?.(alvo)) return null;
        // só os campos QUE NÓS criamos: devolver foco a um campo do sistema
        // seria mexer no que não é nosso, e o sistema tem a própria lógica
        const nosso = alvo.classList?.contains(CLASSE_POSTO);
        if (!nosso) return null;
        return {
          posto: alvo.dataset?.posto,
          inicio: alvo.selectionStart,
          fim: alvo.selectionEnd,
        };
      } catch {
        return null;
      }
    }

    /** Devolve o foco ao campo que o tinha, com o cursor onde estava. */
    #devolverFoco(raiz, antes) {
      if (!antes?.posto) return;
      try {
        const campo = raiz.querySelector(`.${CLASSE_POSTO}[data-posto="${antes.posto}"]`);
        if (!campo) return;
        campo.focus();
        // o cursor volta para onde estava: devolver o foco e jogar o cursor
        // para o fim seria quase tão ruim quanto perder o foco
        if (antes.inicio != null) campo.setSelectionRange?.(antes.inicio, antes.fim);
      } catch { /* um campo que não aceita foco não derruba a ficha */ }
    }
  }

  foundry.documents.collections.Actors.registerSheet(ID, NaveSheet, {
    types: ["character"],
    label: txt("spacedragon.ficha.nave"),
    // NUNCA padrão: ela é para os atores que são naves, e o mundo é de
    // personagens. Quem cria uma nave escolhe no botão "Sheet" do ator.
    makeDefault: false,
  });

  Registrada = NaveSheet;
  console.log(`${ID} | Ficha de Nave sobre personagem registrada`);
  return NaveSheet;
}
