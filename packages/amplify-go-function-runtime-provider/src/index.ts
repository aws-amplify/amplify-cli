import { FunctionRuntimeContributorFactory } from 'amplify-function-plugin-interface';
import { checkDependencies, packageResource, buildResource } from './runtime';
import { localInvoke } from './localinvoke';

export const functionRuntimeContributorFactory: FunctionRuntimeContributorFactory = context => {
  return {
    contribute: request => {
      if (request.selection !== 'go') {
        return Promise.reject(new Error(`Unknown selection ${request.selection}`));
      }
      return Promise.resolve({
        runtime: {
          name: 'Go 1.x',
          value: 'go1.x',
          cloudTemplateValue: 'go1.x',
          defaultHandler: 'main',
          layerExecutablePath: 'go1.x',
        },
      });
    },
    checkDependencies: runtimeValue => checkDependencies(runtimeValue),
    package: request => packageResource(request, context),
    build: request => buildResource(request, context),
    invoke: request => localInvoke(request, context),
  };
};
