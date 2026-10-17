import { describe, expect, it } from 'vitest';
import { can, canManageMember } from './permissions';

// Mirrors the backend matrix tests: the UI must hide exactly what the API forbids.
describe('permission matrix (frontend copy)', () => {
  it('matches the RBAC rules the API enforces', () => {
    expect(can('MEMBER', 'member.invite')).toBe(false);
    expect(can('ADMIN', 'billing.manage')).toBe(false);
    expect(can('ADMIN', 'workspace.transfer')).toBe(false);
    expect(can('OWNER', 'workspace.transfer')).toBe(true);
    expect(can('MEMBER', 'task.create')).toBe(true);
    expect(canManageMember('ADMIN', 'OWNER')).toBe(false);
  });
});
