import { AmplifyAppSyncSimulator } from '@aws-amplify/amplify-appsync-simulator';
import * as openSearchEmulator from '@aws-amplify/amplify-opensearch-simulator';
import { DynamoDB } from 'aws-sdk';
export * from './graphql-client';
export declare function launchDDBLocal(): Promise<{
    emulator: any;
    dbPath: any;
    client: DynamoDB;
}>;
export declare function deploy(transformerOutput: any, client?: DynamoDB, opensearchURL?: URL): Promise<{
    config: any;
    simulator: AmplifyAppSyncSimulator;
}>;
export declare function reDeploy(transformerOutput: any, simulator: AmplifyAppSyncSimulator, client?: DynamoDB): Promise<{
    config: any;
    simulator: AmplifyAppSyncSimulator;
}>;
export declare function terminateDDB(emulator: any, dbPath: any): Promise<void>;
export declare function runAppSyncSimulator(config: any, port?: number, wsPort?: number): Promise<AmplifyAppSyncSimulator>;
export declare function logDebug(...msgs: any[]): void;
export declare function setupSearchableMockResources(pathToSearchableMockResources: string): Promise<{
    emulator: openSearchEmulator.OpenSearchEmulator;
}>;
//# sourceMappingURL=index.d.ts.map