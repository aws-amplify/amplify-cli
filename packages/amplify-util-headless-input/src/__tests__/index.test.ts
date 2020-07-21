import fs from 'fs-extra';
import path from 'path';
import { validateAddStorageRequest } from '../index';

const assetRoot = path.resolve(path.join(__dirname, 'assets'));

describe('validate add storage request', () => {
  it('returns valid payload', async () => {
    const rawRequest = fs.readFileSync(path.join(assetRoot, 'validAddStorageRequest.json'), 'utf8');
    const result = await validateAddStorageRequest(rawRequest);
    expect(result).toMatchSnapshot();
  });

  it('rejects promise when invalid payload', async () => {
    const resultPromise = validateAddStorageRequest('garbage');
    expect(resultPromise).rejects.toBeTruthy();
  });
});
