import assert from 'node:assert';
import { Permission } from '@aws-amplify/amplify-gen2-codegen';
import { StorageCLIInputsJSON, getStorageAccess } from './storage_access';
import { CLIV1Permission } from './storage_access';

const getCLIInput = (): StorageCLIInputsJSON => ({
  resourceName: 'myappstorage',
  policyUUID: 'my-policy-uuid',
  bucketName: 'my-cool-bucket',
  storageAccess: 'authAndGuest',
  guestAccess: [],
  authAccess: [],
  triggerFunction: 'S3Triggerb5519e27',
  groupAccess: {},
});

void describe('getStorageAccess', () => {
  void describe('group permissions', () => {
    type StorageAccessTestCase<T extends string = string> = {
      gen1: Record<T, CLIV1Permission[]>;
      gen2: Record<T, Permission[]>;
    };
    const testCases: StorageAccessTestCase[] = [
      {
        gen1: {
          managers: ['CREATE_AND_UPDATE', 'READ', 'DELETE'],
          employees: ['CREATE_AND_UPDATE', 'READ'],
          viewers: ['READ'],
        },
        gen2: {
          managers: ['read', 'write', 'delete'],
          employees: ['write', 'read'],
          viewers: ['read'],
        },
      },
    ];
    for (const { gen1, gen2 } of testCases) {
      void it('returns group permissions', () => {
        const input = getCLIInput();
        input.groupAccess = gen1;
        const access = getStorageAccess(input);
        for (const group in gen1) {
          assert.deepEqual(access?.groups?.[group].sort(), gen2[group].sort());
        }
      });

      void it('returns empty group permissions', () => {
        const input = getCLIInput();
        input.groupAccess = {};
        const access = getStorageAccess(input);
        assert.notEqual(access, undefined);
        assert.deepEqual(access?.groups, undefined);
      });
    }
  });
  void describe('auth and unauth', () => {
    void it('correctly maps permissions', () => {
      const input = getCLIInput();
      const unauthPermissions: CLIV1Permission[] = ['READ'];
      const authPermissions: CLIV1Permission[] = ['CREATE_AND_UPDATE', 'DELETE', 'READ'];
      input.authAccess = authPermissions;
      input.guestAccess = unauthPermissions;
      const access = getStorageAccess(input);
      assert.deepEqual(access?.guest?.sort(), ['read'].sort());
      assert.deepEqual(access?.auth?.sort(), ['read', 'write', 'delete'].sort());
    });
  });
});
