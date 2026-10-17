'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { AuthCard } from '@/components/auth/auth-card';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { api, errorMessage, type AuthResponse } from '@/lib/api';
import { applyApiError } from '@/lib/forms';
import { passwordSchema } from '@/lib/shared';

interface Preview {
  email: string;
  role: string;
  workspace: { name: string; logoUrl: string | null };
  invitedBy: string;
  accountExists: boolean;
}

const newAccount = z.object({ name: z.string().trim().min(1, 'Name is required').max(80), password: passwordSchema });

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const decoded = decodeURIComponent(token);
  const router = useRouter();
  const { user, setSession } = useAuth();
  const [joining, setJoining] = useState(false);
  const form = useForm<z.infer<typeof newAccount>>({ resolver: zodResolver(newAccount), defaultValues: { name: '', password: '' } });

  const preview = useQuery({
    queryKey: ['invite-preview', decoded],
    queryFn: () => api<Preview>('/invites/preview', { method: 'POST', body: { token: decoded }, noRefresh: true }),
    retry: false,
  });

  async function accept(extra: Partial<z.infer<typeof newAccount>> = {}) {
    const res = await api<AuthResponse>('/invites/accept', { method: 'POST', body: { token: decoded, ...extra }, noRefresh: true });
    setSession(res);
    toast.success(`Welcome to ${preview.data?.workspace.name}!`);
    router.replace(`/${res.workspaceSlug}/projects`);
  }

  if (preview.isPending) {
    return (
      <AuthCard title="Loading invitation…">
        <Skeleton className="h-16 w-full" />
      </AuthCard>
    );
  }
  if (preview.isError) {
    return (
      <AuthCard title="Invitation unavailable" footer={<Link href="/login" className="font-medium text-primary hover:underline">Go to sign in</Link>}>
        <p className="text-sm text-muted-foreground">{errorMessage(preview.error)}. Ask the person who invited you to send a new one.</p>
      </AuthCard>
    );
  }

  const p = preview.data;
  const signedInAsOther = user && user.email !== p.email;
  return (
    <AuthCard title={`Join ${p.workspace.name}`} description={`${p.invitedBy} invited ${p.email} as ${p.role.toLowerCase()}.`}>
      <div className="mb-5 flex items-center gap-3 rounded-lg bg-accent px-3 py-2.5 text-sm text-accent-foreground">
        <Users className="size-4 shrink-0" aria-hidden />
        <span>Accepting signs you in as <strong>{p.email}</strong>.</span>
      </div>
      {signedInAsOther && (
        <p className="mb-4 text-xs text-muted-foreground">You are currently signed in as {user.email}; accepting switches to the invited account.</p>
      )}
      {p.accountExists ? (
        <Button
          className="w-full"
          loading={joining}
          onClick={async () => {
            setJoining(true);
            try {
              await accept();
            } catch (err) {
              toast.error(errorMessage(err));
              setJoining(false);
            }
          }}
        >
          Accept invitation
        </Button>
      ) : (
        <form
          className="grid gap-4"
          noValidate
          onSubmit={form.handleSubmit(async (values) => {
            try {
              await accept(values);
            } catch (err) {
              applyApiError(err, form.setError, ['name', 'password']);
            }
          })}
        >
          <Field label="Your name" htmlFor="name" error={form.formState.errors.name?.message}>
            <Input id="name" autoComplete="name" {...form.register('name')} />
          </Field>
          <Field label="Choose a password" htmlFor="password" error={form.formState.errors.password?.message}>
            <Input id="password" type="password" autoComplete="new-password" {...form.register('password')} />
          </Field>
          <Button type="submit" loading={form.formState.isSubmitting}>
            Create account &amp; join
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
