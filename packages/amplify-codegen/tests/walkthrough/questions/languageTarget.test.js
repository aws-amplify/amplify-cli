const inquirer = require('inquirer');

const { getFrontEndHandler } = require('../../../src/utils');
const { AmplifyCodeGenNotSupportedError } = require('../../../src/errors');
const askCodegenTargetLanguage = require('../../../src/walkthrough/questions/languageTarget');

jest.mock('inquirer');
jest.mock('../../../src/utils');

describe('askCodegenTargetLanguage', () => {
  const mockContext = {
    print: {
      info: jest.fn(),
    },
  };
  it('should prompt when the front end framework is iOS', async () => {
    getFrontEndHandler.mockReturnValue('ios');
    const targetLanguage = await askCodegenTargetLanguage(mockContext);
    expect(targetLanguage).toEqual('swift');
    expect(getFrontEndHandler).toHaveBeenCalledWith(mockContext);
  });

  it('should throw error if the front end handler is for unsupported front end handlers', async () => {
    getFrontEndHandler.mockReturnValue('android');
    try {
      await askCodegenTargetLanguage(mockContext);
    } catch (e) {
      expect(e).toBeInstanceOf(AmplifyCodeGenNotSupportedError);
      expect(getFrontEndHandler).toHaveBeenCalledWith(mockContext);
    }
  });

  it('should allow user to select the language target when front end is javascript', async () => {
    getFrontEndHandler.mockReturnValue('javascript');
    inquirer.prompt.mockReturnValue({ target: 'typescript' });
    await askCodegenTargetLanguage(mockContext);
    expect(inquirer.prompt).toHaveBeenCalled();

    const questions = inquirer.prompt.mock.calls[0][0];
    expect(questions[0].type).toEqual('list');
    expect(questions[0].name).toEqual('target');
    expect(questions[0].choices).toEqual(['javascript', 'typescript', 'flow']);
  });
});
