import { HooksMeta } from '../../hooks/hooksMeta';

describe('HooksMeta tests', () => {
  beforeEach(async () => {
    HooksMeta.getInstance();
  });
  afterEach(() => {
    HooksMeta.releaseInstance();
  });

  test('should identify env commands', () => {
    const input = { command: 'env', plugin: 'core', subCommands: ['add'] };
    const hooksMeta = HooksMeta.getInstance();
    hooksMeta.setHooksEventFromInput(input);

    expect(hooksMeta.getHooksEvent()?.command).toEqual('add');
    expect(hooksMeta.getHooksEvent()?.subCommand).toEqual('env');
  });

  test('should identify configure as update for notification and hosting', () => {
    let hooksMeta = HooksMeta.getInstance();

    hooksMeta.setHooksEventFromInput({ command: 'configure', plugin: 'notifications' });
    expect(hooksMeta.getHooksEvent()?.command).toEqual('update');
    expect(hooksMeta.getHooksEvent()?.subCommand).toEqual('notifications');

    HooksMeta.releaseInstance();
    hooksMeta = HooksMeta.getInstance();

    hooksMeta.setHooksEventFromInput({ command: 'configure', plugin: 'hosting' });
    expect(hooksMeta.getHooksEvent()?.command).toEqual('update');
    expect(hooksMeta.getHooksEvent()?.subCommand).toEqual('hosting');
  });

  test('should idenfity mock commands', () => {
    const input = { command: 'api', plugin: 'mock' };
    const hooksMeta = HooksMeta.getInstance();
    hooksMeta.setHooksEventFromInput(input);

    expect(hooksMeta.getHooksEvent()?.command).toEqual('mock');
    expect(hooksMeta.getHooksEvent()?.subCommand).toEqual('api');
  });

  test('should not set the command and subcommand on unknown/unsupported events', () => {
    const input = { command: 'init', plugin: 'core' };
    const hooksMeta = HooksMeta.getInstance();
    hooksMeta.setHooksEventFromInput(input);

    expect(hooksMeta.getHooksEvent()?.command).toEqual(undefined);
    expect(hooksMeta.getHooksEvent()?.subCommand).toEqual(undefined);
  });
});
