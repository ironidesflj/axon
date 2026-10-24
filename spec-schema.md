# spec-schema

Especificação da fatia F1 · estado: **implementada na v0.2.0** (`src/schema.ts` + `src/checksum.ts`, suíte em `tests/contract/schema.test.ts` e `checksum.test.ts`)

## Problema

O hub ingere `manifest.jsonl` de bancos que não controla — um arquivo por
app, uma linha por questão. Sem um schema único e um validador comum, cada
app entende o contrato do seu jeito ("`difficulty` é 1–5 ou 'média'?",
"`topics` é string ou array?"), e a divergência aparece tarde: na ingestão,
quebrando a página de discussão de um app inteiro. O problema é a leitura
do hub, não a escrita do app.

## Contrato

```ts
// O schema dos 9 campos (constitution.md §2), como validação e tipos:
parseQuestionLine(line: string): QuestionRecord        // lança LineError
parseManifest(text: string): { ok: QuestionRecord[]; rejected: Rejection[] }
// Rejection = { lineNumber, reason, raw } — NUNCA interrompe as demais linhas.

interface QuestionRecord {
  id: string                    // validado por spec-id-generator.validateId
  exam: string                  // "AZ-900", "CTFL"…
  topics: string[]              // ≥ 1
  difficulty: string            // vocabulário do app emissor (agregado, nunca individual)
  lang: string                  // BCP-47: "pt-BR", "en"
  version: number               // inteiro ≥ 1
  checksum: string              // "sha256:<hex>" — ver Pendência abaixo
  aliases: string[]             // pode ser vazio
  snapshot: {
    statement: string           // enunciado
    options: string[]           // alternativas
    answer: string              // gabarito
    reference: string           // referência oficial
  }
}
```

Regras embutidas: uma linha = um JSON válido (UTF-8); campo ausente ou de
tipo errado rejeita **a linha**, com motivo legível no `Rejection` — nunca o
arquivo; `id` duplicada no mesmo arquivo rejeita a segunda ocorrência e
reporta ambas.

## Aceitação (evidência de conclusão)

- ✅ Fixture com o exemplo canônico da constitution parseia limpo
  (`manifest.good.jsonl` — com o checksum real completando a elipse
  editorial `"9f2c…"` do documento).
- ✅ Fixture com uma linha por tipo de defeito (`manifest.dirty.jsonl`:
  1 válida + 8 defeitos) devolve 1 ok + 8 rejections com número de linha e
  motivo — incluindo JSON quebrado e campo ausente, como exigido.
- ✅ O mesmo código roda no CI do app (que publica) e no build do hub (que
  ingere) — uma verdade, dois lados.

## Pendência RESOLVIDA na v0.2.0 (revisão de implementação)

O algoritmo de `checksum` está travado:

```
checksum = "sha256:" + hex(SHA-256(UTF-8(JSON.stringify(
    [statement, options, answer, reference]))))
```

Decisões que fecham a pendência ("o que entra na soma"):

- **Só o `snapshot` entra** — os 4 campos na ordem fixa statement, options,
  answer, reference. Metadata (`id`, `exam`, `topics`, `difficulty`, `lang`,
  `version`, `aliases`) fica fora: reclassificar tópico ou dificuldade não
  invalida a soma do conteúdo.
- **`options` entra como array** (JSON aninhado), nunca concatenado —
  `["A","B"]` e `["A|B"]` produzem somas diferentes por construção.
- **`version` NÃO entra** (bookkeeping ≠ conteúdo).
- **`JSON.stringify` do array de 4 elementos** — determinístico em qualquer
  engine desde ES2019 (well-formed stringify; lone surrogates escapados).
- **Formato do campo:** `sha256:` + 64 hex **minúsculo**.
- **`parse` valida formato; `verifyChecksum` valida conteúdo** — quem
  publica (app) e quem ingere (hub) chamam à parte.
- **Implementação pura** (FIPS 180-4, `src/sha256.ts`), auditada pela
  suíte contra o oráculo `node:crypto` em 200 entradas determinísticas.

Mudar qualquer decisão acima DEPOIS da primeira ID real emitida = MAJOR
com aviso de 90 dias (constitution §6).

## Travado na revisão de implementação (v0.2.0)

- **`exam` ↔ id:** o campo `exam` (forma humana, "AZ-900") deve corresponder
  ao código da prova embutido na `id` ("AZ900", normalizado sem traços) —
  manifesto que arquivaria a questão na certificação errada é rejeitado.
- **`snapshot.options` ≥ 2** alternativas não vazias; `statement` e `answer`
  não vazios; `reference` aceita vazia.
- **Campos extras** na linha: tolerados na leitura, não repassados no
  record (forward compat de leitura, sem promessa de escrita).
- **Linha em branco** é pulada, não rejeitada (arquivos de CI geram
  trailing newline). **`difficulty` é vocabulário livre** do app emissor
  (métrica agregada, nunca individual — constitution §2).

## Efeito no manifesto

Este spec **é** a metade de leitura do contrato de manifesto; a metade de
escrita é o CI de cada app, que usa `parseManifest` como gate antes de
publicar o arquivo.

## Efeito no hub

A ingestão do hub chama `parseManifest` e segue o build com os `ok`,
registrando os `rejected` no log — regra da constitution §2 (linha inválida
rejeitada com log; último build bom segue servindo).

## Efeito no Axon

Segunda parte da fatia F1; depende de `spec-id-generator` para validar o
campo `id`.

## Fora de escopo

Corrigir, reescrever ou normalizar linhas inválidas (o hub nunca corrige o
arquivo de origem); qualquer persistência; qualquer rede.
