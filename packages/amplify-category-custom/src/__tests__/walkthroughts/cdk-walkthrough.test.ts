import { $TSContext, JSONUtilities, pathManager } from '@aws-amplify/amplify-cli-core';
import { prompter } from '@aws-amplify/amplify-prompts';
import * as fs from 'fs-extra';
import { buildCustomResources } from '../../utils/build-custom-resources';
import { customResourceNameQuestion } from '../../utils/common-questions';
import { addCDKWalkthrough } from '../../walkthroughs/cdk-walkthrough';

jest.mock('../../utils/common-questions');
jest.mock('../../utils/build-custom-resources');

jest.mock('@aws-amplify/amplify-cli-core');
jest.mock('@aws-amplify/amplify-prompts');

jest.mock('fs-extra', () => ({
  readFileSync: jest.fn().mockReturnValue('mockCode'),
  existsSync: jest.fn().mockReturnValue(false),
  ensureDirSync: jest.fn().mockReturnValue(true),
  writeFileSync: jest.fn().mockReturnValue(true),
}));

pathManager.getBackendDirPath = jest.fn().mockReturnValue('mockTargetDir');
(JSONUtilities.writeJson = jest.fn()), (JSONUtilities.readJson = jest.fn());

const buildCustomResources_mock = buildCustomResources as jest.MockedFunction<typeof buildCustomResources>;
const customResourceNameQuestion_mock = customResourceNameQuestion as jest.MockedFunction<typeof customResourceNameQuestion>;
customResourceNameQuestion_mock.mockResolvedValue('customresoourcename');

describe('addCDKWalkthrough scenarios', () => {
  let mockContext: $TSContext;

  beforeEach(() => {
    jest.clearAllMocks();
    mockContext = {
      amplify: {
        openEditor: jest.fn(),
        updateamplifyMetaAfterResourceAdd: jest.fn(),
      },
    } as unknown as $TSContext;
  });

  it('successfully goes through cdk update walkthrough', async () => {
    prompter.yesOrNo = jest.fn().mockReturnValueOnce(true);

    await addCDKWalkthrough(mockContext);

    expect(buildCustomResources_mock).toHaveBeenCalledWith(mockContext, 'customresoourcename');
    expect(mockContext.amplify.openEditor).toHaveBeenCalledTimes(1);
    expect(mockContext.amplify.updateamplifyMetaAfterResourceAdd).toHaveBeenCalledTimes(1);
    expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
  });
});
