import * as fs from 'fs-extra';
import * as path from 'path';
import { validateUpdateStorageRequest } from '../../../index';

const assetRoot = path.resolve(path.join(__dirname, '..', '..', 'assets'));

describe('validate update storage request', () => {
  it('returns valid payload', async () => {
    const rawRequest = fs.readFileSync(path.join(assetRoot, 'storage', 'update', 'validUpdateStorageRequest.json'), 'utf8');
    const result = await validateUpdateStorageRequest(rawRequest);
    expect(result).toMatchSnapshot();
  });
});

describe('rejects promise when invalid payload', () => {
  it('rejects garbage', async () => {
    const resultPromise = validateUpdateStorageRequest('garbage');
    await expect(resultPromise).rejects.toBeTruthy();
  });

  const missingFields = ['permissions', 'resourceName', 'serviceName', 'version'];
  for (const field of missingFields) {
    it(`rejects request with missing field ${field}`, async () => {
      const rawRequest = fs.readFileSync(path.join(assetRoot, 'storage', 'add', `invalidRequest.missing.${field}.json`), 'utf8');
      const resultPromise = validateUpdateStorageRequest(rawRequest);
      await expect(resultPromise).rejects.toBeTruthy();
    });
  }
});
