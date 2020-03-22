import { FunctionRuntimeContributorFactory } from 'amplify-function-plugin-interface';
export const functionRuntimeContributorFactory: FunctionRuntimeContributorFactory = (context: any) => {
  return {
    checkDependencies: async () => ({
      hasRequiredDependencies: true,
    }),
    contribute: async contributionRequest => {
      switch (contributionRequest.selection) {
        case 'dotnet2.1':
          return {
            runtime: {
              name: '.NET Core 2.1',
              value: 'dotnet2.1',
              cloudTemplateValue: 'dotnetcore2.1',
              defaultHandler: `${contributionRequest.contributionContext.resourceName}::${contributionRequest.contributionContext.functionName}.Function::FunctionHandler`,
            },
          };
        case 'dotnet3.1':
          return {
            runtime: {
              name: '.NET Core 3.1',
              value: 'dotnet3.1',
              cloudTemplateValue: 'dotnetcore3.1',
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
