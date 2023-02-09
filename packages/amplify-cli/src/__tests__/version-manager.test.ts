import url from 'url';
import { prodUrl } from '../domain/amplify-usageData/getUsageDataUrl';
import { UsageDataPayload } from '../domain/amplify-usageData/UsageDataPayload';
import { UsageData } from '../domain/amplify-usageData';
import { getLatestApiVersion, getLatestPayloadVersion } from '../domain/amplify-usageData/VersionManager';
import { CommandLineInput } from 'amplify-cli-core';
import { IFlowReport } from 'amplify-cli-shared-interfaces';

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
