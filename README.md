# Space Dragon — módulo para Foundry VTT

O conteúdo do *Space Dragon — Livro Básico Aprimorado* como compêndios para o
Foundry VTT, rodando no sistema **Old Dragon 2**.

**As regras são as do livro base, sem conversão.** Os modificadores, as
porcentagens e a escala de 1 a 29 são os do Space Dragon.

> **Estado: 0.5.0.** Capítulos 1, 2 e 3 portados — 59 de 245 páginas.

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
atributo faz: a Ciência é aptidão tecnológica, o Intelecto é proteção mental, a
Comunicação é reação e seguidores. Vive em `tools/data/onde-anotar.mjs`.

## O que já está pronto

| Compêndio | Conteúdo |
|---|---|
| **Espécies** | Humano, Androide, Mutante — com os traços mecânicos |
| **Mutações** | as 20 da T2-1, com as subtabelas T2-2 a T2-5 embutidas |
| **Tabelas** | T2-1 rolável, uma por coluna |
| **Regras** | as seis tabelas de atributo, onde anotar, e os limites |

## As porcentagens

Subjugar, furtividade, clonagem, aptidão tecnológica e a chance de poder mental
são `%`, e o OD2 não trabalha assim. Estão **como o livro as escreve** — o
módulo não converte, e elas se resolvem rolando percentual na mesa.

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
| 4 — Subatributos | 6 | ⬜ |
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
