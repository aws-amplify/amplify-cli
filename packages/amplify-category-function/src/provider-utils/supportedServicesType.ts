import { FunctionParameters } from 'amplify-function-plugin-interface';
import { LayerParameters } from './awscloudformation/utils/layerParams';

export interface SupportedServices {
  LambdaFunction: ServiceConfig<FunctionParameters>;
  LambdaLayer: ServiceConfig<LayerParameters>;
}

export interface ServiceConfig<T> {
  alias: string;
  walkthroughs: WalkthroughProvider<T>;
  cfnFilename?: string;
  provider: string;
  providerController: any;
}

export interface WalkthroughProvider<T> {
  createWalkthrough: (context: any, params: Partial<T>) => Promise<Partial<T>>;
  updateWalkthrough: (context: any, resourceToUpdate?: string) => Promise<Partial<T>>;
  migrate?: Function;
  getIAMPolicies?: Function;
  askExecRolePermissionsQuestions?: Function;
}
