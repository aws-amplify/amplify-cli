import { AmplifyAppSyncSimulatorDataLoader } from '..';

export class LambdaDataLoader implements AmplifyAppSyncSimulatorDataLoader {
  constructor(private _config) {}
  async load(req) {
    try {
      const result = await this._config.invoke(req.payload);
      return result;
    } catch (e) {
      console.log('Lambda Data source failed with the following error');
      console.log(e);
    }
  }
}
