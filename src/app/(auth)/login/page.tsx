'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { AuthCard } from '@/components/auth/auth-card';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { api, type AuthResponse } from '@/lib/api';
import { applyApiError } from '@/lib/forms';
import { homePath } from '@/lib/navigation';
import { loginSchema, type LoginInput } from '@/lib/shared';

function LoginForm() {
  const { setSession, status } = useAuth();
  const router = useRouter();
  const next = useSearchParams().get('next');
  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });

  useEffect(() => {
    if (status === 'authenticated') homePath(next).then((p) => router.replace(p));
  }, [status, next, router]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const res = await api<AuthResponse>('/auth/login', { method: 'POST', body: values, noRefresh: true });
      setSession(res);
      router.replace(await homePath(next));
    } catch (err) {
      applyApiError(err, form.setError, ['email', 'password']);
    }
  });

  const { errors, isSubmitting } = form.formState;
  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to your workspace."
      footer={
        <>
          New to TenantKit?{' '}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...form.register('email')} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <Input id="password" type="password" autoComplete="current-password" aria-invalid={!!errors.password} {...form.register('password')} />
        </Field>
        <div className="-mt-1 text-right">
          <Link href="/forgot" className="text-xs text-muted-foreground hover:text-foreground hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" loading={isSubmitting}>
          Sign in
        </Button>
      </form>
      <div className="mt-5 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
        Demo: <span className="font-mono">demo@tenantkit.dev</span> / <span className="font-mono">Demo1234!</span>
      </div>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
