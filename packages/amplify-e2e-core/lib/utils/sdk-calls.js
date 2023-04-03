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
exports.listGeofences = exports.getGeofence = exports.getGeofenceCollection = exports.getPlaceIndex = exports.getMap = exports.expectParametersOptionalValue = exports.getAllSSMParamatersForAppId = exports.getSSMParametersCategoryPrefix = exports.deleteSSMParameter = exports.getSSMParameters = exports.getPermissionsBoundary = exports.listAttachedRolePolicies = exports.listRolePolicies = exports.getAmplifyBackendJobStatus = exports.setupAmplifyAdminUI = exports.getCloudWatchEventRule = exports.putKinesisRecords = exports.getTableResourceId = exports.getNestedStackID = exports.describeCloudFormationStack = exports.getCloudWatchLogs = exports.getAppSyncApi = exports.scanTable = exports.putItemInTable = exports.deleteTable = exports.getEventSourceMappings = exports.getTable = exports.getCollection = exports.invokeFunction = exports.listVersions = exports.getLayerVersion = exports.getFunction = exports.getBot = exports.listUserPoolGroupsForUser = exports.addUserToUserPool = exports.getUserPoolClients = exports.getLambdaFunction = exports.getMFAConfiguration = exports.getUserPool = exports.deleteS3Bucket = exports.getDeploymentBucketObject = exports.getBucketKeys = exports.getBucketEncryption = exports.bucketNotExists = exports.checkIfBucketExists = exports.getDDBTable = void 0;
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable no-return-await */
const aws_sdk_1 = require("aws-sdk");
const path = __importStar(require("path"));
const lodash_1 = __importDefault(require("lodash"));
const projectMeta_1 = require("./projectMeta");
const getDDBTable = (tableName, region) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new aws_sdk_1.DynamoDB({ region });
    if (tableName) {
        return yield service.describeTable({ TableName: tableName }).promise();
    }
    return undefined;
});
exports.getDDBTable = getDDBTable;
const checkIfBucketExists = (bucketName, region) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new aws_sdk_1.S3({ region });
    return yield service.headBucket({ Bucket: bucketName }).promise();
});
exports.checkIfBucketExists = checkIfBucketExists;
const bucketNotExists = (bucket) => __awaiter(void 0, void 0, void 0, function* () {
    const s3 = new aws_sdk_1.S3();
    const params = {
        Bucket: bucket,
        $waiter: { maxAttempts: 10, delay: 30 },
    };
    try {
        yield s3.waitFor('bucketNotExists', params).promise();
        return true;
    }
    catch (error) {
        if (error.statusCode === 200) {
            return false;
        }
        throw error;
    }
});
exports.bucketNotExists = bucketNotExists;
const getBucketEncryption = (bucket) => __awaiter(void 0, void 0, void 0, function* () {
    const s3 = new aws_sdk_1.S3();
    const params = {
        Bucket: bucket,
    };
    try {
        const result = yield s3.getBucketEncryption(params).promise();
        return result.ServerSideEncryptionConfiguration;
    }
    catch (err) {
        throw new Error(`Error fetching SSE info for bucket ${bucket}. Underlying error was [${err.message}]`);
    }
});
exports.getBucketEncryption = getBucketEncryption;
const getBucketKeys = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const s3 = new aws_sdk_1.S3();
    try {
        const result = yield s3.listObjects(params).promise();
        return result.Contents.map((contentObj) => contentObj.Key);
    }
    catch (err) {
        throw new Error(`Error fetching keys for bucket ${params.Bucket}. Underlying error was [${err.message}]`);
    }
});
exports.getBucketKeys = getBucketKeys;
const getDeploymentBucketObject = (projectRoot, objectKey) => __awaiter(void 0, void 0, void 0, function* () {
    const meta = (0, projectMeta_1.getProjectMeta)(projectRoot);
    const deploymentBucket = meta.providers.awscloudformation.DeploymentBucketName;
    const s3 = new aws_sdk_1.S3();
    const result = yield s3
        .getObject({
        Bucket: deploymentBucket,
        Key: objectKey,
    })
        .promise();
    return result.Body.toLocaleString();
});
exports.getDeploymentBucketObject = getDeploymentBucketObject;
const deleteS3Bucket = (bucket, providedS3Client = undefined) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const s3 = providedS3Client || new aws_sdk_1.S3();
    let continuationToken;
    const objectKeyAndVersion = [];
    let truncated = false;
    do {
        const results = yield s3
            .listObjectVersions(Object.assign({ Bucket: bucket }, continuationToken))
            .promise();
        (_a = results.Versions) === null || _a === void 0 ? void 0 : _a.forEach(({ Key, VersionId }) => {
            objectKeyAndVersion.push({ Key, VersionId });
        });
        (_b = results.DeleteMarkers) === null || _b === void 0 ? void 0 : _b.forEach(({ Key, VersionId }) => {
            objectKeyAndVersion.push({ Key, VersionId });
        });
        continuationToken = { KeyMarker: results.NextKeyMarker, VersionIdMarker: results.NextVersionIdMarker };
        truncated = results.IsTruncated;
    } while (truncated);
    const chunkedResult = lodash_1.default.chunk(objectKeyAndVersion, 1000);
    const deleteReq = chunkedResult
        .map((r) => ({
        Bucket: bucket,
        Delete: {
            Objects: r,
            Quiet: true,
        },
    }))
        .map((delParams) => s3.deleteObjects(delParams).promise());
    yield Promise.all(deleteReq);
    yield s3
        .deleteBucket({
        Bucket: bucket,
    })
        .promise();
    yield (0, exports.bucketNotExists)(bucket);
});
exports.deleteS3Bucket = deleteS3Bucket;
const getUserPool = (userpoolId, region) => __awaiter(void 0, void 0, void 0, function* () {
    aws_sdk_1.config.update({ region });
    let res;
    try {
        res = yield new aws_sdk_1.CognitoIdentityServiceProvider().describeUserPool({ UserPoolId: userpoolId }).promise();
    }
    catch (e) {
        console.log(e);
    }
    return res;
});
exports.getUserPool = getUserPool;
const getMFAConfiguration = (userPoolId, region) => __awaiter(void 0, void 0, void 0, function* () {
    aws_sdk_1.config.update({ region });
    return yield new aws_sdk_1.CognitoIdentityServiceProvider().getUserPoolMfaConfig({ UserPoolId: userPoolId }).promise();
});
exports.getMFAConfiguration = getMFAConfiguration;
const getLambdaFunction = (functionName, region) => __awaiter(void 0, void 0, void 0, function* () {
    const lambda = new aws_sdk_1.Lambda({ region });
    try {
        return yield lambda.getFunction({ FunctionName: functionName }).promise();
    }
    catch (e) {
        console.log(e);
    }
    return undefined;
});
exports.getLambdaFunction = getLambdaFunction;
const getUserPoolClients = (userPoolId, clientIds, region) => __awaiter(void 0, void 0, void 0, function* () {
    const provider = new aws_sdk_1.CognitoIdentityServiceProvider({ region });
    const res = [];
    try {
        for (let i = 0; i < clientIds.length; i++) {
            const clientData = yield provider
                .describeUserPoolClient({
                UserPoolId: userPoolId,
                ClientId: clientIds[i],
            })
                .promise();
            res.push(clientData);
        }
    }
    catch (e) {
        console.log(e);
    }
    return res;
});
exports.getUserPoolClients = getUserPoolClients;
const addUserToUserPool = (userPoolId, region) => __awaiter(void 0, void 0, void 0, function* () {
    const provider = new aws_sdk_1.CognitoIdentityServiceProvider({ region });
    const params = {
        UserPoolId: userPoolId,
        UserAttributes: [{ Name: 'email', Value: 'username@amazon.com' }],
        Username: 'testUser',
        MessageAction: 'SUPPRESS',
        TemporaryPassword: 'password',
    };
    yield provider.adminCreateUser(params).promise();
});
exports.addUserToUserPool = addUserToUserPool;
/**
 * list all userPool groups to which a user belongs to
 */
const listUserPoolGroupsForUser = (userPoolId, userName, region) => __awaiter(void 0, void 0, void 0, function* () {
    const provider = new aws_sdk_1.CognitoIdentityServiceProvider({ region });
    const params = {
        UserPoolId: userPoolId /* required */,
        Username: userName /* required */,
    };
    const res = yield provider.adminListGroupsForUser(params).promise();
    const groups = res.Groups.map((group) => group.GroupName);
    return groups;
});
exports.listUserPoolGroupsForUser = listUserPoolGroupsForUser;
const getBot = (botName, region) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new aws_sdk_1.LexModelBuildingService({ region });
    return yield service.getBot({ name: botName, versionOrAlias: '$LATEST' }).promise();
});
exports.getBot = getBot;
const getFunction = (functionName, region) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new aws_sdk_1.Lambda({ region });
    return yield service.getFunction({ FunctionName: functionName }).promise();
});
exports.getFunction = getFunction;
const getLayerVersion = (functionArn, region) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new aws_sdk_1.Lambda({ region });
    return yield service.getLayerVersionByArn({ Arn: functionArn }).promise();
});
exports.getLayerVersion = getLayerVersion;
const listVersions = (layerName, region) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new aws_sdk_1.Lambda({ region });
    return yield service.listLayerVersions({ LayerName: layerName }).promise();
});
exports.listVersions = listVersions;
const invokeFunction = (functionName, payload, region) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new aws_sdk_1.Lambda({ region });
    return yield service.invoke({ FunctionName: functionName, Payload: payload }).promise();
});
exports.invokeFunction = invokeFunction;
const getCollection = (collectionId, region) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new aws_sdk_1.Rekognition({ region });
    return yield service.describeCollection({ CollectionId: collectionId }).promise();
});
exports.getCollection = getCollection;
const getTable = (tableName, region) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new aws_sdk_1.DynamoDB({ region });
    return yield service.describeTable({ TableName: tableName }).promise();
});
exports.getTable = getTable;
const getEventSourceMappings = (functionName, region) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new aws_sdk_1.Lambda({ region });
    return (yield service.listEventSourceMappings({ FunctionName: functionName }).promise()).EventSourceMappings;
});
exports.getEventSourceMappings = getEventSourceMappings;
const deleteTable = (tableName, region) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new aws_sdk_1.DynamoDB({ region });
    return yield service.deleteTable({ TableName: tableName }).promise();
});
exports.deleteTable = deleteTable;
const putItemInTable = (tableName, region, item) => __awaiter(void 0, void 0, void 0, function* () {
    const ddb = new aws_sdk_1.DynamoDB.DocumentClient({ region });
    return yield ddb.put({ TableName: tableName, Item: item }).promise();
});
exports.putItemInTable = putItemInTable;
const scanTable = (tableName, region) => __awaiter(void 0, void 0, void 0, function* () {
    const ddb = new aws_sdk_1.DynamoDB.DocumentClient({ region });
    return yield ddb.scan({ TableName: tableName }).promise();
});
exports.scanTable = scanTable;
const getAppSyncApi = (appSyncApiId, region) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new aws_sdk_1.AppSync({ region });
    return yield service.getGraphqlApi({ apiId: appSyncApiId }).promise();
});
exports.getAppSyncApi = getAppSyncApi;
const getCloudWatchLogs = (region, logGroupName, logStreamName = undefined) => __awaiter(void 0, void 0, void 0, function* () {
    const cloudWatchLogsClient = new aws_sdk_1.CloudWatchLogs({ region, retryDelayOptions: { base: 500 } });
    let targetStreamName = logStreamName;
    if (targetStreamName === undefined) {
        const describeStreamsResp = yield cloudWatchLogsClient
            .describeLogStreams({ logGroupName, descending: true, orderBy: 'LastEventTime' })
            .promise();
        if (describeStreamsResp.logStreams === undefined || describeStreamsResp.logStreams.length === 0) {
            return [];
        }
        targetStreamName = describeStreamsResp.logStreams[0].logStreamName;
    }
    const logsResp = yield cloudWatchLogsClient.getLogEvents({ logGroupName, logStreamName: targetStreamName }).promise();
    return logsResp.events || [];
});
exports.getCloudWatchLogs = getCloudWatchLogs;
const describeCloudFormationStack = (stackName, region, profileConfig) => __awaiter(void 0, void 0, void 0, function* () {
    const service = profileConfig ? new aws_sdk_1.CloudFormation(profileConfig) : new aws_sdk_1.CloudFormation({ region });
    return (yield service.describeStacks({ StackName: stackName }).promise()).Stacks.find((stack) => stack.StackName === stackName || stack.StackId === stackName);
});
exports.describeCloudFormationStack = describeCloudFormationStack;
const getNestedStackID = (stackName, region, logicalId) => __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d;
    const cfnClient = new aws_sdk_1.CloudFormation({ region });
    const resource = yield cfnClient.describeStackResources({ StackName: stackName, LogicalResourceId: logicalId }).promise();
    return (_d = (_c = resource === null || resource === void 0 ? void 0 : resource.StackResources) === null || _c === void 0 ? void 0 : _c[0].PhysicalResourceId) !== null && _d !== void 0 ? _d : null;
});
exports.getNestedStackID = getNestedStackID;
/**
 * Collects table resource id from parent stack
 * @param region region the stack exists in
 * @param table name of the table used in the appsync schema
 * @param StackId id of the parent stack
 * @returns
 */
const getTableResourceId = (region, table, StackId) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    const cfnClient = new aws_sdk_1.CloudFormation({ region });
    const apiResources = yield cfnClient
        .describeStackResources({
        StackName: StackId,
    })
        .promise();
    const resource = apiResources.StackResources.find((stackResource) => table === stackResource.LogicalResourceId);
    if (resource) {
        const tableStack = yield cfnClient.describeStacks({ StackName: resource.PhysicalResourceId }).promise();
        if (((_e = tableStack === null || tableStack === void 0 ? void 0 : tableStack.Stacks) === null || _e === void 0 ? void 0 : _e.length) > 0) {
            const tableName = tableStack.Stacks[0].Outputs.find((out) => out.OutputKey === `GetAtt${resource.LogicalResourceId}TableName`);
            return tableName.OutputValue;
        }
    }
    return null;
});
exports.getTableResourceId = getTableResourceId;
const putKinesisRecords = (data, partitionKey, streamName, region) => __awaiter(void 0, void 0, void 0, function* () {
    const kinesis = new aws_sdk_1.Kinesis({ region });
    return yield kinesis
        .putRecords({
        Records: [
            {
                Data: data,
                PartitionKey: partitionKey,
            },
        ],
        StreamName: streamName,
    })
        .promise();
});
exports.putKinesisRecords = putKinesisRecords;
const getCloudWatchEventRule = (targetName, region) => __awaiter(void 0, void 0, void 0, function* () {
    aws_sdk_1.config.update({ region });
    const service = new aws_sdk_1.CloudWatchEvents();
    const params = {
        TargetArn: targetName /* required */,
    };
    let ruleName;
    try {
        ruleName = yield service.listRuleNamesByTarget(params).promise();
    }
    catch (e) {
        console.log(e);
    }
    return ruleName;
});
exports.getCloudWatchEventRule = getCloudWatchEventRule;
const setupAmplifyAdminUI = (appId, region) => __awaiter(void 0, void 0, void 0, function* () {
    const amplifyBackend = new aws_sdk_1.AmplifyBackend({ region });
    return yield amplifyBackend.createBackendConfig({ AppId: appId }).promise();
});
exports.setupAmplifyAdminUI = setupAmplifyAdminUI;
const getAmplifyBackendJobStatus = (jobId, appId, envName, region) => __awaiter(void 0, void 0, void 0, function* () {
    const amplifyBackend = new aws_sdk_1.AmplifyBackend({ region });
    return yield amplifyBackend
        .getBackendJob({
        JobId: jobId,
        AppId: appId,
        BackendEnvironmentName: envName,
    })
        .promise();
});
exports.getAmplifyBackendJobStatus = getAmplifyBackendJobStatus;
const listRolePolicies = (roleName, region) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new aws_sdk_1.IAM({ region });
    return (yield service.listRolePolicies({ RoleName: roleName }).promise()).PolicyNames;
});
exports.listRolePolicies = listRolePolicies;
const listAttachedRolePolicies = (roleName, region) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new aws_sdk_1.IAM({ region });
    return (yield service.listAttachedRolePolicies({ RoleName: roleName }).promise()).AttachedPolicies;
});
exports.listAttachedRolePolicies = listAttachedRolePolicies;
const getPermissionsBoundary = (roleName, region) => __awaiter(void 0, void 0, void 0, function* () {
    var _f, _g, _h;
    const iamClient = new aws_sdk_1.IAM({ region });
    return (_h = (_g = (_f = (yield iamClient.getRole({ RoleName: roleName }).promise())) === null || _f === void 0 ? void 0 : _f.Role) === null || _g === void 0 ? void 0 : _g.PermissionsBoundary) === null || _h === void 0 ? void 0 : _h.PermissionsBoundaryArn;
});
exports.getPermissionsBoundary = getPermissionsBoundary;
const getSSMParameters = (region, appId, envName, funcName, parameterNames) => __awaiter(void 0, void 0, void 0, function* () {
    const ssmClient = new aws_sdk_1.SSM({ region });
    if (!parameterNames || parameterNames.length === 0) {
        throw new Error('no parameterNames specified');
    }
    return yield ssmClient
        .getParameters({
        Names: parameterNames.map((name) => path.posix.join('/amplify', appId, envName, `AMPLIFY_${funcName}_${name}`)),
        WithDecryption: true,
    })
        .promise();
});
exports.getSSMParameters = getSSMParameters;
const deleteSSMParameter = (region, appId, envName, category, funcName, parameterName) => __awaiter(void 0, void 0, void 0, function* () {
    const ssmClient = new aws_sdk_1.SSM({ region });
    return yield ssmClient
        .deleteParameter({
        Name: path.posix.join('/amplify', appId, envName, `AMPLIFY_${category}_${funcName}_${parameterName}`),
    })
        .promise();
});
exports.deleteSSMParameter = deleteSSMParameter;
const getSSMParametersCategoryPrefix = (region, appId, envName, category, resourceName, parameterNames) => __awaiter(void 0, void 0, void 0, function* () {
    const ssmClient = new aws_sdk_1.SSM({ region });
    if (!parameterNames || parameterNames.length === 0) {
        throw new Error('no parameterNames specified');
    }
    return ssmClient
        .getParameters({
        Names: parameterNames.map((name) => `/amplify/${appId}/${envName}/AMPLIFY_${category}_${resourceName}_${name}`),
    })
        .promise();
});
exports.getSSMParametersCategoryPrefix = getSSMParametersCategoryPrefix;
const getAllSSMParamatersForAppId = (appId, region) => __awaiter(void 0, void 0, void 0, function* () {
    const ssmClient = new aws_sdk_1.SSM({ region });
    const retrievedParameters = [];
    let receivedNextToken = '';
    do {
        const ssmArgument = getSsmSdkParametersByPath(appId, receivedNextToken);
        const data = yield ssmClient.getParametersByPath(ssmArgument).promise();
        retrievedParameters.push(...data.Parameters.map((returnedParameter) => returnedParameter.Name));
        receivedNextToken = data.NextToken;
    } while (receivedNextToken);
    return retrievedParameters;
});
exports.getAllSSMParamatersForAppId = getAllSSMParamatersForAppId;
const expectParametersOptionalValue = (expectToExist, expectNotExist, region, appId, envName, category, resourceName) => __awaiter(void 0, void 0, void 0, function* () {
    const parametersToRequest = expectToExist.map((exist) => exist.name).concat(expectNotExist);
    const result = yield (0, exports.getSSMParametersCategoryPrefix)(region, appId, envName, category, resourceName, parametersToRequest);
    const mapName = (name) => `/amplify/${appId}/${envName}/AMPLIFY_${category}_${resourceName}_${name}`;
    expect(result.InvalidParameters.length).toBe(expectNotExist.length);
    expect(result.InvalidParameters.sort()).toEqual(expectNotExist.map(mapName).sort());
    expect(result.Parameters.length).toBe(expectToExist.length);
    const mappedResult = result.Parameters.map((param) => ({ name: param.Name, value: JSON.parse(param.Value) })).sort(sortByName);
    const mappedExpect = expectToExist
        .map((exist) => ({ name: mapName(exist.name), value: exist.value ? exist.value : '' }))
        .sort(sortByName);
    const mappedResultKeys = mappedResult.map((parameter) => parameter.name);
    for (const expectedParam of mappedExpect) {
        if (expectedParam.value) {
            expect(mappedResult).toContainEqual(expectedParam);
        }
        else {
            expect(mappedResultKeys).toContainEqual(expectedParam.name);
        }
    }
});
exports.expectParametersOptionalValue = expectParametersOptionalValue;
const sortByName = (a, b) => a.name.localeCompare(b.name);
const getSsmSdkParametersByPath = (appId, nextToken) => {
    const sdkParameters = { Path: `/amplify/${appId}/` };
    if (nextToken) {
        sdkParameters.NextToken = nextToken;
    }
    return sdkParameters;
};
// Amazon location service calls
const getMap = (mapName, region) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new aws_sdk_1.Location({ region });
    return yield service
        .describeMap({
        MapName: mapName,
    })
        .promise();
});
exports.getMap = getMap;
const getPlaceIndex = (placeIndexName, region) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new aws_sdk_1.Location({ region });
    return yield service
        .describePlaceIndex({
        IndexName: placeIndexName,
    })
        .promise();
});
exports.getPlaceIndex = getPlaceIndex;
const getGeofenceCollection = (geofenceCollectionName, region) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new aws_sdk_1.Location({ region });
    return yield service
        .describeGeofenceCollection({
        CollectionName: geofenceCollectionName,
    })
        .promise();
});
exports.getGeofenceCollection = getGeofenceCollection;
const getGeofence = (geofenceCollectionName, geofenceId, region) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new aws_sdk_1.Location({ region });
    return (yield service.getGeofence({
        CollectionName: geofenceCollectionName,
        GeofenceId: geofenceId,
    })).promise();
});
exports.getGeofence = getGeofence;
// eslint-disable-next-line spellcheck/spell-checker
const listGeofences = (geofenceCollectionName, region, nextToken = null) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new aws_sdk_1.Location({ region });
    // eslint-disable-next-line spellcheck/spell-checker
    return (yield service.listGeofences({
        CollectionName: geofenceCollectionName,
        NextToken: nextToken,
    })).promise();
});
exports.listGeofences = listGeofences;
//# sourceMappingURL=sdk-calls.js.map