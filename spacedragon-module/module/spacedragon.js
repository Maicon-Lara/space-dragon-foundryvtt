/**
 * Space Dragon — módulo de conteúdo para o sistema Old Dragon 2.
 *
 * O módulo é de compêndios. Este script existe por três motivos, todos de
 * coisas que o compêndio sozinho não resolve:
 *
 *   1. O Space Dragon resolve meia dúzia de coisas em 1d100 com sucesso no
 *      MENOR OU IGUAL. Não é uma fórmula diferente do d20 do Old Dragon 2, é
 *      uma comparação diferente, e nenhum campo da ficha faz isso.
 *
 *   2. Essas porcentagens MUDAM COM O NÍVEL e somam coluna de atributo. A
 *      descrição da habilidade é texto fixo; o painel mostra o número da vez.
 *
 *   3. A ficha do OD2 para no 15º nível e o Space Dragon vai ao 20º.
 *
 * A nomenclatura — Ciência no lugar de Inteligência, CP no lugar de CA, JPR/
 * JPF/JPM no lugar de JPD/JPC/JPS — é trocada NA FICHA, e não no idioma: o
 * `lang` é global, e num mundo que também tenha o módulo Star Wars o Jedi
 * passaria a ver os rótulos do Space Dragon. Ver module/rotulos.js.
 *
 * Nada aqui toca em `system.*`. O módulo não inventa campo no sistema de outra
 * pessoa.
 */

// A shim do libWrapper vem ANTES de tudo: ela se registra no `init`, e os
// envelopes (envelope.js) a usam no `ready` quando o libWrapper de verdade
// não está instalado.
import "./libwrapper-shim.js";
import { abrirTeste, rolar, preparar, TESTES } from "./testes.js";
import { ligarPainel, diagnostico } from "./painel.js";
import { aplicarModificadores, compararEscalas, ordenarHabilidades, aplicarCP, bonusDeCP } from "./atributos.js";
import { rolarPV, rolarCritico, multiplicadorCritico } from "./vitalidade.js";
import { ligarCabecalho, danosMortais } from "./cabecalho.js";
import { ligarGrandezas } from "./poderes.js";
import { abrirOrdem, rolarCriticoTabela } from "./ordem.js";
import { ligarOrdemNaFicha, registrarOpcoes as registrarOpcoesDaOrdem } from "./ordem-ficha.js";
import { ligarOrdemNoCombate, registrarOpcaoDeCombate } from "./ordem-combate.js";
import { registrarFicha } from "./ficha.js";
import { ligarRotulos } from "./rotulos.js";
import { ligarDegraus } from "./degraus.js";
import { aplicarJP, rolarJP } from "./jp.js";
import { registrarFichaAmeaca, rolarJPAmeaca, rolarMoral } from "./ameaca.js";
import { abrirDesativar, rolarDesativar } from "./robos.js";
import { abrirReliquia, gerarReliquia, gerarDaCriatura, rolarDefeito } from "./reliquias.js";
import { ligarMutacoes } from "./mutacoes-ficha.js";
import { ligarRegrasDeAmeaca, xpDeVilaoDoAtor } from "./ameaca-regras.js";
import { ligarIntegracaoQdV } from "./integracao-qdv.js";
import { registrarOpcaoDeVersao, avisarVersaoDoSistema } from "./versao.js";
import { ligarCusto } from "./custo.js";
import { ligarMental, orcamento, gastar, descansar } from "./mental.js";
import { CRITICOS, FALHAS, CRITICOS_NAVE, FALHAS_NAVE } from "./dados.js";

/* ── AS NAVES (CAPÍTULO 10) ────────────────────────────────────────────────
 *
 * A T10-1 a T10-8 são do LIVRO Space Dragon: tipos de nave, câmaras,
 * combustível, equipamentos, combate espacial e veículos. Elas moraram um
 * tempo no módulo de Star Wars porque foi lá que a mesa precisou delas
 * primeiro — mas uma mesa de Space Dragon sem Star Wars ficava sem naves, o
 * que é o contrário do que o livro oferece.
 *
 * A ordem de ação (T7-2) veio junto pelo mesmo motivo.
 */
import { registrarFichaDeNavePC, redesenharFichasDeNave } from "./nave-pc-ficha.js";
import { criarNave, dialogoDeNovaNave, ligarBotaoDeNovaNave, ligarTipoQueViraNave } from "./nave-nova.js";
import { navesAntigas, converterNave, converterTodas } from "./nave-converter.js";
import { migrarNavesNoReady, migrarNaves, navesPorMigrar, porMigrar } from "./nave-migrar-flag.js";
import { registrarCombate, conferirCombate, avisarSeOrdemPerdida, ligarResumoDaRodada } from "./ordem-inversao.js";

import { t as txt } from "./i18n.js";
import { registrarOpcoesDeNave } from "./opcoes.js";

const ID = "spacedragon";
const NIVEL_MAXIMO = 20;

/**
 * Estende o seletor de nível da ficha até o 20º.
 *
 * `CONFIG.olddragon2e.levels` é um objeto simples que o template lê em
 * `{{selectOptions config.levels}}`. O sistema o preenche de 1 a 15, que é o
 * teto do Old Dragon 2. As tabelas do Space Dragon vão até o 20º, e sem isto
 * não há como sequer selecionar o nível na ficha.
 *
 * As strings "16º" a "20º" vêm do lang deste módulo.
 */
function estendeNiveis() {
  const cfg = CONFIG.olddragon2e?.levels;
  if (!cfg) return console.warn(`${ID} | CONFIG.olddragon2e.levels não existe — nível fica no 15º`);
  for (let n = 16; n <= NIVEL_MAXIMO; n += 1) cfg[n] ??= `olddragon2e.levels.${n}`;
}

Hooks.once("init", () => {
  registrarOpcoesDaOrdem();
  registrarOpcaoDeVersao();
  registrarOpcaoDeCombate();
  // o combate de naves das Regras Compiladas, a nave modular e as três
  // camadas: opções de mundo, e a Ficha de Nave aberta se redesenha ao trocar
  registrarOpcoesDeNave(() => redesenharFichasDeNave());

  // As fichas são registradas no `ready` (ver lá). Aqui só a opção, que
  // precisa existir antes de ser lida.
  game.settings.register(ID, "fichasPadrao", {
    name: "spacedragon.opcao.fichasPadrao.nome",
    hint: "spacedragon.opcao.fichasPadrao.dica",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    requiresReload: true,
  });

  // Uma OPÇÃO, e não um fato consumado: trocar a tabela de modificadores muda
  // ataque, proteção, PV e jogadas de proteção de todo personagem do mundo.
  // Quem instalar o módulo só pelos compêndios pode não querer isso.
  game.settings.register(ID, "modificadores", {
    name: "spacedragon.opcao.modificadores.nome",
    hint: "spacedragon.opcao.modificadores.dica",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    onChange: (v) => {
      aplicarModificadores(v);
      // As fichas abertas continuam mostrando o número velho até redesenhar.
      for (const app of Object.values(ui.windows)) app.render?.(false);
    },
  });
});

Hooks.once("ready", () => {
  const mod = globalThis.game?.modules?.get?.(ID);
  if (mod) {
    mod.api = {
      ...(mod.api ?? {}),
      criarNave, dialogoDeNovaNave,
      navesAntigas, converterNave, converterTodas,
      // `porMigrar` é a lista completa: a nave sem a flag nova MAIS a nave cujos
      // itens ficaram atrás. `navesPorMigrar` é só a primeira metade, e foi por ela
      // que as naves da mesa pareceram prontas sem os botões de instalar.
      migrarNaves, porMigrar, navesPorMigrar,
    };
  }

  /* ── CADA PASSO ISOLADO ──────────────────────────────────────────────────
   *
   * Os passos abaixo rodavam em fila, sem proteção, e as naves vinham por
   * último. Um erro em QUALQUER um — num envelope, num gancho, numa leitura —
   * parava o `ready` ali: a Ficha de Nave nunca era registrada, o botão de
   * criar nave sumia, e a nave abria na ficha do sistema com as doze câmaras
   * sem botão. O sintoma aparecia longe da causa, e o console era o único
   * lugar que dizia qual passo tinha caído.
   *
   * Agora cada passo roda sozinho: o que falha avisa o Mestre NA TELA, com o
   * nome do passo, e os outros seguem. E as naves vêm logo depois da ficha do
   * Space Dragon, que é a única coisa de que elas dependem.
   */
  const falhas = [];
  const passo = (nome, fn) => {
    try {
      return fn();
    } catch (e) {
      falhas.push(nome);
      console.error(`${ID} | o passo "${nome}" falhou`, e);
      return undefined;
    }
  };

  // No `ready`, e não no `init`: no Foundry 13.351 o registro de fichas é uma
  // fila processada depois do `init` e do `setup`. No `init` a ficha do
  // sistema ainda não estava lá para ser estendida. Ver ficha.js.
  const padrao = passo("opção de fichas padrão", () => game.settings.get(ID, "fichasPadrao")) ?? true;
  passo("Ficha Space Dragon", () => registrarFicha(padrao));
  passo("Ficha de Ameaça", () => registrarFichaAmeaca(padrao));
  // Antes de qualquer ficha desenhar um item: o `total_cost` do sistema quebra
  // com custo sem dígito ("Variável"), e a ficha para de redesenhar. custo.js.
  passo("custo dos itens", () => ligarCusto());

  /* ── AS NAVES, LOGO DEPOIS DA FICHA DE QUE DEPENDEM ──────────────────────
   *
   * A Ficha de Nave ESTENDE a ficha do Space Dragon: entra depois dela, e
   * antes de todo o resto, para que nenhum outro passo a leve junto ao cair.
   */
  passo("Ficha de Nave", () => registrarFichaDeNavePC());
  passo("botão de criar nave", () => ligarBotaoDeNovaNave());
  passo("tipo de nave que vira nave", () => ligarTipoQueViraNave());
  // a migração das naves criadas quando as regras moravam no Star Wars: sem
  // ela a nave abre VAZIA, que parece apagada
  passo("migração das naves", () => migrarNavesNoReady());
  passo("naves do tipo antigo", () => {
    // Mais velhas que a migração acima: são de quando a nave era um tipo de
    // ator próprio. Elas não carregam mais, e o aviso tem de aparecer na TELA.
    const antigas = navesAntigas().length;
    if (antigas > 0) {
      console.log(
        `${ID} | ${antigas} nave(s) no tipo de ator antigo. Para converter: ` +
        `game.modules.get("${ID}").api.converterTodas()`
      );
      globalThis.ui?.notifications?.info?.(txt("spacedragon.aviso.navesAntigas", { n: antigas }));
    }
  });

  passo("níveis até o 20º", () => estendeNiveis());
  passo("modificadores de atributo", () => aplicarModificadores(game.settings.get(ID, "modificadores")));
  // O bônus de CP por nível (T4-1) é regra do livro, não opção: vale sempre
  // para quem usa a ficha do Space Dragon.
  passo("CP por nível", () => aplicarCP());
  // A JP também é regra do livro: 1d20 + mod ≥ JP, e não d20 ≤ JP + mod.
  passo("jogadas de proteção", () => aplicarJP());
  passo("ordem das habilidades", () => ordenarHabilidades(true));
  passo("painel de testes", () => ligarPainel());
  passo("cabeçalho", () => ligarCabecalho());
  passo("Grandezas", () => ligarGrandezas());
  passo("alcance mental", () => ligarMental());
  passo("mutações", () => ligarMutacoes());
  passo("regras de ameaça (PV, Moral, prêmio de vilão)", () => ligarRegrasDeAmeaca());
  passo("convivência com o Qualidade de Vida", () => ligarIntegracaoQdV());
  passo("degraus", () => ligarDegraus());
  passo("Ordem de Ação na ficha", () => ligarOrdemNaFicha());
  passo("Ordem de Ação no combate", () => ligarOrdemNoCombate());
  // Por último: a aba de Poderes precisa estar desenhada para os rótulos de
  // Grandeza serem trocados.
  passo("rótulos", () => ligarRotulos());

  // O Mestre fica sabendo se o Old Dragon 2 passou da versão conferida (versao.js).
  passo("aviso de versão", () => avisarVersaoDoSistema());

  // A API que as macros do compêndio chamam. Fica aqui, e não dentro da macro,
  // para que atualizar o módulo atualize a regra: uma macro já arrastada para
  // a barra continua valendo, porque ela só chama isto.
  game.spacedragon = {
    teste: abrirTeste, rolar, preparar, TESTES,
    pv: rolarPV, critico: rolarCritico, multiplicadorCritico,
    compararEscalas, diagnostico, danosMortais, bonusDeCP, jp: rolarJP,
    jpAmeaca: rolarJPAmeaca, moral: rolarMoral, xpDeVilao: xpDeVilaoDoAtor,
    desativarRobos: abrirDesativar, rolarDesativar,
    reliquia: abrirReliquia, gerarReliquia, reliquiasDaCriatura: gerarDaCriatura, defeitoDeReliquia: rolarDefeito,
    ordem: abrirOrdem,
    alcance: orcamento, gastarAlcance: gastar, descansar,
    acertoCritico: () => rolarCriticoTabela("T7-4: Acerto Crítico", CRITICOS),
    falhaCritica: () => rolarCriticoTabela("T7-5: Falha Crítica", FALHAS),
    acertoCriticoNave: () => rolarCriticoTabela("T10-6: Acerto Crítico de Espaçonave", CRITICOS_NAVE),
    falhaCriticaNave: () => rolarCriticoTabela("T10-6: Falha Crítica de Espaçonave", FALHAS_NAVE),
  };

  console.log(`${ID} | ${TESTES.length} testes prontos, nível até o ${NIVEL_MAXIMO}º`);

  // O que falhou vai para a TELA do Mestre, com o nome do passo: é o que ele
  // copia para o relato, e o console ninguém abre sem motivo.
  if (falhas.length && globalThis.game?.user?.isGM) {
    const passos = falhas.join(", ");
    globalThis.ui?.notifications?.error?.(txt("spacedragon.aviso.passosFalharam", { passos }), { permanent: true });
  }
});
