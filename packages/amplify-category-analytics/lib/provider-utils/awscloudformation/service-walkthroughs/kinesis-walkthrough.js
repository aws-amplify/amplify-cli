"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIAMPolicies = exports.updateWalkthrough = exports.migrate = exports.addWalkthrough = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const category = amplify_cli_core_1.AmplifyCategories.ANALYTICS;
const service = amplify_cli_core_1.AmplifySupportedService.KINESIS;
const addWalkthrough = async (context, defaultValuesFilename, serviceMetadata) => {
    const resourceName = resourceAlreadyExists(context);
    if (resourceName) {
        throw new amplify_cli_core_1.AmplifyError('ResourceAlreadyExistsError', {
            message: 'Kinesis resource have already been added to your project.',
            resolution: 'Please run amplify update analytics to make changes to the existing Kinesis resource.',
        });
    }
    return configure(context, defaultValuesFilename, serviceMetadata);
};
exports.addWalkthrough = addWalkthrough;
const migrate = () => {
};
exports.migrate = migrate;
const configure = async (context, defaultValuesFilename, serviceMetadata, resourceName = null) => {
    const { amplify } = context;
    const defaultValuesSrc = `${__dirname}/../default-values/${defaultValuesFilename}`;
    const { getAllDefaults } = require(defaultValuesSrc);
    const defaultValues = getAllDefaults(amplify.getProjectDetails());
    const projectBackendDirPath = amplify.pathManager.getBackendDirPath();
    const answers = {
        kinesisStreamName: resourceName ||
            (await amplify_prompts_1.prompter.input('Enter a Stream name', {
                validate: (0, amplify_prompts_1.alphanumeric)('Name is invalid. Has to be non-empty and alphanumeric'),
                initial: defaultValues.kinesisStreamName,
            })),
        kinesisStreamShardCount: await amplify_prompts_1.prompter.input('Enter number of shards', {
            transform: (input) => Number.parseInt(input, 10),
            initial: 1,
            validate: (0, amplify_prompts_1.integer)(),
        }),
    };
    const targetResourceName = answers.kinesisStreamName;
    const shardCount = answers.kinesisStreamShardCount;
    const templateDir = `${__dirname}/../cloudformation-templates`;
    const resourceDirPath = path_1.default.join(projectBackendDirPath, category, targetResourceName);
    if (!resourceName && resourceNameAlreadyExists(context, targetResourceName)) {
        throw new Error(`Resource ${targetResourceName} already exists in ${category} category.`);
    }
    const copyJobs = [
        {
            dir: templateDir,
            template: serviceMetadata.cfnFilename,
            target: path_1.default.join(resourceDirPath, serviceMetadata.cfnFilename),
            paramsFile: path_1.default.join(resourceDirPath, 'parameters.json'),
        },
    ];
    const params = {
        kinesisStreamName: targetResourceName,
        kinesisStreamShardCount: shardCount,
        authRoleName: defaultValues.authRoleName,
        unauthRoleName: defaultValues.unauthRoleName,
        authPolicyName: defaultValues.authPolicyName,
        unauthPolicyName: defaultValues.unauthPolicyName,
    };
    const analyticsRequirements = {
        authSelections: 'identityPoolOnly',
        allowUnauthenticatedIdentities: true,
    };
    const checkResult = await context.amplify.invokePluginMethod(context, 'auth', undefined, 'checkRequirements', [
        analyticsRequirements,
        context,
        'analytics',
        targetResourceName,
    ]);
    if (checkResult.authImported === true && checkResult.errors && checkResult.errors.length > 0) {
        throw new Error(checkResult.errors.join(os_1.default.EOL));
    }
    if (checkResult.errors && checkResult.errors.length > 0) {
        amplify_prompts_1.printer.warn(checkResult.errors.join(os_1.default.EOL));
    }
    if (!checkResult.authEnabled || !checkResult.requirementsMet) {
        amplify_prompts_1.printer.warn('Adding analytics would add the Auth category to the project if not already added.');
        if (!(await amplify.confirmPrompt('Apps need authorization to send analytics events. Do you want to allow guests and unauthenticated users to send analytics events? (we recommend you allow this when getting started)'))) {
            amplify_prompts_1.printer.warn('Authorize only authenticated users to send analytics events. Use "amplify update auth" to modify this behavior.');
            analyticsRequirements.allowUnauthenticatedIdentities = false;
        }
        await context.amplify.invokePluginMethod(context, 'auth', undefined, 'externalAuthEnable', [
            context,
            'analytics',
            targetResourceName,
            analyticsRequirements,
        ]);
    }
    await amplify.copyBatch(context, copyJobs, {}, !!resourceName, params);
    return targetResourceName;
};
const resourceNameAlreadyExists = (context, name) => {
    const { amplify } = context;
    const { amplifyMeta } = amplify.getProjectDetails();
    return category in amplifyMeta ? Object.keys(amplifyMeta[category]).includes(name) : false;
};
const updateWalkthrough = async (context, defaultValuesFilename, serviceMetadata) => {
    const { amplify } = context;
    const { allResources } = await amplify.getResourceStatus();
    const kinesisResources = allResources
        .filter((resource) => resource.service === service)
        .map((resource) => resource.resourceName);
    let targetResourceName;
    if (kinesisResources.length === 0) {
        const errMessage = 'No Kinesis streams resource to update. Please use "amplify add analytics" command to create a new Kinesis stream';
        amplify_prompts_1.printer.error(errMessage);
        await context.usageData.emitError(new amplify_cli_core_1.ResourceDoesNotExistError(errMessage));
        (0, amplify_cli_core_1.exitOnNextTick)(0);
        return;
    }
    if (kinesisResources.length === 1) {
        [targetResourceName] = kinesisResources;
        amplify_prompts_1.printer.success(`Selected resource ${targetResourceName}`);
    }
    else {
        targetResourceName = await amplify_prompts_1.prompter.pick('Please select the Kinesis stream you want to update', kinesisResources);
    }
    const result = await configure(context, defaultValuesFilename, serviceMetadata, targetResourceName);
    return result;
};
exports.updateWalkthrough = updateWalkthrough;
const getIAMPolicies = (resourceName, crudOptions) => {
    const actions = crudOptions
        .map((crudOption) => {
        switch (crudOption) {
            case 'create':
                return ['kinesis:CreateStream', 'kinesis:RegisterStreamConsumer', 'kinesis:AddTagsToStream'];
            case 'update':
                return [
                    'kinesis:EnableEnhancedMonitoring',
                    'kinesis:DisableEnhancedMonitoring',
                    'kinesis:IncreaseStreamRetentionPeriod',
                    'kinesis:DecreaseStreamRetentionPeriod',
                    'kinesis:MergeShards',
                    'kinesis:PutRecord',
                    'kinesis:PutRecords',
                    'kinesis:SplitShard',
                    'kinesis:UpdateShardCount',
                ];
            case 'read':
                return [
                    'kinesis:ListShards',
                    'kinesis:ListStreams',
                    'kinesis:ListStreamConsumers',
                    'kinesis:DescribeStream',
                    'kinesis:DescribeStreamSummary',
                    'kinesis:DescribeStreamConsumer',
                    'kinesis:GetRecords',
                    'kinesis:GetShardIterator',
                    'kinesis:SubscribeToShard',
                    'kinesis:DescribeLimits',
                    'kinesis:ListTagsForStream',
                    'kinesis:SubscribeToShard',
                ];
            case 'delete':
                return ['kinesis:DeleteStream', 'kinesis:DeregisterStreamConsumer', 'kinesis:RemoveTagsFromStream'];
            default:
                console.log(`${crudOption} not supported`);
                return [];
        }
    })
        .reduce((flattened, kinesisActions) => [...flattened, ...kinesisActions], []);
    const policy = {
        Effect: 'Allow',
        Action: actions,
        Resource: { Ref: `${category}${resourceName}kinesisStreamArn` },
    };
    const attributes = ['kinesisStreamArn'];
    return { policy, attributes };
};
exports.getIAMPolicies = getIAMPolicies;
const resourceAlreadyExists = (context) => {
    const { amplify } = context;
    const { amplifyMeta } = amplify.getProjectDetails();
    let resourceName;
    if (amplifyMeta[category]) {
        const categoryResources = amplifyMeta[category];
        Object.keys(categoryResources).forEach((resource) => {
            if (categoryResources[resource].service === service) {
                resourceName = resource;
            }
        });
    }
    return resourceName;
};
//# sourceMappingURL=kinesis-walkthrough.js.map