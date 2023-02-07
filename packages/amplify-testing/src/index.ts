import { $TSContext } from 'amplify-cli-core';
import { AmplifyTester } from './amplify_tester';
import { createContext } from './context';
import { MemfsVolume } from './memfs_volume';
import { StorageMixin, ContextMixin } from './mixins';
import { SpyProxyHandler } from './spy_handler';

export function createAmplifyTest() {
  const context: $TSContext = new Proxy(createContext(), new SpyProxyHandler());
  const volume = new MemfsVolume();
  const TesterWithMixins = ContextMixin(StorageMixin(AmplifyTester, volume), context);
  const tester = new TesterWithMixins();
  return tester;
}
