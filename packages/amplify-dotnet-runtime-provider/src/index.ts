import { FunctionRuntimeContributorFactory } from 'amplify-function-plugin-interface';
import { constants } from './constants';
import { detectDotNetCore } from './utils/detect';
import { build } from './utils/build';
import { packageAssemblies } from './utils/package';

export const functionRuntimeContributorFactory: FunctionRuntimeContributorFactory = (context: any) => {
  return {
    checkDependencies: async () => ({
      hasRequiredDependencies: await detectDotNetCore(),
    }),
    contribute: async contributionRequest => {
      switch (contributionRequest.selection) {
        case constants.dotnetcore21:
          return {
            runtime: {
              name: '.NET Core 2.1',
              value: constants.dotnetcore21,
              cloudTemplateValue: constants.dotnetcore21,
              defaultHandler: `${contributionRequest.contributionContext.resourceName}::${contributionRequest.contributionContext.resourceName}.${contributionRequest.contributionContext.functionName}::${constants.handlerMethodName}`,
            },
          };
        case constants.dotnetcore31:
          return {
            runtime: {
              name: '.NET Core 3.1',
              value: constants.dotnetcore31,
              cloudTemplateValue: constants.dotnetcore31,
              defaultHandler: `${contributionRequest.contributionContext.resourceName}::${contributionRequest.contributionContext.functionName}.Function::FunctionHandler`,
            },
          };
        default:
          throw new Error(`Unknown selection ${contributionRequest.selection}`);
      }
    },
    package: async request => packageAssemblies(request, context),
    build: build,
    invoke: async request => {
      throw new Error('not yet implemented');
    },
  };
};
