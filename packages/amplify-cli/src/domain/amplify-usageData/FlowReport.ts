/* eslint-disable spellcheck/spell-checker */
import { $TSAny, JSONUtilities, stateManager } from 'amplify-cli-core';
import { logger, Redactor } from 'amplify-cli-logger';
import { IAmplifyLogger } from 'amplify-cli-logger/lib/IAmplifyLogger';
import { IFlowData, IFlowReport, IOptionFlowCLIData, IOptionFlowHeadlessData, TypeOptionFlowData } from 'amplify-cli-shared-interfaces';
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
    isHeadless!: boolean;
    cmd!: string;
    subCmd: string| undefined;
    optionFlowData!: Array<TypeOptionFlowData>;
    logger!: IAmplifyLogger;
    input!: Input;
    timestamp : string;
    projectEnvIdentifier? : string; // hash(ProjectName + Amplify AppId + EnvName)
    projectIdentifier?: string; // hash( ProjectName + Amplify App Id)
    envName?: string;

    private constructor() {
      const currentTime = Date.now();
      if (CLIFlowReport._instance) {
        throw new Error('Use CLIFlowReport.instance');
      }
      CLIFlowReport._instance = this;
      this.logger = logger;
      this.timestamp = currentTime.toString();
      this.isHeadless = false; //set headless to true if running in headless mode : TBD: can we query this from stateManager?
    }

    /**
     * Initialize the project identifier to be used during the flow
     */
    assignProjectIdentifier():undefined|string {
      try {
        const projectName = stateManager.getProjectName();
        const envName = stateManager.getCurrentEnvName();
        const appId = stateManager.getAppID();
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
      this.optionFlowData = []; // key-value store with ordering maintained
      // Parse options
      if (input.options?.prompt) {
        const prompt: string = input.options.prompt as unknown as string;
        this.pushInteractiveFlow(prompt, input.options.input);
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
    pushInteractiveFlow( prompt: string, input: unknown ): void {
      const redactedString = Redactor(JSON.stringify({prompt, input}));
      const cleanOption = JSON.parse(redactedString);
      const timeStampedCLIFlowOption:IOptionFlowCLIData = { ...cleanOption, timestamp: new Date().valueOf() }; // attach unix-style timestamp
      this.optionFlowData.push(timeStampedCLIFlowOption);
    }

    /**
     * This method is called whenever the CLI is invoked in headless mode
     * @param headlessParameterString - headless parameter string ( serialized but before schema validation )
     */
    pushHeadlessFlow(headlessParameterString: string): void {
      const cleanOption = Redactor(headlessParameterString);
      const timeStampedOption:IOptionFlowHeadlessData = { input: cleanOption, timestamp: new Date().valueOf() }; // attach unix-style timestamp
      this.optionFlowData.push(timeStampedOption);
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
}
