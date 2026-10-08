-- Migration 054: dashboard_profiles.updated_at trigger + sync health helpers
--
-- MASALAH (faktual): cron `api/cron/sync-analytics` melakukan UPDATE pada
-- `dashboard_profiles` (metrics/insights/peak), tapi TIDAK ADA trigger
-- `updated_at` untuk tabel ini. Akibatnya `updated_at` berhenti di waktu INSERT
-- pertama selamanya. Dashboard tidak bisa membedakan "data segar" vs "data lama
-- yang tidak pernah disinkronkan" — indikator sync monitoring jadi bohong.
--
-- SOLUSI: pasang trigger auto-touch `updated_at` (sama seperti client_channels
-- di 014) sehingga setiap penulisan cron membawa timestamp yang jujur.

create or replace function touch_dashboard_profiles()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_dashboard_profiles_touch on public.dashboard_profiles;
create trigger trg_dashboard_profiles_touch
  before update on public.dashboard_profiles
  for each row execute function touch_dashboard_profiles();

-- Index: dashboard sering query by client_id + urut updated_at (sync health)
create index if not exists idx_dashboard_profiles_updated_at
  on public.dashboard_profiles(updated_at desc);
