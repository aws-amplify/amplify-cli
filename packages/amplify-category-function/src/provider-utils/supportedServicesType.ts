import { $TSAny, $TSContext } from 'amplify-cli-core';
import { FunctionParameters } from 'amplify-function-plugin-interface';
import { LayerParameters } from './awscloudformation/utils/layerParams';

export interface SupportedServices {
  Lambda: ServiceConfig<FunctionParameters>;
  LambdaLayer: ServiceConfig<LayerParameters>;
}

type Parameters<T extends FunctionParameters | LayerParameters> = T extends FunctionParameters ? FunctionParameters : LayerParameters;

export interface ServiceConfig<Parameters> {
  alias: string;
  walkthroughs: WalkthroughProvider<Parameters>;
  cfnFilename?: string;
  provider: string;
  providerController: $TSAny;
}

export interface WalkthroughProvider<Parameters> {
  createWalkthrough: (context: $TSContext, params: Partial<Parameters>) => Promise<Partial<Parameters>>;
  updateWalkthrough: (
    context: $TSContext,
    resourceToUpdate?: string,
    params?: Partial<Parameters>,
  ) => Promise<Partial<FunctionParameters>> | Promise<{ parameters: LayerParameters; resourceUpdated: boolean }>;
  migrate?: Function;
  getIAMPolicies?: Function;
  askExecRolePermissionsQuestions?: Function;
}
