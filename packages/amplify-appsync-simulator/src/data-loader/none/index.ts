import { AmplifyAppSyncSimulatorDataLoader } from '..';

export class NoneDataLoader implements AmplifyAppSyncSimulatorDataLoader {
  load(payload): any {
    return payload;
  }
}
