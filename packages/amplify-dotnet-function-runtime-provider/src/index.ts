import { FunctionRuntimeContributorFactory } from '@aws-amplify/amplify-function-plugin-interface';
import { dotnet8 } from './constants';
import { detectDotNet } from './utils/detect';
import { build } from './utils/build';
import { packageAssemblies } from './utils/package';
import { invoke } from './utils/invoke';

export const functionRuntimeContributorFactory: FunctionRuntimeContributorFactory = (context: any) => {
  return {
    checkDependencies: detectDotNet,
    contribute: async (contributionRequest) => {
      switch (contributionRequest.selection) {
        case dotnet8:
          return {
            runtime: {
              name: '.NET 8',
              value: dotnet8,
              cloudTemplateValue: dotnet8,
              defaultHandler: `${contributionRequest.contributionContext.resourceName}::${contributionRequest.contributionContext.resourceName}.${contributionRequest.contributionContext.functionName}::LambdaHandler`,
              layerExecutablePath: dotnet8,
            },
          };
        default:
          throw new Error(`Unknown selection ${contributionRequest.selection}`);
      }
    },
    package: async (request) => packageAssemblies(request, context),
    build: build,
    invoke: invoke,
  };
};
