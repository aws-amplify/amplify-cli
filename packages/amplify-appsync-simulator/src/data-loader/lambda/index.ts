import { AmplifyAppSyncSimulatorDataLoader } from '..';
import DataLoader from 'dataloader';

const batchLoaders = {};

const getBatchDataResolver = (loaderName, resolver) => {
  if (batchLoaders[loaderName] === undefined) {
    batchLoaders[loaderName] = new DataLoader(resolver, { cache: false });
  }
  return batchLoaders[loaderName];
};

export class LambdaDataLoader implements AmplifyAppSyncSimulatorDataLoader {
  constructor(private _config) {}

  async load(req, extraData) {
    try {
      let result;
      if (req.operation === 'BatchInvoke') {
        const { fieldName, parentType } = extraData.info;
        const batchName = `${this._config.name}.${parentType.name}.${fieldName}`;
        const dataLoader = getBatchDataResolver(batchName, this._config.invoke);
        result = await dataLoader.load(req.payload);
      } else {
        result = await this._config.invoke(req.payload);
      }
      return result;
    } catch (e) {
      console.log('Lambda Data source failed with the following error');
      console.error(e);
      throw e;
    }
  }
}
