-- Create comprehensive backend for Velar app
-- User profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  timezone TEXT DEFAULT 'UTC',
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  location_name TEXT,
  migraine_type TEXT,
  known_triggers TEXT,
  current_medications TEXT,
  weather_sensitivity TEXT DEFAULT 'medium',
  subscription_tier TEXT DEFAULT 'free',
  subscription_active BOOLEAN DEFAULT false,
  subscription_end TIMESTAMPTZ,
  ai_predictions_enabled BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  weather_alerts BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profile policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- AI predictions table
CREATE TABLE public.ai_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prediction_type TEXT NOT NULL, -- 'weather_risk', 'pattern_alert', 'medication_reminder'
  risk_level INTEGER NOT NULL, -- 1-10 scale
  confidence DOUBLE PRECISION NOT NULL, -- 0-1 confidence score
  weather_data JSONB,
  prediction_factors JSONB,
  predicted_for TIMESTAMPTZ NOT NULL,
  actual_outcome BOOLEAN, -- null until confirmed
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on AI predictions
ALTER TABLE public.ai_predictions ENABLE ROW LEVEL SECURITY;

-- AI predictions policies
CREATE POLICY "Users can view own predictions" ON public.ai_predictions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own predictions" ON public.ai_predictions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Email notifications log
CREATE TABLE public.email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'sent',
  metadata JSONB
);

-- Enable RLS on email notifications
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

-- Email notifications policies
CREATE POLICY "Users can view own notifications" ON public.email_notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Subscriptions table for premium features
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  tier TEXT NOT NULL DEFAULT 'free', -- 'free', 'premium', 'pro'
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Subscription policies
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  
  INSERT INTO public.subscriptions (user_id, tier, status)
  VALUES (NEW.id, 'free', 'active');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update existing migraine_entries table with user_id if not exists
ALTER TABLE public.migraine_entries 
ADD COLUMN IF NOT EXISTS severity INTEGER,
ADD COLUMN IF NOT EXISTS duration INTEGER,
ADD COLUMN IF NOT EXISTS medication_taken TEXT,
ADD COLUMN IF NOT EXISTS effectiveness INTEGER;