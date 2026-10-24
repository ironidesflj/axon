# Changelog — Axon

Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) ·
versionamento semver · toda entrada tem motivo.

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
  tag `v0.1.0`** — a tag ancora o conteúdo completo.
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
