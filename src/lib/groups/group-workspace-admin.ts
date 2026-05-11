/**
 * Who counts as a 3/3rds “group admin” for workspace / meeting setup decisions.
 * Aligns with `GroupOverviewPage` `canManageGroup` (role admin or `groups.admin_user_id`).
 */
export function isGroupWorkspaceAdmin(args: {
  membershipRole: string;
  groupAdminUserId: string | null | undefined;
  currentUserId: string;
}): boolean {
  return (
    args.membershipRole === "admin" ||
    Boolean(
      args.groupAdminUserId &&
        args.groupAdminUserId === args.currentUserId
    )
  );
}

/**
 * Most groups need two members before meetings; group admins may start alone
 * (planning, dry run, or while invites are pending).
 */
export function canStartThirdsMeetings(args: {
  memberCount: number;
  isSandboxGroup: boolean;
  isGroupWorkspaceAdmin: boolean;
}): boolean {
  if (args.isSandboxGroup) return true;
  if (args.memberCount >= 2) return true;
  return args.isGroupWorkspaceAdmin && args.memberCount >= 1;
}
