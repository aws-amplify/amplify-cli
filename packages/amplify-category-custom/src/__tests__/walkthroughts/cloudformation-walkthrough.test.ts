import { $TSContext, pathManager } from '@aws-amplify/amplify-cli-core';
import { prompter } from '@aws-amplify/amplify-prompts';
import { customResourceNameQuestion } from '../../utils/common-questions';
import { addCloudFormationWalkthrough } from '../../walkthroughs/cloudformation-walkthrough';

jest.mock('../../utils/common-questions');
jest.mock('../../utils/build-custom-resources');
jest.mock('../../utils/dependency-management-utils');

jest.mock('@aws-amplify/amplify-cli-core');
jest.mock('@aws-amplify/amplify-prompts');

jest.mock('fs-extra', () => ({
  readFileSync: jest.fn().mockReturnValue('mockCode'),
  existsSync: jest.fn().mockReturnValue(false),
  ensureDirSync: jest.fn().mockReturnValue(true),
  writeFileSync: jest.fn().mockReturnValue(true),
}));

pathManager.getBackendDirPath = jest.fn().mockReturnValue('mockTargetDir');

const customResourceNameQuestion_mock = customResourceNameQuestion as jest.MockedFunction<typeof customResourceNameQuestion>;
customResourceNameQuestion_mock.mockResolvedValue('customresoourcename');

describe('addCFNWalkthrough scenarios', () => {
  let mockContext: $TSContext;

  beforeEach(() => {
    jest.clearAllMocks();
    mockContext = {
      amplify: {
        openEditor: jest.fn(),
        updateamplifyMetaAfterResourceAdd: jest.fn(),
        copyBatch: jest.fn(),
      },
    } as unknown as $TSContext;
  });

  it('successfully goes through cdk update walkthrough', async () => {
    prompter.yesOrNo = jest.fn().mockReturnValueOnce(true);

    await addCloudFormationWalkthrough(mockContext);

    expect(mockContext.amplify.openEditor).toHaveBeenCalledTimes(1);
    expect(mockContext.amplify.updateamplifyMetaAfterResourceAdd).toHaveBeenCalledTimes(1);
    expect(mockContext.amplify.copyBatch).toHaveBeenCalledTimes(1);
  });
});
