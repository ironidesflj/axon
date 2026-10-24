// O deep-link canônico — constitution §3, spec-deep-link.md.
//
//   https://noos.study/{pt|en}/q/{ID}          (canônico)
//   https://noos-hub.vercel.app/{pt|en}/q/{ID} (fallback)
//
// Badge e deep-link são LINKS, não dependências: nada de fetch para o hub
// em runtime, nada de telemetry, nada de "só funciona online". O idioma do
// segmento é o da página de ORIGEM do clique, não o da questão.

import { validateAliasId, validateId } from './id-generator.js';

const CANONICAL_ORIGIN = 'https://noos.study';
const FALLBACK_ORIGIN = 'https://noos-hub.vercel.app';

export type HubLang = 'pt' | 'en';

function assertLang(lang: HubLang): void {
  if (lang !== 'pt' && lang !== 'en') {
    throw new Error(`lang deve ser "pt" ou "en" — o idioma da página de origem do clique (recebido: ${String(lang)})`);
  }
}

function assertValidId(id: string): void {
  const v = validateId(id);
  if (!v.ok) {
    throw new Error(`id inválida: ${v.reason} — link quebrado em ID publicada é violação de contrato (constitution §3)`);
  }
}

/** Monta o deep-link canônico da questão. */
export function canonicalUrl(id: string, lang: HubLang): string {
  assertLang(lang);
  assertValidId(id);
  return `${CANONICAL_ORIGIN}/${lang}/q/${id}`;
}

/** Fallback canônico — embutido no badge "by Noos" (plano B do domínio, Carta cap. 12). */
export function fallbackUrl(id: string, lang: HubLang): string {
  assertLang(lang);
  assertValidId(id);
  return `${FALLBACK_ORIGIN}/${lang}/q/${id}`;
}

/**
 * Resolve o destino de uma ID legada (alias GLI-…): devolve a ID oficial.
 * A tabela alias→oficial vive no app emissor (é dado dele); o helper só
 * valida o par. Idempotente: ID já oficial devolve ela mesma. O redirect
 * 301 é rota do hub, nunca do app.
 */
export function resolveAlias(aliasId: string, table: Record<string, string>): string {
  const direct = validateId(aliasId);
  if (direct.ok) return aliasId; // já é oficial
  const a = validateAliasId(aliasId);
  if (!a.ok) throw new Error(`alias inválida: ${a.reason}`);
  const official = table[aliasId];
  if (official === undefined) {
    throw new Error(`alias ${aliasId} fora da tabela — a tabela é dado do app emissor (spec-deep-link)`);
  }
  const v = validateId(official);
  if (!v.ok) throw new Error(`destino da tabela inválido: ${official} (${v.reason})`);
  return official;
}
