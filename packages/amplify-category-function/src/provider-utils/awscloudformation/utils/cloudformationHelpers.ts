import { categoryName } from './constants';

export function getNewCFNEnvVariables(oldCFNEnvVariables, currentDefaults, newCFNEnvVariables, newDefaults) {
  const currentResources = [];
  const newResources = [];
  const deletedResources = [];

  if (currentDefaults.permissions) {
    Object.keys(currentDefaults.permissions).forEach(category => {
      Object.keys(currentDefaults.permissions[category]).forEach(resourceName => {
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

  currentResources.forEach(resourceName => {
    if (newResources.indexOf(resourceName) === -1) {
      deletedResources.push(resourceName);
    }
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

export function getNewCFNParameters(oldCFNParameters, currentDefaults, newCFNResourceParameters, newDefaults) {
  const currentResources = [];
  const newResources = [];
  const deletedResources = [];

  if (currentDefaults.permissions) {
    Object.keys(currentDefaults.permissions).forEach(category => {
      Object.keys(currentDefaults.permissions[category]).forEach(resourceName => {
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
