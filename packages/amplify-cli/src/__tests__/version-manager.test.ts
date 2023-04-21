import url from 'url';
import { prodUrl } from '../domain/amplify-usageData/getUsageDataUrl';
import { UsageDataPayload } from '../domain/amplify-usageData/UsageDataPayload';
import { UsageData } from '../domain/amplify-usageData';
import { getLatestApiVersion, getLatestPayloadVersion } from '../domain/amplify-usageData/VersionManager';
import { CLIInput as CommandLineInput } from '../domain/command-input';
import { IFlowReport } from '@aws-amplify/amplify-cli-shared-interfaces';
import { ProjectSettings } from '@aws-amplify/amplify-cli-core/src';

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
      { frontend: 'javascript', editor: 'vscode', framework: 'react' } as unknown as ProjectSettings,
      {},
      {},
      usageData.getFlowReport() as IFlowReport,
    );
    expect(payload.payloadVersion).toEqual(getLatestPayloadVersion());
  });
});
