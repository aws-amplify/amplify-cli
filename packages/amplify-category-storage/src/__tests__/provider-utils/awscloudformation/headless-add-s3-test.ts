import { $TSContext, JSONUtilities, pathManager, stateManager, writeCFNTemplate } from 'amplify-cli-core';
import { headlessAddStorage } from '../../../provider-utils/awscloudformation/storage-configuration-helpers';

jest.mock('amplify-cli-core');

const JSONUtilities_mock = JSONUtilities as jest.Mocked<typeof JSONUtilities>;
const pathManager_mock = pathManager as jest.Mocked<typeof pathManager>;
const stateManager_mock = stateManager as jest.Mocked<typeof stateManager>;
const writeCFNTemplate_mock = writeCFNTemplate as jest.MockedFunction<typeof writeCFNTemplate>;

const context_stub = {
  amplify: {
    getProjectDetails: () => ({ projectConfig: { projectName: 'mockProj' } }),
  },
} as unknown as $TSContext;

describe('add S3 headlessly and verify state file snapshots', () => {
  it('minimal configuration', async () => {
    // headlessAddStorage()
  });

  it('maximum configuration', async () => {});
});
