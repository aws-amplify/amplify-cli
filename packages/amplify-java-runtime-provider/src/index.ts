import { FunctionRuntimeContributorFactory } from 'amplify-function-plugin-interface';
export const functionRuntimeContributorFactory: FunctionRuntimeContributorFactory = context => {
  context.amplify;
  return {
    contribute: selection => {
      if (selection !== 'java') {
        return Promise.reject(new Error(`Unknown selection ${selection}`));
      }
      return Promise.resolve({
        runtime: {
          name: 'Java',
          value: 'java',
          cloudTemplateValue: 'java8',
          defaultHandler: 'example.HelloPojo',
        },
      });
    },
    package: params => {
      throw new Error('not yet implemented');
    },
    build: params => {
      throw new Error('not yet implemented');
    },
    invoke: params => {
      throw new Error('not yet implemented');
    },
  };
};