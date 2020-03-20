import { FunctionRuntimeContributorFactory } from 'amplify-function-plugin-interface';
import { buildResource } from './utils/legacyBuild';
import { packageResource } from './utils/legacyPackage';
import { invoke } from './utils/invoke';
import path from 'path';

export const functionRuntimeContributorFactory: FunctionRuntimeContributorFactory = context => {
  return {
    contribute: request => {
      const selection = request.selection;
      if (selection !== 'nodejs') {
        return Promise.reject(new Error(`Unknown selection ${selection}`));
      }
      return Promise.resolve({
        runtime: {
          name: 'NodeJS',
          value: 'nodejs',
          cloudTemplateValue: 'nodejs12.x',
          defaultHandler: 'index.handler',
        },
      });
    },
    checkDependencies: () => Promise.resolve({ hasRequiredDependencies: true }),
    package: params => packageResource(params, context),
    build: params => buildResource(params),
    invoke: params =>
      invoke({
        packageFolder: path.join(params.srcRoot, 'src'),
        handler: params.handler,
        event: JSON.stringify(params.event),
        context: params.context,
        environment: params.env,
      }),
  };
};
