# spec-schema

Especificação da fatia F1 · estado: **especificada, aguardando implementação**

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

- Fixture com o exemplo canônico da constitution parseia limpo.
- Fixture com 3 linhas (1 válida, 1 com JSON quebrado, 1 sem `checksum`)
  devolve 1 ok + 2 rejections com número de linha e motivo.
- O mesmo código roda no CI do app (que publica) e no build do hub (que
  ingere) — uma verdade, dois lados.

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

## Pendência travada aqui

O **algoritmo exato do `checksum`** (o que entra na soma: qual ordem de
campos, normalização de whitespace, versão incluída ou não) fica congelado
neste spec na revisão de implementação — **antes** da primeira ID real
emitida por qualquer app. Depois da primeira publicação, mudar a soma é
MAJOR com aviso de 90 dias.
