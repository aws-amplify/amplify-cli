import { AmplifyStorageSimulator } from 'amplify-storage-simulator';
import { $TSContext } from 'amplify-cli-core';
export declare class StorageTest {
    private storageName;
    private storageSimulator;
    private configOverrideManager;
    private storageRegion;
    private bucketName;
    start(context: any): Promise<any>;
    stop(): Promise<void>;
    trigger(context: $TSContext): Promise<void>;
    private generateTestFrontendExports;
    private generateFrontendExports;
    private getStorage;
    private createLocalStorage;
    get getSimulatorObject(): AmplifyStorageSimulator;
}
//# sourceMappingURL=storage.d.ts.map