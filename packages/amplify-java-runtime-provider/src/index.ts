import { FunctionRuntimeContributorFactory } from 'amplify-function-plugin-interface';
import { buildResource } from './utils/build';
import { packageResource } from './utils/package';
import { checkDependencies } from './utils/detect';
import { invokeResource } from './utils/invoke';
export const functionRuntimeContributorFactory: FunctionRuntimeContributorFactory = context => {
  context.amplify;
  return {
    contribute: request => {
      const selection = request.selection;
      if (selection !== 'java') {
        return Promise.reject(new Error(`Unknown selection ${selection}`));
      }
      return Promise.resolve({
        runtime: {
          name: 'Java',
          value: 'java',
          cloudTemplateValue: 'java8',
          defaultHandler: 'example.HelloPojo::handleRequest',
        },
      });
    },
    checkDependencies: params => checkDependencies(params),
    package: params => packageResource(params, context),
    build: params => buildResource(params),
    invoke: params => {
      return invokeResource(params,context);
    },
  };
};
