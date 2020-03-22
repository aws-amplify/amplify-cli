import { FunctionRuntimeContributorFactory } from 'amplify-function-plugin-interface';
const constants = {
  dotnetcore21: 'dotnetcore2.1',
  dotnetcore31: 'dotnetcore3.1',
};
export const functionRuntimeContributorFactory: FunctionRuntimeContributorFactory = (context: any) => {
  return {
    checkDependencies: async () => ({
      hasRequiredDependencies: true,
    }),
    contribute: async contributionRequest => {
      switch (contributionRequest.selection) {
        case constants.dotnetcore21:
          return {
            runtime: {
              name: '.NET Core 2.1',
              value: constants.dotnetcore21,
              cloudTemplateValue: constants.dotnetcore21,
              defaultHandler: `${contributionRequest.contributionContext.resourceName}::${contributionRequest.contributionContext.functionName}.Function::FunctionHandler`,
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
    package: async request => {
      throw new Error('not yet implemented');
    },
    build: request => {
      throw new Error('not yet implemented');
    },
    invoke: async request => {
      throw new Error('not yet implemented');
    },
  };
};
