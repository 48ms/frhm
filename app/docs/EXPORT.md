# Export

Clients (and admins) download deliverables as a Markdown file they can keep, print, or paste
into Docs/Word. No PDF library, no server storage — the file is rendered on request and streamed
straight back.

## Endpoints

| Endpoint | Who | Returns |
|---|---|---|
| `GET /api/client/deliverables/[id]/export` | the owning client | one deliverable, with its comment thread |
| `GET /api/client/deliverables/export` | any client | every deliverable of that client, with a table of contents |
| `GET /api/admin/clients/[id]/export` | **admin only** | every deliverable of one client |

All three are read-only and `Cache-Control: no-store`.

## UI

- **Client → Deliverable Saya → card → detail**: `Unduh` button (next to the approve/revision
  buttons when the item is awaiting review).
- **Client → Deliverable Saya (list)**: `Ekspor Semua` in the header — hidden while the list is
  empty.
- **Admin → Client → Deliverable tab**: `Ekspor` next to `Baru`.

Each button fetches the endpoint, turns the response into a Blob, and triggers a download using
the filename from the server's `Content-Disposition`.

## Document shape

```markdown
# <Title>

**Klien:** ...  **Tipe:** Brief | Konten | Laporan  **Status:** ...  **Dikirim:** ...

---

<content>

---

## Komentar           <- single-deliverable export only
**Nama (Klien|Tim)** — 15 September 2026
<comment body>
```

The "semua" bundles add an intro line with the export date and count, plus a numbered **Daftar
Isi** before the per-deliverable `##` sections.

## Security

The admin route checks `users.role === 'admin'` after `getUser()`; a client calling it gets
`403`. The client routes resolve the caller's `users.client_id` and filter every query by it, so
a client cannot export another client's deliverables by guessing an id. Verified: a signed-in
client hitting the admin endpoint receives `403`.

## Why Markdown, not PDF

Markdown is text — it diffs, it pastes into any editor, and every OS can print it to PDF in one
step. A PDF pipeline would add a headless-browser or font-embedding dependency for a format the
user can already produce from the file. If a real PDF is ever needed, render this same Markdown
through the browser's print dialog rather than adding a library.
