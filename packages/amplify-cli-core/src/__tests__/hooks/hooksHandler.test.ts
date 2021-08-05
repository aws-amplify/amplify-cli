import { HooksHandler } from '../../hooks/hooksHandler';

describe('HooksHandler tests', () => {
  beforeEach(async () => {
    HooksHandler.initialize();
  });
  afterEach(() => {
    HooksHandler.releaseInstance();
  });

  test('should identify env commands', () => {
    const input = { command: 'env', plugin: 'core', subCommands: ['add'] };
    const hooksHandler = HooksHandler.initialize();
    hooksHandler.setHooksEventFromInput(input);

    expect(hooksHandler.hooksEvent?.command).toEqual('add');
    expect(hooksHandler.hooksEvent?.subCommand).toEqual('env');
  });

  test('should identify configure as update for notification and hosting', () => {
    let hooksHandler = HooksHandler.initialize();

    hooksHandler.setHooksEventFromInput({ command: 'configure', plugin: 'notifications' });
    expect(hooksHandler.hooksEvent?.command).toEqual('update');
    expect(hooksHandler.hooksEvent?.subCommand).toEqual('notifications');

    HooksHandler.releaseInstance();
    hooksHandler = HooksHandler.initialize();

    hooksHandler.setHooksEventFromInput({ command: 'configure', plugin: 'hosting' });
    expect(hooksHandler.hooksEvent?.command).toEqual('update');
    expect(hooksHandler.hooksEvent?.subCommand).toEqual('hosting');
  });

  test('should idenfity mock commands', () => {
    const input = { command: 'api', plugin: 'mock' };
    const hooksHandler = HooksHandler.initialize();
    hooksHandler.setHooksEventFromInput(input);

    expect(hooksHandler.hooksEvent?.command).toEqual('mock');
    expect(hooksHandler.hooksEvent?.subCommand).toEqual('api');
  });

  test('should not set the command and subcommand on unknown/unsupported events', () => {
    const input = { command: 'init', plugin: 'core' };
    const hooksHandler = HooksHandler.initialize();
    hooksHandler.setHooksEventFromInput(input);

    expect(hooksHandler.hooksEvent?.command).toEqual(undefined);
    expect(hooksHandler.hooksEvent?.subCommand).toEqual(undefined);
  });
});
