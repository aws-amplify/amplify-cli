import { $TSContext, $TSMeta } from 'amplify-cli-core';
import { AmplifyTestVolume, FileContent, FullPath } from './volume';

export type TestResult<T> = {
  context: $TSContext;
  meta: $TSMeta;
  fileSystem: Record<FullPath, FileContent>;
  data: T;
};

export type AmplifyTesterOptions = Record<string, unknown>;
export class AmplifyTester {
  constructor(context: $TSContext, meta: $TSMeta, volume: AmplifyTestVolume, options: AmplifyTesterOptions = {}) {
    this.context = context;
    this.amplifyMeta = meta;
    this.volume = volume;
  }
  private context: Partial<$TSContext>;
  private amplifyMeta: Partial<$TSMeta>;
  private volume: AmplifyTestVolume;

  public withStartingVolume(volume: Record<FullPath, FileContent>) {
    this.volume.setAll(volume);
    return this;
  }
  public get hasValidState() {
    return true;
  }
  public withAmplifyMeta(meta: Partial<$TSMeta>) {
    this.amplifyMeta = meta;
    return this;
  }
  public withContextProperty<T extends keyof $TSContext>(key: T, value: $TSContext[T]) {
    this.context[key] = value;
    return this;
  }
  public withFile(fullPath: FullPath, content: FileContent) {
    this.volume.setFile(fullPath, content);
    return this;
  }
  public async runTest<T>(runner: (context: $TSContext, meta: $TSMeta) => Promise<T>): Promise<TestResult<T>> {
    const data = await runner((this.context as unknown) as $TSContext, (this.amplifyMeta as unknown) as $TSMeta);
    return {
      context: (this.context as unknown) as $TSContext,
      meta: (this.amplifyMeta as unknown) as $TSMeta,
      fileSystem: this.volume.toJSON(),
      data,
    };
  }
}
