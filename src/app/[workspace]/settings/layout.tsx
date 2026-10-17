'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PageHeader } from '@/components/shell/app-shell';
import { useWorkspace } from '@/components/shell/workspace-context';
import type { Permission } from '@/lib/shared';
import { cn } from '@/lib/utils';

const tabs: Array<{ slug: string; label: string; permission?: Permission }> = [
  { slug: 'general', label: 'General' },
  { slug: 'members', label: 'Members' },
  { slug: 'billing', label: 'Billing', permission: 'billing.read' },
  { slug: 'audit-log', label: 'Audit log', permission: 'audit.read' },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { workspace, can } = useWorkspace();
  const pathname = usePathname();
  return (
    <>
      <PageHeader title="Settings" description={`Manage ${workspace.name}.`} />
      <nav aria-label="Settings" className="-mx-4 mb-6 overflow-x-auto border-b px-4 sm:mx-0 sm:px-0">
        <ul className="flex gap-1">
          {tabs
            .filter((t) => !t.permission || can(t.permission))
            .map((t) => {
              const href = `/${workspace.slug}/settings/${t.slug}`;
              const active = pathname === href;
              return (
                <li key={t.slug}>
                  <Link
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      '-mb-px inline-block border-b-2 border-transparent px-3 py-2 text-sm text-muted-foreground hover:text-foreground',
                      active && 'border-primary font-medium text-foreground',
                    )}
                  >
                    {t.label}
                  </Link>
                </li>
              );
            })}
        </ul>
      </nav>
      {children}
    </>
  );
}
