# spec-deep-link

Especificação da fatia F1 · estado: **implementada na v0.2.0** (`src/deep-link.ts`, suíte em `tests/contract/deep-link.test.ts`)

## Problema

Toda questão publicada precisa apontar para onde sua discussão vai nascer no
hub — e o endereço tem que ser **o mesmo para sempre**, porque o ID circula
em fóruns, mensagens e buscadores fora do alcance do app. Deep-link montado
à mão em cada app diverge (domínio de um lado, idioma de outro, alias
esquecido), e link quebrado em ID publicada é violação direta do contrato.

## Contrato

```ts
// Monta o deep-link canônico da questão.
canonicalUrl(id: string, lang: 'pt' | 'en'): string
// -> "https://noos.study/pt/q/RAN-AZ900-00042"

// Fallback canônico — embutido no badge "by Noos" e em qualquer lugar onde
// o domínio próprio não possa ser assumido (plano B do domínio, Carta cap. 12).
fallbackUrl(id: string, lang: 'pt' | 'en'): string
// -> "https://noos-hub.vercel.app/pt/q/RAN-AZ900-00042"

// Resolve o destino de uma ID legada (alias GLI-): o app emissor passa a
// tabela que já mantém; o helper devolve o canônico da oficial.
resolveAlias(aliasId: string, table: Record<string, string>): string
```

Regras embutidas (constitution §3): o idioma do segmento é o da **página de
origem do clique**, não o da questão; alias redireciona 301 para o canônico —
o helper só monta o destino, o redirect é rota do hub, não do app; badge e
deep-link são **links, não dependências** — nada de `fetch` para o hub em
runtime, nada de telemetry, nada de "só funciona online".

## Aceitação (evidência de conclusão)

- ✅ Testes de unidade: as duas URLs do exemplo canônico
  (`noos.study` e `noos-hub.vercel.app`, pt e en) saem byte a byte como na
  constitution — golden `links.golden.json`.
- ✅ `resolveAlias("GLI-AZ900-00012", {"GLI-AZ900-00012": "RAN-AZ900-00042"})`
  devolve `RAN-AZ900-00042`.
- ✅ Auditoria de dependências: zero chamada de rede no código — a suíte
  varre o `dist/src` que embarca no pacote (`library.test.ts`, §4).

## Travado na revisão de implementação (v0.2.0)

- **`resolveAlias` devolve a ID oficial** (não a URL — o idioma do segmento
  é decisão do clique, não da tabela): `canonicalUrl(resolveAlias(alias, tabela), lang)`
  é o caminho completo.
- **Idempotente:** ID já oficial devolve ela mesma (badge recebe qualquer
  forma).
- **Alias fora da tabela lança** — a tabela é dado do app emissor; o Axon
  não a guarda (spec-id-generator, regra 3).
- **id inválida lança** em `canonicalUrl`/`fallbackUrl`: link quebrado em
  ID publicada é violação direta do contrato (§3) — falha alto, falha cedo.

## Efeito no manifesto

Indireto: a página `/q/{ID}` que o deep-link abre é construída pelo hub a
partir do snapshot do manifesto. O link nasce aqui; o conteúdo, do manifesto.

## Efeito no hub

O hub é dono da rota `/q/{ID}` (ainda não existe na Fase 1 — entrega da
Fase 2) e das regras de redirect de alias (301, nunca 404 em ID publicada).

## Efeito no Axon

Terceira e última parte da fatia F1; depende de `spec-id-generator` para
validar o ID antes de montar a URL.

## Fora de escopo

Encurtador, parâmetros de campanha, rastreio de clique, e qualquer coisa
que faça o link depender de estado ou de rede no momento da geração.
