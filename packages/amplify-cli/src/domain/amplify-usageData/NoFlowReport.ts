import { $TSAny } from 'amplify-cli-core';
import { IFlowData, IFlowReport } from 'amplify-cli-shared-interfaces';

/**
 * No-Op class for flow data logging
 */
export class CLINoFlowReport implements IFlowData {
    private static _instance: CLINoFlowReport = new CLINoFlowReport();
    pushFlow: (flowData: Record<string, $TSAny>) => void = _ => _ ;
    getFlowReport: () => IFlowReport | Record<string, never> = () => ({});
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
