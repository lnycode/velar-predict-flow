-- Add DELETE RLS policies for GDPR compliance

-- Allow users to delete their own profile
CREATE POLICY "Users can delete own profile" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = user_id);

-- Allow users to delete their own AI predictions
CREATE POLICY "Users can delete own predictions" 
ON public.ai_predictions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Allow users to delete their own email notifications
CREATE POLICY "Users can delete own notifications" 
ON public.email_notifications 
FOR DELETE 
USING (auth.uid() = user_id);