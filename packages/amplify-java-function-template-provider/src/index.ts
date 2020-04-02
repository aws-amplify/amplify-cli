import { FunctionTemplateContributorFactory } from 'amplify-function-plugin-interface';

import { provideHelloWorld } from './providers/helloWorldProvider';

export const functionTemplateContributorFactory: FunctionTemplateContributorFactory = context => {
  return {
    contribute: request => {
      const selection = request.selection;
      switch (selection) {
        case 'hello-world': {
          return provideHelloWorld(request);
        }
        default: {
          throw new Error(`Unknown template selection [${selection}]`);
        }
      }
    },
  };
};
