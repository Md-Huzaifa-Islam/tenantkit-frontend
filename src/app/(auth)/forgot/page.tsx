'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { MailCheck } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AuthCard } from '@/components/auth/auth-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { api } from '@/lib/api';
import { applyApiError } from '@/lib/forms';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/shared';

export default function ForgotPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: '' } });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await api('/auth/forgot', { method: 'POST', body: values, noRefresh: true });
      setSentTo(values.email);
    } catch (err) {
      applyApiError(err, form.setError, ['email']);
    }
  });

  if (sentTo) {
    return (
      <AuthCard title="Check your email" footer={<Link href="/login" className="font-medium text-primary hover:underline">Back to sign in</Link>}>
        <div className="flex gap-3 text-sm text-muted-foreground">
          <MailCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
          <p>
            If an account exists for <strong className="text-foreground">{sentTo}</strong>, we sent a link to reset the password. It expires in 1 hour.
          </p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Reset your password"
      description="We'll email you a link to choose a new one."
      footer={<Link href="/login" className="font-medium text-primary hover:underline">Back to sign in</Link>}
    >
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        <Field label="Email" htmlFor="email" error={form.formState.errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
        </Field>
        <Button type="submit" loading={form.formState.isSubmitting}>
          Send reset link
        </Button>
      </form>
    </AuthCard>
  );
}
