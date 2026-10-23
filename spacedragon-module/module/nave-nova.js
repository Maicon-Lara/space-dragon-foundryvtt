/**
 * Criar uma nave pronta, numa ação só.
 *
 * ── O PROBLEMA QUE ISTO RESOLVE ─────────────────────────────────────────────
 *
 * Fazer uma nave à mão são quatro passos, e nenhum é óbvio:
 *
 *   1. criar um ator do tipo PERSONAGEM (e não "Nave", que não existe mais)
 *   2. trocar a ficha para a de Nave, numa engrenagem do cabeçalho
 *   3. arrastar a RAÇA do tipo, do compêndio Naves
 *   4. arrastar a CLASSE de mesmo nome — e nessa ordem, porque o sistema
 *      recusa a classe sem raça com uma notificação que some em segundos
 *
 * A mesa errou os passos 1 e 4 no mesmo dia. O guia na ficha ajuda quem já
 * chegou lá; isto evita a viagem.
 *
 * ── POR QUE A ORDEM IMPORTA AQUI TAMBÉM ─────────────────────────────────────
 *
 * As habilidades de raça entram pelo `syncRaceAbilities` do sistema, e é a
 * habilidade que carrega o `natural_armor` — ou seja, o CP. Embutir os itens
 * sem chamar o sync cria uma nave com CP 10, e o erro só aparece quando alguém
 * leva um tiro.
 */

import { naveVazia, FLAG, aplicarTipo, lerFlag, naveDe } from "./nave-pc-dados.js";
import { LADO_POR_TAMANHO, ajustarToken } from "./nave-token.js";
import { TIPOS } from "./tipos-de-nave.js";

import { t as txt } from "./i18n.js";

const ID = "spacedragon";
const PACK = "spacedragon.spacedragon-naves";

/** O nome da classe de nave de um tipo, como o build a semeia. */
export function nomeDaClasse(rotulo) {
  return `Nave — ${rotulo}`;
}

/** As opções do seletor: os oito tipos da T10-1, com o que a mesa precisa ver. */
export function opcoesDeTipo() {
  return Object.entries(TIPOS).map(([chave, t]) => ({
    chave,
    rotulo: t.rotulo,
    // tamanho e tripulação decidem a escolha mais do que os números: é o que
    // diz se a nave é uma cabine ou uma cidade
    detalhe: `${t.tamanho} · tripulação ${t.tripulacao} · PV ${t.pv} · CP ${t.cp} · BA +${t.ba}`,
  }));
}

/**
 * Busca a raça e a classe de um tipo no compêndio.
 *
 * Devolve o que achou e o que faltou, em vez de falhar: uma nave sem a classe
 * ainda é melhor que nenhuma nave, e o aviso diz o que arrastar à mão.
 */
export async function itensDoTipo(chave) {
  const t = TIPOS[chave];
  const pack = globalThis.game?.packs?.get?.(PACK);
  if (!t || !pack) return { raca: null, classe: null, faltou: ["o compêndio de Naves"] };

  const idx = await pack.getIndex();
  const achar = (nome, tipo) => idx.find?.((e) => e.name === nome && e.type === tipo);
  const eRaca = achar(t.rotulo, "race");
  const eClasse = achar(nomeDaClasse(t.rotulo), "class") ?? achar(t.rotulo, "class");

  const faltou = [];
  if (!eRaca) faltou.push(`a raça “${t.rotulo}”`);
  if (!eClasse) faltou.push(`a classe “${nomeDaClasse(t.rotulo)}”`);

  return {
    raca: eRaca ? await pack.getDocument(eRaca._id) : null,
    classe: eClasse ? await pack.getDocument(eClasse._id) : null,
    faltou,
  };
}

/**
 * Cria a nave pronta: ator, ficha, tipo, classe e as habilidades sincronizadas.
 *
 * Os PV ficam em zero de propósito. A T10-1 dá uma FÓRMULA (1d100, 2d1000), e
 * quem rola é a mesa — sortear aqui faria duas naves do mesmo tipo nascerem
 * diferentes sem ninguém ver o dado, e tiraria do Mestre a nave-padrão.
 */
export async function criarNave({ nome, tipo } = {}) {
  const t = TIPOS[tipo];
  if (!t) return { ator: null, avisos: [`Tipo de nave desconhecido: ${tipo}`] };

  const avisos = [];
  // o token no tamanho do tipo (regra da casa, nave-token.js)
  const lado = LADO_POR_TAMANHO[t.tamanho] ?? 1;
  const ator = await globalThis.Actor?.create?.({
    name: nome?.trim() || t.rotulo,
    type: "character",
    system: { hp: { value: 0, max: 0 } },
    prototypeToken: { width: lado, height: lado },
    flags: {
      // o tipo INTEIRO: sem o tamanho, o limite de câmaras extras não aparecia
      [ID]: { [FLAG]: { ...naveVazia(), ...(aplicarTipo(tipo)?.flag ?? { tipo }), tokenLado: lado } },
      core: { sheetClass: `${ID}.NaveSheet` },
    },
  });
  if (!ator) return { ator: null, avisos: ["O Foundry recusou criar o ator."] };

  const { raca, classe, faltou } = await itensDoTipo(tipo);
  avisos.push(...faltou.map((f) => txt("spacedragon.aviso.naoAcheiNoCompendio", { oque: f })));

  // A RAÇA PRIMEIRO, e com o sync: é ele que traz a habilidade onde mora o CP.
  if (raca) {
    await ator.createEmbeddedDocuments("Item", [raca.toObject()]);
    try {
      await ator.system.syncRaceAbilities?.();
    } catch (e) {
      avisos.push(txt("spacedragon.aviso.racaSemHabilidades", { erro: e?.message ?? e }));
    }
  }
  // a classe só depois, porque o sistema a recusa num ator sem raça
  if (classe && raca) {
    await ator.createEmbeddedDocuments("Item", [classe.toObject()]);
    try {
      await ator.system.syncClassAbilities?.();
    } catch (e) {
      avisos.push(txt("spacedragon.aviso.classeSemCamaras", { erro: e?.message ?? e }));
    }
  } else if (classe && !raca) {
    avisos.push(txt("spacedragon.aviso.classeRecusada"));
  }

  avisos.push(txt("spacedragon.aviso.pvZero", { pv: t.pv }));
  return { ator, avisos };
}

/* ── O DIÁLOGO E O BOTÃO ───────────────────────────────────────────────────── */

/**
 * Pergunta o nome e o tipo, e cria.
 *
 * Um diálogo e não um comando de console: criar nave é coisa que se faz muitas
 * vezes, e a barra lateral é onde se procura. O conversor ficou no console
 * porque é ação de uma vez na vida do mundo; este não.
 */
export async function dialogoDeNovaNave() {
  const D = globalThis.foundry?.applications?.api?.DialogV2;
  const opcoes = opcoesDeTipo()
    .map((o) => `<option value="${o.chave}">${o.rotulo} — ${o.detalhe}</option>`)
    .join("");
  const conteudo =
    `<p>A nave nasce com a <strong>Ponte</strong> e a <strong>Sala de Máquinas</strong>; ` +
    `o resto se instala na aba Câmaras.</p>` +
    `<div class="form-group"><label>Nome</label>` +
    `<input type="text" name="nome" placeholder="Falcão de Lata"></div>` +
    `<div class="form-group"><label>Tipo (T10-1)</label>` +
    `<select name="tipo">${opcoes}</select></div>`;

  const dados = await D?.prompt?.({
    window: { title: txt("spacedragon.janela.novaNave") },
    content: conteudo,
    ok: {
      label: txt("spacedragon.botao.criar"),
      callback: (_ev, botao) => ({
        nome: botao.form.elements.nome.value,
        tipo: botao.form.elements.tipo.value,
      }),
    },
  });
  if (!dados) return null;

  const { ator, avisos } = await criarNave(dados);
  if (ator) {
    // abre a ficha: quem acabou de criar quer ver, e o aviso dos PV só faz
    // sentido com a ficha à frente
    ator.sheet?.render?.(true);
    for (const a of avisos) globalThis.ui?.notifications?.info?.(a);
  } else {
    for (const a of avisos) globalThis.ui?.notifications?.error?.(a);
  }
  return ator;
}

/** Põe o botão "Nova nave" no cabeçalho de uma aba de Atores já desenhada. */
export function porBotaoDeNovaNave(raiz) {
  try {
    const el = raiz instanceof HTMLElement ? raiz : raiz?.[0] ?? raiz;
    const cabeca = el?.querySelector?.(".header-actions, .directory-header .action-buttons");
    if (!cabeca || cabeca.querySelector(".sw-nova-nave")) return false;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "sw-nova-nave";
    b.innerHTML = `<i class="fa-solid fa-rocket"></i> ${txt("spacedragon.nave.botaoNovaNave")}`;
    b.addEventListener("click", () => dialogoDeNovaNave());
    cabeca.append(b);
    return true;
  } catch (e) {
    console.warn("spacedragon | não pude pôr o botão de nova nave", e);
    return false;
  }
}

/**
 * Põe o botão "Nova nave" na aba de Atores.
 *
 * ── POR QUE TAMBÉM AGORA, E NÃO SÓ NO GANCHO ────────────────────────────
 *
 * Isto roda no `ready`, e a aba de Atores já foi desenhada antes dele. O
 * gancho `renderActorDirectory` só pega o PRÓXIMO desenho — criar ou apagar um
 * ator —, e até lá o botão não existia: a mesa abria o mundo, não via o botão,
 * criava a nave pelo "Criar Ator" do Foundry, e ela nascia personagem.
 */
export function ligarBotaoDeNovaNave() {
  globalThis.Hooks?.on?.("renderActorDirectory", (_app, html) => porBotaoDeNovaNave(html));
  const jaDesenhada = globalThis.ui?.actors?.element;
  if (jaDesenhada) porBotaoDeNovaNave(jaDesenhada);
}

/* ── O TIPO DE NAVE ARRASTADO TRANSFORMA O ATOR EM NAVE ────────────────────
 *
 * O caminho que a mesa usa sem pensar: "Criar Ator", escolher Personagem, e
 * arrastar o Caça do compêndio. O ator nascia na ficha de personagem, e o tipo
 * e a classe de nave entravam como raça e classe comuns — as doze câmaras como
 * habilidades, sem botão nenhum.
 *
 * Agora, quando um tipo de nave entra num personagem, o ator passa para a
 * Ficha de Nave e ganha a flag com o tipo e o tamanho. Só quem fez a mudança
 * grava (o gancho dispara em todos os clientes).
 */

/** A chave do tipo de nave deste item de raça, ou null se não for nave. */
export function tipoDeNaveDoItem(item) {
  if (item?.type !== "race") return null;
  const marcado = lerFlag(item, ID, "tipoDeNave");
  if (marcado && TIPOS[marcado]) return marcado;
  // itens copiados antes da flag existir: pelo nome do tipo
  const nome = String(item?.name ?? "").trim();
  return Object.entries(TIPOS).find(([, t]) => t.rotulo === nome)?.[0] ?? null;
}

/** O update que transforma o ator em nave, ou null se já é nave desse tipo. */
export function viraNave(ator, chave) {
  if (!ator || ator.type !== "character" || !TIPOS[chave]) return null;
  const update = {};
  const ficha = `${ID}.NaveSheet`;
  if (lerFlag(ator, "core", "sheetClass") !== ficha) update["flags.core.sheetClass"] = ficha;
  const atual = naveDe(ator, ID);
  if (atual.tipo !== chave || !atual.tamanho) {
    update[`flags.${ID}.${FLAG}`] = { ...atual, ...(aplicarTipo(chave)?.flag ?? { tipo: chave }) };
  }
  return Object.keys(update).length ? update : null;
}

export function ligarTipoQueViraNave() {
  globalThis.Hooks?.on?.("createItem", async (item, _opcoes, idDoUsuario) => {
    try {
      if (idDoUsuario !== globalThis.game?.user?.id) return;
      const chave = tipoDeNaveDoItem(item);
      const ator = item?.parent;
      if (!chave || !ator) return;
      const update = viraNave(ator, chave);
      if (!update) return;
      await ator.update(update);
      // o tipo trocou o tamanho: o token acompanha (nave-token.js)
      await ajustarToken(ator);
      globalThis.ui?.notifications?.info?.(txt("spacedragon.aviso.virouNave", { nome: ator.name, tipo: TIPOS[chave].rotulo }));
    } catch (e) {
      console.warn("spacedragon | não pude transformar o ator em nave", e);
    }
  });
}
