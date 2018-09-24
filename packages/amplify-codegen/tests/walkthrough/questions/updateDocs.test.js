const inquirer = require('inquirer');

const updateDocs = require('../../../src/walkthrough/questions/updateDocs');

jest.mock('inquirer');

describe('shouldUpdateDocs', () => {
  inquirer.prompt.mockReturnValue({ confirmUpdateDocs: false });
  it('should confirm users if they want to update the docs', async () => {
    const answer = await updateDocs();
    expect(answer).toBe(false);
    const questions = inquirer.prompt.mock.calls[0][0];
    expect(questions[0].name).toEqual('confirmUpdateDocs');
    expect(questions[0].type).toEqual('confirm');
    expect(questions[0].default).toEqual(true);
  });
});
