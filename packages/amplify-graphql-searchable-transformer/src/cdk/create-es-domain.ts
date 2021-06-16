import { EbsDeviceVolumeType } from '@aws-cdk/aws-ec2';
import { CfnDomain, Domain, ElasticsearchVersion } from '@aws-cdk/aws-elasticsearch';
import { IRole, Role, ServicePrincipal } from '@aws-cdk/aws-iam';
import { CfnParameter, Construct, Fn } from '@aws-cdk/core';
import { ResourceConstants } from 'graphql-transformer-common';

export const createEsDomain = (stack: Construct, parameterMap: Map<string, CfnParameter>, apiId: string): Domain => {
  const { ElasticsearchEBSVolumeGB, ElasticsearchInstanceType, ElasticsearchInstanceCount } = ResourceConstants.PARAMETERS;
  const { ElasticsearchDomainLogicalID } = ResourceConstants.RESOURCES;
  const { HasEnvironmentParameter } = ResourceConstants.CONDITIONS;

  const domain = new Domain(stack, ElasticsearchDomainLogicalID, {
    version: ElasticsearchVersion.V6_2,
    ebs: {
      enabled: true,
      volumeType: EbsDeviceVolumeType.GP2,
      volumeSize: parameterMap.get(ElasticsearchEBSVolumeGB)?.valueAsNumber,
    },
    zoneAwareness: {
      enabled: false,
    },
    domainName: Fn.conditionIf(HasEnvironmentParameter, Fn.ref('AWS::NoValue'), 'd' + apiId).toString(),
  });

  (domain.node.defaultChild as CfnDomain).elasticsearchClusterConfig = {
    instanceCount: parameterMap.get(ElasticsearchInstanceCount)?.valueAsNumber,
    instanceType: parameterMap.get(ElasticsearchInstanceType)?.valueAsString,
  };

  return domain;
};

export const createEsDomainRole = (
  stack: Construct,
  parameterMap: Map<string, CfnParameter>,
  apiId: string,
  envParam: CfnParameter,
): IRole => {
  const { ElasticsearchAccessIAMRoleLogicalID } = ResourceConstants.RESOURCES;
  const { ElasticsearchAccessIAMRoleName } = ResourceConstants.PARAMETERS;
  const { HasEnvironmentParameter } = ResourceConstants.CONDITIONS;
  return new Role(stack, ElasticsearchAccessIAMRoleLogicalID, {
    assumedBy: new ServicePrincipal('appsync.amazonaws.com'),
    roleName: Fn.conditionIf(
      HasEnvironmentParameter,
      Fn.join('-', [parameterMap.get(ElasticsearchAccessIAMRoleName)!.valueAsString, apiId, envParam.valueAsString]),
      Fn.join('-', [parameterMap.get(ElasticsearchAccessIAMRoleName)!.valueAsString, apiId, envParam.valueAsString]),
    ).toString(),
  });
};
