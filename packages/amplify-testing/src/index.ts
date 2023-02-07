import { $TSContext, $TSMeta } from 'amplify-cli-core';
import { AmplifyTester } from './amplify_tester';
import { createContext } from './context';
import { MemfsVolume } from './memfs_volume';
import { createMeta } from './meta';
import { SpyProxyHandler } from './spy_handler';

export function createAmplifyTest() {
  const context: $TSContext = new Proxy(createContext(), new SpyProxyHandler());
  const meta: $TSMeta = new Proxy(createMeta(), new SpyProxyHandler());
  const volume = new MemfsVolume();
  return new AmplifyTester(context, meta, volume);
}
