// O checksum do manifest.jsonl — constitution §2, algoritmo travado na
// revisão de implementação da v0.2.0 (spec-schema.md, "Pendência RESOLVIDA"):
//
//   checksum = "sha256:" + hex(SHA-256(UTF-8(JSON.stringify(
//       [statement, options, answer, reference]))))
//
// Só o snapshot entra na soma (metadata é classificação, não conteúdo);
// options entra como array (nunca concatenado); version não entra.
// Mudar qualquer decisão depois da primeira ID real emitida é MAJOR com
// aviso de 90 dias (constitution §6).

import { sha256Hex } from './sha256.js';

/** O conteúdo da questão — o único que entra na soma (constitution §2). */
export interface Snapshot {
  statement: string;
  options: string[];
  answer: string;
  reference: string;
}

/** Serialização canônica do snapshot: array de 4 elementos, ordem fixa. */
export function canonicalSnapshotPayload(s: Snapshot): string {
  return JSON.stringify([s.statement, s.options, s.answer, s.reference]);
}

/** A soma de verificação do conteúdo, no formato do manifesto ("sha256:<64 hex>"). */
export function computeChecksum(s: Snapshot): string {
  const bytes = new TextEncoder().encode(canonicalSnapshotPayload(s));
  return `sha256:${sha256Hex(bytes)}`;
}

/**
 * Recomputa a soma sobre o snapshot do registro e compara com o campo
 * declarado. O parse (spec-schema) valida o FORMATO do campo; a verificação
 * de conteúdo é chamada à parte — o app ao publicar, o hub na ingestão.
 */
export function verifyChecksum(
  record: Pick<import('./schema.js').QuestionRecord, 'checksum' | 'snapshot'>,
): boolean {
  return computeChecksum(record.snapshot) === record.checksum;
}
