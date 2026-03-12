import { S3Renderer, RenderDefineStorageOptions } from '../../../../../../commands/gen2-migration/generate-new/output/storage/s3.renderer';
import { printNodes } from '../../../../../../commands/gen2-migration/generate-new/ts-writer';

describe('S3Renderer', () => {
  const renderer = new S3Renderer('main');

  async function render(opts: RenderDefineStorageOptions): Promise<string> {
    return printNodes(await renderer.render(opts));
  }

  it('renders a basic defineStorage with name', async () => {
    const output = await render({
      storageIdentifier: 'myBucket-main',
      triggerFunctionCategories: new Map(),
    });

    expect(output).toMatchInlineSnapshot(`
      "import { defineStorage } from '@aws-amplify/backend';

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export const storage = defineStorage({ name: \`myBucket-\${branchName}\` });
      "
    `);
  });

  it('renders auth access patterns', async () => {
    const output = await render({
      storageIdentifier: 'myBucket-main',
      accessPatterns: {
        auth: ['read', 'write'],
      },
      triggerFunctionCategories: new Map(),
    });

    expect(output).toMatchInlineSnapshot(`
      "import { defineStorage } from '@aws-amplify/backend';

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export const storage = defineStorage({
        name: \`myBucket-\${branchName}\`,
        access: (allow) => ({
          'public/*': [allow.authenticated.to(['read', 'write'])],
          'protected/{entity_id}/*': [allow.authenticated.to(['read', 'write'])],
          'private/{entity_id}/*': [allow.authenticated.to(['read', 'write'])],
        }),
      });
      "
    `);
  });

  it('renders guest access patterns', async () => {
    const output = await render({
      storageIdentifier: 'myBucket-main',
      accessPatterns: {
        guest: ['read'],
      },
      triggerFunctionCategories: new Map(),
    });

    expect(output).toMatchInlineSnapshot(`
      "import { defineStorage } from '@aws-amplify/backend';

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export const storage = defineStorage({
        name: \`myBucket-\${branchName}\`,
        access: (allow) => ({
          'public/*': [allow.guest.to(['read'])],
        }),
      });
      "
    `);
  });

  it('renders auth and guest access together with all paths', async () => {
    const output = await render({
      storageIdentifier: 'myBucket-main',
      accessPatterns: {
        auth: ['read', 'write', 'delete'],
        guest: ['read'],
      },
      triggerFunctionCategories: new Map(),
    });

    expect(output).toMatchInlineSnapshot(`
      "import { defineStorage } from '@aws-amplify/backend';

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
      "
    `);
  });

  it('renders group access patterns with TODO comment', async () => {
    const output = await render({
      storageIdentifier: 'myBucket-main',
      accessPatterns: {
        auth: ['read'],
        groups: {
          admin: ['read', 'write', 'delete'],
        },
      },
      triggerFunctionCategories: new Map(),
    });

    expect(output).toMatchInlineSnapshot(`
      "import { defineStorage } from '@aws-amplify/backend';

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
      "
    `);
  });

  it('renders function access patterns with imports', async () => {
    const output = await render({
      storageIdentifier: 'myBucket-main',
      accessPatterns: {
        functions: [{ functionName: 'processImages', category: 'function', permissions: ['read', 'write'] }],
      },
      triggerFunctionCategories: new Map(),
    });

    expect(output).toMatchInlineSnapshot(`
      "import { defineStorage } from '@aws-amplify/backend';
      import { processImages } from '../function/processImages/resource';

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
      "
    `);
  });

  it('renders triggers with function imports', async () => {
    const output = await render({
      storageIdentifier: 'myBucket-main',
      triggers: {
        onUpload: 'onUploadFn',
        onDelete: 'onDeleteFn',
      },
      triggerFunctionCategories: new Map([
        ['onUploadFn', 'function'],
        ['onDeleteFn', 'function'],
      ]),
    });

    expect(output).toMatchInlineSnapshot(`
      "import { defineStorage } from '@aws-amplify/backend';
      import { onUploadFn } from '../function/onUploadFn/resource';
      import { onDeleteFn } from '../function/onDeleteFn/resource';

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export const storage = defineStorage({
        name: \`myBucket-\${branchName}\`,
        triggers: {
          onUpload: onUploadFn,
          onDelete: onDeleteFn,
        },
      });
      "
    `);
  });

  it('renders storage trigger in same category with relative import', async () => {
    const output = await render({
      storageIdentifier: 'myBucket-main',
      triggers: {
        onUpload: 'triggerFn',
      },
      triggerFunctionCategories: new Map([['triggerFn', 'storage']]),
    });

    expect(output).toMatchInlineSnapshot(`
      "import { defineStorage } from '@aws-amplify/backend';
      import { triggerFn } from './triggerFn/resource';

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export const storage = defineStorage({
        name: \`myBucket-\${branchName}\`,
        triggers: {
          onUpload: triggerFn,
        },
      });
      "
    `);
  });

  it('consolidates duplicate function permissions', async () => {
    const output = await render({
      storageIdentifier: 'myBucket-main',
      accessPatterns: {
        functions: [
          { functionName: 'myFunc', category: 'function', permissions: ['read'] },
          { functionName: 'myFunc', category: 'function', permissions: ['write'] },
        ],
      },
      triggerFunctionCategories: new Map(),
    });

    expect(output).toMatchInlineSnapshot(`
      "import { defineStorage } from '@aws-amplify/backend';
      import { myFunc } from '../function/myFunc/resource';

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export const storage = defineStorage({
        name: \`myBucket-\${branchName}\`,
        access: (allow) => ({
          'public/*': [allow.resource(myFunc).to(['read', 'write'])],
          'protected/{entity_id}/*': [allow.resource(myFunc).to(['read', 'write'])],
          'private/{entity_id}/*': [allow.resource(myFunc).to(['read', 'write'])],
        }),
      });
      "
    `);
  });

  it('renders no access property when no access patterns', async () => {
    const output = await render({
      storageIdentifier: 'myBucket-main',
      triggerFunctionCategories: new Map(),
    });

    expect(output).not.toContain('access');
  });

  it('renders no triggers when empty', async () => {
    const output = await render({
      storageIdentifier: 'myBucket-main',
      triggers: {},
      triggerFunctionCategories: new Map(),
    });

    expect(output).not.toContain('triggers');
  });
});
