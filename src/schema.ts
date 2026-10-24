// O contrato de manifesto — constitution §2, spec-schema.md.
//
// Uma linha = um JSON válido (UTF-8). Campo ausente ou de tipo errado
// rejeita A LINHA, com motivo legível — nunca o arquivo. ID duplicada no
// mesmo arquivo rejeita a segunda ocorrência e reporta ambas. Linha em
// branco é pulada, não rejeitada. Campos extras são tolerados na leitura
// (forward compat) e não são repassados. O parse valida o FORMATO do
// checksum; a verificação de conteúdo é verifyChecksum (src/checksum.ts),
// chamada à parte por quem publica/ingere.

import type { Snapshot } from './checksum.js';
import { validateAliasId, validateId } from './id-generator.js';

export type { Snapshot };

export interface QuestionRecord {
  id: string;
  exam: string;
  topics: string[];
  difficulty: string;
  lang: string;
  version: number;
  checksum: string;
  aliases: string[];
  snapshot: Snapshot;
}

export interface Rejection {
  /** 1-based, como citada no log do CI. */
  lineNumber: number;
  reason: string;
  raw: string;
}

export type ParseResult = { ok: QuestionRecord[]; rejected: Rejection[] };

/** Erro de uma linha única — carrega o motivo legível e o conteúdo cru. */
export class LineError extends Error {
  readonly reason: string;
  readonly raw: string;
  constructor(reason: string, raw: string) {
    super(reason);
    this.name = 'LineError';
    this.reason = reason;
    this.raw = raw;
  }
}

const CHECKSUM_RE = /^sha256:[0-9a-f]{64}$/;
const LANG_RE = /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/;

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}

/** Parseia e valida UMA linha (sem contexto de arquivo). Lança LineError. */
export function parseQuestionLine(line: string): QuestionRecord {
  let value: unknown;
  try {
    value = JSON.parse(line);
  } catch (e) {
    throw new LineError(`JSON inválido: ${(e as Error).message}`, line);
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new LineError('linha deve ser um objeto JSON', line);
  }
  const o = value as Record<string, unknown>;

  const id = o['id'];
  if (id === undefined) throw new LineError('campo "id" ausente', line);
  if (!isNonEmptyString(id)) throw new LineError('campo "id" deve ser string não vazia', line);
  const vid = validateId(id);
  if (!vid.ok) throw new LineError(`campo "id" inválido: ${vid.reason}`, line);

  const exam = o['exam'];
  if (exam === undefined) throw new LineError('campo "exam" ausente', line);
  if (!isNonEmptyString(exam)) throw new LineError('campo "exam" deve ser string não vazia', line);
  const examNorm = exam.replace(/[-\s]/g, '').toUpperCase();
  if (examNorm !== vid.parsed.exam) {
    throw new LineError(
      `campo "exam" (${exam}) não corresponde ao código da prova da id (${vid.parsed.exam})`,
      line,
    );
  }

  const topics = o['topics'];
  if (topics === undefined) throw new LineError('campo "topics" ausente', line);
  if (!Array.isArray(topics) || topics.length < 1 || !topics.every(isNonEmptyString)) {
    throw new LineError('campo "topics" deve ser array com ≥ 1 tópico (strings não vazias)', line);
  }

  const difficulty = o['difficulty'];
  if (difficulty === undefined) throw new LineError('campo "difficulty" ausente', line);
  if (!isNonEmptyString(difficulty)) {
    throw new LineError('campo "difficulty" deve ser string não vazia (vocabulário do app emissor)', line);
  }

  const lang = o['lang'];
  if (lang === undefined) throw new LineError('campo "lang" ausente', line);
  if (!isNonEmptyString(lang) || !LANG_RE.test(lang)) {
    throw new LineError('campo "lang" deve ser um código BCP-47 (ex.: "pt-BR", "en")', line);
  }

  const version = o['version'];
  if (version === undefined) throw new LineError('campo "version" ausente', line);
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    throw new LineError('campo "version" deve ser um inteiro ≥ 1', line);
  }

  const checksum = o['checksum'];
  if (checksum === undefined) throw new LineError('campo "checksum" ausente', line);
  if (typeof checksum !== 'string' || !CHECKSUM_RE.test(checksum)) {
    throw new LineError('campo "checksum" deve ter o formato "sha256:<64 hex minúsculo>"', line);
  }

  const aliases = o['aliases'];
  if (aliases === undefined) throw new LineError('campo "aliases" ausente', line);
  if (!Array.isArray(aliases) || !aliases.every((a) => typeof a === 'string')) {
    throw new LineError('campo "aliases" deve ser um array de strings (pode ser vazio)', line);
  }
  for (const a of aliases) {
    const va = validateAliasId(a as string);
    if (!va.ok) throw new LineError(`alias inválida: ${va.reason}`, line);
  }

  const snap = o['snapshot'];
  if (snap === undefined) throw new LineError('campo "snapshot" ausente', line);
  if (typeof snap !== 'object' || snap === null || Array.isArray(snap)) {
    throw new LineError('campo "snapshot" deve ser um objeto', line);
  }
  const s = snap as Record<string, unknown>;
  if (!isNonEmptyString(s['statement'])) {
    throw new LineError('snapshot.statement deve ser string não vazia', line);
  }
  if (
    !Array.isArray(s['options']) ||
    (s['options'] as unknown[]).length < 2 ||
    !(s['options'] as unknown[]).every(isNonEmptyString)
  ) {
    throw new LineError('snapshot.options deve ser array de ≥ 2 alternativas não vazias', line);
  }
  if (!isNonEmptyString(s['answer'])) {
    throw new LineError('snapshot.answer deve ser string não vazia', line);
  }
  if (typeof s['reference'] !== 'string') {
    throw new LineError('snapshot.reference deve ser string (pode ser vazia)', line);
  }

  return {
    id,
    exam,
    topics: topics as string[],
    difficulty,
    lang,
    version,
    checksum,
    aliases: aliases as string[],
    snapshot: {
      statement: s['statement'] as string,
      options: s['options'] as string[],
      answer: s['answer'] as string,
      reference: s['reference'] as string,
    },
  };
}

/**
 * Parseia o arquivo inteiro, linha a linha. Linha inválida é rejeitada com
 * log — a ingestão segue (constitution §2). Retorna os records válidos e as
 * rejeições com número de linha; quem chama decide o que fazer com o log.
 */
export function parseManifest(text: string): ParseResult {
  if (typeof text !== 'string') throw new TypeError('parseManifest espera uma string (o conteúdo do arquivo)');
  const ok: QuestionRecord[] = [];
  const rejected: Rejection[] = [];
  const seen = new Map<string, number>();
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] as string;
    if (line.trim().length === 0) continue; // linha em branco: pulada, não rejeitada
    try {
      const record = parseQuestionLine(line);
      const first = seen.get(record.id);
      if (first !== undefined) {
        rejected.push({
          lineNumber: i + 1,
          reason: `id duplicada: "${record.id}" já publicada na linha ${first} — a segunda ocorrência é rejeitada`,
          raw: line,
        });
        continue;
      }
      seen.set(record.id, i + 1);
      ok.push(record);
    } catch (e) {
      if (e instanceof LineError) {
        rejected.push({ lineNumber: i + 1, reason: e.reason, raw: line });
      } else {
        throw e;
      }
    }
  }
  return { ok, rejected };
}
