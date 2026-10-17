'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { AuthCard } from '@/components/auth/auth-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { api } from '@/lib/api';
import { applyApiError } from '@/lib/forms';
import { passwordSchema } from '@/lib/shared';

const schema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'Passwords do not match' });

function ResetForm() {
  const token = useSearchParams().get('token') ?? '';
  const router = useRouter();
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { password: '', confirm: '' } });

  const onSubmit = form.handleSubmit(async ({ password }) => {
    try {
      await api('/auth/reset', { method: 'POST', body: { token, password }, noRefresh: true });
      toast.success('Password updated. Sign in with your new password.');
      router.replace('/login');
    } catch (err) {
      applyApiError(err, form.setError, ['password']);
    }
  });

  if (!token) {
    return (
      <AuthCard title="Invalid link" footer={<Link href="/forgot" className="font-medium text-primary hover:underline">Request a new link</Link>}>
        <p className="text-sm text-muted-foreground">This reset link is missing its token.</p>
      </AuthCard>
    );
  }

  const { errors, isSubmitting } = form.formState;
  return (
    <AuthCard title="Choose a new password" description="This signs you out of every other device.">
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        <Field label="New password" htmlFor="password" error={errors.password?.message}>
          <Input id="password" type="password" autoComplete="new-password" {...form.register('password')} />
        </Field>
        <Field label="Confirm password" htmlFor="confirm" error={errors.confirm?.message}>
          <Input id="confirm" type="password" autoComplete="new-password" {...form.register('confirm')} />
        </Field>
        <Button type="submit" loading={isSubmitting}>
          Update password
        </Button>
      </form>
    </AuthCard>
  );
}

export default function ResetPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
