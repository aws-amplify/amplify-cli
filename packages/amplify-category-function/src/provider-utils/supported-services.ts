import * as lambdaWalkthroughs from './awscloudformation/service-walkthroughs/lambda-walkthrough';
import * as lambdaController from './awscloudformation';
import { SupportedServices } from './supportedServicesType';
import { getIAMPolicies } from './awscloudformation/utils/cloudformationHelpers';
import { askExecRolePermissionsQuestions } from './awscloudformation/service-walkthroughs/execPermissionsWalkthrough';

export const SUPPORTED_SERVICES: SupportedServices = {
  Lambda: {
    walkthroughs: {
      createWalkthrough: lambdaWalkthroughs.createWalkthrough,
      updateWalkthrough: lambdaWalkthroughs.updateWalkthrough,
      migrate: lambdaWalkthroughs.migrate,
      getIAMPolicies: getIAMPolicies,
      askExecRolePermissionsQuestions: askExecRolePermissionsQuestions
    },
    cfnFilename: `${__dirname}/../../resources/awscloudformation/cloudformation-templates/lambda-cloudformation-template.json.ejs`,
    provider: 'awscloudformation',
    providerController: lambdaController,
  },
};
