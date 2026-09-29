import { ReferenceAuthGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/auth/reference-auth.generator';
import { BackendGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/backend.generator';
import { DiscoveredResource } from '../../../../../../commands/gen2-migration/_common/gen1-app';
import { createGen1App } from '../../_helpers/create-gen1-app';
import { SpinningLogger } from '../../../../../../commands/gen2-migration/_common/spinning-logger';

jest.unmock('fs-extra');

const mockMkdir = jest.fn().mockResolvedValue(undefined);
const mockWriteFile = jest.fn().mockResolvedValue(undefined);
jest.mock('node:fs/promises', () => ({
  mkdir: (...args: unknown[]) => mockMkdir(...args),
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
}));

const authResource: DiscoveredResource = {
  category: 'auth',
  resourceName: 'testAuth',
  service: 'Cognito',
  key: 'auth:Cognito',
};

/** Extracts the written file content for a path suffix from mockWriteFile calls. */
function writtenFile(suffix: string): string {
  const call = mockWriteFile.mock.calls.find((c: unknown[]) => (c[0] as string).endsWith(suffix));
  if (!call) throw new Error(`No writeFile call ending with '${suffix}'`);
  return call[1] as string;
}

describe('ReferenceAuthGenerator', () => {
  let backendGenerator: BackendGenerator;
  const outputDir = '/fake/output';
  const logger = new SpinningLogger('test');

  beforeEach(() => {
    jest.clearAllMocks();
    backendGenerator = new BackendGenerator(outputDir, logger);
  });

  it('generates reference auth resource.ts and backend.ts', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      auth: {
        myAuth: {
          service: 'Cognito',
          serviceType: 'imported',
          output: {
            UserPoolId: 'us-east-1_abc123',
            AppClientIDWeb: 'client123',
            IdentityPoolId: 'us-east-1:pool-id',
          },
        },
      },
    });
    jest.spyOn(gen1App.aws, 'fetchIdentityPoolRoles').mockResolvedValue({
      authenticated: 'arn:aws:iam::123:role/authRole',
      unauthenticated: 'arn:aws:iam::123:role/unauthRole',
    });
    jest.spyOn(gen1App.aws, 'fetchGroupsByUserPoolId').mockResolvedValue(undefined);

    const generator = new ReferenceAuthGenerator(gen1App, backendGenerator, outputDir, authResource, logger);
    const ops = await generator.plan();
    await ops[0].execute();

    expect(writtenFile('auth/resource.ts')).toMatchInlineSnapshot(`
      "import { referenceAuth } from '@aws-amplify/backend';

      export const auth = referenceAuth({
        userPoolId: 'us-east-1_abc123',
        identityPoolId: 'us-east-1:pool-id',
        authRoleArn: 'arn:aws:iam::123:role/authRole',
        unauthRoleArn: 'arn:aws:iam::123:role/unauthRole',
        userPoolClientId: 'client123',
      });
      "
    `);

    const backendOps = await backendGenerator.plan();
    await backendOps[0].execute();

    expect(writtenFile('backend.ts')).toMatchInlineSnapshot(`
      "import * as auth from './auth/resource';
      import { defineBackend } from '@aws-amplify/backend';
      import { Tags } from 'aws-cdk-lib';

      const backend = defineBackend({
        auth: auth.auth,
      });

      export type Backend = typeof backend;

      export function postRefactor() {
        Tags.of(backend.stack).add('gen2-migration/post-refactor', 'true');
      }

      // Uncomment after refactor
      // postRefactor();
      "
    `);
  });
});
