# Space Dragon — sistema para Foundry VTT

Sistema **nativo** para o *Space Dragon — Livro Básico Aprimorado*. Não é um
módulo sobre o Old Dragon 2: as regras são outras, e forçá-las no OD2 quebraria
metade delas.

> **Estado: 0.1.0.** As seis tabelas de atributo e a ficha de personagem estão
> prontas e conferidas contra o livro. O resto do livro ainda não.

## Por que sistema e não módulo

Não é diferença de nome — é de forma:

| | Space Dragon | Old Dragon 2 |
|---|---|---|
| Escala de atributo | 1 a **29**, faixas de dois | 3 a 18, faixas irregulares |
| Faixa neutra | **10–11** | 9–12 |
| Defesa | **CP** (Coeficiente de Proteção) | CA |
| Colunas por atributo | **próprias de cada um** | um modificador só |
| Porcentagens | por toda parte | não usa |

Constituição 9 dá **−1** no Space Dragon e **0** no Old Dragon 2. Força tem
carga em kg, Ciência devolve um **dado** de robôs desativados, Comunicação dá
número de seguidores. Não existe "o modificador" único que a ficha do OD2
pressupõe.

## O que já funciona

**As seis tabelas** (`system/scripts/atributos.mjs`), transcritas de T1-1 a T1-6
e conferidas em 13 pontos contra o livro, mais a checagem de que as 15 faixas
cobrem 1–29 sem buraco.

**A ficha de personagem**, com tudo derivando das tabelas e nada de derivado
gravado no banco:

- os seis atributos, cada um mostrando as próprias colunas
- **CP** = vestes + ajuste de Destreza + bônus de nível (T4-1) + extras
- **BA** em duas vertentes: corpo a corpo por Força, à distância por Destreza
- **JPR / JPF / JPM**, cada uma com o seu atributo
- carga, seguidores, reação, idiomas — e o aviso de **analfabeto** com
  Comunicação até 6
- onde o personagem morre, pela Constituição (T1-3)

**Três rolagens**, e o sentido da comparação muda entre elas:

| Rolagem | Alvo | Sucesso |
|---|---|---|
| Teste de atributo | o próprio valor | **igual ou menor** |
| Ataque | CP do alvo | igual ou maior |
| Jogada de proteção | valor da classe | igual ou maior |

O teste de atributo é o único invertido. Por isso cada rolagem é uma função
separada, e não um parâmetro — trocar o sinal sem perceber seria fácil demais.

## O livro, capítulo a capítulo

| Capítulo | Págs. | Estado |
|---|--:|---|
| 1 — Atributos | 9 | ✅ as seis tabelas |
| 2 — Espécies | 15 | ⬜ Humano · Androide · Mutante |
| 3 — Classes | 24 | ⬜ Cientista · Cosmonauta · Gatuno · Mentálico |
| 4 — Subatributos | 6 | 🟡 na ficha; falta idiomas como lista |
| 5 — Créditos e Equipamento | 10 | ⬜ |
| 6 — Aventuras Espaciais | 10 | ⬜ |
| 7 — Combate e Danos | 16 | ⬜ |
| 8 — Aparatos e Feitos Científicos | 34 | ⬜ |
| 9 — Poderes Mentais | 41 | ⬜ |
| 10 — Espaçonaves e Estações | 15 | ⬜ |
| 11 — Seção do Mestre | 56 | ⬜ |

## Estrutura

```
system/            o que o Foundry carrega
  system.json      manifesto
  scripts/
    atributos.mjs  as tabelas T1-1..T1-6 — a fundação
    modelos.mjs    schema e tudo o que é derivado
    ficha-*.mjs    a ficha e as rolagens
  templates/       Handlebars
  styles/
```

Para instalar em desenvolvimento, aponte um link de `Data/systems/spacedragon`
para a pasta `system/`.

## Pendências conhecidas

**As porcentagens.** Subjugar, furtividade, clonagem, aptidão tecnológica e a
chance de poder mental são `%`. Estão **transcritas fielmente**, e a ficha as
mostra, mas não há rolagem percentual ligada ainda. Há uma proposta de conversão
no cofre (`_regras/Proposta - Substituir as porcentagens.md`) que ainda não li.

**Base de ataque e de JP são digitadas à mão.** Elas vêm da classe, e as classes
ainda não existem como item. A ficha já serve na mesa; quando o Capítulo 3
entrar, esses campos passam a ser calculados.

## Licença

Conteúdo em **CC BY-SA 3.0**, por obrigação da licença do livro-fonte. Código em
MIT. Nenhuma arte do livro. Ver [LICENSE.md](LICENSE.md).
