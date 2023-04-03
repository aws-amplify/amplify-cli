"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProject = void 0;
/* eslint-disable import/no-cycle */
const __1 = require("..");
const utils_1 = require("../utils");
/**
 * Runs `amplify delete`
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const deleteProject = (cwd, profileConfig, usingLatestCodebase = false, noOutputTimeout = 1000 * 60 * 20) => __awaiter(void 0, void 0, void 0, function* () {
    // Read the meta from backend otherwise it could fail on non-pushed, just initialized projects
    try {
        const { StackName: stackName, Region: region } = (0, utils_1.getBackendAmplifyMeta)(cwd).providers.awscloudformation;
        yield (0, __1.retry)(() => (0, __1.describeCloudFormationStack)(stackName, region, profileConfig), (stack) => stack.StackStatus.endsWith('_COMPLETE') || stack.StackStatus.endsWith('_FAILED'));
        yield (0, __1.nspawn)((0, __1.getCLIPath)(usingLatestCodebase), ['delete'], { cwd, stripColors: true, noOutputTimeout })
            .wait('Are you sure you want to continue?')
            .sendYes()
            .wait('Project deleted locally.')
            .runAsync();
    }
    catch (e) {
        console.log('Error on deleting project at:', cwd);
    }
});
exports.deleteProject = deleteProject;
//# sourceMappingURL=deleteProject.js.map