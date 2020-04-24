import { migrate, createWalkthrough, updateWalkthrough } from './awscloudformation/service-walkthroughs/lambda-walkthrough';
import * as lambdaFunctionController from './awscloudformation';
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
    cfnFilename: `${__dirname}/../../resources/awscloudformation/cloudformation-templates/lambda-cloudformation-template.json.ejs`,
    provider: 'awscloudformation',
    providerController: lambdaFunctionController,
  },
  LambdaLayer: {
    walkthroughs: {
      createWalkthrough: createWalkthrough,
      updateWalkthrough: updateWalkthrough,
    },
    cfnFilename: `${__dirname}/../../resources/awscloudformation/cloudformation-templates/layer-cloudformation-template.json.ejs`,
    provider: 'awscloudformation',
    providerController: null,
  },
};
