import * as fs from 'fs-extra';
import * as path from 'path';
import { validateAddStorageRequest } from '../../../index';

const assetRoot = path.resolve(path.join(__dirname, '..', '..', 'assets'));

describe('validate add storage request', () => {
  it('returns valid payload', async () => {
    const rawRequest = fs.readFileSync(path.join(assetRoot, 'storage', 'add', 'validAddStorageRequest.json'), 'utf8');
    const result = await validateAddStorageRequest(rawRequest);
    expect(result).toMatchSnapshot();
  });
});

describe('rejects promise when invalid payload', () => {
  it('rejects garbage', async () => {
    const resultPromise = validateAddStorageRequest('garbage');
    await expect(resultPromise).rejects.toBeTruthy();
  });

  const missingFields = ['permissions', 'serviceName', 'version'];
  for (const field of missingFields) {
    it(`rejects request with missing field ${field}`, async () => {
      const rawRequest = fs.readFileSync(path.join(assetRoot, 'storage', 'add', `invalidRequest.missing.${field}.json`), 'utf8');
      const resultPromise = validateAddStorageRequest(rawRequest);
      await expect(resultPromise).rejects.toBeTruthy();
    });
  }
});
