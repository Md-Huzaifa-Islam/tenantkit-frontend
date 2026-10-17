import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { toast } from 'sonner';
import { ApiError, errorMessage } from './api';

/** Maps API validation issues onto form fields; anything else becomes a toast. */
export function applyApiError<T extends FieldValues>(err: unknown, setError: UseFormSetError<T>, fields: Array<Path<T>>) {
  if (err instanceof ApiError) {
    const byField = err.fieldErrors;
    const matched = fields.filter((f) => byField[f]);
    matched.forEach((f) => setError(f, { message: byField[f] }));
    if (matched.length > 0) return;
  }
  toast.error(errorMessage(err));
}
