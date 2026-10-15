import type { InfobarContent } from '@/components/ui/infobar';

export const workspacesInfoContent: InfobarContent = {
  title: 'Manajemen Workspace Klien',
  sections: [
    {
      title: 'Gambaran Umum',
      description:
        'Halaman Workspace memungkinkan agensi mengelola ruang kerja multi-tenant untuk setiap brand klien (seperti Taraju dan Pawon Sengon). Fitur ini ditenagai oleh Supabase Auth dan isolasi PostgreSQL RLS murni.',
      links: []
    },
    {
      title: 'Membuat Workspace Klien Baru',
      description:
        'Untuk menambahkan workspace klien baru, buka command palette (Ctrl+K) atau tombol Tambah Client. Masukkan nama brand, persona, platform sosial media, dan tautan review.',
      links: []
    },
    {
      title: 'Beralih Antar Workspace',
      description:
        'Anda dapat beralih konteks klien secara instan menggunakan WorkspaceSwitcher di sidebar atau parameter nuqs (?clientId=). Seluruh modul (kalender, analitik, ERP, composer) akan otomatis tersinkronisasi.',
      links: []
    },
    {
      title: 'Isolasi Tenant & Keamanan RLS',
      description:
        'Setiap query database melewati PostgreSQL Row-Level Security policies. Akses data dibatasi secara mutlak sehingga data antar klien tidak pernah bocor.',
      links: []
    }
  ]
};

export const teamInfoContent: InfobarContent = {
  title: 'Manajemen Tim & Hak Akses',
  sections: [
    {
      title: 'Gambaran Umum',
      description:
        'Kelola anggota tim agensi dan akses kolaborator. Sistem peran (admin, manager, staff) dikontrol secara sentral melalui tabel users dan Supabase session claims.',
      links: []
    },
    {
      title: 'Peran & Izin Akses',
      description:
        'Peran admin memiliki hak penuh untuk manajemen konfigurasi agensi, integrasi AI provider, dan pembuatan workspace, sedangkan staf operasional berfokus pada eksekusi konten.',
      links: []
    }
  ]
};

export const billingInfoContent: InfobarContent = {
  title: 'Billing & Kuota Agensi',
  sections: [
    {
      title: 'Gambaran Umum',
      description:
        'Kelola paket langganan Frahma, kuota posting otomatis WoopSocial, dan batasan token AI model yang digunakan oleh workspace agensi.',
      links: []
    }
  ]
};

export const productInfoContent: InfobarContent = {
  title: 'Manajemen Deliverables & Konten',
  sections: [
    {
      title: 'Gambaran Umum',
      description:
        'Kelola seluruh aset konten, post plan, creative brief, dan laporan strategis media sosial untuk disetujui oleh klien secara interaktif.',
      links: []
    }
  ]
};
