
-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by owner" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Profiles insertable by owner" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Profiles updatable by owner" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- challenges catalog (public read)
CREATE TABLE public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  account_size NUMERIC NOT NULL,
  profit_target_pct NUMERIC NOT NULL,
  max_daily_loss_pct NUMERIC NOT NULL,
  max_total_loss_pct NUMERIC NOT NULL,
  price NUMERIC NOT NULL,
  profit_split_pct NUMERIC NOT NULL DEFAULT 80,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.challenges TO anon, authenticated;
GRANT ALL ON public.challenges TO service_role;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Challenges are public" ON public.challenges FOR SELECT USING (true);

INSERT INTO public.challenges (name, account_size, profit_target_pct, max_daily_loss_pct, max_total_loss_pct, price, description) VALUES
('Starter $10K', 10000, 8, 5, 10, 99, 'Perfect for beginners. Hit 8% profit to get funded.'),
('Trader $25K', 25000, 8, 5, 10, 199, 'Step up your game with a mid-tier account.'),
('Pro $50K', 50000, 8, 5, 10, 299, 'For serious traders ready to scale.'),
('Elite $100K', 100000, 8, 5, 10, 549, 'Six-figure firepower for proven traders.'),
('Veteran $200K', 200000, 8, 5, 10, 999, 'Maximum buying power. Maximum payouts.');

-- user_challenges
CREATE TABLE public.user_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id),
  starting_balance NUMERIC NOT NULL,
  current_balance NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- active | passed | failed
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.user_challenges (user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_challenges TO authenticated;
GRANT ALL ON public.user_challenges TO service_role;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own user_challenges select" ON public.user_challenges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own user_challenges insert" ON public.user_challenges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own user_challenges update" ON public.user_challenges FOR UPDATE USING (auth.uid() = user_id);

-- trades
CREATE TABLE public.trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_challenge_id UUID NOT NULL REFERENCES public.user_challenges(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL, -- buy | sell
  size NUMERIC NOT NULL,
  entry_price NUMERIC NOT NULL,
  exit_price NUMERIC,
  pnl NUMERIC,
  status TEXT NOT NULL DEFAULT 'open', -- open | closed
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ
);
CREATE INDEX ON public.trades (user_id);
CREATE INDEX ON public.trades (user_challenge_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trades TO authenticated;
GRANT ALL ON public.trades TO service_role;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own trades select" ON public.trades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own trades insert" ON public.trades FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own trades update" ON public.trades FOR UPDATE USING (auth.uid() = user_id);

-- auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
