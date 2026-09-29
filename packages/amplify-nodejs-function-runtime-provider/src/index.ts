import { FunctionRuntimeContributorFactory } from '@aws-amplify/amplify-function-plugin-interface';
import { buildResource } from './utils/legacyBuild';
import { packageResource } from './utils/legacyPackage';
import { invoke } from './utils/invoke';
import path from 'path';

export const functionRuntimeContributorFactory: FunctionRuntimeContributorFactory = (context) => {
  return {
    contribute: async (request) => {
      const selection = request.selection;
      if (selection !== 'nodejs') {
        throw new Error(`Unknown selection ${selection}`);
      }
      return {
        runtime: {
          name: 'NodeJS',
          value: 'nodejs',
          cloudTemplateValue: 'nodejs22.x',
          defaultHandler: 'index.handler',
          layerExecutablePath: 'nodejs',
          layerDefaultFiles: [
            {
              path: 'nodejs',
              filename: 'package.json',
              content: JSON.stringify(
                {
                  // this really needs to be moved to a resource file
                  version: '1.0.0',
                  description: '',
                  main: 'index.js',
                  dependencies: {},
                  devDependencies: {},
                },
                undefined,
                2,
              ),
            },
          ],
        },
      };
    },
    checkDependencies: async () => ({ hasRequiredDependencies: true }),
    package: (params) => packageResource(params, context),
    build: buildResource,
    invoke: async (params) =>
      invoke({
        packageFolder: path.join(params.srcRoot, 'src'),
        handler: params.handler,
        event: params.event,
        environment: params.envVars,
      }),
  };
};
