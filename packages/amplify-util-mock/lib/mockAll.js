"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockAllCategories = void 0;
const api_1 = require("./api");
const storage_1 = require("./storage");
const MOCK_SUPPORTED_CATEGORY = ['AppSync', 'S3', "Lambda"];
async function mockAllCategories(context) {
    const resources = await context.amplify.getResourceStatus();
    const mockableResources = resources.allResources.filter((resource) => resource.service && MOCK_SUPPORTED_CATEGORY.includes(resource.service));
    const resourceToBePushed = [...resources.resourcesToBeUpdated, ...resources.resourcesToBeCreated].filter((resource) => resource.service && !MOCK_SUPPORTED_CATEGORY.includes(resource.service));
    if (mockableResources.length) {
        if (resourceToBePushed.length) {
            try {
                context.print.info('Some resources have changed locally and these resources are not mockable. The resources listed below need to be pushed to the cloud before starting the mock server.');
                const didPush = await context.amplify.pushResources(context, undefined, undefined, resourceToBePushed);
                if (!didPush) {
                    context.print.info('\n\nMocking may not work as expected since some of the changed resources were not pushed.');
                }
            }
            catch (e) {
                context.print.info(`Pushing to the cloud failed with the following error \n${e.message}\n\n`);
                const startServer = await await context.amplify.confirmPrompt('Do you still want to start the mock server?');
                if (!startServer) {
                    return;
                }
            }
        }
        const serverPromises = [];
        if (mockableResources.find((r) => r.service === 'AppSync')) {
            serverPromises.push((0, api_1.start)(context));
        }
        if (mockableResources.find((r) => r.service === 'S3')) {
            serverPromises.push((0, storage_1.start)(context));
        }
        await Promise.all(serverPromises);
    }
    else {
        context.print.info('No resource in project can be mocked locally.');
    }
}
exports.mockAllCategories = mockAllCategories;
//# sourceMappingURL=mockAll.js.map