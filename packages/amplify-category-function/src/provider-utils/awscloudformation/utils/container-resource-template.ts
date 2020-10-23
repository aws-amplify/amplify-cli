const buildspec = `version: 0.2
phases:
  install:
    runtime-versions:
      docker: 19
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws --version
      - $(aws ecr get-login --region $AWS_DEFAULT_REGION --no-include-email)
      # - REPOSITORY_URI=694883026597.dkr.ecr.us-east-1.amazonaws.com/docker-on-aws/nodejs
      - COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
      - IMAGE_TAG=\${COMMIT_HASH:=latest}
  build:
    commands:
      - echo Build started on \`date\`
      - echo Building the Docker image...
      - docker build -t $REPOSITORY_URI:latest .
      - docker tag $REPOSITORY_URI:latest $REPOSITORY_URI:$IMAGE_TAG
  post_build:
    commands:
      - echo Build completed on \`date\`
      - echo Pushing the Docker images...
      - docker push $REPOSITORY_URI:latest
      - docker push $REPOSITORY_URI:$IMAGE_TAG
      - echo Writing image definitions file...
      - printf '[{"name":"%s","imageUri":"%s"}]' $CONTAINER_NAME $REPOSITORY_URI:$IMAGE_TAG > imagedefinitions.json
artifacts:
    files: imagedefinitions.json
    `;

export const containerTemplate = {
  Parameters: {
    env: {
      Type: 'String',
    },
    ParamDeploymentBucket: {
      Type: 'String',
    },
    ParamContainerPort: {
      Type: 'Number',
    },
    ParamZipPath: {
      Type: 'String',
    },
    ParamZipPath2: {
      Type: 'String',
      Default: '',
    },
    ParamRepositoryName: {
      Type: 'String',
    },
    CustomResourceAwaiterZipPath: {
      Type: 'String',
      Description: 'S3 key for asset version "c691172cdeefa2c91b5a2907f9d81118e47597634943344795f1a844192dd49c"',
      Default: 'custom-resource-pipeline-awaiter.zip',
    },
  },
  Resources: {
    MyRepository4C4BD5FC: {
      Type: 'AWS::ECR::Repository',
      UpdateReplacePolicy: 'Retain',
      DeletionPolicy: 'Retain',
      Metadata: {
        'aws:cdk:path': 'WithcdkStack/MyRepository/Resource',
      },
    },
    MyTaskTaskRole560858C4: {
      Type: 'AWS::IAM::Role',
      Properties: {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ecs-tasks.amazonaws.com',
              },
            },
          ],
          Version: '2012-10-17',
        },
      },
      Metadata: {
        'aws:cdk:path': 'WithcdkStack/MyTask/TaskRole/Resource',
      },
    },
    MyTaskF5748B4B: {
      Type: 'AWS::ECS::TaskDefinition',
      Properties: {
        ContainerDefinitions: [
          {
            Essential: true,
            Image: {
              'Fn::Join': [
                '',
                [
                  {
                    'Fn::Select': [
                      4,
                      {
                        'Fn::Split': [
                          ':',
                          {
                            'Fn::GetAtt': ['MyRepository4C4BD5FC', 'Arn'],
                          },
                        ],
                      },
                    ],
                  },
                  '.dkr.ecr.',
                  {
                    'Fn::Select': [
                      3,
                      {
                        'Fn::Split': [
                          ':',
                          {
                            'Fn::GetAtt': ['MyRepository4C4BD5FC', 'Arn'],
                          },
                        ],
                      },
                    ],
                  },
                  '.',
                  {
                    Ref: 'AWS::URLSuffix',
                  },
                  '/',
                  {
                    Ref: 'MyRepository4C4BD5FC',
                  },
                  ':latest',
                ],
              ],
            },
            Name: 'MyContainer',
            PortMappings: [
              {
                ContainerPort: {
                  Ref: 'ParamContainerPort',
                },
                Protocol: 'tcp',
              },
            ],
          },
        ],
        Cpu: '256',
        ExecutionRoleArn: {
          'Fn::GetAtt': ['MyTaskExecutionRoleD2FEFCB2', 'Arn'],
        },
        Family: 'WithcdkStackMyTask766B14A2',
        Memory: '512',
        NetworkMode: 'awsvpc',
        RequiresCompatibilities: ['FARGATE'],
        TaskRoleArn: {
          'Fn::GetAtt': ['MyTaskTaskRole560858C4', 'Arn'],
        },
      },
      Metadata: {
        'aws:cdk:path': 'WithcdkStack/MyTask/Resource',
      },
    },
    MyTaskExecutionRoleD2FEFCB2: {
      Type: 'AWS::IAM::Role',
      Properties: {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ecs-tasks.amazonaws.com',
              },
            },
          ],
          Version: '2012-10-17',
        },
      },
      Metadata: {
        'aws:cdk:path': 'WithcdkStack/MyTask/ExecutionRole/Resource',
      },
    },
    MyTaskExecutionRoleDefaultPolicy8A6B211B: {
      Type: 'AWS::IAM::Policy',
      Properties: {
        PolicyDocument: {
          Statement: [
            {
              Action: ['ecr:BatchCheckLayerAvailability', 'ecr:GetDownloadUrlForLayer', 'ecr:BatchGetImage'],
              Effect: 'Allow',
              Resource: {
                'Fn::GetAtt': ['MyRepository4C4BD5FC', 'Arn'],
              },
            },
            {
              Action: 'ecr:GetAuthorizationToken',
              Effect: 'Allow',
              Resource: '*',
            },
          ],
          Version: '2012-10-17',
        },
        PolicyName: 'MyTaskExecutionRoleDefaultPolicy8A6B211B',
        Roles: [
          {
            Ref: 'MyTaskExecutionRoleD2FEFCB2',
          },
        ],
      },
      Metadata: {
        'aws:cdk:path': 'WithcdkStack/MyTask/ExecutionRole/DefaultPolicy/Resource',
      },
    },
    MyPipelineMyCodeBuildProjectRole628DDF8B: {
      Type: 'AWS::IAM::Role',
      Properties: {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'codebuild.amazonaws.com',
              },
            },
          ],
          Version: '2012-10-17',
        },
      },
      Metadata: {
        'aws:cdk:path': 'WithcdkStack/MyPipeline/MyCodeBuildProject/Role/Resource',
      },
    },
    MyPipelineMyCodeBuildProjectRoleDefaultPolicy14FB0869: {
      Type: 'AWS::IAM::Policy',
      Properties: {
        PolicyDocument: {
          Statement: [
            {
              Action: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
              Effect: 'Allow',
              Resource: [
                {
                  'Fn::Join': [
                    '',
                    [
                      'arn:',
                      {
                        Ref: 'AWS::Partition',
                      },
                      ':logs:',
                      {
                        Ref: 'AWS::Region',
                      },
                      ':',
                      {
                        Ref: 'AWS::AccountId',
                      },
                      ':log-group:/aws/codebuild/',
                      {
                        Ref: 'MyPipelineMyCodeBuildProjectA4EF580E',
                      },
                    ],
                  ],
                },
                {
                  'Fn::Join': [
                    '',
                    [
                      'arn:',
                      {
                        Ref: 'AWS::Partition',
                      },
                      ':logs:',
                      {
                        Ref: 'AWS::Region',
                      },
                      ':',
                      {
                        Ref: 'AWS::AccountId',
                      },
                      ':log-group:/aws/codebuild/',
                      {
                        Ref: 'MyPipelineMyCodeBuildProjectA4EF580E',
                      },
                      ':*',
                    ],
                  ],
                },
              ],
            },
            {
              Action: ['codebuild:CreateReportGroup', 'codebuild:CreateReport', 'codebuild:UpdateReport', 'codebuild:BatchPutTestCases'],
              Effect: 'Allow',
              Resource: {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':codebuild:',
                    {
                      Ref: 'AWS::Region',
                    },
                    ':',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':report-group/',
                    {
                      Ref: 'MyPipelineMyCodeBuildProjectA4EF580E',
                    },
                    '-*',
                  ],
                ],
              },
            },
            {
              Action: ['s3:GetObject*', 's3:GetBucket*', 's3:List*', 's3:DeleteObject*', 's3:PutObject*', 's3:Abort*'],
              Effect: 'Allow',
              Resource: [
                {
                  'Fn::Join': [
                    '',
                    [
                      'arn:',
                      {
                        Ref: 'AWS::Partition',
                      },
                      ':s3:::',
                      {
                        Ref: 'ParamDeploymentBucket',
                      },
                    ],
                  ],
                },
                {
                  'Fn::Join': [
                    '',
                    [
                      'arn:',
                      {
                        Ref: 'AWS::Partition',
                      },
                      ':s3:::',
                      {
                        Ref: 'ParamDeploymentBucket',
                      },
                      '/*',
                    ],
                  ],
                },
              ],
            },
            {
              Action: [
                'ecr:GetAuthorizationToken',
                'ecr:BatchGetImage',
                'ecr:BatchGetDownloadUrlForLayer',
                'ecr:InitiateLayerUpload',
                'ecr:BatchCheckLayerAvailability',
                'ecr:UploadLayerPart',
                'ecr:CompleteLayerUpload',
                'ecr:PutImage',
              ],
              Effect: 'Allow',
              Resource: '*',
            },
          ],
          Version: '2012-10-17',
        },
        PolicyName: 'MyPipelineMyCodeBuildProjectRoleDefaultPolicy14FB0869',
        Roles: [
          {
            Ref: 'MyPipelineMyCodeBuildProjectRole628DDF8B',
          },
        ],
      },
      Metadata: {
        'aws:cdk:path': 'WithcdkStack/MyPipeline/MyCodeBuildProject/Role/DefaultPolicy/Resource',
      },
    },
    MyPipelineMyCodeBuildProjectA4EF580E: {
      Type: 'AWS::CodeBuild::Project',
      Properties: {
        Artifacts: {
          Type: 'CODEPIPELINE',
        },
        Environment: {
          ComputeType: 'BUILD_GENERAL1_SMALL',
          Image: 'aws/codebuild/standard:4.0',
          PrivilegedMode: true,
          Type: 'LINUX_CONTAINER',
        },
        ServiceRole: {
          'Fn::GetAtt': ['MyPipelineMyCodeBuildProjectRole628DDF8B', 'Arn'],
        },
        Source: {
          Type: 'CODEPIPELINE',
        },
        EncryptionKey: 'alias/aws/s3',
      },
      Metadata: {
        'aws:cdk:path': 'WithcdkStack/MyPipeline/MyCodeBuildProject/Resource',
      },
    },
    MyPipelineRoleFEDCDE7E: {
      Type: 'AWS::IAM::Role',
      Properties: {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'codepipeline.amazonaws.com',
              },
            },
          ],
          Version: '2012-10-17',
        },
      },
      Metadata: {
        'aws:cdk:path': 'WithcdkStack/MyPipeline/MyPipeline/Role/Resource',
      },
    },
    MyPipelineRoleDefaultPolicyE391E38A: {
      Type: 'AWS::IAM::Policy',
      Properties: {
        PolicyDocument: {
          Statement: [
            {
              Action: ['s3:GetObject*', 's3:GetBucket*', 's3:List*', 's3:DeleteObject*', 's3:PutObject*', 's3:Abort*'],
              Effect: 'Allow',
              Resource: [
                {
                  'Fn::Join': [
                    '',
                    [
                      'arn:',
                      {
                        Ref: 'AWS::Partition',
                      },
                      ':s3:::',
                      {
                        Ref: 'ParamDeploymentBucket',
                      },
                    ],
                  ],
                },
                {
                  'Fn::Join': [
                    '',
                    [
                      'arn:',
                      {
                        Ref: 'AWS::Partition',
                      },
                      ':s3:::',
                      {
                        Ref: 'ParamDeploymentBucket',
                      },
                      '/*',
                    ],
                  ],
                },
              ],
            },
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Resource: {
                'Fn::GetAtt': ['MyPipelineSourceCodePipelineActionRoleB3E4554A', 'Arn'],
              },
            },
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Resource: {
                'Fn::GetAtt': ['MyPipelineBuildCodePipelineActionRole969D9396', 'Arn'],
              },
            },
          ],
          Version: '2012-10-17',
        },
        PolicyName: 'MyPipelineRoleDefaultPolicyE391E38A',
        Roles: [
          {
            Ref: 'MyPipelineRoleFEDCDE7E',
          },
        ],
      },
      Metadata: {
        'aws:cdk:path': 'WithcdkStack/MyPipeline/MyPipeline/Role/DefaultPolicy/Resource',
      },
    },
    MyPipelineFF2E7D8D: {
      Type: 'AWS::CodePipeline::Pipeline',
      Properties: {
        RoleArn: {
          'Fn::GetAtt': ['MyPipelineRoleFEDCDE7E', 'Arn'],
        },
        Stages: [
          {
            Actions: [
              {
                ActionTypeId: {
                  Category: 'Source',
                  Owner: 'AWS',
                  Provider: 'S3',
                  Version: '1',
                },
                Configuration: {
                  S3Bucket: {
                    Ref: 'ParamDeploymentBucket',
                  },
                  S3ObjectKey: {
                    Ref: 'ParamZipPath',
                  },
                },
                Name: 'Source',
                OutputArtifacts: [
                  {
                    Name: 'SourceArtifact',
                  },
                ],
                RoleArn: {
                  'Fn::GetAtt': ['MyPipelineSourceCodePipelineActionRoleB3E4554A', 'Arn'],
                },
                RunOrder: 1,
              },
            ],
            Name: 'Source',
          },
          {
            Actions: [
              {
                ActionTypeId: {
                  Category: 'Build',
                  Owner: 'AWS',
                  Provider: 'CodeBuild',
                  Version: '1',
                },
                Configuration: {
                  ProjectName: {
                    Ref: 'MyPipelineMyCodeBuildProjectA4EF580E',
                  },
                  EnvironmentVariables: {
                    'Fn::Join': [
                      '',
                      [
                        '[{"name":"REPOSITORY_URI","type":"PLAINTEXT","value":"',
                        {
                          'Fn::Select': [
                            4,
                            {
                              'Fn::Split': [
                                ':',
                                {
                                  'Fn::GetAtt': ['MyRepository4C4BD5FC', 'Arn'],
                                },
                              ],
                            },
                          ],
                        },
                        '.dkr.ecr.',
                        {
                          'Fn::Select': [
                            3,
                            {
                              'Fn::Split': [
                                ':',
                                {
                                  'Fn::GetAtt': ['MyRepository4C4BD5FC', 'Arn'],
                                },
                              ],
                            },
                          ],
                        },
                        '.',
                        {
                          Ref: 'AWS::URLSuffix',
                        },
                        '/',
                        {
                          Ref: 'MyRepository4C4BD5FC',
                        },
                        '"},{"name":"CONTAINER_NAME","type":"PLAINTEXT","value":""}]',
                      ],
                    ],
                  },
                },
                InputArtifacts: [
                  {
                    Name: 'SourceArtifact',
                  },
                ],
                Name: 'Build',
                OutputArtifacts: [
                  {
                    Name: 'BuildArtifact',
                  },
                ],
                RoleArn: {
                  'Fn::GetAtt': ['MyPipelineBuildCodePipelineActionRole969D9396', 'Arn'],
                },
                RunOrder: 1,
              },
            ],
            Name: 'Build',
          },
        ],
        ArtifactStore: {
          Location: {
            Ref: 'ParamDeploymentBucket',
          },
          Type: 'S3',
        },
      },
      DependsOn: ['MyPipelineRoleDefaultPolicyE391E38A', 'MyPipelineRoleFEDCDE7E'],
      Metadata: {
        'aws:cdk:path': 'WithcdkStack/MyPipeline/MyPipeline/Resource',
      },
    },
    MyPipelineSourceCodePipelineActionRoleB3E4554A: {
      Type: 'AWS::IAM::Role',
      Properties: {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                AWS: {
                  'Fn::Join': [
                    '',
                    [
                      'arn:',
                      {
                        Ref: 'AWS::Partition',
                      },
                      ':iam::',
                      {
                        Ref: 'AWS::AccountId',
                      },
                      ':root',
                    ],
                  ],
                },
              },
            },
          ],
          Version: '2012-10-17',
        },
      },
      Metadata: {
        'aws:cdk:path': 'WithcdkStack/MyPipeline/MyPipeline/Source/Source/CodePipelineActionRole/Resource',
      },
    },
    MyPipelineSourceCodePipelineActionRoleDefaultPolicyA63E9DEC: {
      Type: 'AWS::IAM::Policy',
      Properties: {
        PolicyDocument: {
          Statement: [
            {
              Action: ['s3:GetObject*', 's3:GetBucket*', 's3:List*'],
              Effect: 'Allow',
              Resource: [
                {
                  'Fn::Join': [
                    '',
                    [
                      'arn:',
                      {
                        Ref: 'AWS::Partition',
                      },
                      ':s3:::',
                      {
                        Ref: 'ParamDeploymentBucket',
                      },
                    ],
                  ],
                },
                {
                  'Fn::Join': [
                    '',
                    [
                      'arn:',
                      {
                        Ref: 'AWS::Partition',
                      },
                      ':s3:::',
                      {
                        Ref: 'ParamDeploymentBucket',
                      },
                      '/*',
                    ],
                  ],
                },
              ],
            },
            {
              Action: ['s3:DeleteObject*', 's3:PutObject*', 's3:Abort*'],
              Effect: 'Allow',
              Resource: [
                {
                  'Fn::Join': [
                    '',
                    [
                      'arn:',
                      {
                        Ref: 'AWS::Partition',
                      },
                      ':s3:::',
                      {
                        Ref: 'ParamDeploymentBucket',
                      },
                    ],
                  ],
                },
                {
                  'Fn::Join': [
                    '',
                    [
                      'arn:',
                      {
                        Ref: 'AWS::Partition',
                      },
                      ':s3:::',
                      {
                        Ref: 'ParamDeploymentBucket',
                      },
                      '/*',
                    ],
                  ],
                },
              ],
            },
          ],
          Version: '2012-10-17',
        },
        PolicyName: 'MyPipelineSourceCodePipelineActionRoleDefaultPolicyA63E9DEC',
        Roles: [
          {
            Ref: 'MyPipelineSourceCodePipelineActionRoleB3E4554A',
          },
        ],
      },
      Metadata: {
        'aws:cdk:path': 'WithcdkStack/MyPipeline/MyPipeline/Source/Source/CodePipelineActionRole/DefaultPolicy/Resource',
      },
    },
    MyPipelineBuildCodePipelineActionRole969D9396: {
      Type: 'AWS::IAM::Role',
      Properties: {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                AWS: {
                  'Fn::Join': [
                    '',
                    [
                      'arn:',
                      {
                        Ref: 'AWS::Partition',
                      },
                      ':iam::',
                      {
                        Ref: 'AWS::AccountId',
                      },
                      ':root',
                    ],
                  ],
                },
              },
            },
          ],
          Version: '2012-10-17',
        },
      },
      Metadata: {
        'aws:cdk:path': 'WithcdkStack/MyPipeline/MyPipeline/Build/Build/CodePipelineActionRole/Resource',
      },
    },
    MyPipelineBuildCodePipelineActionRoleDefaultPolicy22A3F1A5: {
      Type: 'AWS::IAM::Policy',
      Properties: {
        PolicyDocument: {
          Statement: [
            {
              Action: ['codebuild:BatchGetBuilds', 'codebuild:StartBuild', 'codebuild:StopBuild'],
              Effect: 'Allow',
              Resource: {
                'Fn::GetAtt': ['MyPipelineMyCodeBuildProjectA4EF580E', 'Arn'],
              },
            },
          ],
          Version: '2012-10-17',
        },
        PolicyName: 'MyPipelineBuildCodePipelineActionRoleDefaultPolicy22A3F1A5',
        Roles: [
          {
            Ref: 'MyPipelineBuildCodePipelineActionRole969D9396',
          },
        ],
      },
      Metadata: {
        'aws:cdk:path': 'WithcdkStack/MyPipeline/MyPipeline/Build/Build/CodePipelineActionRole/DefaultPolicy/Resource',
      },
    },
    MyPipelineMyPipelineStateChange47632A2D: {
      Type: 'AWS::Events::Rule',
      Properties: {
        EventPattern: {
          source: ['aws.codepipeline'],
          resources: [
            {
              'Fn::Join': [
                '',
                [
                  'arn:',
                  {
                    Ref: 'AWS::Partition',
                  },
                  ':codepipeline:',
                  {
                    Ref: 'AWS::Region',
                  },
                  ':',
                  {
                    Ref: 'AWS::AccountId',
                  },
                  ':',
                  {
                    Ref: 'MyPipelineFF2E7D8D',
                  },
                ],
              ],
            },
          ],
          'detail-type': ['CodePipeline Pipeline Execution State Change'],
        },
        State: 'ENABLED',
        Targets: [
          {
            Arn: {
              'Fn::GetAtt': ['MyPipelineMyQueueB621E2B4', 'Arn'],
            },
            Id: 'Target0',
          },
        ],
      },
      Metadata: {
        'aws:cdk:path': 'WithcdkStack/MyPipeline/MyPipeline/MyPipelineStateChange/Resource',
      },
    },
    MyPipelineMyQueueB621E2B4: {
      Type: 'AWS::SQS::Queue',
      Metadata: {
        'aws:cdk:path': 'WithcdkStack/MyPipeline/MyQueue/Resource',
      },
    },
    MyPipelineMyQueuePolicy9F4CDEF4: {
      Type: 'AWS::SQS::QueuePolicy',
      Properties: {
        PolicyDocument: {
          Statement: [
            {
              Action: ['sqs:SendMessage', 'sqs:GetQueueAttributes', 'sqs:GetQueueUrl'],
              Condition: {
                ArnEquals: {
                  'aws:SourceArn': {
                    'Fn::GetAtt': ['MyPipelineMyPipelineStateChange47632A2D', 'Arn'],
                  },
                },
              },
              Effect: 'Allow',
              Principal: {
                Service: 'events.amazonaws.com',
              },
              Resource: {
                'Fn::GetAtt': ['MyPipelineMyQueueB621E2B4', 'Arn'],
              },
            },
          ],
          Version: '2012-10-17',
        },
        Queues: [
          {
            Ref: 'MyPipelineMyQueueB621E2B4',
          },
        ],
      },
      Metadata: {
        'aws:cdk:path': 'WithcdkStack/MyPipeline/MyQueue/Policy/Resource',
      },
    },
    MyPipelineCustomEventHandlerServiceRoleAB968BB9: {
      Type: 'AWS::IAM::Role',
      Properties: {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
          Version: '2012-10-17',
        },
        ManagedPolicyArns: [
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                {
                  Ref: 'AWS::Partition',
                },
                ':iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
              ],
            ],
          },
        ],
      },
      Metadata: {
        'aws:cdk:path': 'WithcdkStack/MyPipeline/CustomEventHandler/ServiceRole/Resource',
      },
    },
    MyPipelineCustomEventHandler99611120: {
      Type: 'AWS::Lambda::Function',
      Properties: {
        Code: {
          ZipFile: 'exports.handler = function (event) {};',
        },
        Handler: 'index.handler',
        Role: {
          'Fn::GetAtt': ['MyPipelineCustomEventHandlerServiceRoleAB968BB9', 'Arn'],
        },
        Runtime: 'nodejs12.x',
        Timeout: 300,
      },
      DependsOn: ['MyPipelineCustomEventHandlerServiceRoleAB968BB9'],
      Metadata: {
        'aws:cdk:path': 'WithcdkStack/MyPipeline/CustomEventHandler/Resource',
      },
    },
    MyPipelineCustomCompleteHandlerServiceRole1BEA7CF0: {
      Type: 'AWS::IAM::Role',
      Properties: {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
          Version: '2012-10-17',
        },
        ManagedPolicyArns: [
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                {
                  Ref: 'AWS::Partition',
                },
                ':iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
              ],
            ],
          },
        ],
      },
      Metadata: {
        'aws:cdk:path': 'WithcdkStack/MyPipeline/CustomCompleteHandler/ServiceRole/Resource',
      },
    },
    MyPipelineCustomCompleteHandlerServiceRoleDefaultPolicyB3C12BDF: {
      Type: 'AWS::IAM::Policy',
      Properties: {
        PolicyDocument: {
          Statement: [
            {
              Action: ['codepipeline:ListPipelineExecutions'],
              Effect: 'Allow',
              Resource: {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':codepipeline:',
                    {
                      Ref: 'AWS::Region',
                    },
                    ':',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':',
                    {
                      Ref: 'MyPipelineFF2E7D8D',
                    },
                  ],
                ],
              },
            },
          ],
          Version: '2012-10-17',
        },
        PolicyName: 'MyPipelineCustomCompleteHandlerServiceRoleDefaultPolicyB3C12BDF',
        Roles: [
          {
            Ref: 'MyPipelineCustomCompleteHandlerServiceRole1BEA7CF0',
          },
        ],
      },
      Metadata: {
        'aws:cdk:path': 'WithcdkStack/MyPipeline/CustomCompleteHandler/ServiceRole/DefaultPolicy/Resource',
      },
    },
    MyPipelineCustomCompleteHandler272B9FF9: {
      Type: 'AWS::Lambda::Function',
      Properties: {
        Code: {
          ZipFile:
            'const AWS=require("aws-sdk"),codePipeline=new AWS.CodePipeline;exports.handler=async function({RequestType:e}){if(console.log({RequestType:e}),"Delete"===e)return{IsComplete:!0};const{PIPELINE_NAME:i}=process.env,{pipelineExecutionSummaries:[s]}=await codePipeline.listPipelineExecutions({pipelineName:i}).promise();console.log(s);const{status:o}=s||{};if(void 0===o)return{IsComplete:!1};let t=!1;switch(o){case"Failed":case"Stopped":throw new Error("The execution didn\'t succeed");case"Succeeded":t=!0}return{IsComplete:t}};',
        },
        Handler: 'index.handler',
        Role: {
          'Fn::GetAtt': ['MyPipelineCustomCompleteHandlerServiceRole1BEA7CF0', 'Arn'],
        },
        Runtime: 'nodejs12.x',
        Environment: {
          Variables: {
            PIPELINE_NAME: {
              Ref: 'MyPipelineFF2E7D8D',
            },
          },
        },
        Timeout: 25,
      },
      DependsOn: ['MyPipelineCustomCompleteHandlerServiceRoleDefaultPolicyB3C12BDF', 'MyPipelineCustomCompleteHandlerServiceRole1BEA7CF0'],
      Metadata: {
        'aws:cdk:path': 'WithcdkStack/MyPipeline/CustomCompleteHandler/Resource',
      },
    },
    MyPipelineMyProviderframeworkonEventServiceRole17AEA4C4: {
      Type: 'AWS::IAM::Role',
      Properties: {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
          Version: '2012-10-17',
        },
        ManagedPolicyArns: [
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                {
                  Ref: 'AWS::Partition',
                },
                ':iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
              ],
            ],
          },
        ],
      },
      Metadata: {
        'aws:cdk:path': 'WithcdkStack/MyPipeline/MyProvider/framework-onEvent/ServiceRole/Resource',
      },
    },
    MyPipelineMyProviderframeworkonEventServiceRoleDefaultPolicyD1ADF447: {
      Type: 'AWS::IAM::Policy',
      Properties: {
        PolicyDocument: {
          Statement: [
            {
              Action: 'lambda:InvokeFunction',
              Effect: 'Allow',
              Resource: {
                'Fn::GetAtt': ['MyPipelineCustomEventHandler99611120', 'Arn'],
              },
            },
            {
              Action: 'lambda:InvokeFunction',
              Effect: 'Allow',
              Resource: {
                'Fn::GetAtt': ['MyPipelineCustomCompleteHandler272B9FF9', 'Arn'],
              },
            },
            {
              Action: 'states:StartExecution',
              Effect: 'Allow',
              Resource: {
                Ref: 'MyPipelineMyProviderwaiterstatemachineFE0B5678',
              },
            },
          ],
          Version: '2012-10-17',
        },
        PolicyName: 'MyPipelineMyProviderframeworkonEventServiceRoleDefaultPolicyD1ADF447',
        Roles: [
          {
            Ref: 'MyPipelineMyProviderframeworkonEventServiceRole17AEA4C4',
          },
        ],
      },
      Metadata: {
        'aws:cdk:path': 'WithcdkStack/MyPipeline/MyProvider/framework-onEvent/ServiceRole/DefaultPolicy/Resource',
      },
    },
    MyPipelineMyProviderframeworkonEvent3DA77E46: {
      Type: 'AWS::Lambda::Function',
      Properties: {
        Code: {
          S3Bucket: {
            Ref: 'ParamDeploymentBucket',
          },
          S3Key: {
            Ref: 'CustomResourceAwaiterZipPath',
          },
        },
        Handler: 'framework.onEvent',
        Role: {
          'Fn::GetAtt': ['MyPipelineMyProviderframeworkonEventServiceRole17AEA4C4', 'Arn'],
        },
        Runtime: 'nodejs10.x',
        Description: 'AWS CDK resource provider framework - onEvent (WithcdkStack/MyPipeline/MyProvider)',
        Environment: {
          Variables: {
            USER_ON_EVENT_FUNCTION_ARN: {
              'Fn::GetAtt': ['MyPipelineCustomEventHandler99611120', 'Arn'],
            },
            USER_IS_COMPLETE_FUNCTION_ARN: {
              'Fn::GetAtt': ['MyPipelineCustomCompleteHandler272B9FF9', 'Arn'],
            },
            WAITER_STATE_MACHINE_ARN: {
              Ref: 'MyPipelineMyProviderwaiterstatemachineFE0B5678',
            },
          },
        },
        Timeout: 900,
      },
      DependsOn: [
        'MyPipelineMyProviderframeworkonEventServiceRoleDefaultPolicyD1ADF447',
        'MyPipelineMyProviderframeworkonEventServiceRole17AEA4C4',
      ],
      Metadata: {
        'aws:cdk:path': 'WithcdkStack/MyPipeline/MyProvider/framework-onEvent/Resource',
        'aws:asset:path': 'asset.c691172cdeefa2c91b5a2907f9d81118e47597634943344795f1a844192dd49c',
        'aws:asset:property': 'Code',
      },
    },
    MyPipelineMyProviderframeworkisCompleteServiceRoleC1A3856F: {
      Type: 'AWS::IAM::Role',
      Properties: {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
          Version: '2012-10-17',
        },
        ManagedPolicyArns: [
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                {
                  Ref: 'AWS::Partition',
                },
                ':iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
              ],
            ],
          },
        ],
      },
      Metadata: {
        'aws:cdk:path': 'WithcdkStack/MyPipeline/MyProvider/framework-isComplete/ServiceRole/Resource',
      },
    },
    MyPipelineMyProviderframeworkisCompleteServiceRoleDefaultPolicy526DF123: {
      Type: 'AWS::IAM::Policy',
      Properties: {
        PolicyDocument: {
          Statement: [
            {
              Action: 'lambda:InvokeFunction',
              Effect: 'Allow',
              Resource: {
                'Fn::GetAtt': ['MyPipelineCustomEventHandler99611120', 'Arn'],
              },
            },
            {
              Action: 'lambda:InvokeFunction',
              Effect: 'Allow',
              Resource: {
                'Fn::GetAtt': ['MyPipelineCustomCompleteHandler272B9FF9', 'Arn'],
              },
            },
          ],
          Version: '2012-10-17',
        },
        PolicyName: 'MyPipelineMyProviderframeworkisCompleteServiceRoleDefaultPolicy526DF123',
        Roles: [
          {
            Ref: 'MyPipelineMyProviderframeworkisCompleteServiceRoleC1A3856F',
          },
        ],
      },
      Metadata: {
        'aws:cdk:path': 'WithcdkStack/MyPipeline/MyProvider/framework-isComplete/ServiceRole/DefaultPolicy/Resource',
      },
    },
    MyPipelineMyProviderframeworkisCompleteB71AB74B: {
      Type: 'AWS::Lambda::Function',
      Properties: {
        Code: {
          S3Bucket: {
            Ref: 'ParamDeploymentBucket',
          },
          S3Key: {
            Ref: 'CustomResourceAwaiterZipPath',
          },
        },
        Handler: 'framework.isComplete',
        Role: {
          'Fn::GetAtt': ['MyPipelineMyProviderframeworkisCompleteServiceRoleC1A3856F', 'Arn'],
        },
        Runtime: 'nodejs10.x',
        Description: 'AWS CDK resource provider framework - isComplete (WithcdkStack/MyPipeline/MyProvider)',
        Environment: {
          Variables: {
            USER_ON_EVENT_FUNCTION_ARN: {
              'Fn::GetAtt': ['MyPipelineCustomEventHandler99611120', 'Arn'],
            },
            USER_IS_COMPLETE_FUNCTION_ARN: {
              'Fn::GetAtt': ['MyPipelineCustomCompleteHandler272B9FF9', 'Arn'],
            },
          },
        },
        Timeout: 900,
      },
      DependsOn: [
        'MyPipelineMyProviderframeworkisCompleteServiceRoleDefaultPolicy526DF123',
        'MyPipelineMyProviderframeworkisCompleteServiceRoleC1A3856F',
      ],
      Metadata: {
        'aws:cdk:path': 'WithcdkStack/MyPipeline/MyProvider/framework-isComplete/Resource',
        'aws:asset:path': 'asset.c691172cdeefa2c91b5a2907f9d81118e47597634943344795f1a844192dd49c',
        'aws:asset:property': 'Code',
      },
    },
    MyPipelineMyProviderframeworkonTimeoutServiceRoleF471A75C: {
      Type: 'AWS::IAM::Role',
      Properties: {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
          Version: '2012-10-17',
        },
        ManagedPolicyArns: [
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                {
                  Ref: 'AWS::Partition',
                },
                ':iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
              ],
            ],
          },
        ],
      },
      Metadata: {
        'aws:cdk:path': 'WithcdkStack/MyPipeline/MyProvider/framework-onTimeout/ServiceRole/Resource',
      },
    },
    MyPipelineMyProviderframeworkonTimeoutServiceRoleDefaultPolicy75BD8CD6: {
      Type: 'AWS::IAM::Policy',
      Properties: {
        PolicyDocument: {
          Statement: [
            {
              Action: 'lambda:InvokeFunction',
              Effect: 'Allow',
              Resource: {
                'Fn::GetAtt': ['MyPipelineCustomEventHandler99611120', 'Arn'],
              },
            },
            {
              Action: 'lambda:InvokeFunction',
              Effect: 'Allow',
              Resource: {
                'Fn::GetAtt': ['MyPipelineCustomCompleteHandler272B9FF9', 'Arn'],
              },
            },
          ],
          Version: '2012-10-17',
        },
        PolicyName: 'MyPipelineMyProviderframeworkonTimeoutServiceRoleDefaultPolicy75BD8CD6',
        Roles: [
          {
            Ref: 'MyPipelineMyProviderframeworkonTimeoutServiceRoleF471A75C',
          },
        ],
      },
      Metadata: {
        'aws:cdk:path': 'WithcdkStack/MyPipeline/MyProvider/framework-onTimeout/ServiceRole/DefaultPolicy/Resource',
      },
    },
    MyPipelineMyProviderframeworkonTimeoutF5BEE1E8: {
      Type: 'AWS::Lambda::Function',
      Properties: {
        Code: {
          S3Bucket: {
            Ref: 'ParamDeploymentBucket',
          },
          S3Key: {
            Ref: 'CustomResourceAwaiterZipPath',
          },
        },
        Handler: 'framework.onTimeout',
        Role: {
          'Fn::GetAtt': ['MyPipelineMyProviderframeworkonTimeoutServiceRoleF471A75C', 'Arn'],
        },
        Runtime: 'nodejs10.x',
        Description: 'AWS CDK resource provider framework - onTimeout (WithcdkStack/MyPipeline/MyProvider)',
        Environment: {
          Variables: {
            USER_ON_EVENT_FUNCTION_ARN: {
              'Fn::GetAtt': ['MyPipelineCustomEventHandler99611120', 'Arn'],
            },
            USER_IS_COMPLETE_FUNCTION_ARN: {
              'Fn::GetAtt': ['MyPipelineCustomCompleteHandler272B9FF9', 'Arn'],
            },
          },
        },
        Timeout: 900,
      },
      DependsOn: [
        'MyPipelineMyProviderframeworkonTimeoutServiceRoleDefaultPolicy75BD8CD6',
        'MyPipelineMyProviderframeworkonTimeoutServiceRoleF471A75C',
      ],
      Metadata: {
        'aws:cdk:path': 'WithcdkStack/MyPipeline/MyProvider/framework-onTimeout/Resource',
        'aws:asset:path': 'asset.c691172cdeefa2c91b5a2907f9d81118e47597634943344795f1a844192dd49c',
        'aws:asset:property': 'Code',
      },
    },
    MyPipelineMyProviderwaiterstatemachineRoleB49AF3B1: {
      Type: 'AWS::IAM::Role',
      Properties: {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: {
                  'Fn::Join': [
                    '',
                    [
                      'states.',
                      {
                        Ref: 'AWS::Region',
                      },
                      '.amazonaws.com',
                    ],
                  ],
                },
              },
            },
          ],
          Version: '2012-10-17',
        },
      },
      Metadata: {
        'aws:cdk:path': 'WithcdkStack/MyPipeline/MyProvider/waiter-state-machine/Role/Resource',
      },
    },
    MyPipelineMyProviderwaiterstatemachineRoleDefaultPolicy07E22584: {
      Type: 'AWS::IAM::Policy',
      Properties: {
        PolicyDocument: {
          Statement: [
            {
              Action: 'lambda:InvokeFunction',
              Effect: 'Allow',
              Resource: {
                'Fn::GetAtt': ['MyPipelineMyProviderframeworkisCompleteB71AB74B', 'Arn'],
              },
            },
            {
              Action: 'lambda:InvokeFunction',
              Effect: 'Allow',
              Resource: {
                'Fn::GetAtt': ['MyPipelineMyProviderframeworkonTimeoutF5BEE1E8', 'Arn'],
              },
            },
          ],
          Version: '2012-10-17',
        },
        PolicyName: 'MyPipelineMyProviderwaiterstatemachineRoleDefaultPolicy07E22584',
        Roles: [
          {
            Ref: 'MyPipelineMyProviderwaiterstatemachineRoleB49AF3B1',
          },
        ],
      },
      Metadata: {
        'aws:cdk:path': 'WithcdkStack/MyPipeline/MyProvider/waiter-state-machine/Role/DefaultPolicy/Resource',
      },
    },
    MyPipelineMyProviderwaiterstatemachineFE0B5678: {
      Type: 'AWS::StepFunctions::StateMachine',
      Properties: {
        DefinitionString: {
          'Fn::Join': [
            '',
            [
              '{"StartAt":"framework-isComplete-task","States":{"framework-isComplete-task":{"End":true,"Retry":[{"ErrorEquals":["States.ALL"],"IntervalSeconds":5,"MaxAttempts":360,"BackoffRate":1}],"Catch":[{"ErrorEquals":["States.ALL"],"Next":"framework-onTimeout-task"}],"Type":"Task","Resource":"',
              {
                'Fn::GetAtt': ['MyPipelineMyProviderframeworkisCompleteB71AB74B', 'Arn'],
              },
              '"},"framework-onTimeout-task":{"End":true,"Type":"Task","Resource":"',
              {
                'Fn::GetAtt': ['MyPipelineMyProviderframeworkonTimeoutF5BEE1E8', 'Arn'],
              },
              '"}}}',
            ],
          ],
        },
        RoleArn: {
          'Fn::GetAtt': ['MyPipelineMyProviderwaiterstatemachineRoleB49AF3B1', 'Arn'],
        },
      },
      DependsOn: ['MyPipelineMyProviderwaiterstatemachineRoleDefaultPolicy07E22584', 'MyPipelineMyProviderwaiterstatemachineRoleB49AF3B1'],
      Metadata: {
        'aws:cdk:path': 'WithcdkStack/MyPipeline/MyProvider/waiter-state-machine/Resource',
      },
    },
    MyPipelineMyAwaiter9302C373: {
      Type: 'AWS::CloudFormation::CustomResource',
      Properties: {
        ServiceToken: {
          'Fn::GetAtt': ['MyPipelineMyProviderframeworkonEvent3DA77E46', 'Arn'],
        },
        x: {
          Ref: 'ParamZipPath',
        },
      },
      DependsOn: ['MyPipelineFF2E7D8D'],
      UpdateReplacePolicy: 'Delete',
      DeletionPolicy: 'Delete',
      Metadata: {
        'aws:cdk:path': 'WithcdkStack/MyPipeline/MyAwaiter/Default',
      },
    },
  },
  Outputs: {
    ExportEcrUri: {
      Value: {
        'Fn::Join': [
          '',
          [
            {
              'Fn::Select': [
                4,
                {
                  'Fn::Split': [
                    ':',
                    {
                      'Fn::GetAtt': ['MyRepository4C4BD5FC', 'Arn'],
                    },
                  ],
                },
              ],
            },
            '.dkr.ecr.',
            {
              'Fn::Select': [
                3,
                {
                  'Fn::Split': [
                    ':',
                    {
                      'Fn::GetAtt': ['MyRepository4C4BD5FC', 'Arn'],
                    },
                  ],
                },
              ],
            },
            '.',
            {
              Ref: 'AWS::URLSuffix',
            },
            '/',
            {
              Ref: 'MyRepository4C4BD5FC',
            },
          ],
        ],
      },
    },
    TaskDefinitionArn: {
      Value: {
        Ref: 'MyTaskF5748B4B',
      },
    },
  },
  Conditions: {},
};

export const containerFiles = {
  'buildspec.yml': buildspec,
  Dockerfile: `
FROM node:alpine

ENV PORT=8080
EXPOSE \${PORT}

WORKDIR /usr/src/app

COPY index.js ./
COPY package.json ./

RUN npm i

CMD [ "node", "index.js" ]
  `,
  'package.json': `
  {
    "name": "express-lasagna",
    "version": "1.0.0",
    "description": "",
    "main": "index.js",
    "scripts": {
      "test": "echo \\"Error: no test specified\\" && exit 1"
    },
    "keywords": [],
    "author": "",
    "license": "ISC",
    "dependencies": {
      "express": "^4.17.1"
    }
  }  
  `,
  'index.js': `
  const express = require("express");
  const app = express();
  const port = process.env.PORT;

  // Enable CORS for all methods
  app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
    next()
  });
  
  app.get("/", (req, res) => {
    const jwt = req.header("Authorization") || "";
  
    const [, jwtBody] = jwt.split(".");
  
    const obj = JSON.parse(
      jwtBody ? Buffer.from(jwtBody, "base64").toString("utf-8") : "{}"
    );
  
    const result = JSON.stringify(obj, null, 2);
  
    res.contentType("application/json").send(result);
  });
  
  app.listen(port, () => {
    console.log(\`Example app listening at http://localhost:\${port}\`);
  });  
  `,
};
