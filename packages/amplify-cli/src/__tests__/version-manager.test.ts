import { prodUrl } from '../domain/amplify-telemetry/getTelemetryUrl';
import { TelemetryPayload } from '../domain/amplify-telemetry/TelemetryPayload';
import { getLatestApiVersion, getLatestPayloadVersion } from '../domain/amplify-telemetry/VersionManager';
import { Input } from '../domain/input';
import url from 'url';
describe('test version manager', () => {
  it('url version should be the latest URL', () => {
    const prodURL = url.parse(prodUrl);
    const apiVersion = getLatestApiVersion();
    expect(prodURL.pathname).toContain(apiVersion);
  });

  it('payload version should be the latest', () => {
    const payload = new TelemetryPayload('', '', '', new Input([]), new Error(''), '');
    expect(payload.payloadVersion).toEqual(getLatestPayloadVersion());
  });
});
