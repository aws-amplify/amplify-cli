import { $TSContext, $TSMeta } from 'amplify-cli-core';
import { AmplifyTester } from './amplify_tester';
import { MemfsVolume } from './memfs_volume';
import { AmplifyTestVolume } from './volume';

describe('amplify tester', () => {
  describe('given an AmplifyTestVolume', () => {
    class TestVolume implements AmplifyTestVolume {
      toJSON = jest.fn();
      setAll = jest.fn();
      setFile = jest.fn();
    }
    it('calls setAll when initializing the volume', async () => {
      const fs = {
        '/amplify/team-provider-info.json': JSON.stringify({
          dev: {},
        }),
      };
      const volume = new TestVolume();
      await new AmplifyTester({} as $TSContext, {} as $TSMeta, volume).withStartingVolume(fs).runTest(async context => null);
      expect(volume.setAll).toHaveBeenCalledWith(fs);
    });
    it('calls setFile with a given path and file content when calling withFile', async () => {
      const fs = {
        '/amplify/team-provider-info.json': JSON.stringify({
          dev: {},
        }),
      };
      const volume = new TestVolume();
      await new AmplifyTester({} as $TSContext, {} as $TSMeta, volume)
        .withStartingVolume(fs)
        .withFile('/amplify/team-provider-info.json', JSON.stringify({ dev: { foo: 'bar' } }))
        .runTest(async context => null);
      expect(volume.setFile).toHaveBeenCalledWith('/amplify/team-provider-info.json', JSON.stringify({ dev: { foo: 'bar' } }));
    });
    it('can call withFile with a null value', async () => {
      const fs = {
        '/amplify/team-provider-info.json': JSON.stringify({
          dev: {},
        }),
      };
      const volume = new TestVolume();
      const path = '/amplify/team-provider-info.json';
      await new AmplifyTester({} as $TSContext, {} as $TSMeta, volume)
        .withStartingVolume(fs)
        .withFile(path, null)
        .runTest(async context => null);
      expect(volume.setFile).toHaveBeenCalledWith(path, null);
    });
    it('calls toJSON on the test volume when returning the result of the test', async () => {
      const fs = {
        '/amplify/team-provider-info.json': JSON.stringify({
          dev: {},
        }),
      };
      const volume = new MemfsVolume();
      const toJSONSpy = jest.spyOn(volume, 'toJSON');
      const { fileSystem } = await new AmplifyTester({} as $TSContext, {} as $TSMeta, volume)
        .withStartingVolume(fs)
        .runTest(async context => null);
      expect(toJSONSpy).toHaveBeenCalled();
      expect(fileSystem).toStrictEqual(fs);
    });
  });
});
