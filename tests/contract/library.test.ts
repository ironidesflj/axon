// Testes de contrato — constitution §4 (regras da biblioteca): pacote, nunca
// serviço. Zero dependência de runtime, sem postinstall, sem binário, sem
// rede. A auditoria varre o dist/ que de fato embarca no pacote.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { REGISTRY_PREFIXES, generateId, validateId } from '../../src/index.js';
import { validateId as validateIdDirect } from '../../src/index.js';

const pkg = JSON.parse(
  readFileSync(new URL('../../../package.json', import.meta.url), 'utf8'),
) as {
  name: string;
  private: boolean;
  dependencies?: Record<string, string>;
  bin?: unknown;
  scripts?: Record<string, string>;
};

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

const distSrc = walk(new URL('../../../dist/src', import.meta.url).pathname);

test('§4 pin — zero dependência de runtime (dependencies vazio ou ausente)', () => {
  assert.deepEqual(pkg.dependencies ?? {}, {});
});

test('§4 — sem postinstall, sem bin: a biblioteca nunca é serviço nem instala efeitos', () => {
  assert.equal(pkg.bin, undefined);
  for (const forbidden of ['preinstall', 'postinstall', 'prepare']) {
    assert.equal(pkg.scripts?.[forbidden], undefined, `script ${forbidden} não deveria existir`);
  }
});

test('§4 auditoria — dist/src sem chamada de rede (fetch/XHR/WebSocket/import http)', () => {
  const patterns: [RegExp, string][] = [
    [/\bfetch\s*\(/, 'fetch('],
    [/XMLHttpRequest/, 'XMLHttpRequest'],
    [/\bWebSocket\b/, 'WebSocket'],
    [/require\(\s*['"]https?:/, "require('http')"],
    [/from\s+['"]https?:/, "import from 'http'"],
    [/['"]node:(?:net|http|https|dgram|tls|dns|child_process|fs|os)['"]/, 'import node: rede/sistema'],
    [/\bnavigator\.sendBeacon\b/, 'sendBeacon'],
  ];
  assert.ok(distSrc.length > 0, 'dist/src deveria existir ( rode npm run build )');
  for (const file of distSrc) {
    const code = readFileSync(file, 'utf8');
    for (const [re, label] of patterns) {
      assert.doesNotMatch(code, re, `${file} contém ${label} — violação do §4 (nunca serviço)`);
    }
  }
});

test('§4 — importa puro em Node (esta suíte rodando é a evidência); roda sem estado global', () => {
  // chamadas repetidas não poluem estado (o mesmo import desta suíte)
  assert.equal(generateId('RAN', 'AZ900', 41), 'RAN-AZ900-00042');
  assert.ok(validateIdDirect('SYN-CTFL-00001').ok);
});

test('§4 MAJOR — ids.golden.json inteiro valida: IDs são para sempre, em qualquer versão', () => {
  const golden = JSON.parse(
    readFileSync(new URL('./fixtures/ids.golden.json', import.meta.url), 'utf8'),
  ) as { valid: { id: string }[] };
  for (const { id } of golden.valid) {
    assert.ok(validateId(id).ok, `${id} é válida para sempre (imutabilidade, §4)`);
  }
});

test('§4 — o espelho do registro declara os 5 prefixos oficiais (fonte única: noos.registry.json)', () => {
  assert.deepEqual([...REGISTRY_PREFIXES], ['SYN', 'RAN', 'MYE', 'THA', 'ENG']);
});
