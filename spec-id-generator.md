# spec-id-generator

Especificação da fatia F1 · estado: **especificada, aguardando implementação**

## Problema

Cada app que precisar emitir ID pública faria o seu gerador — e geradores
separados divergem: formato aceito diferente, sequencial reiniciado, alias
tratado de um jeito. A primeira divergência quebra o hub na ponta de leitura.
O contrato (`constitution.md` §1) existe; falta o instrumento comum que
torna a divergência impossível por preguiça: **mais fácil usar o Axon do que
errar sozinho**.

## Contrato

```ts
// Gera a próxima ID de uma prova, dado o maior sequencial já emitido.
// Nunca consulta rede, nunca consulta o hub, nunca emite por conta própria:
// o chamador (o app) é quem decide publicar.
generateId(prefix: Namespace, exam: string, lastIssued: number): string
// -> "RAN-AZ900-00043"

// Valida formato: PREFIXO-{PROVA}-{SEQ 5 dígitos}.
// Prefixo precisa estar no registro (SYN/RAN/MYE/THA/ENG) — os previstos
// (MYE/THA/ENG) validam formato, mas o app só emite depois do batismo
// (registro da marca-mãe). 
validateId(id: string): { ok: true; parsed: { prefix, exam, seq } } | { ok: false; reason }

// Monta e lê alias: a tabela GLI- -> RAN- vive no app emissor (é dado dele);
// o helper só normaliza o formato do par.
aliasOf(legacyId: string, officialId: string): { alias, canonical }
```

Regras embutidas (da constitution §1): prefixo de 3 letras maiúsculas do
registro; código de prova alfanumérico sem traços; sequencial 5 dígitos com
zero à esquerda, começando em `00001`; `lastIssued` é responsabilidade do
chamador (o Axon não guarda estado entre chamadas — sem serviço, sem banco).

## Aceitação (evidência de conclusão)

- Testes de unidade: gera `00001` no primeiro caso; valida o exemplo canônico
  `RAN-AZ900-00042`; rejeita prefixo fora do registro, sequencial com 4
  dígitos, prova com espaço e minúsculas em prefixo.
- Zero dependência externa no runtime; roda em browser e Node.
- Documentação do pacote mostra o exemplo canônico gerado por código real
  (não string fixa).

## Efeito no manifesto

O campo `id` e o array `aliases` de toda linha nascem deste gerador. Sem ele,
não há manifesto válido.

## Efeito no hub

Nenhum em runtime (o hub valida com o mesmo código na ingestão — ver
`spec-schema.md`). O hub nunca gera ID.

## Efeito no Axon

É a primeira parte da fatia F1; `spec-schema.md` e `spec-deep-link.md`
dependem das suas saídas. Publicação junto no mesmo pacote `@noos/axon`.

## Fora de escopo

Unicidade entre provas (cada prova tem seu sequencial); emissão automática;
qualquer rede ou persistência.
