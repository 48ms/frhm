import { NavGroup, NavItem } from '@/types/nav';

export const adminNavStitch: NavItem[] = [
  { title: 'Overview', url: '/admin/dashboard', icon: 'dashboard' },
  { title: 'Marketing ERP', url: '/admin/erp', icon: 'layers' },
  { title: 'Social Accounts', url: '/admin/social-accounts', icon: 'hub' },
  { title: 'Composer', url: '/admin/composer', icon: 'rocket' },
  { title: 'Campaigns', url: '/admin/campaigns', icon: 'campaign' },
  { title: 'Content Calendar', url: '/admin/calendar', icon: 'calendar_month' },
  { title: 'Analytics', url: '/admin/analytics', icon: 'monitoring' },
];

export const adminNavGroups: NavGroup[] = [
  {
    label: 'OVERVIEW',
    items: [
      {
        title: 'Dashboard',
        url: '/admin/dashboard',
        icon: 'dashboard',
        shortcut: ['d', 'd']
      },
      {
        title: 'Global Pipeline',
        url: '/admin/global-pipeline',
        icon: 'kanban',
        shortcut: ['g', 'p']
      },
      {
        title: 'Analytics',
        url: '/admin/analytics',
        icon: 'trendingUp',
        shortcut: ['a', 'n']
      },
      {
        title: 'Kalender',
        url: '/admin/calendar',
        icon: 'calendar',
        shortcut: ['c', 'a']
      }
    ]
  },
  {
    label: 'OPERATIONS',
    items: [
      {
        title: 'Content Production',
        url: '/admin/production',
        icon: 'video',
        shortcut: ['p', 'r']
      },
      {
        title: 'Media Library',
        url: '/admin/library',
        icon: 'media',
        shortcut: ['m', 'l']
      },
      {
        title: 'Deliverables',
        url: '/admin/deliverables',
        icon: 'post',
        shortcut: ['d', 'e']
      },
      {
        title: 'KOL & Vendor CRM',
        url: '/admin/crm',
        icon: 'teams',
        shortcut: ['c', 'r']
      },
      {
        title: 'Batch Automations',
        url: '/admin/automations',
        icon: 'sparkles',
        shortcut: ['a', 'u']
      }
    ]
  },
  {
    label: 'CLIENTS',
    action: 'create-client',
    items: [
      {
        title: 'Client Workspace',
        url: '/admin/clients',
        icon: 'workspace',
        shortcut: ['c', 'l']
      }
    ]
  },
  {
    label: 'SYSTEM',
    items: [
      {
        title: 'AI Studio',
        url: '/admin/skills',
        icon: 'sparkles',
        shortcut: ['a', 'i']
      },
      {
        title: 'Settings',
        url: '/admin/settings',
        icon: 'settings',
        shortcut: ['s', 'e']
      }
    ]
  }
];

export const clientNavGroups: NavGroup[] = [
  {
    label: 'REVIEW CONTENT',
    items: [
      {
        title: 'Kalender Konten',
        url: '/client/calendar',
        icon: 'calendar',
        shortcut: ['k', 'k']
      }
    ]
  },
  {
    label: 'DECISION CENTER',
    items: [
      {
        title: 'Approvals',
        url: '/client/approvals',
        icon: 'check',
        shortcut: ['a', 'p']
      },
      {
        title: 'Deliverables',
        url: '/client/deliverables',
        icon: 'post',
        shortcut: ['d', 'l']
      },
      {
        title: 'Pipeline Produksi',
        url: '/client/pipeline',
        icon: 'kanban',
        shortcut: ['p', 'p']
      }
    ]
  },
  {
    label: 'REPORTS',
    items: [
      {
        title: 'Ringkasan & Laporan',
        url: '/client/dashboard',
        icon: 'dashboard',
        shortcut: ['r', 'e']
      },
      {
        title: 'Pengaturan Akun',
        url: '/client/settings',
        icon: 'settings',
        shortcut: ['s', 't']
      }
    ]
  }
];

// Sub-navigation for /admin/settings. Grouped by concern so the list reads as
// two short menus instead of one flat row of five.
export const settingsNavGroups: NavGroup[] = [
  {
    label: 'Integrasi',
    items: [
      { title: 'Bridge', url: '/admin/settings/bridge' },
      { title: 'Telegram', url: '/admin/settings/telegram' },
      { title: 'Pengaturan AI', url: '/admin/settings/ai' }
    ]
  },
  {
    label: 'Administrasi',
    items: [
      { title: 'Manajemen User', url: '/admin/settings/users' },
      { title: 'Audit Log', url: '/admin/settings/audit' }
    ]
  }
];