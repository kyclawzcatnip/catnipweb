-- ==============================================================================
-- CATNIP STUDIOS — COMMUNITY VOTING SYSTEM SCHEMA & SECURITY DEFINITION
-- ==============================================================================

-- 1. PROFILES TABLE
-- Extends auth.users to provide voter profile metadata and admin role flags.
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT DEFAULT 'Community Feline',
  avatar_url TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. VOTING ROUNDS TABLE
-- Tracks individual voting cycles with lifecycle statuses (open, closed, archived).
CREATE TABLE IF NOT EXISTS public.voting_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'archived')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  winner_game_id UUID, -- References games(id) (FK added after games table creation)
  start_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on voting_rounds
ALTER TABLE public.voting_rounds ENABLE ROW LEVEL SECURITY;

-- 3. GAMES TABLE
-- Candidate games eligible for community votes.
CREATE TABLE IF NOT EXISTS public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  round_id UUID REFERENCES public.voting_rounds(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on games
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Add foreign key from voting_rounds.winner_game_id to games(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_voting_rounds_winner_game'
  ) THEN
    ALTER TABLE public.voting_rounds
    ADD CONSTRAINT fk_voting_rounds_winner_game
    FOREIGN KEY (winner_game_id) REFERENCES public.games(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 4. VOTES TABLE
-- Stores individual community votes.
CREATE TABLE IF NOT EXISTS public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  round_id UUID NOT NULL REFERENCES public.voting_rounds(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  
  -- Critical constraint: exactly one vote per user per round
  CONSTRAINT uq_votes_user_round UNIQUE (user_id, round_id)
);

-- Enable RLS on votes
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Helpful indexes for high performance leaderboard calculations
CREATE INDEX IF NOT EXISTS idx_votes_round_id ON public.votes(round_id);
CREATE INDEX IF NOT EXISTS idx_votes_game_id ON public.votes(game_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON public.votes(user_id);
CREATE INDEX IF NOT EXISTS idx_games_round_id ON public.games(round_id);
CREATE INDEX IF NOT EXISTS idx_voting_rounds_status ON public.voting_rounds(status);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Helper function: Is Current User Admin?
-- Checks both profiles.is_admin and JWT claims for verified studio developer / admin emails.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    (
      auth.jwt()->>'email' ILIKE '%kyan%' OR
      auth.jwt()->>'email' ILIKE '%catnip%' OR
      auth.jwt()->>'email' ILIKE '%admin%' OR
      auth.jwt()->>'email' ILIKE '%developer%'
    ),
    false
  );
$$;

-- PROFILES POLICIES
-- Anyone can view profiles (needed for display names on votes or leaderboard)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

-- Authenticated users can insert their own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile, but CANNOT self-escalate is_admin!
DROP POLICY IF EXISTS "Users can update own profile non-admin" ON public.profiles;
CREATE POLICY "Users can update own profile non-admin" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND (
      is_admin = (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
      OR public.is_admin()
    )
  );

-- Admins can update any profile (e.g. promoting moderators)
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR ALL USING (public.is_admin());

-- VOTING ROUNDS POLICIES
-- Everyone can view all voting rounds (active, closed, archived)
DROP POLICY IF EXISTS "Voting rounds are viewable by everyone" ON public.voting_rounds;
CREATE POLICY "Voting rounds are viewable by everyone" ON public.voting_rounds
  FOR SELECT USING (true);

-- Only admins can insert, update, or delete voting rounds
DROP POLICY IF EXISTS "Admins can insert voting rounds" ON public.voting_rounds;
CREATE POLICY "Admins can insert voting rounds" ON public.voting_rounds
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update voting rounds" ON public.voting_rounds;
CREATE POLICY "Admins can update voting rounds" ON public.voting_rounds
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete voting rounds" ON public.voting_rounds;
CREATE POLICY "Admins can delete voting rounds" ON public.voting_rounds
  FOR DELETE USING (public.is_admin());

-- GAMES POLICIES
-- Everyone can view games
DROP POLICY IF EXISTS "Games are viewable by everyone" ON public.games;
CREATE POLICY "Games are viewable by everyone" ON public.games
  FOR SELECT USING (true);

-- Only admins can manage games
DROP POLICY IF EXISTS "Admins can insert games" ON public.games;
CREATE POLICY "Admins can insert games" ON public.games
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update games" ON public.games;
CREATE POLICY "Admins can update games" ON public.games
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete games" ON public.games;
CREATE POLICY "Admins can delete games" ON public.games
  FOR DELETE USING (public.is_admin());

-- VOTES POLICIES
-- Everyone can view votes (allows public tallying & verification)
DROP POLICY IF EXISTS "Votes are viewable by everyone" ON public.votes;
CREATE POLICY "Votes are viewable by everyone" ON public.votes
  FOR SELECT USING (true);

-- Inserting votes:
-- 1. Voter identity must match auth.uid()
-- 2. Round must be status = 'open'
-- 3. Game must be available and belong to the round (or eligible)
DROP POLICY IF EXISTS "Users can cast own vote in open round" ON public.votes;
CREATE POLICY "Users can cast own vote in open round" ON public.votes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.voting_rounds
      WHERE id = round_id AND status = 'open'
    ) AND
    EXISTS (
      SELECT 1 FROM public.games
      WHERE id = game_id AND is_available = true AND (round_id IS NULL OR round_id = votes.round_id)
    )
  );

-- Updating votes (changing vote):
-- 1. User must own the vote
-- 2. Round ID cannot be changed (prevents bypassing round limits)
-- 3. Round must be open
-- 4. Target game must be available and belong to the round
DROP POLICY IF EXISTS "Users can change own vote in open round" ON public.votes;
CREATE POLICY "Users can change own vote in open round" ON public.votes
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND
    round_id = (SELECT v.round_id FROM public.votes v WHERE v.id = votes.id) AND
    EXISTS (
      SELECT 1 FROM public.voting_rounds
      WHERE id = round_id AND status = 'open'
    ) AND
    EXISTS (
      SELECT 1 FROM public.games
      WHERE id = game_id AND is_available = true AND (round_id IS NULL OR round_id = votes.round_id)
    )
  );

-- Deleting votes: only the voter during an open round or an admin
DROP POLICY IF EXISTS "Users can retract vote in open round or admin" ON public.votes;
CREATE POLICY "Users can retract vote in open round or admin" ON public.votes
  FOR DELETE USING (
    (auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM public.voting_rounds WHERE id = round_id AND status = 'open'
    )) OR public.is_admin()
  );

-- ==============================================================================
-- DATABASE FUNCTIONS & TRIGGERS
-- ==============================================================================

-- 1. Automatic user profile creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_is_admin BOOLEAN := false;
  v_email TEXT;
BEGIN
  v_email := lower(COALESCE(new.email, ''));
  IF v_email LIKE '%kyan%' OR v_email LIKE '%catnip%' OR v_email LIKE '%admin%' OR v_email LIKE '%developer%' THEN
    v_is_admin := true;
  END IF;

  INSERT INTO public.profiles (id, display_name, is_admin)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'name', 'Feline Citizen'),
    v_is_admin
  )
  ON CONFLICT (id) DO UPDATE SET
    is_admin = CASE WHEN v_is_admin THEN true ELSE public.profiles.is_admin END;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Prevent non-admin users from escalating is_admin in profiles
CREATE OR REPLACE FUNCTION public.prevent_profile_admin_escalation()
RETURNS trigger AS $$
BEGIN
  IF NEW.is_admin <> OLD.is_admin AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access Denied: Only administrators can modify administrative privileges.';
  END IF;
  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_prevent_admin_escalation ON public.profiles;
CREATE TRIGGER tr_prevent_admin_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_admin_escalation();

-- 3. cast_vote() RPC
-- Encapsulates atomic vote casting / vote switching with complete database validation
CREATE OR REPLACE FUNCTION public.cast_vote(p_game_id UUID, p_round_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_round_status TEXT;
  v_game_available BOOLEAN;
  v_game_round_id UUID;
  v_existing_vote_id UUID;
  v_existing_game_id UUID;
  v_action TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to vote';
  END IF;

  -- Ensure profile exists
  INSERT INTO public.profiles (id, is_admin)
  VALUES (v_user_id, false)
  ON CONFLICT (id) DO NOTHING;

  -- Validate round
  SELECT status INTO v_round_status
  FROM public.voting_rounds
  WHERE id = p_round_id;

  IF v_round_status IS NULL THEN
    RAISE EXCEPTION 'Voting round % not found', p_round_id;
  END IF;

  IF v_round_status <> 'open' THEN
    RAISE EXCEPTION 'Voting round is currently % (only open rounds accept votes)', v_round_status;
  END IF;

  -- Validate candidate game
  SELECT is_available, round_id INTO v_game_available, v_game_round_id
  FROM public.games
  WHERE id = p_game_id;

  IF v_game_available IS NULL THEN
    RAISE EXCEPTION 'Candidate game % not found', p_game_id;
  END IF;

  IF NOT v_game_available THEN
    RAISE EXCEPTION 'This game is currently disabled and cannot receive votes';
  END IF;

  IF v_game_round_id IS NOT NULL AND v_game_round_id <> p_round_id THEN
    RAISE EXCEPTION 'This game does not belong to the selected voting round';
  END IF;

  -- Check existing vote for this user in this round
  SELECT id, game_id INTO v_existing_vote_id, v_existing_game_id
  FROM public.votes
  WHERE user_id = v_user_id AND round_id = p_round_id;

  IF v_existing_vote_id IS NOT NULL THEN
    IF v_existing_game_id = p_game_id THEN
      -- Already voted for this game
      RETURN jsonb_build_object(
        'success', true,
        'action', 'unchanged',
        'round_id', p_round_id,
        'game_id', p_game_id,
        'message', 'Vote is already cast for this game'
      );
    END IF;

    -- Update vote (change vote)
    UPDATE public.votes
    SET game_id = p_game_id, updated_at = timezone('utc'::text, now())
    WHERE id = v_existing_vote_id;
    v_action := 'switched';
  ELSE
    -- Insert fresh vote
    INSERT INTO public.votes (user_id, round_id, game_id)
    VALUES (v_user_id, p_round_id, p_game_id);
    v_action := 'created';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'action', v_action,
    'round_id', p_round_id,
    'game_id', p_game_id,
    'previous_game_id', v_existing_game_id
  );
END;
$$;

-- 4. start_new_voting_round() RPC
CREATE OR REPLACE FUNCTION public.start_new_voting_round(
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_game_ids UUID[] DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_round_id UUID;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin privileges required to start a new voting round';
  END IF;

  -- 1. Archive previous open rounds without deleting any votes or rounds
  UPDATE public.voting_rounds
  SET status = 'archived', is_active = false, updated_at = timezone('utc'::text, now())
  WHERE status = 'open' OR is_active = true;

  -- 2. Insert new round
  INSERT INTO public.voting_rounds (title, description, status, is_active, start_date)
  VALUES (p_title, p_description, 'open', true, timezone('utc'::text, now()))
  RETURNING id INTO v_new_round_id;

  -- 3. If specific game IDs provided, associate them with this round
  IF p_game_ids IS NOT NULL AND array_length(p_game_ids, 1) > 0 THEN
    UPDATE public.games
    SET round_id = v_new_round_id
    WHERE id = ANY(p_game_ids);
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'round_id', v_new_round_id,
    'title', p_title
  );
END;
$$;

-- 5. declare_voting_winner() RPC
CREATE OR REPLACE FUNCTION public.declare_voting_winner(
  p_round_id UUID,
  p_winner_game_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin privileges required to declare a round winner';
  END IF;

  UPDATE public.voting_rounds
  SET winner_game_id = p_winner_game_id,
      status = 'closed',
      is_active = false,
      end_date = COALESCE(end_date, timezone('utc'::text, now())),
      updated_at = timezone('utc'::text, now())
  WHERE id = p_round_id;

  RETURN jsonb_build_object(
    'success', true,
    'round_id', p_round_id,
    'winner_game_id', p_winner_game_id
  );
END;
$$;

-- 6. safe_delete_game() RPC
-- Prevents accidental deletion of games that have historical votes!
CREATE OR REPLACE FUNCTION public.safe_delete_game(p_game_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vote_count INT;
  v_game_name TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin privileges required to manage games';
  END IF;

  SELECT name INTO v_game_name FROM public.games WHERE id = p_game_id;
  IF v_game_name IS NULL THEN
    RAISE EXCEPTION 'Game % not found', p_game_id;
  END IF;

  SELECT COUNT(*) INTO v_vote_count FROM public.votes WHERE game_id = p_game_id;

  IF v_vote_count > 0 THEN
    -- Safety mechanism: Rather than destroying vote history, disable the game
    UPDATE public.games
    SET is_available = false, updated_at = timezone('utc'::text, now())
    WHERE id = p_game_id;

    RETURN jsonb_build_object(
      'success', true,
      'action', 'disabled',
      'message', format('Game "%s" has %s historical votes. To protect voting history, it was disabled instead of deleted.', v_game_name, v_vote_count)
    );
  ELSE
    DELETE FROM public.games WHERE id = p_game_id;
    RETURN jsonb_build_object(
      'success', true,
      'action', 'deleted',
      'message', format('Game "%s" had no votes and was safely deleted.', v_game_name)
    );
  END IF;
END;
$$;

-- ==============================================================================
-- REALTIME SUBSCRIPTIONS
-- ==============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.voting_rounds;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.games;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ==============================================================================
-- DEFAULT SEED DATA
-- ==============================================================================
DO $$
DECLARE
  v_round_id UUID;
BEGIN
  -- Check if any round exists
  IF NOT EXISTS (SELECT 1 FROM public.voting_rounds) THEN
    INSERT INTO public.voting_rounds (title, description, status, is_active)
    VALUES (
      'Round 1: Next Catnip Game Development Priority',
      'Cast your vote for the next major game Catnip Studios should build! The winning game will become our top studio roadmap priority.',
      'open',
      true
    )
    RETURNING id INTO v_round_id;

    INSERT INTO public.games (name, description, image_url, is_available, round_id) VALUES
    (
      'Catnip Dungeons',
      'A thrilling roguelike dungeon crawler featuring procedural feline catacombs, elemental meow magic spells, and legendary paw artifacts.',
      'https://images.unsplash.com/photo-1548802673-380ab8ebc7b7?w=600&auto=format&fit=crop&q=80',
      true,
      v_round_id
    ),
    (
      'Cat Ship Builder 3D',
      'Design, engineer, and captain modular naval cat ships with realistic wave buoyancy and cannon artillery in full 3D physics.',
      'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop&q=80',
      true,
      v_round_id
    ),
    (
      'Cat Tower Defense',
      'Deploy tactical feline battalions, yarn ball barricades, and laser-pointer towers along winding trails to halt the rodent invasion.',
      'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=600&auto=format&fit=crop&q=80',
      true,
      v_round_id
    ),
    (
      'The Great Fish Heist',
      'A stealth feline infiltration adventure. Sneak through high-security canine warehouses and laser grids to liberate the mythical Golden Salmon.',
      'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=600&auto=format&fit=crop&q=80',
      true,
      v_round_id
    ),
    (
      'Cattie Tank War',
      'Explosive armored cat warfare with deformable terrain, bouncing yarn-ball shells, and fast-paced multiplayer squad combat.',
      'https://images.unsplash.com/photo-1561948955-570b270e7c36?w=600&auto=format&fit=crop&q=80',
      true,
      v_round_id
    );
  END IF;
END $$;
