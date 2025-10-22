import { AmplifyMigrationLockStep } from '../../../commands/gen2-migration/lock';

describe('validate', () => {
  it('should return true', async () => {
    const lock = new AmplifyMigrationLockStep({} as any);
    const result = await lock.validate();

    expect(result).toBe(true);
  });

  it('should return false', async () => {
    const lock = new AmplifyMigrationLockStep({} as any);
    const result = await lock.validate();

    expect(result).toBe(false);
  });
});
