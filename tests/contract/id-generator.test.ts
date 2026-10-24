// Testes de contrato — constitution §1 (a ID pública), spec-id-generator.
// Cada caso é citável pelo nome; a tabela de casos mínimos está na
// spec-contract-tests.md.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  REGISTRY_PREFIXES,
  ALIAS_PREFIXES,
  MAX_SEQ,
  generateId,
  validateId,
  validateAliasId,
  aliasOf,
} from '../../src/index.js';

const golden = JSON.parse(
  readFileSync(new URL('./fixtures/ids.golden.json', import.meta.url), 'utf8'),
) as {
  valid: { id: string; prefix: string; exam: string; seq: number }[];
  invalid: { id: string; reasonContains: string }[];
  aliasValid: string[];
  aliasInvalid: string[];
};

test('§1 formato — todo ID válida do golden valida e parseia (exemplo canônico incluso)', () => {
  for (const { id, prefix, exam, seq } of golden.valid) {
    const v = validateId(id);
    assert.ok(v.ok, `${id} deveria ser válida`);
    assert.deepEqual(v.parsed, { prefix, exam, seq });
  }
});

test('§1-R3 namespace — todo prefixo do registro emite; XYZ fora do registro é rejeitado', () => {
  for (const p of REGISTRY_PREFIXES) {
    const id = generateId(p, 'CTFL', 0);
    assert.equal(id, `${p}-CTFL-00001`);
  }
  const bad = validateId('XYZ-CTFL-00042');
  assert.ok(!bad.ok);
  assert.match(bad.reason, /registro/);
});

test('§1 formato — IDs inválidas do golden rejeitam com motivo citável', () => {
  for (const { id, reasonContains } of golden.invalid) {
    const v = validateId(id);
    assert.ok(!v.ok, `${JSON.stringify(id)} deveria ser inválida`);
    assert.match(v.reason, new RegExp(reasonContains), `${id}: ${v.reason}`);
  }
});

test('§1-R2 alias é eterno — GLI- não é registrada (validateId rejeita), mas é alias válida (validateAliasId aceita)', () => {
  const strict = validateId('GLI-AZ900-00012');
  assert.ok(!strict.ok);
  assert.match(strict.reason, /registro/);
  const alias = validateAliasId('GLI-AZ900-00012');
  assert.ok(alias.ok);
  assert.deepEqual(alias.parsed, { prefix: 'GLI', exam: 'AZ900', seq: 12 });
});

test('§1-R2 alias é eterno — aliasValid/aliasInvalid do golden respeitam a fronteira', () => {
  for (const id of golden.aliasValid) assert.ok(validateAliasId(id).ok, `${id} deveria passar`);
  for (const id of golden.aliasInvalid) assert.ok(!validateAliasId(id).ok, `${id} deveria falhar`);
});

test('§1-R4 sequencial — 00001 na primeira emissão; 41 → 00042 (o exemplo canônico por código real)', () => {
  assert.equal(generateId('RAN', 'AZ900', 0), 'RAN-AZ900-00001');
  assert.equal(generateId('RAN', 'AZ900', 41), 'RAN-AZ900-00042');
});

test('§1-R4 sequencial — esgotamento em 99999 lança: o formato de 5 dígitos é lei', () => {
  assert.equal(generateId('RAN', 'AZ900', MAX_SEQ - 1), 'RAN-AZ900-99999');
  assert.throws(() => generateId('RAN', 'AZ900', MAX_SEQ), /esgotado|RFC/);
});

test('§1 pureza — generateId não guarda estado: mesma entrada, mesma saída; lastIssued é do chamador', () => {
  const a = generateId('SYN', 'CTFL', 6);
  const b = generateId('SYN', 'CTFL', 6);
  assert.equal(a, b);
  assert.equal(a, 'SYN-CTFL-00007');
  // chamador que não avança o contador recebe o mesmo resultado — o estado é dele
  assert.equal(generateId('SYN', 'CTFL', 6), a);
});

test('§1 formato — generateId normaliza a prova ("az-900" → AZ900); validateId é estrito', () => {
  assert.equal(generateId('RAN', 'az-900', 41), 'RAN-AZ900-00042');
  assert.equal(generateId('RAN', 'AZ 900', 41), 'RAN-AZ900-00042');
  assert.ok(!validateId('RAN-az900-00042').ok);
});

test('§1-R1/R2 — aliasOf devolve o par normalizado; GLI- só aponta para RAN- (constitution R2)', () => {
  const pair = aliasOf('GLI-AZ900-00012', 'RAN-AZ900-00042');
  assert.deepEqual(pair, { alias: 'GLI-AZ900-00012', canonical: 'RAN-AZ900-00042' });
  // codinome apontando para irmão errado é erro de contrato, não de formato
  assert.throws(() => aliasOf('GLI-AZ900-00012', 'SYN-CTFL-00001'), /RAN/);
  assert.throws(() => aliasOf('GLI-AZ900-0000X', 'RAN-AZ900-00042'), /alias inválida/);
});

test('§1-R3 — generateId nunca emite alias: a saída sempre nasce no prefixo oficial', () => {
  for (const p of Object.keys(ALIAS_PREFIXES)) {
    // alias prefixes não são Namespace: emitir com eles é erro na porta
    assert.throws(() => generateId(p as never, 'AZ900', 0), /registro/);
  }
  assert.equal(generateId('RAN', 'AZ900', 0), 'RAN-AZ900-00001');
});

test('§1-R1 — MYE/THA/ENG validam formato (previstos no registro; emissão real espera o batismo)', () => {
  assert.ok(validateId('MYE-SC900-00001').ok);
  assert.ok(validateId('THA-PSMI-00001').ok);
  assert.ok(validateId('ENG-DP900-00001').ok);
});
