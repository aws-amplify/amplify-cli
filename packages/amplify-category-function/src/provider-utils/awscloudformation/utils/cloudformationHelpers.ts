import { appsyncTableSuffix } from './constants';
import { getAppSyncResourceName } from './appSyncHelper';
import { categoryName } from '../../../constants';

export function getNewCFNEnvVariables(oldCFNEnvVariables, currentDefaults, newCFNEnvVariables, newDefaults, apiResourceName?) {
  const currentResources = [];
  const newResources = [];
  let deletedResources = [];
  const categorySet = new Set();

  if (currentDefaults.permissions) {
    Object.keys(currentDefaults.permissions).forEach(category => {
      Object.keys(currentDefaults.permissions[category]).forEach(resourceName => {
        categorySet.add(category);
        currentResources.push(`${category.toUpperCase()}_${resourceName.toUpperCase()}_`);
      });
    });
  }

  if (newDefaults.permissions) {
    Object.keys(newDefaults.permissions).forEach(category => {
      Object.keys(newDefaults.permissions[category]).forEach(resourceName => {
        newResources.push(`${category.toUpperCase()}_${resourceName.toUpperCase()}_`);
      });
    });
  }

  if (apiResourceName) {
    apiResourceAddCheck(currentResources, newResources, apiResourceName, categorySet, true);
  }

  currentResources.forEach(resourceName => {
    if (newResources.indexOf(resourceName) === -1) {
      deletedResources.push(resourceName);
    }
  });

  const deleteAppSyncTableResources = deletedResources.filter(resource => resource.includes(appsyncTableSuffix.toUpperCase()));
  deletedResources = deletedResources.filter(resource => !resource.includes(appsyncTableSuffix.toUpperCase()));
  deleteAppSyncTableResources.forEach(table => {
    const appsyncResourceName = getAppSyncResourceName();
    const replacementTableSuffix = `:${appsyncTableSuffix.toUpperCase()}_`;
    const modelEnvPrefix = `API_${appsyncResourceName.toUpperCase()}_${table
      .replace(replacementTableSuffix, 'TABLE')
      .replace('STORAGE_', '')}`;
    const modelEnvNameKey = `${modelEnvPrefix}_NAME`;
    const modelEnvArnKey = `${modelEnvPrefix}_ARN`;
    deletedResources.push(modelEnvNameKey);
    deletedResources.push(modelEnvArnKey);
  });

  const toBeDeletedEnvVariables = [];
  Object.keys(oldCFNEnvVariables).forEach(envVar => {
    for (let i = 0; i < deletedResources.length; i += 1) {
      if (envVar.includes(deletedResources[i])) {
        toBeDeletedEnvVariables.push(envVar);
        break;
      }
    }
  });

  toBeDeletedEnvVariables.forEach(envVar => {
    delete oldCFNEnvVariables[envVar];
  });

  Object.assign(oldCFNEnvVariables, newCFNEnvVariables);

  return oldCFNEnvVariables;
}

export function getNewCFNParameters(oldCFNParameters, currentDefaults, newCFNResourceParameters, newDefaults, apiResourceName?) {
  const currentResources = [];
  const newResources = [];
  const deletedResources = [];

  const categorySet = new Set();
  if (currentDefaults.permissions) {
    Object.keys(currentDefaults.permissions).forEach(category => {
      Object.keys(currentDefaults.permissions[category]).forEach(resourceName => {
        categorySet.add(category);
        currentResources.push(`${category}${resourceName}`);
      });
    });
  }

  if (newDefaults.permissions) {
    Object.keys(newDefaults.permissions).forEach(category => {
      Object.keys(newDefaults.permissions[category]).forEach(resourceName => {
        newResources.push(`${category}${resourceName}`);
      });
    });
  }

  // hack to add api category to current defaults if storage is added
  if (apiResourceName) {
    apiResourceAddCheck(currentResources, newResources, apiResourceName, categorySet, false);
  }

  currentResources.forEach(resourceName => {
    if (newResources.indexOf(resourceName) === -1) {
      deletedResources.push(resourceName);
    }
  });

  const toBeDeletedParameters = [];

  Object.keys(oldCFNParameters).forEach(parameter => {
    for (let i = 0; i < deletedResources.length; i += 1) {
      if (parameter.includes(deletedResources[i])) {
        toBeDeletedParameters.push(parameter);
        break;
      }
    }
  });
  toBeDeletedParameters.forEach(parameter => {
    delete oldCFNParameters[parameter];
  });

  Object.assign(oldCFNParameters, newCFNResourceParameters);

  return oldCFNParameters;
}

export function getIAMPolicies(resourceName, crudOptions) {
  let policy = {};
  const actions = [];

  crudOptions.forEach(crudOption => {
    switch (crudOption) {
      case 'create':
        actions.push('lambda:Create*', 'lambda:Put*', 'lambda:Add*');
        break;
      case 'update':
        actions.push('lambda:Update*');
        break;
      case 'read':
        actions.push('lambda:Get*', 'lambda:List*', 'lambda:Invoke*');
        break;
      case 'delete':
        actions.push('lambda:Delete*', 'lambda:Remove*');
        break;
      default:
        console.log(`${crudOption} not supported`);
    }
  });

  policy = {
    Effect: 'Allow',
    Action: actions,
    Resource: [
      {
        'Fn::Join': [
          '',
          [
            'arn:aws:lambda:',
            {
              Ref: 'AWS::Region',
            },
            ':',
            { Ref: 'AWS::AccountId' },
            ':function:',
            {
              Ref: `${categoryName}${resourceName}Name`,
            },
          ],
        ],
      },
    ],
  };

  const attributes = ['Name'];

  return { policy, attributes };
}

/** CF template component of join function { "Fn::Join": ["": THIS_PART ] } */
export function constructCFModelTableArnComponent(appsyncResourceName, resourceName, appsyncTableSuffix) {
  return [
    'arn:aws:dynamodb:',
    { Ref: 'AWS::Region' },
    ':',
    { Ref: 'AWS::AccountId' },
    ':table/',
    constructCFModelTableNameComponent(appsyncResourceName, resourceName, appsyncTableSuffix),
  ];
}

/** CF template component of join function { "Fn::Join": ["-": THIS_PART ] } */
export function constructCFModelTableNameComponent(appsyncResourceName, resourceName, appsyncTableSuffix) {
  return {
    'Fn::ImportValue': {
      'Fn::Sub': `\${api${appsyncResourceName}GraphQLAPIIdOutput}:GetAtt:${resourceName.replace(`:${appsyncTableSuffix}`, 'Table')}:Name`,
    },
  };
}

export function constructCloudWatchEventComponent(cfnFilePath: string, cfnContent) {
  cfnContent.Resources.CloudWatchEvent = {
    Type: 'AWS::Events::Rule',
    Properties: {
      Description: 'Schedule rule for Lambda',
      ScheduleExpression: {
        Ref: 'CloudWatchRule',
      },
      State: 'ENABLED',
      Targets: [
        {
          Arn: { 'Fn::GetAtt': ['LambdaFunction', 'Arn'] },
          Id: {
            Ref: 'LambdaFunction',
          },
        },
      ],
    },
  };
  // append permissions to invoke lambda via cloiudwatch to CFN file
  cfnContent.Resources.PermissionForEventsToInvokeLambda = {
    Type: 'AWS::Lambda::Permission',
    Properties: {
      FunctionName: {
        Ref: 'LambdaFunction',
      },
      Action: 'lambda:InvokeFunction',
      Principal: 'events.amazonaws.com',
      SourceArn: { 'Fn::GetAtt': ['CloudWatchEvent', 'Arn'] },
    },
  };
  // append the outputs section of cloudwatchRULE
  cfnContent.Outputs.CloudWatchEventRule = {
    Value: {
      Ref: 'CloudWatchEvent',
    },
  };

  // apend the cloudwatch parameters if not present
  if (cfnContent.Parameters.CloudWatchRule === undefined) {
    cfnContent.Parameters.CloudWatchRule = {
      Type: 'String',
      Default: 'NONE',
      Description: ' Schedule Expression',
    };
  }
}

function apiResourceAddCheck(currentResources, newResources, apiResourceName, resourceSet, isEnvParams) {
  const apiAddFlag = resourceSet.has('api') || !newResources.find(resource => resource.includes('storage'));
  if (apiAddFlag) {
    isEnvParams ? currentResources.push(`API_${apiResourceName.toUpperCase()}_`) : currentResources.push(`api${apiResourceName}`);
  }
}
