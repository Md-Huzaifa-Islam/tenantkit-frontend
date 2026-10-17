'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { AuthCard } from '@/components/auth/auth-card';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { api, type AuthResponse } from '@/lib/api';
import { applyApiError } from '@/lib/forms';
import { signupSchema, type SignupInput } from '@/lib/shared';

export default function SignupPage() {
  const { setSession } = useAuth();
  const router = useRouter();
  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '', workspaceName: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const res = await api<AuthResponse>('/auth/signup', { method: 'POST', body: values, noRefresh: true });
      setSession(res);
      toast.success('Workspace created. Check your inbox to verify your email.');
      router.replace(`/${res.workspaceSlug}/projects`);
    } catch (err) {
      applyApiError(err, form.setError, ['name', 'email', 'password', 'workspaceName']);
    }
  });

  const { errors, isSubmitting } = form.formState;
  return (
    <AuthCard
      title="Create your workspace"
      description="Start free. Upgrade when your team grows."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        <Field label="Your name" htmlFor="name" error={errors.name?.message}>
          <Input id="name" autoComplete="name" aria-invalid={!!errors.name} {...form.register('name')} />
        </Field>
        <Field label="Work email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...form.register('email')} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password?.message} hint="At least 8 characters, with a letter and a number.">
          <Input id="password" type="password" autoComplete="new-password" aria-invalid={!!errors.password} {...form.register('password')} />
        </Field>
        <Field label="Workspace name" htmlFor="workspaceName" error={errors.workspaceName?.message}>
          <Input id="workspaceName" placeholder="Acme Inc" aria-invalid={!!errors.workspaceName} {...form.register('workspaceName')} />
        </Field>
        <Button type="submit" loading={isSubmitting}>
          Create workspace
        </Button>
      </form>
    </AuthCard>
  );
}
