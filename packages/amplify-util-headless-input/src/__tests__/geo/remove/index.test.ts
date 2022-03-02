import fs from 'fs-extra';
import path from 'path';
import { validateRemoveGeoRequest } from '../../../index';

const assetRoot = path.resolve(path.join(__dirname, '..', '..', 'assets'));

describe('validate remove geo request', () => {
  it('returns valid payload for map', async () => {
    const rawRequest = fs.readFileSync(path.join(assetRoot, 'geo', 'remove', 'validRequest.map.json'), 'utf8');
    const result = await validateRemoveGeoRequest(rawRequest);
    expect(result).toMatchSnapshot();
  });

  it('rejects promise when invalid payload', async () => {
    const resultPromise = validateRemoveGeoRequest('garbage');
    expect(resultPromise).rejects.toBeTruthy();
  });
});