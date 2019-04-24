import { graphqlName } from './util';

export class FunctionResourceIDs {
    static FunctionDataSourceID(name: string, region?: string): string {
        return `${graphqlName(name)}${graphqlName(region || '')}LambdaDataSource`
    }

    static FunctionIAMRoleID(name: string, region?: string): string {
        return `${FunctionResourceIDs.FunctionDataSourceID(name, region)}Role`
    }

    static FunctionAppSyncFunctionConfigurationID(name: string, region?: string): string {
        return `Invoke${FunctionResourceIDs.FunctionDataSourceID(name, region)}`
    }
}
