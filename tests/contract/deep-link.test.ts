// Testes de contrato — constitution §3 (deep-link canônico), spec-deep-link.
// As URLs saem byte a byte como na constitution; badge e deep-link são
// links, não dependências.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { canonicalUrl, fallbackUrl, resolveAlias } from '../../src/index.js';

const golden = JSON.parse(
  readFileSync(new URL('./fixtures/links.golden.json', import.meta.url), 'utf8'),
) as {
  canonical: Record<string, Record<'pt' | 'en', string>>;
  fallback: Record<string, Record<'pt' | 'en', string>>;
  resolveAlias: { alias: string; table: Record<string, string>; canonical: string };
};

test('§3 — as 4 URLs do golden saem byte a byte (pt/en × noos.study/noos-hub.vercel.app)', () => {
  const id = 'RAN-AZ900-00042';
  for (const lang of ['pt', 'en'] as const) {
    assert.equal(canonicalUrl(id, lang), golden.canonical[id][lang]);
    assert.equal(fallbackUrl(id, lang), golden.fallback[id][lang]);
  }
});

test('§3 — id inválida lança: link quebrado em ID publicada é violação de contrato', () => {
  assert.throws(() => canonicalUrl('ran-az900-00042', 'pt'), /id inválida/);
  assert.throws(() => fallbackUrl('XYZ-CTFL-00042', 'en'), /id inválida/);
  assert.throws(() => canonicalUrl('RAN-AZ900-00042', 'fr' as never), /lang/);
});

test('§3 — o idioma do segmento é o da página de origem do clique, não o da questão', () => {
  assert.equal(canonicalUrl('RAN-AZ900-00042', 'en'), 'https://noos.study/en/q/RAN-AZ900-00042');
  assert.equal(canonicalUrl('RAN-AZ900-00042', 'pt'), 'https://noos.study/pt/q/RAN-AZ900-00042');
});

test('§3-R2 — resolveAlias devolve a ID oficial da tabela do app emissor', () => {
  const { alias, table, canonical } = golden.resolveAlias;
  assert.equal(resolveAlias(alias, table), canonical);
});

test('§3-R2 — resolveAlias é idempotente para ID já oficial', () => {
  assert.equal(resolveAlias('RAN-AZ900-00042', {}), 'RAN-AZ900-00042');
});

test('§3-R2 — alias fora da tabela lança (a tabela é dado do app emissor, não do Axon)', () => {
  assert.throws(() => resolveAlias('GLI-AZ900-00012', {}), /tabela/);
  assert.throws(
    () => resolveAlias('GLI-AZ900-00012', { 'GLI-AZ900-00012': 'que-isso' }),
    /destino da tabela inválido/,
  );
});
