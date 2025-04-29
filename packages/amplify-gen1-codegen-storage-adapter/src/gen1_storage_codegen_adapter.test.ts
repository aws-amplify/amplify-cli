import assert from 'node:assert';
import { getStorageDefinition } from './gen1_storage_codegen_adapter';
import { StorageCLIInputsJSON, getStorageAccess } from './storage_access';

void describe('getStorageDefinition', () => {
  void it('returns the bucket name', () => {
    const bucketName = 'my-cool-bucket';
    const definition = getStorageDefinition({
      bucketName,
      cliInputs: {
        guestAccess: [],
        authAccess: [],
      },
    });
    assert.equal(definition.storageIdentifier, bucketName);
  });
  void it('returns gen 2 permissions', () => {
    const gen1Input: StorageCLIInputsJSON = {
      authAccess: ['READ', 'CREATE_AND_UPDATE', 'DELETE'],
      guestAccess: ['READ', 'CREATE_AND_UPDATE', 'DELETE'],
      groupAccess: {
        deleters: ['DELETE'],
        readers: ['READ'],
        creators: ['CREATE_AND_UPDATE'],
      },
    };
    const permissions = getStorageAccess(gen1Input);
    const definition = getStorageDefinition({
      cliInputs: gen1Input,
      bucketName: 'hello',
    });
    assert.deepEqual(definition.accessPatterns, permissions);
  });
});
