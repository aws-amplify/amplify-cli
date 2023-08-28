import fs from 'fs-extra';
import path from 'path';
import { validateAddGeoRequest } from '../../../index';

const assetRoot = path.resolve(path.join(__dirname, '..', '..', 'assets'));

describe('validate add geo request', () => {
  it('returns valid payload for map', async () => {
    const rawRequest = fs.readFileSync(path.join(assetRoot, 'geo', 'add', 'validRequest.map.json'), 'utf8');
    const result = await validateAddGeoRequest(rawRequest);
    expect(result).toMatchSnapshot();
  });

  it('rejects promise when invalid payload', async () => {
    const resultPromise = validateAddGeoRequest('garbage');
    await expect(resultPromise).rejects.toBeTruthy();
  });
});
