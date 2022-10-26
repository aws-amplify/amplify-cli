import { AmplifyAppSyncSimulatorDataLoader } from '..';
import { AmplifyError } from 'amplify-cli-core';

export class OpenSearchDataLoader implements AmplifyAppSyncSimulatorDataLoader {
  constructor(private _config) {}

  async load(payload, extraData) {
    try {
      if (process?.platform?.startsWith('win')) {
        return null;
      }
      return await this._config.invoke(payload);
    } catch (e) {
      console.log('Opensearch Data source failed with the following error');
      console.error(e);
      throw new AmplifyError('ConfigurationError', {
        message: 'Failed to load data from Opensearch data source',
        resolution: 'Restart the mock process'
      });
    }
  }
}
