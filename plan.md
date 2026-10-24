# plan — Axon

Out/2026 · três pistas: **biblioteca**, **publicação**, **adoção**.
(As pistas "apps" e "hub UI" pertencem aos repositórios deles; aqui só o que
é da biblioteca.)

## Autorizado (especificado; implementar)

- **F1 — fatia mínima**, specs prontas:
  - `spec-id-generator.md` — gerador e validador de ID pública
  - `spec-schema.md` — schema de questão e do `manifest.jsonl`
  - `spec-deep-link.md` — helper de deep-link canônico + fallback
  - `spec-contract-tests.md` — testes de contrato: a barreira de publicação
    (suíte no pacote, casos citáveis citando a constitution regra por regra,
    fixtures golden versionadas)
  - Implementação em TypeScript, testes de unidade, zero dependência externa.
- **F1.5 — suite de conformidade:** ação de CI reutilizável que valida um
  `manifest.jsonl` (linha a linha, rejeitando com log) — o mesmo verificador
  que o hub usará na ingestão. Reusa a suíte de `spec-contract-tests.md`.
- **Tag `v0.1.0`** no commit que contém as 4 specs — ancora o número que o
  `noos.registry.json` do hub referencia (mantenedor; ver DEPLOY-style no
  README).

## Pendente (decisão ou gatilho externo)

- **Publicação npm como `@noos/axon`** — gatilho: código da F1 pronto e o
  primeiro app disposto a adotar. Publicar sem consumidor é promessa vazia.
- **Escopo `@noos` no npm** — criar a organização npm e o registro do token
  no CI (mantenedor).
- **Travar o algoritmo de `checksum`** (canonicalização exata do conteúdo) —
  antes da primeira ID real emitida por qualquer app.

## Adiado (intencionalmente)

- **Motor SM-2 como parte do pacote** — hoje cada app tem o seu; o Axon só
  ganha essa fatia quando dois apps provarem que mantêm o mesmo algoritmo
  separado (regra: se vale para os cinco, pertence ao Axon — SM-2 ainda não
  dói em cinco, dói em um de cada vez).
- **Banco Noosfera (F3 do roadmap)** — acervo consolidado e aberto; endgame,
  não pré-requisito.

## Fora de escopo (deste repositório, para sempre)

- Interface, cor, logo, tela — o Axon não tem nenhuma dessas coisas (guia de
  apps, camada 3).
- Emissão de ID — o Axon valida e gera; **nunca emite** (quem emite é o app,
  dono do namespace).
- Guardar dado de estudo, progresso ou resposta — nada privado atravessa a
  biblioteca ou o hub (Carta, cap. 7; guia de atualização, N-05).
