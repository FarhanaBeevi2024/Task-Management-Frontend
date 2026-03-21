/**
 * Two-character assignee label from an email address (for task tiles / avatars).
 * - Local part with dots (e.g. ajith.chandran@x.com): first letter of first segment +
 *   first letter of last segment → "AC".
 * - Single segment (e.g. ajith@x.com): first two letters of that segment → "AJ".
 * Strips +tag from the local part before parsing.
 */
export function getAssigneeInitialsFromEmail(email) {
  if (email == null || String(email).trim() === '') return '?';
  const full = String(email).trim();
  const at = full.indexOf('@');
  let local = at >= 0 ? full.slice(0, at) : full;
  if (!local) return '?';

  const plus = local.indexOf('+');
  if (plus >= 0) local = local.slice(0, plus);
  local = local.trim();
  if (!local) return '?';

  const segments = local
    .split('.')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const firstLetter = (str) => {
    for (let i = 0; i < str.length; i += 1) {
      const ch = str[i];
      if (/[a-z0-9]/i.test(ch)) return ch.toUpperCase();
    }
    return '';
  };

  if (segments.length >= 2) {
    const a = firstLetter(segments[0]);
    const b = firstLetter(segments[segments.length - 1]);
    if (a && b) return a + b;
  }

  const single = segments[0] || local;
  const letters = single.replace(/[^a-z0-9]/gi, '');
  if (letters.length >= 2) return letters.slice(0, 2).toUpperCase();
  if (letters.length === 1) return letters.toUpperCase();
  return '?';
}
