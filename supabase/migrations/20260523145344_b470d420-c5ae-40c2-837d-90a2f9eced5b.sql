-- Cycle tracking on entries
ALTER TABLE public.migraine_entries
  ADD COLUMN IF NOT EXISTS cycle_day integer;

-- Cycle settings on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS track_cycle boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS cycle_length_days integer DEFAULT 28,
  ADD COLUMN IF NOT EXISTS last_period_start date;

-- Weekly AI insights
CREATE TABLE IF NOT EXISTS public.weekly_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  summary text NOT NULL,
  metrics jsonb,
  model text DEFAULT 'google/gemini-2.5-flash',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS weekly_insights_user_period_idx
  ON public.weekly_insights(user_id, period_start DESC);

ALTER TABLE public.weekly_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own weekly insights"
  ON public.weekly_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own weekly insights"
  ON public.weekly_insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own weekly insights"
  ON public.weekly_insights FOR DELETE
  USING (auth.uid() = user_id);

-- Shared (doctor) reports
CREATE TABLE IF NOT EXISTS public.shared_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token text NOT NULL UNIQUE,
  title text NOT NULL DEFAULT 'Clinical summary',
  period_start date NOT NULL,
  period_end date NOT NULL,
  payload jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked boolean NOT NULL DEFAULT false,
  view_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shared_reports_token_idx ON public.shared_reports(token);
CREATE INDEX IF NOT EXISTS shared_reports_user_idx ON public.shared_reports(user_id);

ALTER TABLE public.shared_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own shared reports"
  ON public.shared_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users create own shared reports"
  ON public.shared_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own shared reports"
  ON public.shared_reports FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own shared reports"
  ON public.shared_reports FOR DELETE
  USING (auth.uid() = user_id);

-- Public read of non-expired, non-revoked reports by token (handled in edge fn with service role,
-- but expose a SECURITY DEFINER function for any direct anon access pattern in future)
CREATE OR REPLACE FUNCTION public.get_shared_report(_token text)
RETURNS public.shared_reports
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.shared_reports
  WHERE token = _token
    AND revoked = false
    AND expires_at > now()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_shared_report(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_shared_report(text) TO anon, authenticated;