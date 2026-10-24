# plan — Axon

Out/2026 · três pistas: **biblioteca**, **publicação**, **adoção**.
(As pistas "apps" e "hub UI" pertencem aos repositórios deles; aqui só o que
é da biblioteca.)

## Feito

- **F1 — fatia mínima, implementada na v0.2.0** (specs → código, suíte verde):
  - `spec-id-generator.md` — `src/id-generator.ts`: generateId, validateId,
    validateAliasId, aliasOf, MAX_SEQ
  - `spec-schema.md` — `src/schema.ts` + `src/checksum.ts`: parseQuestionLine,
    parseManifest (linha inválida rejeitada com log), computeChecksum,
    verifyChecksum — **algoritmo de checksum travado na revisão de
    implementação** (pendência encerrada)
  - `spec-deep-link.md` — `src/deep-link.ts`: canonicalUrl, fallbackUrl,
    resolveAlias
  - `spec-contract-tests.md` — `tests/contract/`: 44 casos citáveis, 44
    verdes; fixtures golden; oráculo node:crypto; auditoria de rede em
    `dist/src`; barreira `prepublishOnly`
  - TypeScript ESM, zero dependência de runtime, Node ≥ 20 e browser;
    `package-lock.json` commitado; CI (GitHub Actions) em todo push/PR.

## Autorizado (especificado; implementar)

- **F1.5 — suite de conformidade:** ação de CI reutilizável que valida um
  `manifest.jsonl` externo (linha a linha, rejeitando com log) — o mesmo
  verificador que o hub usará na ingestão. Reusa `parseManifest` +
  `verifyChecksum` da F1; o que falta é o empacotamento como GitHub Action
  e a decisão do que é reject × warn no lado do hub.

## Pendente (decisão ou gatilho externo)

- **Publicação npm como `@noos/axon`** — gatilho: código da F1 pronto ✅ e o
  primeiro app disposto a adotar (falta este). Publicar sem consumidor é
  promessa vazia. Quando o gatilho chegar: criar a org `@noos` no npm,
  trocar `private: true` → `false` + `publishConfig` com `access: public`,
  publicar `0.2.0` (a suíte roda no `prepublishOnly`).
- **Escopo `@noos` no npm** — criar a organização npm e o registro do token
  no CI (mantenedor).
- **Tag `v0.2.0`** no commit da F1 — ancora o número publicado; a tag
  `v0.1.0` (spec-first) permanece onde está, como história.

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
