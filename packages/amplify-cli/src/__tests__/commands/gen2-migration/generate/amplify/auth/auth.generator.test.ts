import { AuthGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/auth/auth.generator';
import { BackendGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/backend.generator';
import { DiscoveredResource } from '../../../../../../commands/gen2-migration/_common/gen1-app';
import { IdentityProviderTypeType } from '@aws-sdk/client-cognito-identity-provider';
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

describe('AuthGenerator', () => {
  let backendGenerator: BackendGenerator;
  const outputDir = '/fake/output';
  const logger = new SpinningLogger('test');

  beforeEach(() => {
    jest.clearAllMocks();
    backendGenerator = new BackendGenerator(outputDir, logger);
  });

  it('throws when user pool is not found', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      auth: {
        testAuth: {
          service: 'Cognito',
          output: {
            UserPoolId: 'us-east-1_abc123',
            AppClientIDWeb: 'webclient123',
            AppClientID: 'client123',
            IdentityPoolId: 'us-east-1:idpool',
          },
        },
      },
    });
    jest.spyOn(gen1App.aws, 'fetchUserPool').mockRejectedValue(new Error("User pool 'us-east-1_abc123' not found"));

    const generator = new AuthGenerator(gen1App, backendGenerator, outputDir, authResource, logger);
    await expect(generator.plan()).rejects.toThrow("User pool 'us-east-1_abc123' not found");
  });

  it('generates minimal auth with email login', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      auth: {
        testAuth: {
          service: 'Cognito',
          output: {
            UserPoolId: 'us-east-1_abc123',
            AppClientIDWeb: 'webclient123',
            AppClientID: 'client123',
            IdentityPoolId: 'us-east-1:idpool',
          },
        },
      },
    });
    jest.spyOn(gen1App.aws, 'fetchUserPool').mockResolvedValue({ SchemaAttributes: [] });
    jest.spyOn(gen1App.aws, 'fetchMfaConfig').mockResolvedValue({});
    jest.spyOn(gen1App.aws, 'fetchUserPoolClient').mockResolvedValue({});
    jest.spyOn(gen1App.aws, 'fetchIdentityProviders').mockResolvedValue([]);
    jest.spyOn(gen1App.aws, 'fetchIdentityGroups').mockResolvedValue([]);
    jest.spyOn(gen1App.aws, 'fetchIdentityPool').mockResolvedValue({
      IdentityPoolId: 'us-east-1:idpool',
      IdentityPoolName: 'test-pool',
      AllowUnauthenticatedIdentities: true,
    });

    const generator = new AuthGenerator(gen1App, backendGenerator, outputDir, authResource, logger);
    const ops = await generator.plan();
    await ops[0].execute();

    expect(writtenFile('auth/resource.ts')).toMatchInlineSnapshot(`
      "import { defineAuth } from '@aws-amplify/backend';
      import { CfnResource, Duration } from 'aws-cdk-lib';
      import type { Backend } from '../backend';

      export const auth = defineAuth({
        loginWith: {
          email: true,
        },
        multifactor: {
          mode: 'OFF',
        },
      });

      export function applyEscapeHatches(backend: Backend) {
        const cfnUserPool = backend.auth.resources.cfnResources.cfnUserPool;
        cfnUserPool.usernameAttributes = undefined;
        cfnUserPool.policies = {
          passwordPolicy: {},
        };
        const userPool = backend.auth.resources.userPool;
        const nativeUserPoolClient = userPool.addClient('NativeAppClient', {
          disableOAuth: true,
          generateSecret: false,
        });
        const cognitoProviders =
          backend.auth.resources.cfnResources.cfnIdentityPool
            .cognitoIdentityProviders;
        if (cognitoProviders && Array.isArray(cognitoProviders)) {
          cognitoProviders.push({
            clientId: nativeUserPoolClient.userPoolClientId,
            providerName: \`cognito-idp.\${backend.auth.stack.region}.amazonaws.com/\${userPool.userPoolId}\`,
          });
        }
        for (const cfnResource of backend.auth.stack.node
          .findAll()
          .filter(
            (c) =>
              CfnResource.isCfnResource(c) &&
              [
                'AWS::Cognito::UserPool',
                'AWS::Cognito::IdentityPool',
                'AWS::Cognito::UserPoolClient',
                'AWS::Cognito::IdentityPoolRoleAttachment',
                'AWS::Cognito::UserPoolGroup',
                'AWS::Cognito::UserPoolDomain',
                'AWS::Cognito::UserPoolIdentityProvider',
              ].includes(c.cfnResourceType)
          )) {
          (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
          (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
        }
      }
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

        auth.applyEscapeHatches(backend);

        export function postRefactor() {
          Tags.of(backend.stack).add('gen2-migration/post-refactor', 'true');
        }

        // Uncomment after refactor
        // postRefactor();
        "
      `);
  });

  it('generates phone login', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      auth: {
        testAuth: {
          service: 'Cognito',
          output: {
            UserPoolId: 'us-east-1_abc123',
            AppClientIDWeb: 'webclient123',
            AppClientID: 'client123',
            IdentityPoolId: 'us-east-1:idpool',
          },
        },
      },
    });
    jest.spyOn(gen1App.aws, 'fetchUserPool').mockResolvedValue({
      UsernameAttributes: ['phone_number'],
      SchemaAttributes: [],
    });
    jest.spyOn(gen1App.aws, 'fetchMfaConfig').mockResolvedValue({});
    jest.spyOn(gen1App.aws, 'fetchUserPoolClient').mockResolvedValue({});
    jest.spyOn(gen1App.aws, 'fetchIdentityProviders').mockResolvedValue([]);
    jest.spyOn(gen1App.aws, 'fetchIdentityGroups').mockResolvedValue([]);
    jest.spyOn(gen1App.aws, 'fetchIdentityPool').mockResolvedValue({
      IdentityPoolId: 'us-east-1:idpool',
      IdentityPoolName: 'test-pool',
      AllowUnauthenticatedIdentities: true,
    });

    const generator = new AuthGenerator(gen1App, backendGenerator, outputDir, authResource, logger);
    const ops = await generator.plan();
    await ops[0].execute();
    expect(writtenFile('auth/resource.ts')).toMatchInlineSnapshot(`
      "import { defineAuth } from '@aws-amplify/backend';
      import { CfnResource, Duration } from 'aws-cdk-lib';
      import type { Backend } from '../backend';

      export const auth = defineAuth({
        loginWith: {
          email: true,
        },
        multifactor: {
          mode: 'OFF',
        },
      });

      export function applyEscapeHatches(backend: Backend) {
        const cfnUserPool = backend.auth.resources.cfnResources.cfnUserPool;
        cfnUserPool.usernameAttributes = ['phone_number'];
        cfnUserPool.policies = {
          passwordPolicy: {},
        };
        const userPool = backend.auth.resources.userPool;
        const nativeUserPoolClient = userPool.addClient('NativeAppClient', {
          disableOAuth: true,
          generateSecret: false,
        });
        const cognitoProviders =
          backend.auth.resources.cfnResources.cfnIdentityPool
            .cognitoIdentityProviders;
        if (cognitoProviders && Array.isArray(cognitoProviders)) {
          cognitoProviders.push({
            clientId: nativeUserPoolClient.userPoolClientId,
            providerName: \`cognito-idp.\${backend.auth.stack.region}.amazonaws.com/\${userPool.userPoolId}\`,
          });
        }
        for (const cfnResource of backend.auth.stack.node
          .findAll()
          .filter(
            (c) =>
              CfnResource.isCfnResource(c) &&
              [
                'AWS::Cognito::UserPool',
                'AWS::Cognito::IdentityPool',
                'AWS::Cognito::UserPoolClient',
                'AWS::Cognito::IdentityPoolRoleAttachment',
                'AWS::Cognito::UserPoolGroup',
                'AWS::Cognito::UserPoolDomain',
                'AWS::Cognito::UserPoolIdentityProvider',
              ].includes(c.cfnResourceType)
          )) {
          (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
          (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
        }
      }
      "
    `);
  });

  it('generates email with verification options', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      auth: {
        testAuth: {
          service: 'Cognito',
          output: {
            UserPoolId: 'us-east-1_abc123',
            AppClientIDWeb: 'webclient123',
            AppClientID: 'client123',
            IdentityPoolId: 'us-east-1:idpool',
          },
        },
      },
    });
    jest.spyOn(gen1App.aws, 'fetchUserPool').mockResolvedValue({
      EmailVerificationSubject: 'Verify your account',
      EmailVerificationMessage: 'Your code is {####}',
      SchemaAttributes: [],
    });
    jest.spyOn(gen1App.aws, 'fetchMfaConfig').mockResolvedValue({});
    jest.spyOn(gen1App.aws, 'fetchUserPoolClient').mockResolvedValue({});
    jest.spyOn(gen1App.aws, 'fetchIdentityProviders').mockResolvedValue([]);
    jest.spyOn(gen1App.aws, 'fetchIdentityGroups').mockResolvedValue([]);
    jest.spyOn(gen1App.aws, 'fetchIdentityPool').mockResolvedValue({
      IdentityPoolId: 'us-east-1:idpool',
      IdentityPoolName: 'test-pool',
      AllowUnauthenticatedIdentities: true,
    });

    const generator = new AuthGenerator(gen1App, backendGenerator, outputDir, authResource, logger);
    const ops = await generator.plan();
    await ops[0].execute();
    expect(writtenFile('auth/resource.ts')).toMatchInlineSnapshot(`
      "import { defineAuth } from '@aws-amplify/backend';
      import { CfnResource, Duration } from 'aws-cdk-lib';
      import type { Backend } from '../backend';

      export const auth = defineAuth({
        loginWith: {
          email: {
            verificationEmailSubject: 'Verify your account',
            verificationEmailBody: () => 'Your code is {####}',
          },
        },
        multifactor: {
          mode: 'OFF',
        },
      });

      export function applyEscapeHatches(backend: Backend) {
        const cfnUserPool = backend.auth.resources.cfnResources.cfnUserPool;
        cfnUserPool.usernameAttributes = undefined;
        cfnUserPool.policies = {
          passwordPolicy: {},
        };
        const userPool = backend.auth.resources.userPool;
        const nativeUserPoolClient = userPool.addClient('NativeAppClient', {
          disableOAuth: true,
          generateSecret: false,
        });
        const cognitoProviders =
          backend.auth.resources.cfnResources.cfnIdentityPool
            .cognitoIdentityProviders;
        if (cognitoProviders && Array.isArray(cognitoProviders)) {
          cognitoProviders.push({
            clientId: nativeUserPoolClient.userPoolClientId,
            providerName: \`cognito-idp.\${backend.auth.stack.region}.amazonaws.com/\${userPool.userPoolId}\`,
          });
        }
        for (const cfnResource of backend.auth.stack.node
          .findAll()
          .filter(
            (c) =>
              CfnResource.isCfnResource(c) &&
              [
                'AWS::Cognito::UserPool',
                'AWS::Cognito::IdentityPool',
                'AWS::Cognito::UserPoolClient',
                'AWS::Cognito::IdentityPoolRoleAttachment',
                'AWS::Cognito::UserPoolGroup',
                'AWS::Cognito::UserPoolDomain',
                'AWS::Cognito::UserPoolIdentityProvider',
              ].includes(c.cfnResourceType)
          )) {
          (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
          (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
        }
      }
      "
    `);
  });

  it('generates user groups', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      auth: {
        testAuth: {
          service: 'Cognito',
          output: {
            UserPoolId: 'us-east-1_abc123',
            AppClientIDWeb: 'webclient123',
            AppClientID: 'client123',
            IdentityPoolId: 'us-east-1:idpool',
          },
        },
      },
    });
    jest.spyOn(gen1App.aws, 'fetchUserPool').mockResolvedValue({ SchemaAttributes: [] });
    jest.spyOn(gen1App.aws, 'fetchMfaConfig').mockResolvedValue({});
    jest.spyOn(gen1App.aws, 'fetchUserPoolClient').mockResolvedValue({});
    jest.spyOn(gen1App.aws, 'fetchIdentityProviders').mockResolvedValue([]);
    jest.spyOn(gen1App.aws, 'fetchIdentityGroups').mockResolvedValue([
      { GroupName: 'admin', Precedence: 1 },
      { GroupName: 'editors', Precedence: 2 },
      { GroupName: 'viewers', Precedence: 3 },
    ]);
    jest.spyOn(gen1App.aws, 'fetchIdentityPool').mockResolvedValue({
      IdentityPoolId: 'us-east-1:idpool',
      IdentityPoolName: 'test-pool',
      AllowUnauthenticatedIdentities: true,
    });

    const generator = new AuthGenerator(gen1App, backendGenerator, outputDir, authResource, logger);
    const ops = await generator.plan();
    await ops[0].execute();
    expect(writtenFile('auth/resource.ts')).toMatchInlineSnapshot(`
      "import { defineAuth } from '@aws-amplify/backend';
      import { CfnResource, Duration } from 'aws-cdk-lib';
      import type { Backend } from '../backend';

      export const auth = defineAuth({
        loginWith: {
          email: true,
        },
        groups: ['admin', 'editors', 'viewers'],
        multifactor: {
          mode: 'OFF',
        },
      });

      export function applyEscapeHatches(backend: Backend) {
        const cfnUserPool = backend.auth.resources.cfnResources.cfnUserPool;
        cfnUserPool.usernameAttributes = undefined;
        cfnUserPool.policies = {
          passwordPolicy: {},
        };
        const userPool = backend.auth.resources.userPool;
        const nativeUserPoolClient = userPool.addClient('NativeAppClient', {
          disableOAuth: true,
          generateSecret: false,
        });
        const cognitoProviders =
          backend.auth.resources.cfnResources.cfnIdentityPool
            .cognitoIdentityProviders;
        if (cognitoProviders && Array.isArray(cognitoProviders)) {
          cognitoProviders.push({
            clientId: nativeUserPoolClient.userPoolClientId,
            providerName: \`cognito-idp.\${backend.auth.stack.region}.amazonaws.com/\${userPool.userPoolId}\`,
          });
        }
        for (const cfnResource of backend.auth.stack.node
          .findAll()
          .filter(
            (c) =>
              CfnResource.isCfnResource(c) &&
              [
                'AWS::Cognito::UserPool',
                'AWS::Cognito::IdentityPool',
                'AWS::Cognito::UserPoolClient',
                'AWS::Cognito::IdentityPoolRoleAttachment',
                'AWS::Cognito::UserPoolGroup',
                'AWS::Cognito::UserPoolDomain',
                'AWS::Cognito::UserPoolIdentityProvider',
              ].includes(c.cfnResourceType)
          )) {
          (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
          (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
        }
      }
      "
    `);
  });

  it('generates standard user attributes', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      auth: {
        testAuth: {
          service: 'Cognito',
          output: {
            UserPoolId: 'us-east-1_abc123',
            AppClientIDWeb: 'webclient123',
            AppClientID: 'client123',
            IdentityPoolId: 'us-east-1:idpool',
          },
        },
      },
    });
    jest.spyOn(gen1App.aws, 'fetchUserPool').mockResolvedValue({
      SchemaAttributes: [
        { Name: 'email', Required: true, Mutable: true },
        { Name: 'given_name', Required: true, Mutable: false },
      ],
    });
    jest.spyOn(gen1App.aws, 'fetchMfaConfig').mockResolvedValue({});
    jest.spyOn(gen1App.aws, 'fetchUserPoolClient').mockResolvedValue({});
    jest.spyOn(gen1App.aws, 'fetchIdentityProviders').mockResolvedValue([]);
    jest.spyOn(gen1App.aws, 'fetchIdentityGroups').mockResolvedValue([]);
    jest.spyOn(gen1App.aws, 'fetchIdentityPool').mockResolvedValue({
      IdentityPoolId: 'us-east-1:idpool',
      IdentityPoolName: 'test-pool',
      AllowUnauthenticatedIdentities: true,
    });

    const generator = new AuthGenerator(gen1App, backendGenerator, outputDir, authResource, logger);
    const ops = await generator.plan();
    await ops[0].execute();
    expect(writtenFile('auth/resource.ts')).toMatchInlineSnapshot(`
      "import { defineAuth } from '@aws-amplify/backend';
      import { CfnResource, Duration } from 'aws-cdk-lib';
      import type { Backend } from '../backend';

      export const auth = defineAuth({
        loginWith: {
          email: true,
        },
        userAttributes: {
          email: {
            required: true,
            mutable: true,
          },
          givenName: {
            required: true,
            mutable: false,
          },
        },
        multifactor: {
          mode: 'OFF',
        },
      });

      export function applyEscapeHatches(backend: Backend) {
        const cfnUserPool = backend.auth.resources.cfnResources.cfnUserPool;
        cfnUserPool.usernameAttributes = undefined;
        cfnUserPool.policies = {
          passwordPolicy: {},
        };
        const userPool = backend.auth.resources.userPool;
        const nativeUserPoolClient = userPool.addClient('NativeAppClient', {
          disableOAuth: true,
          generateSecret: false,
        });
        const cognitoProviders =
          backend.auth.resources.cfnResources.cfnIdentityPool
            .cognitoIdentityProviders;
        if (cognitoProviders && Array.isArray(cognitoProviders)) {
          cognitoProviders.push({
            clientId: nativeUserPoolClient.userPoolClientId,
            providerName: \`cognito-idp.\${backend.auth.stack.region}.amazonaws.com/\${userPool.userPoolId}\`,
          });
        }
        for (const cfnResource of backend.auth.stack.node
          .findAll()
          .filter(
            (c) =>
              CfnResource.isCfnResource(c) &&
              [
                'AWS::Cognito::UserPool',
                'AWS::Cognito::IdentityPool',
                'AWS::Cognito::UserPoolClient',
                'AWS::Cognito::IdentityPoolRoleAttachment',
                'AWS::Cognito::UserPoolGroup',
                'AWS::Cognito::UserPoolDomain',
                'AWS::Cognito::UserPoolIdentityProvider',
              ].includes(c.cfnResourceType)
          )) {
          (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
          (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
        }
      }
      "
    `);
  });

  it('generates custom user attributes', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      auth: {
        testAuth: {
          service: 'Cognito',
          output: {
            UserPoolId: 'us-east-1_abc123',
            AppClientIDWeb: 'webclient123',
            AppClientID: 'client123',
            IdentityPoolId: 'us-east-1:idpool',
          },
        },
      },
    });
    jest.spyOn(gen1App.aws, 'fetchUserPool').mockResolvedValue({
      SchemaAttributes: [
        {
          Name: 'custom:department',
          AttributeDataType: 'String',
          Mutable: true,
          StringAttributeConstraints: { MinLength: '1', MaxLength: '50' },
        },
      ],
    });
    jest.spyOn(gen1App.aws, 'fetchMfaConfig').mockResolvedValue({});
    jest.spyOn(gen1App.aws, 'fetchUserPoolClient').mockResolvedValue({});
    jest.spyOn(gen1App.aws, 'fetchIdentityProviders').mockResolvedValue([]);
    jest.spyOn(gen1App.aws, 'fetchIdentityGroups').mockResolvedValue([]);
    jest.spyOn(gen1App.aws, 'fetchIdentityPool').mockResolvedValue({
      IdentityPoolId: 'us-east-1:idpool',
      IdentityPoolName: 'test-pool',
      AllowUnauthenticatedIdentities: true,
    });

    const generator = new AuthGenerator(gen1App, backendGenerator, outputDir, authResource, logger);
    const ops = await generator.plan();
    await ops[0].execute();
    expect(writtenFile('auth/resource.ts')).toMatchInlineSnapshot(`
      "import { defineAuth } from '@aws-amplify/backend';
      import { CfnResource, Duration } from 'aws-cdk-lib';
      import type { Backend } from '../backend';

      export const auth = defineAuth({
        loginWith: {
          email: true,
        },
        userAttributes: {
          'custom:department': {
            mutable: true,
            dataType: 'String',
            minLen: 1,
            maxLen: 50,
          },
        },
        multifactor: {
          mode: 'OFF',
        },
      });

      export function applyEscapeHatches(backend: Backend) {
        const cfnUserPool = backend.auth.resources.cfnResources.cfnUserPool;
        cfnUserPool.usernameAttributes = undefined;
        cfnUserPool.policies = {
          passwordPolicy: {},
        };
        const userPool = backend.auth.resources.userPool;
        const nativeUserPoolClient = userPool.addClient('NativeAppClient', {
          disableOAuth: true,
          generateSecret: false,
        });
        const cognitoProviders =
          backend.auth.resources.cfnResources.cfnIdentityPool
            .cognitoIdentityProviders;
        if (cognitoProviders && Array.isArray(cognitoProviders)) {
          cognitoProviders.push({
            clientId: nativeUserPoolClient.userPoolClientId,
            providerName: \`cognito-idp.\${backend.auth.stack.region}.amazonaws.com/\${userPool.userPoolId}\`,
          });
        }
        for (const cfnResource of backend.auth.stack.node
          .findAll()
          .filter(
            (c) =>
              CfnResource.isCfnResource(c) &&
              [
                'AWS::Cognito::UserPool',
                'AWS::Cognito::IdentityPool',
                'AWS::Cognito::UserPoolClient',
                'AWS::Cognito::IdentityPoolRoleAttachment',
                'AWS::Cognito::UserPoolGroup',
                'AWS::Cognito::UserPoolDomain',
                'AWS::Cognito::UserPoolIdentityProvider',
              ].includes(c.cfnResourceType)
          )) {
          (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
          (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
        }
      }
      "
    `);
  });

  it('generates MFA with REQUIRED mode', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      auth: {
        testAuth: {
          service: 'Cognito',
          output: {
            UserPoolId: 'us-east-1_abc123',
            AppClientIDWeb: 'webclient123',
            AppClientID: 'client123',
            IdentityPoolId: 'us-east-1:idpool',
          },
        },
      },
    });
    jest.spyOn(gen1App.aws, 'fetchUserPool').mockResolvedValue({ SchemaAttributes: [] });
    jest.spyOn(gen1App.aws, 'fetchMfaConfig').mockResolvedValue({
      MfaConfiguration: 'ON',
      SoftwareTokenMfaConfiguration: { Enabled: true },
    });
    jest.spyOn(gen1App.aws, 'fetchUserPoolClient').mockResolvedValue({});
    jest.spyOn(gen1App.aws, 'fetchIdentityProviders').mockResolvedValue([]);
    jest.spyOn(gen1App.aws, 'fetchIdentityGroups').mockResolvedValue([]);
    jest.spyOn(gen1App.aws, 'fetchIdentityPool').mockResolvedValue({
      IdentityPoolId: 'us-east-1:idpool',
      IdentityPoolName: 'test-pool',
      AllowUnauthenticatedIdentities: true,
    });

    const generator = new AuthGenerator(gen1App, backendGenerator, outputDir, authResource, logger);
    const ops = await generator.plan();
    await ops[0].execute();
    expect(writtenFile('auth/resource.ts')).toMatchInlineSnapshot(`
      "import { defineAuth } from '@aws-amplify/backend';
      import { CfnResource, Duration } from 'aws-cdk-lib';
      import type { Backend } from '../backend';

      export const auth = defineAuth({
        loginWith: {
          email: true,
        },
        multifactor: {
          mode: 'REQUIRED',
          totp: true,
          sms: true,
        },
      });

      export function applyEscapeHatches(backend: Backend) {
        const cfnUserPool = backend.auth.resources.cfnResources.cfnUserPool;
        cfnUserPool.usernameAttributes = undefined;
        cfnUserPool.policies = {
          passwordPolicy: {},
        };
        const userPool = backend.auth.resources.userPool;
        const nativeUserPoolClient = userPool.addClient('NativeAppClient', {
          disableOAuth: true,
          generateSecret: false,
        });
        const cognitoProviders =
          backend.auth.resources.cfnResources.cfnIdentityPool
            .cognitoIdentityProviders;
        if (cognitoProviders && Array.isArray(cognitoProviders)) {
          cognitoProviders.push({
            clientId: nativeUserPoolClient.userPoolClientId,
            providerName: \`cognito-idp.\${backend.auth.stack.region}.amazonaws.com/\${userPool.userPoolId}\`,
          });
        }
        for (const cfnResource of backend.auth.stack.node
          .findAll()
          .filter(
            (c) =>
              CfnResource.isCfnResource(c) &&
              [
                'AWS::Cognito::UserPool',
                'AWS::Cognito::IdentityPool',
                'AWS::Cognito::UserPoolClient',
                'AWS::Cognito::IdentityPoolRoleAttachment',
                'AWS::Cognito::UserPoolGroup',
                'AWS::Cognito::UserPoolDomain',
                'AWS::Cognito::UserPoolIdentityProvider',
              ].includes(c.cfnResourceType)
          )) {
          (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
          (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
        }
      }
      "
    `);
  });

  it('generates MFA with OPTIONAL mode', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      auth: {
        testAuth: {
          service: 'Cognito',
          output: {
            UserPoolId: 'us-east-1_abc123',
            AppClientIDWeb: 'webclient123',
            AppClientID: 'client123',
            IdentityPoolId: 'us-east-1:idpool',
          },
        },
      },
    });
    jest.spyOn(gen1App.aws, 'fetchUserPool').mockResolvedValue({ SchemaAttributes: [] });
    jest.spyOn(gen1App.aws, 'fetchMfaConfig').mockResolvedValue({
      MfaConfiguration: 'OPTIONAL',
      SoftwareTokenMfaConfiguration: { Enabled: true },
    });
    jest.spyOn(gen1App.aws, 'fetchUserPoolClient').mockResolvedValue({});
    jest.spyOn(gen1App.aws, 'fetchIdentityProviders').mockResolvedValue([]);
    jest.spyOn(gen1App.aws, 'fetchIdentityGroups').mockResolvedValue([]);
    jest.spyOn(gen1App.aws, 'fetchIdentityPool').mockResolvedValue({
      IdentityPoolId: 'us-east-1:idpool',
      IdentityPoolName: 'test-pool',
      AllowUnauthenticatedIdentities: true,
    });

    const generator = new AuthGenerator(gen1App, backendGenerator, outputDir, authResource, logger);
    const ops = await generator.plan();
    await ops[0].execute();

    expect(writtenFile('auth/resource.ts')).toMatchInlineSnapshot(`
      "import { defineAuth } from '@aws-amplify/backend';
      import { CfnResource, Duration } from 'aws-cdk-lib';
      import type { Backend } from '../backend';

      export const auth = defineAuth({
        loginWith: {
          email: true,
        },
        multifactor: {
          mode: 'OPTIONAL',
          totp: true,
          sms: true,
        },
      });

      export function applyEscapeHatches(backend: Backend) {
        const cfnUserPool = backend.auth.resources.cfnResources.cfnUserPool;
        cfnUserPool.usernameAttributes = undefined;
        cfnUserPool.policies = {
          passwordPolicy: {},
        };
        const userPool = backend.auth.resources.userPool;
        const nativeUserPoolClient = userPool.addClient('NativeAppClient', {
          disableOAuth: true,
          generateSecret: false,
        });
        const cognitoProviders =
          backend.auth.resources.cfnResources.cfnIdentityPool
            .cognitoIdentityProviders;
        if (cognitoProviders && Array.isArray(cognitoProviders)) {
          cognitoProviders.push({
            clientId: nativeUserPoolClient.userPoolClientId,
            providerName: \`cognito-idp.\${backend.auth.stack.region}.amazonaws.com/\${userPool.userPoolId}\`,
          });
        }
        for (const cfnResource of backend.auth.stack.node
          .findAll()
          .filter(
            (c) =>
              CfnResource.isCfnResource(c) &&
              [
                'AWS::Cognito::UserPool',
                'AWS::Cognito::IdentityPool',
                'AWS::Cognito::UserPoolClient',
                'AWS::Cognito::IdentityPoolRoleAttachment',
                'AWS::Cognito::UserPoolGroup',
                'AWS::Cognito::UserPoolDomain',
                'AWS::Cognito::UserPoolIdentityProvider',
              ].includes(c.cfnResourceType)
          )) {
          (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
          (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
        }
      }
      "
    `);
  });

  it('generates lambda triggers with function imports', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      auth: {
        testAuth: {
          service: 'Cognito',
          output: {
            UserPoolId: 'us-east-1_abc123',
            AppClientIDWeb: 'webclient123',
            AppClientID: 'client123',
            IdentityPoolId: 'us-east-1:idpool',
          },
        },
      },
    });
    jest.spyOn(gen1App.aws, 'fetchUserPool').mockResolvedValue({ SchemaAttributes: [] });
    jest.spyOn(gen1App.aws, 'fetchMfaConfig').mockResolvedValue({});
    jest.spyOn(gen1App.aws, 'fetchUserPoolClient').mockResolvedValue({});
    jest.spyOn(gen1App.aws, 'fetchIdentityProviders').mockResolvedValue([]);
    jest.spyOn(gen1App.aws, 'fetchIdentityGroups').mockResolvedValue([]);
    jest.spyOn(gen1App.aws, 'fetchIdentityPool').mockResolvedValue({
      IdentityPoolId: 'us-east-1:idpool',
      IdentityPoolName: 'test-pool',
      AllowUnauthenticatedIdentities: true,
    });

    const generator = new AuthGenerator(gen1App, backendGenerator, outputDir, authResource, logger);
    generator.addTrigger({ event: 'preSignUp', resourceName: 'preSignUpFn' });
    generator.addTrigger({ event: 'postConfirmation', resourceName: 'postConfirmFn' });

    const ops = await generator.plan();
    await ops[0].execute();

    expect(writtenFile('auth/resource.ts')).toMatchInlineSnapshot(`
      "import { defineAuth } from '@aws-amplify/backend';
      import { preSignUpFn } from '../function/preSignUpFn/resource';
      import { postConfirmFn } from '../function/postConfirmFn/resource';
      import { CfnResource, Duration } from 'aws-cdk-lib';
      import type { Backend } from '../backend';

      export const auth = defineAuth({
        loginWith: {
          email: true,
        },
        triggers: {
          preSignUp: preSignUpFn,
          postConfirmation: postConfirmFn,
        },
        multifactor: {
          mode: 'OFF',
        },
      });

      export function applyEscapeHatches(backend: Backend) {
        const cfnUserPool = backend.auth.resources.cfnResources.cfnUserPool;
        cfnUserPool.usernameAttributes = undefined;
        cfnUserPool.policies = {
          passwordPolicy: {},
        };
        const userPool = backend.auth.resources.userPool;
        const nativeUserPoolClient = userPool.addClient('NativeAppClient', {
          disableOAuth: true,
          generateSecret: false,
        });
        const cognitoProviders =
          backend.auth.resources.cfnResources.cfnIdentityPool
            .cognitoIdentityProviders;
        if (cognitoProviders && Array.isArray(cognitoProviders)) {
          cognitoProviders.push({
            clientId: nativeUserPoolClient.userPoolClientId,
            providerName: \`cognito-idp.\${backend.auth.stack.region}.amazonaws.com/\${userPool.userPoolId}\`,
          });
        }
        for (const cfnResource of backend.auth.stack.node
          .findAll()
          .filter(
            (c) =>
              CfnResource.isCfnResource(c) &&
              [
                'AWS::Cognito::UserPool',
                'AWS::Cognito::IdentityPool',
                'AWS::Cognito::UserPoolClient',
                'AWS::Cognito::IdentityPoolRoleAttachment',
                'AWS::Cognito::UserPoolGroup',
                'AWS::Cognito::UserPoolDomain',
                'AWS::Cognito::UserPoolIdentityProvider',
              ].includes(c.cfnResourceType)
          )) {
          (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
          (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
        }
      }
      "
    `);
  });

  it('generates Google login with secrets', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      auth: {
        testAuth: {
          service: 'Cognito',
          output: {
            UserPoolId: 'us-east-1_abc123',
            AppClientIDWeb: 'webclient123',
            AppClientID: 'client123',
            IdentityPoolId: 'us-east-1:idpool',
          },
        },
      },
    });
    jest.spyOn(gen1App.aws, 'fetchUserPool').mockResolvedValue({ SchemaAttributes: [] });
    jest.spyOn(gen1App.aws, 'fetchMfaConfig').mockResolvedValue({});
    jest.spyOn(gen1App.aws, 'fetchIdentityGroups').mockResolvedValue([]);
    jest.spyOn(gen1App.aws, 'fetchIdentityPool').mockResolvedValue({
      IdentityPoolId: 'us-east-1:idpool',
      IdentityPoolName: 'test-pool',
      AllowUnauthenticatedIdentities: true,
    });
    jest
      .spyOn(gen1App.aws, 'fetchIdentityProviders')
      .mockResolvedValue([{ ProviderType: IdentityProviderTypeType.Google, ProviderName: 'Google' }]);
    jest.spyOn(gen1App.aws, 'fetchUserPoolClient').mockResolvedValue({
      CallbackURLs: ['https://example.com/callback'],
      LogoutURLs: ['https://example.com/logout'],
    });

    const generator = new AuthGenerator(gen1App, backendGenerator, outputDir, authResource, logger);
    const ops = await generator.plan();
    await ops[0].execute();
    expect(writtenFile('auth/resource.ts')).toMatchInlineSnapshot(`
      "import { defineAuth, secret } from '@aws-amplify/backend';
      import { CfnResource, Duration } from 'aws-cdk-lib';
      import type { Backend } from '../backend';

      export const auth = defineAuth({
        loginWith: {
          email: true,
          externalProviders: {
            google: {
              clientId: secret('GOOGLE_CLIENT_ID'),
              clientSecret: secret('GOOGLE_CLIENT_SECRET'),
            },
            // Add the Gen2 Amplify Hosting URL (e.g. https://<branch>.<gen2-appId>.amplifyapp.com/) to the following array after the gen2-main branch is deployed.
            callbackUrls: ['https://example.com/callback'],
            // Add the Gen2 Amplify Hosting URL (e.g. https://<branch>.<gen2-appId>.amplifyapp.com/) to the following array after the gen2-main branch is deployed.
            logoutUrls: ['https://example.com/logout'],
          },
        },
        multifactor: {
          mode: 'OFF',
        },
      });

      export function applyEscapeHatches(backend: Backend) {
        const cfnUserPool = backend.auth.resources.cfnResources.cfnUserPool;
        cfnUserPool.usernameAttributes = undefined;
        cfnUserPool.policies = {
          passwordPolicy: {},
        };
        const userPool = backend.auth.resources.userPool;
        const nativeUserPoolClient = userPool.addClient('NativeAppClient', {
          oAuth: {
            // Add the Gen2 Amplify Hosting URL (e.g. https://<branch>.<gen2-appId>.amplifyapp.com/) to the following array after the gen2-main branch is deployed.
            callbackUrls: ['https://example.com/callback'],
            // Add the Gen2 Amplify Hosting URL (e.g. https://<branch>.<gen2-appId>.amplifyapp.com/) to the following array after the gen2-main branch is deployed.
            logoutUrls: ['https://example.com/logout'],
          },
          disableOAuth: true,
          generateSecret: false,
        });
        const cognitoProviders =
          backend.auth.resources.cfnResources.cfnIdentityPool
            .cognitoIdentityProviders;
        if (cognitoProviders && Array.isArray(cognitoProviders)) {
          cognitoProviders.push({
            clientId: nativeUserPoolClient.userPoolClientId,
            providerName: \`cognito-idp.\${backend.auth.stack.region}.amazonaws.com/\${userPool.userPoolId}\`,
          });
        }
        for (const cfnResource of backend.auth.stack.node
          .findAll()
          .filter(
            (c) =>
              CfnResource.isCfnResource(c) &&
              [
                'AWS::Cognito::UserPool',
                'AWS::Cognito::IdentityPool',
                'AWS::Cognito::UserPoolClient',
                'AWS::Cognito::IdentityPoolRoleAttachment',
                'AWS::Cognito::UserPoolGroup',
                'AWS::Cognito::UserPoolDomain',
                'AWS::Cognito::UserPoolIdentityProvider',
              ].includes(c.cfnResourceType)
          )) {
          (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
          (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
        }
      }
      "
    `);
  });

  it('generates Google login with scopes and attribute mapping', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      auth: {
        testAuth: {
          service: 'Cognito',
          output: {
            UserPoolId: 'us-east-1_abc123',
            AppClientIDWeb: 'webclient123',
            AppClientID: 'client123',
            IdentityPoolId: 'us-east-1:idpool',
          },
        },
      },
    });
    jest.spyOn(gen1App.aws, 'fetchUserPool').mockResolvedValue({ SchemaAttributes: [] });
    jest.spyOn(gen1App.aws, 'fetchMfaConfig').mockResolvedValue({});
    jest.spyOn(gen1App.aws, 'fetchIdentityGroups').mockResolvedValue([]);
    jest.spyOn(gen1App.aws, 'fetchIdentityPool').mockResolvedValue({
      IdentityPoolId: 'us-east-1:idpool',
      IdentityPoolName: 'test-pool',
      AllowUnauthenticatedIdentities: true,
    });
    jest.spyOn(gen1App.aws, 'fetchIdentityProviders').mockResolvedValue([
      {
        ProviderType: IdentityProviderTypeType.Google,
        ProviderName: 'Google',
        ProviderDetails: { authorized_scopes: 'profile email' },
        AttributeMapping: { email: 'email', given_name: 'given_name' },
      },
    ]);
    jest.spyOn(gen1App.aws, 'fetchUserPoolClient').mockResolvedValue({
      CallbackURLs: [],
      LogoutURLs: [],
    });

    const generator = new AuthGenerator(gen1App, backendGenerator, outputDir, authResource, logger);
    const ops = await generator.plan();
    await ops[0].execute();
    expect(writtenFile('auth/resource.ts')).toMatchInlineSnapshot(`
      "import { defineAuth, secret } from '@aws-amplify/backend';
      import { CfnResource, Duration } from 'aws-cdk-lib';
      import type { Backend } from '../backend';

      export const auth = defineAuth({
        loginWith: {
          email: true,
          externalProviders: {
            google: {
              clientId: secret('GOOGLE_CLIENT_ID'),
              clientSecret: secret('GOOGLE_CLIENT_SECRET'),
              scopes: ['profile', 'email'],
              attributeMapping: {
                email: 'email',
                givenName: 'given_name',
              },
            },
            // Add the Gen2 Amplify Hosting URL (e.g. https://<branch>.<gen2-appId>.amplifyapp.com/) to the following array after the gen2-main branch is deployed.
            callbackUrls: [],
            // Add the Gen2 Amplify Hosting URL (e.g. https://<branch>.<gen2-appId>.amplifyapp.com/) to the following array after the gen2-main branch is deployed.
            logoutUrls: [],
          },
        },
        multifactor: {
          mode: 'OFF',
        },
      });

      export function applyEscapeHatches(backend: Backend) {
        const cfnUserPool = backend.auth.resources.cfnResources.cfnUserPool;
        cfnUserPool.usernameAttributes = undefined;
        cfnUserPool.policies = {
          passwordPolicy: {},
        };
        const userPool = backend.auth.resources.userPool;
        const nativeUserPoolClient = userPool.addClient('NativeAppClient', {
          disableOAuth: true,
          generateSecret: false,
        });
        const cognitoProviders =
          backend.auth.resources.cfnResources.cfnIdentityPool
            .cognitoIdentityProviders;
        if (cognitoProviders && Array.isArray(cognitoProviders)) {
          cognitoProviders.push({
            clientId: nativeUserPoolClient.userPoolClientId,
            providerName: \`cognito-idp.\${backend.auth.stack.region}.amazonaws.com/\${userPool.userPoolId}\`,
          });
        }
        for (const cfnResource of backend.auth.stack.node
          .findAll()
          .filter(
            (c) =>
              CfnResource.isCfnResource(c) &&
              [
                'AWS::Cognito::UserPool',
                'AWS::Cognito::IdentityPool',
                'AWS::Cognito::UserPoolClient',
                'AWS::Cognito::IdentityPoolRoleAttachment',
                'AWS::Cognito::UserPoolGroup',
                'AWS::Cognito::UserPoolDomain',
                'AWS::Cognito::UserPoolIdentityProvider',
              ].includes(c.cfnResourceType)
          )) {
          (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
          (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
        }
      }
      "
    `);
  });

  it('generates external providers', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      auth: {
        testAuth: {
          service: 'Cognito',
          output: {
            UserPoolId: 'us-east-1_abc123',
            AppClientIDWeb: 'webclient123',
            AppClientID: 'client123',
            IdentityPoolId: 'us-east-1:idpool',
          },
        },
      },
    });
    jest.spyOn(gen1App.aws, 'fetchUserPool').mockResolvedValue({ SchemaAttributes: [] });
    jest.spyOn(gen1App.aws, 'fetchMfaConfig').mockResolvedValue({});
    jest.spyOn(gen1App.aws, 'fetchIdentityGroups').mockResolvedValue([]);
    jest.spyOn(gen1App.aws, 'fetchIdentityPool').mockResolvedValue({
      IdentityPoolId: 'us-east-1:idpool',
      IdentityPoolName: 'test-pool',
      AllowUnauthenticatedIdentities: true,
    });
    jest.spyOn(gen1App.aws, 'fetchIdentityProviders').mockResolvedValue([
      { ProviderType: IdentityProviderTypeType.Google, ProviderName: 'Google' },
      { ProviderType: IdentityProviderTypeType.Facebook, ProviderName: 'Facebook' },
      { ProviderType: IdentityProviderTypeType.LoginWithAmazon, ProviderName: 'LoginWithAmazon' },
      { ProviderType: IdentityProviderTypeType.SignInWithApple, ProviderName: 'SignInWithApple' },
      {
        ProviderType: IdentityProviderTypeType.OIDC,
        ProviderName: 'MyOIDC',
        ProviderDetails: {
          oidc_issuer: 'https://accounts.google.com',
          authorize_url: 'https://accounts.google.com/o/oauth2/v2/auth',
          token_url: 'https://oauth2.googleapis.com/token',
          attributes_url: 'https://openidconnect.googleapis.com/v1/userinfo',
          jwks_uri: 'https://www.googleapis.com/oauth2/v3/certs',
        },
      },
      {
        ProviderType: IdentityProviderTypeType.SAML,
        ProviderName: 'MySAML',
        ProviderDetails: { metadataURL: 'https://idp.example.com/metadata' },
      },
    ]);
    jest.spyOn(gen1App.aws, 'fetchUserPoolClient').mockResolvedValue({
      CallbackURLs: ['https://example.com/callback'],
      LogoutURLs: ['https://example.com/logout'],
    });

    const generator = new AuthGenerator(gen1App, backendGenerator, outputDir, authResource, logger);
    const ops = await generator.plan();
    await ops[0].execute();
    expect(writtenFile('auth/resource.ts')).toMatchInlineSnapshot(`
      "import { defineAuth, secret } from '@aws-amplify/backend';
      import { CfnResource, Duration } from 'aws-cdk-lib';
      import type { Backend } from '../backend';

      export const auth = defineAuth({
        loginWith: {
          email: true,
          externalProviders: {
            google: {
              clientId: secret('GOOGLE_CLIENT_ID'),
              clientSecret: secret('GOOGLE_CLIENT_SECRET'),
            },
            signInWithApple: {
              clientId: secret('SIWA_CLIENT_ID'),
              keyId: secret('SIWA_KEY_ID'),
              privateKey: secret('SIWA_PRIVATE_KEY'),
              teamId: secret('SIWA_TEAM_ID'),
            },
            loginWithAmazon: {
              clientId: secret('LOGINWITHAMAZON_CLIENT_ID'),
              clientSecret: secret('LOGINWITHAMAZON_CLIENT_SECRET'),
            },
            facebook: {
              clientId: secret('FACEBOOK_CLIENT_ID'),
              clientSecret: secret('FACEBOOK_CLIENT_SECRET'),
            },
            saml: {
              metadata: {
                metadataContent: 'https://idp.example.com/metadata',
                metadataType: 'URL',
              },
              name: 'MySAML',
            },
            oidc: [
              {
                clientId: secret('OIDC_CLIENT_ID_1'),
                clientSecret: secret('OIDC_CLIENT_SECRET_1'),
                issuerUrl: 'https://accounts.google.com',
                name: 'MyOIDC',
                endpoints: {
                  authorization: 'https://accounts.google.com/o/oauth2/v2/auth',
                  token: 'https://oauth2.googleapis.com/token',
                  userInfo: 'https://openidconnect.googleapis.com/v1/userinfo',
                  jwksUri: 'https://www.googleapis.com/oauth2/v3/certs',
                },
              },
            ],
            // Add the Gen2 Amplify Hosting URL (e.g. https://<branch>.<gen2-appId>.amplifyapp.com/) to the following array after the gen2-main branch is deployed.
            callbackUrls: ['https://example.com/callback'],
            // Add the Gen2 Amplify Hosting URL (e.g. https://<branch>.<gen2-appId>.amplifyapp.com/) to the following array after the gen2-main branch is deployed.
            logoutUrls: ['https://example.com/logout'],
          },
        },
        multifactor: {
          mode: 'OFF',
        },
      });

      export function applyEscapeHatches(backend: Backend) {
        const cfnUserPool = backend.auth.resources.cfnResources.cfnUserPool;
        cfnUserPool.usernameAttributes = undefined;
        cfnUserPool.policies = {
          passwordPolicy: {},
        };
        const userPool = backend.auth.resources.userPool;
        const nativeUserPoolClient = userPool.addClient('NativeAppClient', {
          oAuth: {
            // Add the Gen2 Amplify Hosting URL (e.g. https://<branch>.<gen2-appId>.amplifyapp.com/) to the following array after the gen2-main branch is deployed.
            callbackUrls: ['https://example.com/callback'],
            // Add the Gen2 Amplify Hosting URL (e.g. https://<branch>.<gen2-appId>.amplifyapp.com/) to the following array after the gen2-main branch is deployed.
            logoutUrls: ['https://example.com/logout'],
          },
          disableOAuth: true,
          generateSecret: false,
        });
        const cognitoProviders =
          backend.auth.resources.cfnResources.cfnIdentityPool
            .cognitoIdentityProviders;
        if (cognitoProviders && Array.isArray(cognitoProviders)) {
          cognitoProviders.push({
            clientId: nativeUserPoolClient.userPoolClientId,
            providerName: \`cognito-idp.\${backend.auth.stack.region}.amazonaws.com/\${userPool.userPoolId}\`,
          });
        }
        for (const cfnResource of backend.auth.stack.node
          .findAll()
          .filter(
            (c) =>
              CfnResource.isCfnResource(c) &&
              [
                'AWS::Cognito::UserPool',
                'AWS::Cognito::IdentityPool',
                'AWS::Cognito::UserPoolClient',
                'AWS::Cognito::IdentityPoolRoleAttachment',
                'AWS::Cognito::UserPoolGroup',
                'AWS::Cognito::UserPoolDomain',
                'AWS::Cognito::UserPoolIdentityProvider',
              ].includes(c.cfnResourceType)
          )) {
          (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
          (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
        }
      }
      "
    `);
  });

  it('generates function auth access rules', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      auth: {
        testAuth: {
          service: 'Cognito',
          output: {
            UserPoolId: 'us-east-1_abc123',
            AppClientIDWeb: 'webclient123',
            AppClientID: 'client123',
            IdentityPoolId: 'us-east-1:idpool',
          },
        },
      },
    });
    jest.spyOn(gen1App.aws, 'fetchUserPool').mockResolvedValue({ SchemaAttributes: [] });
    jest.spyOn(gen1App.aws, 'fetchMfaConfig').mockResolvedValue({});
    jest.spyOn(gen1App.aws, 'fetchUserPoolClient').mockResolvedValue({});
    jest.spyOn(gen1App.aws, 'fetchIdentityProviders').mockResolvedValue([]);
    jest.spyOn(gen1App.aws, 'fetchIdentityGroups').mockResolvedValue([]);
    jest.spyOn(gen1App.aws, 'fetchIdentityPool').mockResolvedValue({
      IdentityPoolId: 'us-east-1:idpool',
      IdentityPoolName: 'test-pool',
      AllowUnauthenticatedIdentities: true,
    });

    const generator = new AuthGenerator(gen1App, backendGenerator, outputDir, authResource, logger);
    generator.addFunctionAuthAccess({
      resourceName: 'adminFunc',
      permissions: { manageUsers: true, listUsers: true },
    });

    const ops = await generator.plan();
    await ops[0].execute();

    expect(writtenFile('auth/resource.ts')).toMatchInlineSnapshot(`
      "import { defineAuth } from '@aws-amplify/backend';
      import { adminFunc } from '../function/adminFunc/resource';
      import { CfnResource, Duration } from 'aws-cdk-lib';
      import type { Backend } from '../backend';

      export const auth = defineAuth({
        loginWith: {
          email: true,
        },
        multifactor: {
          mode: 'OFF',
        },
        access: (allow) => [
          allow.resource(adminFunc).to(['manageUsers']),
          allow.resource(adminFunc).to(['listUsers']),
        ],
      });

      export function applyEscapeHatches(backend: Backend) {
        const cfnUserPool = backend.auth.resources.cfnResources.cfnUserPool;
        cfnUserPool.usernameAttributes = undefined;
        cfnUserPool.policies = {
          passwordPolicy: {},
        };
        const userPool = backend.auth.resources.userPool;
        const nativeUserPoolClient = userPool.addClient('NativeAppClient', {
          disableOAuth: true,
          generateSecret: false,
        });
        const cognitoProviders =
          backend.auth.resources.cfnResources.cfnIdentityPool
            .cognitoIdentityProviders;
        if (cognitoProviders && Array.isArray(cognitoProviders)) {
          cognitoProviders.push({
            clientId: nativeUserPoolClient.userPoolClientId,
            providerName: \`cognito-idp.\${backend.auth.stack.region}.amazonaws.com/\${userPool.userPoolId}\`,
          });
        }
        for (const cfnResource of backend.auth.stack.node
          .findAll()
          .filter(
            (c) =>
              CfnResource.isCfnResource(c) &&
              [
                'AWS::Cognito::UserPool',
                'AWS::Cognito::IdentityPool',
                'AWS::Cognito::UserPoolClient',
                'AWS::Cognito::IdentityPoolRoleAttachment',
                'AWS::Cognito::UserPoolGroup',
                'AWS::Cognito::UserPoolDomain',
                'AWS::Cognito::UserPoolIdentityProvider',
              ].includes(c.cfnResourceType)
          )) {
          (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
          (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
        }
      }
      "
    `);
  });

  it('generates multiple functions with auth access', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      auth: {
        testAuth: {
          service: 'Cognito',
          output: {
            UserPoolId: 'us-east-1_abc123',
            AppClientIDWeb: 'webclient123',
            AppClientID: 'client123',
            IdentityPoolId: 'us-east-1:idpool',
          },
        },
      },
    });
    jest.spyOn(gen1App.aws, 'fetchUserPool').mockResolvedValue({ SchemaAttributes: [] });
    jest.spyOn(gen1App.aws, 'fetchMfaConfig').mockResolvedValue({});
    jest.spyOn(gen1App.aws, 'fetchUserPoolClient').mockResolvedValue({});
    jest.spyOn(gen1App.aws, 'fetchIdentityProviders').mockResolvedValue([]);
    jest.spyOn(gen1App.aws, 'fetchIdentityGroups').mockResolvedValue([]);
    jest.spyOn(gen1App.aws, 'fetchIdentityPool').mockResolvedValue({
      IdentityPoolId: 'us-east-1:idpool',
      IdentityPoolName: 'test-pool',
      AllowUnauthenticatedIdentities: true,
    });

    const generator = new AuthGenerator(gen1App, backendGenerator, outputDir, authResource, logger);
    generator.addFunctionAuthAccess({ resourceName: 'func1', permissions: { createUser: true } });
    generator.addFunctionAuthAccess({ resourceName: 'func2', permissions: { deleteUser: true, getUser: true } });

    const ops = await generator.plan();
    await ops[0].execute();

    expect(writtenFile('auth/resource.ts')).toMatchInlineSnapshot(`
      "import { defineAuth } from '@aws-amplify/backend';
      import { func1 } from '../function/func1/resource';
      import { func2 } from '../function/func2/resource';
      import { CfnResource, Duration } from 'aws-cdk-lib';
      import type { Backend } from '../backend';

      export const auth = defineAuth({
        loginWith: {
          email: true,
        },
        multifactor: {
          mode: 'OFF',
        },
        access: (allow) => [
          allow.resource(func1).to(['createUser']),
          allow.resource(func2).to(['deleteUser']),
          allow.resource(func2).to(['getUser']),
        ],
      });

      export function applyEscapeHatches(backend: Backend) {
        const cfnUserPool = backend.auth.resources.cfnResources.cfnUserPool;
        cfnUserPool.usernameAttributes = undefined;
        cfnUserPool.policies = {
          passwordPolicy: {},
        };
        const userPool = backend.auth.resources.userPool;
        const nativeUserPoolClient = userPool.addClient('NativeAppClient', {
          disableOAuth: true,
          generateSecret: false,
        });
        const cognitoProviders =
          backend.auth.resources.cfnResources.cfnIdentityPool
            .cognitoIdentityProviders;
        if (cognitoProviders && Array.isArray(cognitoProviders)) {
          cognitoProviders.push({
            clientId: nativeUserPoolClient.userPoolClientId,
            providerName: \`cognito-idp.\${backend.auth.stack.region}.amazonaws.com/\${userPool.userPoolId}\`,
          });
        }
        for (const cfnResource of backend.auth.stack.node
          .findAll()
          .filter(
            (c) =>
              CfnResource.isCfnResource(c) &&
              [
                'AWS::Cognito::UserPool',
                'AWS::Cognito::IdentityPool',
                'AWS::Cognito::UserPoolClient',
                'AWS::Cognito::IdentityPoolRoleAttachment',
                'AWS::Cognito::UserPoolGroup',
                'AWS::Cognito::UserPoolDomain',
                'AWS::Cognito::UserPoolIdentityProvider',
              ].includes(c.cfnResourceType)
          )) {
          (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
          (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
        }
      }
      "
    `);
  });

  it('skips functions with empty auth access', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      auth: {
        testAuth: {
          service: 'Cognito',
          output: {
            UserPoolId: 'us-east-1_abc123',
            AppClientIDWeb: 'webclient123',
            AppClientID: 'client123',
            IdentityPoolId: 'us-east-1:idpool',
          },
        },
      },
    });
    jest.spyOn(gen1App.aws, 'fetchUserPool').mockResolvedValue({ SchemaAttributes: [] });
    jest.spyOn(gen1App.aws, 'fetchMfaConfig').mockResolvedValue({});
    jest.spyOn(gen1App.aws, 'fetchUserPoolClient').mockResolvedValue({});
    jest.spyOn(gen1App.aws, 'fetchIdentityProviders').mockResolvedValue([]);
    jest.spyOn(gen1App.aws, 'fetchIdentityGroups').mockResolvedValue([]);
    jest.spyOn(gen1App.aws, 'fetchIdentityPool').mockResolvedValue({
      IdentityPoolId: 'us-east-1:idpool',
      IdentityPoolName: 'test-pool',
      AllowUnauthenticatedIdentities: true,
    });

    const generator = new AuthGenerator(gen1App, backendGenerator, outputDir, authResource, logger);
    generator.addFunctionAuthAccess({ resourceName: 'noAccessFunc', permissions: {} });

    const ops = await generator.plan();
    await ops[0].execute();

    const resourceTs = writtenFile('auth/resource.ts');
    expect(resourceTs).not.toContain('access');
    expect(resourceTs).not.toContain('noAccessFunc');
  });

  it('emits cfnIdentityPool.allowUnauthenticatedIdentities = false', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      auth: {
        testAuth: {
          service: 'Cognito',
          output: {
            UserPoolId: 'us-east-1_abc123',
            AppClientIDWeb: 'webclient123',
            AppClientID: 'client123',
            IdentityPoolId: 'us-east-1:idpool',
          },
        },
      },
    });
    jest.spyOn(gen1App.aws, 'fetchUserPool').mockResolvedValue({ SchemaAttributes: [] });
    jest.spyOn(gen1App.aws, 'fetchMfaConfig').mockResolvedValue({});
    jest.spyOn(gen1App.aws, 'fetchUserPoolClient').mockResolvedValue({});
    jest.spyOn(gen1App.aws, 'fetchIdentityProviders').mockResolvedValue([]);
    jest.spyOn(gen1App.aws, 'fetchIdentityGroups').mockResolvedValue([]);
    jest.spyOn(gen1App.aws, 'fetchIdentityPool').mockResolvedValue({
      IdentityPoolId: 'us-east-1:identity-pool-id',
      IdentityPoolName: 'test-identity-pool',
      AllowUnauthenticatedIdentities: false,
    });

    const generator = new AuthGenerator(gen1App, backendGenerator, outputDir, authResource, logger);
    const ops = await generator.plan();
    await ops[0].execute();
    expect(writtenFile('auth/resource.ts')).toMatchInlineSnapshot(`
      "import { defineAuth } from '@aws-amplify/backend';
      import { CfnResource, Duration } from 'aws-cdk-lib';
      import type { Backend } from '../backend';

      export const auth = defineAuth({
        loginWith: {
          email: true,
        },
        multifactor: {
          mode: 'OFF',
        },
      });

      export function applyEscapeHatches(backend: Backend) {
        const cfnUserPool = backend.auth.resources.cfnResources.cfnUserPool;
        cfnUserPool.usernameAttributes = undefined;
        cfnUserPool.policies = {
          passwordPolicy: {},
        };
        const cfnIdentityPool = backend.auth.resources.cfnResources.cfnIdentityPool;
        cfnIdentityPool.allowUnauthenticatedIdentities = false;
        const userPool = backend.auth.resources.userPool;
        const nativeUserPoolClient = userPool.addClient('NativeAppClient', {
          disableOAuth: true,
          generateSecret: false,
        });
        const cognitoProviders =
          backend.auth.resources.cfnResources.cfnIdentityPool
            .cognitoIdentityProviders;
        if (cognitoProviders && Array.isArray(cognitoProviders)) {
          cognitoProviders.push({
            clientId: nativeUserPoolClient.userPoolClientId,
            providerName: \`cognito-idp.\${backend.auth.stack.region}.amazonaws.com/\${userPool.userPoolId}\`,
          });
        }
        for (const cfnResource of backend.auth.stack.node
          .findAll()
          .filter(
            (c) =>
              CfnResource.isCfnResource(c) &&
              [
                'AWS::Cognito::UserPool',
                'AWS::Cognito::IdentityPool',
                'AWS::Cognito::UserPoolClient',
                'AWS::Cognito::IdentityPoolRoleAttachment',
                'AWS::Cognito::UserPoolGroup',
                'AWS::Cognito::UserPoolDomain',
                'AWS::Cognito::UserPoolIdentityProvider',
              ].includes(c.cfnResourceType)
          )) {
          (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
          (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
        }
      }
      "
    `);
  });

  it('emits cfnUserPoolClient.allowedOAuthFlows when webClient has AllowedOAuthFlows', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      auth: {
        testAuth: {
          service: 'Cognito',
          output: {
            UserPoolId: 'us-east-1_abc123',
            AppClientIDWeb: 'webclient123',
            AppClientID: 'client123',
            IdentityPoolId: 'us-east-1:idpool',
          },
        },
      },
    });
    jest.spyOn(gen1App.aws, 'fetchUserPool').mockResolvedValue({ SchemaAttributes: [] });
    jest.spyOn(gen1App.aws, 'fetchMfaConfig').mockResolvedValue({});
    jest.spyOn(gen1App.aws, 'fetchIdentityProviders').mockResolvedValue([]);
    jest.spyOn(gen1App.aws, 'fetchIdentityGroups').mockResolvedValue([]);
    jest.spyOn(gen1App.aws, 'fetchIdentityPool').mockResolvedValue({
      IdentityPoolId: 'us-east-1:idpool',
      IdentityPoolName: 'test-pool',
      AllowUnauthenticatedIdentities: true,
    });
    jest.spyOn(gen1App.aws, 'fetchUserPoolClient').mockResolvedValue({
      AllowedOAuthFlows: ['code', 'implicit'],
      CallbackURLs: ['https://example.com/callback'],
      LogoutURLs: ['https://example.com/logout'],
    });

    const generator = new AuthGenerator(gen1App, backendGenerator, outputDir, authResource, logger);
    const ops = await generator.plan();
    await ops[0].execute();
    expect(writtenFile('auth/resource.ts')).toMatchInlineSnapshot(`
      "import { defineAuth } from '@aws-amplify/backend';
      import { CfnResource, Duration } from 'aws-cdk-lib';
      import type { Backend } from '../backend';

      export const auth = defineAuth({
        loginWith: {
          email: true,
        },
        multifactor: {
          mode: 'OFF',
        },
      });

      export function applyEscapeHatches(backend: Backend) {
        const cfnUserPool = backend.auth.resources.cfnResources.cfnUserPool;
        cfnUserPool.usernameAttributes = undefined;
        cfnUserPool.policies = {
          passwordPolicy: {},
        };
        const cfnUserPoolClient =
          backend.auth.resources.cfnResources.cfnUserPoolClient;
        cfnUserPoolClient.allowedOAuthFlows = ['code', 'implicit'];
        const userPool = backend.auth.resources.userPool;
        const nativeUserPoolClient = userPool.addClient('NativeAppClient', {
          oAuth: {
            // Add the Gen2 Amplify Hosting URL (e.g. https://<branch>.<gen2-appId>.amplifyapp.com/) to the following array after the gen2-main branch is deployed.
            callbackUrls: ['https://example.com/callback'],
            // Add the Gen2 Amplify Hosting URL (e.g. https://<branch>.<gen2-appId>.amplifyapp.com/) to the following array after the gen2-main branch is deployed.
            logoutUrls: ['https://example.com/logout'],
            flows: {
              authorizationCodeGrant: true,
              implicitCodeGrant: true,
              clientCredentials: false,
            },
          },
          disableOAuth: false,
          generateSecret: false,
        });
        const cognitoProviders =
          backend.auth.resources.cfnResources.cfnIdentityPool
            .cognitoIdentityProviders;
        if (cognitoProviders && Array.isArray(cognitoProviders)) {
          cognitoProviders.push({
            clientId: nativeUserPoolClient.userPoolClientId,
            providerName: \`cognito-idp.\${backend.auth.stack.region}.amazonaws.com/\${userPool.userPoolId}\`,
          });
        }
        for (const cfnResource of backend.auth.stack.node
          .findAll()
          .filter(
            (c) =>
              CfnResource.isCfnResource(c) &&
              [
                'AWS::Cognito::UserPool',
                'AWS::Cognito::IdentityPool',
                'AWS::Cognito::UserPoolClient',
                'AWS::Cognito::IdentityPoolRoleAttachment',
                'AWS::Cognito::UserPoolGroup',
                'AWS::Cognito::UserPoolDomain',
                'AWS::Cognito::UserPoolIdentityProvider',
              ].includes(c.cfnResourceType)
          )) {
          (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
          (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
        }
      }
      "
    `);
  });

  it('emits provider setup statements when userPoolClient has SupportedIdentityProviders', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      auth: {
        testAuth: {
          service: 'Cognito',
          output: {
            UserPoolId: 'us-east-1_abc123',
            AppClientIDWeb: 'webclient123',
            AppClientID: 'client123',
            IdentityPoolId: 'us-east-1:idpool',
          },
        },
      },
    });
    jest.spyOn(gen1App.aws, 'fetchUserPool').mockResolvedValue({ SchemaAttributes: [] });
    jest.spyOn(gen1App.aws, 'fetchMfaConfig').mockResolvedValue({});
    jest.spyOn(gen1App.aws, 'fetchIdentityGroups').mockResolvedValue([]);
    jest.spyOn(gen1App.aws, 'fetchIdentityPool').mockResolvedValue({
      IdentityPoolId: 'us-east-1:idpool',
      IdentityPoolName: 'test-pool',
      AllowUnauthenticatedIdentities: true,
    });
    jest
      .spyOn(gen1App.aws, 'fetchIdentityProviders')
      .mockResolvedValue([{ ProviderType: IdentityProviderTypeType.Google, ProviderName: 'Google' }]);
    jest.spyOn(gen1App.aws, 'fetchUserPoolClient').mockImplementation((_poolId: string, clientId: string) => {
      if (clientId === 'webclient123') {
        return Promise.resolve({
          CallbackURLs: ['https://example.com/callback'],
          LogoutURLs: ['https://example.com/logout'],
        });
      }
      // native client
      return Promise.resolve({
        SupportedIdentityProviders: ['COGNITO', 'Google'],
        RefreshTokenValidity: 30,
        EnableTokenRevocation: true,
        AllowedOAuthFlows: ['code'],
        AllowedOAuthScopes: ['openid', 'email'],
        CallbackURLs: ['myapp://callback'],
        LogoutURLs: ['myapp://logout'],
      });
    });

    const generator = new AuthGenerator(gen1App, backendGenerator, outputDir, authResource, logger);
    const ops = await generator.plan();
    await ops[0].execute();
    expect(writtenFile('auth/resource.ts')).toMatchInlineSnapshot(`
      "import { defineAuth, secret } from '@aws-amplify/backend';
      import { CfnResource, Duration } from 'aws-cdk-lib';
      import {
        OAuthScope,
        UserPoolClientIdentityProvider,
      } from 'aws-cdk-lib/aws-cognito';
      import type { Backend } from '../backend';

      export const auth = defineAuth({
        loginWith: {
          email: true,
          externalProviders: {
            google: {
              clientId: secret('GOOGLE_CLIENT_ID'),
              clientSecret: secret('GOOGLE_CLIENT_SECRET'),
            },
            // Add the Gen2 Amplify Hosting URL (e.g. https://<branch>.<gen2-appId>.amplifyapp.com/) to the following array after the gen2-main branch is deployed.
            callbackUrls: ['https://example.com/callback'],
            // Add the Gen2 Amplify Hosting URL (e.g. https://<branch>.<gen2-appId>.amplifyapp.com/) to the following array after the gen2-main branch is deployed.
            logoutUrls: ['https://example.com/logout'],
          },
        },
        multifactor: {
          mode: 'OFF',
        },
      });

      export function applyEscapeHatches(backend: Backend) {
        const cfnUserPool = backend.auth.resources.cfnResources.cfnUserPool;
        cfnUserPool.usernameAttributes = undefined;
        cfnUserPool.policies = {
          passwordPolicy: {},
        };
        const cfnIdentityPool = backend.auth.resources.cfnResources.cfnIdentityPool;
        cfnIdentityPool.addPropertyDeletionOverride('SupportedLoginProviders');
        const userPool = backend.auth.resources.userPool;
        const nativeUserPoolClient = userPool.addClient('NativeAppClient', {
          refreshTokenValidity: Duration.days(30),
          enableTokenRevocation: true,
          supportedIdentityProviders: [
            UserPoolClientIdentityProvider.COGNITO,
            UserPoolClientIdentityProvider.GOOGLE,
          ],
          oAuth: {
            // Add the Gen2 Amplify Hosting URL (e.g. https://<branch>.<gen2-appId>.amplifyapp.com/) to the following array after the gen2-main branch is deployed.
            callbackUrls: ['myapp://callback'],
            // Add the Gen2 Amplify Hosting URL (e.g. https://<branch>.<gen2-appId>.amplifyapp.com/) to the following array after the gen2-main branch is deployed.
            logoutUrls: ['myapp://logout'],
            flows: {
              authorizationCodeGrant: true,
              implicitCodeGrant: false,
              clientCredentials: false,
            },
            scopes: [OAuthScope.OPENID, OAuthScope.EMAIL],
          },
          disableOAuth: false,
          generateSecret: false,
        });
        const cognitoProviders =
          backend.auth.resources.cfnResources.cfnIdentityPool
            .cognitoIdentityProviders;
        if (cognitoProviders && Array.isArray(cognitoProviders)) {
          cognitoProviders.push({
            clientId: nativeUserPoolClient.userPoolClientId,
            providerName: \`cognito-idp.\${backend.auth.stack.region}.amazonaws.com/\${userPool.userPoolId}\`,
          });
        }
        const providerSetupResult = (
          backend.auth.stack.node.children.find(
            (child) => child.node.id === 'amplifyAuth'
          ) as any
        ).providerSetupResult;
        Object.keys(providerSetupResult).forEach((provider) => {
          const providerSetupPropertyValue = providerSetupResult[provider];
          if (
            providerSetupPropertyValue.node &&
            providerSetupPropertyValue.node.id.toLowerCase().endsWith('idp')
          ) {
            nativeUserPoolClient.node.addDependency(providerSetupPropertyValue);
          }
        });
        for (const cfnResource of backend.auth.stack.node
          .findAll()
          .filter(
            (c) =>
              CfnResource.isCfnResource(c) &&
              [
                'AWS::Cognito::UserPool',
                'AWS::Cognito::IdentityPool',
                'AWS::Cognito::UserPoolClient',
                'AWS::Cognito::IdentityPoolRoleAttachment',
                'AWS::Cognito::UserPoolGroup',
                'AWS::Cognito::UserPoolDomain',
                'AWS::Cognito::UserPoolIdentityProvider',
              ].includes(c.cfnResourceType)
          )) {
          (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
          (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
        }
      }
      "
    `);
  });

  it('emits password policy overrides in escape hatch', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      auth: {
        testAuth: {
          service: 'Cognito',
          output: {
            UserPoolId: 'us-east-1_abc123',
            AppClientIDWeb: 'webclient123',
            AppClientID: 'client123',
            IdentityPoolId: 'us-east-1:idpool',
          },
        },
      },
    });
    jest.spyOn(gen1App.aws, 'fetchUserPool').mockResolvedValue({
      SchemaAttributes: [],
      Policies: {
        PasswordPolicy: {
          MinimumLength: 12,
          RequireUppercase: true,
          RequireLowercase: true,
          RequireNumbers: false,
          RequireSymbols: false,
        },
      },
    });
    jest.spyOn(gen1App.aws, 'fetchMfaConfig').mockResolvedValue({});
    jest.spyOn(gen1App.aws, 'fetchUserPoolClient').mockResolvedValue({});
    jest.spyOn(gen1App.aws, 'fetchIdentityProviders').mockResolvedValue([]);
    jest.spyOn(gen1App.aws, 'fetchIdentityGroups').mockResolvedValue([]);
    jest.spyOn(gen1App.aws, 'fetchIdentityPool').mockResolvedValue({
      IdentityPoolId: 'us-east-1:idpool',
      IdentityPoolName: 'test-pool',
      AllowUnauthenticatedIdentities: true,
    });

    const generator = new AuthGenerator(gen1App, backendGenerator, outputDir, authResource, logger);
    const ops = await generator.plan();
    await ops[0].execute();
    expect(writtenFile('auth/resource.ts')).toMatchInlineSnapshot(`
      "import { defineAuth } from '@aws-amplify/backend';
      import { CfnResource, Duration } from 'aws-cdk-lib';
      import type { Backend } from '../backend';

      export const auth = defineAuth({
        loginWith: {
          email: true,
        },
        multifactor: {
          mode: 'OFF',
        },
      });

      export function applyEscapeHatches(backend: Backend) {
        const cfnUserPool = backend.auth.resources.cfnResources.cfnUserPool;
        cfnUserPool.usernameAttributes = undefined;
        cfnUserPool.policies = {
          passwordPolicy: {
            minimumLength: 12,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: false,
            requireSymbols: false,
          },
        };
        const userPool = backend.auth.resources.userPool;
        const nativeUserPoolClient = userPool.addClient('NativeAppClient', {
          disableOAuth: true,
          generateSecret: false,
        });
        const cognitoProviders =
          backend.auth.resources.cfnResources.cfnIdentityPool
            .cognitoIdentityProviders;
        if (cognitoProviders && Array.isArray(cognitoProviders)) {
          cognitoProviders.push({
            clientId: nativeUserPoolClient.userPoolClientId,
            providerName: \`cognito-idp.\${backend.auth.stack.region}.amazonaws.com/\${userPool.userPoolId}\`,
          });
        }
        for (const cfnResource of backend.auth.stack.node
          .findAll()
          .filter(
            (c) =>
              CfnResource.isCfnResource(c) &&
              [
                'AWS::Cognito::UserPool',
                'AWS::Cognito::IdentityPool',
                'AWS::Cognito::UserPoolClient',
                'AWS::Cognito::IdentityPoolRoleAttachment',
                'AWS::Cognito::UserPoolGroup',
                'AWS::Cognito::UserPoolDomain',
                'AWS::Cognito::UserPoolIdentityProvider',
              ].includes(c.cfnResourceType)
          )) {
          (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
          (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
        }
      }
      "
    `);
  });

  it('emits aliasAttributes in escape hatch', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      auth: {
        testAuth: {
          service: 'Cognito',
          output: {
            UserPoolId: 'us-east-1_abc123',
            AppClientIDWeb: 'webclient123',
            AppClientID: 'client123',
            IdentityPoolId: 'us-east-1:idpool',
          },
        },
      },
    });
    jest.spyOn(gen1App.aws, 'fetchUserPool').mockResolvedValue({
      SchemaAttributes: [],
      AliasAttributes: ['email', 'preferred_username'],
    });
    jest.spyOn(gen1App.aws, 'fetchMfaConfig').mockResolvedValue({});
    jest.spyOn(gen1App.aws, 'fetchUserPoolClient').mockResolvedValue({});
    jest.spyOn(gen1App.aws, 'fetchIdentityProviders').mockResolvedValue([]);
    jest.spyOn(gen1App.aws, 'fetchIdentityGroups').mockResolvedValue([]);
    jest.spyOn(gen1App.aws, 'fetchIdentityPool').mockResolvedValue({
      IdentityPoolId: 'us-east-1:idpool',
      IdentityPoolName: 'test-pool',
      AllowUnauthenticatedIdentities: true,
    });

    const generator = new AuthGenerator(gen1App, backendGenerator, outputDir, authResource, logger);
    const ops = await generator.plan();
    await ops[0].execute();
    expect(writtenFile('auth/resource.ts')).toMatchInlineSnapshot(`
      "import { defineAuth } from '@aws-amplify/backend';
      import { CfnResource, Duration } from 'aws-cdk-lib';
      import type { Backend } from '../backend';

      export const auth = defineAuth({
        loginWith: {
          email: true,
        },
        multifactor: {
          mode: 'OFF',
        },
      });

      export function applyEscapeHatches(backend: Backend) {
        const cfnUserPool = backend.auth.resources.cfnResources.cfnUserPool;
        cfnUserPool.usernameAttributes = undefined;
        cfnUserPool.aliasAttributes = ['email', 'preferred_username'];
        cfnUserPool.policies = {
          passwordPolicy: {},
        };
        const userPool = backend.auth.resources.userPool;
        const nativeUserPoolClient = userPool.addClient('NativeAppClient', {
          disableOAuth: true,
          generateSecret: false,
        });
        const cognitoProviders =
          backend.auth.resources.cfnResources.cfnIdentityPool
            .cognitoIdentityProviders;
        if (cognitoProviders && Array.isArray(cognitoProviders)) {
          cognitoProviders.push({
            clientId: nativeUserPoolClient.userPoolClientId,
            providerName: \`cognito-idp.\${backend.auth.stack.region}.amazonaws.com/\${userPool.userPoolId}\`,
          });
        }
        for (const cfnResource of backend.auth.stack.node
          .findAll()
          .filter(
            (c) =>
              CfnResource.isCfnResource(c) &&
              [
                'AWS::Cognito::UserPool',
                'AWS::Cognito::IdentityPool',
                'AWS::Cognito::UserPoolClient',
                'AWS::Cognito::IdentityPoolRoleAttachment',
                'AWS::Cognito::UserPoolGroup',
                'AWS::Cognito::UserPoolDomain',
                'AWS::Cognito::UserPoolIdentityProvider',
              ].includes(c.cfnResourceType)
          )) {
          (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
          (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
        }
      }
      "
    `);
  });

  it('generates read/write attribute restrictions on NativeAppClient', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      auth: {
        testAuth: {
          service: 'Cognito',
          output: {
            UserPoolId: 'us-east-1_abc123',
            AppClientIDWeb: 'webclient123',
            AppClientID: 'client123',
            IdentityPoolId: 'us-east-1:idpool',
          },
        },
      },
    });
    jest.spyOn(gen1App.aws, 'fetchUserPool').mockResolvedValue({
      SchemaAttributes: [
        { Name: 'email', Required: true, Mutable: true },
        { Name: 'address', Required: true, Mutable: false },
        { Name: 'birthdate', Required: false, Mutable: true },
        { Name: 'given_name', Required: false, Mutable: false },
      ],
    });
    jest.spyOn(gen1App.aws, 'fetchMfaConfig').mockResolvedValue({});
    jest.spyOn(gen1App.aws, 'fetchIdentityProviders').mockResolvedValue([]);
    jest.spyOn(gen1App.aws, 'fetchIdentityGroups').mockResolvedValue([]);
    jest.spyOn(gen1App.aws, 'fetchIdentityPool').mockResolvedValue({
      IdentityPoolId: 'us-east-1:idpool',
      IdentityPoolName: 'test-pool',
      AllowUnauthenticatedIdentities: false,
    });
    jest.spyOn(gen1App.aws, 'fetchUserPoolClient').mockResolvedValue({
      RefreshTokenValidity: 30,
      EnableTokenRevocation: true,
      ReadAttributes: ['birthdate', 'email', 'given_name', 'address'],
      WriteAttributes: ['address', 'email'],
    });

    const generator = new AuthGenerator(gen1App, backendGenerator, outputDir, authResource, logger);
    const ops = await generator.plan();
    await ops[0].execute();
    expect(writtenFile('auth/resource.ts')).toMatchInlineSnapshot(`
      "import { defineAuth } from '@aws-amplify/backend';
      import { CfnResource, Duration } from 'aws-cdk-lib';
      import { ClientAttributes } from 'aws-cdk-lib/aws-cognito';
      import type { Backend } from '../backend';

      export const auth = defineAuth({
        loginWith: {
          email: true,
        },
        userAttributes: {
          email: {
            required: true,
            mutable: true,
          },
          address: {
            required: true,
            mutable: false,
          },
        },
        multifactor: {
          mode: 'OFF',
        },
      });

      export function applyEscapeHatches(backend: Backend) {
        const cfnUserPool = backend.auth.resources.cfnResources.cfnUserPool;
        cfnUserPool.usernameAttributes = undefined;
        cfnUserPool.policies = {
          passwordPolicy: {},
        };
        const cfnIdentityPool = backend.auth.resources.cfnResources.cfnIdentityPool;
        cfnIdentityPool.allowUnauthenticatedIdentities = false;
        const userPool = backend.auth.resources.userPool;
        const nativeUserPoolClient = userPool.addClient('NativeAppClient', {
          refreshTokenValidity: Duration.days(30),
          enableTokenRevocation: true,
          disableOAuth: true,
          generateSecret: false,
          readAttributes: new ClientAttributes().withStandardAttributes({
            birthdate: true,
            email: true,
            givenName: true,
            address: true,
          }),
          writeAttributes: new ClientAttributes().withStandardAttributes({
            address: true,
            email: true,
          }),
        });
        const cognitoProviders =
          backend.auth.resources.cfnResources.cfnIdentityPool
            .cognitoIdentityProviders;
        if (cognitoProviders && Array.isArray(cognitoProviders)) {
          cognitoProviders.push({
            clientId: nativeUserPoolClient.userPoolClientId,
            providerName: \`cognito-idp.\${backend.auth.stack.region}.amazonaws.com/\${userPool.userPoolId}\`,
          });
        }
        for (const cfnResource of backend.auth.stack.node
          .findAll()
          .filter(
            (c) =>
              CfnResource.isCfnResource(c) &&
              [
                'AWS::Cognito::UserPool',
                'AWS::Cognito::IdentityPool',
                'AWS::Cognito::UserPoolClient',
                'AWS::Cognito::IdentityPoolRoleAttachment',
                'AWS::Cognito::UserPoolGroup',
                'AWS::Cognito::UserPoolDomain',
                'AWS::Cognito::UserPoolIdentityProvider',
              ].includes(c.cfnResourceType)
          )) {
          (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
          (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
        }
      }
      "
    `);
  });
});
