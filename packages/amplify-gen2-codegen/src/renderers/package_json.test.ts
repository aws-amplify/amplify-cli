import assert from 'node:assert';
import { JsonRenderer } from './package_json';

describe('PackageJsonRenderer', () => {
  it('renders the json object to a string', async () => {
    const json = { name: 'my-package', version: 'my-version' };
    const jsonCreator = async () => json;
    const testWriter = jest.fn(async () => {});
    const jsonRenderer = new JsonRenderer(jsonCreator, testWriter);
    await jsonRenderer.render();
    assert.equal(testWriter.mock.calls[0], JSON.stringify(json, null, 2));
  });
});
