import { provideHelloWorld } from './providers/helloWorldProvider'
import { provideCrud } from './providers/crudProvider'
import { provideServerless } from './providers/serverlessProvider'
import { FunctionParameters, CreateableListOption } from 'amplify-function-plugin-interface';
import { provideTrigger } from './providers/triggerProvider';

export function getOptions(context: any, params: FunctionParameters): CreateableListOption[] {
  if (canProvideTemplates(params)) {
    return [
      {
        name: 'Hello World',
        create: () => provideHelloWorld(params),
      },
      {
        name: 'CRUD function for Amazon DynamoDB table (Integration with Amazon API Gateway and Amazon DynamoDB)',
        create: () => provideCrud(context, params),
      },
      {
        name: 'Serverless express function (Integration with Amazon API Gateway)',
        create: () => provideServerless(params),
      },
      {
        name: 'Lambda Trigger',
        create: () => provideTrigger(context, params)
      }
    ];
  }
  return [];
}

function canProvideTemplates(params: FunctionParameters): boolean {
  return params.providerContext!.provider === 'awscloudformation' &&
    params.providerContext!.service === 'Lambda' &&
    params.runtime!.name === 'nodejs10.x'
}