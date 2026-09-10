# Space Dragon — módulo para Foundry VTT

O conteúdo do *Space Dragon — Livro Básico Aprimorado* como compêndios para o
sistema **Old Dragon 2**, seguindo as equivalências de *Jogando Space Dragon com
Old Dragon 2*, de Francisco Martellini.

> **Estado: 0.2.0.** Capítulos 1 e 2 portados. O resto do livro ainda não.

## O que ele é

Um **módulo de conteúdo** para o sistema `olddragon2e` — não um sistema próprio.
O sistema continua sendo o do Old Dragon 2; este módulo só entrega compêndios.

## A armadilha que define o módulo

Space Dragon e Old Dragon 2 **não têm os mesmos atributos**, e a equivalência não
é a que o nome sugere:

| Space Dragon | Old Dragon 2 |
|---|---|
| Força | Força |
| Destreza | Destreza |
| Constituição | Constituição |
| **Ciência** | **Inteligência** |
| **Intelecto** | **Sabedoria** |
| **Comunicação** | Carisma |

**Intelecto vira Sabedoria, não Inteligência.** O guia de Francisco Martellini
justifica: o Intelecto "tem uma semelhança maior com a Sabedoria do que com a
Inteligência, sendo usado inclusive nas Jogadas de Proteção". Mapear pelo nome
parecido inverte dois atributos no módulo inteiro.

A tabela vive em `tools/data/conversao.mjs` e tem teste automático.

## O que já está pronto

| Compêndio | Conteúdo |
|---|---|
| **Espécies** | Humano, Androide, Mutante — com os traços mecânicos |
| **Mutações** | as 20 da T2-1, com as subtabelas T2-2 a T2-5 embutidas |
| **Tabelas** | T2-1 rolável, uma por coluna |
| **Regras** | a conversão, as tabelas nativas T1-1 a T1-6, e os limites |

## Onde a ficha do OD2 mostra o número errado

A tabela do Space Dragon vai de 1 a 29; a do OD2 para em 20 e não tem a faixa do
1 isolada. Nos valores **1 e de 21 a 29** os dois discordam, e a ficha calcula
pela tabela dela. O Mestre corrige à mão — não há como consertar de dentro de um
módulo, e está avisado no journal.

## As porcentagens

Subjugar, furtividade, clonagem, aptidão tecnológica e a chance de poder mental
são `%`, e o OD2 não trabalha assim. Estão **transcritas, não convertidas**.

## Estrutura

```
tools/data/     o conteúdo — é AQUI que se edita
  conversao.mjs   a equivalência SD → OD2, com teste
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
| 1 — Atributos | 9 | ✅ conversão e tabelas nativas |
| 2 — Espécies | 15 | ✅ as três, com as 20 mutações |
| 3 — Classes | 24 | ⬜ Cientista · Cosmonauta · Gatuno · Mentálico |
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
