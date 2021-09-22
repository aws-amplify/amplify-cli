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
    hooksMeta.setHookEventFromInput(input);

    expect(hooksMeta.getHookEvent()?.command).toEqual('add');
    expect(hooksMeta.getHookEvent()?.subCommand).toEqual('env');
  });

  test('should identify configure as update for notification and hosting', () => {
    let hooksMeta = HooksMeta.getInstance();

    hooksMeta.setHookEventFromInput({ command: 'configure', plugin: 'notifications' });
    expect(hooksMeta.getHookEvent()?.command).toEqual('update');
    expect(hooksMeta.getHookEvent()?.subCommand).toEqual('notifications');

    HooksMeta.releaseInstance();
    hooksMeta = HooksMeta.getInstance();

    hooksMeta.setHookEventFromInput({ command: 'configure', plugin: 'hosting' });
    expect(hooksMeta.getHookEvent()?.command).toEqual('update');
    expect(hooksMeta.getHookEvent()?.subCommand).toEqual('hosting');
  });

  test('should idenfity mock commands', () => {
    const input = { command: 'api', plugin: 'mock' };
    const hooksMeta = HooksMeta.getInstance();
    hooksMeta.setHookEventFromInput(input);

    expect(hooksMeta.getHookEvent()?.command).toEqual('mock');
    expect(hooksMeta.getHookEvent()?.subCommand).toEqual('api');
  });

  test('should not set the command and subcommand on unknown/unsupported events', () => {
    const input = { command: 'init', plugin: 'core' };
    const hooksMeta = HooksMeta.getInstance();
    hooksMeta.setHookEventFromInput(input);

    expect(hooksMeta.getHookEvent()?.command).toEqual(undefined);
    expect(hooksMeta.getHookEvent()?.subCommand).toEqual(undefined);
  });

  test('should return correct HooksMeta object - getInstance', () => {
    let hooksMeta = HooksMeta.getInstance();

    expect(hooksMeta).toBeDefined();
    expect(hooksMeta.getHookEvent()).toBeDefined();
    expect(hooksMeta.getDataParameter()).toBeDefined();
    expect(hooksMeta.getErrorParameter()).not.toBeDefined();

    HooksMeta.releaseInstance();

    hooksMeta = HooksMeta.getInstance(
      {
        command: 'pull',
        plugin: 'core',
        subCommands: undefined,
        options: {
          forcePush: true,
        },
      },
      'pre',
    );
    expect(hooksMeta).toBeDefined();
    expect(hooksMeta.getHookEvent().command).toEqual('pull');
    expect(hooksMeta.getHookEvent().eventPrefix).toEqual('pre');
    expect(hooksMeta.getHookEvent().forcePush).toEqual(true);
    expect(hooksMeta.getErrorParameter()).not.toBeDefined();

    // if the event was defined and Amplify emits an error, getInstance should attatch the error parameter to the already defined event
    hooksMeta = HooksMeta.getInstance(undefined, 'post', { message: 'test_message', stack: 'test_stack' });
    expect(hooksMeta).toBeDefined();
    expect(hooksMeta.getHookEvent().command).toEqual('pull');
    expect(hooksMeta.getHookEvent().eventPrefix).toEqual('post');
    expect(hooksMeta.getHookEvent().forcePush).toEqual(true);
    expect(hooksMeta.getErrorParameter()).toEqual({ message: 'test_message', stack: 'test_stack' });
  });
});
