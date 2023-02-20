import { AmplifyTester } from './amplify_tester';
import { MemfsVolume } from './memfs_volume';
import { WithStorage } from './mixins';

export function createAmplifyTest() {
  const volume = new MemfsVolume();
  const TesterWithMixins = WithStorage(AmplifyTester, volume);
  const tester = new TesterWithMixins();
  tester.withStartingVolume({
    '/amplify/': null,
  });
  return tester;
}
