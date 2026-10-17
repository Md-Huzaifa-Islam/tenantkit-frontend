'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Inbox, RefreshCw, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Logo } from '@/components/brand';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { api, errorMessage } from '@/lib/api';
import { cn, formatDateTime } from '@/lib/utils';

interface MailSummary {
  id: string;
  to: string;
  subject: string;
  createdAt: string;
}

/** Emails captured by the mock email provider (development only). */
export default function DevMailboxPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const list = useQuery({
    queryKey: ['dev-mailbox', filter],
    queryFn: () => api<MailSummary[]>(`/dev/mailbox${filter ? `?to=${encodeURIComponent(filter)}` : ''}`, { noRefresh: true }),
    refetchInterval: 5000,
    retry: false,
  });
  const email = useQuery({
    queryKey: ['dev-mail', selected],
    queryFn: () => api<MailSummary & { html: string }>(`/dev/mailbox/${selected}`, { noRefresh: true }),
    enabled: !!selected,
  });

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-14 items-center justify-between gap-3 border-b px-4">
        <div className="flex items-center gap-3">
          <Logo />
          <Badge variant="warning">Dev mailbox</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" aria-label="Refresh" onClick={() => list.refetch()}>
            <RefreshCw />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Clear mailbox"
            onClick={async () => {
              await api('/dev/mailbox', { method: 'DELETE', noRefresh: true });
              setSelected(null);
              queryClient.invalidateQueries({ queryKey: ['dev-mailbox'] });
            }}
          >
            <Trash2 />
          </Button>
        </div>
      </header>
      <main id="main" className="grid flex-1 md:grid-cols-[22rem_1fr]">
        <aside className="border-b md:border-b-0 md:border-r">
          <div className="p-3">
            <label htmlFor="mail-filter" className="sr-only">
              Filter by recipient
            </label>
            <Input id="mail-filter" placeholder="Filter by recipient" value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>
          {list.isPending ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          ) : list.isError ? (
            <p className="p-4 text-sm text-muted-foreground">{errorMessage(list.error)}. Is ENABLE_DEV_MAILBOX on?</p>
          ) : list.data.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No emails yet. Sign up, invite someone or reset a password.</p>
          ) : (
            <ul className="max-h-[70vh] overflow-y-auto md:max-h-[calc(100dvh-7.5rem)]">
              {list.data.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(m.id)}
                    aria-current={selected === m.id || undefined}
                    className={cn('w-full border-b px-4 py-3 text-left hover:bg-accent', selected === m.id && 'bg-accent')}
                  >
                    <p className="truncate text-sm font-medium">{m.subject}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      to {m.to} · {formatDateTime(m.createdAt)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
        <section className="min-h-[60vh] bg-muted/40" aria-label="Email preview">
          {email.data ? (
            <iframe
              title={email.data.subject}
              srcDoc={email.data.html.replace('<head>', '<head><base target="_top">').replace('<html>', '<html><head><base target="_top"></head>')}
              sandbox="allow-top-navigation-by-user-activation"
              className="h-full min-h-[60vh] w-full bg-white"
            />
          ) : (
            <EmptyState icon={Inbox} title="Select an email" description="Links in emails open in this tab, so you can follow invite and reset flows." className="m-6 border-0" />
          )}
        </section>
      </main>
    </div>
  );
}
