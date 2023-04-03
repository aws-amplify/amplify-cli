"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
exports.validateNodeModulesDirRemoval = exports.functionCloudInvoke = exports.functionMockAssert = exports.removeFunction = exports.createNewDynamoDBForCrudTemplate = exports.selectTemplate = exports.selectRuntime = exports.functionBuild = exports.addLambdaTrigger = exports.updateFunction = exports.addFunction = exports.runtimeChoices = void 0;
const __1 = require("..");
const selectors_1 = require("../utils/selectors");
const glob = __importStar(require("glob"));
const path = __importStar(require("path"));
const lodash_1 = __importDefault(require("lodash"));
const feature_flags_1 = require("../utils/feature-flags");
// runtimeChoices are shared between tests
exports.runtimeChoices = ['.NET 6', 'Go', 'Java', 'NodeJS', 'Python'];
// templateChoices is per runtime
const dotNetTemplateChoices = [
    'CRUD function for DynamoDB (Integration with API Gateway)',
    'Hello World',
    'Serverless',
    'Trigger (DynamoDb, Kinesis)',
];
const goTemplateChoices = ['Hello World'];
const javaTemplateChoices = ['Hello World'];
const nodeJSTemplateChoices = [
    'CRUD function for DynamoDB (Integration with API Gateway)',
    'GraphQL Lambda Authorizer',
    'Hello World',
    'Lambda trigger',
    'Serverless ExpressJS function (Integration with API Gateway)',
    'AppSync - GraphQL API request (with IAM)',
];
const pythonTemplateChoices = ['Hello World'];
const crudOptions = ['create', 'read', 'update', 'delete'];
const appSyncOptions = ['Query', 'Mutation', 'Subscription'];
const additionalPermissions = (cwd, chain, settings) => {
    (0, selectors_1.multiSelect)(chain.wait('Select the categories you want this function to have access to'), settings.permissions, settings.choices);
    if (!settings.resources) {
        return;
    }
    if (settings.resourceChoices === undefined) {
        settings.resourceChoices = settings.resources;
    }
    // when single resource, it gets autoselected
    if (settings.resourceChoices.length > 1) {
        chain.wait('Select the one you would like your Lambda to access');
        if (settings.keepExistingResourceSelection) {
            chain.sendCarriageReturn();
        }
        else {
            (0, selectors_1.multiSelect)(chain, settings.resources, settings.resourceChoices);
        }
    }
    // n-resources repeated questions
    settings.resources.forEach((elem) => {
        const service = lodash_1.default.get((0, __1.getBackendAmplifyMeta)(cwd), ['api', elem, 'service']);
        const gqlpermff = !!lodash_1.default.get((0, feature_flags_1.loadFeatureFlags)(cwd), ['features', 'appsync', 'generategraphqlpermissions']);
        const isAppSyncApi = service === 'AppSync';
        const allChoices = isAppSyncApi && gqlpermff ? appSyncOptions : crudOptions;
        (0, selectors_1.multiSelect)(chain.wait(`Select the operations you want to permit on ${elem}`), settings.operations, allChoices);
    });
};
const updateFunctionCore = (cwd, chain, settings) => {
    (0, selectors_1.singleSelect)(chain.wait('Which setting do you want to update?'), settings.additionalPermissions
        ? 'Resource access permissions'
        : settings.schedulePermissions
            ? 'Scheduled recurring invocation'
            : settings.layerOptions
                ? 'Lambda layers configuration'
                : settings.environmentVariables
                    ? 'Environment variables configuration'
                    : 'Secret values configuration', [
        'Resource access permissions',
        'Scheduled recurring invocation',
        'Lambda layers configuration',
        'Environment variables configuration',
        'Secret values configuration',
    ]);
    if (settings.additionalPermissions) {
        // update permissions
        additionalPermissions(cwd, chain, settings.additionalPermissions);
    }
    if (settings.schedulePermissions) {
        // update scheduling
        if (settings.schedulePermissions.noScheduleAdded) {
            chain.wait('Do you want to invoke this function on a recurring schedule?');
        }
        else {
            chain.wait(`Do you want to update or remove the function's schedule?`);
        }
        chain.sendConfirmYes();
        cronWalkthrough(chain, settings, settings.schedulePermissions.noScheduleAdded ? 'create' : 'update');
    }
    if (settings.layerOptions) {
        // update layers
        chain.wait('Do you want to enable Lambda layers for this function?');
        if (settings.layerOptions === undefined) {
            chain.sendConfirmNo();
        }
        else {
            chain.sendConfirmYes();
            addLayerWalkthrough(chain, settings.layerOptions);
        }
    }
    if (settings.secretsConfig) {
        if (settings.secretsConfig.operation === 'add') {
            throw new Error('Secres update walkthrough only supports update and delete');
        }
        // this walkthrough assumes 1 existing secret is configured for the function
        const actions = ['Add a secret', 'Update a secret', 'Remove secrets', "I'm done"];
        const action = settings.secretsConfig.operation === 'delete' ? actions[2] : actions[1];
        chain.wait('What do you want to do?');
        (0, selectors_1.singleSelect)(chain, action, actions);
        switch (settings.secretsConfig.operation) {
            case 'delete': {
                chain.wait('Select the secrets to delete:');
                chain.sendLine(' '); // assumes one secret
                break;
            }
            case 'update': {
                chain.wait('Select the secret to update:');
                chain.sendCarriageReturn(); // assumes one secret
                chain.sendLine(settings.secretsConfig.value);
                break;
            }
        }
        chain.wait('What do you want to do?');
        chain.sendCarriageReturn(); // "I'm done"
    }
};
const coreFunction = (cwd, settings, action, runtime, functionConfigCallback) => {
    return new Promise((resolve, reject) => {
        const chain = (0, __1.nspawn)((0, __1.getCLIPath)(settings.testingWithLatestCodebase), [action === 'update' ? 'update' : 'add', 'function'], {
            cwd,
            stripColors: true,
        });
        if (action === 'create') {
            chain
                .wait('Select which capability you want to add:')
                .sendCarriageReturn() // lambda function
                .wait('Provide an AWS Lambda function name:')
                .sendLine(settings.name || '');
            (0, exports.selectRuntime)(chain, runtime);
            const templateChoices = getTemplateChoices(runtime);
            if (templateChoices.length > 1) {
                (0, exports.selectTemplate)(chain, settings.functionTemplate, runtime);
            }
        }
        else {
            if (settings.layerOptions && settings.layerOptions.layerAndFunctionExist) {
                chain.wait('Select which capability you want to update:').sendCarriageReturn(); // lambda function
            }
            chain.wait('Select the Lambda function you want to update').sendCarriageReturn(); // assumes only one function configured in the project
        }
        if (functionConfigCallback) {
            functionConfigCallback(chain, cwd, settings);
        }
        if (settings.expectFailure) {
            runChain(chain, resolve, reject);
            return;
        }
        // advanced settings flow
        if (action === 'create') {
            chain.wait('Do you want to configure advanced settings?');
            if (settings.additionalPermissions ||
                settings.schedulePermissions ||
                settings.layerOptions ||
                settings.environmentVariables ||
                settings.secretsConfig) {
                chain.sendConfirmYes().wait('Do you want to access other resources in this project from your Lambda function?');
                if (settings.additionalPermissions) {
                    // other permissions flow
                    chain.sendConfirmYes();
                    additionalPermissions(cwd, chain, settings.additionalPermissions);
                }
                else {
                    chain.sendConfirmNo();
                }
                //scheduling questions
                chain.wait('Do you want to invoke this function on a recurring schedule?');
                if (settings.schedulePermissions === undefined) {
                    chain.sendConfirmNo();
                }
                else {
                    chain.sendConfirmYes();
                    cronWalkthrough(chain, settings, action);
                }
                // lambda layers question
                chain.wait('Do you want to enable Lambda layers for this function?');
                if (settings.layerOptions === undefined) {
                    chain.sendConfirmNo();
                }
                else {
                    chain.sendConfirmYes();
                    addLayerWalkthrough(chain, settings.layerOptions);
                }
                // environment variable question
                chain.wait('Do you want to configure environment variables for this function?');
                if (settings.environmentVariables === undefined) {
                    chain.sendConfirmNo();
                }
                else {
                    chain.sendConfirmYes();
                    addEnvVarWalkthrough(chain, settings.environmentVariables);
                }
                // secrets config
                chain.wait('Do you want to configure secret values this function can access?');
                if (settings.secretsConfig === undefined) {
                    chain.sendConfirmNo();
                }
                else {
                    if (settings.secretsConfig.operation !== 'add') {
                        throw new Error('add walkthrough only supports add secrets operation');
                    }
                    chain.sendConfirmYes();
                    addSecretWalkthrough(chain, settings.secretsConfig);
                }
            }
            else {
                chain.sendConfirmNo();
            }
        }
        else {
            updateFunctionCore(cwd, chain, settings);
        }
        // edit function question
        chain.wait('Do you want to edit the local lambda function now?').sendConfirmNo().sendEof();
        runChain(chain, resolve, reject);
    });
};
const runChain = (chain, resolve, reject) => {
    chain.run((err) => {
        if (!err) {
            resolve();
        }
        else {
            reject(err);
        }
    });
};
const addFunction = (cwd, settings, runtime, functionConfigCallback = undefined) => {
    return coreFunction(cwd, settings, 'create', runtime, functionConfigCallback);
};
exports.addFunction = addFunction;
const updateFunction = (cwd, settings, runtime) => {
    return coreFunction(cwd, settings, 'update', runtime, undefined);
};
exports.updateFunction = updateFunction;
const addLambdaTrigger = (chain, cwd, settings) => {
    chain = (0, selectors_1.singleSelect)(chain.wait('What event source do you want to associate with Lambda trigger'), settings.triggerType === 'Kinesis' ? 'Amazon Kinesis Stream' : 'Amazon DynamoDB Stream', ['Amazon DynamoDB Stream', 'Amazon Kinesis Stream']);
    const res = chain
        .wait(`Choose a ${settings.triggerType} event source option`)
        /**
         * Use API category graphql @model backed DynamoDB table(s) in the current Amplify project
         * or
         * Use storage category DynamoDB table configured in the current Amplify project
         */
        .sendLine(settings.eventSource === 'DynamoDB' ? __1.KEY_DOWN_ARROW : '');
    switch (settings.triggerType + (settings.eventSource || '')) {
        case 'DynamoDBAppSync':
            return settings.expectFailure ? res.wait('No AppSync resources have been configured in the API category.') : res;
        case 'DynamoDBDynamoDB':
            return settings.expectFailure
                ? res.wait('There are no DynamoDB resources configured in your project currently')
                : res.wait('Choose from one of the already configured DynamoDB tables').sendCarriageReturn();
        case 'Kinesis':
            return settings.expectFailure
                ? res.wait('No Kinesis streams resource to select. Please use "amplify add analytics" command to create a new Kinesis stream')
                : res;
        default:
            return res;
    }
};
exports.addLambdaTrigger = addLambdaTrigger;
const functionBuild = (cwd) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, __1.nspawn)((0, __1.getCLIPath)(), ['function', 'build'], { cwd, stripColors: true })
        .wait('Are you sure you want to continue building the resources?')
        .sendYes()
        .sendEof()
        .runAsync();
});
exports.functionBuild = functionBuild;
const selectRuntime = (chain, runtime) => {
    const runtimeName = getRuntimeDisplayName(runtime);
    chain.wait('Choose the runtime that you want to use:');
    // reset cursor to top of list because node is default but it throws off offset calculations
    (0, selectors_1.moveUp)(chain, exports.runtimeChoices.indexOf(getRuntimeDisplayName('nodejs')));
    (0, selectors_1.singleSelect)(chain, runtimeName, exports.runtimeChoices);
};
exports.selectRuntime = selectRuntime;
const selectTemplate = (chain, functionTemplate, runtime) => {
    const templateChoices = getTemplateChoices(runtime);
    chain.wait('Choose the function template that you want to use');
    // reset cursor to top of list because Hello World is default but it throws off offset calculations
    (0, selectors_1.moveUp)(chain, templateChoices.indexOf('Hello World'));
    (0, selectors_1.singleSelect)(chain, functionTemplate, templateChoices);
};
exports.selectTemplate = selectTemplate;
const createNewDynamoDBForCrudTemplate = (chain) => {
    chain.wait('Choose a DynamoDB data source option');
    (0, selectors_1.singleSelect)(chain, 'Create a new DynamoDB table', [
        'Use DynamoDB table configured in the current Amplify project',
        'Create a new DynamoDB table',
    ]);
    chain
        .wait('Provide a friendly name')
        .sendCarriageReturn()
        .wait('Provide table name')
        .sendCarriageReturn()
        .wait('What would you like to name this column')
        .sendLine('column1')
        .wait('Choose the data type')
        .sendCarriageReturn()
        .wait('Would you like to add another column?')
        .sendYes()
        .wait('What would you like to name this column')
        .sendLine('column2')
        .wait('Choose the data type')
        .sendCarriageReturn()
        .wait('Would you like to add another column?')
        .sendNo()
        .wait('Choose partition key for the table')
        .sendCarriageReturn()
        .wait('Do you want to add a sort key to your table?')
        .sendYes()
        .wait('Do you want to add global secondary indexes to your table?')
        .sendNo()
        .wait('Do you want to add a Lambda Trigger for your Table?')
        .sendNo();
};
exports.createNewDynamoDBForCrudTemplate = createNewDynamoDBForCrudTemplate;
const removeFunction = (cwd, funcName) => new Promise((resolve, reject) => {
    (0, __1.nspawn)((0, __1.getCLIPath)(), ['remove', 'function', funcName, '--yes'], { cwd, stripColors: true }).run((err) => err ? reject(err) : resolve());
});
exports.removeFunction = removeFunction;
const addLayerWalkthrough = (chain, options) => {
    if (options.layerWalkthrough) {
        options.layerWalkthrough(chain);
        return;
    }
    chain.wait('Provide existing layers');
    const hasCustomArns = options.customArns && options.customArns.length > 0;
    // If no select passed in then it was called from update function probably and
    // there is a layer already assigned and no need to change
    if (options.skipLayerAssignment === true) {
        chain.sendCarriageReturn();
    }
    else {
        const prependedListOptions = ['Provide existing Lambda layer ARNs', ...options.expectedListOptions];
        const amendedSelection = [...options.select];
        if (hasCustomArns) {
            amendedSelection.unshift('Provide existing Lambda layer ARNs');
        }
        (0, selectors_1.multiSelect)(chain, amendedSelection, prependedListOptions);
    }
    // If no versions present in options, skip the version selection prompt
    if (options.versions) {
        options.select.forEach((selection) => {
            chain.wait(`Select a version for ${selection}`);
            (0, selectors_1.singleSelect)(chain, options.versions[selection].version.toString(), [
                'Always choose latest version',
                ...options.versions[selection].expectedVersionOptions.map((op) => op.toString()),
            ]);
        });
    }
    if (hasCustomArns) {
        chain.wait('existing Lambda layer ARNs (comma-separated)');
        chain.sendLine(options.customArns.join(', '));
    }
    // not going to attempt to automate the reorder thingy. For e2e tests we can just create the lambda layers in the order we want them
    const totalLength = hasCustomArns ? options.customArns.length : 0 + options.select.length;
    if (totalLength > 1) {
        chain.wait('Modify the layer order');
        chain.sendCarriageReturn();
    }
};
const addEnvVarWalkthrough = (chain, input) => {
    chain.wait('Enter the environment variable name:').sendLine(input.key);
    chain.wait('Enter the environment variable value:').sendLine(input.value);
    chain.wait("I'm done").sendCarriageReturn();
};
const addSecretWalkthrough = (chain, input) => {
    chain.wait('Enter a secret name');
    chain.sendLine(input.name);
    chain.wait(`Enter the value for`);
    chain.sendLine(input.value);
    chain.wait("I'm done").sendCarriageReturn();
};
const cronWalkthrough = (chain, settings, action) => {
    if (action === 'create') {
        addCron(chain, settings);
    }
    else {
        chain.wait('Select from the following options:');
        switch (settings.schedulePermissions.action) {
            case 'Update the schedule':
                chain.sendCarriageReturn();
                addCron(chain, settings);
                break;
            case 'Remove the schedule':
                (0, selectors_1.moveDown)(chain, 1).sendCarriageReturn();
                break;
            default:
                chain.sendCarriageReturn();
                break;
        }
    }
    return chain;
};
const addminutes = (chain) => {
    chain.wait('Enter rate for minutes(1-59)?').sendLine('5').sendCarriageReturn();
    return chain;
};
const addhourly = (chain) => {
    chain.wait('Enter rate for hours(1-23)?').sendLine('5').sendCarriageReturn();
    return chain;
};
const addWeekly = (chain) => {
    chain
        .wait('Select the day to invoke the function:')
        .sendCarriageReturn()
        .wait('Select the start time in UTC (use arrow keys):')
        .sendCarriageReturn();
    return chain;
};
const addMonthly = (chain) => {
    chain.wait('Select date to start cron').sendCarriageReturn();
    return chain;
};
const addYearly = (chain) => {
    chain.wait('Select date to start cron').sendCarriageReturn();
    return chain;
};
const addCron = (chain, settings) => {
    chain.wait('At which interval should the function be invoked:');
    switch (settings.schedulePermissions.interval) {
        case 'Minutes':
            addminutes(chain);
            break;
        case 'Hourly':
            addhourly((0, selectors_1.moveDown)(chain, 1).sendCarriageReturn());
            break;
        case 'Daily':
            (0, selectors_1.moveDown)(chain, 2).sendCarriageReturn().wait('Select the start time in UTC (use arrow keys):').sendCarriageReturn();
            break;
        case 'Weekly':
            addWeekly((0, selectors_1.moveDown)(chain, 3).sendCarriageReturn());
            break;
        case 'Monthly':
            addMonthly((0, selectors_1.moveDown)(chain, 4).sendCarriageReturn());
            break;
        case 'Yearly':
            addYearly((0, selectors_1.moveDown)(chain, 5).sendCarriageReturn());
            break;
        case 'Custom AWS cron expression':
            (0, selectors_1.moveDown)(chain, 6).sendCarriageReturn();
            break;
        default:
            chain.sendCarriageReturn();
            break;
    }
    return chain;
};
const functionMockAssert = (cwd, settings, testingWithLatestCodebase = false) => {
    return new Promise((resolve, reject) => {
        const cliArgs = ['mock', 'function', settings.funcName, '--event', settings.eventFile].concat(settings.timeout ? ['--timeout', settings.timeout.toString()] : []);
        const chain = (0, __1.nspawn)((0, __1.getCLIPath)(testingWithLatestCodebase), cliArgs, { cwd, stripColors: true });
        chain.wait('Result:');
        if (settings.successString) {
            chain.wait(settings.successString);
        }
        chain
            .wait('Finished execution.')
            .sendEof()
            .run((err) => (err ? reject(err) : resolve()));
    });
};
exports.functionMockAssert = functionMockAssert;
const functionCloudInvoke = (cwd, settings) => __awaiter(void 0, void 0, void 0, function* () {
    const meta = (0, __1.getProjectMeta)(cwd);
    const lookupName = settings.funcName;
    expect(meta.function[lookupName]).toBeDefined();
    const { Name: functionName, Region: region } = meta.function[lookupName].output;
    expect(functionName).toBeDefined();
    expect(region).toBeDefined();
    const result = yield (0, __1.invokeFunction)(functionName, settings.payload, region);
    if (!result.$response.data) {
        throw new Error('No data in lambda response');
    }
    return result.$response.data;
});
exports.functionCloudInvoke = functionCloudInvoke;
const getTemplateChoices = (runtime) => {
    switch (runtime) {
        case 'dotnetCore31':
        case 'dotnet6':
            return dotNetTemplateChoices;
        case 'go':
            return goTemplateChoices;
        case 'java':
            return javaTemplateChoices;
        case 'nodejs':
            return nodeJSTemplateChoices;
        case 'python':
            return pythonTemplateChoices;
        default:
            throw new Error(`Invalid runtime value: ${runtime}`);
    }
};
const getRuntimeDisplayName = (runtime) => {
    switch (runtime) {
        case 'dotnetCore31':
        case 'dotnet6':
            return '.NET 6';
        case 'go':
            return 'Go';
        case 'java':
            return 'Java';
        case 'nodejs':
            return 'NodeJS';
        case 'python':
            return 'Python';
        default:
            throw new Error(`Invalid runtime value: ${runtime}`);
    }
};
function validateNodeModulesDirRemoval(projRoot) {
    const functionDir = path.join(projRoot, 'amplify', '#current-cloud-backend', 'function');
    const nodeModulesDirs = glob.sync('**/node_modules', {
        cwd: functionDir,
        absolute: true,
    });
    expect(nodeModulesDirs.length).toBe(0);
}
exports.validateNodeModulesDirRemoval = validateNodeModulesDirRemoval;
//# sourceMappingURL=lambda-function.js.map