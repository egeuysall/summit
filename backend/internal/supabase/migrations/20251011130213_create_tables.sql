CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_url TEXT,
  skills TEXT[] DEFAULT '{}',
  credits INTEGER DEFAULT 100 CHECK (credits >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  skill TEXT NOT NULL,
  urgency TEXT DEFAULT 'medium',
  credit_reward INTEGER NOT NULL CHECK (credit_reward > 0),
  requester_id UUID NOT NULL REFERENCES profiles(id),
  claimed_by_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  task_id UUID REFERENCES tasks(id),
  credits INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rewards (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  planet TEXT NOT NULL,
  cost INTEGER NOT NULL CHECK (cost > 0),
  description TEXT
);

-- SEED DATA
INSERT INTO rewards (name, planet, cost, description) VALUES
  ('Mars Express', 'Mars', 1000, 'Quick trip to the red planet'),
  ('Europa Explorer', 'Europa', 2500, 'Dive beneath the ice'),
  ('Titan Adventure', 'Titan', 5000, 'Ultimate space journey'),
  ('Weekend Mars Getaway', 'Mars', 500, '3-day surface visit'),
  ('Asteroid Mining Tour', 'Asteroid Belt', 3000, 'Zero-g mining experience');

-- INDEXES
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_requester ON tasks(requester_id);
CREATE INDEX idx_tasks_claimed_by ON tasks(claimed_by_id);
CREATE INDEX idx_profiles_credits ON profiles(credits DESC);

-- ROW LEVEL SECURITY
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- TASKS POLICIES
CREATE POLICY "Anyone can view tasks"
  ON tasks FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Requesters and claimers can update tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = claimed_by_id);

CREATE POLICY "Requesters can delete their open tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = requester_id AND status = 'open');

-- TRANSACTIONS POLICIES
CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

-- REWARDS POLICIES (read-only)
CREATE POLICY "Anyone can view rewards"
  ON rewards FOR SELECT
  USING (true);
