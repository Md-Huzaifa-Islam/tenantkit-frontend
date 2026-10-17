import { cn, initials } from '@/lib/utils';

const palette = ['bg-indigo-500', 'bg-emerald-600', 'bg-amber-600', 'bg-rose-500', 'bg-sky-600', 'bg-violet-600', 'bg-teal-600'];

export function Avatar({ name, src, className }: { name: string; src?: string | null; className?: string }) {
  const color = palette[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % palette.length];
  if (src) {
    return <img src={src} alt="" className={cn('size-7 shrink-0 rounded-full object-cover', className)} />;
  }
  return (
    <span
      aria-hidden
      className={cn('inline-flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white', color, className)}
    >
      {initials(name) || '?'}
    </span>
  );
}
