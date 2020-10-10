import { JSONUtilities } from 'amplify-cli-core';
import { FunctionParameters, FunctionTriggerParameters, FunctionBreadcrumbs, ContainerParameters } from 'amplify-function-plugin-interface';
import _ from 'lodash';
import fs from 'fs-extra';
import path from 'path';
import { functionParametersFileName, layerParametersFileName, parametersFileName, provider, ServiceName } from './constants';
import { category as categoryName } from '../../../constants';
import { generateLayerCfnObj } from './lambda-layer-cloudformation-template';
import { isMultiEnvLayer, LayerParameters, StoredLayerParameters } from './layerParams';
import { convertLambdaLayerMetaToLayerCFNArray } from './layerArnConverter';
import { saveLayerRuntimes } from './layerRuntimes';

export function createContainerResources(context: any, parameters: ContainerParameters) {
  context.amplify.updateamplifyMetaAfterResourceAdd(
    categoryName,
    parameters.resourceName,
    {
      container: true,
      build: true,
      providerPlugin: "awscloudformation",
      service: "ElasticContainer",
      dependsOn: []
    }
  );
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const resourceDirPath = path.join(projectBackendDirPath, categoryName, parameters.resourceName);

  fs.ensureDirSync(path.join(resourceDirPath, 'src'));

  const buildspec = `
  version: 0.2
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

  const containerCfn = {
    "Parameters": {
      "ParamDeploymentBucket": {
        "Type": "String",
      },
      "ParamContainerPort": {
        "Type": "Number",
        "Default": 8080
      },
      "ParamRepositoryName": {
        "Type": "String",
      },
      "ParamZipPath": {
        "Type": "String",
      },
      "env": {
        "Type": "String"
      }
    },
    "Resources": {
      "VPCB9E5F0B4": {
        "Type": "AWS::EC2::VPC",
        "Properties": {
          "CidrBlock": "10.0.0.0/16",
          "EnableDnsHostnames": true,
          "EnableDnsSupport": true,
          "InstanceTenancy": "default",
          "Tags": [
            {
              "Key": "Name",
              "Value": "WithcdkStack/VPC"
            }
          ]
        },
        "Metadata": {
          "aws:cdk:path": "WithcdkStack/VPC/Resource"
        }
      },
      "VPCPublicSubnet1SubnetB4246D30": {
        "Type": "AWS::EC2::Subnet",
        "Properties": {
          "CidrBlock": "10.0.0.0/24",
          "VpcId": {
            "Ref": "VPCB9E5F0B4"
          },
          "AvailabilityZone": {
            "Fn::Select": [
              0,
              {
                "Fn::GetAZs": ""
              }
            ]
          },
          "MapPublicIpOnLaunch": true,
          "Tags": [
            {
              "Key": "aws-cdk:subnet-name",
              "Value": "Public"
            },
            {
              "Key": "aws-cdk:subnet-type",
              "Value": "Public"
            },
            {
              "Key": "Name",
              "Value": "WithcdkStack/VPC/PublicSubnet1"
            }
          ]
        },
        "Metadata": {
          "aws:cdk:path": "WithcdkStack/VPC/PublicSubnet1/Subnet"
        }
      },
      "VPCPublicSubnet1RouteTableFEE4B781": {
        "Type": "AWS::EC2::RouteTable",
        "Properties": {
          "VpcId": {
            "Ref": "VPCB9E5F0B4"
          },
          "Tags": [
            {
              "Key": "Name",
              "Value": "WithcdkStack/VPC/PublicSubnet1"
            }
          ]
        },
        "Metadata": {
          "aws:cdk:path": "WithcdkStack/VPC/PublicSubnet1/RouteTable"
        }
      },
      "VPCPublicSubnet1RouteTableAssociation0B0896DC": {
        "Type": "AWS::EC2::SubnetRouteTableAssociation",
        "Properties": {
          "RouteTableId": {
            "Ref": "VPCPublicSubnet1RouteTableFEE4B781"
          },
          "SubnetId": {
            "Ref": "VPCPublicSubnet1SubnetB4246D30"
          }
        },
        "Metadata": {
          "aws:cdk:path": "WithcdkStack/VPC/PublicSubnet1/RouteTableAssociation"
        }
      },
      "VPCPublicSubnet1DefaultRoute91CEF279": {
        "Type": "AWS::EC2::Route",
        "Properties": {
          "RouteTableId": {
            "Ref": "VPCPublicSubnet1RouteTableFEE4B781"
          },
          "DestinationCidrBlock": "0.0.0.0/0",
          "GatewayId": {
            "Ref": "VPCIGWB7E252D3"
          }
        },
        "DependsOn": [
          "VPCVPCGW99B986DC"
        ],
        "Metadata": {
          "aws:cdk:path": "WithcdkStack/VPC/PublicSubnet1/DefaultRoute"
        }
      },
      "VPCPublicSubnet1EIP6AD938E8": {
        "Type": "AWS::EC2::EIP",
        "Properties": {
          "Domain": "vpc",
          "Tags": [
            {
              "Key": "Name",
              "Value": "WithcdkStack/VPC/PublicSubnet1"
            }
          ]
        },
        "Metadata": {
          "aws:cdk:path": "WithcdkStack/VPC/PublicSubnet1/EIP"
        }
      },
      "VPCPublicSubnet1NATGatewayE0556630": {
        "Type": "AWS::EC2::NatGateway",
        "Properties": {
          "AllocationId": {
            "Fn::GetAtt": [
              "VPCPublicSubnet1EIP6AD938E8",
              "AllocationId"
            ]
          },
          "SubnetId": {
            "Ref": "VPCPublicSubnet1SubnetB4246D30"
          },
          "Tags": [
            {
              "Key": "Name",
              "Value": "WithcdkStack/VPC/PublicSubnet1"
            }
          ]
        },
        "Metadata": {
          "aws:cdk:path": "WithcdkStack/VPC/PublicSubnet1/NATGateway"
        }
      },
      "VPCPublicSubnet2Subnet74179F39": {
        "Type": "AWS::EC2::Subnet",
        "Properties": {
          "CidrBlock": "10.0.1.0/24",
          "VpcId": {
            "Ref": "VPCB9E5F0B4"
          },
          "AvailabilityZone": {
            "Fn::Select": [
              1,
              {
                "Fn::GetAZs": ""
              }
            ]
          },
          "MapPublicIpOnLaunch": true,
          "Tags": [
            {
              "Key": "aws-cdk:subnet-name",
              "Value": "Public"
            },
            {
              "Key": "aws-cdk:subnet-type",
              "Value": "Public"
            },
            {
              "Key": "Name",
              "Value": "WithcdkStack/VPC/PublicSubnet2"
            }
          ]
        },
        "Metadata": {
          "aws:cdk:path": "WithcdkStack/VPC/PublicSubnet2/Subnet"
        }
      },
      "VPCPublicSubnet2RouteTable6F1A15F1": {
        "Type": "AWS::EC2::RouteTable",
        "Properties": {
          "VpcId": {
            "Ref": "VPCB9E5F0B4"
          },
          "Tags": [
            {
              "Key": "Name",
              "Value": "WithcdkStack/VPC/PublicSubnet2"
            }
          ]
        },
        "Metadata": {
          "aws:cdk:path": "WithcdkStack/VPC/PublicSubnet2/RouteTable"
        }
      },
      "VPCPublicSubnet2RouteTableAssociation5A808732": {
        "Type": "AWS::EC2::SubnetRouteTableAssociation",
        "Properties": {
          "RouteTableId": {
            "Ref": "VPCPublicSubnet2RouteTable6F1A15F1"
          },
          "SubnetId": {
            "Ref": "VPCPublicSubnet2Subnet74179F39"
          }
        },
        "Metadata": {
          "aws:cdk:path": "WithcdkStack/VPC/PublicSubnet2/RouteTableAssociation"
        }
      },
      "VPCPublicSubnet2DefaultRouteB7481BBA": {
        "Type": "AWS::EC2::Route",
        "Properties": {
          "RouteTableId": {
            "Ref": "VPCPublicSubnet2RouteTable6F1A15F1"
          },
          "DestinationCidrBlock": "0.0.0.0/0",
          "GatewayId": {
            "Ref": "VPCIGWB7E252D3"
          }
        },
        "DependsOn": [
          "VPCVPCGW99B986DC"
        ],
        "Metadata": {
          "aws:cdk:path": "WithcdkStack/VPC/PublicSubnet2/DefaultRoute"
        }
      },
      "VPCPublicSubnet2EIP4947BC00": {
        "Type": "AWS::EC2::EIP",
        "Properties": {
          "Domain": "vpc",
          "Tags": [
            {
              "Key": "Name",
              "Value": "WithcdkStack/VPC/PublicSubnet2"
            }
          ]
        },
        "Metadata": {
          "aws:cdk:path": "WithcdkStack/VPC/PublicSubnet2/EIP"
        }
      },
      "VPCPublicSubnet2NATGateway3C070193": {
        "Type": "AWS::EC2::NatGateway",
        "Properties": {
          "AllocationId": {
            "Fn::GetAtt": [
              "VPCPublicSubnet2EIP4947BC00",
              "AllocationId"
            ]
          },
          "SubnetId": {
            "Ref": "VPCPublicSubnet2Subnet74179F39"
          },
          "Tags": [
            {
              "Key": "Name",
              "Value": "WithcdkStack/VPC/PublicSubnet2"
            }
          ]
        },
        "Metadata": {
          "aws:cdk:path": "WithcdkStack/VPC/PublicSubnet2/NATGateway"
        }
      },
      "VPCPrivateSubnet1Subnet8BCA10E0": {
        "Type": "AWS::EC2::Subnet",
        "Properties": {
          "CidrBlock": "10.0.2.0/24",
          "VpcId": {
            "Ref": "VPCB9E5F0B4"
          },
          "AvailabilityZone": {
            "Fn::Select": [
              0,
              {
                "Fn::GetAZs": ""
              }
            ]
          },
          "MapPublicIpOnLaunch": false,
          "Tags": [
            {
              "Key": "aws-cdk:subnet-name",
              "Value": "Private"
            },
            {
              "Key": "aws-cdk:subnet-type",
              "Value": "Private"
            },
            {
              "Key": "Name",
              "Value": "WithcdkStack/VPC/PrivateSubnet1"
            }
          ]
        },
        "Metadata": {
          "aws:cdk:path": "WithcdkStack/VPC/PrivateSubnet1/Subnet"
        }
      },
      "VPCPrivateSubnet1RouteTableBE8A6027": {
        "Type": "AWS::EC2::RouteTable",
        "Properties": {
          "VpcId": {
            "Ref": "VPCB9E5F0B4"
          },
          "Tags": [
            {
              "Key": "Name",
              "Value": "WithcdkStack/VPC/PrivateSubnet1"
            }
          ]
        },
        "Metadata": {
          "aws:cdk:path": "WithcdkStack/VPC/PrivateSubnet1/RouteTable"
        }
      },
      "VPCPrivateSubnet1RouteTableAssociation347902D1": {
        "Type": "AWS::EC2::SubnetRouteTableAssociation",
        "Properties": {
          "RouteTableId": {
            "Ref": "VPCPrivateSubnet1RouteTableBE8A6027"
          },
          "SubnetId": {
            "Ref": "VPCPrivateSubnet1Subnet8BCA10E0"
          }
        },
        "Metadata": {
          "aws:cdk:path": "WithcdkStack/VPC/PrivateSubnet1/RouteTableAssociation"
        }
      },
      "VPCPrivateSubnet1DefaultRouteAE1D6490": {
        "Type": "AWS::EC2::Route",
        "Properties": {
          "RouteTableId": {
            "Ref": "VPCPrivateSubnet1RouteTableBE8A6027"
          },
          "DestinationCidrBlock": "0.0.0.0/0",
          "NatGatewayId": {
            "Ref": "VPCPublicSubnet1NATGatewayE0556630"
          }
        },
        "Metadata": {
          "aws:cdk:path": "WithcdkStack/VPC/PrivateSubnet1/DefaultRoute"
        }
      },
      "VPCPrivateSubnet2SubnetCFCDAA7A": {
        "Type": "AWS::EC2::Subnet",
        "Properties": {
          "CidrBlock": "10.0.3.0/24",
          "VpcId": {
            "Ref": "VPCB9E5F0B4"
          },
          "AvailabilityZone": {
            "Fn::Select": [
              1,
              {
                "Fn::GetAZs": ""
              }
            ]
          },
          "MapPublicIpOnLaunch": false,
          "Tags": [
            {
              "Key": "aws-cdk:subnet-name",
              "Value": "Private"
            },
            {
              "Key": "aws-cdk:subnet-type",
              "Value": "Private"
            },
            {
              "Key": "Name",
              "Value": "WithcdkStack/VPC/PrivateSubnet2"
            }
          ]
        },
        "Metadata": {
          "aws:cdk:path": "WithcdkStack/VPC/PrivateSubnet2/Subnet"
        }
      },
      "VPCPrivateSubnet2RouteTable0A19E10E": {
        "Type": "AWS::EC2::RouteTable",
        "Properties": {
          "VpcId": {
            "Ref": "VPCB9E5F0B4"
          },
          "Tags": [
            {
              "Key": "Name",
              "Value": "WithcdkStack/VPC/PrivateSubnet2"
            }
          ]
        },
        "Metadata": {
          "aws:cdk:path": "WithcdkStack/VPC/PrivateSubnet2/RouteTable"
        }
      },
      "VPCPrivateSubnet2RouteTableAssociation0C73D413": {
        "Type": "AWS::EC2::SubnetRouteTableAssociation",
        "Properties": {
          "RouteTableId": {
            "Ref": "VPCPrivateSubnet2RouteTable0A19E10E"
          },
          "SubnetId": {
            "Ref": "VPCPrivateSubnet2SubnetCFCDAA7A"
          }
        },
        "Metadata": {
          "aws:cdk:path": "WithcdkStack/VPC/PrivateSubnet2/RouteTableAssociation"
        }
      },
      "VPCPrivateSubnet2DefaultRouteF4F5CFD2": {
        "Type": "AWS::EC2::Route",
        "Properties": {
          "RouteTableId": {
            "Ref": "VPCPrivateSubnet2RouteTable0A19E10E"
          },
          "DestinationCidrBlock": "0.0.0.0/0",
          "NatGatewayId": {
            "Ref": "VPCPublicSubnet2NATGateway3C070193"
          }
        },
        "Metadata": {
          "aws:cdk:path": "WithcdkStack/VPC/PrivateSubnet2/DefaultRoute"
        }
      },
      "VPCIGWB7E252D3": {
        "Type": "AWS::EC2::InternetGateway",
        "Properties": {
          "Tags": [
            {
              "Key": "Name",
              "Value": "WithcdkStack/VPC"
            }
          ]
        },
        "Metadata": {
          "aws:cdk:path": "WithcdkStack/VPC/IGW"
        }
      },
      "VPCVPCGW99B986DC": {
        "Type": "AWS::EC2::VPCGatewayAttachment",
        "Properties": {
          "VpcId": {
            "Ref": "VPCB9E5F0B4"
          },
          "InternetGatewayId": {
            "Ref": "VPCIGWB7E252D3"
          }
        },
        "Metadata": {
          "aws:cdk:path": "WithcdkStack/VPC/VPCGW"
        }
      },
      "MyServiceSecurityGroup3C4EC593": {
        "Type": "AWS::EC2::SecurityGroup",
        "Properties": {
          "GroupDescription": "WithcdkStack/MyServiceSecurityGroup",
          "SecurityGroupEgress": [
            {
              "CidrIp": "0.0.0.0/0",
              "Description": "Allow all outbound traffic by default",
              "IpProtocol": "-1"
            }
          ],
          "VpcId": {
            "Ref": "VPCB9E5F0B4"
          }
        },
        "Metadata": {
          "aws:cdk:path": "WithcdkStack/MyServiceSecurityGroup/Resource"
        }
      },
      "MyRepository4C4BD5FC": {
        "Type": "AWS::ECR::Repository",
        "Properties": {
          "RepositoryName": {
            "Ref": "ParamRepositoryName"
          }
        },
        "UpdateReplacePolicy": "Retain",
        "DeletionPolicy": "Retain",
        "Metadata": {
          "aws:cdk:path": "WithcdkStack/MyRepository/Resource"
        }
      },
      "MyTaskTaskRole560858C4": {
        "Type": "AWS::IAM::Role",
        "Properties": {
          "AssumeRolePolicyDocument": {
            "Statement": [
              {
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {
                  "Service": "ecs-tasks.amazonaws.com"
                }
              }
            ],
            "Version": "2012-10-17"
          }
        },
        "Metadata": {
          "aws:cdk:path": "WithcdkStack/MyTask/TaskRole/Resource"
        }
      },
      "MyTaskF5748B4B": {
        "Type": "AWS::ECS::TaskDefinition",
        "Properties": {
          "ContainerDefinitions": [
            {
              "Essential": true,
              "Image": {
                "Fn::Join": [
                  "",
                  [
                    {
                      "Fn::Select": [
                        4,
                        {
                          "Fn::Split": [
                            ":",
                            {
                              "Fn::GetAtt": [
                                "MyRepository4C4BD5FC",
                                "Arn"
                              ]
                            }
                          ]
                        }
                      ]
                    },
                    ".dkr.ecr.",
                    {
                      "Fn::Select": [
                        3,
                        {
                          "Fn::Split": [
                            ":",
                            {
                              "Fn::GetAtt": [
                                "MyRepository4C4BD5FC",
                                "Arn"
                              ]
                            }
                          ]
                        }
                      ]
                    },
                    ".",
                    {
                      "Ref": "AWS::URLSuffix"
                    },
                    "/",
                    {
                      "Ref": "MyRepository4C4BD5FC"
                    },
                    ":latest"
                  ]
                ]
              },
              "Name": "MyContainer",
              "PortMappings": [
                {
                  "ContainerPort": {
                    "Ref": "ParamContainerPort"
                  },
                  "Protocol": "tcp"
                }
              ]
            }
          ],
          "Cpu": "256",
          "ExecutionRoleArn": {
            "Fn::GetAtt": [
              "MyTaskExecutionRoleD2FEFCB2",
              "Arn"
            ]
          },
          "Family": "WithcdkStackMyTask766B14A2",
          "Memory": "512",
          "NetworkMode": "awsvpc",
          "RequiresCompatibilities": [
            "FARGATE"
          ],
          "TaskRoleArn": {
            "Fn::GetAtt": [
              "MyTaskTaskRole560858C4",
              "Arn"
            ]
          }
        },
        "Metadata": {
          "aws:cdk:path": "WithcdkStack/MyTask/Resource"
        }
      },
      "MyTaskExecutionRoleD2FEFCB2": {
        "Type": "AWS::IAM::Role",
        "Properties": {
          "AssumeRolePolicyDocument": {
            "Statement": [
              {
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {
                  "Service": "ecs-tasks.amazonaws.com"
                }
              }
            ],
            "Version": "2012-10-17"
          }
        },
        "Metadata": {
          "aws:cdk:path": "WithcdkStack/MyTask/ExecutionRole/Resource"
        }
      },
      "MyTaskExecutionRoleDefaultPolicy8A6B211B": {
        "Type": "AWS::IAM::Policy",
        "Properties": {
          "PolicyDocument": {
            "Statement": [
              {
                "Action": [
                  "ecr:BatchCheckLayerAvailability",
                  "ecr:GetDownloadUrlForLayer",
                  "ecr:BatchGetImage"
                ],
                "Effect": "Allow",
                "Resource": {
                  "Fn::GetAtt": [
                    "MyRepository4C4BD5FC",
                    "Arn"
                  ]
                }
              },
              {
                "Action": "ecr:GetAuthorizationToken",
                "Effect": "Allow",
                "Resource": "*"
              }
            ],
            "Version": "2012-10-17"
          },
          "PolicyName": "MyTaskExecutionRoleDefaultPolicy8A6B211B",
          "Roles": [
            {
              "Ref": "MyTaskExecutionRoleD2FEFCB2"
            }
          ]
        },
        "Metadata": {
          "aws:cdk:path": "WithcdkStack/MyTask/ExecutionRole/DefaultPolicy/Resource"
        }
      },
      "MyCluster4C1BA579": {
        "Type": "AWS::ECS::Cluster",
        "Metadata": {
          "aws:cdk:path": "WithcdkStack/MyCluster/Resource"
        }
      },
      "MyServiceB4132EDA": {
        "Type": "AWS::ECS::Service",
        "Properties": {
          "Cluster": {
            "Ref": "MyCluster4C1BA579"
          },
          "DeploymentConfiguration": {
            "MaximumPercent": 200,
            "MinimumHealthyPercent": 100
          },
          "DesiredCount": 1,
          "EnableECSManagedTags": false,
          "LaunchType": "FARGATE",
          "NetworkConfiguration": {
            "AwsvpcConfiguration": {
              "AssignPublicIp": "DISABLED",
              "SecurityGroups": [
                {
                  "Fn::GetAtt": [
                    "MyServiceSecurityGroup3C4EC593",
                    "GroupId"
                  ]
                }
              ],
              "Subnets": [
                {
                  "Ref": "VPCPrivateSubnet1Subnet8BCA10E0"
                },
                {
                  "Ref": "VPCPrivateSubnet2SubnetCFCDAA7A"
                }
              ]
            }
          },
          "TaskDefinition": {
            "Ref": "MyTaskF5748B4B"
          }
        },
        "Metadata": {
          "aws:cdk:path": "WithcdkStack/MyService/Service"
        }
      },
      "MyCodeBuildProjectRole7DABED3D": {
        "Type": "AWS::IAM::Role",
        "Properties": {
          "AssumeRolePolicyDocument": {
            "Statement": [
              {
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {
                  "Service": "codebuild.amazonaws.com"
                }
              }
            ],
            "Version": "2012-10-17"
          }
        },
        "Metadata": {
          "aws:cdk:path": "WithcdkStack/MyCodeBuildProject/Role/Resource"
        }
      },
      "MyCodeBuildProjectRoleDefaultPolicyF5CC0295": {
        "Type": "AWS::IAM::Policy",
        "Properties": {
          "PolicyDocument": {
            "Statement": [
              {
                "Action": [
                  "s3:GetObject*",
                  "s3:GetBucket*",
                  "s3:List*"
                ],
                "Effect": "Allow",
                "Resource": [
                  {
                    "Fn::Join": [
                      "",
                      [
                        "arn:",
                        {
                          "Ref": "AWS::Partition"
                        },
                        ":s3:::",
                        {
                          "Ref": "ParamDeploymentBucket"
                        }
                      ]
                    ]
                  },
                  {
                    "Fn::Join": [
                      "",
                      [
                        "arn:",
                        {
                          "Ref": "AWS::Partition"
                        },
                        ":s3:::",
                        {
                          "Ref": "ParamDeploymentBucket"
                        },
                        "/*"
                      ]
                    ]
                  }
                ]
              },
              {
                "Action": [
                  "logs:CreateLogGroup",
                  "logs:CreateLogStream",
                  "logs:PutLogEvents"
                ],
                "Effect": "Allow",
                "Resource": [
                  {
                    "Fn::Join": [
                      "",
                      [
                        "arn:",
                        {
                          "Ref": "AWS::Partition"
                        },
                        ":logs:",
                        {
                          "Ref": "AWS::Region"
                        },
                        ":",
                        {
                          "Ref": "AWS::AccountId"
                        },
                        ":log-group:/aws/codebuild/",
                        {
                          "Ref": "MyCodeBuildProject3BC5EAE2"
                        }
                      ]
                    ]
                  },
                  {
                    "Fn::Join": [
                      "",
                      [
                        "arn:",
                        {
                          "Ref": "AWS::Partition"
                        },
                        ":logs:",
                        {
                          "Ref": "AWS::Region"
                        },
                        ":",
                        {
                          "Ref": "AWS::AccountId"
                        },
                        ":log-group:/aws/codebuild/",
                        {
                          "Ref": "MyCodeBuildProject3BC5EAE2"
                        },
                        ":*"
                      ]
                    ]
                  }
                ]
              },
              {
                "Action": [
                  "codebuild:CreateReportGroup",
                  "codebuild:CreateReport",
                  "codebuild:UpdateReport",
                  "codebuild:BatchPutTestCases"
                ],
                "Effect": "Allow",
                "Resource": {
                  "Fn::Join": [
                    "",
                    [
                      "arn:",
                      {
                        "Ref": "AWS::Partition"
                      },
                      ":codebuild:",
                      {
                        "Ref": "AWS::Region"
                      },
                      ":",
                      {
                        "Ref": "AWS::AccountId"
                      },
                      ":report-group/",
                      {
                        "Ref": "MyCodeBuildProject3BC5EAE2"
                      },
                      "-*"
                    ]
                  ]
                }
              },
              {
                "Action": [
                  "s3:GetObject*",
                  "s3:GetBucket*",
                  "s3:List*",
                  "s3:DeleteObject*",
                  "s3:PutObject*",
                  "s3:Abort*"
                ],
                "Effect": "Allow",
                "Resource": [
                  {
                    "Fn::Join": [
                      "",
                      [
                        "arn:",
                        {
                          "Ref": "AWS::Partition"
                        },
                        ":s3:::",
                        {
                          "Ref": "ParamDeploymentBucket"
                        }
                      ]
                    ]
                  },
                  {
                    "Fn::Join": [
                      "",
                      [
                        "arn:",
                        {
                          "Ref": "AWS::Partition"
                        },
                        ":s3:::",
                        {
                          "Ref": "ParamDeploymentBucket"
                        },
                        "/*"
                      ]
                    ]
                  }
                ]
              },
              {
                "Action": [
                  "ecr:GetAuthorizationToken",
                  "ecr:BatchGetImage",
                  "ecr:BatchGetDownloadUrlForLayer",
                  "ecr:InitiateLayerUpload",
                  "ecr:BatchCheckLayerAvailability",
                  "ecr:UploadLayerPart",
                  "ecr:CompleteLayerUpload",
                  "ecr:PutImage"
                ],
                "Effect": "Allow",
                "Resource": "*"
              }
            ],
            "Version": "2012-10-17"
          },
          "PolicyName": "MyCodeBuildProjectRoleDefaultPolicyF5CC0295",
          "Roles": [
            {
              "Ref": "MyCodeBuildProjectRole7DABED3D"
            }
          ]
        },
        "Metadata": {
          "aws:cdk:path": "WithcdkStack/MyCodeBuildProject/Role/DefaultPolicy/Resource"
        }
      },
      "MyCodeBuildProject3BC5EAE2": {
        "Type": "AWS::CodeBuild::Project",
        "Properties": {
          "Artifacts": {
            "Type": "NO_ARTIFACTS"
          },
          "Environment": {
            "ComputeType": "BUILD_GENERAL1_SMALL",
            "Image": "aws/codebuild/standard:4.0",
            "PrivilegedMode": true,
            "Type": "LINUX_CONTAINER"
          },
          "ServiceRole": {
            "Fn::GetAtt": [
              "MyCodeBuildProjectRole7DABED3D",
              "Arn"
            ]
          },
          "Source": {
            "Location": {
              "Fn::Join": [
                "",
                [
                  {
                    "Ref": "ParamDeploymentBucket"
                  },
                  "/",
                  {
                    "Ref": "ParamZipPath"
                  }
                ]
              ]
            },
            "Type": "S3"
          },
          "EncryptionKey": "alias/aws/s3"
        },
        "Metadata": {
          "aws:cdk:path": "WithcdkStack/MyCodeBuildProject/Resource"
        }
      },
      "MyPipelineRoleC0D47CA4": {
        "Type": "AWS::IAM::Role",
        "Properties": {
          "AssumeRolePolicyDocument": {
            "Statement": [
              {
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {
                  "Service": "codepipeline.amazonaws.com"
                }
              }
            ],
            "Version": "2012-10-17"
          }
        },
        "Metadata": {
          "aws:cdk:path": "WithcdkStack/MyPipeline/Role/Resource"
        }
      },
      "MyPipelineRoleDefaultPolicy34F09EFA": {
        "Type": "AWS::IAM::Policy",
        "Properties": {
          "PolicyDocument": {
            "Statement": [
              {
                "Action": [
                  "s3:GetObject*",
                  "s3:GetBucket*",
                  "s3:List*",
                  "s3:DeleteObject*",
                  "s3:PutObject*",
                  "s3:Abort*"
                ],
                "Effect": "Allow",
                "Resource": [
                  {
                    "Fn::Join": [
                      "",
                      [
                        "arn:",
                        {
                          "Ref": "AWS::Partition"
                        },
                        ":s3:::",
                        {
                          "Ref": "ParamDeploymentBucket"
                        }
                      ]
                    ]
                  },
                  {
                    "Fn::Join": [
                      "",
                      [
                        "arn:",
                        {
                          "Ref": "AWS::Partition"
                        },
                        ":s3:::",
                        {
                          "Ref": "ParamDeploymentBucket"
                        },
                        "/*"
                      ]
                    ]
                  }
                ]
              },
              {
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Resource": {
                  "Fn::GetAtt": [
                    "MyPipelineSourceCodePipelineActionRoleAA05D76F",
                    "Arn"
                  ]
                }
              },
              {
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Resource": {
                  "Fn::GetAtt": [
                    "MyPipelineBuildCodePipelineActionRole5CCD100A",
                    "Arn"
                  ]
                }
              },
              {
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Resource": {
                  "Fn::GetAtt": [
                    "MyPipelineDeployCodePipelineActionRole742BD48A",
                    "Arn"
                  ]
                }
              }
            ],
            "Version": "2012-10-17"
          },
          "PolicyName": "MyPipelineRoleDefaultPolicy34F09EFA",
          "Roles": [
            {
              "Ref": "MyPipelineRoleC0D47CA4"
            }
          ]
        },
        "Metadata": {
          "aws:cdk:path": "WithcdkStack/MyPipeline/Role/DefaultPolicy/Resource"
        }
      },
      "MyPipelineAED38ECF": {
        "Type": "AWS::CodePipeline::Pipeline",
        "Properties": {
          "RoleArn": {
            "Fn::GetAtt": [
              "MyPipelineRoleC0D47CA4",
              "Arn"
            ]
          },
          "Stages": [
            {
              "Actions": [
                {
                  "ActionTypeId": {
                    "Category": "Source",
                    "Owner": "AWS",
                    "Provider": "S3",
                    "Version": "1"
                  },
                  "Configuration": {
                    "S3Bucket": {
                      "Ref": "ParamDeploymentBucket"
                    },
                    "S3ObjectKey": {
                      "Ref": "ParamZipPath"
                    }
                  },
                  "Name": "Source",
                  "OutputArtifacts": [
                    {
                      "Name": "SourceArtifact"
                    }
                  ],
                  "RoleArn": {
                    "Fn::GetAtt": [
                      "MyPipelineSourceCodePipelineActionRoleAA05D76F",
                      "Arn"
                    ]
                  },
                  "RunOrder": 1
                }
              ],
              "Name": "Source"
            },
            {
              "Actions": [
                {
                  "ActionTypeId": {
                    "Category": "Build",
                    "Owner": "AWS",
                    "Provider": "CodeBuild",
                    "Version": "1"
                  },
                  "Configuration": {
                    "ProjectName": {
                      "Ref": "MyCodeBuildProject3BC5EAE2"
                    },
                    "EnvironmentVariables": {
                      "Fn::Join": [
                        "",
                        [
                          "[{\"name\":\"REPOSITORY_URI\",\"type\":\"PLAINTEXT\",\"value\":\"",
                          {
                            "Fn::Select": [
                              4,
                              {
                                "Fn::Split": [
                                  ":",
                                  {
                                    "Fn::GetAtt": [
                                      "MyRepository4C4BD5FC",
                                      "Arn"
                                    ]
                                  }
                                ]
                              }
                            ]
                          },
                          ".dkr.ecr.",
                          {
                            "Fn::Select": [
                              3,
                              {
                                "Fn::Split": [
                                  ":",
                                  {
                                    "Fn::GetAtt": [
                                      "MyRepository4C4BD5FC",
                                      "Arn"
                                    ]
                                  }
                                ]
                              }
                            ]
                          },
                          ".",
                          {
                            "Ref": "AWS::URLSuffix"
                          },
                          "/",
                          {
                            "Ref": "MyRepository4C4BD5FC"
                          },
                          "\"},{\"name\":\"CONTAINER_NAME\",\"type\":\"PLAINTEXT\",\"value\":\"MyContainer\"}]"
                        ]
                      ]
                    }
                  },
                  "InputArtifacts": [
                    {
                      "Name": "SourceArtifact"
                    }
                  ],
                  "Name": "Build",
                  "OutputArtifacts": [
                    {
                      "Name": "BuildArtifact"
                    }
                  ],
                  "RoleArn": {
                    "Fn::GetAtt": [
                      "MyPipelineBuildCodePipelineActionRole5CCD100A",
                      "Arn"
                    ]
                  },
                  "RunOrder": 1
                }
              ],
              "Name": "Build"
            },
            {
              "Actions": [
                {
                  "ActionTypeId": {
                    "Category": "Deploy",
                    "Owner": "AWS",
                    "Provider": "ECS",
                    "Version": "1"
                  },
                  "Configuration": {
                    "ClusterName": {
                      "Ref": "MyCluster4C1BA579"
                    },
                    "ServiceName": {
                      "Fn::GetAtt": [
                        "MyServiceB4132EDA",
                        "Name"
                      ]
                    }
                  },
                  "InputArtifacts": [
                    {
                      "Name": "BuildArtifact"
                    }
                  ],
                  "Name": "Deploy",
                  "RoleArn": {
                    "Fn::GetAtt": [
                      "MyPipelineDeployCodePipelineActionRole742BD48A",
                      "Arn"
                    ]
                  },
                  "RunOrder": 1
                }
              ],
              "Name": "Deploy"
            }
          ],
          "ArtifactStore": {
            "Location": {
              "Ref": "ParamDeploymentBucket"
            },
            "Type": "S3"
          }
        },
        "DependsOn": [
          "MyPipelineRoleDefaultPolicy34F09EFA",
          "MyPipelineRoleC0D47CA4"
        ],
        "Metadata": {
          "aws:cdk:path": "WithcdkStack/MyPipeline/Resource"
        }
      },
      "MyPipelineSourceCodePipelineActionRoleAA05D76F": {
        "Type": "AWS::IAM::Role",
        "Properties": {
          "AssumeRolePolicyDocument": {
            "Statement": [
              {
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {
                  "AWS": {
                    "Fn::Join": [
                      "",
                      [
                        "arn:",
                        {
                          "Ref": "AWS::Partition"
                        },
                        ":iam::",
                        {
                          "Ref": "AWS::AccountId"
                        },
                        ":root"
                      ]
                    ]
                  }
                }
              }
            ],
            "Version": "2012-10-17"
          }
        },
        "Metadata": {
          "aws:cdk:path": "WithcdkStack/MyPipeline/Source/Source/CodePipelineActionRole/Resource"
        }
      },
      "MyPipelineSourceCodePipelineActionRoleDefaultPolicy10C831A9": {
        "Type": "AWS::IAM::Policy",
        "Properties": {
          "PolicyDocument": {
            "Statement": [
              {
                "Action": [
                  "s3:GetObject*",
                  "s3:GetBucket*",
                  "s3:List*"
                ],
                "Effect": "Allow",
                "Resource": [
                  {
                    "Fn::Join": [
                      "",
                      [
                        "arn:",
                        {
                          "Ref": "AWS::Partition"
                        },
                        ":s3:::",
                        {
                          "Ref": "ParamDeploymentBucket"
                        }
                      ]
                    ]
                  },
                  {
                    "Fn::Join": [
                      "",
                      [
                        "arn:",
                        {
                          "Ref": "AWS::Partition"
                        },
                        ":s3:::",
                        {
                          "Ref": "ParamDeploymentBucket"
                        },
                        "/*"
                      ]
                    ]
                  }
                ]
              },
              {
                "Action": [
                  "s3:DeleteObject*",
                  "s3:PutObject*",
                  "s3:Abort*"
                ],
                "Effect": "Allow",
                "Resource": [
                  {
                    "Fn::Join": [
                      "",
                      [
                        "arn:",
                        {
                          "Ref": "AWS::Partition"
                        },
                        ":s3:::",
                        {
                          "Ref": "ParamDeploymentBucket"
                        }
                      ]
                    ]
                  },
                  {
                    "Fn::Join": [
                      "",
                      [
                        "arn:",
                        {
                          "Ref": "AWS::Partition"
                        },
                        ":s3:::",
                        {
                          "Ref": "ParamDeploymentBucket"
                        },
                        "/*"
                      ]
                    ]
                  }
                ]
              }
            ],
            "Version": "2012-10-17"
          },
          "PolicyName": "MyPipelineSourceCodePipelineActionRoleDefaultPolicy10C831A9",
          "Roles": [
            {
              "Ref": "MyPipelineSourceCodePipelineActionRoleAA05D76F"
            }
          ]
        },
        "Metadata": {
          "aws:cdk:path": "WithcdkStack/MyPipeline/Source/Source/CodePipelineActionRole/DefaultPolicy/Resource"
        }
      },
      "MyPipelineBuildCodePipelineActionRole5CCD100A": {
        "Type": "AWS::IAM::Role",
        "Properties": {
          "AssumeRolePolicyDocument": {
            "Statement": [
              {
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {
                  "AWS": {
                    "Fn::Join": [
                      "",
                      [
                        "arn:",
                        {
                          "Ref": "AWS::Partition"
                        },
                        ":iam::",
                        {
                          "Ref": "AWS::AccountId"
                        },
                        ":root"
                      ]
                    ]
                  }
                }
              }
            ],
            "Version": "2012-10-17"
          }
        },
        "Metadata": {
          "aws:cdk:path": "WithcdkStack/MyPipeline/Build/Build/CodePipelineActionRole/Resource"
        }
      },
      "MyPipelineBuildCodePipelineActionRoleDefaultPolicyE9A1941C": {
        "Type": "AWS::IAM::Policy",
        "Properties": {
          "PolicyDocument": {
            "Statement": [
              {
                "Action": [
                  "codebuild:BatchGetBuilds",
                  "codebuild:StartBuild",
                  "codebuild:StopBuild"
                ],
                "Effect": "Allow",
                "Resource": {
                  "Fn::GetAtt": [
                    "MyCodeBuildProject3BC5EAE2",
                    "Arn"
                  ]
                }
              }
            ],
            "Version": "2012-10-17"
          },
          "PolicyName": "MyPipelineBuildCodePipelineActionRoleDefaultPolicyE9A1941C",
          "Roles": [
            {
              "Ref": "MyPipelineBuildCodePipelineActionRole5CCD100A"
            }
          ]
        },
        "Metadata": {
          "aws:cdk:path": "WithcdkStack/MyPipeline/Build/Build/CodePipelineActionRole/DefaultPolicy/Resource"
        }
      },
      "MyPipelineDeployCodePipelineActionRole742BD48A": {
        "Type": "AWS::IAM::Role",
        "Properties": {
          "AssumeRolePolicyDocument": {
            "Statement": [
              {
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {
                  "AWS": {
                    "Fn::Join": [
                      "",
                      [
                        "arn:",
                        {
                          "Ref": "AWS::Partition"
                        },
                        ":iam::",
                        {
                          "Ref": "AWS::AccountId"
                        },
                        ":root"
                      ]
                    ]
                  }
                }
              }
            ],
            "Version": "2012-10-17"
          }
        },
        "Metadata": {
          "aws:cdk:path": "WithcdkStack/MyPipeline/Deploy/Deploy/CodePipelineActionRole/Resource"
        }
      },
      "MyPipelineDeployCodePipelineActionRoleDefaultPolicyEA21735C": {
        "Type": "AWS::IAM::Policy",
        "Properties": {
          "PolicyDocument": {
            "Statement": [
              {
                "Action": [
                  "ecs:DescribeServices",
                  "ecs:DescribeTaskDefinition",
                  "ecs:DescribeTasks",
                  "ecs:ListTasks",
                  "ecs:RegisterTaskDefinition",
                  "ecs:UpdateService"
                ],
                "Effect": "Allow",
                "Resource": "*"
              },
              {
                "Action": "iam:PassRole",
                "Condition": {
                  "StringEqualsIfExists": {
                    "iam:PassedToService": [
                      "ec2.amazonaws.com",
                      "ecs-tasks.amazonaws.com"
                    ]
                  }
                },
                "Effect": "Allow",
                "Resource": "*"
              },
              {
                "Action": [
                  "s3:GetObject*",
                  "s3:GetBucket*",
                  "s3:List*"
                ],
                "Effect": "Allow",
                "Resource": [
                  {
                    "Fn::Join": [
                      "",
                      [
                        "arn:",
                        {
                          "Ref": "AWS::Partition"
                        },
                        ":s3:::",
                        {
                          "Ref": "ParamDeploymentBucket"
                        }
                      ]
                    ]
                  },
                  {
                    "Fn::Join": [
                      "",
                      [
                        "arn:",
                        {
                          "Ref": "AWS::Partition"
                        },
                        ":s3:::",
                        {
                          "Ref": "ParamDeploymentBucket"
                        },
                        "/*"
                      ]
                    ]
                  }
                ]
              }
            ],
            "Version": "2012-10-17"
          },
          "PolicyName": "MyPipelineDeployCodePipelineActionRoleDefaultPolicyEA21735C",
          "Roles": [
            {
              "Ref": "MyPipelineDeployCodePipelineActionRole742BD48A"
            }
          ]
        },
        "Metadata": {
          "aws:cdk:path": "WithcdkStack/MyPipeline/Deploy/Deploy/CodePipelineActionRole/DefaultPolicy/Resource"
        }
      },
      "CDKMetadata": {
        "Type": "AWS::CDK::Metadata",
        "Properties": {
          "Modules": "aws-cdk=1.66.0,@aws-cdk/assets=1.66.0,@aws-cdk/aws-applicationautoscaling=1.66.0,@aws-cdk/aws-autoscaling=1.66.0,@aws-cdk/aws-autoscaling-common=1.66.0,@aws-cdk/aws-autoscaling-hooktargets=1.66.0,@aws-cdk/aws-certificatemanager=1.66.0,@aws-cdk/aws-cloudformation=1.66.0,@aws-cdk/aws-cloudfront=1.66.0,@aws-cdk/aws-cloudfront-origins=1.66.0,@aws-cdk/aws-cloudwatch=1.66.0,@aws-cdk/aws-codebuild=1.66.0,@aws-cdk/aws-codeguruprofiler=1.66.0,@aws-cdk/aws-codepipeline=1.66.0,@aws-cdk/aws-codepipeline-actions=1.66.0,@aws-cdk/aws-cognito=1.66.0,@aws-cdk/aws-ec2=1.66.0,@aws-cdk/aws-ecr=1.66.0,@aws-cdk/aws-ecr-assets=1.66.0,@aws-cdk/aws-ecs=1.66.0,@aws-cdk/aws-elasticloadbalancingv2=1.66.0,@aws-cdk/aws-elasticloadbalancingv2-actions=1.66.0,@aws-cdk/aws-events=1.66.0,@aws-cdk/aws-events-targets=1.66.0,@aws-cdk/aws-iam=1.66.0,@aws-cdk/aws-kms=1.66.0,@aws-cdk/aws-lambda=1.66.0,@aws-cdk/aws-logs=1.66.0,@aws-cdk/aws-s3=1.66.0,@aws-cdk/aws-s3-assets=1.66.0,@aws-cdk/aws-servicediscovery=1.66.0,@aws-cdk/aws-sns=1.66.0,@aws-cdk/aws-sns-subscriptions=1.66.0,@aws-cdk/aws-sqs=1.66.0,@aws-cdk/aws-ssm=1.66.0,@aws-cdk/cloud-assembly-schema=1.66.0,@aws-cdk/core=1.66.0,@aws-cdk/custom-resources=1.66.0,@aws-cdk/cx-api=1.66.0,@aws-cdk/region-info=1.66.0,jsii-runtime=node.js/v12.16.1"
        },
        "Metadata": {
          "aws:cdk:path": "WithcdkStack/CDKMetadata/Default"
        },
        "Condition": "CDKMetadataAvailable"
      }
    },
    "Outputs": {
      "ExportEcrUri": {
        "Value": {
          "Fn::Join": [
            "",
            [
              {
                "Fn::Select": [
                  4,
                  {
                    "Fn::Split": [
                      ":",
                      {
                        "Fn::GetAtt": [
                          "MyRepository4C4BD5FC",
                          "Arn"
                        ]
                      }
                    ]
                  }
                ]
              },
              ".dkr.ecr.",
              {
                "Fn::Select": [
                  3,
                  {
                    "Fn::Split": [
                      ":",
                      {
                        "Fn::GetAtt": [
                          "MyRepository4C4BD5FC",
                          "Arn"
                        ]
                      }
                    ]
                  }
                ]
              },
              ".",
              {
                "Ref": "AWS::URLSuffix"
              },
              "/",
              {
                "Ref": "MyRepository4C4BD5FC"
              }
            ]
          ]
        },
        "Export": {
          "Name": "EcrUri"
        }
      }
    },
    "Conditions": {
      "CDKMetadataAvailable": {
        "Fn::Or": [
          {
            "Fn::Or": [
              {
                "Fn::Equals": [
                  {
                    "Ref": "AWS::Region"
                  },
                  "ap-east-1"
                ]
              },
              {
                "Fn::Equals": [
                  {
                    "Ref": "AWS::Region"
                  },
                  "ap-northeast-1"
                ]
              },
              {
                "Fn::Equals": [
                  {
                    "Ref": "AWS::Region"
                  },
                  "ap-northeast-2"
                ]
              },
              {
                "Fn::Equals": [
                  {
                    "Ref": "AWS::Region"
                  },
                  "ap-south-1"
                ]
              },
              {
                "Fn::Equals": [
                  {
                    "Ref": "AWS::Region"
                  },
                  "ap-southeast-1"
                ]
              },
              {
                "Fn::Equals": [
                  {
                    "Ref": "AWS::Region"
                  },
                  "ap-southeast-2"
                ]
              },
              {
                "Fn::Equals": [
                  {
                    "Ref": "AWS::Region"
                  },
                  "ca-central-1"
                ]
              },
              {
                "Fn::Equals": [
                  {
                    "Ref": "AWS::Region"
                  },
                  "cn-north-1"
                ]
              },
              {
                "Fn::Equals": [
                  {
                    "Ref": "AWS::Region"
                  },
                  "cn-northwest-1"
                ]
              },
              {
                "Fn::Equals": [
                  {
                    "Ref": "AWS::Region"
                  },
                  "eu-central-1"
                ]
              }
            ]
          },
          {
            "Fn::Or": [
              {
                "Fn::Equals": [
                  {
                    "Ref": "AWS::Region"
                  },
                  "eu-north-1"
                ]
              },
              {
                "Fn::Equals": [
                  {
                    "Ref": "AWS::Region"
                  },
                  "eu-west-1"
                ]
              },
              {
                "Fn::Equals": [
                  {
                    "Ref": "AWS::Region"
                  },
                  "eu-west-2"
                ]
              },
              {
                "Fn::Equals": [
                  {
                    "Ref": "AWS::Region"
                  },
                  "eu-west-3"
                ]
              },
              {
                "Fn::Equals": [
                  {
                    "Ref": "AWS::Region"
                  },
                  "me-south-1"
                ]
              },
              {
                "Fn::Equals": [
                  {
                    "Ref": "AWS::Region"
                  },
                  "sa-east-1"
                ]
              },
              {
                "Fn::Equals": [
                  {
                    "Ref": "AWS::Region"
                  },
                  "us-east-1"
                ]
              },
              {
                "Fn::Equals": [
                  {
                    "Ref": "AWS::Region"
                  },
                  "us-east-2"
                ]
              },
              {
                "Fn::Equals": [
                  {
                    "Ref": "AWS::Region"
                  },
                  "us-west-1"
                ]
              },
              {
                "Fn::Equals": [
                  {
                    "Ref": "AWS::Region"
                  },
                  "us-west-2"
                ]
              }
            ]
          }
        ]
      }
    }
  }

  const templateParameters = {
    ParamRepositoryName: parameters.resourceName,
    ParamZipPath: '', // TBD after push
    ParamDeploymentBucket: `${context.amplify.getProjectMeta().providers[provider].DeploymentBucketName}`
  }

  fs.writeFileSync(path.join(resourceDirPath, 'src', 'Dockerfile'), 'FROM inanimate/echo-server');
  fs.writeFileSync(path.join(resourceDirPath, 'src', 'buildspec.yml'), buildspec);
  JSONUtilities.writeJson(path.join(resourceDirPath, 'container-template.json'), containerCfn);
  JSONUtilities.writeJson(path.join(resourceDirPath, 'parameters.json'), templateParameters);
}


// handling both FunctionParameters and FunctionTriggerParameters here is a hack
// ideally we refactor the auth trigger flows to use FunctionParameters directly and get rid of FunctionTriggerParameters altogether
export function createFunctionResources(context: any, parameters: FunctionParameters | FunctionTriggerParameters) {
  context.print.info('before update meta');
  context.amplify.updateamplifyMetaAfterResourceAdd(
    categoryName,
    parameters.resourceName || parameters.functionName,
    translateFuncParamsToResourceOpts(parameters),
  );

  context.print.info('after update meta');
  // copy template, CFN and parameter files
  copyTemplateFiles(context, parameters);
  context.print.info('after copy template meta');
  saveMutableState(context, parameters);
  context.print.info('after save mutable state');
  saveCFNParameters(context, parameters);
  context.print.info('after save CFN parameters');
  context.amplify.leaveBreadcrumbs(context, categoryName, parameters.resourceName, createBreadcrumbs(parameters));
  context.print.info('after leave breadcrumbs');
}

export const createLayerArtifacts = (context, parameters: LayerParameters, latestVersion: number = 1): string => {
  const layerDirPath = ensureLayerFolders(context, parameters);
  updateLayerState(context, parameters, layerDirPath);
  createParametersFile(context, { layerVersion: latestVersion }, parameters.layerName, parametersFileName);
  createLayerCfnFile(context, parameters, layerDirPath);
  addLayerToAmplifyMeta(context, parameters);
  return layerDirPath;
};

// updates the layer resources and returns the resource directory
const defaultOpts = {
  layerParams: true,
  cfnFile: true,
  amplifyMeta: true,
};
export const updateLayerArtifacts = (
  context,
  parameters: LayerParameters,
  latestVersion?: number,
  options: Partial<typeof defaultOpts> = {},
): string => {
  options = _.assign(defaultOpts, options);
  const layerDirPath = ensureLayerFolders(context, parameters);
  if (options.layerParams) {
    updateLayerState(context, parameters, layerDirPath);
  }
  if (options.cfnFile) {
    if (latestVersion !== undefined) {
      createParametersFile(context, { layerVersion: latestVersion }, parameters.layerName, parametersFileName);
    }
    updateLayerCfnFile(context, parameters, layerDirPath);
  }
  if (options.amplifyMeta) {
    updateLayerInAmplifyMeta(context, parameters);
  }
  return layerDirPath;
};

export function removeLayerArtifacts(context, layerName) {
  if (isMultiEnvLayer(context, layerName)) {
    removeLayerFromTeamProviderInfo(context, layerName);
  }
}

// ideally function update should be refactored so this function does not need to be exported
export function saveMutableState(
  context,
  parameters:
    | Partial<Pick<FunctionParameters, 'mutableParametersState' | 'resourceName' | 'lambdaLayers' | 'functionName'>>
    | FunctionTriggerParameters,
) {
  createParametersFile(
    context,
    buildParametersFileObj(parameters),
    parameters.resourceName || parameters.functionName,
    functionParametersFileName,
  );
}

// ideally function update should be refactored so this function does not need to be exported
export function saveCFNParameters(
  context,
  parameters: Partial<Pick<FunctionParameters, 'cloudwatchRule' | 'resourceName'>> | FunctionTriggerParameters,
) {
  if ('trigger' in parameters) {
    const params = {
      modules: parameters.modules.join(),
      resourceName: parameters.resourceName,
    };
    createParametersFile(context, params, parameters.resourceName, parametersFileName);
  }
  if ('cloudwatchRule' in parameters) {
    const params = {
      CloudWatchRule: parameters.cloudwatchRule,
    };
    createParametersFile(context, params, parameters.resourceName, parametersFileName);
  }
}

function updateLayerState(context: any, parameters: LayerParameters, layerDirPath: string) {
  if (isMultiEnvLayer(context, parameters.layerName)) {
    updateLayerTeamProviderInfo(context, parameters, layerDirPath);
    saveLayerRuntimes(layerDirPath, parameters.layerName, parameters.runtimes);
  } else {
    createLayerParametersFile(context, parameters, layerDirPath, isMultiEnvLayer(context, parameters.layerName));
  }
}

function copyTemplateFiles(context: any, parameters: FunctionParameters | FunctionTriggerParameters) {
  // copy function template files
  const destDir = context.amplify.pathManager.getBackendDirPath();
  const copyJobs = parameters.functionTemplate.sourceFiles.map(file => {
    return {
      dir: parameters.functionTemplate.sourceRoot,
      template: file,
      target: path.join(
        destDir,
        categoryName,
        parameters.resourceName,
        _.get(parameters.functionTemplate.destMap, file, file.replace(/\.ejs$/, '')),
      ),
    };
  });

  // this is a hack to reuse some old code
  let templateParams: any = parameters;
  if ('trigger' in parameters) {
    let triggerEnvs = context.amplify.loadEnvResourceParameters(context, 'function', parameters.resourceName);
    parameters.triggerEnvs = JSON.parse(parameters.triggerEnvs) || [];

    parameters.triggerEnvs.forEach(c => {
      triggerEnvs[c.key] = c.value;
    });
    templateParams = _.assign(templateParams, triggerEnvs);
  }
  templateParams = _.assign(templateParams, {
    enableCors: process.env.AMPLIFY_CLI_LAMBDA_CORS_HEADER === 'true',
  });

  context.amplify.copyBatch(context, copyJobs, templateParams, false);

  // copy cloud resource template
  const cloudTemplateJob = {
    dir: '',
    template: parameters.cloudResourceTemplatePath,
    target: path.join(destDir, categoryName, parameters.resourceName, `${parameters.resourceName}-cloudformation-template.json`),
  };

  const copyJobParams: any = parameters;
  if ('lambdaLayers' in parameters) {
    const layerCFNValues = convertLambdaLayerMetaToLayerCFNArray(context, parameters.lambdaLayers, context.amplify.getEnvInfo().envName);
    copyJobParams.lambdaLayersCFNArray = layerCFNValues;
  }
  context.amplify.copyBatch(context, [cloudTemplateJob], copyJobParams, false);
}

function ensureLayerFolders(context, parameters) {
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const layerDirPath = path.join(projectBackendDirPath, categoryName, parameters.layerName);
  fs.ensureDirSync(path.join(layerDirPath, 'opt'));
  parameters.runtimes.forEach(runtime => ensureLayerRuntimeFolder(layerDirPath, runtime));
  return layerDirPath;
}

// Default files are only created if the path does not exist
function ensureLayerRuntimeFolder(layerDirPath: string, runtime) {
  const runtimeDirPath = path.join(layerDirPath, 'lib', runtime.layerExecutablePath);
  if (!fs.pathExistsSync(runtimeDirPath)) {
    fs.ensureDirSync(runtimeDirPath);
    fs.writeFileSync(path.join(runtimeDirPath, 'README.txt'), 'Replace this file with your layer files');
    (runtime.layerDefaultFiles || []).forEach(defaultFile =>
      fs.writeFileSync(path.join(layerDirPath, 'lib', defaultFile.path, defaultFile.filename), defaultFile.content),
    );
  }
}

function createLayerCfnFile(context, parameters: LayerParameters, layerDirPath: string) {
  JSONUtilities.writeJson(
    path.join(layerDirPath, parameters.layerName + '-awscloudformation-template.json'),
    generateLayerCfnObj(context, parameters),
  );
}

function updateLayerCfnFile(context, parameters: LayerParameters, layerDirPath: string) {
  JSONUtilities.writeJson(
    path.join(layerDirPath, parameters.layerName + '-awscloudformation-template.json'),
    generateLayerCfnObj(context, parameters),
  );
}

const writeParametersToAmplifyMeta = (context, layerName: string, parameters) => {
  const amplifyMeta = context.amplify.getProjectMeta();
  _.set(amplifyMeta, ['function', layerName], parameters);
  JSONUtilities.writeJson(context.amplify.pathManager.getAmplifyMetaFilePath(), amplifyMeta);
};

const addLayerToAmplifyMeta = (context, parameters: LayerParameters) => {
  context.amplify.updateamplifyMetaAfterResourceAdd(categoryName, parameters.layerName, amplifyMetaAndBackendParams(parameters));
  writeParametersToAmplifyMeta(
    context,
    parameters.layerName,
    layerParamsToAmplifyMetaParams(parameters, isMultiEnvLayer(context, parameters.layerName)),
  );
};

const updateLayerInAmplifyMeta = (context, parameters: LayerParameters) => {
  writeParametersToAmplifyMeta(
    context,
    parameters.layerName,
    layerParamsToAmplifyMetaParams(parameters, isMultiEnvLayer(context, parameters.layerName)),
  );
};

const createLayerParametersFile = (
  context,
  parameters: LayerParameters | StoredLayerParameters,
  layerDirPath: string,
  isMultiEnv: boolean,
) => {
  fs.ensureDirSync(layerDirPath);
  const parametersFilePath = path.join(layerDirPath, layerParametersFileName);
  JSONUtilities.writeJson(parametersFilePath, layerParamsToStoredParams(parameters, isMultiEnv));
};

const updateLayerTeamProviderInfo = (context, parameters: LayerParameters, layerDirPath: string) => {
  fs.ensureDirSync(layerDirPath);
  const teamProviderInfoPath = context.amplify.pathManager.getProviderInfoFilePath();
  const { envName } = context.amplify.getEnvInfo();
  if (!fs.existsSync(teamProviderInfoPath)) {
    throw new Error(`${teamProviderInfoPath} not found.`);
  }

  const teamProviderInfo = context.amplify.readJsonFile(teamProviderInfoPath);
  _.set(
    teamProviderInfo,
    [envName, 'nonCFNdata', categoryName, parameters.layerName],
    layerParamsToStoredParams(parameters, isMultiEnvLayer(context, parameters.layerName)),
  );
  JSONUtilities.writeJson(teamProviderInfoPath, teamProviderInfo);
};

const removeLayerFromTeamProviderInfo = (context, layerName) => {
  const teamProviderInfoPath = context.amplify.pathManager.getProviderInfoFilePath();
  const { envName } = context.amplify.getEnvInfo();
  if (!fs.existsSync(teamProviderInfoPath)) {
    throw new Error(`${teamProviderInfoPath} not found.`);
  }
  const teamProviderInfo = JSONUtilities.readJson(teamProviderInfoPath);
  _.unset(teamProviderInfo, [envName, 'nonCFNdata', categoryName, layerName]);
  if (_.isEmpty(_.get(teamProviderInfo, [envName, 'nonCFNdata', categoryName]))) {
    _.unset(teamProviderInfo, [envName, 'nonCFNdata', categoryName]);
    if (_.isEmpty(_.get(teamProviderInfo, [envName, 'nonCFNdata']))) {
      _.unset(teamProviderInfo, [envName, 'nonCFNdata']);
    }
  }
  JSONUtilities.writeJson(teamProviderInfoPath, teamProviderInfo);
};

interface LayerMetaAndBackendConfigParams {
  providerPlugin: string;
  service: string;
  build: boolean;
}

const amplifyMetaAndBackendParams = (parameters: LayerParameters): LayerMetaAndBackendConfigParams => ({
  providerPlugin: parameters.providerContext.provider,
  service: parameters.providerContext.service,
  build: parameters.build,
});

const layerParamsToAmplifyMetaParams = (
  parameters: LayerParameters,
  isMultiEnv: boolean,
): LayerMetaAndBackendConfigParams & StoredLayerParameters => {
  const amplifyMetaBackendParams = amplifyMetaAndBackendParams(parameters);
  return _.assign(layerParamsToStoredParams(parameters, isMultiEnv), amplifyMetaBackendParams);
};

const layerParamsToStoredParams = (parameters: LayerParameters | StoredLayerParameters, isMultiEnv: boolean): StoredLayerParameters => {
  const storedParams: StoredLayerParameters = { layerVersionMap: parameters.layerVersionMap };
  if (!isMultiEnv) {
    storedParams.runtimes = (parameters.runtimes || []).map(runtime =>
      _.pick(runtime, 'value', 'name', 'layerExecutablePath', 'cloudTemplateValue'),
    );
  }
  return storedParams;
};

function createParametersFile(context, parameters, resourceName, parametersFileName) {
  const parametersFilePath = path.join(context.amplify.pathManager.getBackendDirPath(), categoryName, resourceName, parametersFileName);
  const currentParameters = JSONUtilities.readJson(parametersFilePath, { throwIfNotExist: false }) || ({} as any);
  delete currentParameters.mutableParametersState; // this field was written in error in a previous version of the cli
  JSONUtilities.writeJson(parametersFilePath, { ...currentParameters, ...parameters });
}

function buildParametersFileObj(
  parameters: Partial<Pick<FunctionParameters, 'mutableParametersState' | 'lambdaLayers'>> | FunctionTriggerParameters,
): any {
  if ('trigger' in parameters) {
    return _.omit(parameters, ['functionTemplate', 'cloudResourceTemplatePath']);
  }
  return { ...parameters.mutableParametersState, ..._.pick(parameters, ['lambdaLayers']) };
}

function translateFuncParamsToResourceOpts(params: FunctionParameters | FunctionTriggerParameters): any {
  let result: any = {
    build: true,
    providerPlugin: provider,
    service: ServiceName.LambdaFunction,
  };
  if (!('trigger' in params)) {
    result.dependsOn = params.dependsOn;
  }
  return result;
}

function createBreadcrumbs(params: FunctionParameters | FunctionTriggerParameters): FunctionBreadcrumbs {
  if ('trigger' in params) {
    return {
      pluginId: 'amplify-nodejs-function-runtime-provider',
      functionRuntime: 'nodejs',
      useLegacyBuild: true,
      defaultEditorFile: 'src/index.js',
    };
  }
  return {
    pluginId: params.runtimePluginId,
    functionRuntime: params.runtime.value,
    useLegacyBuild: params.runtime.value === 'nodejs' ? true : false, // so we can update node builds in the future
    defaultEditorFile: params.functionTemplate.defaultEditorFile,
  };
}
