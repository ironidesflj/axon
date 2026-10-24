// A ID pública de questão — constitution §1, spec-id-generator.md.
//
//   {PREFIXO}-{PROVA}-{SEQ}   ex.: RAN-AZ900-00042
//
// O Axon valida e gera; NUNCA emite (quem emite é o app, dono do namespace —
// regra 3). Sem estado entre chamadas: lastIssued é responsabilidade do
// chamador (sem serviço, sem banco).

/** Espelha o noos.registry.json do hub (fonte única). Mudança aqui é RFC + bump semver. */
export const REGISTRY_PREFIXES = ['SYN', 'RAN', 'MYE', 'THA', 'ENG'] as const;
export type Namespace = (typeof REGISTRY_PREFIXES)[number];

/** Prefixos de alias históricos (constitution §1 R2): o codinome vale para sempre. */
export const ALIAS_PREFIXES: Readonly<Record<string, Namespace>> = { GLI: 'RAN' };

const SEQ_RE = /^\d{5}$/;
const PREFIX_RE = /^[A-Z]{3}$/;
const EXAM_RE = /^[A-Z0-9]{2,12}$/;
/** O maior sequencial cabível no formato de 5 dígitos (constitution §1). */
export const MAX_SEQ = 99999;

export type IdValidation =
  | { ok: true; parsed: { prefix: Namespace; exam: string; seq: number } }
  | { ok: false; reason: string };

export type AliasValidation =
  | { ok: true; parsed: { prefix: string; exam: string; seq: number } }
  | { ok: false; reason: string };

function parseFormat(id: string): { ok: true; parts: [string, string, string] } | { ok: false; reason: string } {
  if (typeof id !== 'string' || id.length === 0) {
    return { ok: false, reason: 'id deve ser uma string não vazia' };
  }
  const parts = id.split('-');
  if (parts.length !== 3) {
    return { ok: false, reason: 'formato: PREFIXO-PROVA-SEQ — ex.: RAN-AZ900-00042' };
  }
  const [prefix, exam, seq] = parts as [string, string, string];
  if (!SEQ_RE.test(seq)) {
    return { ok: false, reason: 'sequencial deve ter exatamente 5 dígitos (ex.: 00042)' };
  }
  if (seq === '00000') {
    return { ok: false, reason: 'sequencial começa em 00001 — sem reciclagem (constitution §1 R4)' };
  }
  if (!PREFIX_RE.test(prefix)) {
    return { ok: false, reason: 'prefixo deve ter 3 letras maiúsculas' };
  }
  if (!EXAM_RE.test(exam)) {
    return { ok: false, reason: 'prova deve ser alfanumérica maiúscula, sem traços nem espaços (ex.: AZ900)' };
  }
  return { ok: true, parts: [prefix, exam, seq] };
}

/** Valida formato + prefixo registrado. A ID de todo manifesto passa por aqui. */
export function validateId(id: string): IdValidation {
  const f = parseFormat(id);
  if (!f.ok) return f;
  const [prefix, exam, seq] = f.parts;
  if (!(REGISTRY_PREFIXES as readonly string[]).includes(prefix)) {
    return { ok: false, reason: `prefixo ${prefix} fora do registro (${REGISTRY_PREFIXES.join(', ')})` };
  }
  return { ok: true, parsed: { prefix: prefix as Namespace, exam, seq: parseInt(seq, 10) } };
}

/**
 * Valida formato aceitando também prefixos de alias históricos (GLI-…).
 * É a validação usada no campo `aliases` do manifesto — a ID oficial tem
 * que passar em validateId; a ID legada, nesta.
 */
export function validateAliasId(id: string): AliasValidation {
  const f = parseFormat(id);
  if (!f.ok) return f;
  const [prefix, exam, seq] = f.parts;
  const known =
    (REGISTRY_PREFIXES as readonly string[]).includes(prefix) || prefix in ALIAS_PREFIXES;
  if (!known) {
    return { ok: false, reason: `prefixo ${prefix} não é registrado nem alias histórico (GLI)` };
  }
  return { ok: true, parsed: { prefix, exam, seq: parseInt(seq, 10) } };
}

/**
 * Gera a próxima ID de uma prova, dado o maior sequencial já emitido.
 * Nunca consulta rede, nunca guarda estado: o chamador decide publicar.
 * A prova é normalizada (traços/espaços fora, maiúsculas) — "az-900" → "AZ900".
 */
export function generateId(prefix: Namespace, exam: string, lastIssued: number): string {
  if (typeof prefix !== 'string' || !(REGISTRY_PREFIXES as readonly string[]).includes(prefix)) {
    throw new Error(`prefixo ${String(prefix)} fora do registro (${REGISTRY_PREFIXES.join(', ')})`);
  }
  if (typeof exam !== 'string') throw new Error('exam deve ser uma string');
  const examNorm = exam.replace(/[-\s]/g, '').toUpperCase();
  if (!EXAM_RE.test(examNorm)) {
    throw new Error(`prova inválida: "${exam}" → "${examNorm}" (espera-se ex.: AZ900, CTFL)`);
  }
  if (!Number.isInteger(lastIssued) || lastIssued < 0) {
    throw new Error(`lastIssued deve ser um inteiro ≥ 0 (recebido: ${lastIssued})`);
  }
  if (lastIssued >= MAX_SEQ) {
    throw new Error(
      `sequencial esgotado para ${prefix}-${examNorm}: o formato de 5 dígitos é lei ` +
        `(constitution §1) — esgotar exige RFC, nunca alargar o formato`,
    );
  }
  const seq = String(lastIssued + 1).padStart(5, '0');
  return `${prefix}-${examNorm}-${seq}`;
}

/**
 * Normaliza o par alias → oficial (spec-id-generator). O legacy aceita
 * alias histórico (GLI-…); o oficial precisa passar em validateId. Alias de
 * prefixo conhecido só aponta para o prefixo oficial dele (GLI-… → RAN-…,
 * constitution §1 R2). A tabela de IDs é dado do app emissor — o Axon não a guarda.
 */
export function aliasOf(legacyId: string, officialId: string): { alias: string; canonical: string } {
  const a = validateAliasId(legacyId);
  if (!a.ok) throw new Error(`alias inválida: ${a.reason}`);
  const o = validateId(officialId);
  if (!o.ok) throw new Error(`id oficial inválida: ${o.reason}`);
  if (a.parsed.prefix in ALIAS_PREFIXES) {
    const expected = ALIAS_PREFIXES[a.parsed.prefix];
    if (o.parsed.prefix !== expected) {
      throw new Error(
        `alias ${a.parsed.prefix}-… aponta para ${expected}-… (constitution §1 R2) — destino recebido: ${o.parsed.prefix}`,
      );
    }
  }
  return { alias: legacyId, canonical: officialId };
}
