# current-state — Axon

Última verificação: out/2026 · versão 0.1.0

## O que existe e está verificado

- **`constitution.md` v0.1.0** — o contrato completo: formato de ID pública
  (`{PREFIXO}-{PROVA}-{SEQ}`) com as 4 regras, os 9 campos do `manifest.jsonl`,
  deep-link canônico com fallback, regras da biblioteca, idioma e precedência
  entre documentos.
- **Specs da fatia F1** (especificadas, **não implementadas**):
  `spec-id-generator.md`, `spec-schema.md`, `spec-deep-link.md`.
- **Registro de prefixos** referenciado: `SYN`, `RAN` oficiais; `MYE`, `THA`,
  `ENG` previstos no registro da marca-mãe, definitivos no batismo. Alias
  histórico documentado: `GLI-` (codinome de nascimento do Ranvier).

## O que NÃO existe (e não fingir que existe)

- **Sem código.** Nenhum pacote npm publicado. `package.json` existe apenas
  para reservar a identidade `@noos/axon@0.1.0` e declarar `private: true`.
- **Nome npm:** o nome plano `axon` está tomado por terceiros (v2.0.3, verificado
  no registry em out/2026). Publicação futura **exige** o escopo `@noos/axon`.
- **Nenhum app publicou ID pública ainda.** As regras existem; a primeira
  emissão real (Synapse ou Ranvier) acontece quando cada app adotar a fatia F1.
  Até lá, todo `RAN-*`/`SYN-*` em exemplo é ilustrativo.
- **Nenhum manifesto ingerido ainda.** O hub (noos.study, estático na Fase 1)
  ainda não tem o passo de ingestão — as discussões por questão são entrega da
  Fase 2 e a página `/q/{ID}` ainda não renderiza.

## Consumidores atuais

- **Hub (noos-hub):** consome o contrato como referência (a seção Arquitetura
  da página da família cita IDs `SYN-`/`RAN-`); a ingestão de manifestos é
  especificação futura do lado do hub.
- **Apps (Synapse, Ranvier):** ainda não consomem o pacote (não há pacote).
  A adoção é decisão e cronograma de cada app — o contrato foi desenhado para
  adoção incremental, sem big-bang.

## Limitações conhecidas

- O contrato ainda não tem suite de conformidade (validador de manifesto
  publicado como CI reutilizável). Candidato natural à F1.5 — ver `plan.md`.
- O exemplo de `checksum` é ilustrativo; o algoritmo exato de canonicalização
  do conteúdo (o que entra na soma) será travado na `spec-schema.md` na
  revisão de implementação, antes da primeira emissão real de ID.
