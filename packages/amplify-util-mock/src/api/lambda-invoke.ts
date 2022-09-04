import { $TSAny, $TSContext } from "amplify-cli-core";
import { loadLambdaConfig } from '../utils/lambda/load-lambda-config';
import { BuildType } from 'amplify-function-plugin-interface';
import { getInvoker, getBuilder } from 'amplify-category-function';
import { timeConstrainedInvoker } from '../func';
import { printer } from 'amplify-prompts';

/**
 * Utility method to invoke the lambda function locally. 
 * Ensures latest function changes are built before invoking it.
 * @param context The CLI context
 * @param functionName Lambda function to invoke locally
 * @param data Data to be passed to the local lambda function invocation.
 */
export const invokeLambda = async (context: $TSContext, functionName: string, data: $TSAny): Promise<void> => {
    const lambdaConfig = await loadLambdaConfig(context, functionName, true);
      if (!lambdaConfig?.handler) {
        throw new Error(`Could not parse handler for ${functionName} from cloudformation file`);
      }
      // Ensuring latest function changes are built
      await getBuilder(context, functionName, BuildType.DEV)();
      const invoker = await getInvoker(context, { resourceName: functionName, handler: lambdaConfig.handler, envVars: lambdaConfig.environment });
      printer.info('Starting execution...');
      try {
        const result = await timeConstrainedInvoker(invoker({ event: data }), context?.input?.options);
        const stringResult = stringifyResult(result);
        printer.success('Result:');
        printer.info(stringResult);
      } catch (err) {
        printer.error(`${functionName} failed with the following error:`);
        printer.info(err);
      } finally {
        printer.info('Finished execution.');
      }
}

const stringifyResult = (result: $TSAny) => {
  return typeof result === 'object' ? JSON.stringify(result, undefined, 2) : typeof result === 'undefined' ? '' : result;
}