# Guia de adoção — o Axon nos apps

Versão 0.2.2 · out/2026 · vigente

Público: mantenedores e agents dos apps da família — Synapse, Ranvier,
Myelin, Theta, Engram. Este guia diz **como consumir o pacote
`@ironidesflj/axon`**. A lei continua na
[`constitution.md`](../constitution.md) — em conflito, a constitution vence.

## O princípio

O Axon entra no app como **pacote linkado no build** — nunca serviço, nunca
runtime central. Três regras valem desde o primeiro dia (constitution §4):

1. **Pin exato, sem `^` nem `~`** — lockfile commitado; a versão em uso é
   registrada no `current-state.md` de quem consome (no Ranvier:
   `docs/sdd/current-state.md`).
2. **Cada fatia entra sozinha, atrás de feature flag.** Não existe migração
   big-bang: o app em produção adota por partes, e cada parte entra inerte
   até a flag acender.
3. **MAJOR do pacote nunca quebra ID publicada.** IDs, aliases e deep-links
   são para sempre; breaking change de pacote é de API de código.

O gerenciador de pacotes é escolha do app — a regra é o pin exato, não a
ferramenta:

```bash
npm install --save-exact @ironidesflj/axon@0.2.2   # npm
bun add --exact @ironidesflj/axon@0.2.2            # bun
pnpm add --save-exact @ironidesflj/axon@0.2.2      # pnpm
```

(Use a versão vigente — ver [`CHANGELOG.md`](../CHANGELOG.md). Os exemplos
de API abaixo são os da 0.2.x.)

## As cinco fatias

A adoção completa são cinco fatias independentes, nesta ordem recomendada.
**Nada obriga o app a ir além da fatia que lhe serve hoje** — e nenhuma
fatia toca o banco de questões por si só: a fatia 1 é só a dependência;
as seguintes acendem atrás das próprias flags.

### Fatia 1 — Linkar (o ato formal)

Instalar com pin exato, commitar o lockfile, registrar no current-state do
app. Nada mais muda: sem import em código de produção, sem banco, sem seed.

```markdown
<!-- exemplo de registro no current-state do app -->
- **Axon** — `@ironidesflj/axon@0.2.2` (pin exato, lockfile commitado).
  Fatia 1: link. Próximas fatias (IDs, checksum, manifesto) atrás de
  feature flag.
```

**Aceitação:** lockfile com a versão exata (sem range); lint, typecheck e
CI verdes; a linha acima no current-state; comportamento do app idêntico.

*Precedente: o Ranvier linkou a 0.2.1 em out/2026 — o primeiro consumidor
do pacote.*

### Fatia 2 — IDs na escrita

Flag sugerida: `axon-ids`. A partir daqui, **toda ID nova nasce pelo Axon**:

```ts
import { generateId, validateId } from '@ironidesflj/axon';

generateId('RAN', 'az-900', 41);  // → "RAN-AZ900-00042" (prova normalizada)
validateId(id);                   // → { ok, parsed } | { ok: false, reason }
```

- `generateId` é puro: o contador (`lastIssued`) é do app — o emissor é o
  dono do namespace (constitution §1 R3); o Axon nunca emite nem guarda
  estado.
- `validateId` é estrito: prefixo registrado, prova alfanumérica, 5 dígitos
  começando em `00001`. Toda ID passa por ele antes de salvar; o `reason`
  vai para o log quando algo não passa.

**Acervo legado (alias é eterno, §1 R2).** ID publicada não se renomeia:

```ts
import { validateAliasId, aliasOf } from '@ironidesflj/axon';

validateAliasId('GLI-AZ900-00012');            // ok — GLI- é alias histórico
aliasOf('GLI-AZ900-00012', 'RAN-AZ900-00042'); // valida o par (GLI- → RAN-)
```

- A ID **canônica** de toda questão usa o prefixo oficial do app (`RAN-`);
  o campo `id` com prefixo de alias é **rejeitado** pelo validador — é
  proposital: a oficial é a canônica, a legada vive em `aliases`.
- O mapeamento `GLI-… → RAN-…` é **dado do app, por questão** — uma tabela
  no banco do emissor (os sequenciais são independentes: no exemplo
  canônico da constitution, `GLI-AZ900-00012` ↔ `RAN-AZ900-00042`). O Axon
  valida o par; não guarda a tabela.
- Nenhuma ID legada é reescrita: a questão passa a carregar a oficial no
  `id` e a legada no `aliases` — para sempre.

**Aceitação:** nenhuma ID entra no banco sem passar por `validateId` (ou
nascer de `generateId`); rejeições logadas com `reason`; legadas
preservadas como `aliases`.

### Fatia 3 — Checksum e version

Flag sugerida: `axon-checksum`. No salvar/editar de questão:

```ts
import { computeChecksum, verifyChecksum } from '@ironidesflj/axon';

questao.version += 1;
questao.checksum = computeChecksum(questao.snapshot); // "sha256:<64 hex>"
verifyChecksum(questao.snapshot, questao.checksum);    // true
```

O algoritmo é **travado** (SHA-256 sobre o JSON canônico de
`[statement, options, answer, reference]` — detalhe na `spec-schema.md`,
no repositório). Mudança nele é MAJOR com aviso de 90 dias — por isso o
checksum calculado hoje é o checksum que o hub vai conferir na Fase 2.

**Aceitação:** todo save/edit grava `version + 1` e o checksum; o app (ou
um teste do CI) recusa edição sem os dois.

### Fatia 4 — Manifesto no CI

Flag sugerida: `axon-manifest`. O CI do app publica um `manifest.jsonl`
como artefato: **uma linha por questão, os 9 campos** (constitution §2),
aliases incluídas — validando com o mesmo parser que o hub usará na
ingestão:

```ts
import { parseManifest, verifyChecksum } from '@ironidesflj/axon';

const { ok, rejected } = parseManifest(conteudo);
if (rejected.length > 0) falharOCi(rejected); // linha, motivo — zero tolerância
for (const q of ok) if (!verifyChecksum(q.snapshot, q.checksum)) falharOCi(q.id);
```

Quem **publica** mira zero rejeições — a tolerância a linha suja
(`Rejection{lineNumber, reason}`, resto segue) é direito do **lado do hub**
(§2, ingestão). O hub só ingere na Fase 2; publicar o artefato antes
destrava o lado dele sem pressa.

**Aceitação:** o CI falha se qualquer linha for rejeitada ou checksum
divergir; o artefato `manifest.jsonl` sai a cada build.

### Fatia 5 — Badge e deep-link (aguardando a Fase 2 do hub)

As URLs já são contrato estável:

```ts
import { canonicalUrl, fallbackUrl } from '@ironidesflj/axon';

canonicalUrl('RAN-AZ900-00042', 'pt'); // https://noos.study/pt/q/RAN-AZ900-00042
fallbackUrl('RAN-AZ900-00042', 'pt');  // https://noos-hub.vercel.app/pt/q/...
```

Mas a página `/q/{ID}` ainda não existe (Fase 2 do hub) — **link visível
que dá 404 é UX ruim**. O que pode desde já: a ID no rodapé da questão
(corpo mono, discreta — é ela que o aluno copia para citar). O badge
"by Noos" acende quando o hub abrir `/q/{ID}`: `canonicalUrl` é o `href`,
`fallbackUrl` é o plano B do domínio.

**Aceitação (quando ativar):** badge aponta para o canônico; sem fetch ao
hub em runtime (link, não dependência — §3).

## Armadilhas conhecidas

- **`GLI-` no campo `id` é rejeitada** — a canônica é a oficial (`RAN-`);
  a legada mora em `aliases` (fatia 2).
- **`generateId` não guarda contador** — `lastIssued` é responsabilidade
  do chamador; sem estado entre chamadas, por construção.
- **Pular fatias:** as fatias são independentes, mas a 4 pressupõe a 2 e a
  3 (o manifesto carrega IDs válidas e checksums de verdade).
- **SM-2 não está no pacote** — decisão deliberada (ver `plan.md`, no
  repositório): sobe só quando doer em dois apps.

## Fora de escopo deste guia

- Emissão de ID — o app emite (dono do namespace); o Axon valida e gera.
- Dado de estudo, progresso ou resposta atravessando a biblioteca — nunca
  (Carta cap. 7; guia de atualização N-05).
- Interface do badge — guia de aplicação nos apps (camada 3).
- A página `/q/{ID}` e a ingestão de manifestos — Fase 2 do hub.
