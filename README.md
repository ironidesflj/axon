# Axon — a biblioteca compartilhada do ecossistema Noos

O Axon é o que os cinco apps (Synapse, Ranvier, Myelin, Theta, Engram) e o hub
compartilham: **IDs públicas, schema de questões (manifest.jsonl) e deep-link
canônico** — o contrato técnico que faz o ecossistema ser um sistema. (SM-2
fica de fora por decisão deliberada — ver `plan.md`: só sobe pro Axon quando
doer em dois apps.)

**O que o Axon NÃO é** (regra dos três guias, travada):

- não é um sexto app — não tem cor, não tem logo de produto, não tem tela própria;
- não é um serviço — nunca há runtime central; o Axon é **biblioteca linkada no build**;
- não é uma pasta compartilhada por acidente — entra em cada repositório como
  **versão fixada (pin exato)**, com lockfile e a versão registrada no
  `current-state.md` de quem consome.

> Se uma decisão vale para os cinco apps, ela pertence ao Axon.
> Se vale para um só, fica no app.

## Estado atual — v0.2.1 (F1 implementada)

A fatia mínima saiu do papel: **código TypeScript, zero dependência de
runtime, suíte de contrato 44/44 verde**. O contrato continua na
[`constitution.md`](constitution.md) (inalterada — a lei não muda com a
implementação); as decisões da revisão de implementação estão travadas nas
specs ([`spec-schema.md`](spec-schema.md) — algoritmo de checksum incluso).

Publicado no npm desde out/2026 como **`@ironidesflj/axon`** — o nome plano
`axon` e o escopo `@noos` pertencem a terceiros. O pacote é público e deve
ser consumido com pin exato.

```ts
import { generateId, validateId, parseManifest, canonicalUrl, computeChecksum } from './src/index.js';

validateId('RAN-AZ900-00042');        // { ok: true, parsed: { prefix: 'RAN', exam: 'AZ900', seq: 42 } }
generateId('RAN', 'az-900', 41);      // "RAN-AZ900-00042" — o exemplo canônico, por código real
canonicalUrl('RAN-AZ900-00042', 'pt'); // "https://noos.study/pt/q/RAN-AZ900-00042"
parseManifest(texto);                 // { ok: [...], rejected: [{ lineNumber, reason, raw }] }
computeChecksum(snapshot);            // "sha256:<64 hex>"
```

A suíte de contrato roda com `npm test` (Node ≥ 20) e é barreira de
publicação: `prepublishOnly` a executa antes de qualquer publish.

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

- **O caminho completo:** [`docs/guia-de-adocao.md`](docs/guia-de-adocao.md)
  — as cinco fatias da adoção, com aceitação por fatia.
- **Principal:** `npm install @ironidesflj/axon@0.2.2` com **pin exato sem
  `^`**, lockfile commitado e versão anotada no `current-state.md` do
  consumidor.
- **Alternativo:** dependência Git pela tag, quando o consumidor precisar
  acompanhar o repositório diretamente. MAJOR do pacote nunca quebra
  contrato de ID publicada — IDs são para sempre.

## Arquivos canônicos (SDD)

| Arquivo | Responsabilidade |
|---|---|
| `README.md` | este arquivo — organização e registro ativo |
| [`constitution.md`](constitution.md) | **o contrato** — regras permanentes de ID, manifesto e deep-link |
| [`current-state.md`](current-state.md) | estado verificado, versões e limitações |
| [`plan.md`](plan.md) | feito, autorizado, pendente, adiado e fora de escopo |
| `src/` | a implementação F1 (id-generator, schema, deep-link, checksum) |
| `tests/contract/` | **a prova** — suíte que verifica a constitution, caso a caso |
| `spec-*.md` | problema e contrato de cada mudança, com aceitação |
| [`spec-contract-tests.md`](spec-contract-tests.md) | a spec da suíte acima (casos mínimos, fixtures, barreira) |

## Licença

Código MIT · conteúdo do contrato CC BY-SA 4.0 — ver [`LICENSE.md`](LICENSE.md).
O nome **Noos** e seus símbolos são marca; a licença não cobre trademark
(registro INPI, ver Manual de Identidade §11).
