import { NavItem } from '@/types/nav';

/**
 * Active admin sidebar navigation (source of truth).
 * Kept lean — any dead routes below are intentional gaps until the client portal
 * or feature is re-architected (was removed in commit 3e36ff3 cleanup).
 */
export const adminNavStitch: NavItem[] = [
  { title: 'Overview', url: '/admin/dashboard', icon: 'dashboard' },
  { title: 'Marketing ERP', url: '/admin/erp', icon: 'layers' },
  { title: 'Social Accounts', url: '/admin/social-accounts', icon: 'hub' },
  { title: 'Composer', url: '/admin/composer', icon: 'rocket' },
  { title: 'Campaigns', url: '/admin/campaigns', icon: 'campaign' },
  { title: 'Content Calendar', url: '/admin/calendar', icon: 'calendar_month' },
  { title: 'Analytics', url: '/admin/analytics', icon: 'monitoring' },
];