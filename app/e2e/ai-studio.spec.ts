import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './helpers/login'

test.describe('AI Studio Command Center', () => {
  test.setTimeout(120000)

  test('renders AI Studio page with 4 tabs and defaults to Idea Engine', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/ai')
    await page.waitForLoadState('networkidle')

    // Page title and header
    await expect(page.getByRole('heading', { name: 'AI Studio & Copilot Command' })).toBeVisible({ timeout: 15000 })

    // Tablist renders with the four tabs
    await expect(page.getByRole('tab', { name: /Idea Engine/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /Batch Planner/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /Trend Radar/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /Brand Brain/i })).toBeVisible()

    // Default tab is Idea Engine
    await expect(page.getByRole('tab', { name: /Idea Engine/i })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByPlaceholder(/Tulis topik, tema promosi, atau masalah audiens/i)).toBeVisible()
  })

  test('switches to Batch Planner tab via URL state', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/ai?tab=batch')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('tab', { name: /Batch Planner/i })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByText('Multi-Day Campaign Matrix & Scheduler')).toBeVisible({ timeout: 10000 })
  })

  test('switches to Trend Radar tab via URL state', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/ai?tab=trends')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('tab', { name: /Trend Radar/i })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByText('Three Gates Trend Vetting Engine')).toBeVisible({ timeout: 10000 })
  })

  test('switches to Brand Brain tab and displays DNA matrix with Markdown Studio trigger', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/ai?tab=brand-brain')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('tab', { name: /Brand Brain/i })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByText('Brand Brain & Context Matrix')).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: /Buka Markdown Studio/i })).toBeVisible()
  })
})
