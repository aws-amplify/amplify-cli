import assert from 'node:assert';
import { AccessPatterns, Permission, renderStorage, StorageTriggerEvent } from './source_builder';
import { printNodeArray } from '../test_utils/ts_node_printer';
import { Lambda } from '../function/lambda';

describe('Storage source generation', () => {
  describe('storage triggers', () => {
    const triggers: Record<StorageTriggerEvent, Lambda> = {
      onDelete: { source: 'amplify/backend/storage/onDelete/' },
      onUpload: { source: 'amplify/backend/storage/onUpload' },
    };
    for (const [key, value] of Object.entries(triggers)) {
      it(`${key} trigger is rendered`, () => {
        const rendered = renderStorage({ triggers });
        const output = printNodeArray(rendered);
        assert.match(output, new RegExp(`${key}: ${value.source.split('/')[3]}`));
        assert.match(output, /triggers: /);
      });
    }
  });
  describe('imports', () => {
    it('renders the defineStorage import', () => {
      const rendered = renderStorage();
      const output = printNodeArray(rendered);
      assert.match(output, /import\s?\{\s?defineStorage\s?\}\s?from\s?"\@aws-amplify\/backend"/);
    });
  });
  describe('defineStorage', () => {
    describe('parameters', () => {
      it('does not render `name` if `storageIdentifier` is undefined', () => {
        const rendered = renderStorage();
        const output = printNodeArray(rendered);

        assert(!output.includes(`name:`));
      });
      it('renders `name` if the `storageIdentifier` is passed', () => {
        const storageIdentifier = 'my-cool-bucket';
        const rendered = renderStorage({ storageIdentifier });
        const output = printNodeArray(rendered);

        assert(output.includes(`name: "${storageIdentifier}"`));
      });
      const permissions: Permission[] = ['read', 'write', 'delete'];

      describe('access parameters', () => {
        describe('groups', () => {
          it(`renders a comment when group permissions are present in Gen 1`, () => {
            const groupName = 'manager';
            const accessPatterns: AccessPatterns = {
              groups: { [groupName]: ['read'] },
            };
            const rendered = renderStorage({ accessPatterns });
            const output = printNodeArray(rendered);
            assert.match(output, new RegExp(`Your project uses group permissions.`));
          });
          it(`does not render a comment when group permissions are not present in Gen 1`, () => {
            const accessPatterns: AccessPatterns = {};
            const rendered = renderStorage({ accessPatterns });
            const output = printNodeArray(rendered);
            assert.doesNotMatch(output, new RegExp(`Your project uses group permissions.`));
          });
        });
        const accessLevels = ['private', 'public', 'protected'];
        for (const accessLevel of accessLevels) {
          describe('authenticated', () => {
            for (const permission of permissions) {
              it(`grants ${permission} to ${accessLevel} path for authenticated user`, () => {
                const accessPatterns: AccessPatterns = {
                  auth: [permission],
                };
                const rendered = renderStorage({ accessPatterns });
                const output = printNodeArray(rendered);
                assert.match(output, new RegExp(`${accessLevel}.*?allow.authenticated.to\\(\\["${permission}"\\]\\)`));
              });
            }
          });
        }
        describe('guest', () => {
          for (const permission of permissions) {
            it(`grants ${permission} to public path to guest`, async () => {
              const accessPatterns: AccessPatterns = {
                guest: [permission],
              };
              const rendered = renderStorage({ accessPatterns });
              const output = printNodeArray(rendered);

              assert.match(output, new RegExp(`public.*?allow.guest.to\\(\\["${permission}"\\]\\)`));
            });
          }
        });
      });
    });
  });
});
