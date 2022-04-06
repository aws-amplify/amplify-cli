/* eslint-disable spellcheck/spell-checker */
import { $TSAny, JSONUtilities, stateManager } from 'amplify-cli-core';
import { logger, Redactor } from 'amplify-cli-logger';
import { IAmplifyLogger } from 'amplify-cli-logger/lib/IAmplifyLogger';
import { IFlowData, IFlowReport } from 'amplify-cli-shared-interfaces';
import { Input } from '../input';

/**
 * Store the data and sequence of events of CLI walkthrough
 */
export class CLIFlowReport implements IFlowData {
    private static _instance: CLIFlowReport = new CLIFlowReport();
    version!: string;
    runtime!: string;
    executable!: string;
    category!: string;
    cmd!: string;
    subCmd: string| undefined;
    optionFlow!: Array<$TSAny>;
    logger!: IAmplifyLogger;
    input!: Input;
    timestamp : string;
    projectEnvIdentifier? : string; // hash(ProjectName + Amplify AppId + EnvName)
    projectIdentifier?: string; // hash( ProjectName + Amplify App Id)

    private constructor() {
      const currentTime = Date.now();
      if (CLIFlowReport._instance) {
        throw new Error('Use CLIFlowReport.instance');
      }
      CLIFlowReport._instance = this;
      this.logger = logger;
      this.timestamp = currentTime.toString();
    }

    /**
     * Set Project identifier
     */
    setProjectIdentifier(): void {
      const amplifyMeta = stateManager.getMeta();
      const projectName = amplifyMeta.getProjectConfig();
      const appId = amplifyMeta.getAppId();
      const { envName } = amplifyMeta.getEnvInfo();
      this.projectEnvIdentifier = `${projectName}${appId}${envName}`;
      this.projectIdentifier = `${projectName}${appId}`;
    }

    /**
     * Initialize the project identifier to be used during the flow
     */
    initializeProjectIdentifier():undefined|string {
      try {
        const amplifyMeta = stateManager.getMeta();
        const projectName = amplifyMeta.getProjectConfig();
        const appId = amplifyMeta.getAppId();
        const { envName } = amplifyMeta.getEnvInfo();
        this.projectEnvIdentifier = `${projectName}${appId}${envName}`;
        this.projectIdentifier = `${projectName}${appId}`;
        return this.projectEnvIdentifier;
      } catch (e) {
        return undefined;
      }
    }

    /**
     * Singleton instance builder
     */
    static get instance() : CLIFlowReport {
      if (!CLIFlowReport._instance) {
        CLIFlowReport._instance = new CLIFlowReport();
      }
      return CLIFlowReport._instance;
    }

    /**
     * Set the CLI input args
     * @param input - first arguments provided in the CLI flow
     */
    setInput(input: Input):void {
      this.input = input;
      this.runtime = input.argv[0] as string;
      this.executable = input.argv[1] as string;
      this.cmd = input.argv[2] as string;
      this.subCmd = (input.argv[3]) ? input.argv[3] : undefined;
      this.optionFlow = []; // key-value store with ordering maintained
      // Parse options
      if (input.options) {
        this.pushFlow(input.options);
      }
    }

    /**
     * Set the Amplify CLI version being used for this flow
     */
    setVersion(version: string):void {
      this.version = version;
    }

    /**
     * Returns JSON version of this object
     *
     * @returns JSON version of the object
     */
    getFlowReport(): IFlowReport {
      const result : IFlowReport = {
        runtime: this.runtime,
        executable: this.executable,
        version: this.version,
        cmd: this.cmd,
        subCmd: this.subCmd,
        optionFlow: this.optionFlow,
        category: this.category,
        input: this.input,
        timestamp: this.timestamp,
      };
      return result;
    }

    /**
     * This method is called whenever user selects an option in the CLI walkthrough
     * @param selectedOption - walkthrough options selected
     */
    pushFlow(selectedOption: Record<string, $TSAny>):void {
      this.optionFlow.push(selectedOption);
    }

    /**
     * Log input data to the local file system
     */
    logInput(): void {
      this.logger.logInfo({
        message: `amplify ${this.input.command ? this.input.command : ''} \
      ${this.input.plugin ? this.input.plugin : ''} \
      ${this.input.subCommands ? this.input.subCommands.join(' ') : ''} \
      ${this.input.options ? Redactor(JSONUtilities.stringify(this.input.options, { minify: true })) : ''}`,
      });
    }

  // TBD function to stream the input to a local file
  // TBD function to save to a file
}
