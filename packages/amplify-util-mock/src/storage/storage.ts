import { AmplifyStorageSimulator } from 'amplify-storage-simulator';
import * as path from 'path';
import * as fs from 'fs-extra';
import { getAmplifyMeta, addCleanupTask, getMockDataDirectory } from '../utils';
import { ConfigOverrideManager } from '../utils/config-override';

export class StorageTest {
    private storageName: string;
    private storageSimulator: AmplifyStorageSimulator;
    private configOverrideManager: ConfigOverrideManager;
    private storageRegion: string;
    private bucketName: string;

    async start(context) {
        // loading s3 resource config form parameters.json
        const meta = context.amplify.getProjectDetails().amplifyMeta;
        const existingStorage = meta.storage;
        this.storageRegion = meta.providers.awscloudformation.Region;
        //console.log("existingStorage",existingStorage);
        if (existingStorage === undefined || Object.keys(existingStorage).length === 0) {
            return context.print.warning('Storage has not yet been added to this project.');
        }
        let backendPath = context.amplify.pathManager.getBackendDirPath();
        const resourceName = Object.keys(existingStorage)[0];
        const parametersFilePath = path.join(
            backendPath,
            'storage',
            resourceName,
            'parameters.json'
        );

        const localEnvFilePath = context.amplify.pathManager.getLocalEnvFilePath();
        const localEnvInfo = context.amplify.readJsonFile(localEnvFilePath);
        const storageParams = context.amplify.readJsonFile(parametersFilePath);
        this.bucketName = `${storageParams.bucketName}-${localEnvInfo.envName}`
        const route = path.join(
            '/',
            this.bucketName,
            '/'
        );

        let localDirS3 = this.createLocalStorage(context, resourceName);
        const port = 20005; // port for S3

        try {
            addCleanupTask(context, async context => {
                await this.stop(context);
            });
            this.configOverrideManager = ConfigOverrideManager.getInstance(context);
            this.storageName = await this.getStorage(context);
            const storageConfig = { port, route, localDirS3 };
            this.storageSimulator = new AmplifyStorageSimulator(storageConfig);
            await this.storageSimulator.start();
            console.log('Storage Emulator is running in', this.storageSimulator.url);
            await this.generateTestFrontendExports(context);
        } catch (e) {
            console.error('Failed to start Storage test server', e);
        }
    }

    async stop(context) {
        await this.storageSimulator.stop();
    }

    private async generateTestFrontendExports(context) {
        await this.generateFrontendExports(context, {
            endpoint: this.storageSimulator.url,
            name: this.storageName,
            testMode: true
        });
    }

    // generate aws-exports.js
    private async generateFrontendExports(
        context: any,
        localStorageDetails?: {
            endpoint: string;
            name: string;
            testMode: boolean;
        }
    ) {
        const currentMeta = await getAmplifyMeta(context);
        const override = currentMeta.storage || {};
        if (localStorageDetails) {
            const storageMeta = override[localStorageDetails.name] || { output: {} };
            override[localStorageDetails.name] = {
                service: 'S3',
                ...storageMeta,
                output: {
                    BucketName: this.bucketName,
                    Region: this.storageRegion,
                    ...storageMeta.output
                },
                testMode: localStorageDetails.testMode,
                lastPushTimeStamp: new Date()
            };
        };
        this.configOverrideManager.addOverride('storage', override);
        await this.configOverrideManager.generateOverriddenFrontendExports(context);
    }

    private async getStorage(context) {
        const currentMeta = await getAmplifyMeta(context);
        const { storage: tmp = {} } = currentMeta;
        let name = null;
        Object.entries(tmp).some((entry: any) => {
            if (entry[1].service === 'S3') {
                name = entry[0];
                return true;
            }
        });
        return name;
    }

    // create local storage for S3 on disk which is fixes as the test folder
    private createLocalStorage(context, resourceName: string) {
        const directoryPath = path.join(getMockDataDirectory(context), 'S3'); // get bucket through parameters remove afterwards
        fs.ensureDirSync(directoryPath);

        //console.log(directoryPath);
        const localPath = path.join(directoryPath, resourceName);
        fs.ensureDirSync(localPath);
        //console.log(localPath);
        return localPath;
    }
}
