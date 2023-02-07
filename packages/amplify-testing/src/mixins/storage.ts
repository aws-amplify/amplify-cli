import { Constructor, MixinResult } from '.';
import { AmplifyTester } from '../amplify_tester';
import { AmplifyTestVolume, FileContent, FullPath } from '../volume';

export interface StorageMixin {
  withStartingVolume: (volume: Record<FullPath, FileContent>) => this;
  withFile: (fullPath: FullPath, content: FileContent) => this;
}

export default function WithStorage<TBase extends Constructor<AmplifyTester>>(
  Base: TBase,
  initialVolume: AmplifyTestVolume,
): MixinResult<StorageMixin, TBase> {
  return class AmplifyStorageTester extends Base implements StorageMixin {
    _volume: AmplifyTestVolume;
    constructor(...args: any[]) {
      super(...args);
      this.addResultProcessor(this._storageResultProcessor);
      this.addTestParameterCreator(this._storageTestParameterCreator);
      this._volume = initialVolume;
    }
    _storageTestParameterCreator = (): Record<string, unknown> & { volume: AmplifyTestVolume } => {
      return { volume: this._volume };
    };
    _storageResultProcessor = (result: Record<string, unknown>): Record<string, unknown> & { volume: Record<FullPath, FileContent> } => {
      return { volume: this._volume.toJSON() };
    };
    public withStartingVolume = (volume: Record<FullPath, FileContent>) => {
      this._volume.setAll(volume);
      return this;
    };
    public withFile = (fullPath: FullPath, content: FileContent) => {
      this._volume.setFile(fullPath, content);
      return this;
    };
  };
}
