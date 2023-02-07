import { HookEvent, DataParameter, EventPrefix, HooksVerb, HooksNoun, ErrorParameter } from './hooksTypes';
import { supportedEvents, supportedEnvEvents } from './hooksConstants';
import { stateManager } from '../state-manager';
import _ from 'lodash';

export class HooksMeta {
  private static instance?: HooksMeta;
  private hookEvent: Partial<HookEvent>;
  private dataParameter: DataParameter;
  private errorParameter?: ErrorParameter;

  public static getInstance = (
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
    if (!HooksMeta.instance) {
      HooksMeta.instance = new HooksMeta();
    }
    if (input) {
      HooksMeta.instance.setHookEventFromInput(input);
    }
    HooksMeta.instance.setEventPrefix(eventPrefix);
    if (stateManager.localEnvInfoExists()) {
      HooksMeta.instance.setEnvironmentName(stateManager.getLocalEnvInfo());
    }
    HooksMeta.instance.mergeDataParameter({
      amplify: {
        command: HooksMeta.instance.getHookEvent().command,
        subCommand: HooksMeta.instance.getHookEvent().subCommand,
        argv: HooksMeta.instance.getHookEvent().argv,
      },
    });
    HooksMeta.instance.setErrorParameter(errorParameter);

    return HooksMeta.instance;
  };

  private constructor() {
    this.hookEvent = {};
    this.dataParameter = { amplify: {} };
  }

  public getDataParameter(): DataParameter {
    return this.dataParameter;
  }

  public getErrorParameter(): ErrorParameter | undefined {
    return this.errorParameter;
  }

  public getHookEvent(): HookEvent {
    return this.hookEvent as HookEvent;
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
    this.hookEvent.command = command;
  }
  public setEventSubCommand(subCommand?: string): void {
    this.hookEvent.subCommand = subCommand;
  }

  public setEventPrefix(prefix?: EventPrefix): void {
    this.hookEvent.eventPrefix = prefix;
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
    if (this.hookEvent.command) {
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

    if (Object.prototype.hasOwnProperty.call(supportedEvents, command)) {
      this.hookEvent.command = command;
      if (supportedEvents?.[command as HooksVerb]?.includes(subCommand as HooksNoun)) {
        this.hookEvent.subCommand = subCommand;
      }
    }
    this.hookEvent.forcePush = (input?.options?.forcePush && this.hookEvent.command !== 'push') ?? false;
    this.hookEvent.argv = input.argv;
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
