import * as fs from 'fs-extra';
import * as path from 'path';
import { validateRemoveStorageRequest } from '../../../index';

const assetRoot = path.resolve(path.join(__dirname, '..', '..', 'assets'));

describe('validate remove storage request', () => {
  it('returns valid payload', async () => {
    const rawRequest = fs.readFileSync(path.join(assetRoot, 'storage', 'remove', 'validRemoveStorageRequest.json'), 'utf8');
    const result = await validateRemoveStorageRequest(rawRequest);
    expect(result).toMatchSnapshot();
  });
});

describe('rejects promise when invalid payload', () => {
  it('rejects garbage', async () => {
    const resultPromise = validateRemoveStorageRequest('garbage');
    await expect(resultPromise).rejects.toBeTruthy();
  });

  const missingFields = ['resourceName', 'serviceName', 'version'];
  for (const field of missingFields) {
    it(`rejects request with missing field ${field}`, async () => {
      const rawRequest = fs.readFileSync(path.join(assetRoot, 'storage', 'remove', `invalidRequest.missing.${field}.json`), 'utf8');
      const resultPromise = validateRemoveStorageRequest(rawRequest);
      await expect(resultPromise).rejects.toBeTruthy();
    });
  }
});
