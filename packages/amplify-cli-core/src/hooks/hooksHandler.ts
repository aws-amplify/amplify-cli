import { HooksEvent, DataParameter, EventPrefix } from './hooksTypes';
import { $TSAny } from '../index';
import { suppportedEvents, supportedEnvEvents } from './hooksConstants';
import { stateManager } from '../state-manager';

export class HooksHandler {
  private static instance?: HooksHandler;
  public hooksEvent: HooksEvent;
  public dataParameter: DataParameter;

  public static initialize = (
    hooksEvent: HooksEvent = { seperator: '-' },
    dataParameter: DataParameter = { amplify: { version: stateManager.getAmplifyVersion() } },
  ): HooksHandler => {
    if (!HooksHandler.instance) {
      HooksHandler.instance = new HooksHandler(hooksEvent, dataParameter);
    }

    return HooksHandler.instance;
  };

  private constructor(hooksEvent: HooksEvent, dataParameter: DataParameter) {
    this.hooksEvent = hooksEvent;
    this.dataParameter = dataParameter;
  }

  public getHooksEvent(): HooksEvent | undefined {
    return this.hooksEvent;
  }

  public setHooksEvent(event: HooksEvent): void {
    this.hooksEvent = event;
  }

  public getDataParameter(): DataParameter | undefined {
    this.dataParameter.amplify.command = this.dataParameter.amplify.command ?? this.hooksEvent.command;
    this.dataParameter.amplify.subCommand = this.dataParameter.amplify.subCommand ?? this.hooksEvent.subCommand;
    this.dataParameter.amplify.argv = this.dataParameter.amplify.argv ?? this.hooksEvent.argv;
    return this.dataParameter;
  }

  public setDataParameter(dataParameter: DataParameter): void {
    this.dataParameter = dataParameter;
  }

  public setHooksEventFromInput(
    input?: { command?: string; plugin?: string; subCommands?: string[]; argv?: string[] },
    eventPrefix?: EventPrefix,
  ): void {
    /**
     * sets hooksEvent from input object
     *
     * @param {{ command?: string; plugin?: string; subCommands?: string[]; argv?: string[] }} input
     * @returns {void}
     */

    if (!input) return;

    let command: string = input.command ?? '';
    let subCommand: string = input.plugin ?? '';

    switch (command) {
      case 'env':
        subCommand = 'env';
        if (!input.subCommands || input.subCommands.length < 0 || !supportedEnvEvents.has(input.subCommands[0])) return;
        command = input.subCommands[0];
        break;
      case 'configure':
        command = 'update';
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
      if (suppportedEvents?.[command]?.has(subCommand)) {
        this.hooksEvent.subCommand = subCommand;
      }
    }
    this.hooksEvent.eventPrefix = eventPrefix;
    this.hooksEvent.argv = input.argv;
  }
}
