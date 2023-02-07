import { AmplifyTester } from '../amplify_tester';
import { MemfsVolume } from '../memfs_volume';
import { AmplifyTestVolume } from '../volume';
import WithStorage from './storage';

describe('AmplifyTest storage mixin', () => {
  describe('given an AmplifyTestVolume', () => {
    class TestVolume implements AmplifyTestVolume {
      toJSON = jest.fn();
      setAll = jest.fn();
      setFile = jest.fn();
    }
    it('calls setAll when initializing the volume', async () => {
      const volume = new TestVolume();
      const TestWithStorage = WithStorage(AmplifyTester, volume);
      const tester = new TestWithStorage();
      const fs = {
        '/amplify/team-provider-info.json': JSON.stringify({
          dev: {},
        }),
      };
      await tester.withStartingVolume(fs).runTest(async context => null);
      expect(volume.setAll).toHaveBeenCalledWith(fs);
    });
    it('calls setFile with a given path and file content when calling withFile', async () => {
      const volume = new TestVolume();
      const TestWithStorage = WithStorage(AmplifyTester, volume);
      const tester = new TestWithStorage();
      const fs = {
        '/amplify/team-provider-info.json': JSON.stringify({
          dev: {},
        }),
      };
      await tester
        .withStartingVolume(fs)
        .withFile('/amplify/team-provider-info.json', JSON.stringify({ dev: { foo: 'bar' } }))
        .runTest(async context => null);
      expect(volume.setFile).toHaveBeenCalledWith('/amplify/team-provider-info.json', JSON.stringify({ dev: { foo: 'bar' } }));
    });
    it('can call withFile with a null value', async () => {
      const volume = new TestVolume();
      const TestWithStorage = WithStorage(AmplifyTester, volume);
      const tester = new TestWithStorage();
      const fs = {
        '/amplify/team-provider-info.json': JSON.stringify({
          dev: {},
        }),
      };
      const path = '/amplify/team-provider-info.json';
      await tester
        .withStartingVolume(fs)
        .withFile(path, null)
        .runTest(async _ => null);
      expect(volume.setFile).toHaveBeenCalledWith(path, null);
    });
    it('calls toJSON on the test volume when returning the result of the test', async () => {
      const volume = new MemfsVolume();
      const TestWithStorage = WithStorage(AmplifyTester, volume);
      const tester = new TestWithStorage();
      const fs = {
        '/amplify/team-provider-info.json': JSON.stringify({
          dev: {},
        }),
      };
      const toJSONSpy = jest.spyOn(volume, 'toJSON');
      const result = await tester.withStartingVolume(fs).runTest(async context => null);
      expect(toJSONSpy).toHaveBeenCalled();
      expect(result.outputs.volume).toStrictEqual(fs);
    });
  });
});
