import fs from 'node:fs/promises';
import assert from 'node:assert';
import { EnsureDirectory } from './ensure_directory';

describe('Ensure directory', () => {
  it('calls mkdir on the provided directory', async () => {
    const mkdir = jest.spyOn(fs, 'mkdir');
    mkdir.mockImplementationOnce(async () => undefined);

    const ensureDir = new EnsureDirectory('output');
    await ensureDir.render();

    assert.equal(mkdir.mock.calls.length, 1);
  });
  afterEach(() => {
    jest.resetAllMocks();
  });
});
