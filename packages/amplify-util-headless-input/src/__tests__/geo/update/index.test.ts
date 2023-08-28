import fs from 'fs-extra';
import path from 'path';
import { validateUpdateGeoRequest } from '../../../index';

const assetRoot = path.resolve(path.join(__dirname, '..', '..', 'assets'));

describe('validate update geo request', () => {
  it('returns valid payload for map', async () => {
    const rawRequest = fs.readFileSync(path.join(assetRoot, 'geo', 'update', 'validRequest.map.json'), 'utf8');
    const result = await validateUpdateGeoRequest(rawRequest);
    expect(result).toMatchSnapshot();
  });

  it('rejects promise when invalid payload', async () => {
    const resultPromise = validateUpdateGeoRequest('garbage');
    await expect(resultPromise).rejects.toBeTruthy();
  });
});
