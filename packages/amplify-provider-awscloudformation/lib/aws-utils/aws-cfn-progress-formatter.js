"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeProgressBars = void 0;
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const progress_bar_helpers_1 = require("../utils/progress-bar-helpers");
const initializeProgressBars = (eventMap) => {
    const newMultiBar = new amplify_prompts_1.MultiProgressBar({
        progressBarFormatter: progress_bar_helpers_1.createProgressBarFormatter,
        itemFormatter: progress_bar_helpers_1.createItemFormatter,
        loneWolf: false,
        hideCursor: true,
        barSize: 40,
        itemCompleteStatus: progress_bar_helpers_1.CFN_SUCCESS_STATUS,
        itemFailedStatus: progress_bar_helpers_1.CNF_ERROR_STATUS,
        prefixText: `Deploying resources into ${eventMap.envName} environment. This will take a few minutes.`,
        successText: 'Deployment completed.',
        failureText: 'Deployment failed.',
        barCompleteChar: '=',
        barIncompleteChar: '-',
    });
    let progressBarsConfigs = [];
    progressBarsConfigs.push({
        name: 'projectBar',
        value: 0,
        total: 1 + eventMap.rootResources.length,
        payload: {
            progressName: `root stack-${eventMap.projectName}`,
            envName: eventMap.envName,
        },
    });
    progressBarsConfigs = eventMap.categories.reduce((previous, current) => previous.concat({
        name: current.name,
        value: 0,
        total: current.size,
        payload: {
            progressName: current.name,
            envName: eventMap.envName,
        },
    }), progressBarsConfigs);
    if (newMultiBar.isTTY()) {
        newMultiBar.create(progressBarsConfigs);
    }
    return newMultiBar;
};
exports.initializeProgressBars = initializeProgressBars;
//# sourceMappingURL=aws-cfn-progress-formatter.js.map