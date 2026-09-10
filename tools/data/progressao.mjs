// Tabelas de progressão do Capítulo 3 (T3-1, T3-3, T3-4, T3-5, T3-6).
//
// Transcritas do PDF e conferidas em 12 pontos contra a leitura visual das
// tabelas. Os valores ficam como TEXTO porque não são todos números: o dado de
// vida vira "+1 PV" a partir do 10º nível, a base de ataque do Cosmonauta vira
// "+9/+3" quando ele ganha o segundo ataque, e o dano crítico é "x2"/"x3"/"x4".
//
// Converter isso para número perderia justamente o que interessa.
//
// A JP é UMA coluna só. O que muda entre reflexos, física e mental é o atributo
// que modifica a rolagem, não o alvo.

export const CIENTISTA = [
  { nivel: "1", xp: "0", dv: "1", ba: "0", jp: "15", operarMaquinas: "80%", ntMaximo: "1º" },
  { nivel: "2", xp: "1.500", dv: "2", ba: "+1", jp: "15", operarMaquinas: "81%", ntMaximo: "–" },
  { nivel: "3", xp: "3.000", dv: "3", ba: "+2", jp: "15", operarMaquinas: "82%", ntMaximo: "2º" },
  { nivel: "4", xp: "6.000", dv: "4", ba: "+2", jp: "14", operarMaquinas: "83%", ntMaximo: "–" },
  { nivel: "5", xp: "12.000", dv: "5", ba: "+3", jp: "14", operarMaquinas: "84%", ntMaximo: "3º" },
  { nivel: "6", xp: "24.000", dv: "6", ba: "+3", jp: "14", operarMaquinas: "85%", ntMaximo: "–" },
  { nivel: "7", xp: "48.000", dv: "7", ba: "+3", jp: "13", operarMaquinas: "86%", ntMaximo: "4º" },
  { nivel: "8", xp: "100.000", dv: "8", ba: "+4", jp: "13", operarMaquinas: "87%", ntMaximo: "–" },
  { nivel: "9", xp: "200.000", dv: "9", ba: "+4", jp: "13", operarMaquinas: "88%", ntMaximo: "5º" },
  { nivel: "10", xp: "300.000", dv: "+1 PV", ba: "+4", jp: "12", operarMaquinas: "89%", ntMaximo: "–" },
  { nivel: "11", xp: "400.000", dv: "+1 PV", ba: "+5", jp: "12", operarMaquinas: "90%", ntMaximo: "6º" },
  { nivel: "12", xp: "500.000", dv: "+2 PV", ba: "+5", jp: "12", operarMaquinas: "91%", ntMaximo: "–" },
  { nivel: "13", xp: "600.000", dv: "+2 PV", ba: "+5", jp: "11", operarMaquinas: "92%", ntMaximo: "7º" },
  { nivel: "14", xp: "700.000", dv: "+3 PV", ba: "+6", jp: "11", operarMaquinas: "93%", ntMaximo: "–" },
  { nivel: "15", xp: "800.000", dv: "+3 PV", ba: "+6", jp: "11", operarMaquinas: "94%", ntMaximo: "8º" },
  { nivel: "16", xp: "900.000", dv: "+4 PV", ba: "+6", jp: "10", operarMaquinas: "95%", ntMaximo: "–" },
  { nivel: "17", xp: "1.000.000", dv: "+4 PV", ba: "+7", jp: "10", operarMaquinas: "96%", ntMaximo: "9º" },
  { nivel: "18", xp: "1.100.000", dv: "+5 PV", ba: "+7", jp: "10", operarMaquinas: "97%", ntMaximo: "–" },
  { nivel: "19", xp: "1.200.000", dv: "+5 PV", ba: "+7", jp: "9", operarMaquinas: "98%", ntMaximo: "10º" },
  { nivel: "20", xp: "1.300.000", dv: "+6 PV", ba: "+8", jp: "9", operarMaquinas: "99%", ntMaximo: "–" },
];

export const COSMONAUTA = [
  { nivel: "1", xp: "0", dv: "1", ba: "+1", jp: "16", pilotarNaves: "80%", desarmarSubjugar: "20%", danoCritico: "x2" },
  { nivel: "2", xp: "2.000", dv: "2", ba: "+2", jp: "16", pilotarNaves: "81%", desarmarSubjugar: "25%", danoCritico: "x2" },
  { nivel: "3", xp: "4.000", dv: "3", ba: "+3", jp: "16", pilotarNaves: "82%", desarmarSubjugar: "30%", danoCritico: "x2" },
  { nivel: "4", xp: "8.000", dv: "4", ba: "+4", jp: "15", pilotarNaves: "83%", desarmarSubjugar: "35%", danoCritico: "x2" },
  { nivel: "5", xp: "16.000", dv: "5", ba: "+5", jp: "15", pilotarNaves: "84%", desarmarSubjugar: "40%", danoCritico: "x2" },
  { nivel: "6", xp: "32.000", dv: "6", ba: "+6", jp: "15", pilotarNaves: "85%", desarmarSubjugar: "45%", danoCritico: "x3" },
  { nivel: "7", xp: "64.000", dv: "7", ba: "+7/+1", jp: "14", pilotarNaves: "86%", desarmarSubjugar: "50%", danoCritico: "x3" },
  { nivel: "8", xp: "128.000", dv: "8", ba: "+8/+2", jp: "14", pilotarNaves: "87%", desarmarSubjugar: "55%", danoCritico: "x3" },
  { nivel: "9", xp: "256.000", dv: "9", ba: "+9/+3", jp: "14", pilotarNaves: "88%", desarmarSubjugar: "60%", danoCritico: "x3" },
  { nivel: "10", xp: "304.000", dv: "+2 PV", ba: "+10/+4", jp: "13", pilotarNaves: "89%", desarmarSubjugar: "65%", danoCritico: "x3" },
  { nivel: "11", xp: "408.000", dv: "+2 PV", ba: "+10/+4", jp: "13", pilotarNaves: "90%", desarmarSubjugar: "70%", danoCritico: "x3" },
  { nivel: "12", xp: "516.000", dv: "+4 PV", ba: "+11/+5", jp: "13", pilotarNaves: "91%", desarmarSubjugar: "72%", danoCritico: "x4" },
  { nivel: "13", xp: "632.000", dv: "+4 PV", ba: "+11/+5", jp: "12", pilotarNaves: "92%", desarmarSubjugar: "74%", danoCritico: "x4" },
  { nivel: "14", xp: "704.000", dv: "+5 PV", ba: "+12/+6", jp: "12", pilotarNaves: "93%", desarmarSubjugar: "76%", danoCritico: "x4" },
  { nivel: "15", xp: "808.000", dv: "+5 PV", ba: "+12/+6", jp: "12", pilotarNaves: "94%", desarmarSubjugar: "78%", danoCritico: "x4" },
  { nivel: "16", xp: "916.000", dv: "+6 PV", ba: "+13/+7", jp: "11", pilotarNaves: "95%", desarmarSubjugar: "80%", danoCritico: "x4" },
  { nivel: "17", xp: "1.032.000", dv: "+6 PV", ba: "+13/+7", jp: "11", pilotarNaves: "96%", desarmarSubjugar: "82%", danoCritico: "x4" },
  { nivel: "18", xp: "1.064.000", dv: "+7 PV", ba: "+14/+8", jp: "11", pilotarNaves: "97%", desarmarSubjugar: "84%", danoCritico: "x5" },
  { nivel: "19", xp: "1.128.000", dv: "+7 PV", ba: "+14/+8", jp: "10", pilotarNaves: "98%", desarmarSubjugar: "86%", danoCritico: "x5" },
  { nivel: "20", xp: "1.256.000", dv: "+8 PV", ba: "+15/+9", jp: "10", pilotarNaves: "99%", desarmarSubjugar: "88%", danoCritico: "x5" },
];

export const GATUNO = [
  { nivel: "1", xp: "0", dv: "1", ba: "+1", jp: "15" },
  { nivel: "2", xp: "1.250", dv: "2", ba: "+1", jp: "15" },
  { nivel: "3", xp: "2.500", dv: "3", ba: "+2", jp: "15" },
  { nivel: "4", xp: "5.000", dv: "4", ba: "+2", jp: "14" },
  { nivel: "5", xp: "10.000", dv: "5", ba: "+2", jp: "14" },
  { nivel: "6", xp: "20.000", dv: "6", ba: "+3", jp: "14" },
  { nivel: "7", xp: "40.000", dv: "7", ba: "+3", jp: "13" },
  { nivel: "8", xp: "80.000", dv: "8", ba: "+3", jp: "13" },
  { nivel: "9", xp: "160.000", dv: "9", ba: "+4", jp: "13" },
  { nivel: "10", xp: "240.000", dv: "+1 PV", ba: "+4", jp: "12" },
  { nivel: "11", xp: "400.000", dv: "+1 PV", ba: "+4", jp: "12" },
  { nivel: "12", xp: "520.000", dv: "+2 PV", ba: "+5", jp: "12" },
  { nivel: "13", xp: "640.000", dv: "+2 PV", ba: "+5", jp: "11" },
  { nivel: "14", xp: "760.000", dv: "+2 PV", ba: "+5", jp: "11" },
  { nivel: "15", xp: "880.000", dv: "+3 PV", ba: "+6", jp: "11" },
  { nivel: "16", xp: "1.000.000", dv: "+3 PV", ba: "+6", jp: "10" },
  { nivel: "17", xp: "1.120.000", dv: "+3 PV", ba: "+6", jp: "10" },
  { nivel: "18", xp: "1.240.000", dv: "+4 PV", ba: "+7", jp: "10" },
  { nivel: "19", xp: "1.360.000", dv: "+4 PV", ba: "+7", jp: "9" },
  { nivel: "20", xp: "1.480.000", dv: "+4 PV", ba: "+7", jp: "9" },
];

export const MENTALICO = [
  { nivel: "1", xp: "0", dv: "1", ba: "0", jp: "14", realizarAprender: "1%", grandezaMental: "1ª" },
  { nivel: "2", xp: "2.500", dv: "2", ba: "0", jp: "14", realizarAprender: "2%", grandezaMental: "–" },
  { nivel: "3", xp: "5.000", dv: "3", ba: "+1", jp: "14", realizarAprender: "4%", grandezaMental: "2ª" },
  { nivel: "4", xp: "10.000", dv: "4", ba: "+1", jp: "13", realizarAprender: "6%", grandezaMental: "–" },
  { nivel: "5", xp: "20.000", dv: "5", ba: "+2", jp: "13", realizarAprender: "9%", grandezaMental: "3ª" },
  { nivel: "6", xp: "40.000", dv: "6", ba: "+2", jp: "13", realizarAprender: "13%", grandezaMental: "–" },
  { nivel: "7", xp: "80.000", dv: "7", ba: "+3", jp: "12", realizarAprender: "17%", grandezaMental: "4ª" },
  { nivel: "8", xp: "160.000", dv: "8", ba: "+3", jp: "12", realizarAprender: "23%", grandezaMental: "–" },
  { nivel: "9", xp: "310.000", dv: "9", ba: "+3", jp: "12", realizarAprender: "28%", grandezaMental: "5ª" },
  { nivel: "10", xp: "460.000", dv: "+1 PV", ba: "+4", jp: "11", realizarAprender: "36%", grandezaMental: "–" },
  { nivel: "11", xp: "510.000", dv: "+1 PV", ba: "+4", jp: "11", realizarAprender: "43%", grandezaMental: "6ª" },
  { nivel: "12", xp: "660.000", dv: "+1 PV", ba: "+4", jp: "11", realizarAprender: "53%", grandezaMental: "–" },
  { nivel: "13", xp: "710.000", dv: "+1 PV", ba: "+5", jp: "10", realizarAprender: "62%", grandezaMental: "7ª" },
  { nivel: "14", xp: "860.000", dv: "+1 PV", ba: "+5", jp: "10", realizarAprender: "74%", grandezaMental: "–" },
  { nivel: "15", xp: "910.000", dv: "+2 PV", ba: "+5", jp: "10", realizarAprender: "86%", grandezaMental: "8ª" },
  { nivel: "16", xp: "1.060.000", dv: "+2 PV", ba: "+6", jp: "9", realizarAprender: "100%", grandezaMental: "–" },
  { nivel: "17", xp: "1.110.000", dv: "–", ba: "+6", jp: "9", realizarAprender: "115%", grandezaMental: "9ª" },
  { nivel: "18", xp: "1.160.000", dv: "–", ba: "+6", jp: "9", realizarAprender: "131%", grandezaMental: "–" },
  { nivel: "19", xp: "1.210.000", dv: "–", ba: "+6", jp: "9", realizarAprender: "139%", grandezaMental: "10ª" },
  { nivel: "20", xp: "1.260.000", dv: "–", ba: "+6", jp: "9", realizarAprender: "150%", grandezaMental: "–" },
];

export const TALENTOSGATUNO = [
  { nivel: "1", sabotagem: "15% / 1d8", escalar: "80%", furtividade: "20%", furtar: "20%", percepcao: "1-2", ataqueFurtivo: "x2" },
  { nivel: "2", sabotagem: "20% / 1d8", escalar: "81%", furtividade: "25%", furtar: "25%", percepcao: "1-2", ataqueFurtivo: "x2" },
  { nivel: "3", sabotagem: "25% / 1d8", escalar: "82%", furtividade: "30%", furtar: "30%", percepcao: "1-2", ataqueFurtivo: "x2" },
  { nivel: "4", sabotagem: "30% / 1d8", escalar: "83%", furtividade: "35%", furtar: "35%", percepcao: "1-2", ataqueFurtivo: "x2" },
  { nivel: "5", sabotagem: "35% / 1d8", escalar: "84%", furtividade: "40%", furtar: "40%", percepcao: "1-3", ataqueFurtivo: "x2" },
  { nivel: "6", sabotagem: "40% / 1d6", escalar: "85%", furtividade: "45%", furtar: "45%", percepcao: "1-3", ataqueFurtivo: "x3" },
  { nivel: "7", sabotagem: "45% / 1d6", escalar: "86%", furtividade: "50%", furtar: "50%", percepcao: "1-3", ataqueFurtivo: "x3" },
  { nivel: "8", sabotagem: "50% / 1d6", escalar: "87%", furtividade: "55%", furtar: "55%", percepcao: "1-3", ataqueFurtivo: "x3" },
  { nivel: "9", sabotagem: "55% / 1d6", escalar: "88%", furtividade: "60%", furtar: "60%", percepcao: "1-3", ataqueFurtivo: "x3" },
  { nivel: "10", sabotagem: "60% / 1d6", escalar: "89%", furtividade: "65%", furtar: "65%", percepcao: "1-4", ataqueFurtivo: "x3" },
  { nivel: "11", sabotagem: "62% / 1d4", escalar: "90%", furtividade: "70%", furtar: "70%", percepcao: "1-4", ataqueFurtivo: "x3" },
  { nivel: "12", sabotagem: "64% / 1d4", escalar: "91%", furtividade: "72%", furtar: "72%", percepcao: "1-4", ataqueFurtivo: "x4" },
  { nivel: "13", sabotagem: "66% / 1d4", escalar: "92%", furtividade: "74%", furtar: "74%", percepcao: "1-4", ataqueFurtivo: "x4" },
  { nivel: "14", sabotagem: "68% / 1d4", escalar: "93%", furtividade: "76%", furtar: "76%", percepcao: "1-4", ataqueFurtivo: "x4" },
  { nivel: "15", sabotagem: "70% / 1d4", escalar: "94%", furtividade: "78%", furtar: "78%", percepcao: "1-4", ataqueFurtivo: "x4" },
  { nivel: "16", sabotagem: "72% / 1", escalar: "95%", furtividade: "80%", furtar: "80%", percepcao: "1-5", ataqueFurtivo: "x4" },
  { nivel: "17", sabotagem: "74% / 1", escalar: "96%", furtividade: "82%", furtar: "82%", percepcao: "1-5", ataqueFurtivo: "x4" },
  { nivel: "18", sabotagem: "76% / 1", escalar: "97%", furtividade: "84%", furtar: "84%", percepcao: "1-5", ataqueFurtivo: "x5" },
  { nivel: "19", sabotagem: "78% / 1", escalar: "98%", furtividade: "86%", furtar: "86%", percepcao: "1-5", ataqueFurtivo: "x5" },
  { nivel: "20", sabotagem: "80% / 1", escalar: "99%", furtividade: "88%", furtar: "88%", percepcao: "1-5", ataqueFurtivo: "x5" },
];
