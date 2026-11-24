/* eslint-disable spellcheck/spell-checker */
import { constants, stateManager } from '@aws-amplify/amplify-cli-core';
import { CLIInput } from '../command-input';
import { getAmplifyLogger, Redactor, IAmplifyLogger } from '@aws-amplify/amplify-cli-logger';

import {
  ICommandInput,
  IFlowData,
  IFlowReport,
  IOptionFlowCLIData,
  IOptionFlowHeadlessData,
  TypeOptionFlowData,
} from '@aws-amplify/amplify-cli-shared-interfaces';
import { createHashedIdentifier } from '../../commands/helpers/encryption-helpers';
import { homedir } from 'os';
import { getRecordedInput } from './known-commands';

/**
 * Recorded as the input of a headless flow.
 */
const headlessParametersPlaceholder = '****';

/**
 * Store the data and sequence of events of CLI walkthrough
 */
export class CLIFlowReport implements IFlowData {
  version!: string;
  runtime!: string;
  executable!: string;
  category!: string;
  isHeadless!: boolean;
  cmd!: string;
  subCmd: string | undefined;
  optionFlowData!: Array<TypeOptionFlowData>;
  logger!: IAmplifyLogger;
  input!: CLIInput;
  timestamp: string;
  projectEnvIdentifier?: string; // hash(ProjectName + Amplify AppId + EnvName)
  projectIdentifier?: string; // hash( ProjectName + Amplify App Id)
  envName?: string;

  // (file:/+)? -> matches optional file url prefix
  // homedir() -> users home directory, replacing \ with /
  // [\\w.\\-_@\\\\/]+ -> matches nested directories and file name
  filePathRegex = new RegExp(`(file:/+)?${homedir().replaceAll('\\', '/')}[\\w.\\-_@\\\\/]+`, 'g');

  constructor() {
    const currentTime = Date.now();
    this.logger = getAmplifyLogger();
    this.timestamp = currentTime.toString();
    this.isHeadless = false; // set headless to true if running in headless mode : TBD: can we query this from stateManager?
    this.optionFlowData = [];
  }

  /**
   * Initialize the project identifier to be used during the flow
   */
  assignProjectIdentifier(): undefined | string {
    if (!this.projectIdentifier) {
      try {
        const projectName = stateManager.getProjectName();
        const envName = stateManager.getCurrentEnvName();
        const appId = stateManager.getAppID();
        const { projectEnvIdentifier, projectIdentifier } = createHashedIdentifier(projectName, appId, envName);
        this.projectEnvIdentifier = projectEnvIdentifier;
        this.projectIdentifier = projectIdentifier;
        return this.projectEnvIdentifier;
      } catch (e) {
        return undefined;
      }
    }
    return undefined;
  }

  /**
   * Set the CLI input args.
   * Only known plugin, command and sub-command names are kept in the report input, see getRecordedInput.
   * cmd and subCmd are the first two recorded names in command line order: the plugin name (unless core), the command and its sub-commands.
   * @param input - first arguments provided in the CLI flow
   */
  setInput(input: ICommandInput): void {
    const [runtime, executable] = input.argv.slice(0, 2).map(this.anonymizePath);
    this.runtime = runtime;
    this.executable = executable;
    const recordedInput = getRecordedInput(input);
    const pluginNames = recordedInput.plugin === constants.CORE ? [] : [recordedInput.plugin];
    const [cmd, subCmd] = [...pluginNames, recordedInput.command, ...(recordedInput.subCommands ?? [])];
    this.input = recordedInput;
    this.cmd = cmd;
    this.subCmd = subCmd;
    this.optionFlowData = []; // key-value store with ordering maintained
  }

  /**
   * Set the Amplify CLI version being used for this flow
   */
  setVersion(version: string): void {
    this.version = version;
  }

  /**
   * Returns JSON version of this object
   *
   * @returns JSON version of the object
   */
  getFlowReport(): IFlowReport {
    const result: IFlowReport = {
      runtime: this.runtime,
      executable: this.executable,
      version: this.version,
      cmd: this.cmd,
      subCmd: this.subCmd,
      isHeadless: this.isHeadless,
      optionFlowData: this.optionFlowData,
      category: this.category,
      input: this.input,
      timestamp: this.timestamp,
      projectEnvIdentifier: this.projectEnvIdentifier,
      projectIdentifier: this.projectIdentifier,
    };
    return result;
  }

  /**
   * This method is to configure when the current flow is headless.
   * @param isHeadless
   */
  setIsHeadless(isHeadless: boolean): void {
    this.isHeadless = isHeadless;
  }

  /**
   * This method is called whenever user selects an option in the CLI walkthrough
   * @param selectedOption - walkthrough options selected
   */
  pushInteractiveFlow(prompt: string, input: unknown): void {
    const redactedString = Redactor(JSON.stringify({ prompt, input }));
    const cleanOption = JSON.parse(redactedString);
    const timeStampedCLIFlowOption: IOptionFlowCLIData = { ...cleanOption, timestamp: new Date().valueOf() }; // attach unix-style timestamp
    this.optionFlowData.push(timeStampedCLIFlowOption);
  }

  /**
   * This method is called whenever the CLI is invoked in headless mode.
   * Records that headless parameters were provided.
   * @param _headlessParameterString - headless parameter string ( serialized but before schema validation )
   */
  pushHeadlessFlow(_headlessParameterString: string, cliInput: ICommandInput): void {
    this.assignProjectIdentifier(); // conditionally initialize the project identifier
    this.setIsHeadless(true);
    this.setInput(cliInput);
    const timeStampedOption: IOptionFlowHeadlessData = { input: headlessParametersPlaceholder, timestamp: new Date().valueOf() }; // attach unix-style timestamp
    this.optionFlowData.push(timeStampedOption);
  }

  private anonymizePath = (str: string): string => {
    let result = str;
    if (result.match(this.filePathRegex)) {
      result = result.replace(this.filePathRegex, '');
    }
    return result;
  };
}
