import { $TSAny, $TSContext } from 'amplify-cli-core';
import { FunctionParameters } from 'amplify-function-plugin-interface';
import { LayerParameters } from './awscloudformation/utils/layerParams';

export interface SupportedServices {
  Lambda: ServiceConfig<FunctionParameters>;
  LambdaLayer: ServiceConfig<LayerParameters>;
}

export interface ServiceConfig<T> {
  alias: string;
  walkthroughs: WalkthroughProvider<T>;
  cfnFilename?: string;
  provider: string;
  providerController: $TSAny;
}

export interface WalkthroughProvider<T> {
  createWalkthrough: (context: $TSContext, params: Partial<T>) => Promise<Partial<T>>;
  updateWalkthrough: (context: $TSContext, resourceToUpdate?: string, params?: Partial<T>) => Promise<Partial<T>>;
  migrate?: Function;
  getIAMPolicies?: Function;
  askExecRolePermissionsQuestions?: Function;
}
