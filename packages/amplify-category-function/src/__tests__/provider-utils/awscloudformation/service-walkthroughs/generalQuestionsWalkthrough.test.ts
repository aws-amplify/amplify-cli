import { $TSContext } from 'amplify-cli-core';
import { prompter } from 'amplify-prompts';
import * as genQuestionsWalkthrough from '../../../../../src/provider-utils/awscloudformation/service-walkthroughs/generalQuestionsWalkthrough';

jest.mock('amplify-cli-core');
jest.mock('amplify-prompts');

describe('generalQuestionsWalkthrough', () => {
  const prompterMock = prompter as jest.Mocked<typeof prompter>;
  const spyOnGetDefaultProjectNameFromContext = jest.spyOn(genQuestionsWalkthrough, 'getDefaultProjectNameFromContext');
  const context = {} as $TSContext;

  beforeAll(() => {
    spyOnGetDefaultProjectNameFromContext.mockReset();
    spyOnGetDefaultProjectNameFromContext.mockReturnValue('default_project_name');
  });

  beforeEach(() => {
    prompterMock.input.mockReset();
  });

  afterAll(() => {
    prompterMock.input.mockReset();
    spyOnGetDefaultProjectNameFromContext.mockReset();
  });

  it('prompts for input for a Lambda function name', async () => {
    prompterMock.input.mockResolvedValueOnce('someFunctionName');

    await genQuestionsWalkthrough.generalQuestionsWalkthrough(context);

    expect(prompterMock.input).toHaveBeenCalledTimes(1);
    expect(prompterMock.input).toHaveBeenNthCalledWith(1, 'Provide an AWS Lambda function name:', expect.anything());
  });

  it('returns a partial function parameters object', async () => {
    prompterMock.input.mockResolvedValueOnce('someFunctionName');

    const result = await genQuestionsWalkthrough.generalQuestionsWalkthrough(context);

    expect(result).toEqual({ functionName: 'someFunctionName' });
  });
});
