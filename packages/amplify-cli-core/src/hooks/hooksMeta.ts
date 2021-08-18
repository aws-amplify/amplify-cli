import { HookEvent, DataParameter, EventPrefix, HooksVerb, HooksNoun, ErrorParameter } from './hooksTypes';
import { suppportedEvents, supportedEnvEvents } from './hooksConstants';
import { stateManager } from '../state-manager';
import _ from 'lodash';

export class HooksMeta {
  private static instance?: HooksMeta;
  private HookEvent: Partial<HookEvent>;
  private dataParameter: DataParameter;
  private errorParameter: ErrorParameter | undefined;

  public static getInstance = (HookEvent: Partial<HookEvent> = {}, dataParameter: DataParameter = { amplify: {} }): HooksMeta => {
    if (!HooksMeta.instance) {
      HooksMeta.instance = new HooksMeta(HookEvent, dataParameter);
    }

    return HooksMeta.instance;
  };

  public static constructHooksMetaObject = (
    input?: {
      command?: string;
      plugin?: string;
      subCommands?: string[];
      options?: { forcePush?: boolean };
      argv?: string[];
    },
    eventPrefix?: EventPrefix,
    errorParameter?: ErrorParameter,
  ): HooksMeta => {
    const hooksMeta = HooksMeta.getInstance();
    if (input) {
      hooksMeta.setHookEventFromInput(input);
    }
    hooksMeta.setEventPrefix(eventPrefix);
    if (stateManager.localEnvInfoExists()) {
      hooksMeta.setEnvironmentName(stateManager.getLocalEnvInfo());
    }
    hooksMeta.mergeDataParameter({
      amplify: {
        command: hooksMeta.getHookEvent().command,
        subCommand: hooksMeta.getHookEvent().subCommand,
        argv: hooksMeta.getHookEvent().argv,
      },
    });
    hooksMeta.setErrorParameter(errorParameter);
    return hooksMeta;
  };

  private constructor(HookEvent: Partial<HookEvent>, dataParameter: DataParameter) {
    this.HookEvent = HookEvent;
    this.dataParameter = dataParameter;
  }

  public getDataParameter(): DataParameter {
    return this.dataParameter;
  }

  public getErrorParameter(): ErrorParameter | undefined {
    return this.errorParameter;
  }

  public getHookEvent(): HookEvent {
    return this.HookEvent as HookEvent;
  }

  public setEnvironmentName(envName?: string): void {
    this.dataParameter.amplify.environment = envName;
  }

  public setAmplifyVersion(amplifyVersion: string): void {
    this.dataParameter.amplify.version = amplifyVersion;
  }

  public setErrorParameter(errorParameter?: ErrorParameter): void {
    this.errorParameter = errorParameter;
  }

  public setEventCommand(command: string): void {
    this.HookEvent.command = command;
  }
  public setEventSubCommand(subCommand?: string): void {
    this.HookEvent.subCommand = subCommand;
  }

  public setEventPrefix(prefix?: string): void {
    this.HookEvent.eventPrefix = prefix as EventPrefix;
  }

  public mergeDataParameter(newDataParameter: DataParameter): void {
    this.dataParameter = _.merge(this.dataParameter, newDataParameter);
  }

  public setHookEventFromInput(input?: {
    command?: string;
    plugin?: string;
    subCommands?: string[];
    argv?: string[];
    options?: { forcePush?: boolean };
  }): void {
    if (!input) {
      return;
    }
    if (this.HookEvent.command) {
      return;
    }

    let command: string = input.command ?? '';
    let subCommand: string = input.plugin ?? '';

    switch (command) {
      case 'env':
        subCommand = 'env';
        if (!input.subCommands || input.subCommands.length < 0 || !supportedEnvEvents.includes(input.subCommands[0] as HooksVerb)) {
          return;
        }
        command = input.subCommands[0];
        break;
      case 'configure':
        if (input.plugin === 'notifications' || input.plugin === 'hosting') {
          command = 'update';
        }
        break;
      case 'gql-compile':
        command = 'gqlcompile';
        break;
      case 'add-graphql-datasource':
        command = 'addgraphqldatasource';
        break;
    }

    if (subCommand === 'mock') {
      subCommand = command;
      command = 'mock';
    }

    if (suppportedEvents.hasOwnProperty(command)) {
      this.HookEvent.command = command;
      if (suppportedEvents?.[command as HooksVerb]?.includes(subCommand as HooksNoun)) {
        this.HookEvent.subCommand = subCommand;
      }
    }
    this.HookEvent.forcePush = (input?.options?.forcePush && this.HookEvent.command !== 'push') ?? false;
    this.HookEvent.argv = input.argv;
  }

  /**
   * @internal
   * private method used in unit tests to release the instance
   * TODO: remove this to use jest.resetModules or jest.isolateModules
   */
  public static releaseInstance = (): void => {
    HooksMeta.instance = undefined;
  };
}
