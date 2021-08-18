import { HooksEvent, DataParameter, EventPrefix, HooksVerb, HooksNoun, ErrorParameter } from './hooksTypes';
import { suppportedEvents, supportedEnvEvents } from './hooksConstants';
import { stateManager } from '../state-manager';
import _ from 'lodash';

export class HooksMeta {
  private static instance?: HooksMeta;
  private hooksEvent: Partial<HooksEvent>;
  private dataParameter: DataParameter;
  private errorParameter: ErrorParameter | undefined;

  public static getInstance = (hooksEvent: Partial<HooksEvent> = {}, dataParameter: DataParameter = { amplify: {} }): HooksMeta => {
    if (!HooksMeta.instance) {
      HooksMeta.instance = new HooksMeta(hooksEvent, dataParameter);
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
      hooksMeta.setHooksEventFromInput(input);
    }
    hooksMeta.setEventPrefix(eventPrefix);
    if (stateManager.localEnvInfoExists()) {
      hooksMeta.setEnvironmentName(stateManager.getLocalEnvInfo());
    }
    hooksMeta.mergeDataParameter({
      amplify: {
        command: hooksMeta.getHooksEvent().command,
        subCommand: hooksMeta.getHooksEvent().subCommand,
        argv: hooksMeta.getHooksEvent().argv,
      },
    });
    hooksMeta.setErrorParameter(errorParameter);
    return hooksMeta;
  };

  private constructor(hooksEvent: Partial<HooksEvent>, dataParameter: DataParameter) {
    this.hooksEvent = hooksEvent;
    this.dataParameter = dataParameter;
  }

  public getDataParameter(): DataParameter {
    return this.dataParameter;
  }

  public getErrorParameter(): ErrorParameter | undefined {
    return this.errorParameter;
  }

  public getHooksEvent(): HooksEvent {
    return this.hooksEvent as HooksEvent;
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
    this.hooksEvent.command = command;
  }
  public setEventSubCommand(subCommand?: string): void {
    this.hooksEvent.subCommand = subCommand;
  }

  public setEventPrefix(prefix?: string): void {
    this.hooksEvent.eventPrefix = prefix as EventPrefix;
  }

  public mergeDataParameter(newDataParameter: DataParameter): void {
    this.dataParameter = _.merge(this.dataParameter, newDataParameter);
  }

  public setHooksEventFromInput(input?: {
    command?: string;
    plugin?: string;
    subCommands?: string[];
    argv?: string[];
    options?: { forcePush?: boolean };
  }): void {
    if (!input) {
      return;
    }
    if (this.hooksEvent.command) {
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
      this.hooksEvent.command = command;
      if (suppportedEvents?.[command as HooksVerb]?.includes(subCommand as HooksNoun)) {
        this.hooksEvent.subCommand = subCommand;
      }
    }
    this.hooksEvent.forcePush = (input?.options?.forcePush && this.hooksEvent.command !== 'push') ?? false;
    this.hooksEvent.argv = input.argv;
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
