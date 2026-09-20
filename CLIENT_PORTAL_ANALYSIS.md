# Client Portal Analysis & Proposal

**Analisis penuh client portal workspace**, 20 Sep 2026

---

## Executive Summary

Analisis terhadap client portal mengidentifikasi **4 spec** yang sudah ada, dari mana **3 masih aktif** (belum di-archive). Dari ketiganya, **2 sudah terpenuhi**, 1 masih gap. Total terdeteksi **7 gap fungsional & implementasi** yang perlu perbaikan.

### Status Spec Client

| Spec | Tasks | Status | Catatan |
|------|-------|--------|---------|
| `quick-onboarding` | 4 | ✅ Done | Di-archive (2026-09-19) |
| `brand-profile-editor` | 4 | ✅ Done | Di-archive (2026-09-20) |
| `mobile-navigation` | 2 | ⚠️ Partial | **Implementasi ada**, 1 dari 2 scenario gagal |
| `brand-asset-hub` | 2 | ✅ Done | Implementasi ada, belum di-archive |
| `roi-dashboard` | 1 | ❌ Gap | **Spec client-facing, implementasi admin-side** |

---

## Gap Analysis Detail

### 1. Critical Gap: `roi-dashboard` (Spec Client-Facing, Implementasi Admin)

**Spec Requirement:**
```
WHEN a client logs in and views their executive dashboard
THEN they see charts comparing their monthly spend against the number of content pieces produced and total views achieved
```

**Implementasi Saat Ini:**
- File: `components/marketing/roi-dashboard-board.tsx` (9492 bytes)
- Digunakan di: `app/admin/clients/[id]/workspace.tsx` (tab "ROI Dashboard")
- **Client portal** (`/client/dashboard`) tidak memuat ROI view sama sekali
- Dashboard client hanya berisi:
  - Card Notifikasi Telegram
  - List Deliverable Production
  - Feedback Dialog

**Root Cause:**
- Spec mendefinisikan view untuk **client**, tapi implementasi dibuat untuk admin
- Tidak ada routing/section ROI di `/client` area

**Suggested Fix:**
1. **Pisahkan spec** menjadi dua:
   - `client/roi-dashboard` (simplified, client-facing)
   - `admin/roi-dashboard` (detail, admin-facing)
2. Implementasi ROI client:
   - Fetch data dari DB `ad_spend_logs`, `content_metrics`, `deliverables`
   - Tampilkan 3 chart sederhana: Total Spend vs Content Count vs Total Views

---

### 2. Critical Gap: `mobile-navigation` Badge Status Mismatch

**Spec Requirement:**
```
WHEN a client has 2 deliverables in 'review' status
THEN the Deliverables icon in the bottom navigation shows a prominent '2' badge
```

**Implementasi Saat Ini:**
- File: `components/bottom-nav.tsx` (2753 bytes)
- Badge logic di line 54-56:
  ```tsx
  ...(item.url === "/client/deliverables" && pendingCount > 0
    ? { badge: String(pendingCount) }
    : {}),
  ```
- `pendingCount` dihitung dari `deliverables` table dengan status **`'sent'`** (line 16-18 di `app/client/layout.tsx`):
  ```tsx
  .from("deliverables")
  .select("id", { count: "exact", head: true })
  .eq("client_id", profile?.client_id ?? "")
  .eq("status", "sent")
  ```

**Root Cause:**
- Spec menggunakan status `'review'`, implementasi menggunakan `'sent'`
- Status `'review'` tidak ada di DB (coba query → 0 results)
- DB menggunakan status: `draft`, `sent`, `approved`, `revision_requested`

**Suggested Fix:**
1. **Update spec** atau **update code**:
   - Opsi A (pilih spec): Ganti `'review'` → `'sent'` di spec
   - Opsi B (pilih code): Ganti status filter di code → `'revision_requested'` (lebih sesuai untuk "pending client approval")
2. **Verifikasi**: Test dengan 1 deliverable status `revision_requested` → badge muncul

---

### 3. Critical Gap: Dead Link `/client/settings`

**Issue:**
- Bottom nav item "Akun" (`components/bottom-nav.tsx` line 41-44):
  ```tsx
  {
    title: "Akun",
    url: "/client/settings",
    ...
  }
  ```
- **Folder `app/client/settings` TIDAK ADA** → 404 saat client tap

**Suggested Fix:**
1. **Hapus atau disable** item "Akun" dari bottom-nav sementara
2. **Implementasi** `/client/settings` page dengan:
   - Profile form (full_name, contact info)
   - Change password dialog
   - Telegram connection preferences

---

### 4. UI Bug: Bottom Nav Grid Mismatch

**Issue:**
- `components/bottom-nav.tsx` line 61:
  ```tsx
  <div className="grid h-full w-full grid-cols-5">
  ```
- **Items ada 6** (Dashboard, Progres, Kalender, Deliverable, Approvals, Akun)
- Grid 5 kolom → item ke-6 wrap ke baris kedua → layout rusak

**Suggested Fix:**
1. Ganti `grid-cols-5` → `grid-cols-6`
2. Atau kurangi item: hapus "Akun" karena belum ada page-nya

---

### 5. Missing Feature: Feedback Form (Database)

**Code Reference:**
- `app/components/client/feedback-dialog.tsx` (4715 bytes)
- `app/api/client/[id]/feedback/route.ts` (2954 bytes)

**Issue:**
- Component & API route **ada**, tapi **tidak ada DB table** `feedback_entries` atau `feedback_forms`
- Query ke Supabase → **404 error**

**Suggested Fix:**
1. **Buat migration** untuk tabel:
   ```sql
   CREATE TABLE feedback_entries (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
     message TEXT NOT NULL,
     status TEXT DEFAULT 'pending', -- pending, in_progress, resolved
     created_at TIMESTAMPTZ DEFAULT now()
   );
   ```
2. Update API route untuk insert ke tabel ini

---

### 6. Missing Feature: Brand Asset Storage (Database)

**Code Reference:**
- `app/components/client/brand-asset-hub.tsx` (5852 bytes)
- Digunakan di admin workspace tab "Brand Assets"

**Issue:**
- Component **ada**, tapi **tidak ada DB table** `brand_assets`
- Query ke Supabase → **404 error**
- **Storage bucket `brand_assets` juga tidak ada** (Supabase error 400)

**Suggested Fix:**
1. **Buat migration** untuk tabel:
   ```sql
   CREATE TABLE brand_assets (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
     category TEXT, -- logos, fonts, colors, guidelines, raw_footage
     file_path TEXT,
     file_type TEXT,
     guidelines TEXT, -- JSON/JSONB untuk brand guidelines
     created_at TIMESTAMPTZ DEFAULT now()
   );
   ```
2. **Setup storage bucket** di Supabase console untuk `brand_assets`

---

### 7. Partial Implementation: Event Workspace

**Code Reference:**
- `components/events/event-workspace-board.tsx` (2552 bytes)
- **MIGRASI ADA**: `supabase/migrations/20260918141819_fase_3_erp_tables.sql` (7529 bytes)

**Issue:**
- DB table `events`, `event_tasks`, `event_vendors` **ADA** di migration
- **Tapi belum di-push ke Supabase** (query → 404)
- Component masih **stub/placeholder** ("Rundown content goes here")

**Suggested Fix:**
1. **Push migration** ke Supabase:
   ```bash
   npx supabase db push --db-url <connection-string>
   ```
2. **Implementasi fetch logic** di component:
   - Fetch events dari DB
   - Render list event
   - On click → load rundown/vendors/checklist

---

## Summary & Priorities

### Priority 1: Critical & Blocker

| Gap | Effort | Impact |
|-----|--------|--------|
| **Dead link `/client/settings`** | 1-2 jam | High | Client error 404 |
| **Bottom nav grid bug** | 5 menit | High | UI rusak di mobile |
| **Database tables missing** | 2-3 jam | Medium | Feature broken |

### Priority 2: Spec Alignment

| Gap | Effort | Impact |
|-----|--------|--------|
| **roi-dashboard** | 3-4 jam | High | Spec tidak sesuai |
| **mobile-navigation status** | 15 menit | Medium | Badge tidak muncul |

### Priority 3: Feature Completion

| Gap | Effort | Impact |
|-----|--------|--------|
| **Event workspace** | 4-6 jam | Medium | Placeholder belum full |

---

## Proposed Changes to OpenSpec

### 1. Split ROI Dashboard Spec

**File:** `openspec/specs/client/roi-dashboard/spec.md` → **hapus/ubah**

**Pengganti:**
- `openspec/specs/client/roi-dashboard-basic/spec.md` (1-2 scenario, client-facing)
- `openspec/specs/admin/roi-dashboard/spec.md` (existing, admin-facing)

### 2. Update Mobile Navigation Spec

**File:** `openspec/specs/client/mobile-navigation/spec.md`

**Change:**
```diff
- THEN a client has 2 deliverables in 'review' status
+ THEN a client has 2 deliverables in 'sent' status
```

### 3. Archive Completed Specs

**Spec:** `brand-asset-hub`

**Action:**
```bash
openspec archive brand-asset-hub
```

**Catatan:**
- Spec ini **belum di-archive**
- Implementasi **sudah ada** (components/client/brand-asset-hub.tsx)
- **Tapi DB masih kosong** → perlu push migration dulu

---

## Next Steps

### Immediate (Today)

1. ✅ **Archive `brand-asset-hub`** (opsional, tergantung apakah migration sudah di-push)
2. ✅ **Fix bottom nav grid** → `grid-cols-5` → `grid-cols-6`
3. ✅ **Hapus/disable "Akun" link** dari bottom nav
4. ✅ **Update mobile-navigation spec** → ganti 'review' → 'sent'

### Short-term (This Week)

1. ✅ **Push migration** untuk DB tables yang missing (event, brand_assets, feedback)
2. ✅ **Setup storage bucket** di Supabase untuk brand_assets
3. ✅ **Implementasi `/client/settings`** atau hapus menu

### Mid-term (Next Week)

1. ✅ **Implementasi ROI dashboard client-facing**
2. ✅ **Full implementasi event workspace** (bukan stub)

---

## Database Tables Status

| Table | Migration Exists | Exists in DB | Used By |
|-------|------------------|--------------|---------|
| `campaigns` | ✅ | ✅ | Approval page |
| `content_assets` | ✅ | ❌ | Approval page |
| `platform_posts` | ✅ | ❌ | Approval page |
| `brand_assets` | ✅ | ❌ | BrandAssetHub |
| `feedback_entries` | ❌ | ❌ | FeedbackDialog |
| `ad_spend_logs` | ✅ | ❌ | ROIDashboard |
| `client_budgets` | ✅ | ❌ | BudgetLedger |
| `expenses` | ✅ | ❌ | BudgetLedger |
| `events` | ✅ | ❌ | EventWorkspace |
| `event_tasks` | ✅ | ❌ | EventWorkspace |
| `event_vendors` | ✅ | ❌ | EventWorkspace |

---

## Files Reference

### Modified During Analysis

| File | Status |
|------|--------|
| `app/e2e/create-client.spec.ts` | ✅ Fixed (Ctrl+K selector) |
| `openspec/changes/archive/2026-09-19-client-quick-onboarding/tasks.md` | ✅ Updated |

### Existing (Verified)

| Component | File | Size |
|-----------|------|------|
| BottomNav | `components/bottom-nav.tsx` | 2753 bytes |
| BrandAssetHub | `components/client/brand-asset-hub.tsx` | 5852 bytes |
| ROIDashboard | `components/marketing/roi-dashboard-board.tsx` | 9492 bytes |
| ApprovalBoard | `components/client/approval-board.tsx` | 7396 bytes |
| EventWorkspace | `components/events/event-workspace-board.tsx` | 2552 bytes |

### DB Migrations (Not Pushed)

| File | Tables |
|------|--------|
| `supabase/migrations/20260918141819_fase_3_erp_tables.sql` | events, event_tasks, event_vendors, client_budgets, expenses, ad_spend_logs |

---

## Appendix: Full DB Check Results

```
Table                Migration  In DB    Used By
campaigns            ✅         ✅         Approval page
content_assets       ✅         ❌         Approval page
platform_posts       ✅         ❌         Approval page
brand_assets         ✅         ❌         BrandAssetHub
feedback_entries     ❌         ❌         FeedbackDialog
ad_spend_logs        ✅         ❌         ROIDashboard
client_budgets       ✅         ❌         BudgetLedger
expenses             ✅         ❌         BudgetLedger
events               ✅         ❌         EventWorkspace
event_tasks          ✅         ❌         EventWorkspace
event_vendors        ✅         ❌         EventWorkspace
deliverables         ✅         ✅         Dashboard, Pipeline
clients              ✅         ✅         All pages
users                ✅         ✅         Auth, profile
skills               ✅         ✅         ClientWorkspace
skill_packs          ✅         ✅         ClientWorkspace
```
