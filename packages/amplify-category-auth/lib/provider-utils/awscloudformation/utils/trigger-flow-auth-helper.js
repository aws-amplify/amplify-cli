"use strict";
const path = require('path');
const { FeatureFlags } = require('@aws-amplify/amplify-cli-core');
const triggerAssetRoot = path.resolve(path.join(__dirname, '../../../../provider-utils/awscloudformation/triggers'));
async function handleTriggers(context, coreAnswers, previouslySaved) {
    const targetDir = context.amplify.pathManager.getBackendDirPath();
    let triggerKeyValues = {};
    const authResourceName = context.updatingAuth ? context.updatingAuth.resourceName : coreAnswers.resourceName;
    const triggers = typeof coreAnswers.triggers === 'string' ? JSON.parse(coreAnswers.triggers) : coreAnswers.triggers;
    const triggerEnvs = {};
    Object.keys(triggers).forEach((r) => {
        triggerEnvs[r] = context.amplify.getTriggerEnvVariables(context, { key: r, modules: triggers[r] }, 'auth');
    });
    const keys = Object.keys(triggers);
    const values = Object.values(triggers);
    let authTriggerConnections = [];
    if (triggers) {
        for (let t = 0; t < keys.length; t += 1) {
            const functionName = `${authResourceName}${keys[t]}`;
            const targetPath = `${targetDir}/function/${functionName}/src`;
            let config = {};
            config['triggerType'] = keys[t] === 'PreSignup' ? 'PreSignUp' : keys[t];
            config['lambdaFunctionName'] = functionName;
            authTriggerConnections.push(config);
            if (previouslySaved && previouslySaved[keys[t]]) {
                const currentEnvVariables = context.amplify.loadEnvResourceParameters(context, 'function', functionName);
                await saveTriggerEnvParamsToTeamProviderInfo(context, keys[t], values[t], functionName, currentEnvVariables);
                const triggerOptions = {
                    key: keys[t],
                    values: values[t],
                    context,
                    functionName,
                    triggerEnvs,
                    category: 'auth',
                    parentStack: 'auth',
                    targetPath,
                    triggerTemplate: `${keys[t]}.json.ejs`,
                    triggerPackage: `${keys[t]}.package.json`,
                    triggerEventPath: `${keys[t]}.event.json`,
                    triggerDir: path.join(triggerAssetRoot, keys[t]),
                    parentResource: authResourceName,
                    skipEdit: true,
                };
                const updatedLambda = await context.amplify.updateTrigger(triggerOptions);
                triggerKeyValues = Object.assign(triggerKeyValues, updatedLambda);
            }
            else {
                await saveTriggerEnvParamsToTeamProviderInfo(context, keys[t], values[t], functionName);
                const triggerOptions = {
                    key: keys[t],
                    values: values[t],
                    context,
                    functionName,
                    triggerEnvs,
                    category: 'auth',
                    parentStack: 'auth',
                    targetPath,
                    triggerTemplate: `${keys[t]}.json.ejs`,
                    triggerEventPath: `${keys[t]}.event.json`,
                    triggerDir: path.join(triggerAssetRoot, keys[t]),
                    parentResource: authResourceName,
                    skipEdit: true,
                };
                const newLambda = await context.amplify.addTrigger(triggerOptions);
                triggerKeyValues = Object.assign(triggerKeyValues, newLambda);
            }
        }
    }
    if (previouslySaved) {
        const previousTriggers = Object.keys(previouslySaved).map((i) => `${authResourceName}${i}`);
        const currentTriggers = Object.keys(triggers).map((i) => `${authResourceName}${i}`);
        await context.amplify.deleteDeselectedTriggers(currentTriggers, previousTriggers, authResourceName, targetDir, context);
    }
    if (coreAnswers.triggers) {
        coreAnswers.parentStack = { Ref: 'AWS::StackId' };
    }
    return { triggers, authTriggerConnections };
}
const saveTriggerEnvParamsToTeamProviderInfo = async (context, key, value, functionName, currentEnvVars) => {
    const envs = await context.amplify.getTriggerEnvInputs(context, path.join(triggerAssetRoot, key), key, value, currentEnvVars);
    if (!FeatureFlags.getBoolean('auth.useInclusiveTerminology') && key === 'PreSignup') {
        if (envs.DOMAINDENYLIST) {
            envs.DOMAINBLACKLIST = envs.DOMAINDENYLIST;
            delete envs.DOMAINDENYLIST;
        }
        if (envs.DOMAINALLOWLIST) {
            envs.DOMAINWHITELIST = envs.DOMAINALLOWLIST;
            delete envs.DOMAINALLOWLIST;
        }
        if (Array.isArray(value)) {
            for (let i = 0; i < value.length; i++) {
                const val = value[i];
                if (val.endsWith('-denylist') || val.endsWith('-allowlist')) {
                    value[i] = `${val}-legacy`;
                }
            }
        }
    }
    context.amplify.saveEnvResourceParameters(context, 'function', functionName, envs);
};
module.exports = {
    handleTriggers,
};
//# sourceMappingURL=trigger-flow-auth-helper.js.map