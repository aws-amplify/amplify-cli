import { FunctionRuntimeContributorFactory } from 'amplify-function-plugin-interface';
import { checkDependencies } from './utils/deps';
import { buildResource } from './utils/build';
import { packageResource } from './utils/package';

export const functionRuntimeContributorFactory: FunctionRuntimeContributorFactory = context => {
  return {
    contribute: async request => {
      if (request.selection !== 'swift') {
        throw new Error(`Unknown selection ${request.selection}`);
      }
      return {
        runtime: {
          name: 'Swift',
          value: 'swift',
          cloudTemplateValue: 'provided',
          defaultHandler: 'index.handler', // Stubbed. Not sure if this is correct?
        },
      };
    },
    checkDependencies: async runtimeValue => checkDependencies(runtimeValue),
    package: async request => packageResource(request, context),
    build: async request => buildResource(request, context),
    invoke: async request => ({}), // Stubbed.
  };
};
