import { ICommandInput } from './amplify-cli-interactions';

/**
 * Flow Report data logged by the CLI walk-through.
 */
export interface IFlowReport {
  version : string,
  runtime : string,
  executable : string,
  category : string,
  cmd : string,
  subCmd: string| undefined,
  optionFlow : Array<Record<string, unknown>>,
  input : ICommandInput,
  timestamp : string,
  projectEnvIdentifier? : string, // hash(ProjectName + Amplify AppId + EnvName)
  projectIdentifier?: string, // hash( ProjectName + Amplify App Id)
}

/**
 * CLI walk-through and headless flow data
 */
export interface IFlowData {
  pushFlow: (flowData: Record<string, unknown>) => void,
  getFlowReport: ()=>IFlowReport | Record<string, never>
}
