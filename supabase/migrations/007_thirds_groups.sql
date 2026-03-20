-- 3/3rds Groups - Discipleship Groups Feature
-- Run in Supabase SQL Editor

-- 1. groups
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_groups_admin_user_id ON groups(admin_user_id);
CREATE INDEX idx_groups_created_at ON groups(created_at DESC);

-- 2. group_members
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);

-- 3. group_invites
CREATE TABLE group_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_group_invites_group_id ON group_invites(group_id);
CREATE INDEX idx_group_invites_email ON group_invites(email);
CREATE INDEX idx_group_invites_token ON group_invites(token);
CREATE INDEX idx_group_invites_status ON group_invites(status);

-- 4. preset_stories (before group_meetings references it)
CREATE TABLE preset_stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse_start INTEGER NOT NULL,
  verse_end INTEGER NOT NULL,
  series_name TEXT,
  series_order INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_preset_stories_series ON preset_stories(series_name, series_order);

-- 5. group_meetings
CREATE TABLE group_meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  title TEXT,
  facilitator_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  story_source_type TEXT NOT NULL CHECK (story_source_type IN ('manual_passage', 'preset_story')),
  book TEXT,
  chapter INTEGER,
  verse_start INTEGER,
  verse_end INTEGER,
  preset_story_id UUID REFERENCES preset_stories(id) ON DELETE SET NULL,
  meeting_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_group_meetings_group_id ON group_meetings(group_id);
CREATE INDEX idx_group_meetings_meeting_date ON group_meetings(meeting_date DESC);
CREATE INDEX idx_group_meetings_status ON group_meetings(status);

-- 6. meeting_participants
CREATE TABLE meeting_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES group_meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  present BOOLEAN NOT NULL DEFAULT TRUE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(meeting_id, user_id)
);

CREATE INDEX idx_meeting_participants_meeting_id ON meeting_participants(meeting_id);

-- 7. lookback_responses
CREATE TABLE lookback_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES group_meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pastoral_care_response TEXT,
  accountability_response TEXT,
  vision_casting_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(meeting_id, user_id)
);

CREATE INDEX idx_lookback_responses_meeting_id ON lookback_responses(meeting_id);

-- 8. prior_obedience_followups
CREATE TABLE prior_obedience_followups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES group_meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prior_commitment_summary TEXT NOT NULL,
  obedience_followup_response TEXT,
  sharing_followup_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(meeting_id, user_id)
);

CREATE INDEX idx_prior_obedience_followups_meeting_id ON prior_obedience_followups(meeting_id);

-- 9. story_retell_assignments
CREATE TABLE story_retell_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES group_meetings(id) ON DELETE CASCADE,
  assigned_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by_mode TEXT NOT NULL CHECK (assigned_by_mode IN ('manual', 'random')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(meeting_id)
);

CREATE INDEX idx_story_retell_assignments_meeting_id ON story_retell_assignments(meeting_id);

-- 10. passage_observations
CREATE TABLE passage_observations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES group_meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  observation_type TEXT NOT NULL CHECK (observation_type IN ('like', 'difficult', 'teaches_about_people', 'teaches_about_god')),
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse_number INTEGER NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_passage_observations_meeting_id ON passage_observations(meeting_id);
CREATE INDEX idx_passage_observations_user_meeting ON passage_observations(meeting_id, user_id, observation_type);

-- 11. lookforward_responses
CREATE TABLE lookforward_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES group_meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  obedience_statement TEXT NOT NULL,
  sharing_commitment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(meeting_id, user_id)
);

CREATE INDEX idx_lookforward_responses_meeting_id ON lookforward_responses(meeting_id);

-- 12. group_practice_assignments
CREATE TABLE group_practice_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES group_meetings(id) ON DELETE CASCADE,
  practice_type TEXT NOT NULL CHECK (practice_type IN ('share_story', 'share_testimony', 'share_gospel', 'role_play_obedience')),
  assigned_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_by_mode TEXT NOT NULL CHECK (assigned_by_mode IN ('manual', 'random')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_group_practice_assignments_meeting_id ON group_practice_assignments(meeting_id);

-- 13. meeting_summaries
CREATE TABLE meeting_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES group_meetings(id) ON DELETE CASCADE UNIQUE,
  summary_json JSONB,
  prayer_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_meeting_summaries_meeting_id ON meeting_summaries(meeting_id);

-- Triggers for updated_at
CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_meetings_updated_at
  BEFORE UPDATE ON group_meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lookback_responses_updated_at
  BEFORE UPDATE ON lookback_responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lookforward_responses_updated_at
  BEFORE UPDATE ON lookforward_responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meeting_summaries_updated_at
  BEFORE UPDATE ON meeting_summaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE preset_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE lookback_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE prior_obedience_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_retell_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE passage_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lookforward_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_practice_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_summaries ENABLE ROW LEVEL SECURITY;

-- Helper: user is group member
CREATE OR REPLACE FUNCTION is_group_member(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id AND user_id = p_user_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: user is group admin
CREATE OR REPLACE FUNCTION is_group_admin(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id AND user_id = p_user_id AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- groups: members can view, admin can update
CREATE POLICY "Group members can view group" ON groups
  FOR SELECT USING (is_group_member(id, auth.uid()));

CREATE POLICY "Group admin can update group" ON groups
  FOR UPDATE USING (is_group_admin(id, auth.uid()));

CREATE POLICY "Authenticated users can create groups" ON groups
  FOR INSERT WITH CHECK (auth.uid() = admin_user_id);

-- group_members: members can view, admin can manage
CREATE POLICY "Group members can view members" ON group_members
  FOR SELECT USING (is_group_member(group_id, auth.uid()));

CREATE POLICY "Group admin can insert members" ON group_members
  FOR INSERT WITH CHECK (is_group_admin(group_id, auth.uid()));

CREATE POLICY "Group admin can update members" ON group_members
  FOR UPDATE USING (is_group_admin(group_id, auth.uid()));

CREATE POLICY "Group admin can delete members" ON group_members
  FOR DELETE USING (is_group_admin(group_id, auth.uid()));

-- group_invites: members can view, admin can manage
CREATE POLICY "Group members can view invites" ON group_invites
  FOR SELECT USING (is_group_member(group_id, auth.uid()));

CREATE POLICY "Group admin can manage invites" ON group_invites
  FOR ALL USING (is_group_admin(group_id, auth.uid()));

-- preset_stories: public read (curated content)
CREATE POLICY "Anyone can read preset stories" ON preset_stories
  FOR SELECT USING (true);

-- group_meetings: members can view, admin can create/update
CREATE POLICY "Group members can view meetings" ON group_meetings
  FOR SELECT USING (is_group_member(group_id, auth.uid()));

CREATE POLICY "Group members can create meetings" ON group_meetings
  FOR INSERT WITH CHECK (is_group_member(group_id, auth.uid()));

CREATE POLICY "Group members can update meetings" ON group_meetings
  FOR UPDATE USING (is_group_member(group_id, auth.uid()));

-- meeting_participants: group members can manage
CREATE POLICY "Group members can view participants" ON meeting_participants
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM group_meetings gm JOIN group_members gmem ON gm.group_id = gmem.group_id
           WHERE gm.id = meeting_id AND gmem.user_id = auth.uid())
  );

CREATE POLICY "Group members can manage participants" ON meeting_participants
  FOR ALL USING (
    EXISTS (SELECT 1 FROM group_meetings gm JOIN group_members gmem ON gm.group_id = gmem.group_id
           WHERE gm.id = meeting_id AND gmem.user_id = auth.uid())
  );

-- lookback_responses: members can view all, users can insert/update own
CREATE POLICY "Group members can view lookback responses" ON lookback_responses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM group_meetings gm JOIN group_members gmem ON gm.group_id = gmem.group_id
           WHERE gm.id = meeting_id AND gmem.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own lookback response" ON lookback_responses
  FOR INSERT WITH CHECK (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM group_meetings gm JOIN group_members gmem ON gm.group_id = gmem.group_id
    WHERE gm.id = meeting_id AND gmem.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own lookback response" ON lookback_responses
  FOR UPDATE USING (auth.uid() = user_id);

-- prior_obedience_followups: same pattern
CREATE POLICY "Group members can view prior followups" ON prior_obedience_followups
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM group_meetings gm JOIN group_members gmem ON gm.group_id = gmem.group_id
           WHERE gm.id = meeting_id AND gmem.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own prior followup" ON prior_obedience_followups
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prior followup" ON prior_obedience_followups
  FOR UPDATE USING (auth.uid() = user_id);

-- story_retell_assignments: group members can manage
CREATE POLICY "Group members can view retell assignments" ON story_retell_assignments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM group_meetings gm JOIN group_members gmem ON gm.group_id = gmem.group_id
           WHERE gm.id = meeting_id AND gmem.user_id = auth.uid())
  );

CREATE POLICY "Group members can manage retell assignments" ON story_retell_assignments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM group_meetings gm JOIN group_members gmem ON gm.group_id = gmem.group_id
           WHERE gm.id = meeting_id AND gmem.user_id = auth.uid())
  );

-- passage_observations: members can view all, users can manage own
CREATE POLICY "Group members can view observations" ON passage_observations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM group_meetings gm JOIN group_members gmem ON gm.group_id = gmem.group_id
           WHERE gm.id = meeting_id AND gmem.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own observation" ON passage_observations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own observation" ON passage_observations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own observation" ON passage_observations
  FOR DELETE USING (auth.uid() = user_id);

-- lookforward_responses: same as lookback
CREATE POLICY "Group members can view lookforward responses" ON lookforward_responses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM group_meetings gm JOIN group_members gmem ON gm.group_id = gmem.group_id
           WHERE gm.id = meeting_id AND gmem.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own lookforward response" ON lookforward_responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lookforward response" ON lookforward_responses
  FOR UPDATE USING (auth.uid() = user_id);

-- group_practice_assignments: group members can manage
CREATE POLICY "Group members can view practice assignments" ON group_practice_assignments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM group_meetings gm JOIN group_members gmem ON gm.group_id = gmem.group_id
           WHERE gm.id = meeting_id AND gmem.user_id = auth.uid())
  );

CREATE POLICY "Group members can manage practice assignments" ON group_practice_assignments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM group_meetings gm JOIN group_members gmem ON gm.group_id = gmem.group_id
           WHERE gm.id = meeting_id AND gmem.user_id = auth.uid())
  );

-- meeting_summaries: group members can view and manage
CREATE POLICY "Group members can view summaries" ON meeting_summaries
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM group_meetings gm JOIN group_members gmem ON gm.group_id = gmem.group_id
           WHERE gm.id = meeting_id AND gmem.user_id = auth.uid())
  );

CREATE POLICY "Group members can manage summaries" ON meeting_summaries
  FOR ALL USING (
    EXISTS (SELECT 1 FROM group_meetings gm JOIN group_members gmem ON gm.group_id = gmem.group_id
           WHERE gm.id = meeting_id AND gmem.user_id = auth.uid())
  );
