# Proposal: Client Portal Critical Fixes

## Overview

Seven critical and high-priority issues identified through comprehensive analysis of client portal.

## Issue Breakdown

### 1. Dead Link to /client/settings (BLOCKER)

**Severity**: Critical
**Impact**: Client taps "Akun" → 404

**Fix Options**:
- Option A: Remove/disable "Akun" menu until page exists
- Option B: Implement basic settings page (profile, password, telegram)

**Recommendation**: Implement basic settings page (3-4 hours)

### 2. Bottom Nav Grid Bug (UI)

**Severity**: Critical
**Impact**: 6 menu items di grid 5 kolom → wrap ke baris kedua

**Fix**:
```tsx
// components/bottom-nav.tsx line 61
- <div className="grid h-full w-full grid-cols-5">
+ <div className="grid h-full w-full grid-cols-6">
```

**Estimate**: 5 minutes

### 3. ROI Dashboard Spec Misalignment (SPEC)

**Severity**: High
**Impact**: Spec client-facing, implementasi admin

**Fix**:
- Split spec menjadi `client/roi-dashboard-basic` dan `admin/roi-dashboard`
- Implementasi simplified client view: 3 charts (spend, content count, views)

**Estimate**: 3-4 hours

### 4. Mobile Nav Badge Status Mismatch (SPEC/CODE)

**Severity**: Medium
**Impact**: Badge tidak muncul karena filter status beda

**Fix**:
- Opsi A: Update spec → 'review' → 'sent'
- Opsi B: Update code → 'sent' → 'revision_requested'

**Recommendation**: Opsi B (revision_requested lebih sesuai untuk "pending approval")

**Estimate**: 15 minutes

### 5. Brand Assets DB (DB)

**Severity**: Medium
**Impact**: BrandAssetHub component broken (404)

**Fix**:
- Push migration untuk brand_assets table
- Setup storage bucket di Supabase

**Estimate**: 1 hour

### 6. Event Workspace DB (DB)

**Severity**: Medium
**Impact**: EventWorkspace component stub, belum fetch DB

**Fix**:
- Push migration untuk events, event_tasks, event_vendors tables
- Implement fetch logic di component

**Estimate**: 2 hours

### 7. Feedback DB (VERIFIED WORKING — NO ACTION NEEDED)

**Status**: ✅ Resolved / verified working
**Fakta**: Tabel `feedback` ADA di DB (`app/supabase/migrations/026_feedback_form.sql` sudah dijalankan). `FeedbackDialog` dan `FeedbackBoard` berfungsi normal.
**Koreksi**: Temuan awal yang menyebut "feedback table missing / create migration" adalah **SALAH** — sudah diverifikasi live ke Supabase bahwa `feedback` ✅ exists.

*No action required for this issue.*

## Total Estimated Effort

**Total**: 9-11 hours

**By Priority**:
- Critical (2): 3-4 hours (ROI) + 5 min (grid)
- High (1): 3-4 hours
- Medium (3): 1.5 hours
- Low (1): 30 minutes
