'use client';

import { CreditCard, FolderKanban, Inbox, ScrollText, Settings, Shield, Users, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { Logo } from '@/components/brand';
import type { Permission } from '@/lib/shared';
import { cn } from '@/lib/utils';
import { UserMenu } from './user-menu';
import { useWorkspace } from './workspace-context';
import { WorkspaceSwitcher } from './workspace-switcher';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  permission?: Permission;
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { workspace, can } = useWorkspace();
  const { user } = useAuth();
  const pathname = usePathname();
  const base = `/${workspace.slug}`;

  const main: NavItem[] = [{ href: `${base}/projects`, label: 'Projects', icon: FolderKanban }];
  const settings: NavItem[] = [
    { href: `${base}/settings/general`, label: 'General', icon: Settings },
    { href: `${base}/settings/members`, label: 'Members', icon: Users },
    { href: `${base}/settings/billing`, label: 'Billing', icon: CreditCard, permission: 'billing.read' },
    { href: `${base}/settings/audit-log`, label: 'Audit log', icon: ScrollText, permission: 'audit.read' },
  ];

  const renderItem = (item: NavItem) => {
    if (item.permission && !can(item.permission)) return null;
    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          onClick={onNavigate}
          aria-current={active ? 'page' : undefined}
          className={cn(
            'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
            active && 'bg-accent font-medium text-accent-foreground',
          )}
        >
          <item.icon className="size-4" aria-hidden />
          {item.label}
        </Link>
      </li>
    );
  };

  return (
    <div className="flex h-full flex-col gap-4 p-3">
      <div className="px-1.5 pt-1">
        <Logo />
      </div>
      <WorkspaceSwitcher />
      <nav aria-label="Workspace" className="flex-1 space-y-5 overflow-y-auto">
        <ul className="space-y-0.5">{main.map(renderItem)}</ul>
        <div>
          <p className="mb-1 px-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground/80">Settings</p>
          <ul className="space-y-0.5">{settings.map(renderItem)}</ul>
        </div>
        <div>
          <p className="mb-1 px-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground/80">Platform</p>
          <ul className="space-y-0.5">
            {user?.isSuperAdmin && renderItem({ href: '/admin', label: 'Super admin', icon: Shield })}
            {renderItem({ href: '/dev/mailbox', label: 'Dev mailbox', icon: Inbox })}
          </ul>
        </div>
      </nav>
      <div className="border-t pt-3">
        <UserMenu />
      </div>
    </div>
  );
}
