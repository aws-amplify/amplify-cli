import { S3Generator } from '../../../../../../commands/gen2-migration/generate/amplify/storage/s3.generator';
import { BackendGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/backend.generator';
import { createGen1App } from '../../_helpers/create-gen1-app';
import { SpinningLogger } from '../../../../../../commands/gen2-migration/_common/spinning-logger';

jest.unmock('fs-extra');

const mockMkdir = jest.fn().mockResolvedValue(undefined);
const mockWriteFile = jest.fn().mockResolvedValue(undefined);
jest.mock('node:fs/promises', () => ({
  mkdir: (...args: unknown[]) => mockMkdir(...args),
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
}));

function writtenFile(suffix: string): string {
  const call = mockWriteFile.mock.calls.find((c: unknown[]) => (c[0] as string).endsWith(suffix));
  if (!call) throw new Error(`No writeFile call ending with '${suffix}'`);
  return call[1] as string;
}

describe('S3Generator', () => {
  let backendGenerator: BackendGenerator;
  const outputDir = '/fake/output';
  const logger = new SpinningLogger('test');

  beforeEach(() => {
    jest.clearAllMocks();
    backendGenerator = new BackendGenerator(outputDir, logger);
  });

  it('returns one operation describing storage/resource.ts', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      storage: { myBucket: { service: 'S3', output: { BucketName: 'myBucket-main-abc123' } } },
    });
    jest.spyOn(gen1App, 'cliInputs').mockReturnValue({ authAccess: [], guestAccess: [] });
    jest.spyOn(gen1App.aws, 'fetchBucketAccelerate').mockResolvedValue(undefined);
    jest.spyOn(gen1App.aws, 'fetchBucketVersioning').mockResolvedValue(undefined);
    jest.spyOn(gen1App.aws, 'fetchBucketEncryption').mockResolvedValue(undefined);

    const generator = new S3Generator(
      gen1App,
      backendGenerator,
      outputDir,
      {
        category: 'storage',
        resourceName: 'myBucket',
        service: 'S3',
        key: 'storage:S3',
      },
      logger,
    );
    const ops = await generator.plan();

    expect(ops).toHaveLength(1);
    const descriptions = await ops[0].describe();
    expect(descriptions[0]).toContain('storage/resource.ts');
  });

  it('registers namespace import and defineBackend entry on backendGenerator', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      storage: { myBucket: { service: 'S3', output: { BucketName: 'myBucket-main-abc123' } } },
    });
    jest.spyOn(gen1App, 'cliInputs').mockReturnValue({ authAccess: [], guestAccess: [] });
    jest.spyOn(gen1App.aws, 'fetchBucketAccelerate').mockResolvedValue(undefined);
    jest.spyOn(gen1App.aws, 'fetchBucketVersioning').mockResolvedValue(undefined);
    jest.spyOn(gen1App.aws, 'fetchBucketEncryption').mockResolvedValue(undefined);

    const addNamespaceImportSpy = jest.spyOn(backendGenerator, 'addNamespaceImport');
    const addDefineBackendEntrySpy = jest.spyOn(backendGenerator, 'addDefineBackendEntry');

    const generator = new S3Generator(
      gen1App,
      backendGenerator,
      outputDir,
      {
        category: 'storage',
        resourceName: 'myBucket',
        service: 'S3',
        key: 'storage:S3',
      },
      logger,
    );
    const ops = await generator.plan();
    await ops[0].execute();

    expect(addNamespaceImportSpy).toHaveBeenCalledWith('storage', './storage/resource');
    expect(addDefineBackendEntrySpy).toHaveBeenCalledWith('storage', 'storage', 'storage');
  });

  it('renders a basic defineStorage with name', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      storage: { myBucket: { service: 'S3', output: { BucketName: 'myBucket-main-abc123' } } },
    });
    jest.spyOn(gen1App, 'cliInputs').mockReturnValue({ authAccess: [], guestAccess: [] });
    jest.spyOn(gen1App.aws, 'fetchBucketAccelerate').mockResolvedValue(undefined);
    jest.spyOn(gen1App.aws, 'fetchBucketVersioning').mockResolvedValue(undefined);
    jest.spyOn(gen1App.aws, 'fetchBucketEncryption').mockResolvedValue(undefined);

    const generator = new S3Generator(
      gen1App,
      backendGenerator,
      outputDir,
      {
        category: 'storage',
        resourceName: 'myBucket',
        service: 'S3',
        key: 'storage:S3',
      },
      logger,
    );
    const ops = await generator.plan();
    await ops[0].execute();

    expect(writtenFile('resource.ts')).toMatchInlineSnapshot(`
      "import { defineStorage } from '@aws-amplify/backend';
      import { CfnResource } from 'aws-cdk-lib';
      import type { Backend } from '../backend';

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export const storage = defineStorage({
        name: \`myBucket-main-\${branchName}\`,
        access: (allow) => ({}),
      });

      export function postRefactor(backend: Backend) {
        const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
        s3Bucket.bucketName = 'myBucket-main-abc123';
      }

      export function applyEscapeHatches(backend: Backend) {
        const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
        for (const cfnResource of backend.storage.stack.node
          .findAll()
          .filter(
            (c) =>
              CfnResource.isCfnResource(c) &&
              ['AWS::S3::Bucket', 'Custom::S3AutoDeleteObjects'].includes(
                c.cfnResourceType
              )
          )) {
          (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
          (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
        }
      }
      "
    `);
  });

  it('renders auth access patterns', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      storage: { myBucket: { service: 'S3', output: { BucketName: 'myBucket-main-abc123' } } },
    });
    jest.spyOn(gen1App, 'cliInputs').mockReturnValue({
      authAccess: ['READ', 'CREATE_AND_UPDATE'],
      guestAccess: [],
    });
    jest.spyOn(gen1App.aws, 'fetchBucketAccelerate').mockResolvedValue(undefined);
    jest.spyOn(gen1App.aws, 'fetchBucketVersioning').mockResolvedValue(undefined);
    jest.spyOn(gen1App.aws, 'fetchBucketEncryption').mockResolvedValue(undefined);

    const generator = new S3Generator(
      gen1App,
      backendGenerator,
      outputDir,
      {
        category: 'storage',
        resourceName: 'myBucket',
        service: 'S3',
        key: 'storage:S3',
      },
      logger,
    );
    const ops = await generator.plan();
    await ops[0].execute();

    expect(writtenFile('resource.ts')).toMatchInlineSnapshot(`
      "import { defineStorage } from '@aws-amplify/backend';
      import { CfnResource } from 'aws-cdk-lib';
      import type { Backend } from '../backend';

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export const storage = defineStorage({
        name: \`myBucket-main-\${branchName}\`,
        access: (allow) => ({
          'public/*': [allow.authenticated.to(['read', 'write'])],
          'protected/{entity_id}/*': [
            allow.entity('identity').to(['read', 'write']),
            allow.authenticated.to(['read']),
          ],
          'private/{entity_id}/*': [allow.entity('identity').to(['read', 'write'])],
        }),
      });

      export function postRefactor(backend: Backend) {
        const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
        s3Bucket.bucketName = 'myBucket-main-abc123';
      }

      export function applyEscapeHatches(backend: Backend) {
        const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
        for (const cfnResource of backend.storage.stack.node
          .findAll()
          .filter(
            (c) =>
              CfnResource.isCfnResource(c) &&
              ['AWS::S3::Bucket', 'Custom::S3AutoDeleteObjects'].includes(
                c.cfnResourceType
              )
          )) {
          (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
          (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
        }
      }
      "
    `);
  });

  // private/ and protected/ are per-user paths: authenticated access must be scoped to the
  // caller's own identity via allow.entity('identity'), matching the Gen1 configuration.
  it('scopes authenticated private/protected access to the caller identity', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      storage: { myBucket: { service: 'S3', output: { BucketName: 'myBucket-main-abc123' } } },
    });
    jest.spyOn(gen1App, 'cliInputs').mockReturnValue({
      authAccess: ['READ', 'CREATE_AND_UPDATE', 'DELETE'],
      guestAccess: [],
    });
    jest.spyOn(gen1App.aws, 'fetchBucketAccelerate').mockResolvedValue(undefined);
    jest.spyOn(gen1App.aws, 'fetchBucketVersioning').mockResolvedValue(undefined);
    jest.spyOn(gen1App.aws, 'fetchBucketEncryption').mockResolvedValue(undefined);

    const generator = new S3Generator(
      gen1App,
      backendGenerator,
      outputDir,
      { category: 'storage', resourceName: 'myBucket', service: 'S3', key: 'storage:S3' },
      logger,
    );
    const ops = await generator.plan();
    await ops[0].execute();
    const content = writtenFile('resource.ts');
    const normalized = content.replace(/\s+/g, ' ');

    // Positive assertion: full generated file locks the per-user mapping (owner scoped to
    // entity('identity'); protected/ retains authenticated read).
    expect(content).toMatchInlineSnapshot(`
      "import { defineStorage } from '@aws-amplify/backend';
      import { CfnResource } from 'aws-cdk-lib';
      import type { Backend } from '../backend';

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export const storage = defineStorage({
        name: \`myBucket-main-\${branchName}\`,
        access: (allow) => ({
          'public/*': [allow.authenticated.to(['read', 'write', 'delete'])],
          'protected/{entity_id}/*': [
            allow.entity('identity').to(['read', 'write', 'delete']),
            allow.authenticated.to(['read']),
          ],
          'private/{entity_id}/*': [
            allow.entity('identity').to(['read', 'write', 'delete']),
          ],
        }),
      });

      export function postRefactor(backend: Backend) {
        const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
        s3Bucket.bucketName = 'myBucket-main-abc123';
      }

      export function applyEscapeHatches(backend: Backend) {
        const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
        for (const cfnResource of backend.storage.stack.node
          .findAll()
          .filter(
            (c) =>
              CfnResource.isCfnResource(c) &&
              ['AWS::S3::Bucket', 'Custom::S3AutoDeleteObjects'].includes(
                c.cfnResourceType
              )
          )) {
          (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
          (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
        }
      }
      "
    `);

    // private/ and protected/ must not grant write/delete via allow.authenticated (public/*
    // legitimately can, so the check is scoped to those paths). Rules render in the order
    // public, protected, private, so slice out each per-user segment and assert on it.
    const protectedSegment = normalized.slice(
      normalized.indexOf("'protected/{entity_id}/*'"),
      normalized.indexOf("'private/{entity_id}/*'"),
    );
    const privateSegment = normalized.slice(normalized.indexOf("'private/{entity_id}/*'"));
    for (const segment of [protectedSegment, privateSegment]) {
      expect(segment).not.toMatch(/allow\.authenticated\.to\(\[[^\]]*'(write|delete)'/);
    }
  });

  it('scopes write-only authenticated protected access and retains authenticated read', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      storage: { myBucket: { service: 'S3', output: { BucketName: 'myBucket-main-abc123' } } },
    });
    // Write-only Gen1 auth (no READ in the auth set): the owner rule must still render as
    // entity('identity').to(['write']) and protected/ must still get the unconditional
    // authenticated read (Gen1 cross-user read semantics).
    jest.spyOn(gen1App, 'cliInputs').mockReturnValue({
      authAccess: ['CREATE_AND_UPDATE'],
      guestAccess: [],
    });
    jest.spyOn(gen1App.aws, 'fetchBucketAccelerate').mockResolvedValue(undefined);
    jest.spyOn(gen1App.aws, 'fetchBucketVersioning').mockResolvedValue(undefined);
    jest.spyOn(gen1App.aws, 'fetchBucketEncryption').mockResolvedValue(undefined);

    const generator = new S3Generator(
      gen1App,
      backendGenerator,
      outputDir,
      { category: 'storage', resourceName: 'myBucket', service: 'S3', key: 'storage:S3' },
      logger,
    );
    const ops = await generator.plan();
    await ops[0].execute();

    expect(writtenFile('resource.ts')).toMatchInlineSnapshot(`
      "import { defineStorage } from '@aws-amplify/backend';
      import { CfnResource } from 'aws-cdk-lib';
      import type { Backend } from '../backend';

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export const storage = defineStorage({
        name: \`myBucket-main-\${branchName}\`,
        access: (allow) => ({
          'public/*': [allow.authenticated.to(['write'])],
          'protected/{entity_id}/*': [
            allow.entity('identity').to(['write']),
            allow.authenticated.to(['read']),
          ],
          'private/{entity_id}/*': [allow.entity('identity').to(['write'])],
        }),
      });

      export function postRefactor(backend: Backend) {
        const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
        s3Bucket.bucketName = 'myBucket-main-abc123';
      }

      export function applyEscapeHatches(backend: Backend) {
        const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
        for (const cfnResource of backend.storage.stack.node
          .findAll()
          .filter(
            (c) =>
              CfnResource.isCfnResource(c) &&
              ['AWS::S3::Bucket', 'Custom::S3AutoDeleteObjects'].includes(
                c.cfnResourceType
              )
          )) {
          (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
          (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
        }
      }
      "
    `);
  });

  it('renders guest access patterns', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      storage: { myBucket: { service: 'S3', output: { BucketName: 'myBucket-main-abc123' } } },
    });
    jest.spyOn(gen1App, 'cliInputs').mockReturnValue({ authAccess: [], guestAccess: ['READ'] });
    jest.spyOn(gen1App.aws, 'fetchBucketAccelerate').mockResolvedValue(undefined);
    jest.spyOn(gen1App.aws, 'fetchBucketVersioning').mockResolvedValue(undefined);
    jest.spyOn(gen1App.aws, 'fetchBucketEncryption').mockResolvedValue(undefined);

    const generator = new S3Generator(
      gen1App,
      backendGenerator,
      outputDir,
      {
        category: 'storage',
        resourceName: 'myBucket',
        service: 'S3',
        key: 'storage:S3',
      },
      logger,
    );
    const ops = await generator.plan();
    await ops[0].execute();

    expect(writtenFile('resource.ts')).toMatchInlineSnapshot(`
      "import { defineStorage } from '@aws-amplify/backend';
      import { CfnResource } from 'aws-cdk-lib';
      import type { Backend } from '../backend';

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export const storage = defineStorage({
        name: \`myBucket-main-\${branchName}\`,
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
        for (const cfnResource of backend.storage.stack.node
          .findAll()
          .filter(
            (c) =>
              CfnResource.isCfnResource(c) &&
              ['AWS::S3::Bucket', 'Custom::S3AutoDeleteObjects'].includes(
                c.cfnResourceType
              )
          )) {
          (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
          (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
        }
      }
      "
    `);
  });

  it('renders auth and guest access together', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      storage: { myBucket: { service: 'S3', output: { BucketName: 'myBucket-main-abc123' } } },
    });
    jest.spyOn(gen1App, 'cliInputs').mockReturnValue({
      authAccess: ['READ', 'CREATE_AND_UPDATE', 'DELETE'],
      guestAccess: ['READ'],
    });
    jest.spyOn(gen1App.aws, 'fetchBucketAccelerate').mockResolvedValue(undefined);
    jest.spyOn(gen1App.aws, 'fetchBucketVersioning').mockResolvedValue(undefined);
    jest.spyOn(gen1App.aws, 'fetchBucketEncryption').mockResolvedValue(undefined);

    const generator = new S3Generator(
      gen1App,
      backendGenerator,
      outputDir,
      {
        category: 'storage',
        resourceName: 'myBucket',
        service: 'S3',
        key: 'storage:S3',
      },
      logger,
    );
    const ops = await generator.plan();
    await ops[0].execute();

    expect(writtenFile('resource.ts')).toMatchInlineSnapshot(`
      "import { defineStorage } from '@aws-amplify/backend';
      import { CfnResource } from 'aws-cdk-lib';
      import type { Backend } from '../backend';

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export const storage = defineStorage({
        name: \`myBucket-main-\${branchName}\`,
        access: (allow) => ({
          'public/*': [
            allow.guest.to(['read']),
            allow.authenticated.to(['read', 'write', 'delete']),
          ],
          'protected/{entity_id}/*': [
            allow.entity('identity').to(['read', 'write', 'delete']),
            allow.authenticated.to(['read']),
          ],
          'private/{entity_id}/*': [
            allow.entity('identity').to(['read', 'write', 'delete']),
          ],
        }),
      });

      export function postRefactor(backend: Backend) {
        const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
        s3Bucket.bucketName = 'myBucket-main-abc123';
      }

      export function applyEscapeHatches(backend: Backend) {
        const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
        for (const cfnResource of backend.storage.stack.node
          .findAll()
          .filter(
            (c) =>
              CfnResource.isCfnResource(c) &&
              ['AWS::S3::Bucket', 'Custom::S3AutoDeleteObjects'].includes(
                c.cfnResourceType
              )
          )) {
          (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
          (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
        }
      }
      "
    `);
  });

  it('renders group access patterns with TODO comment', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      storage: { myBucket: { service: 'S3', output: { BucketName: 'myBucket-main-abc123' } } },
    });
    jest.spyOn(gen1App, 'cliInputs').mockReturnValue({
      authAccess: ['READ'],
      guestAccess: [],
      groupAccess: { admin: ['READ', 'CREATE_AND_UPDATE', 'DELETE'] },
    });
    jest.spyOn(gen1App.aws, 'fetchBucketAccelerate').mockResolvedValue(undefined);
    jest.spyOn(gen1App.aws, 'fetchBucketVersioning').mockResolvedValue(undefined);
    jest.spyOn(gen1App.aws, 'fetchBucketEncryption').mockResolvedValue(undefined);

    const generator = new S3Generator(
      gen1App,
      backendGenerator,
      outputDir,
      {
        category: 'storage',
        resourceName: 'myBucket',
        service: 'S3',
        key: 'storage:S3',
      },
      logger,
    );
    const ops = await generator.plan();
    await ops[0].execute();

    expect(writtenFile('resource.ts')).toMatchInlineSnapshot(`
      "import { defineStorage } from '@aws-amplify/backend';
      import { CfnResource } from 'aws-cdk-lib';
      import type { Backend } from '../backend';

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';
      /**
       * TODO: Your project uses group permissions. Group permissions have changed in Gen 2. In order to grant permissions to groups in Gen 2, please refer to https://docs.amplify.aws/react/build-a-backend/storage/authorization/#for-gen-1-public-protected-and-private-access-pattern. */

      export const storage = defineStorage({
        name: \`myBucket-main-\${branchName}\`,
        access: (allow) => ({
          'public/*': [
            allow.authenticated.to(['read']),
            allow.groups(['admin']).to(['read', 'write', 'delete']),
          ],
          'protected/{entity_id}/*': [
            allow.entity('identity').to(['read']),
            allow.authenticated.to(['read']),
            allow.groups(['admin']).to(['read', 'write', 'delete']),
          ],
          'private/{entity_id}/*': [
            allow.entity('identity').to(['read']),
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
        for (const cfnResource of backend.storage.stack.node
          .findAll()
          .filter(
            (c) =>
              CfnResource.isCfnResource(c) &&
              ['AWS::S3::Bucket', 'Custom::S3AutoDeleteObjects'].includes(
                c.cfnResourceType
              )
          )) {
          (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
          (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
        }
      }
      "
    `);
  });

  it('renders function access patterns with imports', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      storage: { myBucket: { service: 'S3', output: { BucketName: 'myBucket-main-abc123' } } },
    });
    jest.spyOn(gen1App, 'cliInputs').mockReturnValue({ authAccess: [], guestAccess: [] });
    jest.spyOn(gen1App.aws, 'fetchBucketAccelerate').mockResolvedValue(undefined);
    jest.spyOn(gen1App.aws, 'fetchBucketVersioning').mockResolvedValue(undefined);
    jest.spyOn(gen1App.aws, 'fetchBucketEncryption').mockResolvedValue(undefined);

    const generator = new S3Generator(
      gen1App,
      backendGenerator,
      outputDir,
      {
        category: 'storage',
        resourceName: 'myBucket',
        service: 'S3',
        key: 'storage:S3',
      },
      logger,
    );
    generator.addFunctionAccess('processImages', ['read', 'write']);

    const ops = await generator.plan();
    await ops[0].execute();

    expect(writtenFile('resource.ts')).toMatchInlineSnapshot(`
      "import { defineStorage } from '@aws-amplify/backend';
      import { processImages } from '../function/processImages/resource';
      import { CfnResource } from 'aws-cdk-lib';
      import type { Backend } from '../backend';

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export const storage = defineStorage({
        name: \`myBucket-main-\${branchName}\`,
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
        for (const cfnResource of backend.storage.stack.node
          .findAll()
          .filter(
            (c) =>
              CfnResource.isCfnResource(c) &&
              ['AWS::S3::Bucket', 'Custom::S3AutoDeleteObjects'].includes(
                c.cfnResourceType
              )
          )) {
          (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
          (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
        }
      }
      "
    `);
  });

  it('renders triggers with function imports', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      storage: { myBucket: { service: 'S3', output: { BucketName: 'myBucket-main-abc123' } } },
    });
    jest.spyOn(gen1App, 'cliInputs').mockReturnValue({ authAccess: [], guestAccess: [] });
    jest.spyOn(gen1App.aws, 'fetchBucketAccelerate').mockResolvedValue(undefined);
    jest.spyOn(gen1App.aws, 'fetchBucketVersioning').mockResolvedValue(undefined);
    jest.spyOn(gen1App.aws, 'fetchBucketEncryption').mockResolvedValue(undefined);

    const generator = new S3Generator(
      gen1App,
      backendGenerator,
      outputDir,
      {
        category: 'storage',
        resourceName: 'myBucket',
        service: 'S3',
        key: 'storage:S3',
      },
      logger,
    );
    generator.addTrigger('onUpload', 'onUploadFn');
    generator.addTrigger('onDelete', 'onDeleteFn');

    const ops = await generator.plan();
    await ops[0].execute();

    expect(writtenFile('resource.ts')).toMatchInlineSnapshot(`
      "import { defineStorage } from '@aws-amplify/backend';
      import { onUploadFn } from '../function/onUploadFn/resource';
      import { onDeleteFn } from '../function/onDeleteFn/resource';
      import { CfnResource } from 'aws-cdk-lib';
      import type { Backend } from '../backend';

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export const storage = defineStorage({
        name: \`myBucket-main-\${branchName}\`,
        access: (allow) => ({}),
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
        for (const cfnResource of backend.storage.stack.node
          .findAll()
          .filter(
            (c) =>
              CfnResource.isCfnResource(c) &&
              ['AWS::S3::Bucket', 'Custom::S3AutoDeleteObjects'].includes(
                c.cfnResourceType
              )
          )) {
          (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
          (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
        }
      }
      "
    `);
  });

  it('consolidates duplicate function permissions', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      storage: { myBucket: { service: 'S3', output: { BucketName: 'myBucket-main-abc123' } } },
    });
    jest.spyOn(gen1App, 'cliInputs').mockReturnValue({ authAccess: [], guestAccess: [] });
    jest.spyOn(gen1App.aws, 'fetchBucketAccelerate').mockResolvedValue(undefined);
    jest.spyOn(gen1App.aws, 'fetchBucketVersioning').mockResolvedValue(undefined);
    jest.spyOn(gen1App.aws, 'fetchBucketEncryption').mockResolvedValue(undefined);

    const generator = new S3Generator(
      gen1App,
      backendGenerator,
      outputDir,
      {
        category: 'storage',
        resourceName: 'myBucket',
        service: 'S3',
        key: 'storage:S3',
      },
      logger,
    );
    generator.addFunctionAccess('myFunc', ['read']);
    generator.addFunctionAccess('myFunc', ['write']);

    const ops = await generator.plan();
    await ops[0].execute();

    expect(writtenFile('resource.ts')).toMatchInlineSnapshot(`
      "import { defineStorage } from '@aws-amplify/backend';
      import { myFunc } from '../function/myFunc/resource';
      import { CfnResource } from 'aws-cdk-lib';
      import type { Backend } from '../backend';

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export const storage = defineStorage({
        name: \`myBucket-main-\${branchName}\`,
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
        for (const cfnResource of backend.storage.stack.node
          .findAll()
          .filter(
            (c) =>
              CfnResource.isCfnResource(c) &&
              ['AWS::S3::Bucket', 'Custom::S3AutoDeleteObjects'].includes(
                c.cfnResourceType
              )
          )) {
          (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
          (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
        }
      }
      "
    `);
  });

  it('renders empty access when no access patterns configured', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      storage: { myBucket: { service: 'S3', output: { BucketName: 'myBucket-main-abc123' } } },
    });
    jest.spyOn(gen1App, 'cliInputs').mockReturnValue({ authAccess: [], guestAccess: [] });
    jest.spyOn(gen1App.aws, 'fetchBucketAccelerate').mockResolvedValue(undefined);
    jest.spyOn(gen1App.aws, 'fetchBucketVersioning').mockResolvedValue(undefined);
    jest.spyOn(gen1App.aws, 'fetchBucketEncryption').mockResolvedValue(undefined);

    const generator = new S3Generator(
      gen1App,
      backendGenerator,
      outputDir,
      {
        category: 'storage',
        resourceName: 'myBucket',
        service: 'S3',
        key: 'storage:S3',
      },
      logger,
    );
    const ops = await generator.plan();
    await ops[0].execute();

    expect(writtenFile('resource.ts')).toMatchInlineSnapshot(`
      "import { defineStorage } from '@aws-amplify/backend';
      import { CfnResource } from 'aws-cdk-lib';
      import type { Backend } from '../backend';

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export const storage = defineStorage({
        name: \`myBucket-main-\${branchName}\`,
        access: (allow) => ({}),
      });

      export function postRefactor(backend: Backend) {
        const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
        s3Bucket.bucketName = 'myBucket-main-abc123';
      }

      export function applyEscapeHatches(backend: Backend) {
        const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
        for (const cfnResource of backend.storage.stack.node
          .findAll()
          .filter(
            (c) =>
              CfnResource.isCfnResource(c) &&
              ['AWS::S3::Bucket', 'Custom::S3AutoDeleteObjects'].includes(
                c.cfnResourceType
              )
          )) {
          (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
          (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
        }
      }
      "
    `);
  });
});
