# spec-contract-tests

Especificação da fatia F1 · estado: **especificada, aguardando implementação**

## Problema

A `constitution.md` é lei, mas hoje nada a verifica mecanicamente. Quando a
F1 virar código e o pacote `@noos/axon` for publicado, "o código cumpre o
contrato" vira afirmação de quem escreveu — e a promessa semver do npm
transforma divergência silenciosa em dívida de todos os consumidores ao mesmo
tempo. Teste de unidade comum testa implementação; o que falta é **teste de
contrato**: um conjunto fixo, versionado e citável que prova que o pacote
cumpre a constitution regra por regra — e que quebra **alto** (no CI, antes do
publish) quando alguém a violar. O mesmo princípio do projeto: documento diz,
código cumpre, máquina verifica.

## Contrato

A suíte mora no próprio pacote (`tests/contract/`), roda com `npm test`, entra
no CI do repositório e é **barreira de publicação**: o release da F1 exige a
suíte 100% verde. Cada caso cita a regra da constitution que protege
(`§1.R2`, `§2.ingestão`, `§4.pin`…) — mudança de contrato força mudança de
teste, e o par aparece junto no review e no `CHANGELOG.md`.

### Fixtures — a tabela de verdade do contrato

`tests/contract/fixtures/`:

- `ids.golden.json` — IDs válidas e inválidas com motivo (inclui o exemplo
  canônico `RAN-AZ900-00042` e o alias histórico `GLI-AZ900-00012`);
- `manifest.good.jsonl` — o exemplo da constitution §2, linha a linha;
- `manifest.dirty.jsonl` — uma linha por tipo de defeito (JSON quebrado,
  campo ausente, tipo errado, `id` duplicada, `id` inválida);
- `links.golden.json` — as 4 URLs canônicas (pt/en × noos.study/fallback).

Fixtures são **dado de contrato, não dado de teste**: o vetor de IDs
históricas só cresce (epitáfio, nunca apagamento — constitution §6); remover
caso do golden depois do primeiro publish é MAJOR com aviso de 90 dias.

### Casos mínimos, por regra da constitution

| Grupo | O que o caso prova | Regra |
|---|---|---|
| ID · formato | `RAN-AZ900-00042` parseia; `00001` inicial; rejeita 4 dígitos, minúscula no prefixo, prefixo fora do registro, prova com espaço — sempre com `{ok:false, reason}` | §1 formato, R3 |
| ID · sequência | `generateId(lastIssued=42)` → `00043`; helper é puro (estado é do chamador) | §1 R4 |
| ID · alias | `aliasOf("GLI-…","RAN-…")` devolve o par; `generateId` nunca emite alias | §1 R2 |
| Manifesto · campos | 9 campos presentes e tipados; `topics ≥ 1`; `version ≥ 1`; `lang` BCP-47; `checksum` `sha256:<hex>` | §2 |
| Manifesto · ingestão | `manifest.dirty.jsonl` → cada defeito vira 1 `Rejection` com `lineNumber` e `reason`, as demais linhas seguem; `manifest.good.jsonl` → zero rejections; `id` duplicada rejeita a segunda e reporta ambas | §2 ingestão |
| Deep-link | as 4 URLs do golden saem byte a byte; `resolveAlias` devolve o canônico | §3 |
| Biblioteca | zero chamada de rede em `dist/` (auditoria automatizada); import puro, sem `postinstall`, sem binário; roda em Node e browser | §4 |
| Imutabilidade | o vetor `ids.golden.json` inteiro valida — em qualquer versão, MAJOR incluso | §4 MAJOR |

Nomes de caso são citáveis: `§1-R2 alias é eterno`, `§2-ingestão linha suja
não derruba as limpas`. O nome é a rastreabilidade.

### Regra de barreira

- CI roda a suíte em todo push e PR; job de release só existe depois de verde.
- `prepublishOnly` roda a suíte de novo — o hook protege contra publish manual
  com pressa.
- Cobertura percentual **não** é gate; o gate é a tabela acima 100% mapeada.

## Aceitação (evidência de conclusão)

- [ ] `npm test` executa a suíte e cada caso referencia a regra da constitution.
- [ ] Fixtures golden versionadas; remoção de ID histórica falha o CI.
- [ ] Um defeito injetado em `manifest.dirty.jsonl` derruba exatamente 1 caso.
- [ ] Auditoria de rede/efeitos colaterais automatizada (varredura de `dist/`
      + teste de pureza de import).
- [ ] A tabela de casos mínimos 100% mapeada em testes com nome citável.

## Efeito no manifesto

Nenhum direto; as fixtures `manifest.*.jsonl` servem de referência para os
apps montarem seus primeiros manifestos reais.

## Efeito no hub

A mesma suíte é candidata a rodar no build do hub na F1.5 (suite de
conformidade do `plan.md`) — uma verdade, dois lados, como manda a
`spec-schema.md`.

## Efeito no Axon

Define a barreira de publicação npm da F1 (gatilho já registrado no
`plan.md`: código pronto + primeiro consumidor). Fecha o ciclo SDD do
repositório: constitution (lei) → specs (como cumprir) → testes de contrato
(como provar).

## Fora de escopo

Benchmark de performance; fuzzing de propriedades; testes dos apps
consumidores; cobertura percentual como gate; qualquer caso que exija rede
ou tempo real.
