import { AmplifyAppSyncSimulatorDataLoader } from '..';

export class OpenSearchDataLoader implements AmplifyAppSyncSimulatorDataLoader {
  constructor(private _config) {}

  async load(payload, extraData) {
    try {
      console.log(payload);
      if (process?.platform?.startsWith('win')) {
        console.error('@searchable mocking is not supported for Windows platform.');
        return null;
      }
      const result = await this._config.invoke(payload);
      return result;
    } catch (e) {
      console.log('Opensearch Data source failed with the following error');
      console.error(e);
      throw e;
    }
  }
}
