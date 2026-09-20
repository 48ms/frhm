-- Migration 033: Client Telegram Routing Fields (Dual Dispatch Architecture)

ALTER TABLE clients ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS telegram_notif_enabled BOOLEAN DEFAULT FALSE;
