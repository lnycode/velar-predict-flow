-- Fix migraine_entries table to have proper user_id field and make id auto-generated
ALTER TABLE migraine_entries 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Ensure user_id column exists and is properly configured
ALTER TABLE migraine_entries 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS policies to ensure proper access
DROP POLICY IF EXISTS "Users can acces only their own migraine data" ON migraine_entries;
DROP POLICY IF EXISTS "Users can delete only their own migraine data" ON migraine_entries;
DROP POLICY IF EXISTS "Users can view only their own migraine data" ON migraine_entries;

CREATE POLICY "Users can manage own migraine data" ON migraine_entries
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);