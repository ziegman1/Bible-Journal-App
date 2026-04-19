import { firstLetterFromWord } from "@/lib/scripture-module/memorize-words";

/** US QWERTY neighbors for a–z (lowercase keys). Used for fat-finger tolerance on single-letter checks. */
const KEY_NEIGHBORS: Record<string, string> = {
  q: "wa",
  w: "qase",
  e: "wsdr",
  r: "edft",
  t: "rfgy",
  y: "tghu",
  u: "yhji",
  i: "ujko",
  o: "iklp",
  p: "ol",
  a: "qwsz",
  s: "awedxz",
  d: "serfcx",
  f: "drtgvc",
  g: "ftyhbv",
  h: "gyujnb",
  j: "huikmn",
  k: "jiol",
  l: "kop",
  z: "asx",
  x: "zsdc",
  c: "xdfv",
  v: "cfgb",
  b: "vghn",
  n: "bhjm",
  m: "njk",
};

function isAdjacentOnQwerty(a: string, b: string): boolean {
  const la = a.toLowerCase();
  const lb = b.toLowerCase();
  if (la.length !== 1 || lb.length !== 1) return false;
  if (la === lb) return true;
  const n = KEY_NEIGHBORS[la];
  return n != null && n.includes(lb);
}

/**
 * Whether the typed character counts as the correct first letter for `word`,
 * including case-insensitive match and one adjacent-key typo on QWERTY.
 */
export function firstLetterMatchesWithGrace(word: string, typedRaw: string): boolean {
  const expected = firstLetterFromWord(word);
  if (!expected) return false;
  const t = firstLetterFromWord(typedRaw);
  if (!t) return false;
  const e = expected.toLowerCase();
  const got = t.toLowerCase();
  if (e === got) return true;
  return isAdjacentOnQwerty(e, got);
}
