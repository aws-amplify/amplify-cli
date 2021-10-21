import { $TSContext } from 'amplify-cli-core';

describe('command blocking', () => {
  test('validate which commands will be blocked or not', async () => {
    const { isCommandInMatches, versionGatingBlockedCommands } = await import('../version-gating');

    expect(isCommandInMatches({ plugin: 'api', command: 'add' }, versionGatingBlockedCommands)).toBe(true);
    expect(isCommandInMatches({ plugin: 'function', command: 'add' }, versionGatingBlockedCommands)).toBe(true);

    expect(isCommandInMatches({ plugin: 'api', command: 'update' }, versionGatingBlockedCommands)).toBe(true);
    expect(isCommandInMatches({ plugin: 'function', command: 'update' }, versionGatingBlockedCommands)).toBe(true);

    expect(isCommandInMatches({ plugin: 'api', command: 'remove' }, versionGatingBlockedCommands)).toBe(true);
    expect(isCommandInMatches({ plugin: 'function', command: 'remove' }, versionGatingBlockedCommands)).toBe(true);

    expect(isCommandInMatches({ plugin: 'core', command: 'push' }, versionGatingBlockedCommands)).toBe(true);
    expect(isCommandInMatches({ plugin: 'api', command: 'push' }, versionGatingBlockedCommands)).toBe(true);
    expect(isCommandInMatches({ plugin: 'function', command: 'push' }, versionGatingBlockedCommands)).toBe(true);

    expect(isCommandInMatches({ plugin: 'hosting', command: 'publish' }, versionGatingBlockedCommands)).toBe(true);

    expect(isCommandInMatches({ plugin: 'api', command: 'gql-compile' }, versionGatingBlockedCommands)).toBe(true);

    expect(isCommandInMatches({ plugin: undefined, command: 'help' }, versionGatingBlockedCommands)).toBe(false);
    expect(isCommandInMatches({ plugin: undefined, command: 'version' }, versionGatingBlockedCommands)).toBe(false);
    expect(isCommandInMatches({ plugin: undefined, command: 'configure' }, versionGatingBlockedCommands)).toBe(false);
    expect(isCommandInMatches({ plugin: undefined, command: 'console' }, versionGatingBlockedCommands)).toBe(false);
    expect(isCommandInMatches({ plugin: undefined, command: 'init' }, versionGatingBlockedCommands)).toBe(false);
    expect(isCommandInMatches({ plugin: undefined, command: 'logout' }, versionGatingBlockedCommands)).toBe(false);
    expect(isCommandInMatches({ plugin: undefined, command: 'status' }, versionGatingBlockedCommands)).toBe(false);
    expect(isCommandInMatches({ plugin: undefined, command: 'pull' }, versionGatingBlockedCommands)).toBe(false);

    expect(isCommandInMatches({ plugin: 'env', command: 'list' }, versionGatingBlockedCommands)).toBe(false);
  });
});

describe('version gating', () => {
  const originalProcessEnv = process.env;

  let stackMetadata: any = undefined;

  class CfnClientMock {
    public getTemplateSummary = () => {
      return {
        promise: () =>
          new Promise((resolve, _) => {
            resolve({ Metadata: stackMetadata });
          }),
      };
    };
  }

  const cfnClientMockInstance = new CfnClientMock();

  class CloudFormation {
    cfn: CfnClientMock;

    constructor() {
      this.cfn = cfnClientMockInstance;
    }
  }

  const cloudFormationClient_stub = new CloudFormation();

  const meta_stub = {
    providers: {
      awscloudformation: {
        StackName: 'mockstack',
      },
    },
  };

  const stackMetadata_stub_520_500 = {
    AmplifyCLI: {
      DeployedByCLIVersion: '5.2.0',
      MinimumCompatibleCLIVersion: '5.0.0',
    },
  };

  const stackMetadata_stub_520_530 = {
    AmplifyCLI: {
      DeployedByCLIVersion: '5.2.0',
      MinimumCompatibleCLIVersion: '5.3.0',
    },
  };

  const stackMetadata_stub_530_531 = {
    AmplifyCLI: {
      DeployedByCLIVersion: '5.3.0',
      MinimumCompatibleCLIVersion: '5.3.1',
    },
  };

  const versionInfo_520_500 = {
    currentCLIVersion: '5.2.0',
    minimumCompatibleCLIVersion: '5.0.0',
  };

  const versionInfo_520_510 = {
    currentCLIVersion: '5.2.0',
    minimumCompatibleCLIVersion: '5.1.0',
  };

  const versionInfo_520_540 = {
    currentCLIVersion: '5.2.0',
    minimumCompatibleCLIVersion: '5.4.0',
  };

  const versionInfo_532_530 = {
    currentCLIVersion: '5.3.2',
    minimumCompatibleCLIVersion: '5.3.0',
  };

  const context_stub = {
    print: {
      info: jest.fn(),
      warning: jest.fn(),
      success: jest.fn(),
    },
    input: {
      plugin: 'api',
      command: 'add',
    },
    versionInfo: versionInfo_520_500,
    amplify: {
      invokePluginMethod: jest.fn().mockReturnValue(cloudFormationClient_stub),
    },
  } as unknown as jest.Mocked<$TSContext>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // reset mutated state
    context_stub.input.plugin = 'api';
    context_stub.input.command = 'add';
    context_stub.versionInfo = versionInfo_520_500;

    stackMetadata = undefined;

    process.env = { ...originalProcessEnv };
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // reset mutated state
    context_stub.input.plugin = 'api';
    context_stub.input.command = 'add';

    stackMetadata = undefined;

    process.env = { ...originalProcessEnv };
  });

  test('version gating should pass when env override set', async () => {
    process.env.AMPLIFY_CLI_DISABLE_VERSION_CHECK = '1';

    const versionGating = await import('../version-gating');

    const isCommandInMatchesMock = jest.spyOn(versionGating, 'isCommandInMatches');

    await expect(versionGating.isMinimumVersionSatisfied(context_stub)).resolves.toBe(true);

    expect(isCommandInMatchesMock).toHaveBeenCalledTimes(0);
  });

  test('version gating should pass when command is non-blocking', async () => {
    context_stub.input.plugin = 'core';
    context_stub.input.command = 'version';

    const versionGating = await import('../version-gating');
    const { stateManager } = await import('amplify-cli-core');

    const isCommandInMatchesMock = jest.spyOn(versionGating, 'isCommandInMatches');
    const stateManagerMock = jest.spyOn(stateManager, 'getMeta').mockImplementation(() => undefined);

    await expect(versionGating.isMinimumVersionSatisfied(context_stub)).resolves.toBe(true);

    expect(isCommandInMatchesMock).toHaveBeenCalledTimes(1);
    expect(stateManagerMock).toHaveBeenCalledTimes(0);
  });

  test('version gating should pass when stack is not deployed', async () => {
    const versionGating = await import('../version-gating');
    const { stateManager } = await import('amplify-cli-core');

    const stateManagerMock = jest.spyOn(stateManager, 'getMeta').mockImplementation(() => undefined);

    await expect(versionGating.isMinimumVersionSatisfied(context_stub)).resolves.toBe(true);

    expect(stateManagerMock).toHaveBeenCalledTimes(1);
    expect(context_stub.amplify.invokePluginMethod).toHaveBeenCalledTimes(0);
  });

  test('version gating should pass when stack has no metadata', async () => {
    const versionGating = await import('../version-gating');
    const { stateManager } = await import('amplify-cli-core');

    const stateManagerMock = jest.spyOn(stateManager, 'getMeta').mockImplementation(() => meta_stub);

    await expect(versionGating.isMinimumVersionSatisfied(context_stub)).resolves.toBe(true);

    expect(stateManagerMock).toHaveBeenCalledTimes(1);
    expect(context_stub.amplify.invokePluginMethod).toHaveBeenCalledTimes(1);
  });

  test('version gating should pass, meta: 5.2.0, metamin: 5.0.0, current: 5.2.0, min: 5.0.0', async () => {
    const versionGating = await import('../version-gating');
    const { stateManager } = await import('amplify-cli-core');

    stackMetadata = stackMetadata_stub_520_500;

    const stateManagerMock = jest.spyOn(stateManager, 'getMeta').mockImplementation(() => meta_stub);

    await expect(versionGating.isMinimumVersionSatisfied(context_stub)).resolves.toBe(true);
  });

  test('version gating should pass, meta: 5.2.0, metamin: 5.0.0, current: 5.2.0, min: 5.1.0', async () => {
    const versionGating = await import('../version-gating');
    const { stateManager } = await import('amplify-cli-core');

    stackMetadata = stackMetadata_stub_520_500;
    context_stub.versionInfo = versionInfo_520_510;

    const stateManagerMock = jest.spyOn(stateManager, 'getMeta').mockImplementation(() => meta_stub);

    await expect(versionGating.isMinimumVersionSatisfied(context_stub)).resolves.toBe(true);
  });

  test('version gating should pass, meta: 5.3.0, metamin: 5.3.1, current: 5.3.2, min: 5.3.0', async () => {
    const versionGating = await import('../version-gating');
    const { stateManager } = await import('amplify-cli-core');

    stackMetadata = stackMetadata_stub_530_531;
    context_stub.versionInfo = versionInfo_532_530;

    const stateManagerMock = jest.spyOn(stateManager, 'getMeta').mockImplementation(() => meta_stub);

    await expect(versionGating.isMinimumVersionSatisfied(context_stub)).resolves.toBe(true);
  });

  test('version gating should fail, meta: 5.2.0, metamin: 5.3.0, current: 5.2.0, min: 5.0.0', async () => {
    const versionGating = await import('../version-gating');
    const { stateManager } = await import('amplify-cli-core');

    stackMetadata = stackMetadata_stub_520_530;

    const stateManagerMock = jest.spyOn(stateManager, 'getMeta').mockImplementation(() => meta_stub);

    expect(versionGating.isMinimumVersionSatisfied(context_stub)).resolves.toEqual(false);
  });

  test('version gating should fail, meta: 5.2.0, metamin: 5.3.0, current: 5.2.0, min: 5.4.0', async () => {
    const versionGating = await import('../version-gating');
    const { stateManager } = await import('amplify-cli-core');

    stackMetadata = stackMetadata_stub_520_530;
    context_stub.versionInfo = versionInfo_520_540;

    const stateManagerMock = jest.spyOn(stateManager, 'getMeta').mockImplementation(() => meta_stub);

    expect(versionGating.isMinimumVersionSatisfied(context_stub)).resolves.toEqual(false);
  });
});
