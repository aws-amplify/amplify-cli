import { AmplifyAppSyncSimulatorDataLoader } from '..';

export class NoneDataLoader implements AmplifyAppSyncSimulatorDataLoader {
  load(request): any {
    return request.payload || null;
  }
}
