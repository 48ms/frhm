import { screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BrandProfileTab } from './brand-profile-tab'
import { renderWithProviders } from '@/test/render-with-providers'

const mockUpdateBrandProfile = vi.fn()
const mockGenerateBrandProfile = vi.fn()

vi.mock('@/components/dashboard-stitch/dashboard-data', () => ({
  useActiveDashboard: () => ({
    clientId: 'client-taraju',
    setClientId: vi.fn(),
    client: {
      id: 'client-taraju',
      name: 'Taraju Tea Estate',
      brand_profile: {
        who: 'Produsen teh artisan premium Jawa Barat',
        audience: 'Pecinta teh dan gaya hidup sehat 25-45 tahun',
        voice: 'Hangat, edukatif, berakar tradisi',
        pov: 'Pakar teh ramah',
        proof: 'Kebun teh organik 150 hektar sejak 1920',
        guardrails: 'Jangan gunakan jargon kimia rumit',
        pillars: ['Tradisi Teh', 'Resep Seduh', 'Petani Lokal'],
      },
      channels: [],
    },
    clients: [],
    profile: null,
  }),
}))

vi.mock('@/features/social-accounts/api/queries', () => ({
  useUpdateBrandProfile: () => ({
    mutateAsync: mockUpdateBrandProfile,
    isPending: false,
  }),
  useGenerateBrandProfile: () => ({
    mutateAsync: mockGenerateBrandProfile,
    isPending: false,
  }),
}))

describe('BrandProfileTab', () => {
  it('renders the brand profile header and client badge', () => {
    renderWithProviders(<BrandProfileTab />)
    expect(screen.getByText(/Identitas & Brand Profile/i)).toBeInTheDocument()
    expect(screen.getByText('Taraju Tea Estate')).toBeInTheDocument()
  })

  it('renders the prefilled brand profile form fields', () => {
    renderWithProviders(<BrandProfileTab />)
    expect(screen.getByLabelText(/Siapa Kami\? \(Who\)/i)).toHaveValue('Produsen teh artisan premium Jawa Barat')
    expect(screen.getByLabelText(/Target Audiens \(Audience\)/i)).toHaveValue('Pecinta teh dan gaya hidup sehat 25-45 tahun')
    expect(screen.getByLabelText(/Gaya Bahasa \(Voice\)/i)).toHaveValue('Hangat, edukatif, berakar tradisi')
    expect(screen.getByRole('button', { name: /Simpan Profil/i })).toBeInTheDocument()
  })

  it('toggles the AI Brand DNA Extractor panel', () => {
    renderWithProviders(<BrandProfileTab />)
    const toggleBtn = screen.getByRole('button', { name: /Gunakan AI untuk Ekstrak Brand DNA/i })
    expect(toggleBtn).toBeInTheDocument()

    fireEvent.click(toggleBtn)
    expect(screen.getByText(/AI Brand DNA Extractor/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Contoh: B2B SaaS, F&B Artisan/i)).toBeInTheDocument()

    const closeBtn = screen.getByRole('button', { name: /Tutup/i })
    fireEvent.click(closeBtn)
    expect(screen.queryByText(/AI Brand DNA Extractor/i)).not.toBeInTheDocument()
  })
})
