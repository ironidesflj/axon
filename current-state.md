# current-state — Axon

Última verificação: out/2026 · versão 0.2.0

## O que existe e está verificado

- **`constitution.md` v0.1.0** — o contrato completo, **inalterado** (a lei
  não muda com a implementação): formato de ID pública com as 4 regras, os 9
  campos do `manifest.jsonl`, deep-link canônico com fallback, regras da
  biblioteca, idioma e precedência entre documentos.
- **F1 implementada** (`src/`, TypeScript ESM, zero dependência de runtime,
  Node ≥ 20 e browser):
  - `id-generator.ts` — `generateId` (normaliza a prova), `validateId`
    (estrito), `validateAliasId` (aceita `GLI-`), `aliasOf`, `MAX_SEQ`
  - `schema.ts` — `parseQuestionLine` (lança `LineError`), `parseManifest`
    (linha inválida rejeitada com log; id duplicada rejeita a segunda e
    reporta ambas; linha em branco pulada; campos extras tolerados)
  - `deep-link.ts` — `canonicalUrl`, `fallbackUrl`, `resolveAlias`
  - `checksum.ts` + `sha256.ts` — `computeChecksum`, `verifyChecksum`
    (SHA-256 puro FIPS 180-4, isomórfico)
- **Algoritmo de checksum travado** (pendência da spec-schema encerrada na
  revisão de implementação): `sha256:` + hex do SHA-256 sobre o JSON canônico
  de `[statement, options, answer, reference]` — detalhe e justificativas na
  `spec-schema.md`.
- **Suíte de contrato verde: 44/44 casos citáveis** (`tests/contract/`,
  `npm test`): golden `ids.golden.json` (7 válidas + 10 inválidas + fronteira
  de alias), `manifest.good/dirty.jsonl` (o exemplo da constitution com soma
  real; 8 defeitos, 1 por linha), `links.golden.json` (as 4 URLs byte a
  byte), oráculo `node:crypto` em 200 entradas determinísticas, auditoria de
  rede varrendo o `dist/src` que embarca no pacote, barreira
  `prepublishOnly`.
- **CI** (`.github/workflows/ci.yml`): `npm ci` + suíte em todo push/PR.
- `package-lock.json` commitado — pin exato por construção (§4).
- Registro de prefixos espelhado em código (`REGISTRY_PREFIXES`,
  `ALIAS_PREFIXES = { GLI: 'RAN' }`); a fonte única continua sendo o
  `noos.registry.json` do hub — mudança de prefixo é RFC + bump semver.

## O que NÃO existe (e não fingir que existe)

- **npm ainda não publicado.** O pacote segue `private: true` — publicar sem
  consumidor é promessa vazia (gatilho no `plan.md`: falta o primeiro app
  disposto a adotar). Quando chegar: org `@noos`, `private: false` +
  `publishConfig` `access: public`, publish `0.2.0` — a suíte roda sozinha
  no `prepublishOnly`.
- **Nenhum consumidor real.** Nenhum app linkou o pacote; nenhuma ID pública
  real emitida; nenhum manifesto ingerido. Todo ID em fixtures e exemplos é
  ilustrativo (constitution §1).
- A página `/q/{ID}` e a ingestão do hub continuam entrega da Fase 2; a
  ação de CI reutilizável (F1.5) está especificada, não empacotada.

## Consumidores atuais

- Nenhum. Hub e apps referenciam o contrato; a adoção é decisão e cronograma
  de cada um — o contrato foi desenhado para adoção incremental, sem
  big-bang (cada parte entra sozinha, atrás de feature flag).

## Limitações conhecidas

- A suíte roda em Node (o oráculo `node:crypto` é do lado do teste); o
  runtime da biblioteca é isomórfico por construção (sem import `node:` em
  `src/`), mas a evidência automatizada cobre o lado Node — evidência de
  browser fica para o primeiro app consumidor.
- `difficulty` é vocabulário livre do app emissor (métrica agregada, nunca
  individual) — sem normalização no Axon, por decisão da constitution §2.
- O teste de rede varre padrões conhecidos (`fetch(`, `XMLHttpRequest`,
  imports `node:` de rede/sistema) — é auditoria de contrato, não prova
  formal de ausência de efeitos.
