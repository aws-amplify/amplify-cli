import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { AuthGenerator } from '../../../../../../commands/gen2-migration/generate-new/output/auth/auth.generator';
import { ReferenceAuthGenerator } from '../../../../../../commands/gen2-migration/generate-new/output/auth/reference-auth.generator';
import { BackendGenerator } from '../../../../../../commands/gen2-migration/generate-new/output/backend.generator';
import { Gen1App } from '../../../../../../commands/gen2-migration/generate-new/input/gen1-app';

jest.unmock('fs-extra');

function createMockGen1App(): Gen1App {
  return {
    meta: jest.fn(),
    metaOutput: jest.fn(),
    singleResourceName: jest.fn().mockReturnValue('myAuth'),
    ccbDir: '/tmp/ccb',
    aws: {
      fetchUserPool: jest.fn(),
      fetchMfaConfig: jest.fn(),
      fetchUserPoolClient: jest.fn(),
      fetchIdentityProviders: jest.fn(),
      fetchIdentityGroups: jest.fn(),
      fetchIdentityPool: jest.fn(),
      fetchIdentityPoolRoles: jest.fn(),
      fetchGroupsByUserPoolId: jest.fn(),
    },
  } as unknown as Gen1App;
}

describe('AuthGenerator', () => {
  let outputDir: string;
  let backendGenerator: BackendGenerator;

  beforeEach(async () => {
    outputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'auth-gen-test-'));
    backendGenerator = new BackendGenerator(outputDir);
  });

  afterEach(async () => {
    await fs.rm(outputDir, { recursive: true, force: true });
  });

  it('returns empty operations when auth category is missing', async () => {
    const gen1App = createMockGen1App();
    (gen1App.singleResourceName as jest.Mock).mockImplementation(() => {
      throw new Error("Category 'auth' not found in amplify-meta.json");
    });

    const generator = new AuthGenerator(gen1App, backendGenerator, outputDir);

    await expect(generator.plan()).rejects.toThrow("Category 'auth' not found");
  });

  it('throws when user pool is not found', async () => {
    const gen1App = createMockGen1App();
    (gen1App.metaOutput as jest.Mock).mockReturnValue('us-east-1_abc123');
    (gen1App.aws.fetchUserPool as jest.Mock).mockRejectedValue(new Error("User pool 'us-east-1_abc123' not found"));

    const generator = new AuthGenerator(gen1App, backendGenerator, outputDir);

    await expect(generator.plan()).rejects.toThrow("User pool 'us-east-1_abc123' not found");
  });

  it('generates reference auth when serviceType is imported', async () => {
    const gen1App = createMockGen1App();
    (gen1App.meta as jest.Mock).mockReturnValue({
      myAuth: {
        service: 'Cognito',
        serviceType: 'imported',
        output: {
          UserPoolId: 'us-east-1_abc123',
          AppClientIDWeb: 'client123',
          IdentityPoolId: 'us-east-1:pool-id',
        },
      },
    });
    (gen1App.aws.fetchIdentityPoolRoles as jest.Mock).mockResolvedValue({
      authenticated: 'arn:aws:iam::123:role/authRole',
      unauthenticated: 'arn:aws:iam::123:role/unauthRole',
    });
    (gen1App.aws.fetchGroupsByUserPoolId as jest.Mock).mockResolvedValue(undefined);

    const addImportSpy = jest.spyOn(backendGenerator, 'addImport');

    const generator = new ReferenceAuthGenerator(gen1App, backendGenerator, outputDir);
    const ops = await generator.plan();

    expect(ops).toHaveLength(1);
    const descriptions = await ops[0].describe();
    expect(descriptions[0]).toContain('reference auth');

    await ops[0].execute();

    // Verify resource.ts was written
    const resourcePath = path.join(outputDir, 'amplify', 'auth', 'resource.ts');
    const content = await fs.readFile(resourcePath, 'utf-8');
    expect(content).toContain('referenceAuth');
    expect(content).toContain('us-east-1_abc123');

    expect(addImportSpy).toHaveBeenCalledWith('./auth/resource', ['auth']);
  });

  it('generates standard auth and writes resource.ts', async () => {
    const gen1App = createMockGen1App();
    (gen1App.metaOutput as jest.Mock).mockImplementation((_cat: string, _res: string, key: string) => {
      if (key === 'UserPoolId') return 'us-east-1_abc123';
      if (key === 'AppClientIDWeb') return 'webclient123';
      if (key === 'AppClientID') return 'client123';
      if (key === 'IdentityPoolId') return 'us-east-1:idpool';
      return undefined;
    });
    (gen1App.aws.fetchUserPool as jest.Mock).mockResolvedValue({
      UserPoolId: 'us-east-1_abc123',
      Policies: {
        PasswordPolicy: { MinimumLength: 8, RequireUppercase: true },
      },
      SchemaAttributes: [{ Name: 'email', Required: true, Mutable: true }],
    });
    (gen1App.aws.fetchMfaConfig as jest.Mock).mockResolvedValue({
      MfaConfiguration: 'OFF',
    });
    (gen1App.aws.fetchUserPoolClient as jest.Mock).mockResolvedValue(undefined);
    (gen1App.aws.fetchIdentityProviders as jest.Mock).mockResolvedValue([]);
    (gen1App.aws.fetchIdentityGroups as jest.Mock).mockResolvedValue([]);
    (gen1App.aws.fetchIdentityPool as jest.Mock).mockResolvedValue(undefined);

    const addImportSpy = jest.spyOn(backendGenerator, 'addImport');
    const addPropertySpy = jest.spyOn(backendGenerator, 'addDefineBackendProperty');

    const generator = new AuthGenerator(gen1App, backendGenerator, outputDir);
    const ops = await generator.plan();

    expect(ops).toHaveLength(1);
    const descriptions = await ops[0].describe();
    expect(descriptions[0]).toContain('auth/resource.ts');

    await ops[0].execute();

    const resourcePath = path.join(outputDir, 'amplify', 'auth', 'resource.ts');
    const content = await fs.readFile(resourcePath, 'utf-8');
    expect(content).toContain('defineAuth');
    expect(content).toContain('loginWith');

    expect(addImportSpy).toHaveBeenCalledWith('./auth/resource', ['auth']);
    expect(addPropertySpy).toHaveBeenCalled();
  });

  it('registers function auth access via addFunctionAuthAccess', async () => {
    const gen1App = createMockGen1App();
    (gen1App.metaOutput as jest.Mock).mockImplementation((_cat: string, _res: string, key: string) => {
      if (key === 'UserPoolId') return 'us-east-1_abc123';
      if (key === 'AppClientIDWeb') return 'webclient123';
      if (key === 'AppClientID') return 'client123';
      if (key === 'IdentityPoolId') return 'us-east-1:idpool';
      return undefined;
    });
    (gen1App.aws.fetchUserPool as jest.Mock).mockResolvedValue({
      UserPoolId: 'us-east-1_abc123',
      Policies: {},
      SchemaAttributes: [],
    });
    (gen1App.aws.fetchMfaConfig as jest.Mock).mockResolvedValue({ MfaConfiguration: 'OFF' });
    (gen1App.aws.fetchUserPoolClient as jest.Mock).mockResolvedValue(undefined);
    (gen1App.aws.fetchIdentityProviders as jest.Mock).mockResolvedValue([]);
    (gen1App.aws.fetchIdentityGroups as jest.Mock).mockResolvedValue([]);
    (gen1App.aws.fetchIdentityPool as jest.Mock).mockResolvedValue(undefined);

    const generator = new AuthGenerator(gen1App, backendGenerator, outputDir);
    generator.addFunctionAuthAccess({ resourceName: 'adminFunc', permissions: { manageUsers: true } });

    const ops = await generator.plan();
    await ops[0].execute();

    const resourcePath = path.join(outputDir, 'amplify', 'auth', 'resource.ts');
    const content = await fs.readFile(resourcePath, 'utf-8');
    expect(content).toContain('adminFunc');
    expect(content).toContain('manageUsers');
  });
});
