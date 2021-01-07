const inquirer = require('inquirer');
const path = require('path');
const os = require('os');
// FIXME: may be removed from here, since addResource can pass category to addWalkthrough
const category = 'analytics';
const service = 'Kinesis';
const { ResourceAlreadyExistsError, ResourceDoesNotExistError, exitOnNextTick } = require('amplify-cli-core');

async function addWalkthrough(context, defaultValuesFilename, serviceMetadata) {
  const resourceName = resourceAlreadyExists(context);

  if (resourceName) {
    const errMessage = 'Kinesis resource have already been added to your project.';
    context.print.warning(errMessage);
    await context.usageData.emitError(new ResourceAlreadyExistsError(errMessage));
    exitOnNextTick(0);
  }
  return configure(context, defaultValuesFilename, serviceMetadata);
}

function migrate() {
  // no-op for now
}

function configure(context, defaultValuesFilename, serviceMetadata, resourceName = null) {
  const { amplify } = context;
  const { inputs } = serviceMetadata;
  const defaultValuesSrc = `${__dirname}/../default-values/${defaultValuesFilename}`;
  const { getAllDefaults } = require(defaultValuesSrc);
  const defaultValues = getAllDefaults(amplify.getProjectDetails());
  const projectBackendDirPath = amplify.pathManager.getBackendDirPath();

  const questions = inputs
    .map(input => ({
      name: input.key,
      message: input.question,
      type: input.type || 'input',
      choices: input.options || undefined,
      required: input.required || false,
      validate: 'validation' in input ? amplify.inputValidation(input) : undefined,
      default: () => {
        const defaultValue = defaultValues[input.key];
        return defaultValue;
      },
    }))
    // when resourceName is provider, we are in update flow - skip name question
    .filter(question => (resourceName && question.name !== 'kinesisStreamName') || !resourceName);

  return inquirer.prompt(questions).then(async answers => {
    const targetResourceName = resourceName || answers.kinesisStreamName;
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

    const checkResult = await context.amplify.invokePluginMethod(context, 'auth', undefined, 'checkRequirements', [
      analyticsRequirements,
      context,
      'analytics',
      targetResourceName,
    ]);

    // If auth is imported and configured, we have to throw the error instead of printing since there is no way to adjust the auth
    // configuration.
    if (checkResult.authImported === true && checkResult.errors && checkResult.errors.length > 0) {
      throw new Error(checkResult.errors.join(os.EOL));
    }

    if (checkResult.errors && checkResult.errors.length > 0) {
      context.print.warning(checkResult.errors.join(os.EOL));
    }

    // If auth is not imported and there were errors, adjust or enable auth configuration
    if (!checkResult.authEnabled || !checkResult.requirementsMet) {
      context.print.warning('Adding analytics would add the Auth category to the project if not already added.');
      if (
        await amplify.confirmPrompt(
          'Apps need authorization to send analytics events. Do you want to allow guests and unauthenticated users to send analytics events? (we recommend you allow this when getting started)',
        )
      ) {
        try {
          await context.amplify.invokePluginMethod(context, 'auth', undefined, 'externalAuthEnable', [
            context,
            'analytics',
            targetResourceName,
            analyticsRequirements,
          ]);
        } catch (error) {
          context.print.error(error);
          throw error;
        }
      } else {
        try {
          context.print.warning(
            'Authorize only authenticated users to send analytics events. Use "amplify update auth" to modify this behavior.',
          );
          analyticsRequirements.allowUnauthenticatedIdentities = false;
          await context.amplify.invokePluginMethod(context, 'auth', undefined, 'externalAuthEnable', [
            context,
            'analytics',
            targetResourceName,
            analyticsRequirements,
          ]);
        } catch (error) {
          context.print.error(error);
          throw error;
        }
      }
    }

    // At this point we have a valid auth configuration either imported or added/updated.

    // allow overwrite in update case: resourceName specified
    await amplify.copyBatch(context, copyJobs, {}, !!resourceName, params);
    return targetResourceName;
  });
}

function resourceNameAlreadyExists(context, name) {
  const { amplify } = context;
  const { amplifyMeta } = amplify.getProjectDetails();

  return category in amplifyMeta ? Object.keys(amplifyMeta[category]).includes(name) : false;
}

async function updateWalkthrough(context, defaultValuesFilename, serviceMetadata) {
  const { amplify } = context;
  const { allResources } = await amplify.getResourceStatus();
  const kinesisResources = allResources.filter(resource => resource.service === service).map(resource => resource.resourceName);

  let targetResourceName;
  if (kinesisResources.length === 0) {
    const errMessage = 'No Kinesis streams resource to update. Please use "amplify add analytics" command to create a new Kinesis stream';
    context.print.error(errMessage);
    await context.usageData.emitError(new ResourceDoesNotExistError(errMessage));
    exitOnNextTick(0);
    return;
  } else if (kinesisResources.length === 1) {
    [targetResourceName] = kinesisResources;
    context.print.success(`Selected resource ${targetResourceName}`);
  } else {
    const resourceQuestion = [
      {
        name: 'resourceName',
        message: 'Please select the Kinesis stream you would want to update',
        type: 'list',
        choices: kinesisResources,
      },
    ];

    const answer = await inquirer.prompt(resourceQuestion);
    targetResourceName = answer.resourceName;
  }

  return configure(context, defaultValuesFilename, serviceMetadata, targetResourceName);
}

function getIAMPolicies(resourceName, crudOptions) {
  const actions = crudOptions
    .map(crudOption => {
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
}

function resourceAlreadyExists(context) {
  const { amplify } = context;
  const { amplifyMeta } = amplify.getProjectDetails();
  let resourceName;

  if (amplifyMeta[category]) {
    const categoryResources = amplifyMeta[category];
    Object.keys(categoryResources).forEach(resource => {
      if (categoryResources[resource].service === service) {
        resourceName = resource;
      }
    });
  }

  return resourceName;
}

module.exports = {
  addWalkthrough,
  migrate,
  getIAMPolicies,
  updateWalkthrough,
};
