import { SchemaDirectiveVisitor } from 'graphql-tools';
import { AmplifyAppSyncSimulator } from '../..';

export default abstract class AppSyncSimulatorDirectiveBase extends SchemaDirectiveVisitor {
  name: string;
  static typeDefinitions: string;
  static simulatorContext: AmplifyAppSyncSimulator;
}
