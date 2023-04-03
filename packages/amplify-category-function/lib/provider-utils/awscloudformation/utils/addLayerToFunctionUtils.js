"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.askLayerOrderQuestion = exports.askCustomArnQuestion = exports.askLayerSelection = exports.provideExistingARNsPrompt = void 0;
const enquirer_1 = __importDefault(require("enquirer"));
const inquirer_1 = __importDefault(require("inquirer"));
const lodash_1 = __importDefault(require("lodash"));
const constants_1 = require("../../../constants");
const layerCloudState_1 = require("./layerCloudState");
const layerConfiguration_1 = require("./layerConfiguration");
const layerHelpers_1 = require("./layerHelpers");
const layerMigrationUtils_1 = require("./layerMigrationUtils");
exports.provideExistingARNsPrompt = 'Provide existing Lambda layer ARNs';
const layerSelectionPrompt = 'Provide existing layers or select layers in this project to access from this function (pick up to 5):';
const defaultLayerVersionPrompt = 'Always choose latest version';
const versionSelectionPrompt = (layerName) => `Select a version for ${layerName}:`;
const ARNEntryPrompt = (remainingLayers) => `Enter up to ${remainingLayers} existing Lambda layer ARNs (comma-separated):`;
const layerOrderPrompt = 'Modify the layer order (Layers with conflicting files will overwrite contents of layers earlier in the list):';
const layerARNRegex = /^arn:[a-zA-Z0-9-]+:lambda:[a-zA-Z0-9-]+:\d{12}:layer:[a-zA-Z0-9-_]+:\d+$/;
const askLayerSelection = async (context, amplifyMeta, runtimeValue, previousSelections = []) => {
    const lambdaLayers = [];
    const dependsOn = [];
    const functionMeta = lodash_1.default.get(amplifyMeta, [constants_1.categoryName]) || {};
    const layerOptions = lodash_1.default.keys(functionMeta)
        .filter((key) => functionMeta[key].service === "LambdaLayer")
        .filter((key) => {
        const runtimes = functionMeta[key].runtimes || (0, layerConfiguration_1.getLayerRuntimes)(key);
        return Array.isArray(runtimes) && (lodash_1.default.isEmpty(runtimes) || isRuntime(runtimeValue).inRuntimes(runtimes));
    });
    if (layerOptions.length === 0) {
        return {
            lambdaLayers,
            dependsOn,
            askArnQuestion: true,
        };
    }
    const disabledMessage = 'Layer requires migration. Run "amplify function update" and choose this layer to migrate.';
    const currentResourceNames = filterProjectLayers(previousSelections).map((sel) => sel.resourceName);
    const choices = layerOptions.map((op) => ({
        name: op,
        checked: currentResourceNames.includes(op),
        disabled: (0, layerMigrationUtils_1.getLegacyLayerState)(op) !== 0 ? disabledMessage : false,
    }));
    choices.unshift({
        name: exports.provideExistingARNsPrompt,
        checked: previousSelections.map((sel) => sel.type).includes('ExternalLayer'),
        disabled: false,
    });
    const layerSelectionQuestion = {
        type: 'checkbox',
        name: 'layerSelections',
        message: layerSelectionPrompt,
        choices: choices,
        validate: (input) => input.length <= 5 || 'Select at most 5 entries from the list',
    };
    let layerSelections = (await inquirer_1.default.prompt(layerSelectionQuestion)).layerSelections;
    const askArnQuestion = layerSelections.includes(exports.provideExistingARNsPrompt);
    layerSelections = layerSelections.filter((selection) => selection !== exports.provideExistingARNsPrompt);
    for (const layerName of layerSelections) {
        const layerCloudState = layerCloudState_1.LayerCloudState.getInstance(layerName);
        const layerVersions = await layerCloudState.getLayerVersionsFromCloud(context, layerName);
        const layerVersionChoices = layerVersions.map(layerHelpers_1.mapVersionNumberToChoice);
        const projectLayer = {
            type: 'ProjectLayer',
            resourceName: layerName,
            env: context.amplify.getEnvInfo().envName,
            version: undefined,
            isLatestVersionSelected: undefined,
        };
        if (layerVersionChoices.length > 0) {
            layerVersionChoices.unshift(defaultLayerVersionPrompt);
            const previousLayerSelection = lodash_1.default.first(filterProjectLayers(previousSelections).filter((prev) => prev.resourceName === layerName));
            let defaultLayerSelection;
            if (previousLayerSelection === undefined || previousLayerSelection.isLatestVersionSelected) {
                defaultLayerSelection = defaultLayerVersionPrompt;
            }
            else {
                const previouslySelectedLayerVersion = lodash_1.default.first(layerVersions.filter((v) => v.Version === previousLayerSelection.version));
                defaultLayerSelection = previouslySelectedLayerVersion
                    ? (0, layerHelpers_1.mapVersionNumberToChoice)(previouslySelectedLayerVersion)
                    : defaultLayerVersionPrompt;
            }
            const versionSelection = (await inquirer_1.default.prompt((0, layerHelpers_1.layerVersionQuestion)(layerVersionChoices, versionSelectionPrompt(layerName), defaultLayerSelection))).versionSelection;
            const isLatestVersionSelected = versionSelection === defaultLayerVersionPrompt;
            const selectedVersion = versionSelection === defaultLayerVersionPrompt ? defaultLayerVersionPrompt : Number(lodash_1.default.first(versionSelection.split(':')));
            projectLayer.version = selectedVersion;
            projectLayer.isLatestVersionSelected = isLatestVersionSelected;
        }
        else {
            projectLayer.version = defaultLayerVersionPrompt;
            projectLayer.isLatestVersionSelected = true;
        }
        lambdaLayers.push(projectLayer);
        dependsOn.push({
            category: constants_1.categoryName,
            resourceName: layerName,
            attributes: ['Arn'],
        });
    }
    return {
        lambdaLayers,
        dependsOn,
        askArnQuestion,
    };
};
exports.askLayerSelection = askLayerSelection;
const askCustomArnQuestion = async (numLayersSelected, previousSelections = []) => {
    const arnPrompt = {
        type: 'input',
        name: 'arns',
        message: ARNEntryPrompt(5 - numLayersSelected),
        validate: lambdaLayerARNValidator,
        filter: stringSplitAndTrim,
        default: filterExternalLayers(previousSelections)
            .map((sel) => sel.arn)
            .join(', ') || undefined,
    };
    return (await inquirer_1.default.prompt(arnPrompt)).arns.map((arn) => ({ type: 'ExternalLayer', arn }));
};
exports.askCustomArnQuestion = askCustomArnQuestion;
const askLayerOrderQuestion = async (currentSelections, previousSelections = []) => {
    if (currentSelections.length <= 1) {
        return currentSelections;
    }
    previousSelections.reverse().forEach((prevSel) => {
        let idx = -1;
        switch (prevSel.type) {
            case 'ExternalLayer':
                idx = currentSelections.findIndex((currSel) => currSel.type === 'ExternalLayer' && currSel.arn === prevSel.arn);
                break;
            default:
                idx = currentSelections.findIndex((currSel) => currSel.type === 'ProjectLayer' && currSel.resourceName === prevSel.resourceName);
        }
        if (idx >= 0) {
            currentSelections.unshift(...currentSelections.splice(idx, 1));
        }
    });
    const sortPrompt = {
        type: 'sort',
        name: 'sortedNames',
        message: layerOrderPrompt,
        choices: currentSelections.map((ll) => (ll.type === 'ExternalLayer' ? ll.arn : ll.resourceName)),
    };
    const sortedNames = (await enquirer_1.default.prompt(sortPrompt)).sortedNames;
    const finalSelectionOrder = [];
    sortedNames.forEach((name) => finalSelectionOrder.push(currentSelections.find((sel) => (sel.type === 'ExternalLayer' ? sel.arn === name : sel.resourceName === name))));
    return finalSelectionOrder;
};
exports.askLayerOrderQuestion = askLayerOrderQuestion;
const isRuntime = (runtime) => ({
    inRuntimes: (runtimes) => runtimes.map((runtime) => runtime.value).includes(runtime),
});
const filterProjectLayers = (layers) => {
    return layers.filter((layer) => layer.type === 'ProjectLayer');
};
const filterExternalLayers = (layers) => {
    return layers.filter((layer) => layer.type === 'ExternalLayer');
};
const stringSplitAndTrim = (input) => {
    return input
        .split(',')
        .map((str) => str.trim())
        .filter((str) => str);
};
const lambdaLayerARNValidator = (input) => {
    const invalidARNs = input.filter((arn) => !arn.match(layerARNRegex));
    return invalidARNs.length === 0 ? true : `${invalidARNs.join(', ')} are not valid Lambda layer ARNs`;
};
//# sourceMappingURL=addLayerToFunctionUtils.js.map