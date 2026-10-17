import { RequireAuth } from '@/components/auth/require-auth';

export default function MockBillingLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <div className="flex min-h-dvh items-start justify-center bg-[#f6f9fc] px-4 py-12 text-[#1a1f36] sm:items-center">
        <div className="w-full max-w-md">
          <div className="mb-4 rounded-md bg-amber-100 px-3 py-2 text-center text-xs font-medium text-amber-900">
            Test mode · Mock billing provider · No real payment is taken
          </div>
          {children}
        </div>
      </div>
    </RequireAuth>
  );
}
