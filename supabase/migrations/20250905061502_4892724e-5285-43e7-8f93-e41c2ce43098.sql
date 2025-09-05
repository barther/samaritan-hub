-- Add viewed_at field to public_intake table for "unread" tracking
ALTER TABLE public.public_intake 
ADD COLUMN viewed_at timestamp with time zone;

-- Add index for efficient querying of unread items
CREATE INDEX idx_public_intake_viewed_at ON public.public_intake(viewed_at) 
WHERE viewed_at IS NULL;

-- Add index for chronological sorting across both tables
CREATE INDEX idx_public_intake_created_at_desc ON public.public_intake(created_at DESC);
CREATE INDEX idx_interactions_occurred_at_desc ON public.interactions(occurred_at DESC);