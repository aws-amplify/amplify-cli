import { ICommandInput } from './amplify-cli-interactions';

export interface IOptionFlowHeadlessData {
  input: string;
  timestamp: number;
}
export interface IOptionFlowCLIData {
  prompt: string;
  input: unknown;
  timestamp: number;
}

export type TypeOptionFlowData = IOptionFlowHeadlessData | IOptionFlowCLIData;

/**
 * Flow Report data logged by the CLI walk-through.
 */
export interface IFlowReport {
  version: string;
  runtime: string;
  executable: string;
  category: string;
  isHeadless: boolean;
  cmd: string;
  subCmd: string | undefined;
  optionFlowData: Array<TypeOptionFlowData>; //IOptionFlowHeadlessData | IOptionFlowCLIData
  input: ICommandInput;
  timestamp: string;
  projectEnvIdentifier?: string; // hash(ProjectName + Amplify AppId + EnvName)
  projectIdentifier?: string; // hash( ProjectName + Amplify App Id)
}

/**
 * CLI walk-through and headless flow data
 */
export interface IFlowData {
  setIsHeadless: (headless: boolean) => void;
  pushHeadlessFlow: (headlessFlowDataString: string, input: ICommandInput) => void;
  pushInteractiveFlow: (prompt: string, input: unknown) => void;
  getFlowReport: () => IFlowReport | Record<string, never>;
  assignProjectIdentifier: (envName?: string) => string | undefined;
}
