import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './helpers/login'

test.describe('Playbooks, Skills & Deliverables Workflow (End-to-End QA)', () => {
  test.setTimeout(120000)

  test('Flow 1: AI Studio renders 17 Topic Packs and switches to All Skills view', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/ai')
    await page.waitForLoadState('networkidle')

    // Expect page container title
    await expect(page.getByRole('heading', { name: /AI Creative Studio/i })).toBeVisible({ timeout: 15000 })

    // Locate and click the Playbooks tab
    const playbooksTab = page.getByRole('tab', { name: /Playbooks/i })
    await expect(playbooksTab).toBeVisible()
    await playbooksTab.click()

    // 17 Topic Packs header and grid
    await expect(page.getByRole('heading', { name: /Paket Solusi Strategis \(Topic Packs\)/i })).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/Social Media Starter Kit/i).first()).toBeVisible()

    // Switch view to "Semua 106 Playbook"
    const allSkillsBtn = page.getByRole('button', { name: /Semua 106 Playbook/i })
    await expect(allSkillsBtn).toBeVisible()
    await allSkillsBtn.click()

    // Verify search and filter controls
    const searchInput = page.getByPlaceholder(/Cari dari 106 playbooks/i)
    await expect(searchInput).toBeVisible()

    // Search for a specific skill
    await searchInput.fill('hook')
    await page.waitForTimeout(500)
    await expect(page.getByRole('heading', { name: 'hook-writer' })).toBeVisible()
  })

  test('Flow 2: Client Management opens Playbooks modal with 3 functional tabs', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/clients')
    await page.waitForLoadState('networkidle')

    // Find the first client card with a Playbooks button
    const playbooksBtn = page.getByRole('button', { name: /Playbooks/i }).first()
    await expect(playbooksBtn).toBeVisible({ timeout: 15000 })
    await playbooksBtn.click()

    // Dialog should open
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 10000 })
    await expect(dialog.getByRole('heading', { name: /Strategi & Playbooks/i })).toBeVisible()

    // Verify all 3 tabs exist in the dialog
    const tabActive = dialog.getByRole('tab', { name: /Playbook Aktif/i })
    const tabPacks = dialog.getByRole('tab', { name: /Tugaskan Paket/i })
    const tabOutputs = dialog.getByRole('tab', { name: /Riwayat Dokumen/i })

    await expect(tabActive).toBeVisible()
    await expect(tabPacks).toBeVisible()
    await expect(tabOutputs).toBeVisible()

    // Switch to "Tugaskan Paket"
    await tabPacks.click()
    await expect(dialog.getByRole('heading', { name: /Katalog 17 Paket Solusi Teruji/i })).toBeVisible()

    // Switch to "Riwayat Dokumen"
    await tabOutputs.click()
    await expect(dialog.getByRole('tabpanel')).toBeVisible()

    // Close dialog
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
  })

  test('Flow 3: Marketing ERP displays Deliverables & Strategy Documents section', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/erp')
    await page.waitForLoadState('networkidle')

    // Title & subtitle
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(/Ringkasan deliverable dan performa konten klien/i)).toBeVisible()

    // Verify Deliverables & Strategy Documents section
    await expect(page.getByRole('heading', { name: /Daftar Deliverables & Dokumen Strategi/i })).toBeVisible()
    await expect(page.getByText(/Materi dan dokumen hasil riset yang telah dikirim ke klien untuk ditinjau/i)).toBeVisible()

    // Verify presence of KPI cards and zero NaN
    const totalDeliverableText = page.getByText('TOTAL DELIVERABLE', { exact: true })
    await expect(totalDeliverableText).toBeVisible()
    await expect(page.getByText(/NaN/)).toHaveCount(0)
  })

  test('Flow 4: Skill Interview Modal renders with One-Shot Generic Runner action', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/ai')
    await page.waitForLoadState('networkidle')

    // Navigate to Playbooks tab
    const playbooksTab = page.getByRole('tab', { name: /Playbooks/i })
    await expect(playbooksTab).toBeVisible({ timeout: 15000 })
    await playbooksTab.click()

    // Switch to All Skills view
    const allSkillsBtn = page.getByRole('button', { name: /Semua 106 Playbook/i })
    await expect(allSkillsBtn).toBeVisible({ timeout: 10000 })
    await allSkillsBtn.click()

    // Find and click "Jalankan Playbook" on the first visible card
    const runPlaybookBtn = page.getByRole('button', { name: /Jalankan Playbook/i }).first()
    await expect(runPlaybookBtn).toBeVisible({ timeout: 10000 })
    await runPlaybookBtn.click()

    // SkillInterviewModal opens
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 10000 })

    // Verify "Eksekusi Seketika" generic runner action button is visible
    const genericRunnerBtn = dialog.getByRole('button', { name: /Eksekusi Seketika/i })
    await expect(genericRunnerBtn).toBeVisible({ timeout: 10000 })

    // Verify chat input area and send button
    await expect(dialog.getByPlaceholder(/Ketik jawaban atau brief/i)).toBeVisible()
    await expect(dialog.getByRole('button', { name: /Kirim/i })).toBeVisible()

    // Close modal via Escape
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible({ timeout: 5000 })
  })
})

