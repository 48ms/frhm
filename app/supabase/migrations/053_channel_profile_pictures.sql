-- Migration 053: Add avatar_url to client_channels
--
-- The dashboard now requires displaying the actual social media profile picture 
-- of the connected account.

alter table public.client_channels add column if not exists avatar_url text;
