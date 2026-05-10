/** Copy for OS SMS / email handoff when inviting someone into the Guided Journey. */

export function journeyInviteEmailSubject(): string {
  return "Walking together in discipleship";
}

export function journeyInviteShareBody(inviteeName: string): string {
  const who = inviteeName.trim() || "friend";
  return [
    `Hey ${who},`,
    "",
    "I'm walking through a discipleship journey and I'd love to have you walk alongside me for a stretch. You don't need anything figured out—I'm still learning too. If you're open to it, I'd love to share more.",
    "",
    "Would love to hear what you think.",
  ].join("\n");
}
