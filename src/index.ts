// @ironidesflj/axon — a biblioteca compartilhada do ecossistema Noos (constitution.md).
// Fatia F1: gerador/validador de ID pública, schema do manifest.jsonl,
// deep-link canônico e checksum. Zero dependência de runtime.

export {
  REGISTRY_PREFIXES,
  ALIAS_PREFIXES,
  MAX_SEQ,
  generateId,
  validateId,
  validateAliasId,
  aliasOf,
} from './id-generator.js';
export type { Namespace, IdValidation, AliasValidation } from './id-generator.js';

export {
  LineError,
  parseQuestionLine,
  parseManifest,
  isRetired,
} from './schema.js';
export type { QuestionRecord, Rejection, ParseResult, Snapshot } from './schema.js';

export { canonicalUrl, fallbackUrl, resolveAlias } from './deep-link.js';
export type { HubLang } from './deep-link.js';

export {
  computeChecksum,
  verifyChecksum,
  canonicalSnapshotPayload,
} from './checksum.js';
