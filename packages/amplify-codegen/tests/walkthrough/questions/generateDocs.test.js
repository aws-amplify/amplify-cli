const generateDocs = require('../../../src/walkthrough/questions/generateDocs');
const { prompt } = require('inquirer');

jest.mock('inquirer');
prompt.mockReturnValue({
  confirmGenerateOperations: true,
});
describe('generateDocs', () => {
  it('should ask if the user if they want to generate GraphQL Docs from schema', async () => {
    const asnwer = await generateDocs();
    expect(asnwer).toEqual(true);
    expect(prompt).toHaveBeenCalled();
    const callArgs = prompt.mock.calls[0][0][0];
    expect(callArgs.name).toEqual('confirmGenerateOperations');
  });
});
