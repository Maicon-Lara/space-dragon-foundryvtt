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
 * JPF/JPM no lugar de JPD/JPC/JPS — não precisa de código: sai do
 * `lang/pt-BR.json` do módulo, que o Foundry mescla por cima do sistema.
 *
 * Nada aqui toca em `system.*`. O módulo não inventa campo no sistema de outra
 * pessoa.
 */

import { abrirTeste, rolar, preparar, TESTES } from "./testes.js";
import { ligarPainel, diagnostico } from "./painel.js";
import { aplicarModificadores, compararEscalas } from "./atributos.js";
import { rolarPV, rolarCritico, multiplicadorCritico } from "./vitalidade.js";
import { ligarCabecalho, danosMortais } from "./cabecalho.js";
import { ligarGrandezas } from "./poderes.js";
import { abrirOrdem, rolarCriticoTabela } from "./ordem.js";
import { CRITICOS, FALHAS, CRITICOS_NAVE, FALHAS_NAVE } from "./dados.js";

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
  // Uma OPÇÃO, e não um fato consumado: trocar a tabela de modificadores muda
  // ataque, proteção, PV e jogadas de proteção de todo personagem do mundo.
  // Quem instalar o módulo só pelos compêndios pode não querer isso.
  game.settings.register(ID, "modificadores", {
    name: "Modificadores de atributo do Space Dragon",
    hint:
      "A ficha passa a usar a escala do Space Dragon — faixa neutra 10–11 e teto " +
      "no 29 — em vez da do Old Dragon 2. Afeta ataque, proteção, PV e JP. " +
      "Desligue para manter o cálculo original do sistema.",
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
  estendeNiveis();
  aplicarModificadores(game.settings.get(ID, "modificadores"));
  ligarPainel();
  ligarCabecalho();
  ligarGrandezas();

  // A API que as macros do compêndio chamam. Fica aqui, e não dentro da macro,
  // para que atualizar o módulo atualize a regra: uma macro já arrastada para
  // a barra continua valendo, porque ela só chama isto.
  game.spacedragon = {
    teste: abrirTeste, rolar, preparar, TESTES,
    pv: rolarPV, critico: rolarCritico, multiplicadorCritico,
    compararEscalas, diagnostico, danosMortais,
    ordem: abrirOrdem,
    acertoCritico: () => rolarCriticoTabela("T7-4: Acerto Crítico", CRITICOS),
    falhaCritica: () => rolarCriticoTabela("T7-5: Falha Crítica", FALHAS),
    acertoCriticoNave: () => rolarCriticoTabela("T10-6: Acerto Crítico de Espaçonave", CRITICOS_NAVE),
    falhaCriticaNave: () => rolarCriticoTabela("T10-6: Falha Crítica de Espaçonave", FALHAS_NAVE),
  };

  console.log(`${ID} | ${TESTES.length} testes prontos, nível até o ${NIVEL_MAXIMO}º`);
});
