-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  related_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- RLS Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Function to notify admins when new submission is created
CREATE OR REPLACE FUNCTION public.notify_admins_on_new_submission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_record RECORD;
  contractor_name TEXT;
  doc_type_name TEXT;
BEGIN
  -- Only create notifications for 'submitted' status
  IF NEW.status = 'submitted' THEN
    -- Get contractor name
    SELECT c.name INTO contractor_name
    FROM contractors c
    WHERE c.id = NEW.contractor_id;
    
    -- Get document type name
    SELECT dt.name INTO doc_type_name
    FROM doc_types dt
    WHERE dt.id = NEW.doc_type_id;
    
    -- Create notification for each admin
    FOR admin_record IN 
      SELECT user_id 
      FROM profiles 
      WHERE role IN ('admin', 'super_admin') 
      AND status = 'active'
    LOOP
      INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        related_id
      ) VALUES (
        admin_record.user_id,
        'Hồ sơ mới được nộp',
        contractor_name || ' đã nộp hồ sơ ' || doc_type_name,
        'submission',
        NEW.id
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new submissions
CREATE TRIGGER on_submission_created
AFTER INSERT ON public.submissions
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_on_new_submission();

-- Add index for better performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);