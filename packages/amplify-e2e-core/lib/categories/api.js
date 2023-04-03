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
exports.validateRestApiMeta = exports.cancelAmplifyMockApi = exports.modifyRestAPI = exports.addRestContainerApiForCustomPolicies = exports.rebuildApi = exports.addRestContainerApi = exports.addApiWithCognitoUserPoolAuthTypeWhenAuthExists = exports.addApi = exports.updateRestApi = exports.addRestApi = exports.updateAPIWithResolutionStrategyWithModels = exports.updateAPIWithResolutionStrategyWithoutModels = exports.apiDisableDataStore = exports.apiEnableDataStore = exports.updateApiWithMultiAuth = exports.updateApiSchema = exports.addApiWithAllAuthModes = exports.addApiWithBlankSchemaAndConflictDetection = exports.addApiWithBlankSchema = exports.addApiWithThreeModels = exports.addApiWithOneModel = exports.addApiWithoutSchema = exports.defaultOptions = exports.apiGqlCompile = exports.getSchemaPath = void 0;
const fs = __importStar(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const path = __importStar(require("path"));
const __1 = require("..");
const selectors_1 = require("../utils/selectors");
const lambda_function_1 = require("./lambda-function");
const modified_api_index_1 = require("./resources/modified-api-index");
function getSchemaPath(schemaName) {
    return path.join(__dirname, '..', '..', '..', 'amplify-e2e-tests', 'schemas', schemaName);
}
exports.getSchemaPath = getSchemaPath;
function apiGqlCompile(cwd, testingWithLatestCodebase = false) {
    return new Promise((resolve, reject) => {
        (0, __1.nspawn)((0, __1.getCLIPath)(testingWithLatestCodebase), ['api', 'gql-compile'], { cwd, stripColors: true })
            .wait('GraphQL schema compiled successfully.')
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.apiGqlCompile = apiGqlCompile;
exports.defaultOptions = {
    apiName: '\r',
    testingWithLatestCodebase: false,
    transformerVersion: 2,
};
function addApiWithoutSchema(cwd, opts = {}) {
    const options = lodash_1.default.assign(exports.defaultOptions, opts);
    return new Promise((resolve, reject) => {
        (0, __1.nspawn)((0, __1.getCLIPath)(options.testingWithLatestCodebase), ['add', 'api'], { cwd, stripColors: true })
            .wait('Select from one of the below mentioned services:')
            .sendCarriageReturn()
            .wait(/.*Here is the GraphQL API that we will create. Select a setting to edit or continue.*/)
            .sendKeyUp(3)
            .sendCarriageReturn()
            .wait('Provide API name:')
            .sendLine(options.apiName)
            .wait(/.*Here is the GraphQL API that we will create. Select a setting to edit or continue.*/)
            .sendCarriageReturn()
            .wait('Choose a schema template:')
            .sendCarriageReturn()
            .wait('Do you want to edit the schema now?')
            .sendConfirmNo()
            .wait('"amplify publish" will build all your local backend and frontend resources')
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
        (0, __1.setTransformerVersionFlag)(cwd, options.transformerVersion);
    });
}
exports.addApiWithoutSchema = addApiWithoutSchema;
function addApiWithOneModel(cwd, opts = {}) {
    const options = lodash_1.default.assign(exports.defaultOptions, opts);
    return new Promise((resolve, reject) => {
        (0, __1.nspawn)((0, __1.getCLIPath)(options.testingWithLatestCodebase), ['add', 'api'], { cwd, stripColors: true })
            .wait('Select from one of the below mentioned services:')
            .sendCarriageReturn()
            .wait(/.*Here is the GraphQL API that we will create. Select a setting to edit or continue.*/)
            .sendCarriageReturn()
            .wait('Choose a schema template:')
            .sendCarriageReturn()
            .wait('Do you want to edit the schema now?')
            .sendConfirmNo()
            .wait('"amplify publish" will build all your local backend and frontend resources')
            .sendEof()
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
        (0, __1.setTransformerVersionFlag)(cwd, options.transformerVersion);
    });
}
exports.addApiWithOneModel = addApiWithOneModel;
function addApiWithThreeModels(cwd, opts = {}) {
    const options = lodash_1.default.assign(exports.defaultOptions, opts);
    return new Promise((resolve, reject) => {
        (0, __1.nspawn)((0, __1.getCLIPath)(options.testingWithLatestCodebase), ['add', 'api'], { cwd, stripColors: true })
            .wait('Select from one of the below mentioned services:')
            .sendCarriageReturn()
            .wait(/.*Here is the GraphQL API that we will create. Select a setting to edit or continue.*/)
            .sendCarriageReturn()
            .wait('Choose a schema template:')
            .sendKeyDown(1)
            .sendCarriageReturn()
            .wait('Do you want to edit the schema now?')
            .sendConfirmNo()
            .wait('"amplify publish" will build all your local backend and frontend resources')
            .sendEof()
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
        (0, __1.setTransformerVersionFlag)(cwd, options.transformerVersion);
    });
}
exports.addApiWithThreeModels = addApiWithThreeModels;
function addApiWithBlankSchema(cwd, opts = {}) {
    const options = lodash_1.default.assign(exports.defaultOptions, opts);
    return new Promise((resolve, reject) => {
        (0, __1.nspawn)((0, __1.getCLIPath)(options.testingWithLatestCodebase), ['add', 'api'], { cwd, stripColors: true })
            .wait('Select from one of the below mentioned services:')
            .sendCarriageReturn()
            .wait(/.*Here is the GraphQL API that we will create. Select a setting to edit or continue.*/)
            .sendKeyUp(3)
            .sendCarriageReturn()
            .wait('Provide API name:')
            .sendLine(options.apiName)
            .wait(/.*Here is the GraphQL API that we will create. Select a setting to edit or continue.*/)
            .sendCarriageReturn()
            .wait('Choose a schema template:')
            .sendKeyDown(2)
            .sendCarriageReturn()
            .wait('Do you want to edit the schema now?')
            .sendLine('n')
            .wait('"amplify publish" will build all your local backend and frontend resources')
            .sendEof()
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
        (0, __1.setTransformerVersionFlag)(cwd, options.transformerVersion);
    });
}
exports.addApiWithBlankSchema = addApiWithBlankSchema;
function addApiWithBlankSchemaAndConflictDetection(cwd, opts = {}) {
    const options = lodash_1.default.assign(exports.defaultOptions, opts);
    return new Promise((resolve, reject) => {
        (0, __1.nspawn)((0, __1.getCLIPath)(options.testingWithLatestCodebase), ['add', 'api'], { cwd, stripColors: true })
            .wait('Select from one of the below mentioned services:')
            .sendCarriageReturn()
            .wait(/.*Here is the GraphQL API that we will create. Select a setting to edit or continue.*/)
            .sendKeyUp()
            .sendCarriageReturn()
            .wait(/.*Enable conflict detection.*/)
            .sendConfirmYes()
            .wait(/.*Select the default resolution strategy.*/)
            .sendCarriageReturn()
            .wait(/.*Here is the GraphQL API that we will create. Select a setting to edit or continue.*/)
            .sendCarriageReturn()
            .wait('Choose a schema template:')
            .sendKeyDown(2)
            .sendCarriageReturn()
            .wait('Do you want to edit the schema now?')
            .sendLine('n')
            .wait('"amplify publish" will build all your local backend and frontend resources')
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
        (0, __1.setTransformerVersionFlag)(cwd, options.transformerVersion);
    });
}
exports.addApiWithBlankSchemaAndConflictDetection = addApiWithBlankSchemaAndConflictDetection;
/**
 * Note: Lambda Authorizer is enabled only for Transformer V2
 */
function addApiWithAllAuthModes(cwd, opts = {}) {
    const options = lodash_1.default.assign(exports.defaultOptions, opts);
    return new Promise((resolve, reject) => {
        (0, __1.nspawn)((0, __1.getCLIPath)(), ['add', 'api'], { cwd, stripColors: true })
            .wait('Select from one of the below mentioned services:')
            .sendCarriageReturn()
            .wait(/.*Here is the GraphQL API that we will create. Select a setting to edit or continue.*/)
            .sendKeyUp(3)
            .sendCarriageReturn()
            .wait('Provide API name:')
            .sendLine(options.apiName)
            .wait(/.*Here is the GraphQL API that we will create. Select a setting to edit or continue.*/)
            .sendKeyUp(2)
            .sendCarriageReturn()
            .wait(/.*Choose the default authorization type for the API.*/)
            .sendCarriageReturn()
            // API Key
            .wait(/.*Enter a description for the API key.*/)
            .sendLine('description')
            .wait(/.*After how many days from now the API key should expire.*/)
            .sendLine('300')
            .wait(/.*Configure additional auth types.*/)
            .sendConfirmYes()
            .wait(/.*Choose the additional authorization types you want to configure for the API.*/)
            .sendLine('a\r') // All items
            // Cognito
            .wait(/.*Do you want to use the default authentication and security configuration.*/)
            .sendCarriageReturn()
            .wait('How do you want users to be able to sign in?')
            .sendCarriageReturn()
            .wait('Do you want to configure advanced settings?')
            .sendCarriageReturn()
            // OIDC
            .wait(/.*Enter a name for the OpenID Connect provider:.*/)
            // eslint-disable-next-line spellcheck/spell-checker
            .sendLine('myoidcprovider')
            .wait(/.*Enter the OpenID Connect provider domain \(Issuer URL\).*/)
            .sendLine('https://facebook.com/')
            .wait(/.*Enter the Client Id from your OpenID Client Connect application.*/)
            .sendLine('clientId')
            .wait(/.*Enter the number of milliseconds a token is valid after being issued to a user.*/)
            .sendLine('1000')
            .wait(/.*Enter the number of milliseconds a token is valid after being authenticated.*/)
            .sendLine('2000')
            // Lambda
            .wait(/.*Choose a Lambda authorization function*/)
            .sendCarriageReturn()
            .wait(/.*Do you want to edit the local lambda function now*/)
            .sendConfirmNo()
            .wait(/.*How long should the authorization response be cached in seconds.*/)
            .sendLine('600')
            .wait(/.*Here is the GraphQL API that we will create. Select a setting to edit or continue.*/)
            .sendCarriageReturn()
            // Schema selection
            .wait('Choose a schema template:')
            .sendKeyDown(2)
            .sendCarriageReturn()
            .wait('Do you want to edit the schema now?')
            .sendConfirmNo()
            .wait('"amplify publish" will build all your local backend and frontend resources')
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
        (0, __1.setTransformerVersionFlag)(cwd, options.transformerVersion);
    });
}
exports.addApiWithAllAuthModes = addApiWithAllAuthModes;
function updateApiSchema(cwd, projectName, schemaName, forceUpdate = false) {
    const testSchemaPath = getSchemaPath(schemaName);
    let schemaText = fs.readFileSync(testSchemaPath).toString();
    if (forceUpdate) {
        schemaText += '  ';
    }
    (0, __1.updateSchema)(cwd, projectName, schemaText);
}
exports.updateApiSchema = updateApiSchema;
function updateApiWithMultiAuth(cwd, settings) {
    return new Promise((resolve, reject) => {
        var _a, _b;
        const testingWithLatestCodebase = (_a = settings === null || settings === void 0 ? void 0 : settings.testingWithLatestCodebase) !== null && _a !== void 0 ? _a : false;
        const chain = (0, __1.nspawn)((0, __1.getCLIPath)(testingWithLatestCodebase), ['update', 'api'], { cwd, stripColors: true });
        chain.wait('Select from one of the below mentioned services:').sendCarriageReturn();
        const doMigrate = (_b = settings === null || settings === void 0 ? void 0 : settings.doMigrate) !== null && _b !== void 0 ? _b : testingWithLatestCodebase;
        if (testingWithLatestCodebase) {
            chain.wait('Do you want to migrate api resource');
            if (doMigrate) {
                chain.sendConfirmYes();
            }
            else {
                chain.sendConfirmNo();
            }
        }
        chain
            .wait(/.*Select a setting to edit.*/)
            .sendCarriageReturn()
            .wait(/.*Choose the default authorization type for the API.*/)
            .sendCarriageReturn()
            .wait(/.*Enter a description for the API key.*/)
            .sendLine('description')
            .wait(/.*After how many days from now the API key should expire.*/)
            .sendLine('300')
            .wait(/.*Configure additional auth types.*/)
            .sendConfirmYes()
            .wait(/.*Choose the additional authorization types you want to configure for the API.*/)
            .sendLine('a') // All items
            // Cognito
            .wait(/.*Do you want to use the default authentication and security configuration.*/)
            .sendCarriageReturn()
            .wait('How do you want users to be able to sign in?')
            .sendCarriageReturn()
            .wait('Do you want to configure advanced settings?')
            .sendCarriageReturn()
            // OIDC
            .wait(/.*Enter a name for the OpenID Connect provider:.*/)
            // eslint-disable-next-line spellcheck/spell-checker
            .sendLine('myoidcprovider')
            .wait(/.*Enter the OpenID Connect provider domain \(Issuer URL\).*/)
            .sendLine('https://facebook.com/')
            .wait(/.*Enter the Client Id from your OpenID Client Connect application.*/)
            .sendLine('clientId')
            .wait(/.*Enter the number of milliseconds a token is valid after being issued to a user.*/)
            .sendLine('1000')
            .wait(/.*Enter the number of milliseconds a token is valid after being authenticated.*/)
            .sendLine('2000')
            .wait(/.*Successfully updated resource.*/)
            .sendEof()
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.updateApiWithMultiAuth = updateApiWithMultiAuth;
function apiEnableDataStore(cwd, settings) {
    return new Promise((resolve, reject) => {
        (0, __1.nspawn)((0, __1.getCLIPath)(settings.testingWithLatestCodebase), ['update', 'api'], { cwd, stripColors: true })
            .wait('Select from one of the below mentioned services:')
            .sendCarriageReturn()
            .wait(/.*Select a setting to edit.*/)
            .sendKeyDown()
            .sendCarriageReturn()
            .wait(/.*Select the default resolution strategy.*/)
            .sendCarriageReturn()
            .wait(/.*Do you want to override default per model settings?.*/)
            .sendConfirmNo()
            .wait(/.*Successfully updated resource.*/)
            .sendEof()
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.apiEnableDataStore = apiEnableDataStore;
function apiDisableDataStore(cwd, settings) {
    return new Promise((resolve, reject) => {
        (0, __1.nspawn)((0, __1.getCLIPath)(settings.testingWithLatestCodebase), ['update', 'api'], { cwd, stripColors: true })
            .wait('Select from one of the below mentioned services:')
            .sendCarriageReturn()
            .wait(/.*Select a setting to edit.*/)
            .sendKeyDown(2) // Disable conflict detection
            .sendCarriageReturn()
            .wait(/.*Successfully updated resource.*/)
            .sendEof()
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.apiDisableDataStore = apiDisableDataStore;
function updateAPIWithResolutionStrategyWithoutModels(cwd, settings) {
    return new Promise((resolve, reject) => {
        (0, __1.nspawn)((0, __1.getCLIPath)(settings.testingWithLatestCodebase), ['update', 'api'], { cwd, stripColors: true })
            .wait('Select from one of the below mentioned services:')
            .sendCarriageReturn()
            .wait(/.*Select a setting to edit.*/)
            .sendKeyDown()
            .sendCarriageReturn()
            .wait(/.*Select the default resolution strategy.*/)
            .sendKeyDown()
            .sendCarriageReturn()
            .wait(/.*Successfully updated resource.*/)
            .sendEof()
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.updateAPIWithResolutionStrategyWithoutModels = updateAPIWithResolutionStrategyWithoutModels;
function updateAPIWithResolutionStrategyWithModels(cwd, settings) {
    return new Promise((resolve, reject) => {
        var _a;
        const testingWithLatestCodebase = (_a = settings === null || settings === void 0 ? void 0 : settings.testingWithLatestCodebase) !== null && _a !== void 0 ? _a : false;
        const chain = (0, __1.nspawn)((0, __1.getCLIPath)(testingWithLatestCodebase), ['update', 'api'], { cwd, stripColors: true });
        chain.wait('Select from one of the below mentioned services:').sendCarriageReturn();
        if (testingWithLatestCodebase === true) {
            chain.wait('Do you want to migrate api resource').sendYes();
        }
        chain
            .wait(/.*Select a setting to edit.*/)
            .sendKeyDown()
            .sendCarriageReturn()
            .wait(/.*Select the default resolution strategy.*/)
            .sendKeyDown()
            .sendCarriageReturn()
            .wait(/.*Do you want to override default per model settings?.*/)
            .sendConfirmNo()
            .wait(/.*Successfully updated resource.*/)
            .sendEof()
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.updateAPIWithResolutionStrategyWithModels = updateAPIWithResolutionStrategyWithModels;
function addRestApi(cwd, settings) {
    var _a;
    const isFirstRestApi = (_a = settings.isFirstRestApi) !== null && _a !== void 0 ? _a : true;
    const chain = (0, __1.nspawn)((0, __1.getCLIPath)(), ['add', 'api'], { cwd, stripColors: true })
        .wait('Select from one of the below mentioned services')
        .sendKeyDown()
        .sendCarriageReturn(); // REST
    if (!isFirstRestApi) {
        chain.wait('Would you like to add a new path to an existing REST API');
        if (settings.path) {
            chain
                .sendYes()
                .wait('Select the REST API you want to update')
                .sendCarriageReturn() // Select the first REST API
                .wait('What would you like to do?')
                .sendCarriageReturn() // Add another path
                .wait('Provide a path')
                .sendLine(settings.path)
                .wait('Choose a lambda source');
            if (settings.existingLambda) {
                chain
                    .sendKeyDown()
                    .sendCarriageReturn() // Existing lambda
                    .wait('Choose the Lambda function to invoke by this path');
                if (settings.projectContainsFunctions) {
                    chain.sendCarriageReturn(); // Pick first one
                }
            }
            else {
                chooseLambdaFunctionForRestApi(chain, settings);
            }
            protectAPI(settings, chain);
            chain.wait('Do you want to add another path').sendNo().sendEof();
            return chain.runAsync();
        }
        chain.sendNo();
    }
    chain.wait('Provide a friendly name for your resource to be used as a label for this category in the project');
    if (settings.apiName) {
        chain.sendLine(settings.apiName);
    }
    else {
        chain.sendCarriageReturn();
    }
    chain.wait('Provide a path').sendCarriageReturn().wait('Choose a lambda source');
    if (settings.existingLambda) {
        chain
            .sendKeyDown()
            .sendCarriageReturn() // Existing lambda
            .wait('Choose the Lambda function to invoke by this path'); // Expect only 1 Lambda is present
    }
    else {
        chooseLambdaFunctionForRestApi(chain, settings);
    }
    protectAPI(settings, chain);
    chain.wait('Do you want to add another path').sendNo().sendEof();
    return chain.runAsync();
}
exports.addRestApi = addRestApi;
function protectAPI(settings, chain) {
    chain.wait('Restrict API access');
    if (settings.restrictAccess) {
        chain.sendYes();
        if (settings.hasUserPoolGroups) {
            chain.wait('Restrict access by').sendCarriageReturn(); // Auth/Guest Users
        }
        chain.wait('Who should have access');
        if (settings.allowGuestUsers) {
            chain
                .sendKeyDown()
                .sendCarriageReturn() // Authenticated and Guest users
                .wait('What permissions do you want to grant to Authenticated users')
                .selectAll() // CRUD permissions for authenticated users
                .wait('What permissions do you want to grant to Guest users')
                .selectAll(); // CRUD permissions for guest users
        }
        else {
            chain
                .sendCarriageReturn() // Authenticated users only
                .wait('What permissions do you want to grant to Authenticated users')
                .selectAll(); // CRUD permissions
        }
    }
    else {
        chain.sendNo();
    }
}
function chooseLambdaFunctionForRestApi(chain, settings) {
    if (settings.projectContainsFunctions) {
        chain.sendCarriageReturn(); // Create new Lambda function
    }
    chain.wait('Provide an AWS Lambda function name').sendCarriageReturn();
    (0, lambda_function_1.selectRuntime)(chain, 'nodejs');
    const templateName = settings.isCrud
        ? 'CRUD function for DynamoDB (Integration with API Gateway)'
        : 'Serverless ExpressJS function (Integration with API Gateway)';
    (0, lambda_function_1.selectTemplate)(chain, templateName, 'nodejs');
    if (settings.isCrud) {
        chain
            .wait('Choose a DynamoDB data source option')
            .sendCarriageReturn() // Use DDB table configured in current project
            .wait('Choose from one of the already configured DynamoDB tables')
            .sendCarriageReturn(); // Use first one in the list
    }
    chain
        .wait('Do you want to configure advanced settings?')
        .sendConfirmNo()
        .wait('Do you want to edit the local lambda function now')
        .sendConfirmNo();
}
const updateRestApiDefaultSettings = {
    updateOperation: 'Add another path',
    expectMigration: false,
    newPath: '/foo',
    testingWithLatestCodebase: false,
};
function updateRestApi(cwd, settings = {}) {
    const completeSettings = Object.assign(Object.assign({}, updateRestApiDefaultSettings), settings);
    const chain = (0, __1.nspawn)((0, __1.getCLIPath)(settings.testingWithLatestCodebase), ['update', 'api'], { cwd, stripColors: true })
        .wait('Select from one of the below mentioned services')
        .sendKeyDown()
        .sendCarriageReturn()
        .wait('What would you like to do')
        .sendLine(completeSettings.updateOperation);
    if (completeSettings.expectMigration) {
        chain.wait('A migration is needed to support latest updates on api resources.').sendYes();
    }
    switch (completeSettings.updateOperation) {
        case 'Add another path':
            chain
                .wait('Provide a path')
                .sendLine(completeSettings.newPath)
                .wait('Choose a Lambda source')
                .sendLine('Use a Lambda function already added in the current Amplify project');
            // assumes only one function in the project. otherwise, need to update to handle function selection here
            break;
        default:
            throw new Error(`updateOperation ${completeSettings.updateOperation} is not implemented`);
    }
    chain.wait('Restrict API access').sendNo().wait('Do you want to add another path').sendNo().wait('Successfully updated resource');
    return chain.runAsync();
}
exports.updateRestApi = updateRestApi;
const allAuthTypes = ['API key', 'Amazon Cognito User Pool', 'IAM', 'OpenID Connect'];
function addApi(projectDir, authTypesConfig, requireAuthSetup = true) {
    var _a;
    const transformerVersion = (_a = authTypesConfig === null || authTypesConfig === void 0 ? void 0 : authTypesConfig.transformerVersion) !== null && _a !== void 0 ? _a : 2;
    authTypesConfig === null || authTypesConfig === void 0 ? true : delete authTypesConfig.transformerVersion;
    let authTypesToSelectFrom = allAuthTypes.slice();
    return new Promise((resolve, reject) => {
        const chain = (0, __1.nspawn)((0, __1.getCLIPath)(exports.defaultOptions.testingWithLatestCodebase), ['add', 'api'], { cwd: projectDir, stripColors: true })
            .wait('Select from one of the below mentioned services:')
            .sendCarriageReturn();
        if (authTypesConfig && Object.keys(authTypesConfig).length > 0) {
            const authTypesToAdd = Object.keys(authTypesConfig);
            const defaultType = authTypesToAdd[0];
            chain
                .wait(/.*Here is the GraphQL API that we will create. Select a setting to edit or continue.*/)
                .sendKeyUp(2)
                .sendCarriageReturn();
            (0, selectors_1.singleSelect)(chain.wait('Choose the default authorization type for the API'), defaultType, authTypesToSelectFrom);
            if (requireAuthSetup)
                setupAuthType(defaultType, chain, authTypesConfig);
            if (authTypesToAdd.length > 1) {
                authTypesToAdd.shift();
                chain.wait('Configure additional auth types?').sendConfirmYes();
                authTypesToSelectFrom = authTypesToSelectFrom.filter((x) => x !== defaultType);
                (0, selectors_1.multiSelect)(chain.wait('Choose the additional authorization types you want to configure for the API'), authTypesToAdd, authTypesToSelectFrom);
                authTypesToAdd.forEach((authType) => {
                    if (requireAuthSetup)
                        setupAuthType(authType, chain, authTypesConfig);
                });
            }
            else {
                chain.wait('Configure additional auth types?').sendLine('n');
            }
        }
        chain
            .wait(/.*Here is the GraphQL API that we will create. Select a setting to edit or continue.*/)
            .sendCarriageReturn()
            .wait('Choose a schema template:')
            .sendCarriageReturn()
            .wait('Do you want to edit the schema now?')
            .sendConfirmNo()
            .wait('"amplify publish" will build all your local backend and frontend resources')
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
        if (transformerVersion === 1) {
            (0, __1.addFeatureFlag)(projectDir, 'graphqltransformer', 'transformerVersion', 1);
            (0, __1.addFeatureFlag)(projectDir, 'graphqltransformer', 'useExperimentalPipelinedTransformer', false);
        }
    });
}
exports.addApi = addApi;
function setupAuthType(authType, chain, settings) {
    switch (authType) {
        case 'API key':
            setupAPIKey(chain);
            break;
        case 'Amazon Cognito User Pool':
            setupCognitoUserPool(chain);
            break;
        case 'IAM':
            // no-op
            break;
        case 'OpenID Connect':
            setupOIDC(chain, settings);
            break;
        default:
            throw new Error(`Unknown auth type ${authType}`);
    }
}
function setupAPIKey(chain) {
    chain
        .wait('Enter a description for the API key')
        .sendCarriageReturn()
        .wait('After how many days from now the API key should expire')
        .sendCarriageReturn();
}
function setupCognitoUserPool(chain) {
    chain
        .wait('Do you want to use the default authentication and security configuration')
        .sendCarriageReturn()
        .wait('How do you want users to be able to sign in')
        .sendCarriageReturn()
        .wait('Do you want to configure advanced settings?')
        .sendCarriageReturn();
}
function setupOIDC(chain, settings) {
    if (!settings || !settings['OpenID Connect']) {
        throw new Error('Must provide OIDC auth settings.');
    }
    chain
        .wait('Enter a name for the OpenID Connect provider')
        .send(settings['OpenID Connect'].oidcProviderName)
        .sendCarriageReturn()
        .wait('Enter the OpenID Connect provider domain')
        .send(settings['OpenID Connect'].oidcProviderDomain)
        .sendCarriageReturn()
        .wait('Enter the Client Id from your OpenID Client Connect application (optional)')
        .send(settings['OpenID Connect'].oidcClientId)
        .sendCarriageReturn()
        .wait('Enter the number of milliseconds a token is valid after being issued to a user')
        .send(settings['OpenID Connect'].ttlaIssueInMillisecond)
        .sendCarriageReturn()
        .wait('Enter the number of milliseconds a token is valid after being authenticated')
        .send(settings['OpenID Connect'].ttlaAuthInMillisecond)
        .sendCarriageReturn();
}
function addApiWithCognitoUserPoolAuthTypeWhenAuthExists(projectDir, opts = {}) {
    const options = lodash_1.default.assign(exports.defaultOptions, opts);
    return new Promise((resolve, reject) => {
        (0, __1.nspawn)((0, __1.getCLIPath)(options.testingWithLatestCodebase), ['add', 'api'], { cwd: projectDir, stripColors: true })
            .wait('Select from one of the below mentioned services:')
            .sendCarriageReturn()
            .wait(/.*Here is the GraphQL API that we will create. Select a setting to edit or continue.*/)
            .sendKeyUp(2)
            .sendCarriageReturn()
            .wait(/.*Choose the default authorization type for the API.*/)
            .sendKeyDown(1)
            .sendCarriageReturn()
            .wait(/.*Configure additional auth types.*/)
            .sendLine('n')
            .wait(/.*Here is the GraphQL API that we will create. Select a setting to edit or continue.*/)
            .sendCarriageReturn()
            .wait('Choose a schema template:')
            .sendCarriageReturn()
            .wait('Do you want to edit the schema now?')
            .sendConfirmNo()
            .wait('"amplify publish" will build all your local backend and frontend resources')
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
        (0, __1.setTransformerVersionFlag)(projectDir, options.transformerVersion);
    });
}
exports.addApiWithCognitoUserPoolAuthTypeWhenAuthExists = addApiWithCognitoUserPoolAuthTypeWhenAuthExists;
function addRestContainerApi(projectDir, opts = {}) {
    const options = lodash_1.default.assign(exports.defaultOptions, opts);
    return new Promise((resolve, reject) => {
        (0, __1.nspawn)((0, __1.getCLIPath)(), ['add', 'api'], { cwd: projectDir, stripColors: true })
            .wait('Select from one of the below mentioned services:')
            .sendKeyDown()
            .sendCarriageReturn()
            .wait('Which service would you like to use')
            .sendKeyDown()
            .sendCarriageReturn()
            .wait('Provide a friendly name for your resource to be used as a label for this category in the project:')
            .send(options.apiName)
            .sendCarriageReturn()
            .wait('What image would you like to use')
            .sendKeyDown()
            .sendCarriageReturn()
            .wait('When do you want to build & deploy the Fargate task')
            .sendCarriageReturn()
            .wait('Do you want to restrict API access')
            .sendConfirmNo()
            // eslint-disable-next-line spellcheck/spell-checker
            .wait('Select which container is the entrypoint')
            .sendCarriageReturn()
            .wait('"amplify publish" will build all your local backend and frontend resources')
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.addRestContainerApi = addRestContainerApi;
function rebuildApi(projDir, apiName) {
    return new Promise((resolve, reject) => {
        (0, __1.nspawn)((0, __1.getCLIPath)(), ['rebuild', 'api'], { cwd: projDir, stripColors: true })
            .wait('Type the name of the API to confirm you want to continue')
            .sendLine(apiName)
            .run((err) => (err ? reject(err) : resolve()));
    });
}
exports.rebuildApi = rebuildApi;
function addRestContainerApiForCustomPolicies(projectDir, settings) {
    return new Promise((resolve, reject) => {
        (0, __1.nspawn)((0, __1.getCLIPath)(), ['add', 'api'], { cwd: projectDir, stripColors: true })
            .wait('Select from one of the below mentioned services:')
            .sendKeyDown()
            .sendCarriageReturn()
            .wait('Which service would you like to use')
            .sendKeyDown()
            .sendCarriageReturn()
            .wait('Provide a friendly name for your resource to be used as a label for this category in the project:')
            .send(settings.name)
            .sendCarriageReturn()
            .wait('What image would you like to use')
            .sendKeyDown()
            .sendCarriageReturn()
            .wait('When do you want to build & deploy the Fargate task')
            .sendCarriageReturn()
            .wait('Do you want to restrict API access')
            .sendConfirmNo()
            // eslint-disable-next-line spellcheck/spell-checker
            .wait('Select which container is the entrypoint')
            .sendCarriageReturn()
            .wait('"amplify publish" will build all your local backend and frontend resources')
            .run((err) => (err ? reject(err) : resolve()));
    });
}
exports.addRestContainerApiForCustomPolicies = addRestContainerApiForCustomPolicies;
function modifyRestAPI(projectDir, apiName) {
    const indexFilePath = path.join(projectDir, 'amplify', 'backend', 'api', apiName, 'src', 'express', 'index.js');
    fs.writeFileSync(indexFilePath, modified_api_index_1.modifiedApi);
}
exports.modifyRestAPI = modifyRestAPI;
function cancelAmplifyMockApi(cwd) {
    return new Promise((resolve, reject) => {
        (0, __1.nspawn)((0, __1.getCLIPath)(), ['mock', 'api'], { cwd, stripColors: true })
            .wait('AppSync Mock endpoint is running')
            .sendCtrlC()
            .run((err) => {
            if (err && !/Killed the process as no output receive for/.test(err.message)) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
}
exports.cancelAmplifyMockApi = cancelAmplifyMockApi;
function validateRestApiMeta(projRoot, meta) {
    return __awaiter(this, void 0, void 0, function* () {
        meta = meta !== null && meta !== void 0 ? meta : (0, __1.getProjectMeta)(projRoot);
        expect(meta.providers.awscloudformation).toBeDefined();
        const { AuthRoleArn: authRoleArn, UnauthRoleArn: unauthRoleArn, DeploymentBucketName: bucketName, Region: region, StackId: stackId, } = meta.providers.awscloudformation;
        expect(authRoleArn).toBeDefined();
        expect(unauthRoleArn).toBeDefined();
        expect(region).toBeDefined();
        expect(stackId).toBeDefined();
        const bucketExists = yield (0, __1.checkIfBucketExists)(bucketName, region);
        expect(bucketExists).toMatchObject({});
        expect(meta.function).toBeDefined();
        let seenAtLeastOneFunc = false;
        for (const key of Object.keys(meta.function)) {
            const { service, build, lastBuildTimeStamp, lastPackageTimeStamp, distZipFilename, lastPushTimeStamp, lastPushDirHash } = meta.function[key];
            expect(service).toBe('Lambda');
            expect(build).toBeTruthy();
            expect(lastBuildTimeStamp).toBeDefined();
            expect(lastPackageTimeStamp).toBeDefined();
            expect(distZipFilename).toBeDefined();
            expect(lastPushTimeStamp).toBeDefined();
            expect(lastPushDirHash).toBeDefined();
            seenAtLeastOneFunc = true;
        }
        expect(seenAtLeastOneFunc).toBe(true);
    });
}
exports.validateRestApiMeta = validateRestApiMeta;
//# sourceMappingURL=api.js.map