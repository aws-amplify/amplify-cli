import { FunctionParameters } from 'amplify-function-plugin-interface';

export type SupportedServices = Record<Service, ServiceConfig>;

export interface ServiceConfig {
  walkthroughs: WalkthroughProvider;
  cfnFilename: string;
  provider: string;
  providerController: any;
}

export enum Service {
  Lambda = 'Lambda',
}

export interface WalkthroughProvider {
  createWalkthrough: (context: any, params: Partial<FunctionParameters>) => Promise<Partial<FunctionParameters>>;
  updateWalkthrough: Function;
  migrate?: Function;
  getIAMPolicies: Function;
  askExecRolePermissionsQuestions: Function;
}
