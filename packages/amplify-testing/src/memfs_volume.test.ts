import { MemfsVolume } from './memfs_volume';

describe('MemFS Amplify Test Volume', () => {
  it('can be initialized with a starting volume', async () => {
    const fs = {
      '/amplify/team-provider-info.json': JSON.stringify({
        dev: {},
      }),
    };
    const volume = new MemfsVolume();
    await volume.setAll(fs);
    expect(volume.toJSON()).toEqual(fs);
  });
  it('can be initialized with a starting volume and a file', async () => {
    const fs = {
      '/amplify/team-provider-info.json': JSON.stringify({
        dev: {},
      }),
    };
    const volume = new MemfsVolume();
    await volume.setAll(fs);
    await volume.setFile('/amplify/team-provider-info.json', JSON.stringify({ dev: { foo: 'bar' } }));
    expect(volume.toJSON()).toEqual({
      '/amplify/team-provider-info.json': JSON.stringify({ dev: { foo: 'bar' } }),
    });
  });
  it('can be initialized with a starting volume and a null file', async () => {
    const fs = {
      '/amplify/team-provider-info.json': JSON.stringify({
        dev: {},
      }),
    };
    const volume = new MemfsVolume();
    await volume.setAll(fs);
    expect(volume.toJSON()).toEqual(fs);
    await volume.setFile('/amplify/team-provider-info.json', null);
    expect(volume.toJSON()).toEqual({ '/amplify': null });
  });
  it('toJSON returns a copy of the volume', async () => {
    const fs = {
      '/amplify/team-provider-info.json': JSON.stringify({
        dev: {},
      }),
    };
    const volume = new MemfsVolume();
    await volume.setAll(fs);
    expect(volume.toJSON()).toEqual(fs);
  });
});
