const inquirer = require('inquirer');
const path = require('path');
// FIXME: may be removed from here, since addResource can pass category to addWalkthrough
const category = 'analytics';

async function addWalkthrough(context, defaultValuesFilename, serviceMetadata) {
  return configure(context, defaultValuesFilename, serviceMetadata);
}

function migrate() {
  // no-op for now
}

function configure(context, defaultValuesFilename, serviceMetadata) {
  const { amplify } = context;
  const { inputs } = serviceMetadata;
  const defaultValuesSrc = `${__dirname}/../default-values/${defaultValuesFilename}`;
  const { getAllDefaults } = require(defaultValuesSrc);
  const defaultValues = getAllDefaults(amplify.getProjectDetails());
  const projectBackendDirPath = amplify.pathManager.getBackendDirPath();

  const questions = inputs.map(input => ({
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
  }));

  return inquirer.prompt(questions).then(async (answers) => {
    const resourceName = answers.kinesisStreamName;
    const shardCount = answers.kinesisStreamShardCount;
    const templateDir = `${__dirname}/../cloudformation-templates`;
    const resourceDirPath = path.join(projectBackendDirPath, category, resourceName);

    if (resourceNameAlreadyExists(context, resourceName)) {
      throw new Error(`Resource ${resourceName} already exists in ${category} category.`);
    }

    const copyJobs = [{
      dir: templateDir,
      template: serviceMetadata.cfnFilename,
      target: path.join(resourceDirPath, serviceMetadata.cfnFilename),
      paramsFile: path.join(resourceDirPath, 'parameters.json'),
    }];

    const params = {
      kinesisStreamName: resourceName,
      kinesisStreamShardCount: shardCount,
      authRoleName: defaultValues.authRoleName,
      unauthRoleName: defaultValues.unauthRoleName,
      authPolicyName: defaultValues.authPolicyName,
      unauthPolicyName: defaultValues.unauthPolicyName,
    };

    // we don't have to force CF template generation, since the resource name existence check
    // above should exclude the case when overwritting is needed
    await amplify.copyBatch(context, copyJobs, {}, false, params);
    return resourceName;
  });
}

function resourceNameAlreadyExists(context, name) {
  const { amplify } = context;
  const { amplifyMeta } = amplify.getProjectDetails();

  return category in amplifyMeta
    ? Object.keys(amplifyMeta[category]).includes(name)
    : false;
}

function getIAMPolicies(resourceName, crudOptions) {
  const actions = crudOptions.map((crudOption) => {
    switch (crudOption) {
      case 'read':
        return [
          'kinesis:DescribeStream',
          'kinesis:DescribeStreamSummary',
          'kinesis:GetRecords',
          'kinesis:GetShardIterator',
          'kinesis:ListShards',
          'kinesis:ListStreams',
          'kinesis:SubscribeToShard',
        ];
      default:
        return [];
    }
  }).reduce((flattened, kinesisActions) => [...flattened, ...kinesisActions], []);

  return {
    Effect: 'Allow',
    Actions: actions,
  };
}

module.exports = { addWalkthrough, migrate, getIAMPolicies };
