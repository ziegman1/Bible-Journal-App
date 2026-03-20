# 3/3rds Groups — Phase 2 Summary

## What Is Complete

### 1. Meeting Creation Flow ✓
- **Route:** `/app/groups/[groupId]/meetings/new`
- **Component:** `MeetingSetupForm`
- Date picker, optional title, passage source selection
- Creates meeting and redirects to live meeting page

### 2. Manual Passage or Preset Story Selection ✓
- **Preset stories:** Radio list grouped by series (Foundations, Gospel, Mission, etc.)
- **Manual passage:** Book dropdown, chapter, verse start/end
- Validation before submit
- Stored in `group_meetings` via `story_source_type`, `preset_story_id`, or `book/chapter/verse_*`

### 3. Facilitator Selection (Manual or Random) ✓
- **Random:** App picks a member at random on create
- **Manual:** Dropdown of group members
- Stored in `group_meetings.facilitator_user_id`

### 4. Live Meeting Page with Three Sections ✓
- **Route:** `/app/groups/[groupId]/meetings/[meetingId]`
- **Component:** `LiveMeetingView` with `ThreeThirdsStepper`
- **Look Back:** Pastoral care, accountability, vision casting
- **Look Up:** Passage display, reteller assignment, verse-linked observations
- **Look Forward:** Obedience, sharing commitments, practice assignment
- Section tabs for navigation between thirds

### 5. Save Participant Responses ✓
- **Look Back:** `saveLookBackResponse` (pastoral, accountability, vision)
- **Prior follow-up:** `savePriorObedienceFollowup` when prior commitments exist
- **Look Up:** `savePassageObservation` (like, difficult, teaches about people/God)
- **Look Forward:** `saveLookForwardResponse` (obedience, sharing)
- All stored in `lookback_responses`, `prior_obedience_followups`, `passage_observations`, `lookforward_responses`

### 6. Meeting Summary Generation ✓
- **Route:** `/app/groups/[groupId]/meetings/[meetingId]/summary`
- **Action:** `generateMeetingSummary` runs when meeting is completed
- Aggregates lookback, lookforward, observations, prior followups, practice
- Prayer summary from pastoral care responses
- Stored in `meeting_summaries` (summary_json, prayer_summary)

### 7. Prior Commitment Accountability Carry-Forward ✓
- `getMeetingDetail` fetches prior meeting’s `lookforward_responses` for current user
- Look Back section shows: “Last week you committed: Obedience: … Sharing: …”
- Separate prompts for obedience follow-up and sharing follow-up
- Saved in `prior_obedience_followups`

---

## Files Changed

| File | Change |
|------|--------|
| `src/app/app/groups/[groupId]/meetings/new/page.tsx` | New meeting creation page |
| `src/app/app/groups/[groupId]/meetings/[meetingId]/page.tsx` | Live meeting page |
| `src/app/app/groups/[groupId]/meetings/[meetingId]/summary/page.tsx` | Meeting summary page |
| `src/components/groups/meeting-setup-form.tsx` | Create meeting form |
| `src/components/groups/live-meeting-view.tsx` | Live meeting container |
| `src/components/groups/three-thirds-stepper.tsx` | Section navigation |
| `src/components/groups/look-back-section.tsx` | Look Back section |
| `src/components/groups/look-up-section.tsx` | Look Up section |
| `src/components/groups/look-forward-section.tsx` | Look Forward section |
| `src/app/actions/meetings.ts` | Meeting actions: create, detail, status, save responses, summary |

---

## What Is Still MVP-Level

| Area | Limitation |
|------|------------|
| **Real-time** | No live updates; participants must refresh to see others’ responses |
| **Email invites** | No email sending; invite link is copied and shared manually |
| **Summary** | Structured JSON only; no AI summary or theme extraction |
| **Passage text** | Uses existing scripture provider (mock or WEB); may be limited for some passages |
| **Practice assignment** | Manual only; no “assign random” UI in Look Forward (only in Look Back) |
| **Reteller** | Random assign only; no manual facilitator-style picker |
| **Mobile** | No touch-specific optimizations |
| **Validation** | Basic validation; no deep checks for passage ranges |

---

## What to Test Manually

1. **Create meeting**
   - Create group → add members → start new meeting
   - Confirm preset story selection works
   - Confirm manual passage (book, chapter, verses) works
   - Confirm facilitator random vs manual

2. **Live meeting**
   - Start meeting (status → active)
   - Fill Look Back (pastoral, accountability, vision)
   - If prior meeting exists: confirm prior commitments appear and follow-up saves
   - Fill Look Up: assign reteller, tap verses, add observations

3. **Look Forward**
   - Confirm obedience and sharing commitments save
   - Assign practice (random)

4. **Complete meeting**
   - Complete meeting → verify summary is generated
   - Open summary page → verify lookback, lookforward, prayer summary

5. **Prior accountability**
   - Complete meeting with commitments
   - Create and complete another meeting
   - Confirm prior commitments appear in Look Back for each participant

6. **Invite flow**
   - Create invite → copy link → open in incognito or different browser
   - Sign in with invited email → confirm redirect to group
