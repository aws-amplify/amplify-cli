const inquirer = require('inquirer');

const askGenerateCode = require('../../../src/walkthrough/questions/generateCode');

jest.mock('inquirer');

describe('shouldGenerateCode', () => {
  inquirer.prompt.mockReturnValue({ confirmGenerateCode: false });
  it('should confirm users if they want to generate the code', async () => {
    const answer = await askGenerateCode();
    expect(answer).toBe(false);
    const questions = inquirer.prompt.mock.calls[0][0];
    expect(questions[0].name).toEqual('confirmGenerateCode');
    expect(questions[0].type).toEqual('confirm');
    expect(questions[0].default).toEqual(true);
  });
});
