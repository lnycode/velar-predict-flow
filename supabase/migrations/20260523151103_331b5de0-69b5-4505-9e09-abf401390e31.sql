-- 1) Profiles UPDATE: add WITH CHECK to prevent user_id reassignment
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2) Subscriptions: explicit restrictive deny for client writes
CREATE POLICY "Deny client inserts on subscriptions"
  ON public.subscriptions
  AS RESTRICTIVE
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (false);

CREATE POLICY "Deny client updates on subscriptions"
  ON public.subscriptions
  AS RESTRICTIVE
  FOR UPDATE
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny client deletes on subscriptions"
  ON public.subscriptions
  AS RESTRICTIVE
  FOR DELETE
  TO anon, authenticated
  USING (false);