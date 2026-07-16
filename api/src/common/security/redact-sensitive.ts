/**
 * Redact secrets from log / stored error strings (REQ-F-13).
 * Used by ingest when persisting SyncRun.errorMessage and by sync DTOs on read.
 */
export function redactSensitiveText(message: string): string {
  const safe = message
    .replace(/Bearer\s+\S+/gi, 'Bearer ***')
    .replace(/postgresql:\/\/[^\s]+/gi, 'postgresql://***')
    .replace(/api[_-]?ninjas[_-]?key[=:\s]+\S+/gi, 'API_NINJAS_KEY=***')
    .replace(/api[_-]?key[=:\s]+\S+/gi, 'api_key=***');

  const maxLen = 500;
  if (safe.length > maxLen) {
    return `${safe.slice(0, maxLen)}…`;
  }
  return safe;
}
