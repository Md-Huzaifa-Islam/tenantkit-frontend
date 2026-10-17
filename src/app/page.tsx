'use client';

import { Building2, CreditCard, ScrollText, ShieldCheck, Users, Workflow } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { Logo } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { homePath } from '@/lib/navigation';

const features = [
  { icon: ShieldCheck, title: 'Postgres row-level security', text: 'Every tenant table is isolated in the database, not just in application code.' },
  { icon: Users, title: 'Teams & roles', text: 'Owner, admin and member roles from one permission matrix, enforced on every route.' },
  { icon: CreditCard, title: 'Stripe billing', text: 'Checkout, customer portal, idempotent webhooks and server-side plan limits.' },
  { icon: ScrollText, title: 'Audit log', text: 'Who changed what, when and from where, for every sensitive action.' },
  { icon: Building2, title: 'Multi-workspace', text: 'Users join many workspaces and switch between them instantly.' },
  { icon: Workflow, title: 'Admin panel', text: 'Platform metrics, suspensions and read-only support impersonation.' },
];

export default function Home() {
  const { status } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (status === 'authenticated') homePath().then((p) => router.replace(p));
  }, [status, router]);

  return (
    <div className="min-h-dvh bg-[radial-gradient(ellipse_at_top,var(--accent),transparent_55%)]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <nav className="flex gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Start free</Link>
          </Button>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-6 pb-20 pt-12 sm:pt-20">
        <section className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-medium text-primary">Multi-tenant SaaS starter</p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">The hard SaaS foundation, done on day one.</h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Workspaces, roles, tenant isolation, billing and audit logs, tested and ready, so your MVP starts at week three.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/signup">Create a workspace</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">View the demo</Link>
            </Button>
          </div>
        </section>
        <section aria-label="Features" className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border bg-card p-5 shadow-xs">
              <f.icon className="size-5 text-primary" aria-hidden />
              <h2 className="mt-3 font-semibold">{f.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
