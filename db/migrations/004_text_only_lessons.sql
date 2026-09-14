-- Text-only LMS: remove video storage from lessons.
ALTER TABLE lessons DROP COLUMN IF EXISTS video_url;
