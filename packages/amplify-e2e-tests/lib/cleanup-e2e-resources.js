"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable camelcase */
/* eslint-disable spellcheck/spell-checker */
var circleci_api_1 = require("circleci-api");
var dotenv_1 = require("dotenv");
var yargs_1 = __importDefault(require("yargs"));
var aws = __importStar(require("aws-sdk"));
var lodash_1 = __importDefault(require("lodash"));
var fs_extra_1 = __importDefault(require("fs-extra"));
var path_1 = __importDefault(require("path"));
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
// Ensure that scripts/cci-utils.ts is also updated when this gets updated
var AWS_REGIONS_TO_RUN_TESTS = [
    'us-east-1',
    'us-east-2',
    'us-west-2',
    'eu-west-2',
    'eu-west-3',
    'eu-central-1',
    'ap-northeast-1',
    'ap-northeast-2',
    'ap-southeast-1',
    'ap-southeast-2',
];
var AWS_REGIONS_TO_RUN_TESTS_PINPOINT = AWS_REGIONS_TO_RUN_TESTS.filter(function (region) { return region !== 'eu-west-3'; });
// Limits are enforced per region
// we collect resources from each region & then delete as an entire batch
var DELETE_LIMITS = {
    PER_REGION: {
        OTHER: 25,
        CFN_STACK: 50,
    },
    PER_BATCH: {
        OTHER: 50,
        CFN_STACK: 100,
    },
};
var reportPath = path_1.default.normalize(path_1.default.join(__dirname, '..', 'amplify-e2e-reports', 'stale-resources.json'));
var MULTI_JOB_APP = '<Amplify App reused by multiple apps>';
var ORPHAN = '<orphan>';
var UNKNOWN = '<unknown>';
var PINPOINT_TEST_REGEX = /integtest/;
var APPSYNC_TEST_REGEX = /integtest/;
var BUCKET_TEST_REGEX = /test/;
var IAM_TEST_REGEX = /!RotateE2eAwsToken-e2eTestContextRole|-integtest$|^amplify-|^eu-|^us-|^ap-/;
var USER_POOL_TEST_REGEX = /integtest|amplify_backend_manager/;
var STALE_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
/*
 * Exit on expired token as all future requests will fail.
 */
var handleExpiredTokenException = function () {
    console.log('Token expired. Exiting...');
    process.exit();
};
/**
 * Check if a resource is stale based on its created date
 * @param created
 * @returns
 */
var isStale = function (created) {
    var now = new Date().getTime();
    var isStale = now - created.getTime() > STALE_DURATION_MS;
    return isStale;
};
/**
 * We define a resource as viable for deletion if it matches TEST_REGEX in the name, and if it is > STALE_DURATION_MS old.
 */
var testBucketStalenessFilter = function (resource) {
    var isTestResource = resource.Name.match(BUCKET_TEST_REGEX);
    return isTestResource && isStale(resource.CreationDate);
};
var testRoleStalenessFilter = function (resource) {
    var isTestResource = resource.RoleName.match(IAM_TEST_REGEX);
    return isTestResource && isStale(resource.CreateDate);
};
var testUserPoolStalenessFilter = function (resource) {
    var isTestResource = resource.Name.match(USER_POOL_TEST_REGEX);
    return isTestResource && isStale(resource.CreationDate);
};
var testAppSyncApiStalenessFilter = function (resource) {
    var isTestResource = resource.name.match(APPSYNC_TEST_REGEX);
    var createTimeTagValue = resource.tags['circleci:create_time'];
    var isStaleResource = true;
    if (createTimeTagValue) {
        var createTime = new Date(createTimeTagValue);
        isStaleResource = isStale(createTime);
    }
    return isTestResource && isStaleResource;
};
var testPinpointAppStalenessFilter = function (resource) {
    var isTestResource = resource.Name.match(PINPOINT_TEST_REGEX);
    return isTestResource && isStale(new Date(resource.CreationDate));
};
/**
 * Get all S3 buckets in the account, and filter down to the ones we consider stale.
 */
var getOrphanS3TestBuckets = function (account) { return __awaiter(void 0, void 0, void 0, function () {
    var s3Client, listBucketResponse, staleBuckets;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                s3Client = new aws.S3(getAWSConfig(account));
                return [4 /*yield*/, s3Client.listBuckets().promise()];
            case 1:
                listBucketResponse = _a.sent();
                staleBuckets = listBucketResponse.Buckets.filter(testBucketStalenessFilter);
                return [2 /*return*/, staleBuckets.map(function (it) { return ({ name: it.Name, createTime: it.CreationDate }); })];
        }
    });
}); };
/**
 * Get all iam roles in the account, and filter down to the ones we consider stale.
 */
var getOrphanTestIamRoles = function (account) { return __awaiter(void 0, void 0, void 0, function () {
    var iamClient, listRoleResponse, staleRoles;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                iamClient = new aws.IAM(getAWSConfig(account));
                return [4 /*yield*/, iamClient.listRoles({ MaxItems: 1000 }).promise()];
            case 1:
                listRoleResponse = _a.sent();
                staleRoles = listRoleResponse.Roles.filter(testRoleStalenessFilter);
                return [2 /*return*/, staleRoles.map(function (it) { return ({ name: it.RoleName, createTime: it.CreateDate }); })];
        }
    });
}); };
var getOrphanPinpointApplications = function (account, region) { return __awaiter(void 0, void 0, void 0, function () {
    var pinpoint, apps, nextToken, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                pinpoint = new aws.Pinpoint(getAWSConfig(account, region));
                apps = [];
                nextToken = null;
                _a.label = 1;
            case 1: return [4 /*yield*/, pinpoint
                    .getApps({
                    Token: nextToken,
                })
                    .promise()];
            case 2:
                result = _a.sent();
                apps.push.apply(apps, result.ApplicationsResponse.Item.filter(testPinpointAppStalenessFilter).map(function (it) { return ({
                    id: it.Id,
                    name: it.Name,
                    arn: it.Arn,
                    region: region,
                    createTime: new Date(it.CreationDate),
                }); }));
                nextToken = result.ApplicationsResponse.NextToken;
                _a.label = 3;
            case 3:
                if (nextToken) return [3 /*break*/, 1];
                _a.label = 4;
            case 4: return [2 /*return*/, apps];
        }
    });
}); };
var getOrphanUserPools = function (account, region) { return __awaiter(void 0, void 0, void 0, function () {
    var cognitoClient, userPools, staleUserPools;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                cognitoClient = new aws.CognitoIdentityServiceProvider(getAWSConfig(account, region));
                return [4 /*yield*/, cognitoClient.listUserPools({ MaxResults: 60 }).promise()];
            case 1:
                userPools = _a.sent();
                staleUserPools = userPools.UserPools.filter(testUserPoolStalenessFilter);
                return [2 /*return*/, staleUserPools.map(function (it) { return ({ name: it.Name, userPoolId: it.Id, region: region }); })];
        }
    });
}); };
/**
 * Get all AppSync Apis in the account, and filter down to the ones we consider stale.
 */
var getOrphanAppSyncApis = function (account, region) { return __awaiter(void 0, void 0, void 0, function () {
    var appSyncClient, listApisResponse, staleApis;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                appSyncClient = new aws.AppSync(getAWSConfig(account, region));
                return [4 /*yield*/, appSyncClient.listGraphqlApis({ maxResults: 25 }).promise()];
            case 1:
                listApisResponse = _a.sent();
                staleApis = listApisResponse.graphqlApis.filter(testAppSyncApiStalenessFilter);
                return [2 /*return*/, staleApis.map(function (it) { return ({ apiId: it.apiId, name: it.name, region: region }); })];
        }
    });
}); };
/**
 * Get the relevant AWS config object for a given account and region.
 */
var getAWSConfig = function (_a, region) {
    var accessKeyId = _a.accessKeyId, secretAccessKey = _a.secretAccessKey, sessionToken = _a.sessionToken;
    return (__assign(__assign({ credentials: {
            accessKeyId: accessKeyId,
            secretAccessKey: secretAccessKey,
            sessionToken: sessionToken,
        } }, (region ? { region: region } : {})), { maxRetries: 10 }));
};
/**
 * Returns a list of Amplify Apps in the region. The apps includes information about the CircleCI build that created the app
 * This is determined by looking at tags of the backend environments that are associated with the Apps
 * @param account aws account to query for amplify Apps
 * @param region aws region to query for amplify Apps
 * @returns Promise<AmplifyAppInfo[]> a list of Amplify Apps in the region with build info
 */
var getAmplifyApps = function (account, region) { return __awaiter(void 0, void 0, void 0, function () {
    var amplifyClient, amplifyApps, result, _i, _a, app, backends, backendEnvironments, _b, _c, backendEnv, buildInfo, e_1, e_2;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                if (region === 'us-east-1' && account.parent) {
                    return [2 /*return*/, []]; // temporarily disabled until us-east-1 is re-enabled for this account
                }
                amplifyClient = new aws.Amplify(getAWSConfig(account, region));
                _d.label = 1;
            case 1:
                _d.trys.push([1, 14, , 15]);
                return [4 /*yield*/, amplifyClient.listApps({ maxResults: 25 }).promise()];
            case 2:
                amplifyApps = _d.sent();
                result = [];
                _i = 0, _a = amplifyApps.apps;
                _d.label = 3;
            case 3:
                if (!(_i < _a.length)) return [3 /*break*/, 13];
                app = _a[_i];
                if (!isStale(app.createTime)) {
                    return [3 /*break*/, 12]; // skip
                }
                backends = {};
                _d.label = 4;
            case 4:
                _d.trys.push([4, 10, , 11]);
                return [4 /*yield*/, amplifyClient.listBackendEnvironments({ appId: app.appId, maxResults: 5 }).promise()];
            case 5:
                backendEnvironments = _d.sent();
                _b = 0, _c = backendEnvironments.backendEnvironments;
                _d.label = 6;
            case 6:
                if (!(_b < _c.length)) return [3 /*break*/, 9];
                backendEnv = _c[_b];
                return [4 /*yield*/, getStackDetails(backendEnv.stackName, account, region)];
            case 7:
                buildInfo = _d.sent();
                if (buildInfo) {
                    backends[backendEnv.environmentName] = buildInfo;
                }
                _d.label = 8;
            case 8:
                _b++;
                return [3 /*break*/, 6];
            case 9: return [3 /*break*/, 11];
            case 10:
                e_1 = _d.sent();
                return [3 /*break*/, 11];
            case 11:
                result.push({
                    appId: app.appId,
                    name: app.name,
                    region: region,
                    backends: backends,
                });
                _d.label = 12;
            case 12:
                _i++;
                return [3 /*break*/, 3];
            case 13: return [2 /*return*/, result];
            case 14:
                e_2 = _d.sent();
                console.log(e_2);
                return [2 /*return*/, []];
            case 15: return [2 /*return*/];
        }
    });
}); };
/**
 * Return the CircleCI job id looking at `circleci:build_id` in the tags
 * @param tags Tags associated with the resource
 * @returns build number or undefined
 */
var getJobId = function (tags) {
    var _a;
    if (tags === void 0) { tags = []; }
    var jobId = (_a = tags.find(function (tag) { return tag.Key === 'circleci:build_id'; })) === null || _a === void 0 ? void 0 : _a.Value;
    return jobId && Number.parseInt(jobId, 10);
};
/**
 * Gets detail about a stack including the details about CircleCI job that created the stack. If a stack
 * has status of `DELETE_FAILED` then it also includes the list of physical id of resources that caused
 * deletion failures
 *
 * @param stackName name of the stack
 * @param account account
 * @param region region
 * @returns stack details
 */
var getStackDetails = function (stackName, account, region) { return __awaiter(void 0, void 0, void 0, function () {
    var cfnClient, stack, tags, stackStatus, resourcesFailedToDelete, resources, jobId, _a;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                cfnClient = new aws.CloudFormation(getAWSConfig(account, region));
                return [4 /*yield*/, cfnClient.describeStacks({ StackName: stackName }).promise()];
            case 1:
                stack = _c.sent();
                tags = stack.Stacks.length && stack.Stacks[0].Tags;
                stackStatus = stack.Stacks[0].StackStatus;
                resourcesFailedToDelete = [];
                if (!(stackStatus === 'DELETE_FAILED')) return [3 /*break*/, 3];
                return [4 /*yield*/, cfnClient.listStackResources({ StackName: stackName }).promise()];
            case 2:
                resources = _c.sent();
                resourcesFailedToDelete = resources.StackResourceSummaries.filter(function (r) { return r.ResourceStatus === 'DELETE_FAILED'; }).map(function (r) { return r.LogicalResourceId; });
                _c.label = 3;
            case 3:
                jobId = getJobId(tags);
                _b = {
                    stackName: stackName,
                    stackStatus: stackStatus,
                    resourcesFailedToDelete: resourcesFailedToDelete,
                    region: region,
                    tags: tags.reduce(function (acc, tag) {
                        var _a;
                        return (__assign(__assign({}, acc), (_a = {}, _a[tag.Key] = tag.Value, _a)));
                    }, {})
                };
                _a = jobId;
                if (!_a) return [3 /*break*/, 5];
                return [4 /*yield*/, getJobCircleCIDetails(jobId)];
            case 4:
                _a = (_c.sent());
                _c.label = 5;
            case 5: return [2 /*return*/, (_b.cciInfo = _a,
                    _b)];
        }
    });
}); };
var getStacks = function (account, region) { return __awaiter(void 0, void 0, void 0, function () {
    var cfnClient, stackStatusFilter, stacks, nextToken, nextPage, rootStacks, results, _i, rootStacks_1, stack, details, _a;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                cfnClient = new aws.CloudFormation(getAWSConfig(account, region));
                stackStatusFilter = [
                    'CREATE_COMPLETE',
                    'ROLLBACK_FAILED',
                    'ROLLBACK_COMPLETE',
                    'DELETE_FAILED',
                    'UPDATE_COMPLETE',
                    'UPDATE_ROLLBACK_FAILED',
                    'UPDATE_ROLLBACK_COMPLETE',
                    'IMPORT_COMPLETE',
                    'IMPORT_ROLLBACK_FAILED',
                    'IMPORT_ROLLBACK_COMPLETE',
                ];
                return [4 /*yield*/, cfnClient
                        .listStacks({
                        StackStatusFilter: stackStatusFilter,
                    })
                        .promise()];
            case 1:
                stacks = _c.sent();
                nextToken = stacks.NextToken;
                _c.label = 2;
            case 2:
                if (!(nextToken && stacks.StackSummaries.length < DELETE_LIMITS.PER_REGION.CFN_STACK)) return [3 /*break*/, 4];
                return [4 /*yield*/, cfnClient
                        .listStacks({
                        StackStatusFilter: stackStatusFilter,
                        NextToken: nextToken,
                    })
                        .promise()];
            case 3:
                nextPage = _c.sent();
                (_b = stacks.StackSummaries).push.apply(_b, nextPage.StackSummaries);
                nextToken = nextPage.NextToken;
                return [3 /*break*/, 2];
            case 4:
                rootStacks = stacks.StackSummaries.filter(function (stack) {
                    var isRoot = !stack.RootId;
                    if (!isStale(stack.CreationTime)) {
                        console.log('Skipping stack because created date is:', stack.CreationTime);
                    }
                    return isRoot && isStale;
                });
                if (rootStacks.length > DELETE_LIMITS.PER_REGION.CFN_STACK) {
                    // we can only delete 100 stacks accross all regions every batch,
                    // so we shouldn't take more than 50 stacks from each of those 8 regions.
                    // this should at least limit calls to getStackDetails below
                    rootStacks = rootStacks.slice(0, DELETE_LIMITS.PER_REGION.CFN_STACK);
                }
                results = [];
                _i = 0, rootStacks_1 = rootStacks;
                _c.label = 5;
            case 5:
                if (!(_i < rootStacks_1.length)) return [3 /*break*/, 10];
                stack = rootStacks_1[_i];
                _c.label = 6;
            case 6:
                _c.trys.push([6, 8, , 9]);
                return [4 /*yield*/, getStackDetails(stack.StackName, account, region)];
            case 7:
                details = _c.sent();
                if (details) {
                    results.push(details);
                }
                return [3 /*break*/, 9];
            case 8:
                _a = _c.sent();
                return [3 /*break*/, 9];
            case 9:
                _i++;
                return [3 /*break*/, 5];
            case 10: return [2 /*return*/, results];
        }
    });
}); };
var getCircleCIClient = function () {
    var options = {
        token: process.env.CIRCLECI_TOKEN,
        vcs: {
            repo: process.env.CIRCLE_PROJECT_REPONAME,
            owner: process.env.CIRCLE_PROJECT_USERNAME,
            type: circleci_api_1.GitType.GITHUB,
        },
    };
    return new circleci_api_1.CircleCI(options);
};
var getJobCircleCIDetails = function (jobId) { return __awaiter(void 0, void 0, void 0, function () {
    var client, result, r;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                client = getCircleCIClient();
                return [4 /*yield*/, client.build(jobId)];
            case 1:
                result = _a.sent();
                r = lodash_1.default.pick(result, [
                    'build_url',
                    'branch',
                    'build_num',
                    'outcome',
                    'canceled',
                    'infrastructure_fail',
                    'status',
                    'committer_name',
                    'workflows.workflow_id',
                    'lifecycle',
                ]);
                return [2 /*return*/, r];
        }
    });
}); };
var getS3Buckets = function (account) { return __awaiter(void 0, void 0, void 0, function () {
    var s3Client, buckets, result, _i, _a, bucket, bucketDetails, jobId, _b, _c, e_3;
    var _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                s3Client = new aws.S3(getAWSConfig(account));
                return [4 /*yield*/, s3Client.listBuckets().promise()];
            case 1:
                buckets = _e.sent();
                result = [];
                _i = 0, _a = buckets.Buckets;
                _e.label = 2;
            case 2:
                if (!(_i < _a.length)) return [3 /*break*/, 9];
                bucket = _a[_i];
                _e.label = 3;
            case 3:
                _e.trys.push([3, 7, , 8]);
                return [4 /*yield*/, s3Client.getBucketTagging({ Bucket: bucket.Name }).promise()];
            case 4:
                bucketDetails = _e.sent();
                jobId = getJobId(bucketDetails.TagSet);
                if (!jobId) return [3 /*break*/, 6];
                _c = (_b = result).push;
                _d = {
                    name: bucket.Name
                };
                return [4 /*yield*/, getJobCircleCIDetails(jobId)];
            case 5:
                _c.apply(_b, [(_d.cciInfo = _e.sent(),
                        _d.createTime = bucket.CreationDate,
                        _d)]);
                _e.label = 6;
            case 6: return [3 /*break*/, 8];
            case 7:
                e_3 = _e.sent();
                if (e_3.code !== 'NoSuchTagSet' && e_3.code !== 'NoSuchBucket') {
                    throw e_3;
                }
                result.push({
                    name: bucket.Name,
                    createTime: bucket.CreationDate,
                });
                return [3 /*break*/, 8];
            case 8:
                _i++;
                return [3 /*break*/, 2];
            case 9: return [2 /*return*/, result];
        }
    });
}); };
/**
 * extract and moves CircleCI job details
 */
var extractCCIJobInfo = function (record) { return ({
    workflowId: lodash_1.default.get(record, ['0', 'cciInfo', 'workflows', 'workflow_id']),
    workflowName: lodash_1.default.get(record, ['0', 'cciInfo', 'workflows', 'workflow_name']),
    lifecycle: lodash_1.default.get(record, ['0', 'cciInfo', 'lifecycle']),
    cciJobDetails: lodash_1.default.get(record, ['0', 'cciInfo']),
    status: lodash_1.default.get(record, ['0', 'cciInfo', 'status']),
}); };
/**
 * Merges stale resources and returns a list grouped by the CircleCI jobId. Amplify Apps that don't have
 * any backend environment are grouped as Orphan apps and apps that have Backend created by different CircleCI jobs are
 * grouped as MULTI_JOB_APP. Any resource that do not have a CircleCI job is grouped under UNKNOWN
 */
var mergeResourcesByCCIJob = function (amplifyApp, cfnStacks, s3Buckets, orphanS3Buckets, orphanIamRoles, orphanPinpointApplications, orphanAppSyncApis, orphanUserPools) {
    var _a, _b, _c, _d, _e;
    var result = {};
    var stacksByJobId = lodash_1.default.groupBy(cfnStacks, function (stack) { return lodash_1.default.get(stack, ['cciInfo', 'build_num'], UNKNOWN); });
    var bucketByJobId = lodash_1.default.groupBy(s3Buckets, function (bucketInfo) { return lodash_1.default.get(bucketInfo, ['cciInfo', 'build_num'], UNKNOWN); });
    var amplifyAppByJobId = lodash_1.default.groupBy(amplifyApp, function (appInfo) {
        if (Object.keys(appInfo.backends).length === 0) {
            return ORPHAN;
        }
        var buildIds = lodash_1.default.groupBy(appInfo.backends, function (backendInfo) { return lodash_1.default.get(backendInfo, ['cciInfo', 'build_num'], UNKNOWN); });
        if (Object.keys(buildIds).length === 1) {
            return Object.keys(buildIds)[0];
        }
        return MULTI_JOB_APP;
    });
    lodash_1.default.mergeWith(result, lodash_1.default.pickBy(amplifyAppByJobId, function (__, key) { return key !== MULTI_JOB_APP; }), function (val, src, key) { return (__assign(__assign(__assign({}, val), extractCCIJobInfo(src)), { jobId: key, amplifyApps: src })); });
    lodash_1.default.mergeWith(result, stacksByJobId, function (__, key) { return key !== ORPHAN; }, function (val, src, key) { return (__assign(__assign(__assign({}, val), extractCCIJobInfo(src)), { jobId: key, stacks: src })); });
    lodash_1.default.mergeWith(result, bucketByJobId, function (val, src, key) { return (__assign(__assign(__assign({}, val), extractCCIJobInfo(src)), { jobId: key, buckets: src })); });
    var orphanBuckets = (_a = {},
        _a[ORPHAN] = orphanS3Buckets,
        _a);
    lodash_1.default.mergeWith(result, orphanBuckets, function (val, src, key) { return (__assign(__assign({}, val), { jobId: key, buckets: src })); });
    var orphanIamRolesGroup = (_b = {},
        _b[ORPHAN] = orphanIamRoles,
        _b);
    lodash_1.default.mergeWith(result, orphanIamRolesGroup, function (val, src, key) { return (__assign(__assign({}, val), { jobId: key, roles: src })); });
    var orphanPinpointApps = (_c = {},
        _c[ORPHAN] = orphanPinpointApplications,
        _c);
    lodash_1.default.mergeWith(result, orphanPinpointApps, function (val, src, key) { return (__assign(__assign({}, val), { jobId: key, pinpointApps: src })); });
    lodash_1.default.mergeWith(result, (_d = {},
        _d[ORPHAN] = orphanAppSyncApis,
        _d), function (val, src, key) { return (__assign(__assign({}, val), { jobId: key, appSyncApis: src })); });
    lodash_1.default.mergeWith(result, (_e = {},
        _e[ORPHAN] = orphanUserPools,
        _e), function (val, src, key) { return (__assign(__assign({}, val), { jobId: key, userPools: src })); });
    return result;
};
var deleteAmplifyApps = function (account, accountIndex, apps) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Promise.all(apps.slice(0, DELETE_LIMITS.PER_BATCH.OTHER).map(function (app) { return deleteAmplifyApp(account, accountIndex, app); }))];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
var deleteAmplifyApp = function (account, accountIndex, app) { return __awaiter(void 0, void 0, void 0, function () {
    var name, appId, region, amplifyClient, e_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                name = app.name, appId = app.appId, region = app.region;
                console.log("[ACCOUNT ".concat(accountIndex, "] Deleting App ").concat(name, "(").concat(appId, ")"));
                amplifyClient = new aws.Amplify(getAWSConfig(account, region));
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, amplifyClient.deleteApp({ appId: appId }).promise()];
            case 2:
                _a.sent();
                return [3 /*break*/, 4];
            case 3:
                e_4 = _a.sent();
                console.log("[ACCOUNT ".concat(accountIndex, "] Deleting Amplify App ").concat(appId, " failed with the following error"), e_4);
                if (e_4.code === 'ExpiredTokenException') {
                    handleExpiredTokenException();
                }
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
var deleteIamRoles = function (account, accountIndex, roles) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Promise.all(roles.slice(0, DELETE_LIMITS.PER_BATCH.OTHER).map(function (role) { return deleteIamRole(account, accountIndex, role); }))];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
var deleteIamRole = function (account, accountIndex, role) { return __awaiter(void 0, void 0, void 0, function () {
    var roleName, iamClient, e_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                roleName = role.name;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 5, , 6]);
                console.log("[ACCOUNT ".concat(accountIndex, "] Deleting Iam Role ").concat(roleName));
                console.log("Role creation time (PST): ".concat(role.createTime.toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles' })));
                iamClient = new aws.IAM(getAWSConfig(account));
                return [4 /*yield*/, deleteAttachedRolePolicies(account, accountIndex, roleName)];
            case 2:
                _a.sent();
                return [4 /*yield*/, deleteRolePolicies(account, accountIndex, roleName)];
            case 3:
                _a.sent();
                return [4 /*yield*/, iamClient.deleteRole({ RoleName: roleName }).promise()];
            case 4:
                _a.sent();
                return [3 /*break*/, 6];
            case 5:
                e_5 = _a.sent();
                console.log("[ACCOUNT ".concat(accountIndex, "] Deleting iam role ").concat(roleName, " failed with error ").concat(e_5.message));
                if (e_5.code === 'ExpiredTokenException') {
                    handleExpiredTokenException();
                }
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
var deleteAttachedRolePolicies = function (account, accountIndex, roleName) { return __awaiter(void 0, void 0, void 0, function () {
    var iamClient, rolePolicies;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                iamClient = new aws.IAM(getAWSConfig(account));
                return [4 /*yield*/, iamClient.listAttachedRolePolicies({ RoleName: roleName }).promise()];
            case 1:
                rolePolicies = _a.sent();
                return [4 /*yield*/, Promise.all(rolePolicies.AttachedPolicies.map(function (policy) { return detachIamAttachedRolePolicy(account, accountIndex, roleName, policy); }))];
            case 2:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
var detachIamAttachedRolePolicy = function (account, accountIndex, roleName, policy) { return __awaiter(void 0, void 0, void 0, function () {
    var iamClient, e_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                console.log("[ACCOUNT ".concat(accountIndex, "] Detach Iam Attached Role Policy ").concat(policy.PolicyName));
                iamClient = new aws.IAM(getAWSConfig(account));
                return [4 /*yield*/, iamClient.detachRolePolicy({ RoleName: roleName, PolicyArn: policy.PolicyArn }).promise()];
            case 1:
                _a.sent();
                return [3 /*break*/, 3];
            case 2:
                e_6 = _a.sent();
                console.log("[ACCOUNT ".concat(accountIndex, "] Detach iam role policy ").concat(policy.PolicyName, " failed with error ").concat(e_6.message));
                if (e_6.code === 'ExpiredTokenException') {
                    handleExpiredTokenException();
                }
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
var deleteRolePolicies = function (account, accountIndex, roleName) { return __awaiter(void 0, void 0, void 0, function () {
    var iamClient, rolePolicies;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                iamClient = new aws.IAM(getAWSConfig(account));
                return [4 /*yield*/, iamClient.listRolePolicies({ RoleName: roleName }).promise()];
            case 1:
                rolePolicies = _a.sent();
                return [4 /*yield*/, Promise.all(rolePolicies.PolicyNames.map(function (policy) { return deleteIamRolePolicy(account, accountIndex, roleName, policy); }))];
            case 2:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
var deleteIamRolePolicy = function (account, accountIndex, roleName, policyName) { return __awaiter(void 0, void 0, void 0, function () {
    var iamClient, e_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                console.log("[ACCOUNT ".concat(accountIndex, "] Deleting Iam Role Policy ").concat(policyName));
                iamClient = new aws.IAM(getAWSConfig(account));
                return [4 /*yield*/, iamClient.deleteRolePolicy({ RoleName: roleName, PolicyName: policyName }).promise()];
            case 1:
                _a.sent();
                return [3 /*break*/, 3];
            case 2:
                e_7 = _a.sent();
                console.log("[ACCOUNT ".concat(accountIndex, "] Deleting iam role policy ").concat(policyName, " failed with error ").concat(e_7.message));
                if (e_7.code === 'ExpiredTokenException') {
                    handleExpiredTokenException();
                }
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
var deleteBuckets = function (account, accountIndex, buckets) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Promise.all(buckets.slice(0, DELETE_LIMITS.PER_BATCH.OTHER).map(function (bucket) { return deleteBucket(account, accountIndex, bucket); }))];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
var deleteBucket = function (account, accountIndex, bucket) { return __awaiter(void 0, void 0, void 0, function () {
    var name, s3, e_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                name = bucket.name;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                console.log("[ACCOUNT ".concat(accountIndex, "] Deleting S3 Bucket ").concat(name));
                console.log("Bucket creation time (PST): ".concat(bucket.createTime.toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles' })));
                s3 = new aws.S3(getAWSConfig(account));
                return [4 /*yield*/, (0, amplify_e2e_core_1.deleteS3Bucket)(name, s3)];
            case 2:
                _a.sent();
                return [3 /*break*/, 4];
            case 3:
                e_8 = _a.sent();
                console.log("[ACCOUNT ".concat(accountIndex, "] Deleting bucket ").concat(name, " failed with error ").concat(e_8.message));
                if (e_8.code === 'ExpiredTokenException') {
                    handleExpiredTokenException();
                }
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
var deletePinpointApps = function (account, accountIndex, apps) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Promise.all(apps.slice(0, DELETE_LIMITS.PER_BATCH.OTHER).map(function (app) { return deletePinpointApp(account, accountIndex, app); }))];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
var deletePinpointApp = function (account, accountIndex, app) { return __awaiter(void 0, void 0, void 0, function () {
    var id, name, region, pinpoint, e_9;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                id = app.id, name = app.name, region = app.region;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                console.log("[ACCOUNT ".concat(accountIndex, "] Deleting Pinpoint App ").concat(name));
                console.log("Pinpoint creation time (PST): ".concat(app.createTime.toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles' })));
                pinpoint = new aws.Pinpoint(getAWSConfig(account, region));
                return [4 /*yield*/, pinpoint.deleteApp({ ApplicationId: id }).promise()];
            case 2:
                _a.sent();
                return [3 /*break*/, 4];
            case 3:
                e_9 = _a.sent();
                console.log("[ACCOUNT ".concat(accountIndex, "] Deleting pinpoint app ").concat(name, " failed with error ").concat(e_9.message));
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
var deleteAppSyncApis = function (account, accountIndex, apis) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Promise.all(apis.slice(0, DELETE_LIMITS.PER_BATCH.OTHER).map(function (api) { return deleteAppSyncApi(account, accountIndex, api); }))];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
var deleteAppSyncApi = function (account, accountIndex, api) { return __awaiter(void 0, void 0, void 0, function () {
    var apiId, name, region, appSync, e_10;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                apiId = api.apiId, name = api.name, region = api.region;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                console.log("[ACCOUNT ".concat(accountIndex, "] Deleting AppSync Api ").concat(name));
                appSync = new aws.AppSync(getAWSConfig(account, region));
                return [4 /*yield*/, appSync.deleteGraphqlApi({ apiId: apiId }).promise()];
            case 2:
                _a.sent();
                return [3 /*break*/, 4];
            case 3:
                e_10 = _a.sent();
                console.log("[ACCOUNT ".concat(accountIndex, "] Deleting AppSync Api ").concat(name, " failed with error ").concat(e_10.message));
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
var deleteUserPools = function (account, accountIndex, userPools) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Promise.all(userPools.slice(0, DELETE_LIMITS.PER_BATCH.OTHER).map(function (userPool) { return deleteUserPool(account, accountIndex, userPool); }))];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
var deleteUserPool = function (account, accountIndex, userPool) { return __awaiter(void 0, void 0, void 0, function () {
    var name, region, userPoolId, cognitoClient, userPoolDetails, e_11;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                name = userPool.name, region = userPool.region, userPoolId = userPool.userPoolId;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 6, , 7]);
                console.log("[ACCOUNT ".concat(accountIndex, "] Deleting UserPool ").concat(name));
                cognitoClient = new aws.CognitoIdentityServiceProvider(getAWSConfig(account, region));
                return [4 /*yield*/, cognitoClient.describeUserPool({ UserPoolId: userPoolId }).promise()];
            case 2:
                userPoolDetails = _a.sent();
                if (!userPoolDetails.UserPool.Domain) return [3 /*break*/, 4];
                return [4 /*yield*/, cognitoClient
                        .deleteUserPoolDomain({
                        UserPoolId: userPoolId,
                        Domain: userPoolDetails.UserPool.Domain,
                    })
                        .promise()];
            case 3:
                _a.sent();
                _a.label = 4;
            case 4: return [4 /*yield*/, cognitoClient.deleteUserPool({ UserPoolId: userPoolId }).promise()];
            case 5:
                _a.sent();
                return [3 /*break*/, 7];
            case 6:
                e_11 = _a.sent();
                console.log("[ACCOUNT ".concat(accountIndex, "] Deleting UserPool ").concat(name, " failed with error ").concat(e_11.message));
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); };
var deleteCfnStacks = function (account, accountIndex, stacks) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Promise.all(stacks.slice(0, DELETE_LIMITS.PER_BATCH.CFN_STACK).map(function (stack) { return deleteCfnStack(account, accountIndex, stack); }))];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
var deleteCfnStack = function (account, accountIndex, stack) { return __awaiter(void 0, void 0, void 0, function () {
    var stackName, region, resourcesFailedToDelete, resourceToRetain, cfnClient, e_12;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                stackName = stack.stackName, region = stack.region, resourcesFailedToDelete = stack.resourcesFailedToDelete;
                resourceToRetain = resourcesFailedToDelete.length ? resourcesFailedToDelete : undefined;
                console.log("[ACCOUNT ".concat(accountIndex, "] Deleting CloudFormation stack ").concat(stackName));
                _a.label = 1;
            case 1:
                _a.trys.push([1, 4, , 5]);
                cfnClient = new aws.CloudFormation(getAWSConfig(account, region));
                return [4 /*yield*/, cfnClient.deleteStack({ StackName: stackName, RetainResources: resourceToRetain }).promise()];
            case 2:
                _a.sent();
                // we'll only wait up to a minute before moving on
                return [4 /*yield*/, cfnClient.waitFor('stackDeleteComplete', { StackName: stackName, $waiter: { maxAttempts: 2 } }).promise()];
            case 3:
                // we'll only wait up to a minute before moving on
                _a.sent();
                return [3 /*break*/, 5];
            case 4:
                e_12 = _a.sent();
                console.log("Deleting CloudFormation stack ".concat(stackName, " failed with error ").concat(e_12.message));
                if (e_12.code === 'ExpiredTokenException') {
                    handleExpiredTokenException();
                }
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
var generateReport = function (jobs) {
    fs_extra_1.default.ensureFileSync(reportPath);
    fs_extra_1.default.writeFileSync(reportPath, JSON.stringify(jobs, null, 4));
};
/**
 * While we basically fan-out deletes elsewhere in this script, leaving the app->cfn->bucket delete process
 * serial within a given account, it's not immediately clear if this is necessary, but seems possibly valuable.
 */
var deleteResources = function (account, accountIndex, staleResources) { return __awaiter(void 0, void 0, void 0, function () {
    var _i, _a, jobId, resources;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _i = 0, _a = Object.keys(staleResources);
                _b.label = 1;
            case 1:
                if (!(_i < _a.length)) return [3 /*break*/, 16];
                jobId = _a[_i];
                resources = staleResources[jobId];
                if (!resources.amplifyApps) return [3 /*break*/, 3];
                console.log("Deleting up to ".concat(DELETE_LIMITS.PER_BATCH.OTHER, " of ").concat(resources.amplifyApps.length, " apps on ACCOUNT[").concat(accountIndex, "]"));
                return [4 /*yield*/, deleteAmplifyApps(account, accountIndex, Object.values(resources.amplifyApps))];
            case 2:
                _b.sent();
                _b.label = 3;
            case 3:
                if (!resources.stacks) return [3 /*break*/, 5];
                console.log("Deleting up to ".concat(DELETE_LIMITS.PER_BATCH.CFN_STACK, " of ").concat(resources.stacks.length, " stacks on ACCOUNT[").concat(accountIndex, "]"));
                return [4 /*yield*/, deleteCfnStacks(account, accountIndex, Object.values(resources.stacks))];
            case 4:
                _b.sent();
                _b.label = 5;
            case 5:
                if (!resources.buckets) return [3 /*break*/, 7];
                console.log("Deleting up to ".concat(DELETE_LIMITS.PER_BATCH.OTHER, " of ").concat(resources.buckets.length, " buckets on ACCOUNT[").concat(accountIndex, "]"));
                return [4 /*yield*/, deleteBuckets(account, accountIndex, Object.values(resources.buckets))];
            case 6:
                _b.sent();
                _b.label = 7;
            case 7:
                if (!resources.roles) return [3 /*break*/, 9];
                console.log("Deleting up to ".concat(DELETE_LIMITS.PER_BATCH.OTHER, " of ").concat(resources.roles.length, " roles on ACCOUNT[").concat(accountIndex, "]"));
                return [4 /*yield*/, deleteIamRoles(account, accountIndex, Object.values(resources.roles))];
            case 8:
                _b.sent();
                _b.label = 9;
            case 9:
                if (!resources.pinpointApps) return [3 /*break*/, 11];
                console.log("Deleting up to ".concat(DELETE_LIMITS.PER_BATCH.OTHER, " of ").concat(resources.pinpointApps.length, " pinpoint apps on ACCOUNT[").concat(accountIndex, "]"));
                return [4 /*yield*/, deletePinpointApps(account, accountIndex, Object.values(resources.pinpointApps))];
            case 10:
                _b.sent();
                _b.label = 11;
            case 11:
                if (!resources.appSyncApis) return [3 /*break*/, 13];
                console.log("Deleting up to ".concat(DELETE_LIMITS.PER_BATCH.OTHER, " of ").concat(resources.appSyncApis.length, " appSyncApis on ACCOUNT[").concat(accountIndex, "]"));
                return [4 /*yield*/, deleteAppSyncApis(account, accountIndex, Object.values(resources.appSyncApis))];
            case 12:
                _b.sent();
                _b.label = 13;
            case 13:
                if (!resources.userPools) return [3 /*break*/, 15];
                console.log("Deleting up to ".concat(DELETE_LIMITS.PER_BATCH.OTHER, " of ").concat(resources.userPools.length, " userPools on ACCOUNT[").concat(accountIndex, "]"));
                return [4 /*yield*/, deleteUserPools(account, accountIndex, Object.values(resources.userPools))];
            case 14:
                _b.sent();
                _b.label = 15;
            case 15:
                _i++;
                return [3 /*break*/, 1];
            case 16: return [2 /*return*/];
        }
    });
}); };
/**
 * Grab the right CircleCI filter based on args passed in.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
var getFilterPredicate = function (args) {
    var filterByJobId = function (jobId) { return function (job) { return job.jobId === jobId; }; };
    var filterByWorkflowId = function (workflowId) { return function (job) { return job.workflowId === workflowId; }; };
    var filterAllStaleResources = function () { return function (job) { return job.lifecycle === 'finished' || job.jobId === ORPHAN; }; };
    if (args._.length === 0) {
        return filterAllStaleResources();
    }
    if (args._[0] === 'workflow') {
        return filterByWorkflowId(args.workflowId);
    }
    if (args._[0] === 'job') {
        if (Number.isNaN(args.jobId)) {
            throw new Error('job-id should be integer');
        }
        return filterByJobId(args.jobId.toString());
    }
    throw Error('Invalid args config');
};
/**
 * Retrieve the accounts to process for potential cleanup. By default we will attempt
 * to get all accounts within the root account organization.
 */
var getAccountsToCleanup = function () { return __awaiter(void 0, void 0, void 0, function () {
    var stsRes, parentAccountIdentity, orgApi, orgAccounts, allAccounts, nextToken, nextPage, accountCredentialPromises, e_13;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                stsRes = new aws.STS({
                    apiVersion: '2011-06-15',
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                    sessionToken: process.env.AWS_SESSION_TOKEN,
                });
                return [4 /*yield*/, stsRes.getCallerIdentity().promise()];
            case 1:
                parentAccountIdentity = _a.sent();
                orgApi = new aws.Organizations({
                    apiVersion: '2016-11-28',
                    // the region where the organization exists
                    region: 'us-east-1',
                });
                _a.label = 2;
            case 2:
                _a.trys.push([2, 8, , 9]);
                return [4 /*yield*/, orgApi.listAccounts().promise()];
            case 3:
                orgAccounts = _a.sent();
                allAccounts = orgAccounts.Accounts;
                nextToken = orgAccounts.NextToken;
                _a.label = 4;
            case 4:
                if (!nextToken) return [3 /*break*/, 6];
                return [4 /*yield*/, orgApi.listAccounts({ NextToken: nextToken }).promise()];
            case 5:
                nextPage = _a.sent();
                allAccounts.push.apply(allAccounts, nextPage.Accounts);
                nextToken = nextPage.NextToken;
                return [3 /*break*/, 4];
            case 6:
                accountCredentialPromises = allAccounts.map(function (account) { return __awaiter(void 0, void 0, void 0, function () {
                    var randomNumber, assumeRoleRes;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                if (account.Id === parentAccountIdentity.Account) {
                                    return [2 /*return*/, {
                                            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                                            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                                            sessionToken: process.env.AWS_SESSION_TOKEN,
                                            parent: true,
                                        }];
                                }
                                randomNumber = Math.floor(Math.random() * 100000);
                                return [4 /*yield*/, stsRes
                                        .assumeRole({
                                        RoleArn: "arn:aws:iam::".concat(account.Id, ":role/OrganizationAccountAccessRole"),
                                        RoleSessionName: "testSession".concat(randomNumber),
                                        // One hour
                                        DurationSeconds: 1 * 60 * 60,
                                    })
                                        .promise()];
                            case 1:
                                assumeRoleRes = _a.sent();
                                return [2 /*return*/, {
                                        accessKeyId: assumeRoleRes.Credentials.AccessKeyId,
                                        secretAccessKey: assumeRoleRes.Credentials.SecretAccessKey,
                                        sessionToken: assumeRoleRes.Credentials.SessionToken,
                                        parent: false,
                                    }];
                        }
                    });
                }); });
                return [4 /*yield*/, Promise.all(accountCredentialPromises)];
            case 7: return [2 /*return*/, _a.sent()];
            case 8:
                e_13 = _a.sent();
                console.error(e_13);
                console.log('Error assuming child account role. This could be because the script is already running from within a child account. Running on current AWS account only.');
                return [2 /*return*/, [
                        {
                            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                            sessionToken: process.env.AWS_SESSION_TOKEN,
                            parent: true,
                        },
                    ]];
            case 9: return [2 /*return*/];
        }
    });
}); };
var cleanupAccount = function (account, accountIndex, filterPredicate) { return __awaiter(void 0, void 0, void 0, function () {
    var appPromises, stackPromises, bucketPromise, orphanPinpointApplicationsPromise, orphanBucketPromise, orphanIamRolesPromise, orphanAppSyncApisPromise, orphanUserPoolsPromise, apps, stacks, buckets, orphanBuckets, orphanIamRoles, orphanPinpointApplications, orphanAppSyncApis, orphanUserPools, allResources, testApps, testStacks, orphanedResources, staleResources;
    var _a, _b;
    var _c, _d, _e, _f, _g, _h;
    return __generator(this, function (_j) {
        switch (_j.label) {
            case 0:
                appPromises = AWS_REGIONS_TO_RUN_TESTS.map(function (region) { return getAmplifyApps(account, region); });
                stackPromises = AWS_REGIONS_TO_RUN_TESTS.map(function (region) { return getStacks(account, region); });
                bucketPromise = getS3Buckets(account);
                orphanPinpointApplicationsPromise = AWS_REGIONS_TO_RUN_TESTS_PINPOINT.map(function (region) {
                    return getOrphanPinpointApplications(account, region);
                });
                orphanBucketPromise = getOrphanS3TestBuckets(account);
                orphanIamRolesPromise = getOrphanTestIamRoles(account);
                orphanAppSyncApisPromise = AWS_REGIONS_TO_RUN_TESTS.map(function (region) { return getOrphanAppSyncApis(account, region); });
                orphanUserPoolsPromise = AWS_REGIONS_TO_RUN_TESTS.map(function (region) { return getOrphanUserPools(account, region); });
                return [4 /*yield*/, Promise.all(appPromises)];
            case 1:
                apps = (_j.sent()).flat();
                return [4 /*yield*/, Promise.all(stackPromises)];
            case 2:
                stacks = (_j.sent()).flat();
                return [4 /*yield*/, bucketPromise];
            case 3:
                buckets = _j.sent();
                return [4 /*yield*/, orphanBucketPromise];
            case 4:
                orphanBuckets = _j.sent();
                return [4 /*yield*/, orphanIamRolesPromise];
            case 5:
                orphanIamRoles = _j.sent();
                return [4 /*yield*/, Promise.all(orphanPinpointApplicationsPromise)];
            case 6:
                orphanPinpointApplications = (_j.sent()).flat();
                return [4 /*yield*/, Promise.all(orphanAppSyncApisPromise)];
            case 7:
                orphanAppSyncApis = (_j.sent()).flat();
                return [4 /*yield*/, Promise.all(orphanUserPoolsPromise)];
            case 8:
                orphanUserPools = (_j.sent()).flat();
                allResources = mergeResourcesByCCIJob(apps, stacks, buckets, orphanBuckets, orphanIamRoles, orphanPinpointApplications, orphanAppSyncApis, orphanUserPools);
                testApps = (_d = (_c = allResources['<unknown>']) === null || _c === void 0 ? void 0 : _c.amplifyApps) === null || _d === void 0 ? void 0 : _d.filter(function (a) { return a.name.toLocaleLowerCase().includes('test'); });
                testStacks = (_f = (_e = allResources['<unknown>']) === null || _e === void 0 ? void 0 : _e.stacks) === null || _f === void 0 ? void 0 : _f.filter(function (s) { return s.stackName.toLocaleLowerCase().includes('test') && s.stackName.toLocaleLowerCase().includes('amplify'); });
                orphanedResources = allResources['<orphan>'];
                orphanedResources.amplifyApps = (_g = orphanedResources.amplifyApps) !== null && _g !== void 0 ? _g : [];
                orphanedResources.stacks = (_h = orphanedResources.stacks) !== null && _h !== void 0 ? _h : [];
                (_a = orphanedResources.amplifyApps).push.apply(_a, (testApps ? testApps : []));
                (_b = orphanedResources.stacks).push.apply(_b, (testStacks ? testStacks : []));
                staleResources = lodash_1.default.pickBy(allResources, filterPredicate);
                generateReport(staleResources);
                return [4 /*yield*/, deleteResources(account, accountIndex, staleResources)];
            case 9:
                _j.sent();
                console.log("[ACCOUNT ".concat(accountIndex, "] Cleanup done!"));
                return [2 /*return*/];
        }
    });
}); };
/**
 * Execute the cleanup script.
 * Cleanup will happen in parallel across all accounts within a given organization,
 * based on the requested filter parameters (i.e. for a given workflow, job, or all stale resources).
 * Logs are emitted for given account ids anywhere we've fanned out, but we use an indexing scheme instead
 * of account ids since the logs these are written to will be effectively public.
 */
var cleanup = function () { return __awaiter(void 0, void 0, void 0, function () {
    var args, filterPredicate, accounts, i;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                args = yargs_1.default
                    .command('*', 'clean up all the stale resources')
                    .command('workflow <workflow-id>', 'clean all the resources created by workflow', function (_yargs) {
                    _yargs.positional('workflowId', {
                        describe: 'Workflow Id of the workflow',
                        type: 'string',
                        demandOption: '',
                    });
                })
                    .command('job <jobId>', 'clean all the resource created by a job', function (_yargs) {
                    _yargs.positional('jobId', {
                        describe: 'job id of the job',
                        type: 'number',
                    });
                })
                    .help().argv;
                (0, dotenv_1.config)();
                filterPredicate = getFilterPredicate(args);
                return [4 /*yield*/, getAccountsToCleanup()];
            case 1:
                accounts = _a.sent();
                i = 0;
                _a.label = 2;
            case 2:
                if (!(i < 3)) return [3 /*break*/, 6];
                console.log('CLEANUP ROUND: ', i + 1);
                return [4 /*yield*/, Promise.all(accounts.map(function (account, i) {
                        return cleanupAccount(account, i, filterPredicate);
                    }))];
            case 3:
                _a.sent();
                return [4 /*yield*/, (0, amplify_e2e_core_1.sleep)(60 * 1000)];
            case 4:
                _a.sent(); // run again after 60 seconds
                _a.label = 5;
            case 5:
                i++;
                return [3 /*break*/, 2];
            case 6:
                console.log('Done cleaning all accounts!');
                return [2 /*return*/];
        }
    });
}); };
void cleanup();
//# sourceMappingURL=cleanup-e2e-resources.js.map