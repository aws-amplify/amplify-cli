/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable spellcheck/spell-checker */
import {
  $TSAny,
  $TSContext,
  AmplifyCategories,
  AmplifyError,
  AmplifySupportedService,
  exitOnNextTick,
  IAmplifyResource,
  ResourceDoesNotExistError,
} from '@aws-amplify/amplify-cli-core';
import { alphanumeric, printer, prompter, integer } from '@aws-amplify/amplify-prompts';
import os from 'os';
import path from 'path';
// FIXME: may be removed from here, since addResource can pass category to addWalkthrough
const category = AmplifyCategories.ANALYTICS;
const service = AmplifySupportedService.KINESIS;

/**
 * Kinesis resource add walkthrough
 * @param context Amplify context
 * @param defaultValuesFilename Filename for default values to be configured in Kinesis
 * @param serviceMetadata Amplify Meta for analytics category kinesis resource
 * @returns kinesis resource name
 */
export const addWalkthrough = async (context: $TSContext, defaultValuesFilename: string, serviceMetadata: $TSAny): Promise<$TSContext> => {
  const resourceName = resourceAlreadyExists(context);

  if (resourceName) {
    throw new AmplifyError('ResourceAlreadyExistsError', {
      message: 'Kinesis resource have already been added to your project.',
      resolution: 'Please run amplify update analytics to make changes to the existing Kinesis resource.',
    });
  }
  return configure(context, defaultValuesFilename, serviceMetadata);
};

/**
 * migration not implemented/required
 */
export const migrate = (): void => {
  // no-op for now
};

interface IKinesisCRUDPolicy {
  Effect: string;
  Action: $TSAny;
  Resource: $TSAny;
}
interface IKinesisPolicyAttributes {
  policy: IKinesisCRUDPolicy;
  attributes: Array<$TSAny>;
}

/**
 * Auth resource configuration state.
 * requirementsMet is set to true if all required
 * configurations of the Auth resource have been configured.
 */
interface IAuthConfigRequirements {
  errors: Array<string>;
  authEnabled: boolean;
  authImported: boolean;
  authSelections: boolean;
  allowUnauthenticatedIdentities: boolean;
  requirementsMet: boolean;
}

interface IKinesisCRUDPolicy {
  Effect: string;
  Action: $TSAny;
  Resource: $TSAny;
}

interface IKinesisPolicyAttributes {
  policy: IKinesisCRUDPolicy;
  attributes: Array<$TSAny>;
}

interface IKinesisStreamInfo {
  kinesisStreamName: string;
  kinesisStreamShardCount: number;
}

interface IKinesisAuthInfo {
  authRoleName: { Ref: string };
  unauthRoleName: { Ref: string };
  authPolicyName: string;
  unauthPolicyName: string;
}

interface IKinesisInfo extends IKinesisStreamInfo, IKinesisAuthInfo {}

const configure = async (
  context: $TSContext,
  defaultValuesFilename: string,
  serviceMetadata: $TSAny,
  resourceName: string | null = null,
): Promise<$TSAny> => {
  const { amplify } = context;
  const defaultValuesSrc = `${__dirname}/../default-values/${defaultValuesFilename}`;
  const { getAllDefaults } = require(defaultValuesSrc);
  const defaultValues: IKinesisInfo = getAllDefaults(amplify.getProjectDetails());
  const projectBackendDirPath = amplify.pathManager.getBackendDirPath();

  const answers = {
    kinesisStreamName:
      resourceName ||
      (await prompter.input('Enter a Stream name', {
        validate: alphanumeric('Name is invalid. Has to be non-empty and alphanumeric'),
        initial: defaultValues.kinesisStreamName,
      })),
    kinesisStreamShardCount: await prompter.input<'one', number>('Enter number of shards', {
      transform: (input) => Number.parseInt(input, 10),
      initial: 1,
      validate: integer(),
    }),
  };

  const targetResourceName = answers.kinesisStreamName;
  const shardCount = answers.kinesisStreamShardCount;
  const templateDir = `${__dirname}/../cloudformation-templates`;
  const resourceDirPath = path.join(projectBackendDirPath, category, targetResourceName);

  if (!resourceName && resourceNameAlreadyExists(context, targetResourceName)) {
    throw new Error(`Resource ${targetResourceName} already exists in ${category} category.`);
  }

  const copyJobs = [
    {
      dir: templateDir,
      template: serviceMetadata.cfnFilename,
      target: path.join(resourceDirPath, serviceMetadata.cfnFilename),
      paramsFile: path.join(resourceDirPath, 'parameters.json'),
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

  const checkResult: IAuthConfigRequirements = await context.amplify.invokePluginMethod(context, 'auth', undefined, 'checkRequirements', [
    analyticsRequirements,
    context,
    'analytics',
    targetResourceName,
  ]);

  // If auth is imported and configured, we have to throw the error instead of printing since there is no way to adjust the auth
  // configuration.
  if (checkResult.authImported === true && checkResult.errors && checkResult.errors.length > 0) {
    throw new AmplifyError('ConfigurationError', {
      message: 'The imported auth config is not compatible with the specified analytics config',
      details: checkResult.errors.join(os.EOL),
      resolution: 'Manually configure the imported auth resource according to the details above',
    });
  }

  if (checkResult.errors && checkResult.errors.length > 0) {
    printer.warn(checkResult.errors.join(os.EOL));
  }

  // If auth is not imported and there were errors, adjust or enable auth configuration
  if (!checkResult.authEnabled || !checkResult.requirementsMet) {
    printer.warn('Adding analytics would add the Auth category to the project if not already added.');
    if (
      !(await amplify.confirmPrompt(
        'Apps need authorization to send analytics events. Do you want to allow guests and unauthenticated users to send analytics events? (we recommend you allow this when getting started)',
      ))
    ) {
      printer.warn('Authorize only authenticated users to send analytics events. Use "amplify update auth" to modify this behavior.');
      analyticsRequirements.allowUnauthenticatedIdentities = false;
    }
    await context.amplify.invokePluginMethod(context, 'auth', undefined, 'externalAuthEnable', [
      context,
      'analytics',
      targetResourceName,
      analyticsRequirements,
    ]);
  }

  // At this point we have a valid auth configuration either imported or added/updated.
  // allow overwrite in update case: resourceName specified
  await amplify.copyBatch(context, copyJobs, {}, !!resourceName, params);
  return targetResourceName;
};

/**
 * Returns true if a Kinesis resource already exists with the given name
 * @param context Amplify CLI context
 * @param name Kinesis resource name
 * @returns true if resource with the same name exists
 */
const resourceNameAlreadyExists = (context: $TSContext, name: string): boolean => {
  const { amplify } = context;
  const { amplifyMeta } = amplify.getProjectDetails();

  return category in amplifyMeta ? Object.keys(amplifyMeta[category]).includes(name) : false;
};

/**
 * Kinesis resource CLI walkthrough
 * @param context Amplify CLI context
 * @param defaultValuesFilename File name for Kinesis default values
 * @param serviceMetadata Amplify Meta, Analytics resource for Kinesis service
 * @returns Kinesis resource name?( needs validation )
 */
export const updateWalkthrough = async (context: $TSContext, defaultValuesFilename: string, serviceMetadata: $TSAny): Promise<$TSAny> => {
  const { amplify } = context;
  const { allResources } = await amplify.getResourceStatus();
  const kinesisResources = (allResources as IAmplifyResource[])
    .filter((resource) => resource.service === service)
    .map((resource) => resource.resourceName);

  let targetResourceName;
  if (kinesisResources.length === 0) {
    const errMessage = 'No Kinesis streams resource to update. Please use "amplify add analytics" command to create a new Kinesis stream';
    printer.error(errMessage);
    await context.usageData.emitError(new ResourceDoesNotExistError(errMessage));
    exitOnNextTick(0);
    return;
  }

  if (kinesisResources.length === 1) {
    [targetResourceName] = kinesisResources;
    printer.success(`Selected resource ${targetResourceName}`);
  } else {
    targetResourceName = await prompter.pick('Please select the Kinesis stream you want to update', kinesisResources);
  }

  const result: $TSAny = await configure(context, defaultValuesFilename, serviceMetadata, targetResourceName as string);
  // eslint-disable-next-line consistent-return
  return result;
};

/**
 * Generates Kinesis policies based on CRUD operations
 * @param resourceName Kinesis resource name
 * @param crudOptions  ['create', 'read', 'update', 'delete']
 * @returns Kinesis policy for the given CRUD configuration
 */
export const getIAMPolicies = (resourceName: string, crudOptions: Array<$TSAny>): IKinesisPolicyAttributes => {
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

/**
 * Returns the resourceName if it already exists
 * @param context Amplify CLI context
 * @returns resourceName if found
 */
const resourceAlreadyExists = (context: $TSContext): string | undefined => {
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
