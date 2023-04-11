import { AmplifyAppSyncSimulatorDataLoader } from '..';
import { AmplifyFault, AMPLIFY_SUPPORT_DOCS } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';

export class OpenSearchDataLoader implements AmplifyAppSyncSimulatorDataLoader {
  constructor(private _config) {}

  async load(payload) {
    try {
      if (process?.platform?.startsWith('win')) {
        return null;
      }
      return await this._config.invoke(payload);
    } catch (e) {
      printer.info('Opensearch Data source failed with the following error:' + e?.message);
      throw new AmplifyFault(
        'MockProcessFault',
        {
          message: 'Failed to load data from Opensearch data source',
          link: AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url,
        },
        e,
      );
    }
  }
}
