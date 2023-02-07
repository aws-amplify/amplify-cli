import { Constructor } from '.';
import { AmplifyTester } from '../amplify_tester';
import { AmplifyTestVolume, FileContent, FullPath } from '../volume';

export function StorageMixin<TBase extends Constructor<AmplifyTester>>(Base: TBase, initialVolume: AmplifyTestVolume) {
  return class AmplifyStorageTester extends Base {
    private volume: AmplifyTestVolume;
    constructor(...args: any[]) {
      super(...args);
      this.addResultProcessor(this.storageResultProcessor);
      this.addTestParameterCreator(this.storageTestParameterCreator);
      this.volume = initialVolume;
    }
    private storageTestParameterCreator = (): Record<string, unknown> & { volume: AmplifyTestVolume } => {
      return { volume: this.volume };
    };
    private storageResultProcessor = (
      result: Record<string, unknown>,
    ): Record<string, unknown> & { volume: Record<FullPath, FileContent> } => {
      return { ...result, volume: this.volume.toJSON() };
    };
    public withStartingVolume = (volume: Record<FullPath, FileContent>) => {
      this.volume.setAll(volume);
      return this;
    };
    public withFile = (fullPath: FullPath, content: FileContent) => {
      this.volume.setFile(fullPath, content);
      return this;
    };
  };
}
