export const buildspec = `version: 0.2
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
    "Parameters": {
        "env": {
            "Type": "String"
        },
        "ParamDeploymentBucket": {
            "Type": "String"
        },
        "ParamContainerPort": {
            "Type": "Number"
        },
        "ParamZipPath": {
            "Type": "String"
        },
        "ParamZipPath2": {
            "Type": "String",
            "Default": ""
        },
        "ParamRepositoryName": {
            "Type": "String"
        },
        "CustomResourceAwaiterZipPath": {
            "Type": "String",
            "Description": "S3 key for asset version \"c691172cdeefa2c91b5a2907f9d81118e47597634943344795f1a844192dd49c\"",
            "Default": "custom-resource-pipeline-awaiter.zip"
        }
    },
    "Resources": {
        "MyRepository4C4BD5FC": {
            "Type": "AWS::ECR::Repository",
            "UpdateReplacePolicy": "Retain",
            "DeletionPolicy": "Retain",
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyRepository/Resource"
            },
            "Properties": {
                "RepositoryName": {
                    "Ref": "ParamRepositoryName"
                }
            },
        },
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
        "MyClusterDefaultServiceDiscoveryNamespace4A9016C4": {
            "Type": "AWS::ServiceDiscovery::PrivateDnsNamespace",
            "Properties": {
                "Name": "Manolo",
                "Vpc": {
                    "Ref": "VPCB9E5F0B4"
                }
            },
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyCluster/DefaultServiceDiscoveryNamespace/Resource"
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
                "ServiceRegistries": [
                    {
                        "ContainerName": "MyContainer",
                        "ContainerPort": {
                            "Ref": "ParamContainerPort"
                        },
                        "RegistryArn": {
                            "Fn::GetAtt": [
                                "MyServiceCloudmapService207257AE",
                                "Arn"
                            ]
                        }
                    }
                ],
                "TaskDefinition": {
                    "Ref": "MyTaskF5748B4B"
                }
            },
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyService/Service"
            }
        },
        "MyServiceCloudmapService207257AE": {
            "Type": "AWS::ServiceDiscovery::Service",
            "Properties": {
                "DnsConfig": {
                    "DnsRecords": [
                        {
                            "TTL": 60,
                            "Type": "SRV"
                        }
                    ],
                    "NamespaceId": {
                        "Fn::GetAtt": [
                            "MyClusterDefaultServiceDiscoveryNamespace4A9016C4",
                            "Id"
                        ]
                    },
                    "RoutingPolicy": "MULTIVALUE"
                },
                "HealthCheckCustomConfig": {
                    "FailureThreshold": 1
                },
                "NamespaceId": {
                    "Fn::GetAtt": [
                        "MyClusterDefaultServiceDiscoveryNamespace4A9016C4",
                        "Id"
                    ]
                }
            },
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyService/CloudmapService/Resource"
            }
        },
        "MyPipelineMyCodeBuildProjectRole628DDF8B": {
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
                "aws:cdk:path": "WithcdkStack/MyPipeline/MyCodeBuildProject/Role/Resource"
            }
        },
        "MyPipelineMyCodeBuildProjectRoleDefaultPolicy14FB0869": {
            "Type": "AWS::IAM::Policy",
            "Properties": {
                "PolicyDocument": {
                    "Statement": [
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
                                                "Ref": "MyPipelineMyCodeBuildProjectA4EF580E"
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
                                                "Ref": "MyPipelineMyCodeBuildProjectA4EF580E"
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
                                            "Ref": "MyPipelineMyCodeBuildProjectA4EF580E"
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
                "PolicyName": "MyPipelineMyCodeBuildProjectRoleDefaultPolicy14FB0869",
                "Roles": [
                    {
                        "Ref": "MyPipelineMyCodeBuildProjectRole628DDF8B"
                    }
                ]
            },
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline/MyCodeBuildProject/Role/DefaultPolicy/Resource"
            }
        },
        "MyPipelineMyCodeBuildProjectA4EF580E": {
            "Type": "AWS::CodeBuild::Project",
            "Properties": {
                "Artifacts": {
                    "Type": "CODEPIPELINE"
                },
                "Environment": {
                    "ComputeType": "BUILD_GENERAL1_SMALL",
                    "Image": "aws/codebuild/standard:4.0",
                    "PrivilegedMode": true,
                    "Type": "LINUX_CONTAINER"
                },
                "ServiceRole": {
                    "Fn::GetAtt": [
                        "MyPipelineMyCodeBuildProjectRole628DDF8B",
                        "Arn"
                    ]
                },
                "Source": {
                    "Type": "CODEPIPELINE"
                },
                "EncryptionKey": "alias/aws/s3"
            },
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline/MyCodeBuildProject/Resource"
            }
        },
        "MyPipelineRoleFEDCDE7E": {
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
                "aws:cdk:path": "WithcdkStack/MyPipeline/MyPipeline/Role/Resource"
            }
        },
        "MyPipelineRoleDefaultPolicyE391E38A": {
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
                                    "MyPipelineSourceCodePipelineActionRoleB3E4554A",
                                    "Arn"
                                ]
                            }
                        },
                        {
                            "Action": "sts:AssumeRole",
                            "Effect": "Allow",
                            "Resource": {
                                "Fn::GetAtt": [
                                    "MyPipelineBuildCodePipelineActionRole969D9396",
                                    "Arn"
                                ]
                            }
                        }
                    ],
                    "Version": "2012-10-17"
                },
                "PolicyName": "MyPipelineRoleDefaultPolicyE391E38A",
                "Roles": [
                    {
                        "Ref": "MyPipelineRoleFEDCDE7E"
                    }
                ]
            },
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline/MyPipeline/Role/DefaultPolicy/Resource"
            }
        },
        "MyPipelineFF2E7D8D": {
            "Type": "AWS::CodePipeline::Pipeline",
            "Properties": {
                "RoleArn": {
                    "Fn::GetAtt": [
                        "MyPipelineRoleFEDCDE7E",
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
                                        "MyPipelineSourceCodePipelineActionRoleB3E4554A",
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
                                        "Ref": "MyPipelineMyCodeBuildProjectA4EF580E"
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
                                        "MyPipelineBuildCodePipelineActionRole969D9396",
                                        "Arn"
                                    ]
                                },
                                "RunOrder": 1
                            }
                        ],
                        "Name": "Build"
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
                "MyPipelineRoleDefaultPolicyE391E38A",
                "MyPipelineRoleFEDCDE7E"
            ],
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline/MyPipeline/Resource"
            }
        },
        "MyPipelineSourceCodePipelineActionRoleB3E4554A": {
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
                "aws:cdk:path": "WithcdkStack/MyPipeline/MyPipeline/Source/Source/CodePipelineActionRole/Resource"
            }
        },
        "MyPipelineSourceCodePipelineActionRoleDefaultPolicyA63E9DEC": {
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
                "PolicyName": "MyPipelineSourceCodePipelineActionRoleDefaultPolicyA63E9DEC",
                "Roles": [
                    {
                        "Ref": "MyPipelineSourceCodePipelineActionRoleB3E4554A"
                    }
                ]
            },
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline/MyPipeline/Source/Source/CodePipelineActionRole/DefaultPolicy/Resource"
            }
        },
        "MyPipelineBuildCodePipelineActionRole969D9396": {
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
                "aws:cdk:path": "WithcdkStack/MyPipeline/MyPipeline/Build/Build/CodePipelineActionRole/Resource"
            }
        },
        "MyPipelineBuildCodePipelineActionRoleDefaultPolicy22A3F1A5": {
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
                                    "MyPipelineMyCodeBuildProjectA4EF580E",
                                    "Arn"
                                ]
                            }
                        }
                    ],
                    "Version": "2012-10-17"
                },
                "PolicyName": "MyPipelineBuildCodePipelineActionRoleDefaultPolicy22A3F1A5",
                "Roles": [
                    {
                        "Ref": "MyPipelineBuildCodePipelineActionRole969D9396"
                    }
                ]
            },
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline/MyPipeline/Build/Build/CodePipelineActionRole/DefaultPolicy/Resource"
            }
        },
        "MyPipelineMyPipelineStateChange47632A2D": {
            "Type": "AWS::Events::Rule",
            "Properties": {
                "EventPattern": {
                    "source": [
                        "aws.codepipeline"
                    ],
                    "resources": [
                        {
                            "Fn::Join": [
                                "",
                                [
                                    "arn:",
                                    {
                                        "Ref": "AWS::Partition"
                                    },
                                    ":codepipeline:",
                                    {
                                        "Ref": "AWS::Region"
                                    },
                                    ":",
                                    {
                                        "Ref": "AWS::AccountId"
                                    },
                                    ":",
                                    {
                                        "Ref": "MyPipelineFF2E7D8D"
                                    }
                                ]
                            ]
                        }
                    ],
                    "detail-type": [
                        "CodePipeline Pipeline Execution State Change"
                    ]
                },
                "State": "ENABLED",
                "Targets": [
                    {
                        "Arn": {
                            "Fn::GetAtt": [
                                "MyPipelineMyQueueB621E2B4",
                                "Arn"
                            ]
                        },
                        "Id": "Target0"
                    }
                ]
            },
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline/MyPipeline/MyPipelineStateChange/Resource"
            }
        },
        "MyPipelineMyQueueB621E2B4": {
            "Type": "AWS::SQS::Queue",
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline/MyQueue/Resource"
            }
        },
        "MyPipelineMyQueuePolicy9F4CDEF4": {
            "Type": "AWS::SQS::QueuePolicy",
            "Properties": {
                "PolicyDocument": {
                    "Statement": [
                        {
                            "Action": [
                                "sqs:SendMessage",
                                "sqs:GetQueueAttributes",
                                "sqs:GetQueueUrl"
                            ],
                            "Condition": {
                                "ArnEquals": {
                                    "aws:SourceArn": {
                                        "Fn::GetAtt": [
                                            "MyPipelineMyPipelineStateChange47632A2D",
                                            "Arn"
                                        ]
                                    }
                                }
                            },
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "events.amazonaws.com"
                            },
                            "Resource": {
                                "Fn::GetAtt": [
                                    "MyPipelineMyQueueB621E2B4",
                                    "Arn"
                                ]
                            }
                        }
                    ],
                    "Version": "2012-10-17"
                },
                "Queues": [
                    {
                        "Ref": "MyPipelineMyQueueB621E2B4"
                    }
                ]
            },
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline/MyQueue/Policy/Resource"
            }
        },
        "MyPipelineCustomEventHandlerServiceRoleAB968BB9": {
            "Type": "AWS::IAM::Role",
            "Properties": {
                "AssumeRolePolicyDocument": {
                    "Statement": [
                        {
                            "Action": "sts:AssumeRole",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "lambda.amazonaws.com"
                            }
                        }
                    ],
                    "Version": "2012-10-17"
                },
                "ManagedPolicyArns": [
                    {
                        "Fn::Join": [
                            "",
                            [
                                "arn:",
                                {
                                    "Ref": "AWS::Partition"
                                },
                                ":iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
                            ]
                        ]
                    }
                ]
            },
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline/CustomEventHandler/ServiceRole/Resource"
            }
        },
        "MyPipelineCustomEventHandler99611120": {
            "Type": "AWS::Lambda::Function",
            "Properties": {
                "Code": {
                    "ZipFile": "exports.handler = function (event) {};"
                },
                "Handler": "index.handler",
                "Role": {
                    "Fn::GetAtt": [
                        "MyPipelineCustomEventHandlerServiceRoleAB968BB9",
                        "Arn"
                    ]
                },
                "Runtime": "nodejs12.x",
                "Timeout": 300
            },
            "DependsOn": [
                "MyPipelineCustomEventHandlerServiceRoleAB968BB9"
            ],
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline/CustomEventHandler/Resource"
            }
        },
        "MyPipelineCustomCompleteHandlerServiceRole1BEA7CF0": {
            "Type": "AWS::IAM::Role",
            "Properties": {
                "AssumeRolePolicyDocument": {
                    "Statement": [
                        {
                            "Action": "sts:AssumeRole",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "lambda.amazonaws.com"
                            }
                        }
                    ],
                    "Version": "2012-10-17"
                },
                "ManagedPolicyArns": [
                    {
                        "Fn::Join": [
                            "",
                            [
                                "arn:",
                                {
                                    "Ref": "AWS::Partition"
                                },
                                ":iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
                            ]
                        ]
                    }
                ]
            },
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline/CustomCompleteHandler/ServiceRole/Resource"
            }
        },
        "MyPipelineCustomCompleteHandlerServiceRoleDefaultPolicyB3C12BDF": {
            "Type": "AWS::IAM::Policy",
            "Properties": {
                "PolicyDocument": {
                    "Statement": [
                        {
                            "Action": [
                                "sqs:ReceiveMessage",
                                "sqs:DeleteMessage"
                            ],
                            "Effect": "Allow",
                            "Resource": {
                                "Fn::GetAtt": [
                                    "MyPipelineMyQueueB621E2B4",
                                    "Arn"
                                ]
                            }
                        }
                    ],
                    "Version": "2012-10-17"
                },
                "PolicyName": "MyPipelineCustomCompleteHandlerServiceRoleDefaultPolicyB3C12BDF",
                "Roles": [
                    {
                        "Ref": "MyPipelineCustomCompleteHandlerServiceRole1BEA7CF0"
                    }
                ]
            },
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline/CustomCompleteHandler/ServiceRole/DefaultPolicy/Resource"
            }
        },
        "MyPipelineCustomCompleteHandler272B9FF9": {
            "Type": "AWS::Lambda::Function",
            "Properties": {
                "Code": {
                    "ZipFile": "\n          const AWS = require(\"aws-sdk\");\n  \n          const sqs = new AWS.SQS();\n          \n          exports.handler = async function ({RequestType}) {\n            console.log({ RequestType });\n\n            if(RequestType === 'Delete') {\n              return { IsComplete: true };\n            }\n\n            const { QUEUE_URL: QueueUrl } = process.env;\n          \n            const { Messages: [message] = [] } = await sqs\n              .receiveMessage({\n                QueueUrl,\n                VisibilityTimeout: 10,\n                WaitTimeSeconds: 20,\n              })\n              .promise();\n\n            console.log({ message });\n          \n            if (message === undefined) {\n              return {\n                IsComplete: false,\n              };\n            }\n          \n            const { ReceiptHandle, Body } = message;\n          \n            const { detail: { state } } = JSON.parse(Body);\n          \n            if ([\"FAILED\", \"STOPPED\"].includes(state)) {\n              throw new Error(\"Cago la wea\");\n            }\n          \n            await sqs.deleteMessage({ QueueUrl, ReceiptHandle }).promise();\n          \n            return {\n              IsComplete: state === \"SUCCEEDED\",\n            };\n          };"
                },
                "Handler": "index.handler",
                "Role": {
                    "Fn::GetAtt": [
                        "MyPipelineCustomCompleteHandlerServiceRole1BEA7CF0",
                        "Arn"
                    ]
                },
                "Runtime": "nodejs12.x",
                "Environment": {
                    "Variables": {
                        "QUEUE_URL": {
                            "Ref": "MyPipelineMyQueueB621E2B4"
                        }
                    }
                },
                "Timeout": 25
            },
            "DependsOn": [
                "MyPipelineCustomCompleteHandlerServiceRoleDefaultPolicyB3C12BDF",
                "MyPipelineCustomCompleteHandlerServiceRole1BEA7CF0"
            ],
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline/CustomCompleteHandler/Resource"
            }
        },
        "MyPipelineMyProviderframeworkonEventServiceRole17AEA4C4": {
            "Type": "AWS::IAM::Role",
            "Properties": {
                "AssumeRolePolicyDocument": {
                    "Statement": [
                        {
                            "Action": "sts:AssumeRole",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "lambda.amazonaws.com"
                            }
                        }
                    ],
                    "Version": "2012-10-17"
                },
                "ManagedPolicyArns": [
                    {
                        "Fn::Join": [
                            "",
                            [
                                "arn:",
                                {
                                    "Ref": "AWS::Partition"
                                },
                                ":iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
                            ]
                        ]
                    }
                ]
            },
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline/MyProvider/framework-onEvent/ServiceRole/Resource"
            }
        },
        "MyPipelineMyProviderframeworkonEventServiceRoleDefaultPolicyD1ADF447": {
            "Type": "AWS::IAM::Policy",
            "Properties": {
                "PolicyDocument": {
                    "Statement": [
                        {
                            "Action": "lambda:InvokeFunction",
                            "Effect": "Allow",
                            "Resource": {
                                "Fn::GetAtt": [
                                    "MyPipelineCustomEventHandler99611120",
                                    "Arn"
                                ]
                            }
                        },
                        {
                            "Action": "lambda:InvokeFunction",
                            "Effect": "Allow",
                            "Resource": {
                                "Fn::GetAtt": [
                                    "MyPipelineCustomCompleteHandler272B9FF9",
                                    "Arn"
                                ]
                            }
                        },
                        {
                            "Action": "states:StartExecution",
                            "Effect": "Allow",
                            "Resource": {
                                "Ref": "MyPipelineMyProviderwaiterstatemachineFE0B5678"
                            }
                        }
                    ],
                    "Version": "2012-10-17"
                },
                "PolicyName": "MyPipelineMyProviderframeworkonEventServiceRoleDefaultPolicyD1ADF447",
                "Roles": [
                    {
                        "Ref": "MyPipelineMyProviderframeworkonEventServiceRole17AEA4C4"
                    }
                ]
            },
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline/MyProvider/framework-onEvent/ServiceRole/DefaultPolicy/Resource"
            }
        },
        "MyPipelineMyProviderframeworkonEvent3DA77E46": {
            "Type": "AWS::Lambda::Function",
            "Properties": {
                "Code": {
                    "S3Bucket": {
                        "Ref": "ParamDeploymentBucket"
                    },
                    "S3Key": {
                        "Ref": "CustomResourceAwaiterZipPath"
                    }
                },
                "Handler": "framework.onEvent",
                "Role": {
                    "Fn::GetAtt": [
                        "MyPipelineMyProviderframeworkonEventServiceRole17AEA4C4",
                        "Arn"
                    ]
                },
                "Runtime": "nodejs10.x",
                "Description": "AWS CDK resource provider framework - onEvent (WithcdkStack/MyPipeline/MyProvider)",
                "Environment": {
                    "Variables": {
                        "USER_ON_EVENT_FUNCTION_ARN": {
                            "Fn::GetAtt": [
                                "MyPipelineCustomEventHandler99611120",
                                "Arn"
                            ]
                        },
                        "USER_IS_COMPLETE_FUNCTION_ARN": {
                            "Fn::GetAtt": [
                                "MyPipelineCustomCompleteHandler272B9FF9",
                                "Arn"
                            ]
                        },
                        "WAITER_STATE_MACHINE_ARN": {
                            "Ref": "MyPipelineMyProviderwaiterstatemachineFE0B5678"
                        }
                    }
                },
                "Timeout": 900
            },
            "DependsOn": [
                "MyPipelineMyProviderframeworkonEventServiceRoleDefaultPolicyD1ADF447",
                "MyPipelineMyProviderframeworkonEventServiceRole17AEA4C4"
            ],
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline/MyProvider/framework-onEvent/Resource",
                "aws:asset:path": "asset.c691172cdeefa2c91b5a2907f9d81118e47597634943344795f1a844192dd49c",
                "aws:asset:property": "Code"
            }
        },
        "MyPipelineMyProviderframeworkisCompleteServiceRoleC1A3856F": {
            "Type": "AWS::IAM::Role",
            "Properties": {
                "AssumeRolePolicyDocument": {
                    "Statement": [
                        {
                            "Action": "sts:AssumeRole",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "lambda.amazonaws.com"
                            }
                        }
                    ],
                    "Version": "2012-10-17"
                },
                "ManagedPolicyArns": [
                    {
                        "Fn::Join": [
                            "",
                            [
                                "arn:",
                                {
                                    "Ref": "AWS::Partition"
                                },
                                ":iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
                            ]
                        ]
                    }
                ]
            },
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline/MyProvider/framework-isComplete/ServiceRole/Resource"
            }
        },
        "MyPipelineMyProviderframeworkisCompleteServiceRoleDefaultPolicy526DF123": {
            "Type": "AWS::IAM::Policy",
            "Properties": {
                "PolicyDocument": {
                    "Statement": [
                        {
                            "Action": "lambda:InvokeFunction",
                            "Effect": "Allow",
                            "Resource": {
                                "Fn::GetAtt": [
                                    "MyPipelineCustomEventHandler99611120",
                                    "Arn"
                                ]
                            }
                        },
                        {
                            "Action": "lambda:InvokeFunction",
                            "Effect": "Allow",
                            "Resource": {
                                "Fn::GetAtt": [
                                    "MyPipelineCustomCompleteHandler272B9FF9",
                                    "Arn"
                                ]
                            }
                        }
                    ],
                    "Version": "2012-10-17"
                },
                "PolicyName": "MyPipelineMyProviderframeworkisCompleteServiceRoleDefaultPolicy526DF123",
                "Roles": [
                    {
                        "Ref": "MyPipelineMyProviderframeworkisCompleteServiceRoleC1A3856F"
                    }
                ]
            },
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline/MyProvider/framework-isComplete/ServiceRole/DefaultPolicy/Resource"
            }
        },
        "MyPipelineMyProviderframeworkisCompleteB71AB74B": {
            "Type": "AWS::Lambda::Function",
            "Properties": {
                "Code": {
                    "S3Bucket": {
                        "Ref": "ParamDeploymentBucket"
                    },
                    "S3Key": {
                        "Ref": "CustomResourceAwaiterZipPath"
                    }
                },
                "Handler": "framework.isComplete",
                "Role": {
                    "Fn::GetAtt": [
                        "MyPipelineMyProviderframeworkisCompleteServiceRoleC1A3856F",
                        "Arn"
                    ]
                },
                "Runtime": "nodejs10.x",
                "Description": "AWS CDK resource provider framework - isComplete (WithcdkStack/MyPipeline/MyProvider)",
                "Environment": {
                    "Variables": {
                        "USER_ON_EVENT_FUNCTION_ARN": {
                            "Fn::GetAtt": [
                                "MyPipelineCustomEventHandler99611120",
                                "Arn"
                            ]
                        },
                        "USER_IS_COMPLETE_FUNCTION_ARN": {
                            "Fn::GetAtt": [
                                "MyPipelineCustomCompleteHandler272B9FF9",
                                "Arn"
                            ]
                        }
                    }
                },
                "Timeout": 900
            },
            "DependsOn": [
                "MyPipelineMyProviderframeworkisCompleteServiceRoleDefaultPolicy526DF123",
                "MyPipelineMyProviderframeworkisCompleteServiceRoleC1A3856F"
            ],
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline/MyProvider/framework-isComplete/Resource",
                "aws:asset:path": "asset.c691172cdeefa2c91b5a2907f9d81118e47597634943344795f1a844192dd49c",
                "aws:asset:property": "Code"
            }
        },
        "MyPipelineMyProviderframeworkonTimeoutServiceRoleF471A75C": {
            "Type": "AWS::IAM::Role",
            "Properties": {
                "AssumeRolePolicyDocument": {
                    "Statement": [
                        {
                            "Action": "sts:AssumeRole",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "lambda.amazonaws.com"
                            }
                        }
                    ],
                    "Version": "2012-10-17"
                },
                "ManagedPolicyArns": [
                    {
                        "Fn::Join": [
                            "",
                            [
                                "arn:",
                                {
                                    "Ref": "AWS::Partition"
                                },
                                ":iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
                            ]
                        ]
                    }
                ]
            },
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline/MyProvider/framework-onTimeout/ServiceRole/Resource"
            }
        },
        "MyPipelineMyProviderframeworkonTimeoutServiceRoleDefaultPolicy75BD8CD6": {
            "Type": "AWS::IAM::Policy",
            "Properties": {
                "PolicyDocument": {
                    "Statement": [
                        {
                            "Action": "lambda:InvokeFunction",
                            "Effect": "Allow",
                            "Resource": {
                                "Fn::GetAtt": [
                                    "MyPipelineCustomEventHandler99611120",
                                    "Arn"
                                ]
                            }
                        },
                        {
                            "Action": "lambda:InvokeFunction",
                            "Effect": "Allow",
                            "Resource": {
                                "Fn::GetAtt": [
                                    "MyPipelineCustomCompleteHandler272B9FF9",
                                    "Arn"
                                ]
                            }
                        }
                    ],
                    "Version": "2012-10-17"
                },
                "PolicyName": "MyPipelineMyProviderframeworkonTimeoutServiceRoleDefaultPolicy75BD8CD6",
                "Roles": [
                    {
                        "Ref": "MyPipelineMyProviderframeworkonTimeoutServiceRoleF471A75C"
                    }
                ]
            },
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline/MyProvider/framework-onTimeout/ServiceRole/DefaultPolicy/Resource"
            }
        },
        "MyPipelineMyProviderframeworkonTimeoutF5BEE1E8": {
            "Type": "AWS::Lambda::Function",
            "Properties": {
                "Code": {
                    "S3Bucket": {
                        "Ref": "ParamDeploymentBucket"
                    },
                    "S3Key": {
                        "Ref": "CustomResourceAwaiterZipPath"
                    }
                },
                "Handler": "framework.onTimeout",
                "Role": {
                    "Fn::GetAtt": [
                        "MyPipelineMyProviderframeworkonTimeoutServiceRoleF471A75C",
                        "Arn"
                    ]
                },
                "Runtime": "nodejs10.x",
                "Description": "AWS CDK resource provider framework - onTimeout (WithcdkStack/MyPipeline/MyProvider)",
                "Environment": {
                    "Variables": {
                        "USER_ON_EVENT_FUNCTION_ARN": {
                            "Fn::GetAtt": [
                                "MyPipelineCustomEventHandler99611120",
                                "Arn"
                            ]
                        },
                        "USER_IS_COMPLETE_FUNCTION_ARN": {
                            "Fn::GetAtt": [
                                "MyPipelineCustomCompleteHandler272B9FF9",
                                "Arn"
                            ]
                        }
                    }
                },
                "Timeout": 900
            },
            "DependsOn": [
                "MyPipelineMyProviderframeworkonTimeoutServiceRoleDefaultPolicy75BD8CD6",
                "MyPipelineMyProviderframeworkonTimeoutServiceRoleF471A75C"
            ],
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline/MyProvider/framework-onTimeout/Resource",
                "aws:asset:path": "asset.c691172cdeefa2c91b5a2907f9d81118e47597634943344795f1a844192dd49c",
                "aws:asset:property": "Code"
            }
        },
        "MyPipelineMyProviderwaiterstatemachineRoleB49AF3B1": {
            "Type": "AWS::IAM::Role",
            "Properties": {
                "AssumeRolePolicyDocument": {
                    "Statement": [
                        {
                            "Action": "sts:AssumeRole",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": {
                                    "Fn::Join": [
                                        "",
                                        [
                                            "states.",
                                            {
                                                "Ref": "AWS::Region"
                                            },
                                            ".amazonaws.com"
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
                "aws:cdk:path": "WithcdkStack/MyPipeline/MyProvider/waiter-state-machine/Role/Resource"
            }
        },
        "MyPipelineMyProviderwaiterstatemachineRoleDefaultPolicy07E22584": {
            "Type": "AWS::IAM::Policy",
            "Properties": {
                "PolicyDocument": {
                    "Statement": [
                        {
                            "Action": "lambda:InvokeFunction",
                            "Effect": "Allow",
                            "Resource": {
                                "Fn::GetAtt": [
                                    "MyPipelineMyProviderframeworkisCompleteB71AB74B",
                                    "Arn"
                                ]
                            }
                        },
                        {
                            "Action": "lambda:InvokeFunction",
                            "Effect": "Allow",
                            "Resource": {
                                "Fn::GetAtt": [
                                    "MyPipelineMyProviderframeworkonTimeoutF5BEE1E8",
                                    "Arn"
                                ]
                            }
                        }
                    ],
                    "Version": "2012-10-17"
                },
                "PolicyName": "MyPipelineMyProviderwaiterstatemachineRoleDefaultPolicy07E22584",
                "Roles": [
                    {
                        "Ref": "MyPipelineMyProviderwaiterstatemachineRoleB49AF3B1"
                    }
                ]
            },
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline/MyProvider/waiter-state-machine/Role/DefaultPolicy/Resource"
            }
        },
        "MyPipelineMyProviderwaiterstatemachineFE0B5678": {
            "Type": "AWS::StepFunctions::StateMachine",
            "Properties": {
                "DefinitionString": {
                    "Fn::Join": [
                        "",
                        [
                            "{\"StartAt\":\"framework-isComplete-task\",\"States\":{\"framework-isComplete-task\":{\"End\":true,\"Retry\":[{\"ErrorEquals\":[\"States.ALL\"],\"IntervalSeconds\":5,\"MaxAttempts\":360,\"BackoffRate\":1}],\"Catch\":[{\"ErrorEquals\":[\"States.ALL\"],\"Next\":\"framework-onTimeout-task\"}],\"Type\":\"Task\",\"Resource\":\"",
                            {
                                "Fn::GetAtt": [
                                    "MyPipelineMyProviderframeworkisCompleteB71AB74B",
                                    "Arn"
                                ]
                            },
                            "\"},\"framework-onTimeout-task\":{\"End\":true,\"Type\":\"Task\",\"Resource\":\"",
                            {
                                "Fn::GetAtt": [
                                    "MyPipelineMyProviderframeworkonTimeoutF5BEE1E8",
                                    "Arn"
                                ]
                            },
                            "\"}}}"
                        ]
                    ]
                },
                "RoleArn": {
                    "Fn::GetAtt": [
                        "MyPipelineMyProviderwaiterstatemachineRoleB49AF3B1",
                        "Arn"
                    ]
                }
            },
            "DependsOn": [
                "MyPipelineMyProviderwaiterstatemachineRoleDefaultPolicy07E22584",
                "MyPipelineMyProviderwaiterstatemachineRoleB49AF3B1"
            ],
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline/MyProvider/waiter-state-machine/Resource"
            }
        },
        "MyPipelineMyAwaiter9302C373": {
            "Type": "AWS::CloudFormation::CustomResource",
            "Properties": {
                "ServiceToken": {
                    "Fn::GetAtt": [
                        "MyPipelineMyProviderframeworkonEvent3DA77E46",
                        "Arn"
                    ]
                },
                "x": {
                    "Ref": "ParamZipPath"
                }
            },
            "DependsOn": [
                "MyPipelineFF2E7D8D"
            ],
            "UpdateReplacePolicy": "Delete",
            "DeletionPolicy": "Delete",
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline/MyAwaiter/Default"
            }
        },
        "MyPipeline2MyCodeBuildProjectRole56A963D6": {
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
                "aws:cdk:path": "WithcdkStack/MyPipeline2/MyCodeBuildProject/Role/Resource"
            },
            "Condition": "MyCondition"
        },
        "MyPipeline2MyCodeBuildProjectRoleDefaultPolicyA6D54D95": {
            "Type": "AWS::IAM::Policy",
            "Properties": {
                "PolicyDocument": {
                    "Statement": [
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
                                                "Ref": "MyPipeline2MyCodeBuildProject712AC9CB"
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
                                                "Ref": "MyPipeline2MyCodeBuildProject712AC9CB"
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
                                            "Ref": "MyPipeline2MyCodeBuildProject712AC9CB"
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
                "PolicyName": "MyPipeline2MyCodeBuildProjectRoleDefaultPolicyA6D54D95",
                "Roles": [
                    {
                        "Ref": "MyPipeline2MyCodeBuildProjectRole56A963D6"
                    }
                ]
            },
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline2/MyCodeBuildProject/Role/DefaultPolicy/Resource"
            },
            "Condition": "MyCondition"
        },
        "MyPipeline2MyCodeBuildProject712AC9CB": {
            "Type": "AWS::CodeBuild::Project",
            "Properties": {
                "Artifacts": {
                    "Type": "CODEPIPELINE"
                },
                "Environment": {
                    "ComputeType": "BUILD_GENERAL1_SMALL",
                    "Image": "aws/codebuild/standard:4.0",
                    "PrivilegedMode": true,
                    "Type": "LINUX_CONTAINER"
                },
                "ServiceRole": {
                    "Fn::GetAtt": [
                        "MyPipeline2MyCodeBuildProjectRole56A963D6",
                        "Arn"
                    ]
                },
                "Source": {
                    "Type": "CODEPIPELINE"
                },
                "EncryptionKey": "alias/aws/s3"
            },
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline2/MyCodeBuildProject/Resource"
            },
            "Condition": "MyCondition"
        },
        "MyPipeline2MyPipelineRole0B0F1446": {
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
                "aws:cdk:path": "WithcdkStack/MyPipeline2/MyPipeline/Role/Resource"
            },
            "Condition": "MyCondition"
        },
        "MyPipeline2MyPipelineRoleDefaultPolicy2D050BD5": {
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
                                    "MyPipeline2MyPipelineSourceCodePipelineActionRole334B7018",
                                    "Arn"
                                ]
                            }
                        },
                        {
                            "Action": "sts:AssumeRole",
                            "Effect": "Allow",
                            "Resource": {
                                "Fn::GetAtt": [
                                    "MyPipeline2MyPipelineBuildCodePipelineActionRoleBFB18EED",
                                    "Arn"
                                ]
                            }
                        },
                        {
                            "Action": "sts:AssumeRole",
                            "Effect": "Allow",
                            "Resource": {
                                "Fn::GetAtt": [
                                    "MyPipeline2MyPipelineDeployCodePipelineActionRole656667B6",
                                    "Arn"
                                ]
                            }
                        }
                    ],
                    "Version": "2012-10-17"
                },
                "PolicyName": "MyPipeline2MyPipelineRoleDefaultPolicy2D050BD5",
                "Roles": [
                    {
                        "Ref": "MyPipeline2MyPipelineRole0B0F1446"
                    }
                ]
            },
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline2/MyPipeline/Role/DefaultPolicy/Resource"
            },
            "Condition": "MyCondition"
        },
        "MyPipeline2MyPipeline86200BD4": {
            "Type": "AWS::CodePipeline::Pipeline",
            "Properties": {
                "RoleArn": {
                    "Fn::GetAtt": [
                        "MyPipeline2MyPipelineRole0B0F1446",
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
                                        "Ref": "ParamZipPath2"
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
                                        "MyPipeline2MyPipelineSourceCodePipelineActionRole334B7018",
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
                                        "Ref": "MyPipeline2MyCodeBuildProject712AC9CB"
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
                                        "MyPipeline2MyPipelineBuildCodePipelineActionRoleBFB18EED",
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
                                        "MyPipeline2MyPipelineDeployCodePipelineActionRole656667B6",
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
                "MyPipeline2MyPipelineRoleDefaultPolicy2D050BD5",
                "MyPipeline2MyPipelineRole0B0F1446"
            ],
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline2/MyPipeline/Resource"
            },
            "Condition": "MyCondition"
        },
        "MyPipeline2MyPipelineSourceCodePipelineActionRole334B7018": {
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
                "aws:cdk:path": "WithcdkStack/MyPipeline2/MyPipeline/Source/Source/CodePipelineActionRole/Resource"
            },
            "Condition": "MyCondition"
        },
        "MyPipeline2MyPipelineSourceCodePipelineActionRoleDefaultPolicyEA429B94": {
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
                "PolicyName": "MyPipeline2MyPipelineSourceCodePipelineActionRoleDefaultPolicyEA429B94",
                "Roles": [
                    {
                        "Ref": "MyPipeline2MyPipelineSourceCodePipelineActionRole334B7018"
                    }
                ]
            },
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline2/MyPipeline/Source/Source/CodePipelineActionRole/DefaultPolicy/Resource"
            },
            "Condition": "MyCondition"
        },
        "MyPipeline2MyPipelineBuildCodePipelineActionRoleBFB18EED": {
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
                "aws:cdk:path": "WithcdkStack/MyPipeline2/MyPipeline/Build/Build/CodePipelineActionRole/Resource"
            },
            "Condition": "MyCondition"
        },
        "MyPipeline2MyPipelineBuildCodePipelineActionRoleDefaultPolicyDDF55967": {
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
                                    "MyPipeline2MyCodeBuildProject712AC9CB",
                                    "Arn"
                                ]
                            }
                        }
                    ],
                    "Version": "2012-10-17"
                },
                "PolicyName": "MyPipeline2MyPipelineBuildCodePipelineActionRoleDefaultPolicyDDF55967",
                "Roles": [
                    {
                        "Ref": "MyPipeline2MyPipelineBuildCodePipelineActionRoleBFB18EED"
                    }
                ]
            },
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline2/MyPipeline/Build/Build/CodePipelineActionRole/DefaultPolicy/Resource"
            },
            "Condition": "MyCondition"
        },
        "MyPipeline2MyPipelineDeployCodePipelineActionRole656667B6": {
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
                "aws:cdk:path": "WithcdkStack/MyPipeline2/MyPipeline/Deploy/Deploy/CodePipelineActionRole/Resource"
            },
            "Condition": "MyCondition"
        },
        "MyPipeline2MyPipelineDeployCodePipelineActionRoleDefaultPolicy5E431DFB": {
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
                "PolicyName": "MyPipeline2MyPipelineDeployCodePipelineActionRoleDefaultPolicy5E431DFB",
                "Roles": [
                    {
                        "Ref": "MyPipeline2MyPipelineDeployCodePipelineActionRole656667B6"
                    }
                ]
            },
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline2/MyPipeline/Deploy/Deploy/CodePipelineActionRole/DefaultPolicy/Resource"
            },
            "Condition": "MyCondition"
        },
        "MyPipeline2MyPipelineMyPipelineStateChangeC4F968A5": {
            "Type": "AWS::Events::Rule",
            "Properties": {
                "EventPattern": {
                    "source": [
                        "aws.codepipeline"
                    ],
                    "resources": [
                        {
                            "Fn::Join": [
                                "",
                                [
                                    "arn:",
                                    {
                                        "Ref": "AWS::Partition"
                                    },
                                    ":codepipeline:",
                                    {
                                        "Ref": "AWS::Region"
                                    },
                                    ":",
                                    {
                                        "Ref": "AWS::AccountId"
                                    },
                                    ":",
                                    {
                                        "Ref": "MyPipeline2MyPipeline86200BD4"
                                    }
                                ]
                            ]
                        }
                    ],
                    "detail-type": [
                        "CodePipeline Pipeline Execution State Change"
                    ]
                },
                "State": "ENABLED",
                "Targets": [
                    {
                        "Arn": {
                            "Fn::GetAtt": [
                                "MyPipeline2MyQueue4BE99797",
                                "Arn"
                            ]
                        },
                        "Id": "Target0"
                    }
                ]
            },
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline2/MyPipeline/MyPipelineStateChange/Resource"
            },
            "Condition": "MyCondition"
        },
        "MyPipeline2MyQueue4BE99797": {
            "Type": "AWS::SQS::Queue",
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline2/MyQueue/Resource"
            },
            "Condition": "MyCondition"
        },
        "MyPipeline2MyQueuePolicy351FC222": {
            "Type": "AWS::SQS::QueuePolicy",
            "Properties": {
                "PolicyDocument": {
                    "Statement": [
                        {
                            "Action": [
                                "sqs:SendMessage",
                                "sqs:GetQueueAttributes",
                                "sqs:GetQueueUrl"
                            ],
                            "Condition": {
                                "ArnEquals": {
                                    "aws:SourceArn": {
                                        "Fn::GetAtt": [
                                            "MyPipeline2MyPipelineMyPipelineStateChangeC4F968A5",
                                            "Arn"
                                        ]
                                    }
                                }
                            },
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "events.amazonaws.com"
                            },
                            "Resource": {
                                "Fn::GetAtt": [
                                    "MyPipeline2MyQueue4BE99797",
                                    "Arn"
                                ]
                            }
                        }
                    ],
                    "Version": "2012-10-17"
                },
                "Queues": [
                    {
                        "Ref": "MyPipeline2MyQueue4BE99797"
                    }
                ]
            },
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline2/MyQueue/Policy/Resource"
            },
            "Condition": "MyCondition"
        },
        "MyPipeline2CustomEventHandlerServiceRole7A548EC7": {
            "Type": "AWS::IAM::Role",
            "Properties": {
                "AssumeRolePolicyDocument": {
                    "Statement": [
                        {
                            "Action": "sts:AssumeRole",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "lambda.amazonaws.com"
                            }
                        }
                    ],
                    "Version": "2012-10-17"
                },
                "ManagedPolicyArns": [
                    {
                        "Fn::Join": [
                            "",
                            [
                                "arn:",
                                {
                                    "Ref": "AWS::Partition"
                                },
                                ":iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
                            ]
                        ]
                    }
                ]
            },
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline2/CustomEventHandler/ServiceRole/Resource"
            },
            "Condition": "MyCondition"
        },
        "MyPipeline2CustomEventHandler232C0795": {
            "Type": "AWS::Lambda::Function",
            "Properties": {
                "Code": {
                    "ZipFile": "exports.handler = function (event) {};"
                },
                "Handler": "index.handler",
                "Role": {
                    "Fn::GetAtt": [
                        "MyPipeline2CustomEventHandlerServiceRole7A548EC7",
                        "Arn"
                    ]
                },
                "Runtime": "nodejs12.x",
                "Timeout": 300
            },
            "DependsOn": [
                "MyPipeline2CustomEventHandlerServiceRole7A548EC7"
            ],
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline2/CustomEventHandler/Resource"
            },
            "Condition": "MyCondition"
        },
        "MyPipeline2CustomCompleteHandlerServiceRole790F1044": {
            "Type": "AWS::IAM::Role",
            "Properties": {
                "AssumeRolePolicyDocument": {
                    "Statement": [
                        {
                            "Action": "sts:AssumeRole",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "lambda.amazonaws.com"
                            }
                        }
                    ],
                    "Version": "2012-10-17"
                },
                "ManagedPolicyArns": [
                    {
                        "Fn::Join": [
                            "",
                            [
                                "arn:",
                                {
                                    "Ref": "AWS::Partition"
                                },
                                ":iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
                            ]
                        ]
                    }
                ]
            },
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline2/CustomCompleteHandler/ServiceRole/Resource"
            },
            "Condition": "MyCondition"
        },
        "MyPipeline2CustomCompleteHandlerServiceRoleDefaultPolicyAA5DFF38": {
            "Type": "AWS::IAM::Policy",
            "Properties": {
                "PolicyDocument": {
                    "Statement": [
                        {
                            "Action": [
                                "sqs:ReceiveMessage",
                                "sqs:DeleteMessage"
                            ],
                            "Effect": "Allow",
                            "Resource": {
                                "Fn::GetAtt": [
                                    "MyPipeline2MyQueue4BE99797",
                                    "Arn"
                                ]
                            }
                        }
                    ],
                    "Version": "2012-10-17"
                },
                "PolicyName": "MyPipeline2CustomCompleteHandlerServiceRoleDefaultPolicyAA5DFF38",
                "Roles": [
                    {
                        "Ref": "MyPipeline2CustomCompleteHandlerServiceRole790F1044"
                    }
                ]
            },
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline2/CustomCompleteHandler/ServiceRole/DefaultPolicy/Resource"
            },
            "Condition": "MyCondition"
        },
        "MyPipeline2CustomCompleteHandler6A83CCF8": {
            "Type": "AWS::Lambda::Function",
            "Properties": {
                "Code": {
                    "ZipFile": "\n          const AWS = require(\"aws-sdk\");\n  \n          const sqs = new AWS.SQS();\n          \n          exports.handler = async function ({RequestType}) {\n            console.log({ RequestType });\n\n            if(RequestType === 'Delete') {\n              return { IsComplete: true };\n            }\n\n            const { QUEUE_URL: QueueUrl } = process.env;\n          \n            const { Messages: [message] = [] } = await sqs\n              .receiveMessage({\n                QueueUrl,\n                VisibilityTimeout: 10,\n                WaitTimeSeconds: 20,\n              })\n              .promise();\n\n            console.log({ message });\n          \n            if (message === undefined) {\n              return {\n                IsComplete: false,\n              };\n            }\n          \n            const { ReceiptHandle, Body } = message;\n          \n            const { detail: { state } } = JSON.parse(Body);\n          \n            if ([\"FAILED\", \"STOPPED\"].includes(state)) {\n              throw new Error(\"Cago la wea\");\n            }\n          \n            await sqs.deleteMessage({ QueueUrl, ReceiptHandle }).promise();\n          \n            return {\n              IsComplete: state === \"SUCCEEDED\",\n            };\n          };"
                },
                "Handler": "index.handler",
                "Role": {
                    "Fn::GetAtt": [
                        "MyPipeline2CustomCompleteHandlerServiceRole790F1044",
                        "Arn"
                    ]
                },
                "Runtime": "nodejs12.x",
                "Environment": {
                    "Variables": {
                        "QUEUE_URL": {
                            "Ref": "MyPipeline2MyQueue4BE99797"
                        }
                    }
                },
                "Timeout": 25
            },
            "DependsOn": [
                "MyPipeline2CustomCompleteHandlerServiceRoleDefaultPolicyAA5DFF38",
                "MyPipeline2CustomCompleteHandlerServiceRole790F1044"
            ],
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline2/CustomCompleteHandler/Resource"
            },
            "Condition": "MyCondition"
        },
        "MyPipeline2MyProviderframeworkonEventServiceRoleB41A5E8D": {
            "Type": "AWS::IAM::Role",
            "Properties": {
                "AssumeRolePolicyDocument": {
                    "Statement": [
                        {
                            "Action": "sts:AssumeRole",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "lambda.amazonaws.com"
                            }
                        }
                    ],
                    "Version": "2012-10-17"
                },
                "ManagedPolicyArns": [
                    {
                        "Fn::Join": [
                            "",
                            [
                                "arn:",
                                {
                                    "Ref": "AWS::Partition"
                                },
                                ":iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
                            ]
                        ]
                    }
                ]
            },
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline2/MyProvider/framework-onEvent/ServiceRole/Resource"
            },
            "Condition": "MyCondition"
        },
        "MyPipeline2MyProviderframeworkonEventServiceRoleDefaultPolicy6501D3BE": {
            "Type": "AWS::IAM::Policy",
            "Properties": {
                "PolicyDocument": {
                    "Statement": [
                        {
                            "Action": "lambda:InvokeFunction",
                            "Effect": "Allow",
                            "Resource": {
                                "Fn::GetAtt": [
                                    "MyPipeline2CustomEventHandler232C0795",
                                    "Arn"
                                ]
                            }
                        },
                        {
                            "Action": "lambda:InvokeFunction",
                            "Effect": "Allow",
                            "Resource": {
                                "Fn::GetAtt": [
                                    "MyPipeline2CustomCompleteHandler6A83CCF8",
                                    "Arn"
                                ]
                            }
                        },
                        {
                            "Action": "states:StartExecution",
                            "Effect": "Allow",
                            "Resource": {
                                "Ref": "MyPipeline2MyProviderwaiterstatemachine4857039A"
                            }
                        }
                    ],
                    "Version": "2012-10-17"
                },
                "PolicyName": "MyPipeline2MyProviderframeworkonEventServiceRoleDefaultPolicy6501D3BE",
                "Roles": [
                    {
                        "Ref": "MyPipeline2MyProviderframeworkonEventServiceRoleB41A5E8D"
                    }
                ]
            },
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline2/MyProvider/framework-onEvent/ServiceRole/DefaultPolicy/Resource"
            },
            "Condition": "MyCondition"
        },
        "MyPipeline2MyProviderframeworkonEvent19B240BC": {
            "Type": "AWS::Lambda::Function",
            "Properties": {
                "Code": {
                    "S3Bucket": {
                        "Ref": "ParamDeploymentBucket"
                    },
                    "S3Key": {
                        "Ref": "CustomResourceAwaiterZipPath"
                    }
                },
                "Handler": "framework.onEvent",
                "Role": {
                    "Fn::GetAtt": [
                        "MyPipeline2MyProviderframeworkonEventServiceRoleB41A5E8D",
                        "Arn"
                    ]
                },
                "Runtime": "nodejs10.x",
                "Description": "AWS CDK resource provider framework - onEvent (WithcdkStack/MyPipeline2/MyProvider)",
                "Environment": {
                    "Variables": {
                        "USER_ON_EVENT_FUNCTION_ARN": {
                            "Fn::GetAtt": [
                                "MyPipeline2CustomEventHandler232C0795",
                                "Arn"
                            ]
                        },
                        "USER_IS_COMPLETE_FUNCTION_ARN": {
                            "Fn::GetAtt": [
                                "MyPipeline2CustomCompleteHandler6A83CCF8",
                                "Arn"
                            ]
                        },
                        "WAITER_STATE_MACHINE_ARN": {
                            "Ref": "MyPipeline2MyProviderwaiterstatemachine4857039A"
                        }
                    }
                },
                "Timeout": 900
            },
            "DependsOn": [
                "MyPipeline2MyProviderframeworkonEventServiceRoleDefaultPolicy6501D3BE",
                "MyPipeline2MyProviderframeworkonEventServiceRoleB41A5E8D"
            ],
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline2/MyProvider/framework-onEvent/Resource",
                "aws:asset:path": "asset.c691172cdeefa2c91b5a2907f9d81118e47597634943344795f1a844192dd49c",
                "aws:asset:property": "Code"
            },
            "Condition": "MyCondition"
        },
        "MyPipeline2MyProviderframeworkisCompleteServiceRole471F24C9": {
            "Type": "AWS::IAM::Role",
            "Properties": {
                "AssumeRolePolicyDocument": {
                    "Statement": [
                        {
                            "Action": "sts:AssumeRole",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "lambda.amazonaws.com"
                            }
                        }
                    ],
                    "Version": "2012-10-17"
                },
                "ManagedPolicyArns": [
                    {
                        "Fn::Join": [
                            "",
                            [
                                "arn:",
                                {
                                    "Ref": "AWS::Partition"
                                },
                                ":iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
                            ]
                        ]
                    }
                ]
            },
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline2/MyProvider/framework-isComplete/ServiceRole/Resource"
            },
            "Condition": "MyCondition"
        },
        "MyPipeline2MyProviderframeworkisCompleteServiceRoleDefaultPolicyDA1B877B": {
            "Type": "AWS::IAM::Policy",
            "Properties": {
                "PolicyDocument": {
                    "Statement": [
                        {
                            "Action": "lambda:InvokeFunction",
                            "Effect": "Allow",
                            "Resource": {
                                "Fn::GetAtt": [
                                    "MyPipeline2CustomEventHandler232C0795",
                                    "Arn"
                                ]
                            }
                        },
                        {
                            "Action": "lambda:InvokeFunction",
                            "Effect": "Allow",
                            "Resource": {
                                "Fn::GetAtt": [
                                    "MyPipeline2CustomCompleteHandler6A83CCF8",
                                    "Arn"
                                ]
                            }
                        }
                    ],
                    "Version": "2012-10-17"
                },
                "PolicyName": "MyPipeline2MyProviderframeworkisCompleteServiceRoleDefaultPolicyDA1B877B",
                "Roles": [
                    {
                        "Ref": "MyPipeline2MyProviderframeworkisCompleteServiceRole471F24C9"
                    }
                ]
            },
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline2/MyProvider/framework-isComplete/ServiceRole/DefaultPolicy/Resource"
            },
            "Condition": "MyCondition"
        },
        "MyPipeline2MyProviderframeworkisComplete3F294253": {
            "Type": "AWS::Lambda::Function",
            "Properties": {
                "Code": {
                    "S3Bucket": {
                        "Ref": "ParamDeploymentBucket"
                    },
                    "S3Key": {
                        "Ref": "CustomResourceAwaiterZipPath"
                    }
                },
                "Handler": "framework.isComplete",
                "Role": {
                    "Fn::GetAtt": [
                        "MyPipeline2MyProviderframeworkisCompleteServiceRole471F24C9",
                        "Arn"
                    ]
                },
                "Runtime": "nodejs10.x",
                "Description": "AWS CDK resource provider framework - isComplete (WithcdkStack/MyPipeline2/MyProvider)",
                "Environment": {
                    "Variables": {
                        "USER_ON_EVENT_FUNCTION_ARN": {
                            "Fn::GetAtt": [
                                "MyPipeline2CustomEventHandler232C0795",
                                "Arn"
                            ]
                        },
                        "USER_IS_COMPLETE_FUNCTION_ARN": {
                            "Fn::GetAtt": [
                                "MyPipeline2CustomCompleteHandler6A83CCF8",
                                "Arn"
                            ]
                        }
                    }
                },
                "Timeout": 900
            },
            "DependsOn": [
                "MyPipeline2MyProviderframeworkisCompleteServiceRoleDefaultPolicyDA1B877B",
                "MyPipeline2MyProviderframeworkisCompleteServiceRole471F24C9"
            ],
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline2/MyProvider/framework-isComplete/Resource",
                "aws:asset:path": "asset.c691172cdeefa2c91b5a2907f9d81118e47597634943344795f1a844192dd49c",
                "aws:asset:property": "Code"
            },
            "Condition": "MyCondition"
        },
        "MyPipeline2MyProviderframeworkonTimeoutServiceRoleD6EAD036": {
            "Type": "AWS::IAM::Role",
            "Properties": {
                "AssumeRolePolicyDocument": {
                    "Statement": [
                        {
                            "Action": "sts:AssumeRole",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "lambda.amazonaws.com"
                            }
                        }
                    ],
                    "Version": "2012-10-17"
                },
                "ManagedPolicyArns": [
                    {
                        "Fn::Join": [
                            "",
                            [
                                "arn:",
                                {
                                    "Ref": "AWS::Partition"
                                },
                                ":iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
                            ]
                        ]
                    }
                ]
            },
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline2/MyProvider/framework-onTimeout/ServiceRole/Resource"
            },
            "Condition": "MyCondition"
        },
        "MyPipeline2MyProviderframeworkonTimeoutServiceRoleDefaultPolicy5765DBD8": {
            "Type": "AWS::IAM::Policy",
            "Properties": {
                "PolicyDocument": {
                    "Statement": [
                        {
                            "Action": "lambda:InvokeFunction",
                            "Effect": "Allow",
                            "Resource": {
                                "Fn::GetAtt": [
                                    "MyPipeline2CustomEventHandler232C0795",
                                    "Arn"
                                ]
                            }
                        },
                        {
                            "Action": "lambda:InvokeFunction",
                            "Effect": "Allow",
                            "Resource": {
                                "Fn::GetAtt": [
                                    "MyPipeline2CustomCompleteHandler6A83CCF8",
                                    "Arn"
                                ]
                            }
                        }
                    ],
                    "Version": "2012-10-17"
                },
                "PolicyName": "MyPipeline2MyProviderframeworkonTimeoutServiceRoleDefaultPolicy5765DBD8",
                "Roles": [
                    {
                        "Ref": "MyPipeline2MyProviderframeworkonTimeoutServiceRoleD6EAD036"
                    }
                ]
            },
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline2/MyProvider/framework-onTimeout/ServiceRole/DefaultPolicy/Resource"
            },
            "Condition": "MyCondition"
        },
        "MyPipeline2MyProviderframeworkonTimeoutB447137E": {
            "Type": "AWS::Lambda::Function",
            "Properties": {
                "Code": {
                    "S3Bucket": {
                        "Ref": "ParamDeploymentBucket"
                    },
                    "S3Key": {
                        "Ref": "CustomResourceAwaiterZipPath"
                    }
                },
                "Handler": "framework.onTimeout",
                "Role": {
                    "Fn::GetAtt": [
                        "MyPipeline2MyProviderframeworkonTimeoutServiceRoleD6EAD036",
                        "Arn"
                    ]
                },
                "Runtime": "nodejs10.x",
                "Description": "AWS CDK resource provider framework - onTimeout (WithcdkStack/MyPipeline2/MyProvider)",
                "Environment": {
                    "Variables": {
                        "USER_ON_EVENT_FUNCTION_ARN": {
                            "Fn::GetAtt": [
                                "MyPipeline2CustomEventHandler232C0795",
                                "Arn"
                            ]
                        },
                        "USER_IS_COMPLETE_FUNCTION_ARN": {
                            "Fn::GetAtt": [
                                "MyPipeline2CustomCompleteHandler6A83CCF8",
                                "Arn"
                            ]
                        }
                    }
                },
                "Timeout": 900
            },
            "DependsOn": [
                "MyPipeline2MyProviderframeworkonTimeoutServiceRoleDefaultPolicy5765DBD8",
                "MyPipeline2MyProviderframeworkonTimeoutServiceRoleD6EAD036"
            ],
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline2/MyProvider/framework-onTimeout/Resource",
                "aws:asset:path": "asset.c691172cdeefa2c91b5a2907f9d81118e47597634943344795f1a844192dd49c",
                "aws:asset:property": "Code"
            },
            "Condition": "MyCondition"
        },
        "MyPipeline2MyProviderwaiterstatemachineRole1BC81464": {
            "Type": "AWS::IAM::Role",
            "Properties": {
                "AssumeRolePolicyDocument": {
                    "Statement": [
                        {
                            "Action": "sts:AssumeRole",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": {
                                    "Fn::Join": [
                                        "",
                                        [
                                            "states.",
                                            {
                                                "Ref": "AWS::Region"
                                            },
                                            ".amazonaws.com"
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
                "aws:cdk:path": "WithcdkStack/MyPipeline2/MyProvider/waiter-state-machine/Role/Resource"
            },
            "Condition": "MyCondition"
        },
        "MyPipeline2MyProviderwaiterstatemachineRoleDefaultPolicy6B2CE82E": {
            "Type": "AWS::IAM::Policy",
            "Properties": {
                "PolicyDocument": {
                    "Statement": [
                        {
                            "Action": "lambda:InvokeFunction",
                            "Effect": "Allow",
                            "Resource": {
                                "Fn::GetAtt": [
                                    "MyPipeline2MyProviderframeworkisComplete3F294253",
                                    "Arn"
                                ]
                            }
                        },
                        {
                            "Action": "lambda:InvokeFunction",
                            "Effect": "Allow",
                            "Resource": {
                                "Fn::GetAtt": [
                                    "MyPipeline2MyProviderframeworkonTimeoutB447137E",
                                    "Arn"
                                ]
                            }
                        }
                    ],
                    "Version": "2012-10-17"
                },
                "PolicyName": "MyPipeline2MyProviderwaiterstatemachineRoleDefaultPolicy6B2CE82E",
                "Roles": [
                    {
                        "Ref": "MyPipeline2MyProviderwaiterstatemachineRole1BC81464"
                    }
                ]
            },
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline2/MyProvider/waiter-state-machine/Role/DefaultPolicy/Resource"
            },
            "Condition": "MyCondition"
        },
        "MyPipeline2MyProviderwaiterstatemachine4857039A": {
            "Type": "AWS::StepFunctions::StateMachine",
            "Properties": {
                "DefinitionString": {
                    "Fn::Join": [
                        "",
                        [
                            "{\"StartAt\":\"framework-isComplete-task\",\"States\":{\"framework-isComplete-task\":{\"End\":true,\"Retry\":[{\"ErrorEquals\":[\"States.ALL\"],\"IntervalSeconds\":5,\"MaxAttempts\":360,\"BackoffRate\":1}],\"Catch\":[{\"ErrorEquals\":[\"States.ALL\"],\"Next\":\"framework-onTimeout-task\"}],\"Type\":\"Task\",\"Resource\":\"",
                            {
                                "Fn::GetAtt": [
                                    "MyPipeline2MyProviderframeworkisComplete3F294253",
                                    "Arn"
                                ]
                            },
                            "\"},\"framework-onTimeout-task\":{\"End\":true,\"Type\":\"Task\",\"Resource\":\"",
                            {
                                "Fn::GetAtt": [
                                    "MyPipeline2MyProviderframeworkonTimeoutB447137E",
                                    "Arn"
                                ]
                            },
                            "\"}}}"
                        ]
                    ]
                },
                "RoleArn": {
                    "Fn::GetAtt": [
                        "MyPipeline2MyProviderwaiterstatemachineRole1BC81464",
                        "Arn"
                    ]
                }
            },
            "DependsOn": [
                "MyPipeline2MyProviderwaiterstatemachineRoleDefaultPolicy6B2CE82E",
                "MyPipeline2MyProviderwaiterstatemachineRole1BC81464"
            ],
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline2/MyProvider/waiter-state-machine/Resource"
            },
            "Condition": "MyCondition"
        },
        "MyPipeline2MyAwaiter6171AA4A": {
            "Type": "AWS::CloudFormation::CustomResource",
            "Properties": {
                "ServiceToken": {
                    "Fn::GetAtt": [
                        "MyPipeline2MyProviderframeworkonEvent19B240BC",
                        "Arn"
                    ]
                },
                "x": {
                    "Ref": "ParamZipPath2"
                }
            },
            "DependsOn": [
                "MyPipeline2MyPipeline86200BD4"
            ],
            "UpdateReplacePolicy": "Delete",
            "DeletionPolicy": "Delete",
            "Metadata": {
                "aws:cdk:path": "WithcdkStack/MyPipeline2/MyAwaiter/Default"
            },
            "Condition": "MyCondition"
        },
        "CDKMetadata": {
            "Type": "AWS::CDK::Metadata",
            "Properties": {
                "Modules": "aws-cdk=1.66.0,@aws-cdk/assets=1.66.0,@aws-cdk/aws-apigateway=1.66.0,@aws-cdk/aws-applicationautoscaling=1.66.0,@aws-cdk/aws-autoscaling=1.66.0,@aws-cdk/aws-autoscaling-common=1.66.0,@aws-cdk/aws-autoscaling-hooktargets=1.66.0,@aws-cdk/aws-certificatemanager=1.66.0,@aws-cdk/aws-cloudformation=1.66.0,@aws-cdk/aws-cloudfront=1.66.0,@aws-cdk/aws-cloudwatch=1.66.0,@aws-cdk/aws-codebuild=1.66.0,@aws-cdk/aws-codeguruprofiler=1.66.0,@aws-cdk/aws-codepipeline=1.66.0,@aws-cdk/aws-codepipeline-actions=1.66.0,@aws-cdk/aws-cognito=1.66.0,@aws-cdk/aws-ec2=1.66.0,@aws-cdk/aws-ecr=1.66.0,@aws-cdk/aws-ecr-assets=1.66.0,@aws-cdk/aws-ecs=1.66.0,@aws-cdk/aws-elasticloadbalancingv2=1.66.0,@aws-cdk/aws-elasticloadbalancingv2-actions=1.66.0,@aws-cdk/aws-events=1.66.0,@aws-cdk/aws-events-targets=1.66.0,@aws-cdk/aws-iam=1.66.0,@aws-cdk/aws-kms=1.66.0,@aws-cdk/aws-lambda=1.66.0,@aws-cdk/aws-logs=1.66.0,@aws-cdk/aws-s3=1.66.0,@aws-cdk/aws-s3-assets=1.66.0,@aws-cdk/aws-servicediscovery=1.66.0,@aws-cdk/aws-sns=1.66.0,@aws-cdk/aws-sns-subscriptions=1.66.0,@aws-cdk/aws-sqs=1.66.0,@aws-cdk/aws-ssm=1.66.0,@aws-cdk/cloud-assembly-schema=1.66.0,@aws-cdk/core=1.66.0,@aws-cdk/custom-resources=1.66.0,@aws-cdk/cx-api=1.66.0,@aws-cdk/region-info=1.66.0,jsii-runtime=node.js/v12.16.1"
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
        "MyCondition": {
            "Fn::Not": [
                {
                    "Fn::Equals": [
                        {
                            "Ref": "ParamZipPath2"
                        },
                        ""
                    ]
                }
            ]
        },
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
};
