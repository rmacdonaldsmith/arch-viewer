/**
 * Locale-independent ordering (UTF-16 code units), so the IR sorts identically on every machine.
 * `localeCompare` would vary with the machine's locale.
 */
export function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Orders anything with `from`/`to` ends (Dependencies, visible edges) by `from`, then `to`. */
export function compareEnds(a: { from: string; to: string }, b: { from: string; to: string }): number {
  return compareText(a.from, b.from) || compareText(a.to, b.to);
}
