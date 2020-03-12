import {FunctionRuntimeContributorFactory} from 'amplify-function-plugin-interface'
export const functionRuntimeContributorFactory: FunctionRuntimeContributorFactory = context => {
  context.amplify
  return {
    contribute: selection => {
      if (selection !== 'nodejs') {
        return Promise.reject(new Error(`Unknown selection ${selection}`));
      }
      return Promise.resolve({
        runtime: {
          name: 'NodeJS',
          value: 'nodejs',
          cloudTemplateValue: 'nodejs12.x',
          defaultHandler: 'index.handler'
        }
      })
    },
    package: params => {
      throw new Error('not yet implemented');
    },
    build: params => {
      throw new Error('not yet implemented');
    },
    invoke: params => {
      throw new Error('not yet implemented');
    }
  }
}