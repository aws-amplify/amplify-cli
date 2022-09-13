import { FunctionTemplateContributorFactory } from 'amplify-function-plugin-interface';

import { provideHelloWorld } from './providers/helloWorldProvider';
import { graphqlRequestProvider } from './providers/graphqlRequestProvider';

export const functionTemplateContributorFactory: FunctionTemplateContributorFactory = context => {
  return {
    contribute: request => {
      const selection = request.selection;
      switch (selection) {
        case 'hello-world': {
          return provideHelloWorld(request);
        }
        case 'appsync-request': {
          return graphqlRequestProvider(context);
        }
        default: {
          throw new Error(`Unknown template selection [${selection}]`);
        }
      }
    },
  };
};
