import { FunctionTemplateContributorFactory } from 'amplify-function-plugin-interface';

import { provideHelloWorld } from './providers/helloWorldProvider';
import { provideCrud } from './providers/crudProvider';
import { provideServerless } from './providers/serverlessProvider';
import { provideTrigger } from './providers/triggerProvider';

export const functionTemplateContributorFactory: FunctionTemplateContributorFactory = context => {
  return {
    contribute: request => {
      switch (request.selection) {
        case 'hello-world': {
          return provideHelloWorld();
        }
        case 'crud': {
          return provideCrud(context);
        }
        case 'serverless': {
          return provideServerless();
        }
        case 'trigger': {
          return provideTrigger(context);
        }
        default: {
          throw new Error(`Unknown template selection [${request.selection}]`);
        }
      }
    },
  };
};
