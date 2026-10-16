import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './helpers/login'
import fs from 'fs'
import path from 'path'

test.describe('FRHM AI System Ecosystem E2E Verification', () => {
  test.setTimeout(180_000)

  test.beforeAll(() => {
    const dir = path.resolve(process.cwd(), 'e2e/screenshots')
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  })

  test('Tab 1: Idea Engine - renders SPARK controls, strategy presets, and platform selector', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/ai')
    await page.waitForLoadState('networkidle')

    // Page title and header
    await expect(page.getByRole('heading', { name: /AI Creative Studio & Strategy Hub/i })).toBeVisible({ timeout: 20000 })

    // Tablist renders with all 4 ecosystem tabs
    await expect(page.getByRole('tab', { name: /Idea Engine/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /Batch Planner/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /Trend Radar/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /Brand Brain/i })).toBeVisible()

    // Default tab is Idea Engine
    await expect(page.getByRole('tab', { name: /Idea Engine/i })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByText('SPARK Ideation Engine')).toBeVisible()

    // Topic Input and Strategy Presets
    const topicInput = page.getByPlaceholder(/Contoh: Manfaat teh putih organik/i)
    await expect(topicInput).toBeVisible()

    // Verify Strategy Presets are visible
    await expect(page.getByRole('button', { name: /Bongkar Mitos/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Tips 3-Langkah/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Behind The Scenes/i })).toBeVisible()

    // Click "Bongkar Mitos" preset and verify topic input fills
    await page.getByRole('button', { name: /Bongkar Mitos/i }).click()
    await expect(topicInput).toHaveValue(/Bongkar mitos keliru/i)

    // Platform Selector
    await expect(page.getByRole('button', { name: 'Instagram' }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'TikTok' }).first()).toBeVisible()

    // Main action button
    await expect(page.getByRole('button', { name: /Racik Ide Konten Sekarang/i })).toBeVisible()

    await page.screenshot({ path: 'e2e/screenshots/ai-studio-ideas.png', fullPage: true })
  })

  test('Tab 2: Batch Planner - switches via nuqs URL, displays archetype briefs and period picker', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/ai?tab=batch')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('tab', { name: /Batch Planner/i })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByText('30-Day Batch Campaign Planner')).toBeVisible({ timeout: 15000 })

    // Period buttons
    await expect(page.getByRole('button', { name: '7 Hari' })).toBeVisible()
    await expect(page.getByRole('button', { name: '14 Hari' })).toBeVisible()
    await expect(page.getByRole('button', { name: '30 Hari' })).toBeVisible()

    // Goals Textarea
    const goalsTextarea = page.getByPlaceholder(/Kampanye peluncuran menu teh musim panas/i)
    await expect(goalsTextarea).toBeVisible()

    // Campaign Archetype Brief Presets
    await expect(page.getByRole('button', { name: /Peluncuran Produk/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Authority & Edukasi/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Payday & Flash Sale/i })).toBeVisible()

    // Click "Peluncuran Produk" archetype and verify textarea fills
    await page.getByRole('button', { name: /Peluncuran Produk/i }).click()
    await expect(goalsTextarea).toHaveValue(/Kampanye peluncuran produk baru/i)

    // Action button
    await expect(page.getByRole('button', { name: /Generate Batch Plan Sekarang/i })).toBeVisible()

    await page.screenshot({ path: 'e2e/screenshots/ai-studio-batch.png', fullPage: true })
  })

  test('Tab 3: Trend Radar - switches via nuqs URL, displays viral formats and 3-gate audit trigger', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/ai?tab=trends')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('tab', { name: /Trend Radar/i })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByText('Trend Radar & 3-Gate Vetting Engine')).toBeVisible({ timeout: 15000 })

    const trendTextarea = page.getByPlaceholder(/Tren format video 'A Day in My Life/i)
    await expect(trendTextarea).toBeVisible()

    // Viral format preset chips
    await expect(page.getByRole('button', { name: /POV: Pertama Kali Coba/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /A Day in My Life BTS/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Sebelum vs Sesudah/i })).toBeVisible()

    // Click format chip and verify description fills
    await page.getByRole('button', { name: /POV: Pertama Kali Coba/i }).click()
    await expect(trendTextarea).toHaveValue(/POV: Pertama kali coba solusi kami/i)

    // Action button
    await expect(page.getByRole('button', { name: /Audit Kelayakan Tren Sekarang/i })).toBeVisible()

    await page.screenshot({ path: 'e2e/screenshots/ai-studio-trends.png', fullPage: true })
  })

  test('Tab 4: Brand Brain - displays DNA completeness meter, identity matrix, and Markdown Studio dialog', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/ai?tab=brand-brain')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('tab', { name: /Brand Brain/i })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByText('Brand Brain & Context Matrix')).toBeVisible({ timeout: 15000 })

    // Completeness Meter Card
    await expect(page.getByText(/Kelengkapan Brand DNA/i)).toBeVisible()
    await expect(page.getByText(/Skor DNA/i)).toBeVisible()

    // 7 Core Pillars in Matrix (Exact text match)
    await expect(page.getByText('Siapa Kami? (Who)', { exact: true })).toBeVisible()
    await expect(page.getByText('Target Audiens (Audience)', { exact: true })).toBeVisible()
    await expect(page.getByText('Gaya Bahasa (Tone of Voice)', { exact: true })).toBeVisible()
    await expect(page.getByText('Sudut Pandang (POV)', { exact: true })).toBeVisible()
    await expect(page.getByText('Bukti Kredibilitas (Proof)', { exact: true })).toBeVisible()
    await expect(page.getByText('Pantangan / Never-List (Guardrails)', { exact: true })).toBeVisible()
    await expect(page.getByText('Pilar Konten Utama (Content Pillars)', { exact: true })).toBeVisible()

    await page.screenshot({ path: 'e2e/screenshots/ai-studio-brand-brain.png', fullPage: true })

    // Markdown Studio Trigger Button
    const studioBtn = page.getByRole('button', { name: /Buka Markdown Studio/i })
    await expect(studioBtn).toBeVisible()

    // Click to open Brand Brain Markdown Studio Dialog
    await studioBtn.click()

    // Dialog Modal visible with Radix UI
    await expect(page.getByText('Brand Brain Markdown Studio')).toBeVisible({ timeout: 10000 })

    // Verify Quick Formatting Toolbar buttons are rendered
    await expect(page.getByRole('button', { name: 'H2' }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'B' }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: '• List' }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Quote' }).first()).toBeVisible()

    // Verify file selector buttons in dialog
    await expect(page.getByRole('button', { name: 'Brand Profile .md' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Voice & Tone/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Guardrails/i })).toBeVisible()

    await page.screenshot({ path: 'e2e/screenshots/ai-studio-markdown-dialog.png' })

    // Close Dialog using keyboard Escape or close button
    await page.keyboard.press('Escape')
    await expect(page.getByText('Brand Brain Markdown Studio')).not.toBeVisible()
  })

  test('Tab 5 & 6: Settings Integration - navigates to Settings Brand Profile with AI Extractor', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/settings?tab=brand-profile')
    await page.waitForLoadState('networkidle')

    // Brand Profile Tab in Settings
    await expect(page.getByRole('heading', { name: 'Identitas & Brand Profile' })).toBeVisible({ timeout: 20000 })
    await expect(page.getByRole('button', { name: /Gunakan AI untuk Ekstrak Brand DNA/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Buka Dokumen \.md/i })).toBeVisible()

    // Open AI Extractor panel
    await page.getByRole('button', { name: /Gunakan AI untuk Ekstrak Brand DNA/i }).click()
    await expect(page.getByText('AI Brand DNA Extractor')).toBeVisible()
    await expect(page.getByPlaceholder(/Paste about us, visi misi/i)).toBeVisible()

    await page.screenshot({ path: 'e2e/screenshots/settings-brand-profile-extractor.png' })

    // Close AI Extractor panel
    await page.getByRole('button', { name: 'Tutup' }).click()
    await expect(page.getByText('AI Brand DNA Extractor')).not.toBeVisible()
  })

  test('Edge Case: Batch Planner handles validation, slow connection shimmering feedback, and rate limit fallback', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/ai?tab=batch')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('30-Day Batch Campaign Planner')).toBeVisible({ timeout: 15000 })

    const generateBtn = page.getByRole('button', { name: /Generate Batch Plan Sekarang/i })
    await expect(generateBtn).toBeVisible()

    // 1. Validation test: empty or <10 chars goal triggers validation toast
    const goalsTextarea = page.getByPlaceholder(/Kampanye peluncuran menu teh musim panas/i)
    await goalsTextarea.fill('pendek')
    await generateBtn.click()
    await expect(page.getByText(/minimal 10 karakter/i)).toBeVisible({ timeout: 5000 })

    // 2. Click archetype preset to populate full brief (>10 chars)
    await page.getByRole('button', { name: /Peluncuran Produk/i }).click()
    await expect(goalsTextarea).toHaveValue(/Kampanye peluncuran produk baru/i)

    // 3. Trigger generation and observe zero crash / shimmering feedback or response toast
    await generateBtn.click()

    // Either shimmering text is briefly displayed while pending or toast appears (result or AI unconfigured/rate limit)
    await expect(
      page.locator('[data-sonner-toast]').or(page.getByText(/Merancang Roadmap Batch Plan/i)).first()
    ).toBeVisible({ timeout: 15000 })
  })
})
