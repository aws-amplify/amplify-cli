import ts from 'typescript';
import { AuthGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/auth/auth.generator';
import { ReferenceAuthGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/auth/reference-auth.generator';
import { BackendGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/backend.generator';
import { Gen1App } from '../../../../../../commands/gen2-migration/generate/_infra/gen1-app';

jest.unmock('fs-extra');

const mockAuthRender = jest.fn().mockReturnValue(ts.factory.createNodeArray([]));
jest.mock('../../../../../../commands/gen2-migration/generate/amplify/auth/auth.renderer', () => {
  const actual = jest.requireActual('../../../../../../commands/gen2-migration/generate/amplify/auth/auth.renderer');
  const MockAuthRenderer = jest.fn().mockImplementation(() => ({
    render: mockAuthRender,
  }));
  // Preserve static methods from the real class
  (MockAuthRenderer as unknown as Record<string, unknown>).deriveUserPoolOverrides = actual.AuthRenderer.deriveUserPoolOverrides;
  return {
    ...actual,
    AuthRenderer: MockAuthRenderer,
  };
});

const mockRefAuthRender = jest.fn().mockReturnValue(ts.factory.createNodeArray([]));
jest.mock('../../../../../../commands/gen2-migration/generate/amplify/auth/reference-auth.renderer', () => {
  const actual = jest.requireActual('../../../../../../commands/gen2-migration/generate/amplify/auth/reference-auth.renderer');
  return {
    ...actual,
    ReferenceAuthRenderer: jest.fn().mockImplementation(() => ({
      render: mockRefAuthRender,
    })),
  };
});

const mockPrintNodes = jest.fn().mockReturnValue('/* generated */');
jest.mock('../../../../../../commands/gen2-migration/generate/_infra/ts', () => {
  const actual = jest.requireActual('../../../../../../commands/gen2-migration/generate/_infra/ts');
  const mockTS: Record<string, unknown> = {};
  for (const key of Object.getOwnPropertyNames(actual.TS)) {
    mockTS[key] = actual.TS[key];
  }
  mockTS.printNodes = (...args: unknown[]) => mockPrintNodes(...args);
  return { ...actual, TS: mockTS };
});

const mockMkdir = jest.fn().mockResolvedValue(undefined);
const mockWriteFile = jest.fn().mockResolvedValue(undefined);
jest.mock('node:fs/promises', () => ({
  mkdir: (...args: unknown[]) => mockMkdir(...args),
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
}));

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
  let backendGenerator: BackendGenerator;
  const outputDir = '/fake/output';

  beforeEach(() => {
    jest.clearAllMocks();
    backendGenerator = new BackendGenerator(outputDir);
  });

  it('throws when auth category is missing', async () => {
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

  it('calls renderer.render with fetched auth config and registers backend contributions', async () => {
    const gen1App = createMockGen1App();
    (gen1App.metaOutput as jest.Mock).mockImplementation((_cat: string, _res: string, key: string) => {
      if (key === 'UserPoolId') return 'us-east-1_abc123';
      if (key === 'AppClientIDWeb') return 'webclient123';
      if (key === 'AppClientID') return 'client123';
      if (key === 'IdentityPoolId') return 'us-east-1:idpool';
      return undefined;
    });
    const mockUserPool = {
      UserPoolId: 'us-east-1_abc123',
      Policies: { PasswordPolicy: { MinimumLength: 8, RequireUppercase: true } },
      SchemaAttributes: [{ Name: 'email', Required: true, Mutable: true }],
    };
    (gen1App.aws.fetchUserPool as jest.Mock).mockResolvedValue(mockUserPool);
    (gen1App.aws.fetchMfaConfig as jest.Mock).mockResolvedValue({ MfaConfiguration: 'OFF' });
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

    expect(mockAuthRender).toHaveBeenCalledTimes(1);
    const renderOpts = mockAuthRender.mock.calls[0][0];
    expect(renderOpts.userPool).toBe(mockUserPool);
    expect(renderOpts.mfaConfig).toEqual({ MfaConfiguration: 'OFF' });

    expect(addImportSpy).toHaveBeenCalledWith('./auth/resource', ['auth']);
    expect(addPropertySpy).toHaveBeenCalled();
  });

  it('passes function auth access to renderer', async () => {
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

    const renderOpts = mockAuthRender.mock.calls[0][0];
    expect(renderOpts.access).toEqual([{ resourceName: 'adminFunc', permissions: { manageUsers: true } }]);
  });
});

describe('ReferenceAuthGenerator', () => {
  let backendGenerator: BackendGenerator;
  const outputDir = '/fake/output';

  beforeEach(() => {
    jest.clearAllMocks();
    backendGenerator = new BackendGenerator(outputDir);
  });

  it('calls reference auth renderer and registers backend import', async () => {
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

    expect(mockRefAuthRender).toHaveBeenCalledTimes(1);
    const renderArg = mockRefAuthRender.mock.calls[0][0];
    expect(renderArg.userPoolId).toBe('us-east-1_abc123');
    expect(renderArg.identityPoolId).toBe('us-east-1:pool-id');

    expect(addImportSpy).toHaveBeenCalledWith('./auth/resource', ['auth']);
  });
});
