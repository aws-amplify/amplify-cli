import { run } from '../../commands/awscloudformation/override';
import { $TSContext, generateOverrideSkeleton } from 'amplify-cli-core';
import * as path from 'path';

jest.mock('amplify-cli-core', () => ({
  pathManager: {
    getBackendDirPath: jest.fn().mockReturnValue('mockPath'),
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
  it('run override command when awscloudformation exist', async () => {
    const context_stub = {
      amplify: {
        confirmPrompt: jest.fn().mockResolvedValue(true),
        invokePluginMethod: jest.fn(),
      },
    };

    const context_stub_typed = context_stub as unknown as $TSContext;
    await run(context_stub_typed);
    const mockSrcPath = path.join(__dirname, '..', '..', '..', 'resources', 'overrides-resource');
    const mockDestPath = path.join('mockPath', 'awscloudformation');
    expect(generateOverrideSkeleton).toBeCalledWith(context_stub_typed, mockSrcPath, mockDestPath);
  });
});
