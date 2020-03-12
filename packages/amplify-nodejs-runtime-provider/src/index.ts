import {FunctionRuntimeContributorFactory} from 'amplify-function-plugin-interface'
export const functionRuntimeContributorFactory: FunctionRuntimeContributorFactory = context => {
  return {
    contribute: selection => {
      if (selection !== 'nodejs') {
        return Promise.reject(new Error(`Unknown selection ${selection}`));
      }
      return Promise.resolve({
        runtime: {
          name: 'nodejs',
          value: 'nodejs12.x',
          defaultHandler: 'index.handle'
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