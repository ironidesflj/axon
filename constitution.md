# constitution — o contrato do Axon

Versão 0.1.0 · out/2026 · documento permanente

Este é o contrato técnico do ecossistema Noos. Ele define o que os cinco apps
(Synapse, Ranvier, Myelin, Theta, Engram) e o hub (noos.study) compartilham:
a **identidade pública da questão** (ID), o **contrato de manifesto**
(`manifest.jsonl`) e o **deep-link canônico**. Nada aqui é implementação —
é lei. Implementações (a fatia F1 do pacote `@ironidesflj/axon`) cumprem este
documento, nunca o contrário.

**Precedência entre documentos** (declarada também nos guias):

1. **Manual de identidade v1.0** — vence na **marca**;
2. **Guia de aplicação nos apps** — vence na **interface dos apps**;
3. **Guia de atualização da marca-mãe** — vence na **governança do Noos**;
4. **Esta constitution** — vence em **tudo que os cinco compartilham**:
   ID, manifesto, deep-link e o comportamento da biblioteca.

Em conflito, a camada mais específica do assunto vence — e o conflito é
resolvido por RFC, não por silêncio.

---

## 1. A ID pública de questão

**Formato:** `{PREFIXO}-{PROVA}-{SEQUENCIAL}` — exemplo canônico:
`RAN-AZ900-00042`.

- **PREFIXO** — 3 letras, a marca pública do app emissor (`SYN`, `RAN`, `MYE`,
  `THA`, `ENG`). Reservado no batismo, publicado no registro
  (`noos.registry.json` do hub), nunca reciclado.
- **PROVA** — código da prova sem traços nem espaços (`AZ900`, `CTFL`,
  `CTALTA`…). Estrutura a navegação por certificação no hub.
- **SEQUENCIAL** — 5 dígitos, por prova, sem reciclagem, começando em `00001`.

O ID é **imutável após a publicação**. É ele que liga a questão no app à sua
página de discussão no hub, para sempre, através do deep-link. É público
porque circula onde o app não controla: visto por usuários, citado em fóruns,
indexado por buscadores.

### As quatro regras

| # | Regra | Por quê |
|---|---|---|
| 1 | **O prefixo é a marca pública do app** | O ID circula fora do app; marca pública em vez de codinome interno é o que o torna legível e citável no mundo |
| 2 | **Alias é eterno** | ID publicada não se renomeia. Emitida sob codinome (`GLI-`), permanece válida para sempre e o hub aprende o mapeamento; as novas nascem no prefixo oficial |
| 3 | **Cada app é dono do seu namespace** | Só o Ranvier emite `RAN-*`; só o Synapse emite `SYN-*`. Sem serviço central emissor, sem colisão entre irmãos por construção. O Axon valida formato e unicidade dentro do namespace — **nunca emite** |
| 4 | **Sequencial sem reciclagem** | Questão removida vira epitáfio (o ID passa a responder "removida"), nunca reuso. Correção de digitação mantém o ID; reescrita que muda o que a questão pede gera ID nova com ponteiro "substitui" |

> **ID publicada não se renomeia.** Esta frase resume as quatro regras.

Na interface, o ID aparece onde se cita: no rodapé da questão, em corpo mono e
discreto; na URL da discussão; no texto que um aluno copia para compartilhar.

---

## 2. O contrato de manifesto — `manifest.jsonl`

Os bancos de questões vivem em repositórios diferentes — cada app é dono do
seu. O hub precisa renderizar uma página por questão para acervos que não
controla. A resposta não é integrar repositórios: é padronizar um **contrato
de manifesto estático**.

Cada banco, onde quer que more, publica via CI (GitHub Actions) um arquivo
`manifest.jsonl`: **uma linha por questão, JSON válido por linha, UTF-8**. O
hub ingere esses manifestos no build agendado (diário ou por deploy hook
disparado pelo CI do banco).

### Os nove campos

| Campo | Conteúdo | Nota |
|---|---|---|
| `id` | A ID pública estável (`RAN-AZ900-00042`) | Chave de tudo: é nela que a discussão ancora |
| `exam` | Código da prova (`AZ-900`) | Estrutura a navegação por certificação no hub |
| `topics` | Lista de tópicos da questão | Alimenta busca, filtros e estatísticas por tópico |
| `difficulty` | Dificuldade declarada | Métrica agregada, nunca individual |
| `lang` | Idioma da questão (`pt-BR`, `en`) | O hub renderiza a página no idioma certo |
| `version` | Versão da questão (inteiro, incrementa a cada edição) | Detecta divergência entre manifesto e app |
| `checksum` | Soma de verificação do conteúdo (`sha256:…`) | Detecta divergência entre manifesto e app |
| `aliases` | IDs equivalentes já publicadas (`GLI-…`) | Onde o hub aprende o mapeamento do codinome |
| `snapshot` | Enunciado, alternativas, gabarito e referência oficial | O hub nunca consulta o app em runtime: serve o snapshot |

### Linha de exemplo

```json
{"id":"RAN-AZ900-00042", "exam":"AZ-900", "lang":"pt-BR",
 "topics":["seguranca","identidade"], "difficulty":"media",
 "version":3, "checksum":"sha256:9f2c...",
 "aliases":["GLI-AZ900-00012"],
 "snapshot":{"statement":"Qual servico do Azure gerencia...",
   "options":["A","B","C","D"], "answer":"B",
   "reference":"learn.microsoft.com/azure/security/fundamentals"}}
```

### Regras de ingestão (lado do hub)

- **Linha inválida é rejeitada com log — a ingestão segue.** Uma linha ruim
  nunca derruba o build do hub nem a publicação das demais questões.
- O hub **nunca corrige** o arquivo de origem; o log aponta a linha e o motivo,
  e a correção é do app dono do banco.
- Se o banco muda de repositório, muda uma URL no CI do hub. Se o banco fica
  offline, o hub **serve o último manifesto ingerido** e as discussões
  continuam de pé.

### Propriedade

> **O app é dono das questões e do progresso; o hub é dono das discussões.**

O ID público é a única costura entre os dois mundos — e é justamente por ser
a única que pode ser imutável. Nada do que é privado de estudo (histórico,
decks, estatísticas, respostas dadas) passa pelo hub.

---

## 3. O deep-link canônico

```
https://noos.study/{pt|en}/q/{ID}
```

Fallback canônico (gratuito, embutido no badge, enquanto o domínio próprio
existir como canônico):

```
https://noos-hub.vercel.app/{pt|en}/q/{ID}
```

Regras:

- **Alias eterno:** deep-link de ID antiga (`GLI-…`) redireciona **301** para o
  canônico — nunca 404 em ID já publicada.
- **Link, não dependência:** badge e deep-link são links; o app **nunca
  consulta o hub em runtime**. O hub fora do ar não derruba o estudo; o app
  fora do ar não afeta o hub (que serve o último manifesto).
- O idioma do segmento (`pt`/`en`) segue o idioma da página de origem do
  clique, não o da questão.

---

## 4. Regras da biblioteca

- O Axon é **pacote TypeScript versionado com semver**, linkado no build de
  cada consumidor — **nunca um serviço**, nunca um runtime central.
- Nome público: **`@ironidesflj/axon`** (o nome plano `axon` e o escopo
  `@noos` estão tomados no npm por terceiros).
- **Pin exato, sem `^`**: lockfile commitado; a versão em uso é registrada no
  `current-state.md` de quem consome.
- **Fatia mínima (F1):** gerador de IDs, schema de questões, helper de
  deep-link. Nada de big-bang: o app em produção adota por partes, cada parte
  entra sozinha, atrás de feature flag.
- **MAJOR do pacote nunca quebra contrato de ID publicada.** IDs, aliases e
  deep-links são para sempre; breaking change de pacote é breaking change de
  API de código, não do contrato público.
- O banco de questões **não migra de repositório** por causa do Axon. Quando
  carregar o banco junto com o código do app doer, o banco ganha repositório
  próprio — o contrato torna a localização irrelevante.

---

## 5. Idioma

Interface no **idioma do dispositivo, com fallback EN**. Conteúdo de prova no
idioma da prova. Nomes de app e rótulos de status do registro não se traduzem.

---

## 6. Como este contrato muda

Mudança aqui é **RFC** (modelo no Anexo A do Guia de atualização da
marca-mãe), commit neste repositório e entrada no `CHANGELOG.md` com nível
semver e motivo. Mudança que altera o formato de ID ou os campos do manifesto
é **MAJOR** e exige aviso de 90 dias — porque cinco apps dependem dela.

**Inegociável:** nenhuma mudança torna retroativamente inválida uma ID já
publicada ou um deep-link já emitido. Epitáfio, nunca apagamento.
