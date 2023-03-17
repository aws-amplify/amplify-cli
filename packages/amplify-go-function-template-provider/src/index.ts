import { FunctionTemplateContributorFactory } from '@aws-amplify/amplify-function-plugin-interface';

import { provideHelloWorld } from './providers/helloWorldProvider';

export const functionTemplateContributorFactory: FunctionTemplateContributorFactory = () => {
  return {
    contribute: (request) => {
      switch (request.selection) {
        case 'hello-world': {
          return provideHelloWorld();
        }
        default: {
          throw new Error(`Unknown template selection [${request.selection}]`);
        }
      }
    },
  };
};
