import { getUrl } from '../domain/amplify-telemetry/getTelemetryUrl';
import { TelemetryPayload } from '../domain/amplify-telemetry/TelemetryPayload';
import { getLatestApiVersion, getLatestPayloadVersion } from '../domain/amplify-telemetry/VersionManager';
import { Input } from '../domain/input';
describe('test version manager', () => {
  it('url version should be the latest URL', () => {
    const url = getUrl();
    const apiVersion = getLatestApiVersion();
    expect(url.pathname).toContain(apiVersion);
  });

  it('payload version should be the latest', () => {
    const payload = new TelemetryPayload('', '', '', new Input([]), new Error(''), '');
    expect(payload.payloadVersion).toEqual(getLatestPayloadVersion());
  });
});
