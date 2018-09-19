const inquirer = require('inquirer');

const askCodegneQueryFilePattern = require('../../../src/walkthrough/questions/queryFilePattern');

jest.mock('inquirer');

describe('askCodegneQueryFilePattern', () => {
  const includePattern = 'src/**/*.gql';
  inquirer.prompt.mockReturnValue({ includePattern });
  it('should ask user for query file pattern', async () => {
    const answer = await askCodegneQueryFilePattern();
    expect(answer).toEqual([includePattern]);
    const questions = inquirer.prompt.mock.calls[0][0];
    expect(questions[0].name).toEqual('includePattern');
    expect(questions[0].type).toEqual('input');
  });
});
