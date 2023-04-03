"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dependsOnBlock = exports.getTriggerEnvInputs = exports.getTriggerEnvVariables = exports.cleanFunctions = exports.copyFunctions = exports.getTriggerMetadata = exports.choicesFromMetadata = exports.getTriggerPermissions = exports.triggerFlow = exports.deleteAllTriggers = exports.deleteTrigger = exports.deleteDeselectedTriggers = exports.updateTrigger = exports.addTrigger = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs-extra"));
const inquirer = __importStar(require("inquirer"));
const lodash_1 = __importDefault(require("lodash"));
const path = __importStar(require("path"));
const FunctionServiceNameLambdaFunction = 'Lambda';
const addTrigger = async (triggerOptions) => {
    const { key, values, context, functionName, triggerEnvs = '[]', category, parentStack, targetPath, parentResource, triggerIndexPath, triggerPackagePath, triggerDir, triggerTemplate, triggerEventPath, skipEdit, } = triggerOptions;
    const sourceRoot = path.join(triggerDir, 'function-template-dir');
    const defaultRoot = path.resolve(triggerDir, '..', 'function-template-dir');
    const templateMap = {
        'trigger-index.js': path.join('src', 'index.js'),
        'package.json.ejs': path.join('src', 'package.json'),
        'event.json': path.join('src', 'event.json'),
    };
    const destMap = {};
    const templateFiles = Object.keys(templateMap);
    const sourceFiles = templateFiles.map((file) => {
        const defaultTemplate = path.resolve(defaultRoot, file);
        const overrideTemplate = path.resolve(sourceRoot, file);
        const templateToUse = fs.existsSync(overrideTemplate) ? overrideTemplate : defaultTemplate;
        return path.relative(sourceRoot, templateToUse);
    });
    for (const sourceFile of sourceFiles) {
        const fileName = path.basename(sourceFile);
        destMap[sourceFile] = templateMap[fileName];
    }
    await context.amplify.invokePluginMethod(context, 'function', undefined, 'add', [
        context,
        'awscloudformation',
        FunctionServiceNameLambdaFunction,
        {
            trigger: true,
            cloudResourceTemplatePath: path.join(triggerDir, 'cloudformation-templates', triggerTemplate),
            functionTemplate: {
                sourceRoot,
                sourceFiles,
                destMap,
            },
            modules: values,
            parentResource,
            functionName,
            resourceName: functionName,
            parentStack,
            triggerEnvs: amplify_cli_core_1.JSONUtilities.stringify(triggerEnvs[key]),
            triggerIndexPath,
            triggerPackagePath,
            triggerDir,
            triggerTemplate,
            triggerEventPath,
            roleName: functionName,
            skipEdit,
        },
    ]);
    context.print.success('Successfully added the Lambda function locally');
    if (values && values.length > 0) {
        for (let v = 0; v < values.length; v += 1) {
            await (0, exports.copyFunctions)(key, values[v], category, context, targetPath);
        }
    }
    const result = {};
    result[key] = functionName;
    return result;
};
exports.addTrigger = addTrigger;
const updateTrigger = async (triggerOptions) => {
    const { key, values, context, functionName, triggerEnvs = '[]', category, parentStack, targetPath, parentResource, triggerIndexPath, triggerPackagePath, triggerDir, triggerTemplate, triggerEventPath, skipEdit, } = triggerOptions;
    try {
        await context.amplify.invokePluginMethod(context, 'function', undefined, 'update', [
            context,
            'awscloudformation',
            FunctionServiceNameLambdaFunction,
            {
                trigger: true,
                modules: values,
                parentResource,
                functionName,
                parentStack,
                triggerEnvs: amplify_cli_core_1.JSONUtilities.stringify(triggerEnvs[key]),
                triggerIndexPath,
                triggerPackagePath,
                triggerDir,
                roleName: functionName,
                triggerTemplate,
                triggerEventPath,
                skipEdit,
            },
            functionName,
        ]);
        if (values && values.length > 0) {
            for (let v = 0; v < values.length; v += 1) {
                await (0, exports.copyFunctions)(key, values[v], category, context, targetPath);
            }
            await (0, exports.cleanFunctions)(key, values, category, context, targetPath);
        }
        context.print.success('Successfully updated the Cognito trigger locally');
        return null;
    }
    catch (err) {
        context.print.error(`Error updating the Cognito trigger: ${err.message}`);
        await context.usageData.emitError(err);
        (0, amplify_cli_core_1.exitOnNextTick)(1);
    }
    return undefined;
};
exports.updateTrigger = updateTrigger;
const deleteDeselectedTriggers = async (currentTriggers, previousTriggers, functionName, targetDir, context) => {
    for (let p = 0; p < previousTriggers.length; p += 1) {
        if (!currentTriggers.includes(previousTriggers[p])) {
            const targetPath = `${targetDir}/function/${previousTriggers[p]}`;
            await context.amplify.deleteTrigger(context, `${previousTriggers[p]}`, targetPath);
        }
    }
};
exports.deleteDeselectedTriggers = deleteDeselectedTriggers;
const deleteTrigger = async (context, name, dir) => {
    try {
        await context.amplify.forceRemoveResource(context, 'function', name, dir);
    }
    catch (e) {
        throw new Error('Function plugin not installed in the CLI. You need to install it to use this feature.');
    }
};
exports.deleteTrigger = deleteTrigger;
const deleteAllTriggers = async (triggers, functionName, dir, context) => {
    const previousKeys = Object.keys(triggers);
    for (let y = 0; y < previousKeys.length; y += 1) {
        const targetPath = `${dir}/function/${functionName}`;
        await context.amplify.deleteTrigger(context, functionName, targetPath);
    }
};
exports.deleteAllTriggers = deleteAllTriggers;
const triggerFlow = async (context, resource, category, previousTriggers = {}) => {
    if (!resource)
        throw new Error('No resource provided to trigger question flow');
    if (!category)
        throw new Error('No category provided to trigger question flow');
    const functionName = `${resource.charAt(0).toUpperCase()}${resource.slice(1)}`;
    const wantTriggers = await inquirer.prompt({
        name: 'confirmation',
        type: 'confirm',
        message: `Do you want to configure Lambda Triggers for ${functionName}?`,
    });
    if (!wantTriggers.confirmation) {
        return null;
    }
    const pluginPath = context.amplify.getCategoryPluginInfo(context, category).packageLocation;
    const triggerPath = `${pluginPath}/provider-utils/awscloudformation/triggers/`;
    const triggerOptions = (0, exports.choicesFromMetadata)(triggerPath, resource, true);
    const triggerQuestion = {
        name: 'triggers',
        type: 'checkbox',
        message: `Which triggers do you want to enable for ${functionName}`,
        choices: triggerOptions,
        default: Object.keys(previousTriggers),
    };
    const triggerMeta = context.amplify.getTriggerMetadata(triggerPath, resource);
    const askTriggers = await learnMoreLoop('triggers', functionName, triggerMeta, triggerQuestion);
    const triggerObj = {};
    if (askTriggers.triggers) {
        for (let i = 0; i < askTriggers.triggers.length; i++) {
            const optionsPath = `${triggerPath}/${askTriggers.triggers[i]}`;
            const templateOptions = (0, exports.choicesFromMetadata)(optionsPath, askTriggers.triggers[i]);
            templateOptions.push({ name: 'Create your own module', value: 'custom' });
            const templateMeta = context.amplify.getTriggerMetadata(optionsPath, askTriggers.triggers[i]);
            const readableTrigger = triggerMeta[askTriggers.triggers[i]].name;
            const templateQuestion = {
                name: 'templates',
                type: 'checkbox',
                message: `What functionality do you want to use for ${readableTrigger}`,
                choices: templateOptions,
                default: lodash_1.default.flattenDeep(previousTriggers[askTriggers.triggers[i]]),
            };
            const askTemplates = await learnMoreLoop('templates', readableTrigger, templateMeta, templateQuestion);
            triggerObj[`${askTriggers.triggers[i]}`] = askTemplates.templates;
        }
    }
    const tempTriggerObj = Object.assign({}, triggerObj);
    Object.values(tempTriggerObj).forEach((t, index) => {
        if (!t || t.length < 1) {
            delete triggerObj[Object.keys(tempTriggerObj)[index]];
        }
    }, { triggerObj });
    return triggerObj;
};
exports.triggerFlow = triggerFlow;
const getTriggerPermissions = async (context, triggers, category) => {
    let permissions = [];
    const parsedTriggers = amplify_cli_core_1.JSONUtilities.parse(triggers);
    const triggerKeys = Object.keys(parsedTriggers);
    const pluginPath = context.amplify.getCategoryPluginInfo(context, category).packageLocation;
    for (let c = 0; c < triggerKeys.length; c += 1) {
        const index = triggerKeys[c];
        const meta = context.amplify.getTriggerMetadata(`${pluginPath}/provider-utils/awscloudformation/triggers/${index}`, index);
        const moduleKeys = Object.keys(meta);
        for (let v = 0; v < moduleKeys.length; v += 1) {
            if (parsedTriggers[index].includes(moduleKeys[v]) && meta[moduleKeys[v]].permissions) {
                permissions = permissions.concat(meta[moduleKeys[v]].permissions);
            }
        }
    }
    return permissions.map((i) => amplify_cli_core_1.JSONUtilities.stringify(i));
};
exports.getTriggerPermissions = getTriggerPermissions;
const learnMoreLoop = async (key, map, metaData, question) => {
    let selections = await inquirer.prompt(question);
    while (Array.isArray(selections[key]) &&
        selections[key].includes('learn')) {
        let prefix;
        if (metaData.URL) {
            prefix = `\nAdditional information about the ${key} available for ${map} can be found here: ${chalk_1.default.blue.underline(metaData.URL)}\n`;
            prefix = prefix.concat('\n');
        }
        else {
            prefix = `\nThe following ${key} are available in ${map}\n`;
            Object.values(metaData).forEach((m) => {
                prefix = prefix.concat('\n');
                prefix = prefix.concat(`\n${chalk_1.default.green('Name:')} ${m.name}\n${chalk_1.default.green('Description:')} ${m.description}\n`);
                prefix = prefix.concat('\n');
            });
        }
        question.prefix = prefix;
        selections = await inquirer.prompt(question);
    }
    return selections;
};
const choicesFromMetadata = (triggerPath, selection, isDir) => {
    const templates = isDir
        ? fs.readdirSync(triggerPath).filter((f) => fs.statSync(path.join(triggerPath, f)).isDirectory())
        : fs.readdirSync(triggerPath).map((t) => t.substring(0, t.length - 3));
    const metaData = (0, exports.getTriggerMetadata)(triggerPath, selection);
    const configuredOptions = Object.keys(metaData).filter((k) => templates.includes(k));
    const options = configuredOptions.map((c) => ({ name: `${metaData[c].name}`, value: c }));
    options.unshift(new inquirer.Separator());
    options.unshift({ name: 'Learn More', value: 'learn' });
    return options;
};
exports.choicesFromMetadata = choicesFromMetadata;
const getTriggerMetadata = (triggerPath, selection) => amplify_cli_core_1.JSONUtilities.readJson(`${triggerPath}/${selection}.map.json`);
exports.getTriggerMetadata = getTriggerMetadata;
async function openEditor(context, filePath, name) {
    const fullPath = `${filePath}/${name}.js`;
    if (await context.amplify.confirmPrompt(`Do you want to edit your ${name} function now?`)) {
        await context.amplify.openEditor(context, fullPath);
    }
}
const copyFunctions = async (key, value, category, context, targetPath) => {
    try {
        if (!fs.existsSync(targetPath)) {
            fs.mkdirSync(targetPath);
        }
        const dirContents = fs.readdirSync(targetPath);
        const pluginPath = context.amplify.getCategoryPluginInfo(context, category).packageLocation;
        const functionPath = context.amplify.getCategoryPluginInfo(context, 'function').packageLocation;
        if (!dirContents.includes(`${value}.js`)) {
            let source = '';
            if (value === 'custom') {
                source = `${functionPath}/provider-utils/awscloudformation/function-template-dir/trigger-custom.js`;
            }
            else {
                source = `${pluginPath}/provider-utils/awscloudformation/triggers/${key}/${value}.js`;
            }
            fs.copySync(source, `${targetPath}/${value}.js`);
            await openEditor(context, targetPath, value);
        }
    }
    catch (e) {
        throw new Error('Error copying functions');
    }
};
exports.copyFunctions = copyFunctions;
const cleanFunctions = async (key, values, category, context, targetPath) => {
    const pluginPath = context.amplify.getCategoryPluginInfo(context, category).packageLocation;
    try {
        const meta = context.amplify.getTriggerMetadata(`${pluginPath}/provider-utils/awscloudformation/triggers/${key}`, key);
        const dirContents = fs.readdirSync(targetPath);
        for (let x = 0; x < dirContents.length; x += 1) {
            if (dirContents[x] !== 'custom.js') {
                if (meta[`${dirContents[x].substring(0, dirContents[x].length - 3)}`] &&
                    !values.includes(`${dirContents[x].substring(0, dirContents[x].length - 3)}`)) {
                    try {
                        fs.unlinkSync(`${targetPath}/${dirContents[x]}`);
                    }
                    catch (e) {
                        throw new Error('Failed to delete module');
                    }
                }
            }
            if (dirContents[x] === 'custom.js' && !values.includes('custom')) {
                try {
                    fs.unlinkSync(`${targetPath}/${dirContents[x]}`);
                }
                catch (e) {
                    throw new Error('Failed to delete module');
                }
            }
        }
    }
    catch (e) {
        throw new Error('Error cleaning functions');
    }
    return null;
};
exports.cleanFunctions = cleanFunctions;
const getTriggerEnvVariables = (context, trigger, category) => {
    const pluginPath = context.amplify.getCategoryPluginInfo(context, category).packageLocation;
    let env = [];
    const meta = context.amplify.getTriggerMetadata(`${pluginPath}/provider-utils/awscloudformation/triggers/${trigger.key}`, trigger.key);
    if (trigger.modules) {
        for (let x = 0; x < trigger.modules.length; x++) {
            if (meta[trigger.modules[x]] && meta[trigger.modules[x]].env) {
                const newEnv = meta[trigger.modules[x]].env.filter((a) => !a.question);
                env = env.concat(newEnv);
            }
        }
        return env;
    }
    return null;
};
exports.getTriggerEnvVariables = getTriggerEnvVariables;
const getTriggerEnvInputs = async (context, triggerPath, triggerKey, triggerValues, currentEnvVars) => {
    const metadata = context.amplify.getTriggerMetadata(triggerPath, triggerKey);
    const intersection = Object.keys(metadata).filter((value) => triggerValues.includes(value));
    const answers = {};
    for (let i = 0; i < intersection.length; i += 1) {
        if (metadata[intersection[i]].env) {
            const questions = metadata[intersection[i]].env.filter((m) => m.question);
            if (questions && questions.length) {
                for (let j = 0; j < questions.length; j += 1) {
                    if (!currentEnvVars ||
                        (Object.keys(currentEnvVars) && Object.keys(currentEnvVars).length === 0) ||
                        !currentEnvVars[questions[j].key]) {
                        const prompterTypeMapping = {
                            input: 'input',
                            list: 'pick',
                            confirm: 'confirmContinue',
                        };
                        const prompterFunction = prompterTypeMapping[questions[j].question.type];
                        const answer = await amplify_prompts_1.prompter[prompterFunction](questions[j].question.message);
                        answers[questions[j].key] = answer;
                    }
                }
            }
        }
    }
    return Object.assign(answers, currentEnvVars);
};
exports.getTriggerEnvInputs = getTriggerEnvInputs;
const dependsOnBlock = (context, triggerKeys = [], provider) => {
    if (!context)
        throw new Error('No context provided to dependsOnBlock');
    if (!provider)
        throw new Error('No provider provided to dependsOnBlock');
    const dependsOnArray = context.updatingAuth && context.updatingAuth.dependsOn ? context.updatingAuth.dependsOn : [];
    triggerKeys.forEach((l) => {
        if (!dependsOnArray.find((a) => a.resourceName === l)) {
            dependsOnArray.push({
                category: 'function',
                resourceName: l,
                triggerProvider: provider,
                attributes: ['Arn', 'Name'],
            });
        }
    });
    const tempArray = Object.assign([], dependsOnArray);
    tempArray.forEach((x) => {
        if (x.triggerProvider === provider && !triggerKeys.includes(x.resourceName)) {
            const index = dependsOnArray.findIndex((i) => i.resourceName === x.resourceName);
            dependsOnArray.splice(index, 1);
        }
    });
    return lodash_1.default.uniq(dependsOnArray);
};
exports.dependsOnBlock = dependsOnBlock;
//# sourceMappingURL=trigger-flow.js.map