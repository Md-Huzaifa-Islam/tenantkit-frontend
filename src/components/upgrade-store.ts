import { useSyncExternalStore } from 'react';

/** Tiny global store so any mutation can open the upgrade dialog. */
export function create() {
  let message: string | null = null;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());
  return {
    open(msg: string) {
      message = msg;
      emit();
    },
    close() {
      message = null;
      emit();
    },
    useMessage() {
      return useSyncExternalStore(
        (l) => {
          listeners.add(l);
          return () => listeners.delete(l);
        },
        () => message,
        () => null,
      );
    },
  };
}
