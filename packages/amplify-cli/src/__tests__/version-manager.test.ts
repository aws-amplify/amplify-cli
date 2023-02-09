import url from 'url';
import {
  prodUrl,
  UsageDataPayload,
  CommandLineInput,
  IFlowReport,
  UsageData,
  getLatestApiVersion,
  getLatestPayloadVersion,
} from 'amplify-cli-core';

describe('test version manager', () => {
  it('url version should be the latest URL', () => {
    const prodURL = url.parse(prodUrl);
    const apiVersion = getLatestApiVersion();
    expect(prodURL.pathname).toContain(apiVersion);
  });

  it('payload version should be the latest', () => {
    const usageData = UsageData.Instance;
    const payload = new UsageDataPayload(
      '',
      '',
      '',
      new CommandLineInput([]),
      new Error(''),
      '',
      '12311232',
      { frontend: 'javascript', editor: 'vscode', framework: 'react' },
      {},
      {},
      usageData.getFlowReport() as IFlowReport,
    );
    expect(payload.payloadVersion).toEqual(getLatestPayloadVersion());
  });
});
