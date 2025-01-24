/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable no-param-reassign */
/**
 * Adds S3 config to storageCFNFile
 */
const generateStorageCFNForLambda = (storageCFNFile, functionName, prefixForAdminTrigger) => {
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
    DependsOn: ['S3Bucket'],
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
            Action: ['s3:PutObject', 's3:GetObject', 's3:ListBucket', 's3:DeleteObject'],
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
};

/**
 * Adds S3 configuration for lambda access
 */
const generateStorageCFNForAdditionalLambda = (storageCFNFile, functionName, prefixForAdminTrigger) => {
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
      lambdaConfigurations.push(
        addObjectKeys(triggers, {
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
        }),
      );
      lambdaConfigurations.push(
        addObjectKeys(triggers, {
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
        }),
      );
      lambdaConfigurations.push(
        addObjectKeys(triggers, {
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
        }),
      );
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
};

/**
 * Adds resources to identifyCFNFile for lambda access to rekognition
 */
const generateLambdaAccessForRekognition = (identifyCFNFile, functionName, s3ResourceName) => {
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
            Action: ['rekognition:ListFaces', 'rekognition:IndexFaces', 'rekognition:DeleteFaces'],
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
              "const { RekognitionClient, CreateCollectionCommand, DeleteCollectionCommand, ListCollectionsCommand } = require('@aws-sdk/client-rekognition');",
              "const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');",
              'let responseData = {};',
              'exports.handler = function(event, context) {',
              "    // Don't return promise, response.send() marks context as done internally",
              '    const ignoredPromise = handleEvent(event, context)',
              '};',
              'async function handleEvent(event, context) {',
              '    try {',
              "        if (event.RequestType === 'Delete') {",
              '            try {',
              '                let params = {',
              '                    CollectionId: event.ResourceProperties.collectionId',
              '                };',
              '                const rekognition = new RekognitionClient({ region: event.ResourceProperties.region });',
              '                const res = await rekognition.send(new DeleteCollectionCommand(params));',
              '                console.log("delete" + res);',
              '                console.log("response data" + JSON.stringify(res));',
              '                response.send(event, context, response.SUCCESS, res);',
              '            } catch(err) {',
              "                if (err.name !== 'NotFoundException') {",
              '                    response.send(event, context, response.FAILED);',
              '                } else {',
              '                    response.send(event, context, response.SUCCESS);',
              '                }',
              '            }',
              "        } else if (event.RequestType === 'Update' || event.RequestType === 'Create') {",
              '            const collectionId = event.ResourceProperties.collectionId;',
              '            const params = {',
              '                CollectionId: collectionId',
              '            };',
              '            const rekognition = new RekognitionClient({ region: event.ResourceProperties.region });',
              '            const res = await rekognition.send(new ListCollectionsCommand({}));',
              '            let CollectionIds = res.CollectionIds ?? [];',
              '            console.log("CollectionIds" + CollectionIds);',
              '            if(CollectionIds.indexOf(collectionId) !== -1) {',
              '                response.send(event, context, response.SUCCESS, responseData);',
              '            } else {',
              '                responseData = await rekognition.send(new CreateCollectionCommand(params));',
              '                console.log("responseData" + JSON.stringify(responseData)); console.log(collectionId);',
              '                let s3 = new S3Client({});',
              '                let s3params = {',
              '                    Bucket: event.ResourceProperties.bucketName,',
              '                    Key: "protected/predictions/index-faces/admin/"',
              '                };',
              '                const s3Res = await s3.send(new PutObjectCommand(s3params));',
              '                if (s3Res.ETag) {',
              '                    response.send(event, context, response.SUCCESS, responseData);',
              '                }',
              '                else {',
              '                    response.send(event, context, response.FAILED, s3Res);',
              '                }',
              '            }',
              '        }',
              '    } catch(err) {',
              '        console.log(err.stack);',
              '        responseData = {Error: err};',
              '        response.send(event, context, response.FAILED, responseData);',
              '    }',
              '}',
            ],
          ],
        },
      },
      Handler: 'index.handler',
      Runtime: 'nodejs22.x',
      Timeout: 300,
      Role: {
        'Fn::GetAtt': ['CollectionsLambdaExecutionRole', 'Arn'],
      },
    },
  };

  identifyCFNFile.Resources.CollectionFunctionOutputs = {
    Type: 'Custom::LambdaCallout',
    Properties: {
      ServiceToken: {
        'Fn::GetAtt': ['CollectionCreationFunction', 'Arn'],
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

  identifyCFNFile.Resources.LambdaCloudWatchPolicy = {
    Type: 'AWS::IAM::Policy',
    Properties: {
      PolicyName: 'CollectionsLambdaCloudWatchPolicy',
      Roles: [
        {
          Ref: 'CollectionsLambdaExecutionRole',
        },
      ],
      PolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
            Resource: {
              'Fn::Sub': [
                'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/${lambdaName}:log-stream:*',
                {
                  lambdaName: {
                    Ref: 'CollectionCreationFunction',
                  },
                },
              ],
            },
          },
        ],
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
              Service: ['lambda.amazonaws.com'],
            },
            Action: ['sts:AssumeRole'],
          },
        ],
      },
      Policies: [
        {
          PolicyName: {
            Ref: 'identifyPolicyName',
          },
          PolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['rekognition:CreateCollection', 'rekognition:DeleteCollection', 's3:PutObject'],
                Resource: [
                  {
                    'Fn::Join': [
                      '',
                      [
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
                Action: ['rekognition:ListCollections'],
                Resource: '*',
              },
            ],
          },
        },
      ],
    },
  };

  return identifyCFNFile;
};

/**
 * Attaches resources to rekognition s3 access to identifyCFNFile
 */
const generateStorageAccessForRekognition = (identifyCFNFile, s3ResourceName, prefixForAdminTrigger) => {
  identifyCFNFile.Parameters[`storage${s3ResourceName}BucketName`] = {
    Type: 'String',
    Default: `storage${s3ResourceName}BucketName`,
  };

  // eslint-disable-next-line spellcheck/spell-checker
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
        'Fn::Join': ['', [{ Ref: 'identifyPolicyName' }, '-', 'searchFaces']],
      },
      Roles: {
        'Fn::If': ['AuthGuestRoleAccess', [{ Ref: 'authRoleName' }, { Ref: 'unauthRoleName' }], [{ Ref: 'authRoleName' }]],
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
                  '',
                  [
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
  // eslint-disable-next-line spellcheck/spell-checker
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
                    '${cognito-identity.amazonaws.com:sub}/*', // eslint-disable-line
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
};

const addObjectKeys = (original, additional) => ({ ...original, ...additional });

/**
 * Sets rekognition + textract policies
 */
const addTextractPolicies = (identifyCFNFile) => {
  identifyCFNFile.Resources.IdentifyTextPolicy.Properties.PolicyDocument.Statement[0].Action = [
    'rekognition:DetectText',
    'rekognition:DetectLabel',
    'textract:AnalyzeDocument',
    'textract:DetectDocumentText',
    'textract:GetDocumentAnalysis',
    'textract:StartDocumentTextDetection',
  ];
  return JSON.stringify(identifyCFNFile, null, 4);
};

/**
 * Sets only rekognition policies
 */
const removeTextractPolicies = (identifyCFNFile) => {
  identifyCFNFile.Resources.IdentifyTextPolicy.Properties.PolicyDocument.Statement[0].Action = [
    'rekognition:DetectText',
    'rekognition:DetectLabel',
  ];
  return JSON.stringify(identifyCFNFile, null, 4);
};

module.exports = {
  generateStorageAccessForRekognition,
  generateLambdaAccessForRekognition,
  generateStorageCFNForAdditionalLambda,
  generateStorageCFNForLambda,
  addTextractPolicies,
  removeTextractPolicies,
};
