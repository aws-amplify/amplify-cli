"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const utils_1 = require("./utils");
const clients_1 = require("../clients");
const run = async (context) => {
    var _a, _b, _c, _d, _e;
    amplify_prompts_1.printer.debug('Running create components command in amplify-util-uibuilder');
    const args = (0, utils_1.extractArgs)(context);
    const sourceEnvName = args.sourceEnvName ? args.sourceEnvName : context.exeInfo.sourceEnvName;
    const newEnvName = args.newEnvName ? args.newEnvName : context.exeInfo.localEnvInfo.envName;
    const appId = (_a = args.appId) !== null && _a !== void 0 ? _a : (_e = (_d = (_c = (_b = context.exeInfo) === null || _b === void 0 ? void 0 : _b.teamProviderInfo) === null || _c === void 0 ? void 0 : _c[sourceEnvName]) === null || _d === void 0 ? void 0 : _d.awscloudformation) === null || _e === void 0 ? void 0 : _e.AmplifyAppId;
    const studioClient = await clients_1.AmplifyStudioClient.setClientInfo(context, sourceEnvName, appId);
    const [existingComponents, existingComponentsNewEnv] = await Promise.all([
        studioClient.listComponents(sourceEnvName),
        studioClient.listComponents(newEnvName),
    ]);
    if (existingComponents.entities.length === 0) {
        amplify_prompts_1.printer.debug(`${existingComponents.entities.length} components exist in source env. Skipping creation of local components.`);
        return;
    }
    if (existingComponentsNewEnv.entities.length > 0) {
        amplify_prompts_1.printer.debug(`${existingComponentsNewEnv.entities.length} components already exist in new env. Skipping creation of local components.`);
        return;
    }
    const components = existingComponents.entities;
    if (!components.length) {
        amplify_prompts_1.printer.debug(`No UIBuilder components found in app ${appId} from env ${sourceEnvName}. Skipping component clone process.`);
        return;
    }
    for (let i = 0; i < components.length; i++) {
        const { appId: _appId, environmentName, id, createdAt, modifiedAt, ...componentCreateData } = components[i];
        await studioClient.createComponent(componentCreateData, newEnvName, appId);
    }
    amplify_prompts_1.printer.info(`Successfully cloned ${components.length} UIBuilder components in app ${appId} from env ${sourceEnvName} to env ${newEnvName}.`);
};
exports.run = run;
//# sourceMappingURL=cloneComponentsFromEnv.js.map