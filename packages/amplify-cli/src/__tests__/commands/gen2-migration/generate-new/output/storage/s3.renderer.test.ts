import { S3Renderer, RenderDefineStorageOptions } from '../../../../../../commands/gen2-migration/generate-new/output/storage/s3.renderer';
import { printNodes } from '../../../../../../commands/gen2-migration/generate-new/ts-writer';

describe('S3Renderer', () => {
  const renderer = new S3Renderer('main');

  it('renders a basic defineStorage with name', async () => {
    const opts: RenderDefineStorageOptions = {
      storageIdentifier: 'myBucket-main',
      triggerFunctionCategories: new Map(),
    };
    const nodes = await renderer.render(opts);
    const output = printNodes(nodes);

    expect(output).toContain('defineStorage');
    expect(output).toContain('export const storage');
    expect(output).toContain('myBucket-');
    expect(output).toContain('branchName');
  });

  it('renders auth access patterns', async () => {
    const opts: RenderDefineStorageOptions = {
      storageIdentifier: 'myBucket-main',
      accessPatterns: {
        auth: ['read', 'write'],
      },
      triggerFunctionCategories: new Map(),
    };
    const nodes = await renderer.render(opts);
    const output = printNodes(nodes);

    expect(output).toContain('access');
    expect(output).toContain('authenticated');
    expect(output).toContain("'read'");
    expect(output).toContain("'write'");
  });

  it('renders guest access patterns', async () => {
    const opts: RenderDefineStorageOptions = {
      storageIdentifier: 'myBucket-main',
      accessPatterns: {
        guest: ['read'],
      },
      triggerFunctionCategories: new Map(),
    };
    const nodes = await renderer.render(opts);
    const output = printNodes(nodes);

    expect(output).toContain('guest');
    expect(output).toContain("'read'");
    expect(output).toContain('public/*');
  });

  it('renders auth and guest access together with all paths', async () => {
    const opts: RenderDefineStorageOptions = {
      storageIdentifier: 'myBucket-main',
      accessPatterns: {
        auth: ['read', 'write', 'delete'],
        guest: ['read'],
      },
      triggerFunctionCategories: new Map(),
    };
    const nodes = await renderer.render(opts);
    const output = printNodes(nodes);

    expect(output).toContain('public/*');
    expect(output).toContain('protected/{entity_id}/*');
    expect(output).toContain('private/{entity_id}/*');
  });

  it('renders group access patterns with TODO comment', async () => {
    const opts: RenderDefineStorageOptions = {
      storageIdentifier: 'myBucket-main',
      accessPatterns: {
        auth: ['read'],
        groups: {
          admin: ['read', 'write', 'delete'],
        },
      },
      triggerFunctionCategories: new Map(),
    };
    const nodes = await renderer.render(opts);
    const output = printNodes(nodes);

    expect(output).toContain('admin');
    expect(output).toContain('TODO');
    expect(output).toContain('group permissions');
  });

  it('renders function access patterns with imports', async () => {
    const opts: RenderDefineStorageOptions = {
      storageIdentifier: 'myBucket-main',
      accessPatterns: {
        functions: [{ functionName: 'processImages', category: 'function', permissions: ['read', 'write'] }],
      },
      triggerFunctionCategories: new Map(),
    };
    const nodes = await renderer.render(opts);
    const output = printNodes(nodes);

    expect(output).toContain('processImages');
    expect(output).toContain("'read'");
    expect(output).toContain("'write'");
    expect(output).toContain("from '../function/processImages/resource'");
  });

  it('renders triggers with function imports', async () => {
    const opts: RenderDefineStorageOptions = {
      storageIdentifier: 'myBucket-main',
      triggers: {
        onUpload: { source: 'amplify/backend/function/onUploadFn/src' },
        onDelete: { source: 'amplify/backend/function/onDeleteFn/src' },
      },
      triggerFunctionCategories: new Map([
        ['onUploadFn', 'function'],
        ['onDeleteFn', 'function'],
      ]),
    };
    const nodes = await renderer.render(opts);
    const output = printNodes(nodes);

    expect(output).toContain('triggers');
    expect(output).toContain('onUpload');
    expect(output).toContain('onDelete');
    expect(output).toContain('onUploadFn');
    expect(output).toContain('onDeleteFn');
  });

  it('renders storage trigger in same category with relative import', async () => {
    const opts: RenderDefineStorageOptions = {
      storageIdentifier: 'myBucket-main',
      triggers: {
        onUpload: { source: 'amplify/backend/storage/triggerFn/src' },
      },
      triggerFunctionCategories: new Map([['triggerFn', 'storage']]),
    };
    const nodes = await renderer.render(opts);
    const output = printNodes(nodes);

    expect(output).toContain("from './triggerFn/resource'");
  });

  it('consolidates duplicate function permissions', async () => {
    const opts: RenderDefineStorageOptions = {
      storageIdentifier: 'myBucket-main',
      accessPatterns: {
        functions: [
          { functionName: 'myFunc', category: 'function', permissions: ['read'] },
          { functionName: 'myFunc', category: 'function', permissions: ['write'] },
        ],
      },
      triggerFunctionCategories: new Map(),
    };
    const nodes = await renderer.render(opts);
    const output = printNodes(nodes);

    expect(output).toContain("'read'");
    expect(output).toContain("'write'");
  });

  it('renders no access property when no access patterns', async () => {
    const opts: RenderDefineStorageOptions = {
      storageIdentifier: 'myBucket-main',
      triggerFunctionCategories: new Map(),
    };
    const nodes = await renderer.render(opts);
    const output = printNodes(nodes);

    expect(output).not.toContain('access');
  });

  it('renders no triggers when empty', async () => {
    const opts: RenderDefineStorageOptions = {
      storageIdentifier: 'myBucket-main',
      triggers: {},
      triggerFunctionCategories: new Map(),
    };
    const nodes = await renderer.render(opts);
    const output = printNodes(nodes);

    expect(output).not.toContain('triggers');
  });
});
