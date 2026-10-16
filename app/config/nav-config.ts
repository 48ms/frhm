import { NavItem } from '@/types/nav';

/**
 * Active admin sidebar navigation (source of truth).
 * Kept lean — any dead routes below are intentional gaps until the client portal
 * or feature is re-architected (was removed in commit 3e36ff3 cleanup).
 */
export const adminNavStitch: NavItem[] = [
  { title: 'Overview', url: '/admin/dashboard', icon: 'dashboard', shortcut: ['g', 'd'] },
  { title: 'Marketing ERP', url: '/admin/erp', icon: 'layers', shortcut: ['g', 'e'] },
  { title: 'AI Studio', url: '/admin/ai', icon: 'auto_awesome', shortcut: ['g', 'i'] },
  { title: 'Social Accounts', url: '/admin/social-accounts', icon: 'hub', shortcut: ['g', 's'] },
  { title: 'Composer', url: '/admin/composer', icon: 'rocket', shortcut: ['g', 'c'] },
  { title: 'Campaigns', url: '/admin/campaigns', icon: 'campaign', shortcut: ['g', 'm'] },
  { title: 'Events', url: '/admin/events', icon: 'mapPin', shortcut: ['g', 'v'] },
  { title: 'Content Calendar', url: '/admin/calendar', icon: 'calendar_month', shortcut: ['g', 'k'] },
  { title: 'Analytics', url: '/admin/analytics', icon: 'monitoring', shortcut: ['g', 'a'] },
  { title: 'Media Library', url: '/admin/library', icon: 'media', shortcut: ['g', 'l'] },
];

/**
 * Dedicated client portal navigation.
 * Tailored for business owners / client partners (approval, schedule, results).
 */
export const clientNav: NavItem[] = [
  { title: 'Overview', url: '/client/dashboard', icon: 'dashboard', shortcut: ['g', 'd'] },
  { title: 'Content Calendar', url: '/client/calendar', icon: 'calendar_month', shortcut: ['g', 'k'] },
  { title: 'Deliverables & Review', url: '/client/review', icon: 'layers', shortcut: ['g', 'r'] },
  { title: 'Analytics', url: '/client/analytics', icon: 'monitoring', shortcut: ['g', 'a'] },
  { title: 'Brand Assets', url: '/client/assets', icon: 'media', shortcut: ['g', 'l'] },
  { title: 'Support & Request', url: '/client/support', icon: 'bot', shortcut: ['g', 's'] },
];