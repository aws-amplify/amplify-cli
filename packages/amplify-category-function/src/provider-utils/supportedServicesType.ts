import { $TSAny, $TSContext } from 'amplify-cli-core';
import { FunctionParameters } from 'amplify-function-plugin-interface';
import { LayerParameters } from './awscloudformation/utils/layerParams';

export interface SupportedServices {
  Lambda: ServiceConfig<FunctionParameters>;
  LambdaLayer: ServiceConfig<LayerParameters>;
}

export interface ServiceConfig<Parameters> {
  alias: string;
  walkthroughs: Parameters extends FunctionParameters ? FunctionWalkthroughProvider : LayerWalkthroughProvider;
  cfnFilename?: string;
  provider: string;
  providerController: $TSAny;
}
export interface FunctionWalkthroughProvider {
  createWalkthrough: (context: $TSContext, params: Partial<FunctionParameters>) => Promise<Partial<FunctionParameters>>;
  updateWalkthrough: (
    context: $TSContext,
    resourceToUpdate?: string,
    params?: Partial<FunctionParameters>,
  ) => Promise<Partial<FunctionParameters>>;
  // eslint-disable-next-line @typescript-eslint/ban-types
  migrate?: Function;
  // eslint-disable-next-line @typescript-eslint/ban-types
  getIAMPolicies?: Function;
  // eslint-disable-next-line @typescript-eslint/ban-types
  askExecRolePermissionsQuestions?: Function;
}

export interface LayerWalkthroughProvider {
  createWalkthrough: (context: $TSContext, params: Partial<LayerParameters>) => Promise<Partial<LayerParameters>>;
  updateWalkthrough: (
    context: $TSContext,
    resourceToUpdate?: string,
    params?: Partial<LayerParameters>,
  ) => Promise<{ parameters: Partial<LayerParameters>; resourceUpdated: boolean }>;
}
