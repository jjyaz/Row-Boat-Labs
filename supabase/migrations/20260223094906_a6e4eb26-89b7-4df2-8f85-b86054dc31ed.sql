-- Add unique constraint for upsert support on sources
ALTER TABLE public.sources
ADD CONSTRAINT sources_user_source_external_unique
UNIQUE (user_id, source_type, external_id);