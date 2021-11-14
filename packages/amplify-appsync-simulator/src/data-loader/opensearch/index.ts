import { AmplifyAppSyncSimulatorDataLoader } from '..';

export class OpenSearchDataLoader implements AmplifyAppSyncSimulatorDataLoader {
  load(request): any {
    console.error('@searchable mocking is not supported.');
    return null;
  }
}
