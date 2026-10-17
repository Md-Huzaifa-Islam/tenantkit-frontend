import Link from 'next/link';

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">TenantKit</h1>
      <p className="text-muted-foreground">
        Workspaces, roles, tenant isolation, billing and audit logs, ready on day one.
      </p>
      <Link
        href="/login"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Sign in
      </Link>
    </main>
  );
}
