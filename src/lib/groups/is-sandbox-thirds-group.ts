export function isSandboxThirdsGroupRow(row: {
  badwr_admin_sandbox?: boolean | null;
} | null | undefined): boolean {
  return Boolean(row?.badwr_admin_sandbox);
}
