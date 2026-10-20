import { test, expect, type Browser } from '@playwright/test';
import { loginAsAdmin } from './helpers/login';

const SEEDED_CLIENT_ID = '5044af9e-0af1-4ec6-83ba-dacba4cfebf2';

async function getSignedReviewUrl(browser: Browser): Promise<string> {
  const context = await browser.newContext();
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const page = await context.newPage();

  await loginAsAdmin(page);
  await page.goto(`/admin/erp?clientId=${SEEDED_CLIENT_ID}`);
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: /Link Review/i }).first().click();
  await expect(page.getByText(/Link Review Klien Disalin!/i)).toBeVisible({ timeout: 10000 });

  const reviewUrl = await page.evaluate(() => navigator.clipboard.readText());
  await context.close();

  expect(reviewUrl).toContain('/review/');
  expect(reviewUrl).toContain('token=');
  return reviewUrl;
}

test.describe('Client Portal Review & Magic Link (End-to-End QA)', () => {
  test.setTimeout(120000);

  test('Flow 1: ERP deliverables table displays "Link Review" and copies link', async ({ page, context }) => {
    // Grant clipboard permissions so navigator.clipboard works in headless browser
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await loginAsAdmin(page);
    // Navigate scoped to the client that owns the seeded deliverable
    // ("Frhm Alpha Tester"). The ERP defaults to the newest client, which has
    // no deliverables, so the Link Review button would never render.
    await page.goto(`/admin/erp?clientId=${SEEDED_CLIENT_ID}`);
    await page.waitForLoadState('networkidle');

    // Deliverables section exists
    await expect(page.getByRole('heading', { name: /Daftar Deliverables & Dokumen Strategi/i })).toBeVisible({ timeout: 15000 });

    // Link Review button and external preview link exist
    const linkReviewBtn = page.getByRole('button', { name: /Link Review/i }).first();
    await expect(linkReviewBtn).toBeVisible({ timeout: 10000 });

    const externalLink = page.locator('a[href^="/review/"]').first();
    await expect(externalLink).toBeVisible();

    // Click "Link Review" and verify toast
    await linkReviewBtn.click();
    await expect(page.getByText(/Link Review Klien Disalin!/i)).toBeVisible({ timeout: 5000 });
  });

  test('Flow 2: 404 handling on invalid review magic link', async ({ browser }) => {
    // Open in clean unauthenticated context (no admin login)
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('/review/00000000-0000-0000-0000-000000000000');
    await page.waitForLoadState('networkidle');

    // Should render a generic invalid-link card without requiring login
    await expect(page.getByRole('heading', { name: /Tautan Review Tidak Valid/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/sudah kedaluwarsa/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Kembali ke Beranda/i })).toBeVisible();

    await context.close();
  });

  test('Flow 3: Public Review Portal opens for valid deliverable and allows client approval', async ({ browser }) => {
    // Open directly in unauthenticated context (simulating Pak Adit / Bunda opening magic link from WhatsApp)
    const clientContext = await browser.newContext();
    const clientPage = await clientContext.newPage();

    const reviewUrl = await getSignedReviewUrl(browser);
    await clientPage.goto(reviewUrl);
    await clientPage.waitForLoadState('networkidle');

    // Brand and portal verification
    await expect(clientPage.getByText(/Client Review Portal/i)).toBeVisible({ timeout: 15000 });
    await expect(clientPage.getByRole('heading', { name: /Content Strategy & Campaign Plan Q4/i })).toBeVisible();
    await expect(clientPage.getByText(/Q4 Growth Strategy/i)).toBeVisible();

    // Verify Star Rating & Review Form exists
    await expect(clientPage.getByRole('heading', { name: /Formulir Keputusan & Ulasan Klien/i })).toBeVisible();

    // Verify action buttons
    const approveBtn = clientPage.getByRole('button', { name: /Setujui Dokumen \(Approve\)/i });
    const revisionBtn = clientPage.getByRole('button', { name: /Minta Revisi/i });

    await expect(approveBtn).toBeVisible();
    await expect(revisionBtn).toBeVisible();

    // Test validation: clicking "Minta Revisi" without feedback note should show error toast
    await revisionBtn.click();
    await expect(clientPage.getByText(/Mohon cantumkan catatan revisi/i)).toBeVisible({ timeout: 5000 });

    // Fill in feedback note and approve
    const textarea = clientPage.getByPlaceholder(/Tuliskan masukan spesifik Anda di sini/i);
    await textarea.fill('Strategi konten ini sangat bagus dan sesuai persona brand. Approved!');

    await approveBtn.click();

    // Verify confirmation toast or approved banner appears
    await expect(clientPage.getByText(/Deliverable berhasil disetujui!/i)).toBeVisible({ timeout: 10000 });
    await expect(clientPage.getByText(/Dokumen Ini Telah Disetujui \(Approved\)/i)).toBeVisible({ timeout: 10000 });

    await clientContext.close();
  });

  test('Flow 4: Client selects star rating and submits revision request with specific instructions', async ({ browser }) => {
    const clientContext = await browser.newContext();
    const clientPage = await clientContext.newPage();

    const reviewUrl = await getSignedReviewUrl(browser);
    await clientPage.goto(reviewUrl);
    await clientPage.waitForLoadState('networkidle');

    // Verify Star Rating interaction: click 4th star
    const star4 = clientPage.getByLabel('Beri nilai 4 bintang');
    await expect(star4).toBeVisible();
    await star4.click();
    await expect(clientPage.getByText(/Bagus & Sangat Menarik/i)).toBeVisible();

    // Fill reviewer name
    const nameInput = clientPage.getByPlaceholder(/Contoh: Pak Adit \/ Bunda/i);
    await expect(nameInput).toBeVisible();
    await nameInput.fill('Bunda - Pawon Sengon');

    // Fill specific revision note
    const feedbackArea = clientPage.getByPlaceholder(/Tuliskan masukan spesifik Anda di sini/i);
    await feedbackArea.fill('Mohon bagian hook video 2 disesuaikan dengan promo bundling akhir pekan.');

    // Click "Minta Revisi"
    const revisionBtn = clientPage.getByRole('button', { name: /Minta Revisi/i });
    await revisionBtn.click();

    // Verify revision requested feedback toast
    await expect(
      clientPage.getByText(/Permintaan revisi telah berhasil disampaikan ke tim Frhm/i)
    ).toBeVisible({ timeout: 10000 });

    await clientContext.close();
  });
});
