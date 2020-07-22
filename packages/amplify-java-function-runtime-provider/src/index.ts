import { FunctionRuntimeContributorFactory } from 'amplify-function-plugin-interface';
import { buildResource } from './utils/build';
import { packageResource } from './utils/package';
import { checkJava, checkJavaCompiler, checkGradle } from './utils/detect';
import { invokeResource } from './utils/invoke';
import { CheckDependenciesResult } from 'amplify-function-plugin-interface/src';
import path from 'path';

export const functionRuntimeContributorFactory: FunctionRuntimeContributorFactory = context => {
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
          cloudTemplateValue: 'java11',
          defaultHandler: 'example.LambdaRequestHandler::handleRequest',
          layerExecutablePath: path.join('java', 'lib'),
        },
      });
    },

    checkDependencies: async () => {
      var result: CheckDependenciesResult = {
        hasRequiredDependencies: true,
      };

      const resultJava: CheckDependenciesResult = await checkJava();
      const resultCompileJava: CheckDependenciesResult = await checkJavaCompiler();
      const resultGradle: CheckDependenciesResult = await checkGradle();

      const errArray: Array<string> = [];

      if (resultJava.errorMessage !== undefined) {
        errArray.push(resultJava.errorMessage);
      }

      if (resultCompileJava.errorMessage !== undefined) {
        errArray.push(resultCompileJava.errorMessage);
      }

      if (resultGradle.errorMessage !== undefined) {
        errArray.push(resultGradle.errorMessage);
      }

      result.hasRequiredDependencies =
        resultJava.hasRequiredDependencies && resultCompileJava.hasRequiredDependencies && resultGradle.hasRequiredDependencies;

      if (result.hasRequiredDependencies === false) {
        result.errorMessage = errArray.join('\n');
      }

      return result;
    },
    package: params => packageResource(params, context),
    build: params => buildResource(params),
    invoke: params => invokeResource(params, context),
  };
};
