import assert from 'node:assert';
import { DataDefinition } from '@aws-amplify/amplify-gen2-codegen';
import { AmplifyStackParser } from './amplify_stack_parser';
import { BackendEnvironmentResolver } from './backend_environment_selector';

const dataSourceMappingOutputKey = 'DataSourceMappingOutput';

export class DataDefinitionFetcher {
  constructor(private backendEnvironmentResolver: BackendEnvironmentResolver, private amplifyStackClient: AmplifyStackParser) {}
  getDefinition = async (): Promise<DataDefinition | undefined> => {
    const backendEnvironment = await this.backendEnvironmentResolver.selectBackendEnvironment();
    assert(backendEnvironment?.stackName);
    const amplifyStacks = await this.amplifyStackClient.getAmplifyStacks(backendEnvironment?.stackName);
    if (amplifyStacks.dataStack) {
      const tableMappingText = amplifyStacks.dataStack?.Outputs?.find((o) => o.OutputKey === dataSourceMappingOutputKey)?.OutputValue;
      assert(tableMappingText, 'Amplify Data table mapping not found.');
      try {
        return {
          tableMapping: JSON.parse(tableMappingText),
        };
      } catch (e) {
        throw new Error('Could not parse the Amplify Data table mapping');
      }
    }
  };
}
