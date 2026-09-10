# Space Dragon — módulo para Foundry VTT

O conteúdo do *Space Dragon — Livro Básico Aprimorado* como compêndios para o
Foundry VTT, rodando no sistema **Old Dragon 2**.

**As regras são as do livro base, sem conversão.** Os modificadores, as
porcentagens e a escala de 1 a 29 são os do Space Dragon.

> **Estado: 0.6.0.** Capítulos 1 a 4 portados — 65 de 245 páginas.

## O que ele é

Um **módulo de conteúdo** para o sistema `olddragon2e` — não um sistema próprio.
O sistema continua sendo o do Old Dragon 2; este módulo só entrega compêndios.

## O que a ficha do OD2 calcula errado

A ficha calcula o modificador pela tabela **dela**: faixa neutra em 9–12, e para
em 20. A do Space Dragon tem faixa neutra em **10–11** e vai até **29**.

**Ignore o modificador que a ficha exibe** e use o das tabelas T1-1 a T1-6, que
estão no compêndio de Regras. Não há como consertar isso de dentro de um módulo
— quem calcula é o sistema.

## Onde anotar cada atributo

A ficha do OD2 tem seis campos rotulados com os nomes dele. Três atributos do
Space Dragon têm nome próprio, então o módulo adota esta colocação:

| Space Dragon | campo na ficha |
|---|---|
| Força | Força |
| Destreza | Destreza |
| Constituição | Constituição |
| **Ciência** | **Inteligência** |
| **Intelecto** | **Sabedoria** |
| **Comunicação** | **Carisma** |

**Isto é convenção do módulo, não regra do jogo.** Nenhum número muda — a tabela
só diz onde escrever. A colocação sai do que o próprio livro diz que cada
atributo faz: a Ciência é sabotagem e crédito tecnológico, o Intelecto é proteção mental, a
Comunicação é reação e seguidores. Vive em `tools/data/onde-anotar.mjs`.

## O que já está pronto

| Compêndio | Conteúdo |
|---|---|
| **Espécies** | Humano, Androide, Mutante — o Mutante escolhe as duas mutações na própria ficha |
| **Classes** | as 4 do Cap. 3 e as 13 especializações, uma subpasta por classe |
| **Macros** | um botão por teste de porcentagem — rola 1d100 e faz a conta |
| **Tabelas** | T2-1 rolável, uma por coluna |
| **Regras** | as seis tabelas de atributo, os subatributos do Cap. 4, e as 20 mutações por extenso |

## As porcentagens

Subjugar, esgueirar-se, ocultar-se, clonagem e a chance de poder mental são `%`,
e o OD2 não trabalha assim. Estão **como o livro as escreve** — o módulo não
converte.

O que ele faz é **rolá-las**. Rola 1d100 e passa com **menor ou igual**, que é o
contrário do d20 do OD2 e por isso nenhum campo da ficha resolve. O compêndio de
Macros tem um botão por teste: soma a porcentagem do nível à coluna do atributo,
deixa corrigir tudo antes de rolar, e o cartão mostra de onde cada parcela saiu.
Os alvos são verificados contra o livro em `npm run verifica`, incluindo dois
exemplos que o próprio livro resolve.

## Os nomes são os do livro

A classe de combate é o **Homem Espacial**, não "cosmonauta"; os talentos do
Gatuno são **esgueirar-se**, **ocultar-se** e **localizar e sabotar máquinas**,
não furtividade e sabotagem. Essas outras palavras são do *guia de conversão para
Old Dragon 2*, que este módulo não usa.

## Estrutura

```
tools/data/     o conteúdo — é AQUI que se edita
  onde-anotar.mjs onde cada atributo mora na ficha (convenção, não regra)
  atributos.mjs   as tabelas nativas T1-1..T1-6
  mutacoes.mjs    as 20 mutações e as subtabelas
  especies.mjs    Humano, Androide, Mutante
  regras.mjs      o journal
packs-src/      JSON legível — saída do build, entra no git para se diffar
spacedragon-module/   o que o Foundry carrega
```

```
npm install
npm run publicar    # build + zip
```

`packs-src/` e os LevelDB **nunca na mão**: são saída do build.

## O livro, capítulo a capítulo

| Capítulo | Págs. | Estado |
|---|--:|---|
| 1 — Atributos | 9 | ✅ as seis tabelas T1-1 a T1-6 |
| 2 — Espécies | 15 | ✅ as três, com as 20 mutações |
| 3 — Classes | 24 | ✅ as quatro, com as 12 especializações |
| 4 — Subatributos | 6 | ✅ PV, CP, BA, JP, idiomas, Afiliação |
| 5 — Créditos e Equipamento | 10 | ⬜ |
| 6 — Aventuras Espaciais | 10 | ⬜ |
| 7 — Combate e Danos | 16 | ⬜ |
| 8 — Aparatos e Feitos Científicos | 34 | ⬜ |
| 9 — Poderes Mentais | 41 | ⬜ |
| 10 — Espaçonaves e Estações | 15 | ⬜ |
| 11 — Seção do Mestre | 56 | ⬜ |

## Licença

Conteúdo em **CC BY-SA 3.0**, por obrigação da licença do livro-fonte. Código em
MIT. Nenhuma arte do livro. Ver [LICENSE.md](LICENSE.md).
