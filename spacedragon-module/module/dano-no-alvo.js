/**
 * O botão "Aplicar em (alvo)" nos cartões de dano pessoal.
 *
 * Com o dano automático desligado, o "Qualidade de Vida" e o "OD2 Combat
 * Automation" só rolam o dano no acerto crítico; no acerto normal, o jogador
 * rola pelo botão de dano do sistema. Nenhum desses cartões guarda o alvo.
 * Aqui eles ganham o alvo marcado na hora em que são criados (só o cliente que
 * ataca sabe), e o botão aparece para quem é dono da ficha do alvo; o Mestre é
 * dono de todas.
 *
 * A marca de "já aplicado" fica no ATOR ALVO, e não na mensagem: o dono do
 * alvo não pode gravar na mensagem de outra pessoa.
 *
 * O PV pode ficar negativo: no Space Dragon a morte vem depois do 0.
 */

import { ehNave } from "./nave-marca.js";
import { naveDe, updateDaNave } from "./nave-pc-dados.js";
import { cineDe } from "./nave-cine-ficha.js";
import { aplicarDanoCine } from "./nave-cinematico.js";
import { aplicarDanoNoAlvoLigado, combateCinematico } from "./opcoes.js";
import { chaveDoAtacante, marcaDeFerida } from "./racas.js";
import { t as txt } from "./i18n.js";

const ID = "spacedragon";
const QDV = "old-dragon-2-qualidade-de-vida";
const OCA = "od2-combat-automation";
const FLAG = "danoNoAlvo";
const FEITOS = "danosAplicados";
export const CLASSE_APLICAR_DANO = "sd-aplicar-dano";

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

/** O dano escrito no cartão do Qualidade de Vida, ou null se não é esse cartão. */
export function danoDoCartao(conteudo) {
  const s = String(conteudo ?? "");
  if (!s.includes("od2ca-card")) return null;
  const m = s.match(/<dt>Dano<\/dt>\s*<dd>(-?\d+)<\/dd>/);
  return m ? Number(m[1]) : null;
}

/** O dano de uma mensagem: o cartão dos módulos ou o cartão de dano do sistema. */
export function danoDaMensagem(mensagem) {
  const doCartao = danoDoCartao(mensagem?.content);
  if (doCartao !== null) return doCartao;
  const titulo = globalThis.game?.i18n?.localize?.("olddragon2e.chat.damage_with");
  if (!titulo || !String(mensagem?.flavor ?? "").includes(titulo)) return null;
  const total = Number(mensagem?.rolls?.[0]?.total);
  return Number.isFinite(total) ? total : null;
}

/** Um dos dois módulos já aplica o dano? Então o botão descontaria em dobro. */
function danoAutomaticoLigado() {
  const liga = (modulo, opcao) => {
    if (!globalThis.game?.modules?.get?.(modulo)?.active) return false;
    try {
      return globalThis.game.settings.get(modulo, opcao) === true;
    } catch {
      return false;
    }
  };
  return liga(QDV, "combatAutoDamage") || liga(OCA, "autoDamage");
}

/** Antes de criar o cartão: guarda nele o alvo marcado por quem atacou. */
export function marcarCartao(mensagem) {
  if (!aplicarDanoNoAlvoLigado() || danoAutomaticoLigado()) return false;
  const dano = danoDaMensagem(mensagem);
  if (!(dano > 0)) return false;
  const alvo = [...(globalThis.game?.user?.targets ?? [])][0] ?? null;
  const uuid = alvo?.document?.uuid ?? null;
  if (!uuid) return false;
  const atacante = chaveDoAtacante(globalThis.ChatMessage?.getSpeakerActor?.(mensagem.speaker));
  mensagem.updateSource({ flags: { [ID]: { [FLAG]: { alvo: uuid, nome: alvo.name ?? "", dano, atacante } } } });
  return true;
}

/** Desconta o dano; numa nave do motor de combate, passa antes pelo Escudo. */
export async function aplicarEmAtor(ator, dano, mudExtra = {}) {
  const hp = Number(ator.system?.hp?.value) || 0;
  const mud = { ...mudExtra };
  let noEscudo = 0;
  let pv = hp - dano;
  if (combateCinematico() && ehNave(ator)) {
    const nave = naveDe(ator, ID);
    const cine = cineDe(nave);
    const r = aplicarDanoCine({ escudo: cine.escudo.atual, casco: hp, dano });
    noEscudo = r.noEscudo;
    pv = r.casco;
    Object.assign(mud, updateDaNave(nave, { ...nave, cine: { ...cine, escudo: { ...cine.escudo, atual: r.escudo } } }, ID) ?? {});
  }
  mud["system.hp.value"] = pv;
  await ator.update(mud);
  return { pv, noEscudo };
}

const feitosDe = (ator) => [].concat(ator?.getFlag?.(ID, FEITOS) ?? ator?.flags?.[ID]?.[FEITOS] ?? []);

/** Aplica o dano do cartão `idDaMensagem`, uma vez. Devolve o resultado ou null. */
export async function aplicarDanoNoAlvo(idDaMensagem, dados) {
  const doc = await globalThis.fromUuid?.(dados?.alvo);
  const ator = doc?.actor ?? doc;
  const avisa = (m) => { globalThis.ui?.notifications?.warn?.(m); return null; };
  if (!ator?.update) return avisa(txt("spacedragon.danoNoAlvo.semAlvo"));
  if (!ator.isOwner) return avisa(txt("spacedragon.aviso.semPermissao", { nome: esc(ator.name) }));
  const feitos = feitosDe(ator);
  if (feitos.includes(idDaMensagem)) return avisa(txt("spacedragon.nave.disparo.jaAplicado"));

  const dano = Number(dados.dano) || 0;
  const { pv, noEscudo } = await aplicarEmAtor(ator, dano, { [`flags.${ID}.${FEITOS}`]: [...feitos, idDaMensagem].slice(-30), ...marcaDeFerida(ator, dados.atacante) });
  globalThis.ui?.notifications?.info?.(txt("spacedragon.danoNoAlvo.aplicado", { alvo: esc(ator.name), dano: dano - noEscudo, pv }));
  return { pv, noEscudo };
}

/** Liga a marcação do cartão e o botão no chat. Uma vez, no `ready`. */
export function ligarDanoNoAlvo() {
  const H = globalThis.Hooks;
  H?.on?.("preCreateChatMessage", (mensagem) => {
    try { marcarCartao(mensagem); } catch (e) { console.warn(`${ID} | cartão de dano`, e); }
  });
  H?.on?.("renderChatMessageHTML", (msg, html) => {
    const dados = msg?.getFlag?.(ID, FLAG);
    if (!dados || !aplicarDanoNoAlvoLigado() || html?.querySelector?.(`.${CLASSE_APLICAR_DANO}`)) return;
    const doc = globalThis.fromUuidSync?.(dados.alvo);
    const ator = doc?.actor ?? doc;
    if (!ator?.isOwner) return;
    const botao = html.ownerDocument.createElement("button");
    botao.type = "button";
    botao.className = CLASSE_APLICAR_DANO;
    botao.textContent = txt("spacedragon.danoNoAlvo.botao", { alvo: dados.nome || ator.name });
    botao.disabled = feitosDe(ator).includes(msg.id);
    botao.addEventListener("click", (ev) => {
      ev.preventDefault();
      botao.disabled = true;
      aplicarDanoNoAlvo(msg.id, dados)
        .then((r) => { if (!r) botao.disabled = feitosDe(ator).includes(msg.id); })
        .catch((e) => { botao.disabled = false; console.error(`${ID} | aplicar o dano`, e); });
    });
    (html.querySelector(".od2ca-card") ?? html).appendChild(botao);
  });
  return true;
}
