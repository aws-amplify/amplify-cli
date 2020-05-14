import { migrate, createWalkthrough, updateWalkthrough } from './awscloudformation/service-walkthroughs/lambda-walkthrough';
import { createLayerWalkthrough } from './awscloudformation/service-walkthroughs/lambdaLayerWalkthrough';
import * as lambdaController from './awscloudformation';
import { SupportedServices } from './supportedServicesType';
import { getIAMPolicies } from './awscloudformation/utils/cloudformationHelpers';
import { askExecRolePermissionsQuestions } from './awscloudformation/service-walkthroughs/execPermissionsWalkthrough';

export const supportedServices: SupportedServices = {
  LambdaFunction: {
    walkthroughs: {
      createWalkthrough: createWalkthrough,
      updateWalkthrough: updateWalkthrough,
      migrate: migrate,
      getIAMPolicies: getIAMPolicies,
      askExecRolePermissionsQuestions: askExecRolePermissionsQuestions,
    },
    cfnFilename: `${__dirname}/../../resources/awscloudformation/cloudformation-templates/lambda-function-cloudformation-template.json.ejs`,
    provider: 'awscloudformation',
    providerController: lambdaController,
  },
  LambdaLayer: {
    walkthroughs: {
      createWalkthrough: createLayerWalkthrough,
      updateWalkthrough: null,
    },
    cfnFilename: null,
    provider: 'awscloudformation',
    providerController: lambdaController,
  },
};
