describe('amplify env: ', () => {
  const mockExit = jest.fn();
  jest.mock('amplify-cli-core', () => ({
    exitOnNextTick: mockExit,
  }));
  const { run: runEnvCmd } = require('../../commands/env');
  const envList = require('../../commands/env/list');
  jest.mock('../../commands/env/list');

  it('env run method should exist', () => {
    expect(runEnvCmd).toBeDefined();
  });

  it('env ls is an alias for env list', async () => {
    const mockEnvListRun = jest.spyOn(envList, 'run');
    await runEnvCmd({
      input: {
        subCommands: ['list'],
      },
      parameters: {},
    });
    await runEnvCmd({
      input: {
        subCommands: ['ls'],
      },
      parameters: {},
    });
    expect(mockEnvListRun).toHaveBeenCalledTimes(2);
  });
});
