import { GetPackageAssetPaths } from '@aws-amplify/amplify-cli-core';
import { FunctionRuntimeContributorFactory } from '@aws-amplify/amplify-function-plugin-interface';
import * as fs from 'fs-extra';
import { layerPythonPipFile, relativeShimPath } from './constants';
import { pythonBuild } from './util/buildUtils';
import { pythonInvoke } from './util/invokeUtil';
import { checkDeps } from './util/depUtils';
import { pythonPackage } from './util/packageUtils';

export const functionRuntimeContributorFactory: FunctionRuntimeContributorFactory = (context) => {
  return {
    contribute: async (request) => {
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
          layerExecutablePath: 'python',
          layerDefaultFiles: [
            {
              path: 'python',
              filename: 'Pipfile',
              content: fs.readFileSync(layerPythonPipFile, 'utf-8'),
            },
          ],
        },
      };
    },
    checkDependencies: checkDeps,
    package: (request) => pythonPackage(context, request),
    build: pythonBuild,
    invoke: (request) => pythonInvoke(context, request),
  };
};

export const getPackageAssetPaths: GetPackageAssetPaths = async () => [relativeShimPath];
