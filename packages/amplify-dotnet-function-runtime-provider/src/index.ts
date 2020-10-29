import { FunctionRuntimeContributorFactory } from 'amplify-function-plugin-interface';
import { dotnetcore31 } from './constants';
import { detectDotNetCore } from './utils/detect';
import { build } from './utils/build';
import { packageAssemblies } from './utils/package';
import { invoke } from './utils/invoke';

export const functionRuntimeContributorFactory: FunctionRuntimeContributorFactory = (context: any) => {
  return {
    checkDependencies: detectDotNetCore,
    contribute: async contributionRequest => {
      switch (contributionRequest.selection) {
        case dotnetcore31:
          return {
            runtime: {
              name: '.NET Core 3.1',
              value: dotnetcore31,
              cloudTemplateValue: dotnetcore31,
              defaultHandler: `${contributionRequest.contributionContext.resourceName}::${contributionRequest.contributionContext.resourceName}.${contributionRequest.contributionContext.functionName}::LambdaHandler`,
              layerExecutablePath: dotnetcore31,
            },
          };
        default:
          throw new Error(`Unknown selection ${contributionRequest.selection}`);
      }
    },
    package: async request => packageAssemblies(request, context),
    build: build,
    invoke: invoke,
  };
};
