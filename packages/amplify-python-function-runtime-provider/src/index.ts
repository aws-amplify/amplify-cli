import { FunctionRuntimeContributorFactory } from 'amplify-function-plugin-interface';
import { pythonBuild } from './util/buildUtils';
import { pythonPackage } from './util/packageUtils';
import { pythonInvoke } from './util/invokeUtil';
import { checkDeps } from './util/depUtils';
import path from 'path';
import { relativeShimPath } from './constants';
import { GetPackageAssetPaths } from 'amplify-cli-core';

export const functionRuntimeContributorFactory: FunctionRuntimeContributorFactory = context => {
  return {
    contribute: async request => {
      const selection = request.selection;
      if (selection !== 'python') {
        throw new Error(`Unknown selection ${selection}`);
      }
      return {
        runtime: {
          name: 'Python',
          value: 'python',
          cloudTemplateValue: 'python3.8',
          defaultHandler: 'index.handler',
          layerExecutablePath: path.join('python', 'lib', 'python3.8', 'site-packages'),
        },
      };
    },
    checkDependencies: checkDeps,
    package: request => pythonPackage(context, request),
    build: pythonBuild,
    invoke: request => pythonInvoke(context, request),
  };
};

export const getPackageAssetPaths: GetPackageAssetPaths = async () => [relativeShimPath];
