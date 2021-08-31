import { AmplifyAppSyncSimulator } from '../..';

export abstract class AppSyncSimulatorDirectiveBase {
  name: string;
  static typeDefinitions: string;
  static simulatorContext: AmplifyAppSyncSimulator;
}
