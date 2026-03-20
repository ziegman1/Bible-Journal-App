# 3/3rds Groups — Phase 1 Summary

## Phase 1 Scope (What Was Implemented)

1. **Database schema and RLS** — groups, group_members, group_invites
2. **Group creation** — create group, become admin
3. **Invite system** — invite by email, shareable link, accept flow
4. **Group list and overview pages** — list groups, view group details
5. **Sidebar integration** — Groups nav item

---

## Files Changed (Phase 1 Only)

| File | Purpose |
|------|---------|
| `src/components/app-shell.tsx` | Added Groups nav item (Users icon) |
| `src/app/app/groups/page.tsx` | Group list page |
| `src/app/app/groups/new/page.tsx` | Create group page |
| `src/app/app/groups/[groupId]/page.tsx` | Group overview page |
| `src/app/app/groups/[groupId]/members/page.tsx` | Member management (admin) |
| `src/app/app/groups/invite/[token]/page.tsx` | Accept invite page |
| `src/components/groups/group-card.tsx` | Group list card |
| `src/components/groups/create-group-form.tsx` | Create group form |
| `src/components/groups/group-invite-manager.tsx` | Invite by email, copy link |
| `src/components/groups/group-member-list.tsx` | Member list with remove |
| `src/app/actions/groups.ts` | createGroup, listGroupsForUser, getGroup, inviteGroupMember, acceptGroupInvite, getGroupMembers, getGroupInvites, removeGroupMember |

---

## Migrations Created

**`supabase/migrations/007_thirds_groups.sql`**

Phase 1 uses these tables from this migration:

| Table | Phase 1 Use |
|-------|-------------|
| `groups` | Group metadata |
| `group_members` | Membership, roles |
| `group_invites` | Pending invites with token |

The same migration also defines Phase 2 tables (preset_stories, group_meetings, meeting_participants, lookback_responses, etc.). For a strict Phase 1-only rollout, you could split 007 into:

- **007a_phase1_groups.sql** — groups, group_members, group_invites + RLS
- **007b_phase2_meetings.sql** — remaining tables

As written, 007 is a single migration that supports both phases.

---

## Manual Setup Steps

1. **Run migration in Supabase SQL Editor**
   - Execute `supabase/migrations/007_thirds_groups.sql`
   - (008_preset_stories_seed.sql is Phase 2 only; skip for Phase 1)

2. **Environment**
   - `NEXT_PUBLIC_SITE_URL` set for invite links (e.g. `https://www.logosflow.app`)

3. **Auth redirect**
   - Add `/app/groups/invite/*` to Supabase Auth → URL Configuration → Redirect URLs if needed (invite accept redirects after login)

---

## Gaps Before Phase 2

| Gap | Notes |
|-----|-------|
| **Meeting routes** | Phase 1 has no `/app/groups/[groupId]/meetings` or meeting creation. Group overview would need a "Start meeting" button that either goes nowhere or shows "Coming soon." |
| **Meeting history** | Group overview shows "Recent meetings" and "Next meeting" — these would be empty until Phase 2. |
| **Preset stories** | Migration 008 seeds preset stories; not needed until Phase 2. |
| **Meeting actions** | `src/app/actions/meetings.ts` is Phase 2. Phase 1 does not need it. |

---

## Phase 1–Only Adjustments (If Rolling Out Incrementally)

If you want to ship Phase 1 without Phase 2:

1. **Group overview page** — Hide or disable "Start new meeting" and "Meeting history" until Phase 2.
2. **Group list page** — Hide "next meeting" / "last meeting" on cards, or show "No meetings yet."
3. **Migrations** — Optionally run only the groups/group_members/group_invites portion of 007 if you split it.

---

## What Phase 1 Delivers

- Create a group (name, description)
- Invite members by email (generates shareable link)
- Accept invite (sign in with invited email, join group)
- View group list with role and membership
- View group overview with member count
- Manage members (admin: invite, remove)
- Groups entry in sidebar navigation
