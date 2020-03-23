import { FunctionTemplateContributorFactory } from 'amplify-function-plugin-interface';

import { provideHelloWorld } from './providers/helloWorldProvider';

export const functionTemplateContributorFactory: FunctionTemplateContributorFactory = context => {
  return {
    contribute: request => {
      switch (request.selection) {
        case 'helloworld': {
          return provideHelloWorld(request);
        }
        default: {
          throw new Error(`Unknown template selection [${request.selection}]`);
        }
      }
    },
  };
};
