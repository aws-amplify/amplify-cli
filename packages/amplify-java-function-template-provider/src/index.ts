import { FunctionTemplateContributorFactory } from 'amplify-function-plugin-interface';

import { provideHelloWorld } from './providers/helloWorldProvider';
import { provideAppSyncTodo } from './providers/appSyncTodoProvider';

export const functionTemplateContributorFactory: FunctionTemplateContributorFactory = context => ({
  
    contribute: request => {
      const selection = request.selection;
      switch (selection) {
        case 'hello-world': {
          return provideHelloWorld(request);
        }
        case 'appsync-todo': {
        return provideAppSyncTodo();
      }
        default: {
          throw new Error(`Unknown template selection [${selection}]`);
        }
      }
    }
});
