import { SchemaDirectiveVisitor } from 'graphql-tools';
import { AmplifyAppSyncSimulator } from '../..';

export abstract class AppSyncSimulatorDirectiveBase extends SchemaDirectiveVisitor {
  name: string;
  static typeDefinitions: string;
  static simulatorContext: AmplifyAppSyncSimulator;
}
