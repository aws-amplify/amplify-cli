/* eslint-disable @typescript-eslint/no-empty-function */
import { $TSAny } from 'amplify-cli-core';
import { IFlowData, IFlowReport, IOptionFlowCLIData, IOptionFlowHeadlessData } from 'amplify-cli-shared-interfaces';

/**
 * No-Op class for flow data logging
 */
export class CLINoFlowReport implements IFlowData {
    private static _instance: CLINoFlowReport = new CLINoFlowReport();
    pushInteractiveFlow: (prompt: string, input: unknown) => void = _ => _ ;
    getFlowReport: () => IFlowReport | Record<string, never> = () => ({});
    assignProjectIdentifier: ()=>string|undefined = () => undefined;
    setIsHeadless: (isHeadless: boolean)=>void = _=>_; 
    pushHeadlessFlow: (headlessFlowDataString: string) => void = _ => _ ;
    /**
     * No-op instance of the CLINoFlowReport class
     */
    static get instance() : CLINoFlowReport {
      if (!CLINoFlowReport._instance) {
        CLINoFlowReport._instance = new CLINoFlowReport();
      }
      return CLINoFlowReport._instance;
    }
}
