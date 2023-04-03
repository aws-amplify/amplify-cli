"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageTest = void 0;
const amplify_storage_simulator_1 = require("amplify-storage-simulator");
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const utils_1 = require("../utils");
const config_override_1 = require("../utils/config-override");
const amplify_category_function_1 = require("@aws-amplify/amplify-category-function");
const load_lambda_config_1 = require("../utils/lambda/load-lambda-config");
const amplify_cli_core_1 = require("amplify-cli-core");
const port = 20005;
async function invokeS3GetResourceName(context) {
    const s3ResourceName = await context.amplify.invokePluginMethod(context, 'storage', undefined, 's3GetResourceName', [context]);
    return s3ResourceName;
}
async function invokeS3GetUserInputs(context, s3ResourceName) {
    const s3UserInputs = await context.amplify.invokePluginMethod(context, 'storage', undefined, 's3GetUserInput', [context, s3ResourceName]);
    return s3UserInputs;
}
class StorageTest {
    async start(context) {
        const meta = context.amplify.getProjectDetails().amplifyMeta;
        const existingStorage = meta.storage;
        this.storageRegion = meta.providers.awscloudformation.Region;
        if (existingStorage === undefined || Object.keys(existingStorage).length === 0) {
            return context.print.warning('Storage has not yet been added to this project.');
        }
        const localEnvFilePath = context.amplify.pathManager.getLocalEnvFilePath();
        const localEnvInfo = context.amplify.readJsonFile(localEnvFilePath);
        const s3ResourceName = await invokeS3GetResourceName(context);
        const s3UserInputs = await invokeS3GetUserInputs(context, s3ResourceName);
        this.bucketName = `${s3UserInputs.bucketName}-${localEnvInfo.envName}`;
        const route = path.join('/', this.bucketName);
        const localDirS3 = this.createLocalStorage(context, `${s3UserInputs.bucketName}`);
        try {
            context.amplify.addCleanUpTask(async () => {
                await this.stop();
            });
            this.configOverrideManager = await config_override_1.ConfigOverrideManager.getInstance(context);
            this.storageName = await this.getStorage(context);
            const storageConfig = { port, route, localDirS3 };
            this.storageSimulator = new amplify_storage_simulator_1.AmplifyStorageSimulator(storageConfig);
            await this.storageSimulator.start();
            console.log('Mock Storage endpoint is running at', this.storageSimulator.url);
            await this.generateTestFrontendExports(context);
        }
        catch (e) {
            console.error('Failed to start Mock Storage server', e);
        }
        return undefined;
    }
    async stop() {
        await this.storageSimulator.stop();
    }
    async trigger(context) {
        const region = this.storageRegion;
        this.storageSimulator.getServer.on('event', (eventObj) => {
            const meta = context.amplify.getProjectDetails().amplifyMeta;
            const existingStorage = meta.storage;
            const backendPath = context.amplify.pathManager.getBackendDirPath();
            const resourceName = Object.keys(existingStorage)[0];
            const CFNFilePath = path.join(backendPath, 'storage', resourceName, 'build', 'cloudformation-template.json');
            const storageParams = amplify_cli_core_1.JSONUtilities.readJson(CFNFilePath);
            const lambdaConfig = storageParams.Resources.S3Bucket.Properties.NotificationConfiguration &&
                storageParams.Resources.S3Bucket.Properties.NotificationConfiguration.LambdaConfigurations;
            if (lambdaConfig === undefined) {
                return;
            }
            let triggerName;
            for (const obj of lambdaConfig) {
                let prefix_arr = obj.Filter;
                if (prefix_arr === undefined) {
                    const eventName = String(eventObj.Records[0].event.eventName).split(':')[0];
                    if (eventName === 'ObjectRemoved' || eventName === 'ObjectCreated') {
                        triggerName = String(obj.Function.Ref).split('function')[1].split('Arn')[0];
                        break;
                    }
                }
                else {
                    const keyName = String(eventObj.Records[0].s3.object.key);
                    prefix_arr = obj.Filter.S3Key.Rules;
                    for (const rules of prefix_arr) {
                        let node;
                        if (typeof rules.Value === 'object') {
                            node = String(Object.values(rules.Value)[0][1][0] + String(region) + ':');
                        }
                        if (typeof rules.Value === 'string') {
                            node = String(rules.Value);
                        }
                        if (rules.Name === 'prefix' && keyName.startsWith(node)) {
                            triggerName = String(obj.Function.Ref).split('function')[1].split('Arn')[0];
                            break;
                        }
                        if (rules.Name === 'suffix' && keyName.endsWith(node)) {
                            triggerName = String(obj.Function.Ref).split('function')[1].split('Arn')[0];
                            break;
                        }
                    }
                }
                if (triggerName !== undefined) {
                    break;
                }
            }
            if (triggerName === undefined) {
                return;
            }
            (0, load_lambda_config_1.loadLambdaConfig)(context, triggerName)
                .then((config) => {
                return (0, amplify_category_function_1.getInvoker)(context, { handler: config.handler, resourceName: triggerName, envVars: config.environment });
            })
                .then((invoker) => {
                return invoker({ event: eventObj });
            })
                .catch((err) => {
                context.print.error('Error executing lambda trigger');
                context.print.error(err);
            });
        });
    }
    async generateTestFrontendExports(context) {
        await this.generateFrontendExports(context, {
            endpoint: this.storageSimulator.url,
            name: this.storageName,
            testMode: true,
        });
    }
    async generateFrontendExports(context, localStorageDetails) {
        const currentMeta = await (0, utils_1.getAmplifyMeta)(context);
        const override = currentMeta.storage || {};
        if (localStorageDetails) {
            const storageMeta = override[localStorageDetails.name] || { output: {} };
            override[localStorageDetails.name] = {
                service: 'S3',
                ...storageMeta,
                output: {
                    ...storageMeta.output,
                    BucketName: this.bucketName,
                    Region: this.storageRegion,
                },
                testMode: localStorageDetails.testMode,
                lastPushTimeStamp: new Date(),
            };
        }
        this.configOverrideManager.addOverride('storage', override);
        await this.configOverrideManager.generateOverriddenFrontendExports(context);
    }
    async getStorage(context) {
        const currentMeta = await (0, utils_1.getAmplifyMeta)(context);
        const { storage: tmp = {} } = currentMeta;
        let name = null;
        Object.entries(tmp).some((entry) => {
            if (entry[1].service === 'S3') {
                name = entry[0];
                return true;
            }
            return undefined;
        });
        return name;
    }
    createLocalStorage(context, resourceName) {
        const directoryPath = path.join((0, utils_1.getMockDataDirectory)(context), 'S3');
        fs.ensureDirSync(directoryPath);
        const localPath = path.join(directoryPath, resourceName);
        fs.ensureDirSync(localPath);
        return localPath;
    }
    get getSimulatorObject() {
        return this.storageSimulator;
    }
}
exports.StorageTest = StorageTest;
//# sourceMappingURL=storage.js.map