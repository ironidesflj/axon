# Memória do projeto — Axon (`@ironidesflj/axon`)

**Atualizado:** 2026-11-06 · **base:** `main` @ 6c0dd72
**O que é:** a biblioteca compartilhada do ecossistema Noos — IDs públicas,
schema do `manifest.jsonl` (9 campos), deep-link canônico e checksum. Pacote
linkado no build de cada consumidor: **nunca serviço, nunca runtime central**.
Não repete o que já está em `current-state.md`, `plan.md`, `constitution.md` e
`CHANGELOG.md` — referencia.

## Estado verificado (2026-11-06, por comando)

- Versão **0.2.2** (`package.json`, `CHANGELOG.md`); `npm view` → `latest`
  também **0.2.2** (o pacote está público desde out/2026).
- F1 em `src/` (TypeScript ESM, zero dependência de runtime, Node ≥ 20):
  `id-generator.ts`, `schema.ts`, `checksum.ts` + `sha256.ts`, `deep-link.ts`,
  `index.ts` — inventário em `current-state.md`.
- **44/44 testes de contrato verdes:** `npm test` (tsc → `node --test
  dist/tests/contract/*.test.js`) → 44 pass, 0 fail. Fixtures em
  `tests/contract/fixtures/`.
- **Assinatura real (fonte da verdade = código + testes):**
  `verifyChecksum(record)` recebe o **record inteiro** (`{ checksum, snapshot }`)
  e recomputa sobre `record.snapshot` — não é `(snapshot, checksum)`. Ver
  `src/checksum.ts:38` e `tests/contract/schema.test.ts:35-45`.
  `docs/guia-de-adocao.md` foi corrigido nesta passada (2 exemplos).
- Algoritmo travado: `sha256:` + SHA-256 do JSON canônico de
  `[statement, options, answer, reference]` (`spec-schema.md`).
- Consumidores: **Ranvier** (fatia 1, pin exato) e **Hub** (devDependency de
  build; gera 731 páginas `/q/{ID}` de RAN+SYN).

## Regras que não se quebram (`constitution.md`)

- ID `{PREFIXO}-{PROVA}-{SEQUENCIAL}`, imutável após publicar; **alias é
  eterno** (`GLI-`→`RAN-`); prefixo = marca pública do app; sequencial sem
  reciclagem (epitáfio, nunca reuso); só o app dono emite o namespace — o Axon
  valida e gera, **nunca emite**.
- Nenhuma mudança invalida retroativamente ID ou deep-link já publicados;
  mudança de formato/checksum é **MAJOR com aviso de 90 dias**.
- Ingestão: linha inválida é rejeitada com log e o build segue; o hub nunca
  corrige a origem; nada privado de estudo atravessa.
- Deep-link `https://noos.study/{pt|en}/q/{ID}` com fallback
  `noos-hub.vercel.app`; link, não dependência.
- Sem tela, cor, logo, dado de estudo; SM-2 fica fora até doer em dois apps.

## Dívidas abertas

- **F1.5 — suite de conformidade:** ação de CI reutilizável que valida um
  `manifest.jsonl` externo (`parseManifest` + `verifyChecksum(record)`);
  especificada em `plan.md`, não empacotada.
- **Docs defasados fora do escopo desta passada (verificado, não corrigido):**
  `current-state.md` ("npm publicado 0.2.1", "nenhuma ID pública real emitida e
  nenhum manifesto publicado" — falso: o hub publica 731 páginas de RAN+SYN) e
  `README.md` ("Estado atual — v0.2.1").
- **`docs/guia-de-adocao.md`, fatia 5:** ainda diz que a página `/q/{ID}` não
  existe; o hub já serve 731 páginas. Corrigir na próxima passada.
- Transporte automático dos manifestos (app → hub) é entrega do hub
  (`plan.md` do hub, F2 item 2) — o Axon não é runtime.
- Evidência de browser: suíte roda em Node (oráculo `node:crypto`); isomorfismo
  é por construção, prova fica com o primeiro app consumidor.

## Próximo passo

1. F1.5 — empacotar a ação de CI de conformidade (reusa F1; decidir
   reject × warn no lado do hub).
2. Alinhar `current-state.md`/`README.md` ao estado real (0.2.2 no npm, hub
   publicado) antes de qualquer bump.
3. Antes de editar doc de API: confirmar assinatura em `src/` **e**
   `tests/contract/` — o código publicado é a fonte, não o guia.

- **2026-11-09:** v0.3.0 em PR (`feat/epitaph-retired`): campo opcional `retired` + `isRetired()` (política epitáfio aprovada em MINOR com aviso). Publicação no npm pendente do mantenedor (2FA); depois hub/apps sobem o pin.
