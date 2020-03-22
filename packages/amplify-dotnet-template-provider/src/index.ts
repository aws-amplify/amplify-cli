import { FunctionTemplateContributorFactory } from 'amplify-function-plugin-interface';

import { provideHelloWorld } from './providers/helloWorldProvider';
import { provideCrud } from './providers/crudProvider';
import { provideServerless } from './providers/serverlessProvider';
import { provideTrigger } from './providers/triggerProvider';

export const functionTemplateContributorFactory: FunctionTemplateContributorFactory = context => {
  return {
    contribute: request => {
      switch (request.selection) {
        case 'helloworld': {
          return provideHelloWorld(request);
        }
        case 'crud': {
          return provideCrud(request, context);
        }
        case 'serverless': {
          return provideServerless(request);
        }
        case 'trigger': {
          return provideTrigger(request, context);
        }
        default: {
          throw new Error(`Unknown template selection [${request.selection}]`);
        }
      }
    },
  };
};
