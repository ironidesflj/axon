# Changelog — Axon

Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) ·
versionamento semver · toda entrada tem motivo.

## [0.2.0] — out. 2026

A fatia F1 sai do papel: o contrato ganha código — e a prova de que o
código cumpre o contrato.

### Adicionado

- **Implementação TypeScript da F1** (`src/`, ESM, zero dependência de
  runtime, Node ≥ 20 e browser):
  - `id-generator.ts` — `generateId`/`validateId`/`validateAliasId`/`aliasOf`
    (+ `REGISTRY_PREFIXES`, `ALIAS_PREFIXES`, `MAX_SEQ`)
  - `schema.ts` — `parseQuestionLine`/`parseManifest` (linha inválida
    rejeitada com log; id duplicada rejeita a segunda e reporta ambas)
  - `deep-link.ts` — `canonicalUrl`/`fallbackUrl`/`resolveAlias`
  - `checksum.ts` + `sha256.ts` — `computeChecksum`/`verifyChecksum`
    (SHA-256 puro FIPS 180-4)
- **Suíte de testes de contrato** (`tests/contract/`, spec-contract-tests):
  44 casos citáveis por regra da constitution, fixtures golden versionadas,
  oráculo `node:crypto` (200 entradas determinísticas), auditoria de rede
  varrendo o `dist/src` embarcado, barreira `prepublishOnly`.
- CI (GitHub Actions): suíte em todo push/PR.
- `package-lock.json` commitado (regra do pin: lockfile por construção).

### Decisões travadas na revisão de implementação

- **Checksum** (pendência da spec-schema encerrada): `sha256:` + hex do
  SHA-256 sobre o JSON canônico de `[statement, options, answer, reference]`
  — só o snapshot entra; options como array; version fora. Detalhe e
  justificativas na `spec-schema.md`.
- `snapshot.options` ≥ 2 alternativas não vazias; `statement`/`answer` não
  vazios; `reference` aceita vazia.
- Cross-check `exam` ↔ código da prova da `id` (normalizado) — manifesto que
  arquivaria a questão na certificação errada é rejeitado.
- Campos extras na linha: tolerados na leitura, não repassados.
- Linha em branco pulada, não rejeitada.
- `generateId` esgota em `99999` — o formato de 5 dígitos é lei; alargar
  exige RFC.
- Alias de prefixo conhecido só aponta para o prefixo oficial dele
  (`GLI-…` → `RAN-…`).

### Sem mudança

- `constitution.md` — a lei não muda com a implementação.

## [0.1.0] — out. 2026

Nascimento **spec-first**: o contrato nasce antes do código, porque dois apps
já estão publicados (Synapse, Ranvier) e o terceiro documento da suíte (Guia
de atualização da marca-mãe) já referencia regras que não tinham casa canônica.

### Adicionado

- `constitution.md` v0.1.0 — o contrato completo: formato de ID pública
  (`{PREFIXO}-{PROVA}-{SEQ}`) com as 4 regras (marca pública, alias eterno,
  namespace próprio, sem reciclagem); os 9 campos do `manifest.jsonl` com
  regra de ingestão (linha inválida rejeitada com log, último build bom
  segue servindo); deep-link canônico com fallback; regras da biblioteca
  (pacote semver, pin exato, nunca serviço, MAJOR não quebra ID publicada);
  idioma; precedência entre os 4 documentos do sistema.
- Specs da fatia F1 (especificadas, sem código): `spec-id-generator.md`,
  `spec-schema.md`, `spec-deep-link.md`.
- `spec-contract-tests.md` — testes de contrato da F1: a barreira de
  publicação npm (suíte no pacote, casos citáveis citando a constitution
  regra por regra, fixtures golden versionadas, `ids.golden.json` que só
  cresce — remover ID histórica depois do primeiro publish é MAJOR com
  aviso de 90 dias). Adicionada após o commit inicial `8c47d2a`, **antes da
  tag `v0.1.0`** — a tag ancora o conteúdo completo. Implementada na v0.2.0.
- `current-state.md` com o que existe, o que não existe (e não finge), e as
  limitações conhecidas.
- `plan.md` nas três pistas (biblioteca, publicação, adoção) com o
  deliberadamente adiado (SM-2 como pacote) e o fora de escopo para sempre.

### Decisões desta versão

- **Repo próprio, não pasta** — o Axon mora dentro da casa Noos, em quarto
  próprio; apps e hub consomem por versão fixada (regra do modelo SDD do
  mantenedor: "não pasta compartilhada por acidente").
- **`@noos/axon` como nome público** — nome plano `axon` tomado no npm por
  terceiros (verificado out/2026).
- **Alias `GLI-` documentado como dado do app emissor** — a tabela vive no
  Ranvier; o contrato garante que ela vale para sempre.
