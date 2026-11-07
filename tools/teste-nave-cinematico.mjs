/**
 * O Combate Cinematográfico de naves (nave-cinematico.js) — regra da casa.
 *
 * ── O QUE ESTE TESTE GARANTE ────────────────────────────────────────────────
 *
 * Os números esperados vêm do texto da regra ("Naves - Combate
 * Cinematografico.md", no cofre), e não da implementação:
 *
 *   · [CINE-ESCALA]    a tabela do §1, e o Escudo zerado sem Escudo de força;
 *   · [CINE-GRAU]      os graus da T10-5: 01 crítico, ≤20 ótimo, >80 grave,
 *                      100 desastre, e o limiar da Mania (70);
 *   · [CINE-DUELO]     grau maior vence; empate, a nave menor; depois o grupo;
 *   · [CINE-ORDEM]     a iniciativa põe quem venceu o grupo antes dele e quem
 *                      perdeu depois;
 *   · [CINE-TENSAO]    +0 na 1ª rodada, +5 no teto, Evento ao chegar a +3 e +5;
 *   · [CINE-DANO]      Escudo primeiro, depois Casco;
 *   · [CINE-CAMARA]    câmara só no Casco, com margem 5+ (2+ travado), 20
 *                      natural ou Mirar sistema;
 *   · [CINE-D12]       a ordem das doze, as famílias e o golpe (ausente +1d10,
 *                      presente avaria, de novo Fora);
 *   · [CINE-PEN]       as penalidades da Ponte, Máquinas e Arsenal;
 *   · [CINE-FIM]       incêndio e brecha cobram, o Fora dobra, o fogo espalha
 *                      em 2 rodadas só para câmara instalada;
 *   · [CINE-POS]       depois do combate: avaria ganha teste, Fora danifica;
 *   · [CINE-EXEMPLO]   o primeiro tiro do exemplo do §10 (Ryn contra a Garra).
 *
 *     node tools/teste-nave-cinematico.mjs
 */

import {
  ESCALA, escalaDoTipo, cascoAbaixoDaMetade, grauDoTeste, chanceDoDuelo, vencedorDoDuelo,
  iniciativaDoDuelo, tensaoDaRodada, pedeEvento, termosCine, aplicarDanoCine, atingeCamara,
  D12, camaraDoD12, golpeNaCamara, registrarGolpe, resolverAvaria, penalidadesDeCamara,
  fimDaRodadaCine, depoisDoCombate, recarregar, podeRepararAgora, ACOES_CINE,
} from "../spacedragon-module/module/nave-cinematico.js";
import { TIPOS } from "../spacedragon-module/module/tipos-de-nave.js";
import { CAMARAS } from "../spacedragon-module/module/camaras.js";

const problemas = [];
const confere = (ok, msg) => { if (!ok) problemas.push(msg); };
const soma = (termos) => termos.reduce((s, [, v]) => s + v, 0);

// ── [CINE-ESCALA] ──
confere(Object.keys(ESCALA).sort().join() === Object.keys(TIPOS).sort().join(), "[CINE-ESCALA] a escala cobre exatamente os oito tipos da T10-1");
const esperado = {
  caca: [0, 20, 20], capsula: [0, 15, 20], escolta: [0, 30, 20], particular: [15, 40, 0],
  cargueiro: [30, 80, -20], transuniversal: [30, 80, -20], cruzador: [60, 150, -40], naveMae: [60, 200, -40],
};
for (const [tipo, [escudo, casco, agil]] of Object.entries(esperado)) {
  const e = escalaDoTipo(tipo, { temEscudo: true });
  confere(e.escudo === escudo && e.casco === casco && e.agilidade === agil, `[CINE-ESCALA] ${tipo}: ${JSON.stringify(e)}`);
}
confere(escalaDoTipo("particular", { temEscudo: false }).escudo === 0, "[CINE-ESCALA] sem Escudo de força, Escudo 0");
confere(escalaDoTipo("particular", { temEscudo: false }).recarga === null, "[CINE-ESCALA] sem Escudo de força, sem Recarga");
confere(escalaDoTipo("cruzador", { temEscudo: true }).recarga === "3d10", "[CINE-ESCALA] Recarga do cruzador 3d10");
confere(escalaDoTipo("xis") === null, "[CINE-ESCALA] tipo desconhecido → null");
confere(cascoAbaixoDaMetade(19, 40) && !cascoAbaixoDaMetade(20, 40), "[CINE-ESCALA] abaixo da metade é < metade");

// ── [CINE-GRAU] ──
confere(grauDoTeste(55, 1).chave === "critico", "[CINE-GRAU] 01 é crítico");
confere(grauDoTeste(55, 18).chave === "otimo", "[CINE-GRAU] 18 com 55% é ótimo");
confere(grauDoTeste(55, 20).chave === "otimo", "[CINE-GRAU] 20 com 55% ainda é ótimo");
confere(grauDoTeste(55, 47).chave === "sucesso", "[CINE-GRAU] 47 com 55% é sucesso");
confere(grauDoTeste(55, 61).chave === "falha", "[CINE-GRAU] 61 com 55% é falha");
confere(grauDoTeste(55, 81).chave === "grave", "[CINE-GRAU] 81 é falha grave");
confere(grauDoTeste(55, 80).chave === "falha", "[CINE-GRAU] 80 ainda é falha simples");
confere(grauDoTeste(110, 99).chave === "sucesso", "[CINE-GRAU] 110% acerta no 99");
confere(grauDoTeste(110, 100).chave === "desastre", "[CINE-GRAU] 110% erra no 100");
confere(grauDoTeste(15, 18).chave === "falha", "[CINE-GRAU] ≤20 mas acima da chance é falha, não ótimo");
confere(grauDoTeste(55, 71, { limiarGrave: 70 }).chave === "grave", "[CINE-GRAU] Puxa para a esquerda: grave a partir de 71");
confere(grauDoTeste(55, 18).jp === 4 && grauDoTeste(55, 81).jp === -4, "[CINE-GRAU] modificador de JP da T10-5");

const ch = chanceDoDuelo({ pilotar: 55, agilidade: 0, cascoBaixo: true, avarias: {} });
confere(ch.chance === 35, `[CINE-GRAU] Kael com o Casco baixo: 35% (veio ${ch.chance})`);
confere(chanceDoDuelo({ pilotar: 50, agilidade: 20, avarias: { maquinas: { estado: "avaria" } } }).chance === 50, "[CINE-GRAU] Garra com Máquinas avariadas: 50%");
confere(chanceDoDuelo({ pilotar: 50, motores: true, interferencia: true }).chance === 50, "[CINE-GRAU] Motores +20 e Interferência −20 se anulam");

// ── [CINE-DUELO] ──
confere(vencedorDoDuelo({ grau: "otimo", tamanho: "Média" }, { grau: "sucesso", tamanho: "Pequena" }) === "a", "[CINE-DUELO] grau maior vence");
confere(vencedorDoDuelo({ grau: "sucesso", tamanho: "Média", grupo: true }, { grau: "sucesso", tamanho: "Pequena" }) === "b", "[CINE-DUELO] empate de grau: a nave menor vence");
confere(vencedorDoDuelo({ grau: "falha", tamanho: "Média", grupo: true }, { grau: "falha", tamanho: "Média" }) === "a", "[CINE-DUELO] empate total: o grupo vence");
confere(vencedorDoDuelo({ grau: "falha", tamanho: "Média" }, { grau: "falha", tamanho: "Média" }) === "empate", "[CINE-DUELO] dois inimigos iguais empatam");

// ── [CINE-ORDEM] ──
// Rodada 2 do exemplo: o esquadrão (Ótimo) vence o grupo (Sucesso), que vence a Garra (Falha).
const grupo = iniciativaDoDuelo({ grau: "sucesso", tamanho: "Média", grupo: true });
const esquadrao = iniciativaDoDuelo({ grau: "otimo", tamanho: "Pequena" });
const garra = iniciativaDoDuelo({ grau: "falha", tamanho: "Pequena" });
confere(esquadrao > grupo && grupo > garra, `[CINE-ORDEM] esquadrão, grupo, Garra: ${esquadrao} ${grupo} ${garra}`);
// Mesmo grau: a menor antes; mesmo tamanho: o grupo antes.
confere(iniciativaDoDuelo({ grau: "sucesso", tamanho: "Pequena" }) > iniciativaDoDuelo({ grau: "sucesso", tamanho: "Média", grupo: true }), "[CINE-ORDEM] empate de grau: a menor age antes");
confere(iniciativaDoDuelo({ grau: "falha", tamanho: "Média", grupo: true }) > iniciativaDoDuelo({ grau: "falha", tamanho: "Média" }), "[CINE-ORDEM] empate total: o grupo age antes");
// e a ordem bate com o vencedor do duelo, para todo par de graus e tamanhos
const graus = ["critico", "otimo", "sucesso", "falha", "grave", "desastre"];
const tams = ["Pequena", "Média", "Gigantesca", "Colossal"];
for (const ga of graus) for (const gb of graus) for (const ta of tams) for (const tb of tams) {
  const a = { grau: ga, tamanho: ta, grupo: true };
  const b = { grau: gb, tamanho: tb };
  const v = vencedorDoDuelo(a, b);
  const ia = iniciativaDoDuelo(a);
  const ib = iniciativaDoDuelo(b);
  confere(v === "a" ? ia > ib : ib > ia, `[CINE-ORDEM] ${ga}/${ta} contra ${gb}/${tb}: venceu ${v}, iniciativas ${ia} e ${ib}`);
}

// ── [CINE-TENSAO] ──
confere([1, 2, 3, 4, 5, 6, 9].map(tensaoDaRodada).join() === "0,1,2,3,4,5,5", "[CINE-TENSAO] +0, +1… até +5");
confere(tensaoDaRodada(0) === 0, "[CINE-TENSAO] fora de combate, +0");
confere([1, 2, 3, 4, 5, 6, 7].filter(pedeEvento).join() === "4,6", "[CINE-TENSAO] Evento na rodada em que chega a +3 (4ª) e a +5 (6ª)");

// ── [CINE-EXEMPLO] e o ataque ──
// «Ryn contra a Garra: +16 +2 (Mira) +2 (Firmar) = +20.» — BA da nave 12, Computador 2, Ryn 2.
const ryn = termosCine({ ba: 12, balistico: 2, artilheiro: 2, rodada: 1, vantagem: "mira", firmar: true });
confere(soma(ryn) === 20, `[CINE-EXEMPLO] Ryn +20 (veio ${soma(ryn)})`);
confere(atingeCamara({ total: 33, cp: 28, natural: 13, noCasco: 17 }), "[CINE-EXEMPLO] 33 contra 28 no Casco: margem 5 atinge câmara");
// Rodada 2, esquadrão: +16 +1 (dois caças) +1 (Tensão) = +18 → modelado como BA 16 + situação 1 + Tensão
confere(soma(termosCine({ ba: 16, rodada: 2, situacao: 1 })) === 18, "[CINE-EXEMPLO] esquadrão na rodada 2: +18");
confere(soma(termosCine({ ba: 12, artilheiro: 2, balistico: 2, caudaContraMim: true, rodada: 2 })) === 15, "[CINE-EXEMPLO] Ryn com a cauda contra ele, rodada 2: +15");
confere(soma(termosCine({ ba: 12, balistico: 2, avarias: { ponte: { estado: "avaria" } } })) === 12, "[CINE-PEN] Ponte avariada: −2 no ataque");
confere(soma(termosCine({ ba: 12, balistico: 2, avarias: { ponte: { estado: "fora" } } })) === 12, "[CINE-PEN] Ponte Fora: perde o Computador Balístico");
confere(soma(termosCine({ ba: 12, rajada: true, mirarSistema: true })) === 4, "[CINE-EXEMPLO] Rajada e Mirar sistema: −4 cada");

// ── [CINE-DANO] ──
let d = aplicarDanoCine({ escudo: 15, casco: 40, dano: 9 });
confere(d.escudo === 6 && d.casco === 40 && d.noCasco === 0, "[CINE-DANO] 9 de dano: tudo no Escudo");
d = aplicarDanoCine({ escudo: 6, casco: 40, dano: 13 });
confere(d.escudo === 0 && d.casco === 33 && d.noEscudo === 6 && d.noCasco === 7, "[CINE-DANO] 13 com 6 de Escudo: 7 no Casco (o exemplo)");
d = aplicarDanoCine({ escudo: 0, casco: 5, dano: 12 });
confere(d.casco === -7, "[CINE-DANO] o Casco pode ficar negativo; a ficha decide o que é 0");

// ── [CINE-CAMARA] ──
confere(!atingeCamara({ total: 40, cp: 26, natural: 14, noCasco: 0 }), "[CINE-CAMARA] dano só no Escudo nunca atinge câmara");
confere(!atingeCamara({ total: 30, cp: 26, natural: 14, noCasco: 5 }), "[CINE-CAMARA] margem 4 não atinge");
confere(atingeCamara({ total: 28, cp: 26, natural: 14, noCasco: 5, travado: true }), "[CINE-CAMARA] travado: margem 2 atinge");
confere(atingeCamara({ total: 22, cp: 26, natural: 20, noCasco: 5 }), "[CINE-CAMARA] 20 natural no Casco atinge sempre");
confere(atingeCamara({ total: 27, cp: 26, natural: 9, noCasco: 5, mirarSistema: true }), "[CINE-CAMARA] Mirar sistema dispensa a margem");
confere(atingeCamara({ total: 33, cp: 26, natural: 9, noCasco: 5, margem: 7 }) && !atingeCamara({ total: 32, cp: 26, natural: 9, noCasco: 5, margem: 7 }), "[CINE-CAMARA] Casco de fragata: margem 7");

// ── [CINE-D12] ──
confere(D12.length === 12 && D12.every((x) => CAMARAS[x.camara]), "[CINE-D12] doze câmaras, todas existentes em camaras.js");
confere(D12.map((x) => x.camara).join() === Object.keys(CAMARAS).join(), "[CINE-D12] na ordem da tabela das doze");
confere(camaraDoD12(1).camara === "ponte" && camaraDoD12(3).camara === "maquinas" && camaraDoD12(6).camara === "arsenal" && camaraDoD12(12).camara === "emergencia", "[CINE-D12] 1 Ponte, 3 Máquinas, 6 Arsenal, 12 Saída");
const fam = (f) => D12.map((x, i) => (x.familia === f ? i + 1 : null)).filter(Boolean).join();
confere(fam("sistema") === "1,3,6,12", `[CINE-D12] sistemas 1,3,6,12 (veio ${fam("sistema")})`);
confere(fam("incendio") === "2,4,5,7,8", `[CINE-D12] incêndios 2,4,5,7,8 (veio ${fam("incendio")})`);
confere(fam("brecha") === "9,10,11", `[CINE-D12] brechas 9,10,11 (veio ${fam("brecha")})`);
confere(camaraDoD12(13) === null && camaraDoD12(0) === null, "[CINE-D12] fora de 1–12 → null");
confere(golpeNaCamara("ausente").tipo === "ausente" && golpeNaCamara("ausente").extra === "1d10", "[CINE-D12] câmara ausente: +1d10");
confere(golpeNaCamara(undefined).tipo === "ausente", "[CINE-D12] câmara sem estado conta como ausente");
confere(golpeNaCamara("instalada").tipo === "avaria", "[CINE-D12] instalada: avaria");
confere(golpeNaCamara("danificada").tipo === "avaria", "[CINE-D12] danificada continua lá: avaria");
confere(golpeNaCamara("instalada", { estado: "avaria" }).tipo === "fora", "[CINE-D12] de novo: Fora");
let av = registrarGolpe({}, "deposito", "avaria", 1);
confere(av.deposito.estado === "avaria" && av.deposito.desde === 1, "[CINE-D12] o golpe grava a rodada");
av = registrarGolpe(av, "deposito", "fora", 3);
confere(av.deposito.estado === "fora" && av.deposito.desde === 1, "[CINE-D12] cair Fora mantém a rodada do primeiro golpe");
confere(registrarGolpe({}, "ponte", "ausente", 1).ponte === undefined, "[CINE-D12] câmara ausente não grava avaria");
confere(resolverAvaria({ arsenal: { estado: "avaria" } }, "arsenal").arsenal === undefined, "[CINE-D12] Resolver tira a avaria");
confere(resolverAvaria({ arsenal: { estado: "fora" } }, "arsenal").arsenal?.estado === "fora", "[CINE-D12] Fora não se resolve em combate");

// ── [CINE-PEN] ──
let p = penalidadesDeCamara({ ponte: { estado: "avaria" }, maquinas: { estado: "avaria" } });
confere(p.ataque === -2 && p.pilotar === -20 && soma(p.duelo) === -40, "[CINE-PEN] Ponte e Máquinas avariadas: −2 ataque, −40% no duelo");
confere(p.semPrioridade && p.semRecarga && !p.semEscudo, "[CINE-PEN] Máquinas avariadas: sem Prioridade nem recarga, escudo de pé");
p = penalidadesDeCamara({ ponte: { estado: "fora" } });
confere(p.semArmas && p.semEscudo && p.pilotarSo5 && p.ataque === 0, "[CINE-PEN] Ponte Fora: sem armas, sem escudo, Pilotar 5%");
p = penalidadesDeCamara({ maquinas: { estado: "fora" } });
confere(p.semEscudo && p.perdeDuelo, "[CINE-PEN] Máquinas Fora: escudo 0 e perde todo duelo");
confere(penalidadesDeCamara({ arsenal: { estado: "avaria" } }).armasParadas === 1 && penalidadesDeCamara({ arsenal: { estado: "fora" } }).armasParadas === 2, "[CINE-PEN] Arsenal: 1 arma, Fora 2");
confere(penalidadesDeCamara({}).ataque === 0 && penalidadesDeCamara({}).duelo.length === 0, "[CINE-PEN] sem avaria, sem penalidade");

// ── [CINE-FIM] ──
const estados = Object.fromEntries(Object.keys(CAMARAS).map((k) => [k, "instalada"]));
let f = fimDaRodadaCine({ deposito: { estado: "avaria", desde: 1 } }, { rodada: 1, estados });
confere(f.danos.length === 1 && f.danos[0].formula === "1d6" && f.espalhou.length === 0, "[CINE-FIM] incêndio novo: 1d6, ainda não espalha");
f = fimDaRodadaCine({ deposito: { estado: "avaria", desde: 1 } }, { rodada: 2, estados });
confere(f.espalhou.length === 1 && f.espalhou[0].para === "refeitorio" && f.avarias.refeitorio?.desde === 3, "[CINE-FIM] 2 rodadas sem apagar: espalha para o Refeitório, que começa a contar na seguinte");
f = fimDaRodadaCine({ deposito: { estado: "avaria", desde: 1 } }, { rodada: 2, estados: { ...estados, refeitorio: "ausente" } });
confere(f.espalhou.length === 0, "[CINE-FIM] não espalha para câmara ausente");
f = fimDaRodadaCine({ hospital: { estado: "fora", desde: 1 }, corredores: { estado: "avaria", desde: 1 }, ponte: { estado: "avaria", desde: 1 } }, { rodada: 1, estados });
const formulas = Object.fromEntries(f.danos.map((x) => [x.camara, x.formula]));
confere(formulas.hospital === "2d10" && formulas.corredores === "1d4" && !formulas.ponte, "[CINE-FIM] Fora dobra o incêndio; brecha 1d4; sistema não cobra");
f = fimDaRodadaCine({ laboratorio: { estado: "avaria", desde: 1 } }, { rodada: 5, estados });
confere(f.espalhou[0]?.para === "acoplagem" && f.avarias.acoplagem.estado === "avaria", "[CINE-FIM] o fogo do Laboratório abre brecha na Acoplagem (a câmara seguinte)");

// ── [CINE-POS] ──
const pos = depoisDoCombate({ arsenal: { estado: "avaria" }, deposito: { estado: "fora" } });
confere(pos.ultimoTeste.join() === "arsenal" && pos.danificadas.join() === "deposito", "[CINE-POS] avaria ganha teste, Fora danifica direto");

// ── a Engenharia ──
confere(recarregar(7, 15, 12) === 15 && recarregar(0, 15, 7) === 7, "[CINE] a recarga não passa do máximo");
confere(podeRepararAgora(null, 1) && !podeRepararAgora(2, 3) && podeRepararAgora(2, 4), "[CINE] Reparo de emergência não em rodadas seguidas");
confere(["leme", "artilharia", "engenharia", "sensores", "comando"].every((k) => ACOES_CINE[k]?.length === 4), "[CINE] cinco postos, quatro ações cada");

if (problemas.length) {
  console.error(`${problemas.length} problema(s) no Combate Cinematográfico:`);
  for (const p2 of problemas) console.error(`  ✘ ${p2}`);
  process.exit(1);
}
console.log("✔ Combate Cinematográfico: escala, duelo, ordem, Tensão, dano, câmaras, fim da rodada e pós-combate conferem.");
