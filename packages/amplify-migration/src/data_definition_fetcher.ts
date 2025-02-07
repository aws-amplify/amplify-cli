import { DataDefinition } from '@aws-amplify/amplify-gen2-codegen';
import { AmplifyStackParser } from './amplify_stack_parser.js';
import { BackendEnvironmentResolver } from './backend_environment_selector.js';

const dataSourceMappingOutputKey = 'DataSourceMappingOutput';

export class DataDefinitionFetcher {
  constructor(private backendEnvironmentResolver: BackendEnvironmentResolver, private amplifyStackClient: AmplifyStackParser) {}
  getDefinition = async (): Promise<DataDefinition | undefined> => {
    const backendEnvironments = await this.backendEnvironmentResolver.getAllBackendEnvironments();
    const tableMappings = await Promise.all(
      backendEnvironments.map(async (backendEnvironment) => {
        if (!backendEnvironment?.stackName) {
          return [backendEnvironment.environmentName, undefined];
        }
        const amplifyStacks = await this.amplifyStackClient.getAmplifyStacks(backendEnvironment?.stackName);
        if (amplifyStacks.dataStack) {
          const tableMappingText = amplifyStacks.dataStack?.Outputs?.find((o) => o.OutputKey === dataSourceMappingOutputKey)?.OutputValue;
          if (!tableMappingText) {
            return [backendEnvironment.environmentName, undefined];
          }
          try {
            return [backendEnvironment.environmentName, JSON.parse(tableMappingText)];
          } catch (e) {
            return [backendEnvironment.environmentName, undefined];
          }
        }
        return [backendEnvironment.environmentName, undefined];
      }),
    );
    return {
      tableMappings: Object.fromEntries(tableMappings),
    };
  };
}
