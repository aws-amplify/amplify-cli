import { FunctionRuntimeContributorFactory, CheckDependenciesResult } from 'amplify-function-plugin-interface';
import { constants } from './constants';
import { detectDotNetCore } from './utils/detect';
import { build } from './utils/build';
import { packageAssemblies } from './utils/package';
import { invoke } from './utils/invoke';

export const functionRuntimeContributorFactory: FunctionRuntimeContributorFactory = (context: any) => {
  return {
    checkDependencies: async () => {
      const dotNetCorePresent = await detectDotNetCore();
      var result: CheckDependenciesResult = {
        hasRequiredDependencies: dotNetCorePresent,
      };
      if (!dotNetCorePresent) {
        result.errorMessage = `Unable to find dotnet version ${constants.currentSupportedVersion} on the path.`;
      }
      return result;
    },
    contribute: async contributionRequest => {
      switch (contributionRequest.selection) {
        case constants.dotnetcore31:
          return {
            runtime: {
              name: '.NET Core 3.1',
              value: constants.dotnetcore31,
              cloudTemplateValue: constants.dotnetcore31,
              defaultHandler: `${contributionRequest.contributionContext.resourceName}::${contributionRequest.contributionContext.resourceName}.${contributionRequest.contributionContext.functionName}::FunctionHandler`,
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
