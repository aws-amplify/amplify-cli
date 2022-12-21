import { FunctionRuntimeContributorFactory } from 'amplify-function-plugin-interface';
import { dotnet6 } from './constants';
import { detectDotNet } from './utils/detect';
import { build } from './utils/build';
import { packageAssemblies } from './utils/package';
import { invoke } from './utils/invoke';

export const functionRuntimeContributorFactory: FunctionRuntimeContributorFactory = (context: any) => {
  return {
    checkDependencies: detectDotNet,
    contribute: async contributionRequest => {
      switch (contributionRequest.selection) {
        case dotnet6:
          return {
            runtime: {
              name: '.NET 6',
              value: dotnet6,
              cloudTemplateValue: dotnet6,
              defaultHandler: `${contributionRequest.contributionContext.resourceName}::${contributionRequest.contributionContext.resourceName}.${contributionRequest.contributionContext.functionName}::LambdaHandler`,
              layerExecutablePath: dotnet6,
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
