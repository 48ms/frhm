import { screen } from "@testing-library/react"
import { vi, describe, it, expect } from "vitest"
import { ClientChannelsBoard } from "./social-accounts-board"
import { renderWithProviders } from "@/test/render-with-providers"

// Ikon di-stub supaya board bisa render tanpa enumerasi seluruh registry.
vi.mock("@/components/icons", () => {
  const Stub = (props: Record<string, unknown>) => <span data-testid="icon" {...props} />
  return { Icons: new Proxy({}, { get: () => Stub }) }
})

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
}))

vi.mock("@/components/client/create-client-provider", () => ({
  useCreateClient: () => ({ openCreateClient: vi.fn() }),
}))

// Dua client: satu sehat, satu dengan akun gagal (untuk tab Action Required).
vi.mock("@/features/social-accounts/api/queries", () => ({
  socialQueries: {
    listClientsWithChannels: () => ({
      queryKey: ["social", "clients-with-channels"],
      queryFn: async () => [],
    }),
  },
  useDisconnectChannel: () => ({ mutate: vi.fn(), mutateAsync: vi.fn() }),
  useSyncChannel: () => ({ mutate: vi.fn(), mutateAsync: vi.fn() }),
}))

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

describe("ClientChannelsBoard", () => {
  it("renders the empty state when there are no clients (no fabricated data)", async () => {
    renderWithProviders(<ClientChannelsBoard />)
    expect(await screen.findByText(/No clients found/i)).toBeDefined()
  })
})
