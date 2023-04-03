"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = void 0;
const storage_1 = require("./storage");
const MOCK_SUPPORTED_CATEGORY = ['S3'];
const RESOURCE_NEEDS_PUSH = ['Cognito'];
async function start(context) {
    const resources = await context.amplify.getResourceStatus();
    const mockableResources = resources.allResources.filter((resource) => resource.service && MOCK_SUPPORTED_CATEGORY.includes(resource.service));
    const resourceToBePushed = [...resources.resourcesToBeCreated].filter((resource) => resource.service && RESOURCE_NEEDS_PUSH.includes(resource.service));
    if (mockableResources.length) {
        if (resourceToBePushed.length) {
            context.print.info('Storage Mocking needs Auth resources to be pushed to the cloud. Please run `amplify auth push` before running storage mock');
            return Promise.resolve(false);
        }
        const mockStorage = new storage_1.StorageTest();
        try {
            await mockStorage.start(context);
            await mockStorage.trigger(context);
        }
        catch (e) {
            console.log(e);
            process.kill(process.pid, 'SIGTERM');
        }
    }
    return undefined;
}
exports.start = start;
//# sourceMappingURL=index.js.map