import { S3Renderer, RenderDefineStorageOptions } from '../../../../../../commands/gen2-migration/generate/amplify/storage/s3.renderer';
import { TS } from '../../../../../../commands/gen2-migration/generate/_infra/ts';

describe('S3Renderer', () => {
  const renderer = new S3Renderer('main');

  function render(opts: RenderDefineStorageOptions): string {
    return TS.printNodes(renderer.render(opts));
  }

  it('renders a basic defineStorage with name', () => {
    const output = render({
      storageIdentifier: 'myBucket-main',
      bucketName: 'myBucket-main-abc123',
    });

    expect(output).toMatchInlineSnapshot(`
      "import { defineStorage } from '@aws-amplify/backend';
      import type { Backend } from '../backend';

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export const storage = defineStorage({ name: \`myBucket-\${branchName}\` });

      export function postRefactor(backend: Backend) {
        const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
        s3Bucket.bucketName = 'myBucket-main-abc123';
      }

      export function applyEscapeHatches(backend: Backend) {
        const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
      }
      "
    `);
  });

  it('renders auth access patterns', () => {
    const output = render({
      storageIdentifier: 'myBucket-main',
      bucketName: 'myBucket-main-abc123',
      accessPatterns: {
        auth: ['read', 'write'],
      },
    });

    expect(output).toMatchInlineSnapshot(`
      "import { defineStorage } from '@aws-amplify/backend';
      import type { Backend } from '../backend';

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export const storage = defineStorage({
        name: \`myBucket-\${branchName}\`,
        access: (allow) => ({
          'public/*': [allow.authenticated.to(['read', 'write'])],
          'protected/{entity_id}/*': [allow.authenticated.to(['read', 'write'])],
          'private/{entity_id}/*': [allow.authenticated.to(['read', 'write'])],
        }),
      });

      export function postRefactor(backend: Backend) {
        const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
        s3Bucket.bucketName = 'myBucket-main-abc123';
      }

      export function applyEscapeHatches(backend: Backend) {
        const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
      }
      "
    `);
  });

  it('renders guest access patterns', () => {
    const output = render({
      storageIdentifier: 'myBucket-main',
      bucketName: 'myBucket-main-abc123',
      accessPatterns: {
        guest: ['read'],
      },
    });

    expect(output).toMatchInlineSnapshot(`
      "import { defineStorage } from '@aws-amplify/backend';
      import type { Backend } from '../backend';

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export const storage = defineStorage({
        name: \`myBucket-\${branchName}\`,
        access: (allow) => ({
          'public/*': [allow.guest.to(['read'])],
        }),
      });

      export function postRefactor(backend: Backend) {
        const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
        s3Bucket.bucketName = 'myBucket-main-abc123';
      }

      export function applyEscapeHatches(backend: Backend) {
        const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
      }
      "
    `);
  });

  it('renders auth and guest access together with all paths', () => {
    const output = render({
      storageIdentifier: 'myBucket-main',
      bucketName: 'myBucket-main-abc123',
      accessPatterns: {
        auth: ['read', 'write', 'delete'],
        guest: ['read'],
      },
    });

    expect(output).toMatchInlineSnapshot(`
      "import { defineStorage } from '@aws-amplify/backend';
      import type { Backend } from '../backend';

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export const storage = defineStorage({
        name: \`myBucket-\${branchName}\`,
        access: (allow) => ({
          'public/*': [
            allow.guest.to(['read']),
            allow.authenticated.to(['read', 'write', 'delete']),
          ],
          'protected/{entity_id}/*': [
            allow.authenticated.to(['read', 'write', 'delete']),
          ],
          'private/{entity_id}/*': [
            allow.authenticated.to(['read', 'write', 'delete']),
          ],
        }),
      });

      export function postRefactor(backend: Backend) {
        const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
        s3Bucket.bucketName = 'myBucket-main-abc123';
      }

      export function applyEscapeHatches(backend: Backend) {
        const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
      }
      "
    `);
  });

  it('renders group access patterns with TODO comment', () => {
    const output = render({
      storageIdentifier: 'myBucket-main',
      bucketName: 'myBucket-main-abc123',
      accessPatterns: {
        auth: ['read'],
        groups: {
          admin: ['read', 'write', 'delete'],
        },
      },
    });

    expect(output).toMatchInlineSnapshot(`
      "import { defineStorage } from '@aws-amplify/backend';
      import type { Backend } from '../backend';

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';
      /**
       * TODO: Your project uses group permissions. Group permissions have changed in Gen 2. In order to grant permissions to groups in Gen 2, please refer to https://docs.amplify.aws/react/build-a-backend/storage/authorization/#for-gen-1-public-protected-and-private-access-pattern. */

      export const storage = defineStorage({
        name: \`myBucket-\${branchName}\`,
        access: (allow) => ({
          'public/*': [
            allow.authenticated.to(['read']),
            allow.groups(['admin']).to(['read', 'write', 'delete']),
          ],
          'protected/{entity_id}/*': [
            allow.authenticated.to(['read']),
            allow.groups(['admin']).to(['read', 'write', 'delete']),
          ],
          'private/{entity_id}/*': [
            allow.authenticated.to(['read']),
            allow.groups(['admin']).to(['read', 'write', 'delete']),
          ],
        }),
      });

      export function postRefactor(backend: Backend) {
        const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
        s3Bucket.bucketName = 'myBucket-main-abc123';
      }

      export function applyEscapeHatches(backend: Backend) {
        const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
      }
      "
    `);
  });

  it('renders function access patterns with imports', () => {
    const output = render({
      storageIdentifier: 'myBucket-main',
      bucketName: 'myBucket-main-abc123',
      accessPatterns: {
        functions: [{ functionName: 'processImages', permissions: ['read', 'write'] }],
      },
    });

    expect(output).toMatchInlineSnapshot(`
      "import { defineStorage } from '@aws-amplify/backend';
      import { processImages } from '../function/processImages/resource';
      import type { Backend } from '../backend';

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export const storage = defineStorage({
        name: \`myBucket-\${branchName}\`,
        access: (allow) => ({
          'public/*': [allow.resource(processImages).to(['read', 'write'])],
          'protected/{entity_id}/*': [
            allow.resource(processImages).to(['read', 'write']),
          ],
          'private/{entity_id}/*': [
            allow.resource(processImages).to(['read', 'write']),
          ],
        }),
      });

      export function postRefactor(backend: Backend) {
        const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
        s3Bucket.bucketName = 'myBucket-main-abc123';
      }

      export function applyEscapeHatches(backend: Backend) {
        const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
      }
      "
    `);
  });

  it('renders triggers with function imports', () => {
    const output = render({
      storageIdentifier: 'myBucket-main',
      bucketName: 'myBucket-main-abc123',
      triggers: {
        onUpload: 'onUploadFn',
        onDelete: 'onDeleteFn',
      },
    });

    expect(output).toMatchInlineSnapshot(`
      "import { defineStorage } from '@aws-amplify/backend';
      import { onUploadFn } from '../function/onUploadFn/resource';
      import { onDeleteFn } from '../function/onDeleteFn/resource';
      import type { Backend } from '../backend';

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export const storage = defineStorage({
        name: \`myBucket-\${branchName}\`,
        triggers: {
          onUpload: onUploadFn,
          onDelete: onDeleteFn,
        },
      });

      export function postRefactor(backend: Backend) {
        const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
        s3Bucket.bucketName = 'myBucket-main-abc123';
      }

      export function applyEscapeHatches(backend: Backend) {
        const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
      }
      "
    `);
  });

  it('renders storage trigger in same category with relative import', () => {
    const output = render({
      storageIdentifier: 'myBucket-main',
      bucketName: 'myBucket-main-abc123',
      triggers: {
        onUpload: 'triggerFn',
      },
    });

    expect(output).toMatchInlineSnapshot(`
      "import { defineStorage } from '@aws-amplify/backend';
      import { triggerFn } from '../function/triggerFn/resource';
      import type { Backend } from '../backend';

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export const storage = defineStorage({
        name: \`myBucket-\${branchName}\`,
        triggers: {
          onUpload: triggerFn,
        },
      });

      export function postRefactor(backend: Backend) {
        const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
        s3Bucket.bucketName = 'myBucket-main-abc123';
      }

      export function applyEscapeHatches(backend: Backend) {
        const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
      }
      "
    `);
  });

  it('consolidates duplicate function permissions', () => {
    const output = render({
      storageIdentifier: 'myBucket-main',
      bucketName: 'myBucket-main-abc123',
      accessPatterns: {
        functions: [
          { functionName: 'myFunc', permissions: ['read'] },
          { functionName: 'myFunc', permissions: ['write'] },
        ],
      },
    });

    expect(output).toMatchInlineSnapshot(`
      "import { defineStorage } from '@aws-amplify/backend';
      import { myFunc } from '../function/myFunc/resource';
      import type { Backend } from '../backend';

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export const storage = defineStorage({
        name: \`myBucket-\${branchName}\`,
        access: (allow) => ({
          'public/*': [allow.resource(myFunc).to(['read', 'write'])],
          'protected/{entity_id}/*': [allow.resource(myFunc).to(['read', 'write'])],
          'private/{entity_id}/*': [allow.resource(myFunc).to(['read', 'write'])],
        }),
      });

      export function postRefactor(backend: Backend) {
        const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
        s3Bucket.bucketName = 'myBucket-main-abc123';
      }

      export function applyEscapeHatches(backend: Backend) {
        const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
      }
      "
    `);
  });

  it('renders no access property when no access patterns', () => {
    const output = render({
      storageIdentifier: 'myBucket-main',
      bucketName: 'myBucket-main-abc123',
    });

    expect(output).not.toContain('access');
  });

  it('renders no triggers when empty', () => {
    const output = render({
      storageIdentifier: 'myBucket-main',
      bucketName: 'myBucket-main-abc123',
      triggers: {},
    });

    expect(output).not.toContain('triggers');
  });
});
