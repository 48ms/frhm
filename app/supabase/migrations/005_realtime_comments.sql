-- Migration: 005_realtime_comments.sql
-- Description: Enable Supabase Realtime on the comments table so both
--              admin and client see new comments without a refresh (T027).

ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
