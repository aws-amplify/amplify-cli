import { prodUrl } from '../domain/amplify-usageData/getUsageDataUrl';
import { UsageDataPayload } from '../domain/amplify-usageData/UsageDataPayload';
import { getLatestApiVersion, getLatestPayloadVersion } from '../domain/amplify-usageData/VersionManager';
import { Input } from '../domain/input';
import url from 'url';
describe('test version manager', () => {
  it('url version should be the latest URL', () => {
    const prodURL = url.parse(prodUrl);
    const apiVersion = getLatestApiVersion();
    expect(prodURL.pathname).toContain(apiVersion);
  });

  it('payload version should be the latest', () => {
    const payload = new UsageDataPayload(
      '',
      '',
      '',
      new Input([]),
      new Error(''),
      '',
      '12311232',
      { frontend: 'javascript', editor: 'vscode', framework: 'react' },
      {},
    );
    expect(payload.payloadVersion).toEqual(getLatestPayloadVersion());
  });
});
