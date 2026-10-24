# Axon — a biblioteca compartilhada do ecossistema Noos

O Axon é o que os cinco apps (Synapse, Ranvier, Myelin, Theta, Engram) e o hub
compartilham: **motor de repetição espaçada (SM-2), schema de questões e IDs
públicos** — o contrato técnico que faz o ecossistema ser um sistema.

**O que o Axon NÃO é** (regra dos três guias, travada):

- não é um sexto app — não tem cor, não tem logo de produto, não tem tela própria;
- não é um serviço — nunca há runtime central; o Axon é **biblioteca linkada no build**;
- não é uma pasta compartilhada por acidente — entra em cada repositório como
  **versão fixada (pin exato)**, com lockfile e a versão registrada no
  `current-state.md` de quem consome.

> Se uma decisão vale para os cinco apps, ela pertence ao Axon.
> Se vale para um só, fica no app.

## Estado atual — v0.1.0 (spec-first)

Este repositório nasce **de especificação antes do código**: o contrato completo
está na [`constitution.md`](constitution.md) e a fatia mínima de implementação
(F1) está especificada em [`spec-id-generator.md`](spec-id-generator.md),
[`spec-schema.md`](spec-schema.md), [`spec-deep-link.md`](spec-deep-link.md) e
[`spec-contract-tests.md`](spec-contract-tests.md) — esta última define a
**barreira de publicação**: os testes de contrato que provam, regra por regra,
que o código cumpre a constitution. O pacote ainda não está publicado no npm —
o nome plano `axon` está tomado por terceiros; a publicação futura usa o
escopo **`@noos/axon`**.

## Registro de prefixos de ID

| Prefixo | App | Estado | Alias histórico |
|---|---|---|---|
| `SYN` | Synapse | oficial — app na família | — |
| `RAN` | Ranvier | oficial — app na família | `GLI-` (codinome de nascimento; vale para sempre) |
| `MYE` | Myelin | previsto no registro; definitiva no batismo | — |
| `THA` | Theta | previsto no registro; definitiva no batismo | — |
| `ENG` | Engram | previsto no registro; definitiva no batismo | — |

A fonte canônica do registro da família é o `noos.registry.json` do repositório
do hub (noos.study). Este arquivo referencia; não duplica.

## Como consumir

- **Hoje (v0.1.0, spec-first):** a `constitution.md` é a fonte da verdade do
  contrato. Apps e hub leem, citam e apontam para ela — em vez de duplicar as
  regras em cada guia.
- **Quando a F1 existir (código):** `@noos/axon` no npm, **pin exato sem `^`**
  (ex.: `@noos/axon@0.1.3`), lockfile commitado, versão anotada no
  `current-state.md` do app consumidor. MAJOR do pacote nunca quebra contrato de
  ID publicado — IDs são para sempre.

## Arquivos canônicos (SDD)

| Arquivo | Responsabilidade |
|---|---|
| `README.md` | este arquivo — organização e registro ativo |
| [`constitution.md`](constitution.md) | **o contrato** — regras permanentes de ID, manifesto e deep-link |
| [`current-state.md`](current-state.md) | estado verificado, versões e limitações |
| [`plan.md`](plan.md) | autorizado, pendente, adiado e fora de escopo |
| `spec-*.md` | problema e contrato de cada mudança, com aceitação |
| [`spec-contract-tests.md`](spec-contract-tests.md) | **a prova** — testes que verificam a constitution, caso a caso |

## Licença

Código MIT · conteúdo do contrato CC BY-SA 4.0 — ver [`LICENSE.md`](LICENSE.md).
O nome **Noos** e seus símbolos são marca; a licença não cobre trademark
(registro INPI, ver Manual de Identidade §11).
