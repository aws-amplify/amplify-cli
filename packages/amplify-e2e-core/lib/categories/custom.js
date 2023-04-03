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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLatestExtensibilityHelper = exports.buildCustomResources = exports.addCFNCustomResource = exports.addCDKCustomResource = void 0;
const __1 = require("..");
const path_1 = __importDefault(require("path"));
const amplify_cli_core_1 = require("amplify-cli-core");
const addCDKCustomResource = (cwd, settings) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, __1.nspawn)((0, __1.getCLIPath)(), ['add', 'custom'], { cwd, stripColors: true })
        .wait('How do you want to define this custom resource?')
        .sendCarriageReturn()
        .wait('Provide a name for your custom resource')
        .sendLine(settings.name || '\r')
        .wait('Do you want to edit the CDK stack now?')
        .sendNo()
        .sendEof()
        .runAsync();
});
exports.addCDKCustomResource = addCDKCustomResource;
const addCFNCustomResource = (cwd, settings, testingWithLatestCodebase = false) => __awaiter(void 0, void 0, void 0, function* () {
    const chain = (0, __1.nspawn)((0, __1.getCLIPath)(testingWithLatestCodebase), ['add', 'custom'], { cwd, stripColors: true })
        .wait('How do you want to define this custom resource?')
        .send(__1.KEY_DOWN_ARROW)
        .sendCarriageReturn()
        .wait('Provide a name for your custom resource')
        .sendLine(settings.name || '\r')
        .wait('Do you want to access Amplify generated resources in your custom CloudFormation file?')
        .sendYes();
    if (settings.promptForCategorySelection) {
        chain.wait('Select the categories you want this custom resource to have access to').selectAll();
    }
    if (settings.promptForCustomResourcesSelection) {
        chain.wait('Select the one you would like your custom resource to access').selectAll();
    }
    yield chain.wait('Do you want to edit the CloudFormation stack now?').sendNo().sendEof().runAsync();
});
exports.addCFNCustomResource = addCFNCustomResource;
function buildCustomResources(cwd, usingLatestCodebase = false) {
    return new Promise((resolve, reject) => {
        const args = ['custom', 'build'];
        (0, __1.nspawn)((0, __1.getCLIPath)(usingLatestCodebase), args, { cwd, stripColors: true })
            .sendEof()
            .run((err) => {
            if (!err) {
                resolve({});
            }
            else {
                reject(err);
            }
        });
    });
}
exports.buildCustomResources = buildCustomResources;
const useLatestExtensibilityHelper = (projectRoot, customResourceName) => {
    const packageJsonPath = path_1.default.join(projectRoot, 'amplify', 'backend', 'custom', customResourceName, 'package.json');
    const packageJson = amplify_cli_core_1.JSONUtilities.readJson(packageJsonPath);
    packageJson.dependencies['@aws-amplify/cli-extensibility-helper'] = 'latest';
    amplify_cli_core_1.JSONUtilities.writeJson(packageJsonPath, packageJson);
};
exports.useLatestExtensibilityHelper = useLatestExtensibilityHelper;
//# sourceMappingURL=custom.js.map