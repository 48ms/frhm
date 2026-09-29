import type { ReactNode } from 'react';
import { Icons } from '@/components/icons';

export interface PermissionCheck {
  permission?: string;
  plan?: string;
  feature?: string;
  role?: 'admin' | 'client' | 'all';
}

export interface NavItem {
  title: string;
  url: string;
  disabled?: boolean;
  external?: boolean;
  shortcut?: [string, string];
  icon?: keyof typeof Icons;
  label?: string;
  badge?: number | string;
  description?: string;
  isActive?: boolean;
  items?: NavItem[];
  access?: PermissionCheck;
}

export interface NavGroup {
  label: string;
  action?: ReactNode;
  items: NavItem[];
}
