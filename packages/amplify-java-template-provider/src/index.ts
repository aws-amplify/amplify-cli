import { FunctionTemplateContributorFactory } from 'amplify-function-plugin-interface';

import { provideHelloWorld } from './providers/helloWorldProvider';

export const functionTemplateContributorFactory: FunctionTemplateContributorFactory = context => {
  return {
    contribute: selection => {
      switch (selection) {
        case 'helloworld': {
          return provideHelloWorld();
        }
        default: {
          throw new Error(`Unknown template selection [${selection}]`);
        }
      }
    },
  };
};