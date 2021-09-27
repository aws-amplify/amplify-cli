import { run } from '../../commands/awscloudformation/override';
import { $TSContext, FeatureFlags, generateOverrideSkeleton } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import * as path from 'path';

jest.mock('amplify-cli-core', () => ({
  FeatureFlags: {
    getBoolean: jest.fn(),
  },
  generateOverrideSkeleton: jest.fn(),
}));
jest.mock('amplify-provider-awscloudformation');
jest.mock('amplify-prompts', () => ({
  printer: {
    info: jest.fn(),
  },
}));

jest.mock('fs-extra', () => ({
  ensureDirSync: jest.fn(),
  existsSync: jest.fn(),
  emptyDirSync: jest.fn(),
}));

describe('run override command for root stack', () => {
  it('runs override command when FF is OFF', async () => {
    const context_stub = {
      amplify: {
        confirmPrompt: jest.fn().mockResolvedValue(true),
        invokePluginMethod: jest.fn(),
      },
    };

    const context_stub_typed = context_stub as unknown as $TSContext;
    await run(context_stub_typed);
    expect(printer.info).toBeCalledTimes(2);
  });

  it('run override command when FF is ON and awscloudformation exist', async () => {
    FeatureFlags.getBoolean = jest.fn().mockReturnValue(true);
    const context_stub = {
      amplify: {
        confirmPrompt: jest.fn().mockResolvedValue(true),
        invokePluginMethod: jest.fn(),
        pathManager: {
          getBackendDirPath: jest.fn().mockReturnValue('mydir'),
        },
      },
    };

    const context_stub_typed = context_stub as unknown as $TSContext;
    await run(context_stub_typed);
    const mockSrcPath = path.join(__dirname, '..', '..', '..', 'resources', 'overrides-resource');
    const mockDestPath = path.join('mydir', 'awscloudformation');
    expect(generateOverrideSkeleton).toBeCalledWith(context_stub_typed, mockSrcPath, mockDestPath);
  });
});
