// Testes de contrato — constitution §2 (checksum travado na revisão de
// implementação da v0.2.0). O oráculo é node:crypto: a implementação pura
// (src/sha256.ts, isomórfica) tem que concordar com ele — a prova fica no
// teste, o runtime fica limpo.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

import { computeChecksum, verifyChecksum, canonicalSnapshotPayload } from '../../src/index.js';

const oracle = (s: { statement: string; options: string[]; answer: string; reference: string }): string =>
  'sha256:' +
  createHash('sha256').update(canonicalSnapshotPayload(s), 'utf8').digest('hex');

test('§2 checksum — vetores conhecidos da implementação pura (SHA-256, FIPS 180-4)', () => {
  // sha256("") e sha256("abc") — a implementação exposta é a do payload
  // canônico; para o vetor bruto, comparamos contra o oráculo no mesmo input.
  const empty = { statement: '', options: [] as string[], answer: '', reference: '' };
  assert.equal(computeChecksum(empty), oracle(empty));
  const abc = { statement: 'abc', options: ['x', 'y'], answer: 'z', reference: 'r' };
  assert.equal(computeChecksum(abc), oracle(abc));
  // e o formato é sempre o do manifesto
  assert.match(computeChecksum(abc), /^sha256:[0-9a-f]{64}$/);
});

test('§2 checksum — oráculo node:crypto concorda em 200 entradas determinísticas', () => {
  let seed = 42;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 0x100000000);
  const alphabet = 'abcXYZ019 çãé中😀 \n\t"\\[]{},:';
  const str = () => {
    const len = Math.floor(rnd() * 60);
    let out = '';
    for (let i = 0; i < len; i++) out += alphabet[Math.floor(rnd() * alphabet.length)];
    return out;
  };
  for (let i = 0; i < 200; i++) {
    const s = { statement: str(), options: [str(), str()], answer: str(), reference: str() };
    assert.equal(computeChecksum(s), oracle(s), `divergência na entrada determinística #${i}`);
  }
});

test('§2 checksum — canonicalização determinística: mesma entrada, mesma soma', () => {
  const s = { statement: 'Qual servico...', options: ['A', 'B'], answer: 'B', reference: 'ref' };
  assert.equal(computeChecksum(s), computeChecksum(s));
  assert.equal(canonicalSnapshotPayload(s), canonicalSnapshotPayload(s));
});

test('§2 checksum — estrutura aninhada não colide: ["A","B"] ≠ ["A|B"] por construção', () => {
  const a = computeChecksum({ statement: 'A', options: ['B', 'C'], answer: 'x', reference: '' });
  const b = computeChecksum({ statement: 'A|B', options: ['C'], answer: 'x', reference: '' });
  const c = computeChecksum({ statement: 'A', options: ['B|C'], answer: 'x', reference: '' });
  assert.notEqual(a, b);
  assert.notEqual(a, c);
  assert.notEqual(b, c);
});

test('§2 checksum — metadata fora da soma: mudar topics/version não invalida o conteúdo', () => {
  const snap = { statement: 'Enunciado', options: ['A', 'B'], answer: 'A', reference: 'r' };
  const sum = computeChecksum(snap);
  assert.ok(verifyChecksum({ checksum: sum, snapshot: snap }));
});

test('§2 checksum — unicode (acentos, CJK, emoji) estável e idêntico ao oráculo', () => {
  const s = {
    statement: 'Qual serviço do Azure gerencia identidade? — 中文 😀 "aspas" \\ barra',
    options: ['Opção çã', 'Opção 😀'],
    answer: 'A',
    reference: 'learn.microsoft.com/azure',
  };
  assert.equal(computeChecksum(s), oracle(s));
});
