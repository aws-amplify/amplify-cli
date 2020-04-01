import { FunctionRuntimeContributorFactory } from 'amplify-function-plugin-interface';
import { buildResource } from './utils/build';
import { packageResource } from './utils/package';
import { checkJava,checkJavaCompiler,checkGradle} from './utils/detect';
import { invokeResource } from './utils/invoke';
import {constants} from './utils/constants';
import { CheckDependenciesResult } from 'amplify-function-plugin-interface/src';


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
          cloudTemplateValue: 'java11',
          defaultHandler: 'example.LambdaRequestHandler::handleRequest',
        },
      });
    },
    checkDependencies: async () => {
      var result: CheckDependenciesResult = {
        hasRequiredDependencies: true,
      };
      try{
        await checkJava();
        await checkJavaCompiler();
        await checkGradle();
      }catch(err){
        result.errorMessage = err;
        result.hasRequiredDependencies = false;
      }
      return result;
    },
    package: params => packageResource(params, context),
    build: params => buildResource(params),
    invoke: params => invokeResource(params,context),
  };
};
