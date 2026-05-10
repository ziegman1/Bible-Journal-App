/**
 * Whether to show the large “What is 3/3rds?” instructional card on `/app/groups`.
 * Logic lives in a plain module so server components avoid `Date.now` in the RSC body (eslint purity).
 */
export function isBrandNewAccountForThirdsInstruction(
  userCreatedAtIso: string | undefined,
  maxAgeDays = 14
): boolean {
  if (!userCreatedAtIso) return false;
  const created = new Date(userCreatedAtIso);
  const ageMs = Date.now() - created.getTime();
  return ageMs >= 0 && ageMs < maxAgeDays * 24 * 60 * 60 * 1000;
}
