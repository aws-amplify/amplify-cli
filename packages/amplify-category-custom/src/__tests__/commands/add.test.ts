import { $TSContext } from 'amplify-cli-core';
import { run } from '../../commands/custom/add';
import { customDeploymentOptionsQuestion } from '../../utils/common-questions';
import { CDK_DEPLOYMENT_NAME, CFN_DEPLOYMENT_NAME } from '../../utils/constants';
import { addCDKWalkthrough } from '../../walkthroughs/cdk-walkthrough';
import { addCloudFormationWalkthrough } from '../../walkthroughs/cloudformation-walkthrough';

jest.mock('../../utils/common-questions');
jest.mock('../../walkthroughs/cloudformation-walkthrough');
jest.mock('../../walkthroughs/cdk-walkthrough');

const addCloudFormationWalkthrough_mock = addCloudFormationWalkthrough as jest.MockedFunction<typeof addCloudFormationWalkthrough>;
const addCDKWalkthrough_mock = addCDKWalkthrough as jest.MockedFunction<typeof addCDKWalkthrough>;
const customDeploymentOptionsQuestion_mock = customDeploymentOptionsQuestion as jest.MockedFunction<typeof customDeploymentOptionsQuestion>;

describe('add custom flow', () => {
  let mockContext: $TSContext;

  beforeEach(() => {
    jest.clearAllMocks();
    mockContext = {
      amplify: {},
    } as unknown as $TSContext;
  });

  it('add custom workflow is invoked for CDK', async () => {
    customDeploymentOptionsQuestion_mock.mockResolvedValueOnce(CDK_DEPLOYMENT_NAME);

    await run(mockContext);
    expect(addCDKWalkthrough_mock).toHaveBeenCalledTimes(1);
  });

  it('add custom workflow is invoked for CFN', async () => {
    customDeploymentOptionsQuestion_mock.mockResolvedValueOnce(CFN_DEPLOYMENT_NAME);

    await run(mockContext);
    expect(addCloudFormationWalkthrough_mock).toHaveBeenCalledTimes(1);
  });
});
