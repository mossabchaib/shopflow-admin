
-- Add media columns to chat_messages
ALTER TABLE public.chat_messages 
  ADD COLUMN message_type varchar NOT NULL DEFAULT 'text',
  ADD COLUMN file_url varchar,
  ADD COLUMN file_name varchar,
  ADD COLUMN file_type varchar,
  ADD COLUMN duration integer;

-- Create storage bucket for chat files
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-files', 'chat-files', true);

-- RLS for chat-files bucket: participants can upload
CREATE POLICY "Authenticated users can upload chat files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-files');

-- Anyone can view chat files (public bucket)
CREATE POLICY "Anyone can view chat files"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-files');
