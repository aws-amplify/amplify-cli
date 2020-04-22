import { FunctionRuntimeContributorFactory } from 'amplify-function-plugin-interface';
import { pythonBuild } from './util/buildUtils';
import { pythonPackage } from './util/packageUtils';
import { pythonInvoke } from './util/invokeUtil';
import { checkDeps } from './util/depUtils';

export const functionRuntimeContributorFactory: FunctionRuntimeContributorFactory = context => {
  return {
    contribute: request => {
      const selection = request.selection;
      if (selection !== 'python') {
        return Promise.reject(new Error(`Unknown selection ${selection}`));
      }
      return Promise.resolve({
        runtime: {
          name: 'Python',
          value: 'python',
          cloudTemplateValue: 'python3.8',
          defaultHandler: 'index.handler',
        },
      });
    },
    checkDependencies: checkDeps,
    package: request => pythonPackage(context, request),
    build: pythonBuild,
    invoke: request => pythonBuild(request).then(() => pythonInvoke(context, request)),
  };
};
