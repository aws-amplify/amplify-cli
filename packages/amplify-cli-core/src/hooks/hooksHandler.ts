import { HooksEvent, DataParameter, EventPrefix, HooksVerb, HooksNoun } from './hooksTypes';
import { suppportedEvents, supportedEnvEvents } from './hooksConstants';
import { stateManager } from '../state-manager';
import { $TSContext } from '..';
import _ from 'lodash';

export class HooksHandler {
  private static instance?: HooksHandler;
  private hooksEvent: HooksEvent;
  private dataParameter: DataParameter;

  public static initialize = (hooksEvent: HooksEvent = {}, dataParameter: DataParameter = { amplify: {} }): HooksHandler => {
    if (!HooksHandler.instance) {
      HooksHandler.instance = new HooksHandler(hooksEvent, dataParameter);
    }

    return HooksHandler.instance;
  };

  private constructor(hooksEvent: HooksEvent, dataParameter: DataParameter) {
    this.hooksEvent = hooksEvent;
    this.dataParameter = dataParameter;
  }

  public getDataParameter(): DataParameter | undefined {
    return this.dataParameter;
  }

  public getHooksEvent(): HooksEvent {
    return this.hooksEvent;
  }

  public setEnvironmentName(envName?: string): void {
    this.dataParameter.amplify.environment = envName;
  }

  public setAmplifyVersion(amplifyVersion: string): void {
    this.dataParameter.amplify.version = amplifyVersion;
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

  public setHooksEventFromInput(
    input?: { command?: string; plugin?: string; subCommands?: string[]; argv?: string[] },
    eventPrefix?: EventPrefix,
  ): void {
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
        if (!input.subCommands || input.subCommands.length < 0 || !supportedEnvEvents.has(input.subCommands[0] as HooksVerb)) {
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
      if (suppportedEvents?.[command as HooksVerb]?.has(subCommand as HooksNoun)) {
        this.hooksEvent.subCommand = subCommand;
      }
    }
    this.hooksEvent.eventPrefix = eventPrefix;
    this.hooksEvent.argv = input.argv;
  }

  /**
   * @internal
   * private method used in unit tests to release the instance
   */
  public static releaseInstance = (): void => {
    HooksHandler.instance = undefined;
  };
}
