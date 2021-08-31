import { AppSyncSimulatorDirectiveBase } from './directive-base';

export class AwsSubscribe extends AppSyncSimulatorDirectiveBase {
  static typeDefinitions: string = 'directive @aws_subscribe(mutations: [String!]) on FIELD_DEFINITION';
  name: string = 'aws_subscribe';
}
