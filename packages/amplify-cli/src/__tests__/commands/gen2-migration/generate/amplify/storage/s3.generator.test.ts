import { S3Generator } from '../../../../../../commands/gen2-migration/generate/amplify/storage/s3.generator';
import { BackendGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/backend.generator';
import { Gen1App } from '../../../../../../commands/gen2-migration/generate/_infra/gen1-app';

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

function createMockGen1App(): Gen1App {
  return {
    envName: 'main',
    meta: jest.fn(),
    metaOutput: jest.fn(),
    resourceMetaOutput: jest.fn(),
    cliInputs: jest.fn().mockReturnValue({
      authAccess: [],
      guestAccess: [],
    }),
    aws: {
      fetchBucketAccelerate: jest.fn().mockResolvedValue(undefined),
      fetchBucketVersioning: jest.fn().mockResolvedValue(undefined),
      fetchBucketEncryption: jest.fn().mockResolvedValue(undefined),
    },
  } as unknown as Gen1App;
}
describe('S3Generator', () => {
  let backendGenerator: BackendGenerator;
  const outputDir = '/fake/output';

  beforeEach(() => {
    jest.clearAllMocks();
    backendGenerator = new BackendGenerator(outputDir);
  });

  describe('orchestration', () => {
    it('returns one operation describing storage/resource.ts', async () => {
      const gen1App = createMockGen1App();
      (gen1App.resourceMetaOutput as jest.Mock).mockReturnValue('myBucket-main-abc123');

      const generator = new S3Generator(gen1App, backendGenerator, outputDir, {
        category: 'storage',
        resourceName: 'myBucket',
        service: 'S3',
        key: 'storage:S3',
      });
      const ops = await generator.plan();

      expect(ops).toHaveLength(1);
      const descriptions = await ops[0].describe();
      expect(descriptions[0]).toContain('storage/resource.ts');
    });

    it('registers namespace import and defineBackend entry on backendGenerator', async () => {
      const gen1App = createMockGen1App();
      (gen1App.resourceMetaOutput as jest.Mock).mockReturnValue('myBucket-main-abc123');

      const addNamespaceImportSpy = jest.spyOn(backendGenerator, 'addNamespaceImport');
      const addDefineBackendEntrySpy = jest.spyOn(backendGenerator, 'addDefineBackendEntry');

      const generator = new S3Generator(gen1App, backendGenerator, outputDir, {
        category: 'storage',
        resourceName: 'myBucket',
        service: 'S3',
        key: 'storage:S3',
      });
      const ops = await generator.plan();
      await ops[0].execute();

      expect(addNamespaceImportSpy).toHaveBeenCalledWith('storage', './storage/resource');
      expect(addDefineBackendEntrySpy).toHaveBeenCalledWith('storage', 'storage', 'storage');
    });
  });

  describe('resource.ts generation (renderer tests)', () => {
    it('renders a basic defineStorage with name', async () => {
      const gen1App = createMockGen1App();
      (gen1App.resourceMetaOutput as jest.Mock).mockReturnValue('myBucket-main-abc123');

      const generator = new S3Generator(gen1App, backendGenerator, outputDir, {
        category: 'storage',
        resourceName: 'myBucket',
        service: 'S3',
        key: 'storage:S3',
      });
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
                CfnResource.isCfnResource(c) && c.cfnResourceType === 'AWS::S3::Bucket'
            )) {
            (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
            (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
          }
        }
        "
      `);
    });

    it('renders auth access patterns', async () => {
      const gen1App = createMockGen1App();
      (gen1App.resourceMetaOutput as jest.Mock).mockReturnValue('myBucket-main-abc123');
      (gen1App.cliInputs as jest.Mock).mockReturnValue({
        authAccess: ['READ', 'CREATE_AND_UPDATE'],
        guestAccess: [],
      });

      const generator = new S3Generator(gen1App, backendGenerator, outputDir, {
        category: 'storage',
        resourceName: 'myBucket',
        service: 'S3',
        key: 'storage:S3',
      });
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
          for (const cfnResource of backend.storage.stack.node
            .findAll()
            .filter(
              (c) =>
                CfnResource.isCfnResource(c) && c.cfnResourceType === 'AWS::S3::Bucket'
            )) {
            (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
            (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
          }
        }
        "
      `);
    });

    it('renders guest access patterns', async () => {
      const gen1App = createMockGen1App();
      (gen1App.resourceMetaOutput as jest.Mock).mockReturnValue('myBucket-main-abc123');
      (gen1App.cliInputs as jest.Mock).mockReturnValue({
        authAccess: [],
        guestAccess: ['READ'],
      });

      const generator = new S3Generator(gen1App, backendGenerator, outputDir, {
        category: 'storage',
        resourceName: 'myBucket',
        service: 'S3',
        key: 'storage:S3',
      });
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
                CfnResource.isCfnResource(c) && c.cfnResourceType === 'AWS::S3::Bucket'
            )) {
            (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
            (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
          }
        }
        "
      `);
    });

    it('renders auth and guest access together', async () => {
      const gen1App = createMockGen1App();
      (gen1App.resourceMetaOutput as jest.Mock).mockReturnValue('myBucket-main-abc123');
      (gen1App.cliInputs as jest.Mock).mockReturnValue({
        authAccess: ['READ', 'CREATE_AND_UPDATE', 'DELETE'],
        guestAccess: ['READ'],
      });

      const generator = new S3Generator(gen1App, backendGenerator, outputDir, {
        category: 'storage',
        resourceName: 'myBucket',
        service: 'S3',
        key: 'storage:S3',
      });
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
          for (const cfnResource of backend.storage.stack.node
            .findAll()
            .filter(
              (c) =>
                CfnResource.isCfnResource(c) && c.cfnResourceType === 'AWS::S3::Bucket'
            )) {
            (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
            (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
          }
        }
        "
      `);
    });

    it('renders group access patterns with TODO comment', async () => {
      const gen1App = createMockGen1App();
      (gen1App.resourceMetaOutput as jest.Mock).mockReturnValue('myBucket-main-abc123');
      (gen1App.cliInputs as jest.Mock).mockReturnValue({
        authAccess: ['READ'],
        guestAccess: [],
        groupAccess: {
          admin: ['READ', 'CREATE_AND_UPDATE', 'DELETE'],
        },
      });

      const generator = new S3Generator(gen1App, backendGenerator, outputDir, {
        category: 'storage',
        resourceName: 'myBucket',
        service: 'S3',
        key: 'storage:S3',
      });
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
          for (const cfnResource of backend.storage.stack.node
            .findAll()
            .filter(
              (c) =>
                CfnResource.isCfnResource(c) && c.cfnResourceType === 'AWS::S3::Bucket'
            )) {
            (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
            (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
          }
        }
        "
      `);
    });

    it('renders function access patterns with imports', async () => {
      const gen1App = createMockGen1App();
      (gen1App.resourceMetaOutput as jest.Mock).mockReturnValue('myBucket-main-abc123');

      const generator = new S3Generator(gen1App, backendGenerator, outputDir, {
        category: 'storage',
        resourceName: 'myBucket',
        service: 'S3',
        key: 'storage:S3',
      });
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
                CfnResource.isCfnResource(c) && c.cfnResourceType === 'AWS::S3::Bucket'
            )) {
            (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
            (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
          }
        }
        "
      `);
    });

    it('renders triggers with function imports', async () => {
      const gen1App = createMockGen1App();
      (gen1App.resourceMetaOutput as jest.Mock).mockReturnValue('myBucket-main-abc123');

      const generator = new S3Generator(gen1App, backendGenerator, outputDir, {
        category: 'storage',
        resourceName: 'myBucket',
        service: 'S3',
        key: 'storage:S3',
      });
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
                CfnResource.isCfnResource(c) && c.cfnResourceType === 'AWS::S3::Bucket'
            )) {
            (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
            (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
          }
        }
        "
      `);
    });

    it('consolidates duplicate function permissions', async () => {
      const gen1App = createMockGen1App();
      (gen1App.resourceMetaOutput as jest.Mock).mockReturnValue('myBucket-main-abc123');

      const generator = new S3Generator(gen1App, backendGenerator, outputDir, {
        category: 'storage',
        resourceName: 'myBucket',
        service: 'S3',
        key: 'storage:S3',
      });
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
                CfnResource.isCfnResource(c) && c.cfnResourceType === 'AWS::S3::Bucket'
            )) {
            (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
            (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
          }
        }
        "
      `);
    });

    it('renders empty access when no access patterns configured', async () => {
      const gen1App = createMockGen1App();
      (gen1App.resourceMetaOutput as jest.Mock).mockReturnValue('myBucket-main-abc123');

      const generator = new S3Generator(gen1App, backendGenerator, outputDir, {
        category: 'storage',
        resourceName: 'myBucket',
        service: 'S3',
        key: 'storage:S3',
      });
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
                CfnResource.isCfnResource(c) && c.cfnResourceType === 'AWS::S3::Bucket'
            )) {
            (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
            (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
          }
        }
        "
      `);
    });
  });
});
