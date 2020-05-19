import { FunctionParameters } from 'amplify-function-plugin-interface';

export type SupportedServices = Record<Service, ServiceConfig>;

export enum Service {
  LambdaFunction = 'LambdaFunction',
  LambdaLayer = 'LambdaLayer',
}

export interface ServiceConfig {
  alias: string;
  walkthroughs: WalkthroughProvider;
  cfnFilename: string;
  provider: string;
  providerController: any;
}

export type WalkthroughProvider = FunctionWalkthroughProvider | LayerWalkthroughProvider;

export interface FunctionWalkthroughProvider {
  createWalkthrough: (context: any, params: Partial<FunctionParameters>) => Promise<Partial<FunctionParameters>>;
  updateWalkthrough: Function;
  migrate?: Function;
  getIAMPolicies: Function;
  askExecRolePermissionsQuestions: Function;
}

export interface LayerWalkthroughProvider {
  createWalkthrough: Function;
  updateWalkthrough: Function;
}
