"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.name = void 0;
const trigger_file_uploader_1 = require("../../provider-utils/awscloudformation/utils/trigger-file-uploader");
exports.name = 'push';
const category = 'auth';
const run = async (context) => {
    const { amplify, parameters } = context;
    const resourceName = parameters.first;
    context.amplify.constructExeInfo(context);
    const result = await amplify.pushResources(context, category, resourceName);
    await (0, trigger_file_uploader_1.uploadFiles)(context);
    return result;
};
exports.run = run;
//# sourceMappingURL=push.js.map