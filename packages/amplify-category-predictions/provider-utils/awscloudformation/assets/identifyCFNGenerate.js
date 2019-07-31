
function generateStorageCFNForLambda(storageCFNFile, functionName, prefixForAdminTrigger) {
  // Add reference for the new triggerFunction
  storageCFNFile.Parameters[`function${functionName}Arn`] = {
    Type: 'String',
    Default: `function${functionName}Arn`,
  };

  storageCFNFile.Parameters[`function${functionName}Name`] = {
    Type: 'String',
    Default: `function${functionName}Name`,
  };

  storageCFNFile.Parameters[`function${functionName}LambdaExecutionRole`] = {
    Type: 'String',
    Default: `function${functionName}LambdaExecutionRole`,
  };


  storageCFNFile.Parameters.triggerFunction = {
    Type: 'String',
  };

  storageCFNFile.Parameters.adminTriggerFunction = {
    Type: 'String',
  };

  storageCFNFile.Resources.S3Bucket.DependsOn = ['AdminTriggerPermissions'];

  storageCFNFile.Resources.S3Bucket.Properties.NotificationConfiguration = {
    LambdaConfigurations: [
      {
        Event: 's3:ObjectCreated:*',
        Filter: {
          S3Key: {
            Rules: [{
              Name: 'prefix',
              Value: prefixForAdminTrigger,
            },
            ],
          },
        },
        Function: {
          Ref: `function${functionName}Arn`,
        },
      },
      {
        Event: 's3:ObjectRemoved:*',
        Filter: {
          S3Key: {
            Rules: [{
              Name: 'prefix',
              Value: prefixForAdminTrigger,
            },
            ],
          },
        },
        Function: {
          Ref: `function${functionName}Arn`,
        },
      },
    ],
  };

  storageCFNFile.Resources.AdminTriggerPermissions = {
    Type: 'AWS::Lambda::Permission',
    Properties: {
      Action: 'lambda:InvokeFunction',
      FunctionName: {
        Ref: `function${functionName}Name`,
      },
      Principal: 's3.amazonaws.com',
      SourceAccount: {
        Ref: 'AWS::AccountId',
      },
      SourceArn: {
        'Fn::Join': [
          '',
          [
            'arn:aws:s3:::',
            {
              'Fn::If': [
                'ShouldNotCreateEnvResources',
                {
                  Ref: 'bucketName',
                },
                {
                  'Fn::Join': [
                    '',
                    [
                      {
                        Ref: 'bucketName',
                      },
                      '-',
                      {
                        Ref: 'env',
                      },
                    ],
                  ],
                },
              ],
            },
          ],
        ],
      },
    },
  };

  storageCFNFile.Resources.S3TriggerBucketPolicy = {
    Type: 'AWS::IAM::Policy',
    DependsOn: [
      'S3Bucket',
    ],
    Properties: {
      PolicyName: 's3-trigger-lambda-execution-policy',
      Roles: [
        {
          Ref: `function${functionName}LambdaExecutionRole`,
        },
      ],
      PolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              's3:PutObject',
              's3:GetObject',
              's3:ListBucket',
              's3:DeleteObject',
            ],
            Resource: [
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:aws:s3:::',
                    {
                      Ref: 'S3Bucket',
                    },
                    '/*',
                  ],
                ],
              },
            ],
          },
        ],
      },
    },
  };

  return storageCFNFile;
}


function generateStorageCFNForAdditionalLambda(storageCFNFile, functionName, prefixForAdminTrigger) {
  storageCFNFile.Parameters[`function${functionName}Arn`] = {
    Type: 'String',
    Default: `function${functionName}Arn`,
  };

  storageCFNFile.Parameters[`function${functionName}Name`] = {
    Type: 'String',
    Default: `function${functionName}Name`,
  };

  storageCFNFile.Parameters[`function${functionName}LambdaExecutionRole`] = {
    Type: 'String',
    Default: `function${functionName}LambdaExecutionRole`,
  };


  storageCFNFile.Parameters.triggerFunction = {
    Type: 'String',
  };

  storageCFNFile.Parameters.adminTriggerFunction = {
    Type: 'String',
  };

  storageCFNFile.Resources.S3Bucket.DependsOn.push('AdminTriggerPermissions');

  // Modify existing notification configuration here//

  const lambdaConfigurations = [];
  storageCFNFile.Resources.S3Bucket.Properties.NotificationConfiguration.LambdaConfigurations.forEach((triggers) => {
    if (!triggers.Filter) {
      lambdaConfigurations.push(addObjectKeys(
        triggers,
        {
          Filter: {
            S3Key: {
              Rules: [
                {
                  Name: 'prefix',
                  Value: {
                    'Fn::Join': [
                      '',
                      [
                        'protected/',
                        {
                          Ref: 'AWS::Region',
                        },

                      ],
                    ],
                  },
                },
              ],
            },
          },
        },
      ));
      lambdaConfigurations.push(addObjectKeys(
        triggers,
        {
          Filter: {
            S3Key: {
              Rules: [
                {
                  Name: 'prefix',
                  Value: {
                    'Fn::Join': [
                      '',
                      [
                        'private/',
                        {
                          Ref: 'AWS::Region',
                        },

                      ],
                    ],
                  },
                },
              ],
            },
          },
        },
      ));
      lambdaConfigurations.push(addObjectKeys(
        triggers,
        {
          Filter: {
            S3Key: {
              Rules: [
                {
                  Name: 'prefix',
                  Value: {
                    'Fn::Join': [
                      '',
                      [
                        'public/',
                        {
                          Ref: 'AWS::Region',
                        },

                      ],
                    ],
                  },
                },
              ],
            },
          },
        },
      ));
    } else {
      lambdaConfigurations.push(triggers);
    }
  });

  lambdaConfigurations.push(
    {
      Event: 's3:ObjectCreated:*',
      Filter: {
        S3Key: {
          Rules: [
            {
              Name: 'prefix',
              Value: prefixForAdminTrigger,
            },
          ],
        },
      },
      Function: {
        Ref: `function${functionName}Arn`,
      },
    },
    {
      Event: 's3:ObjectRemoved:*',
      Filter: {
        S3Key: {
          Rules: [
            {
              Name: 'prefix',
              Value: prefixForAdminTrigger,
            },
          ],
        },
      },
      Function: {
        Ref: `function${functionName}Arn`,
      },
    },
  );

  storageCFNFile.Resources.S3Bucket.Properties.NotificationConfiguration.LambdaConfigurations = lambdaConfigurations;

  storageCFNFile.Resources.AdminTriggerPermissions = {
    Type: 'AWS::Lambda::Permission',
    Properties: {
      Action: 'lambda:InvokeFunction',
      FunctionName: {
        Ref: `function${functionName}Name`,
      },
      Principal: 's3.amazonaws.com',
      SourceAccount: {
        Ref: 'AWS::AccountId',
      },
      SourceArn: {
        'Fn::Join': [
          '',
          [
            'arn:aws:s3:::',
            {
              'Fn::If': [
                'ShouldNotCreateEnvResources',
                {
                  Ref: 'bucketName',
                },
                {
                  'Fn::Join': [
                    '',
                    [
                      {
                        Ref: 'bucketName',
                      },
                      '-',
                      {
                        Ref: 'env',
                      },
                    ],
                  ],
                },
              ],
            },
          ],
        ],
      },
    },
  };

  storageCFNFile.Resources.S3TriggerBucketPolicy.Properties.Roles.push({
    Ref: `function${functionName}LambdaExecutionRole`,
  });

  return storageCFNFile;
}

function generateLambdaAccessForRekognition(identifyCFNFile, functionName, s3ResourceName) {
  identifyCFNFile.Parameters[`function${functionName}Arn`] = {
    Type: 'String',
    Default: `function${functionName}Arn`,
  };

  identifyCFNFile.Parameters[`function${functionName}Name`] = {
    Type: 'String',
    Default: `function${functionName}Name`,
  };

  identifyCFNFile.Parameters[`function${functionName}LambdaExecutionRole`] = {
    Type: 'String',
    Default: `function${functionName}LambdaExecutionRole`,
  };

  identifyCFNFile.Parameters[`storage${s3ResourceName}BucketName`] = {
    Type: 'String',
    Default: `storage${s3ResourceName}BucketName`,
  };

  identifyCFNFile.Outputs.collectionId = {
    Value: {
      'Fn::If': [
        'ShouldNotCreateEnvResources',
        {
          Ref: 'resourceName',
        },
        {
          'Fn::Join': [
            '',
            [
              {
                Ref: 'resourceName',
              },
              '-',
              {
                Ref: 'env',
              },
            ],
          ],
        },
      ],
    },
  };

  identifyCFNFile.Resources.LambdaRekognitionAccessPolicy = {
    Type: 'AWS::IAM::Policy',
    Properties: {
      PolicyName: 'amplify-lambda-execution-rekognition-policy',
      Roles: [
        {
          Ref: `function${functionName}LambdaExecutionRole`,
        },
      ],
      PolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'rekognition:ListFaces',
              'rekognition:IndexFaces',
              'rekognition:DeleteFaces',
            ],
            Resource: [
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:aws:rekognition:',
                    {
                      Ref: 'AWS::Region',
                    },
                    ':',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':',
                    'collection/',
                    {
                      'Fn::If': [
                        'ShouldNotCreateEnvResources',
                        {
                          Ref: 'resourceName',
                        },
                        {
                          'Fn::Join': [
                            '',
                            [
                              {
                                Ref: 'resourceName',
                              },
                              '-',
                              {
                                Ref: 'env',
                              },
                            ],
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
            ],
          },
        ],
      },
    },
  };

  identifyCFNFile.Resources.CollectionCreationFunction = {
    Type: 'AWS::Lambda::Function',
    Properties: {
      Code: {
        ZipFile: {
          'Fn::Join': [
            '\n',
            [
              "const response = require('cfn-response');",
              "const aws = require('aws-sdk');",
              'let responseData = {};',
              'exports.handler = function(event, context) {',
              '  try {',
              "    if (event.RequestType == 'Delete') {",
              '        let params = {',
              '           CollectionId: event.ResourceProperties.collectionId',
              '        };',
              "        const rekognition = new aws.Rekognition({ apiVersion: '2016-06-27', region: event.ResourceProperties.region });",
              '        rekognition.deleteCollection(params).promise()',
              '        .then((res) => {',
              '        console.log("delete" + res);',
              '        console.log("response data" + JSON.stringify(res));',
              '        response.send(event, context, response.SUCCESS, res);',
              '     });',
              '    }',
              "    if (event.RequestType == 'Update' || event.RequestType == 'Create') {",
              '       const collectionId = event.ResourceProperties.collectionId;',
              '       const params = {',
              '          CollectionId: collectionId',
              '       };',
              "       const rekognition = new aws.Rekognition({ apiVersion: '2016-06-27', region: event.ResourceProperties.region });",
              '       rekognition.listCollections({}).promise()',
              '       .then((res) => {',
              '       let {CollectionIds} = res;',
              '       console.log("CollectionIds" + CollectionIds);',
              '       if(CollectionIds.indexOf(collectionId) !== -1) {',
              '         response.send(event, context, response.SUCCESS, responseData);',
              '       } else {',
              '           rekognition.createCollection(params).promise()',
              '           .then((res1) => {',
              '           responseData = res1;',
              '           console.log("responseData" + JSON.stringify(responseData)); console.log(collectionId);',
              '           let s3 = new aws.S3();',
              '           let params = {',
              '           Bucket: event.ResourceProperties.bucketName,',
              '           Key: "protected/predictions/index-faces/admin/"',
              '           };',
              '           s3.putObject(params).promise()',
              '           .then((s3Res) => {',
              '           if (s3Res.ETag) {',
              '              response.send(event, context, response.SUCCESS, responseData);',
              '           }',
              '           else {',
              '               response.send(event, context, response.FAILED, s3Res);',
              '           }',
              '           });',
              '       });',
              '    }',
              '    });',
              '    }',
              '  } catch(err) {',
              '       console.log(err.stack);',
              '       responseData = {Error: err};',
              '       response.send(event, context, response.FAILED, responseData);',
              '       throw err;',
              '  }',
              '};',
            ],
          ],
        },
      },
      Handler: 'index.handler',
      Runtime: 'nodejs8.10',
      Timeout: '300',
      Role: {
        'Fn::GetAtt': [
          'CollectionsLambdaExecutionRole',
          'Arn',
        ],
      },
    },
  };

  identifyCFNFile.Resources.CollectionFunctionOutputs = {
    Type: 'Custom::LambdaCallout',
    Properties: {
      ServiceToken: {
        'Fn::GetAtt': [
          'CollectionCreationFunction',
          'Arn',
        ],
      },
      region: {
        Ref: 'AWS::Region',
      },
      collectionId: {
        'Fn::If': [
          'ShouldNotCreateEnvResources',
          {
            Ref: 'resourceName',
          },
          {
            'Fn::Join': [
              '',
              [
                {
                  Ref: 'resourceName',
                },
                '-',
                {
                  Ref: 'env',
                },
              ],
            ],
          },
        ],
      },
      bucketName: {
        Ref: `storage${s3ResourceName}BucketName`,
      },
    },
  };

  identifyCFNFile.Resources.CollectionsLambdaExecutionRole = {
    Type: 'AWS::IAM::Role',
    Properties: {
      RoleName: {
        'Fn::If': [
          'ShouldNotCreateEnvResources',
          {
            Ref: 'resourceName',
          },
          {

            'Fn::Join': [
              '',
              [
                {
                  Ref: 'resourceName',
                },
                '-',
                {
                  Ref: 'env',
                },
              ],
            ],
          },
        ],
      },
      AssumeRolePolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: [
                'lambda.amazonaws.com',
              ],
            },
            Action: [
              'sts:AssumeRole',
            ],
          },
        ],
      },
      Policies: [
        {
          PolicyName: {
            Ref: 'resourceName',
          },
          PolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'logs:CreateLogGroup',
                  'logs:CreateLogStream',
                  'logs:PutLogEvents',
                ],
                Resource: 'arn:aws:logs:*:*:*',
              },
            ],
          },
        },
        {
          PolicyName: {
            Ref: 'identifyPolicyName',
          },
          PolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'rekognition:CreateCollection',
                  'rekognition:DeleteCollection',
                  's3:PutObject',
                ],
                Resource: [
                  {
                    'Fn::Join': [
                      '', [
                        'arn:aws:rekognition:',
                        { Ref: 'AWS::Region' },
                        ':',
                        { Ref: 'AWS::AccountId' },
                        ':',
                        'collection/',
                        {
                          'Fn::If': [
                            'ShouldNotCreateEnvResources',
                            {
                              Ref: 'resourceName',
                            },
                            {
                              'Fn::Join': [
                                '',
                                [
                                  {
                                    Ref: 'resourceName',
                                  },
                                  '-',
                                  {
                                    Ref: 'env',
                                  },
                                ],
                              ],
                            },
                          ],
                        },
                      ],
                    ],
                  },
                  {
                    'Fn::Join': [
                      '',
                      [
                        'arn:aws:s3:::',
                        {
                          Ref: `storage${s3ResourceName}BucketName`,
                        },
                        '/*',
                      ],
                    ],
                  },
                ],
              },
              {
                Effect: 'Allow',
                Action: [
                  'rekognition:ListCollections',
                ],
                Resource: '*',
              },
            ],
          },
        },
      ],
    },
  };

  return identifyCFNFile;
}

function generateStorageAccessForRekognition(identifyCFNFile, s3ResourceName, prefixForAdminTrigger) {
  identifyCFNFile.Parameters[`storage${s3ResourceName}BucketName`] = {
    Type: 'String',
    Default: `storage${s3ResourceName}BucketName`,
  };

  identifyCFNFile.Resources.S3AuthPredicitionsAdminProtectedPolicy = {
    Condition: 'CreateAdminAuthProtected',
    Type: 'AWS::IAM::Policy',
    Properties: {
      PolicyName: 'S3RekognitionAuthAdminFolderAccess',
      Roles: [
        {
          Ref: 'authRoleName',
        },
      ],
      PolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:DeleteObject', 's3:GetObject', 's3:PutObject'],
            Resource: [
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:aws:s3:::',
                    {
                      Ref: `storage${s3ResourceName}BucketName`,
                    },
                    `/${prefixForAdminTrigger}`,
                    '${cognito-identity.amazonaws.com:sub}/*', //eslint-disable-line
                  ],
                ],
              },
            ],
          },
        ],
      },
    },
  };
  identifyCFNFile.Resources.IdentifyEntitiesSearchFacesPolicy = {
    Type: 'AWS::IAM::Policy',
    Properties: {
      PolicyName: {
        'Fn::Join': [
          '', [
            { Ref: 'identifyPolicyName' },
            '-',
            'searchFaces',
          ],
        ],
      },
      Roles: {
        'Fn::If': [
          'AuthGuestRoleAccess',
          [{ Ref: 'authRoleName' }, { Ref: 'unauthRoleName' }],
          [{ Ref: 'authRoleName' }],
        ],
      },
      PolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['rekognition:SearchFacesByImage'],
            Resource: [
              {
                'Fn::Join': [
                  '', [
                    'arn:aws:rekognition:',
                    { Ref: 'AWS::Region' },
                    ':',
                    { Ref: 'AWS::AccountId' },
                    ':',
                    'collection/',
                    {
                      'Fn::If': [
                        'ShouldNotCreateEnvResources',
                        {
                          Ref: 'resourceName',
                        },
                        {
                          'Fn::Join': [
                            '',
                            [
                              {
                                Ref: 'resourceName',
                              },
                              '-',
                              {
                                Ref: 'env',
                              },
                            ],
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
            ],
          },
        ],
      },
    },
  };
  identifyCFNFile.Resources.S3GuestPredicitionsAdminPublicPolicy = {
    Condition: 'CreateAdminGuestProtected',
    Type: 'AWS::IAM::Policy',
    Properties: {
      PolicyName: 'S3RekognitionGuestAdminFolderAccess',
      Roles: [
        {
          Ref: 'unauthRoleName',
        },
      ],
      PolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:DeleteObject', 's3:GetObject', 's3:PutObject'],
            Resource: [
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:aws:s3:::',
                    {
                      Ref: `storage${s3ResourceName}BucketName`,
                    },
                    `/${prefixForAdminTrigger}`,
                        "${cognito-identity.amazonaws.com:sub}/*", // eslint-disable-line
                  ],
                ],
              },
            ],
          },
        ],
      },
    },
  };

  return identifyCFNFile;
}

function addObjectKeys(original, additional) {
  return { ...original, ...additional };
}

function addTextractPolicies(identifyCFNFile) {
  identifyCFNFile.Resources
    .IdentifyTextPolicy.Properties.PolicyDocument.Statement[0].Action = [
      'rekognition:DetectText',
      'rekognition:DetectLabel',
      'textract:AnalyzeDocument',
      'textract:DetectDocumentText',
      'textract:GetDocumentAnalysis',
      'textract:StartDocumentTextDetection',
    ];
  return JSON.stringify(identifyCFNFile, null, 4);
}

function removeTextractPolicies(identifyCFNFile) {
  identifyCFNFile.Resources
    .IdentifyTextPolicy.Properties.PolicyDocument.Statement[0].Action = ['rekognition:DetectText', 'rekognition:DetectLabel'];
  return JSON.stringify(identifyCFNFile, null, 4);
}

module.exports = {
  generateStorageAccessForRekognition,
  generateLambdaAccessForRekognition,
  generateStorageCFNForAdditionalLambda,
  generateStorageCFNForLambda,
  addTextractPolicies,
  removeTextractPolicies,
};
