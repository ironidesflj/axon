// Testes de contrato — constitution §2 (o contrato de manifesto), spec-schema.
// Linha inválida é rejeitada com log — a ingestão segue. Uma linha ruim
// nunca derruba as demais.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  LineError,
  parseManifest,
  parseQuestionLine,
  verifyChecksum,
  computeChecksum,
  isRetired,
} from '../../src/index.js';

const read = (name: string): string =>
  readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');

const good = parseManifest(read('manifest.good.jsonl'));
const dirty = parseManifest(read('manifest.dirty.jsonl'));

test('§2 campos — manifest.good.jsonl parseia limpo (exemplo canônico da constitution + linha SYN)', () => {
  assert.equal(good.rejected.length, 0);
  assert.equal(good.ok.length, 2);
  const [ran, syn] = good.ok;
  assert.equal(ran.id, 'RAN-AZ900-00042');
  assert.equal(ran.exam, 'AZ-900');
  assert.deepEqual(ran.aliases, ['GLI-AZ900-00012']);
  assert.deepEqual(ran.snapshot.options, ['A', 'B', 'C', 'D']);
  assert.equal(syn.id, 'SYN-CTFL-00007');
  assert.deepEqual(syn.topics, ['fundamentos', 'ciclo-de-vida']);
});

test('§2 checksum — verifyChecksum confirma as somas reais do good fixture', () => {
  for (const record of good.ok) assert.ok(verifyChecksum(record), record.id);
});

test('§2 checksum — conteúdo adulterado falha verifyChecksum (divergência manifesto ↔ conteúdo)', () => {
  const record = structuredClone(good.ok[0]);
  record.snapshot.answer = 'A'; // gabarito trocado, soma não acompanha
  assert.ok(!verifyChecksum(record));
  // consertando a soma, volta a bater
  record.checksum = computeChecksum(record.snapshot);
  assert.ok(verifyChecksum(record));
});

test('§2 ingestão — manifest.dirty.jsonl: 1 ok + 8 rejections com lineNumber e motivo', () => {
  assert.equal(dirty.ok.length, 1);
  assert.equal(dirty.rejected.length, 8);
  assert.deepEqual(
    dirty.rejected.map((r) => r.lineNumber),
    [2, 3, 4, 5, 6, 7, 8, 9],
  );
  for (const r of dirty.rejected) {
    assert.ok(r.reason.length > 0);
    assert.ok(r.raw.length > 0);
  }
});

test('§2 ingestão — linha 2 com JSON quebrado rejeitada com motivo do parser', () => {
  const r = dirty.rejected.find((x) => x.lineNumber === 2);
  assert.ok(r);
  assert.match(r.reason, /JSON inválido/);
});

test('§2 ingestão — linha 3 sem checksum rejeita a linha, não o arquivo', () => {
  const r = dirty.rejected.find((x) => x.lineNumber === 3);
  assert.ok(r);
  assert.match(r.reason, /checksum/);
});

test('§2 ingestão — linha 4 com tipo errado (version string) rejeitada com motivo legível', () => {
  const r = dirty.rejected.find((x) => x.lineNumber === 4);
  assert.ok(r);
  assert.match(r.reason, /version.*inteiro/);
});

test('§2 ingestão — linha 5 duplicada: a segunda ocorrência é rejeitada e reporta ambas', () => {
  const r = dirty.rejected.find((x) => x.lineNumber === 5);
  assert.ok(r);
  assert.match(r.reason, /duplicada.*SYN-CTFL-00007.*linha 1/);
});

test('§2-R3 ingestão — linha 6 com prefixo fora do registro rejeitada (ninguém emite XYZ-)', () => {
  const r = dirty.rejected.find((x) => x.lineNumber === 6);
  assert.ok(r);
  assert.match(r.reason, /registro/);
});

test('§2 ingestão — linha 7 com alias malformada rejeitada; linha 8 com lang inválida; linha 9 com topics vazio', () => {
  const r7 = dirty.rejected.find((x) => x.lineNumber === 7);
  const r8 = dirty.rejected.find((x) => x.lineNumber === 8);
  const r9 = dirty.rejected.find((x) => x.lineNumber === 9);
  assert.ok(r7 && r8 && r9, 'linhas 7, 8 e 9 deveriam estar rejeitadas');
  assert.match(r7!.reason, /alias/);
  assert.match(r8!.reason, /lang.*BCP-47/);
  assert.match(r9!.reason, /topics/);
});

test('§2 ingestão — linha em branco é pulada, não rejeitada; arquivo vazio é ingestão vazia', () => {
  assert.equal(dirty.rejected.find((x) => x.lineNumber === 10), undefined);
  const empty = parseManifest('');
  assert.deepEqual(empty, { ok: [], rejected: [] });
});

test('§2 campos — exam deve corresponder ao código da prova da id (travado na revisão de implementação)', () => {
  const base = JSON.parse(read('manifest.good.jsonl').split('\n')[1]);
  base.exam = 'AZ-900'; // SYN-CTFL-00007 não é prova Azure
  assert.throws(() => parseQuestionLine(JSON.stringify(base)), /não corresponde/);
});

test('§2 campos — campos extras são tolerados na leitura e não repassados (forward compat)', () => {
  const base = JSON.parse(read('manifest.good.jsonl').split('\n')[1]);
  base.futureField = { v: 2 };
  const record = parseQuestionLine(JSON.stringify(base));
  assert.equal(record.id, 'SYN-CTFL-00007');
  assert.equal('futureField' in record, false);
});

test('§2 — parseQuestionLine lança LineError com reason e raw', () => {
  try {
    parseQuestionLine('{"id": "RAN-AZ900-00042"}');
    assert.fail('deveria lançar LineError');
  } catch (e) {
    assert.ok(e instanceof LineError);
    assert.match((e as LineError).reason, /exam.*ausente/);
    assert.ok((e as LineError).raw.length > 0);
  }
});

// v0.3 — política epitáfio: campo opcional e aditivo.
test('§2 retired — aceita true/false, ausência = ativa e isRetired reflete', () => {
  const base = JSON.parse(read('manifest.good.jsonl').split('\n')[0]) as Record<string, unknown>;
  const active = parseQuestionLine(JSON.stringify(base));
  assert.equal(isRetired(active), false);
  assert.equal(active.retired, undefined);

  const retiredTrue = parseQuestionLine(JSON.stringify({ ...base, retired: true }));
  assert.equal(isRetired(retiredTrue), true);
  assert.equal(retiredTrue.retired, true);

  const retiredFalse = parseQuestionLine(JSON.stringify({ ...base, retired: false }));
  assert.equal(isRetired(retiredFalse), false);
});

test('§2 retired — tipo inválido rejeita a linha, mas não o arquivo', () => {
  const base = read('manifest.good.jsonl').split('\n')[0];
  const bad = JSON.parse(base) as Record<string, unknown>;
  const text = [JSON.stringify({ ...bad, retired: 'sim' }), base].join('\n');
  const result = parseManifest(text);
  assert.equal(result.ok.length, 1);
  assert.equal(result.rejected.length, 1);
  assert.match(result.rejected[0]!.reason, /retired.*booleano/);
});
