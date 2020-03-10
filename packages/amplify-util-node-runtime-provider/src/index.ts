import {FunctionParameters, CreateableListOption} from 'amplify-function-plugin-interface'
export function getOptions(context: any, params: FunctionParameters): CreateableListOption[] {
  if (canProvideTemplates(params)) {
    return [
      {
        name: 'NodeJS 10.x',
        create: () => Promise.resolve({
          runtime: {
            name: 'nodejs10.x',
            defaultHandler: 'index.handle'
          }
        }),
      }
    ];
  }
  return [];
}

function canProvideTemplates(params: FunctionParameters): boolean {
  return params.providerContext!.provider === 'awscloudformation' &&
    params.providerContext!.service === 'Lambda'
}