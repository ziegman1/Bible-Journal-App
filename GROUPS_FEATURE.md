# 3/3rds Groups Feature — Architecture Summary

## Overview

The 3/3rds Groups feature adds structured disciple-making groups to BADWR / LogosFlow. Users can form groups, invite members, run meetings using the Look Back / Look Up / Look Forward process, record responses, and carry commitments forward for accountability.

## Database Schema

**Migration:** `supabase/migrations/007_thirds_groups.sql`

### Tables

| Table | Purpose |
|-------|---------|
| `groups` | Group metadata (name, description, admin) |
| `group_members` | Membership with role (admin, member) |
| `group_invites` | Pending invites with token and expiry |
| `preset_stories` | Curated passage list for meetings |
| `group_meetings` | Meeting records (passage, date, status) |
| `meeting_participants` | Who attended each meeting |
| `lookback_responses` | Pastoral care, accountability, vision casting |
| `prior_obedience_followups` | Follow-up on last week's commitments |
| `story_retell_assignments` | Who retells the story |
| `passage_observations` | Verse-linked observations (like, difficult, teaches about people/God) |
| `lookforward_responses` | Obedience and sharing commitments |
| `group_practice_assignments` | Practice activities (share story, testimony, gospel, role-play) |
| `meeting_summaries` | JSON summary and prayer summary |

### RLS

- Group members can view group data
- Group admins can manage invites and members
- Users can only edit their own responses
- Meeting summaries visible to all group members

## Routes

| Route | Purpose |
|-------|---------|
| `/app/groups` | Group list |
| `/app/groups/new` | Create group |
| `/app/groups/[groupId]` | Group overview |
| `/app/groups/[groupId]/members` | Member management (admin) |
| `/app/groups/[groupId]/meetings` | Meeting history |
| `/app/groups/[groupId]/meetings/new` | Create meeting |
| `/app/groups/[groupId]/meetings/[meetingId]` | Live meeting |
| `/app/groups/[groupId]/meetings/[meetingId]/summary` | Meeting summary |
| `/app/groups/invite/[token]` | Accept invite |

## Server Actions

**`src/app/actions/groups.ts`**
- `createGroup`, `listGroupsForUser`, `getGroup`
- `inviteGroupMember`, `acceptGroupInvite`
- `getGroupMembers`, `getGroupInvites`, `removeGroupMember`

**`src/app/actions/meetings.ts`**
- `listGroupMeetings`, `getPresetStories`, `createGroupMeeting`
- `getMeetingDetail`, `updateMeetingStatus`
- `assignFacilitator`, `assignStoryReteller`
- `saveLookBackResponse`, `savePriorObedienceFollowup`
- `savePassageObservation`, `saveLookForwardResponse`
- `assignPracticeActivity`, `generateMeetingSummary`

## Components

| Component | Purpose |
|-----------|---------|
| `GroupCard` | Group list item |
| `CreateGroupForm` | Create group form |
| `GroupInviteManager` | Invite by email, copy link |
| `GroupMemberList` | Members with remove (admin) |
| `MeetingSetupForm` | Passage/story selection, facilitator |
| `ThreeThirdsStepper` | Section navigation |
| `LookBackSection` | Pastoral care, accountability, vision |
| `LookUpSection` | Passage display, observations |
| `LookForwardSection` | Obedience, sharing, practice |
| `LiveMeetingView` | Full meeting flow container |

## Preset Stories

**Migration:** `supabase/migrations/008_preset_stories_seed.sql`

Seeded stories include: Creation, Fall, Abraham, Moses/Passover, David and Goliath, Birth of Jesus, Baptism of Jesus, Jesus Calms the Storm, Lost Son, Great Commission, Pentecost, Philip and Ethiopian, Saul's Conversion, Good Samaritan, Sermon on the Mount.

## Manual Setup

1. **Run migrations** in Supabase SQL Editor:
   - `007_thirds_groups.sql`
   - `008_preset_stories_seed.sql`

2. **Invite flow:** Invites generate shareable links. No email sending in MVP; admin copies the link and sends it manually. Email delivery can be added later.

## MVP Limitations

- No email sending for invites (scaffolded; link-based)
- Summary is structured JSON, not AI-generated (AI can be added later)
- No real-time collaboration (refresh to see others’ responses)
- Passage text uses existing scripture provider (mock or WEB)
