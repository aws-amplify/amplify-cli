import { TransformerContextProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { EbsDeviceVolumeType } from '@aws-cdk/aws-ec2';
import { CfnDomain, Domain, ElasticsearchVersion } from '@aws-cdk/aws-elasticsearch';
import { IRole, Role, ServicePrincipal } from '@aws-cdk/aws-iam';
import { CfnParameter, Construct, Fn } from '@aws-cdk/core';
import { ResourceConstants } from 'graphql-transformer-common';

export const createSearchableDomain = (stack: Construct, parameterMap: Map<string, CfnParameter>, apiId: string): Domain => {
  const { OpenSearchEBSVolumeGB, OpenSearchInstanceType, OpenSearchInstanceCount } = ResourceConstants.PARAMETERS;
  const { OpenSearchDomainLogicalID } = ResourceConstants.RESOURCES;
  const { HasEnvironmentParameter } = ResourceConstants.CONDITIONS;

  const domain = new Domain(stack, OpenSearchDomainLogicalID, {
    version: { version: '7.10' } as ElasticsearchVersion,
    ebs: {
      enabled: true,
      volumeType: EbsDeviceVolumeType.GP2,
      volumeSize: parameterMap.get(OpenSearchEBSVolumeGB)?.valueAsNumber,
    },
    zoneAwareness: {
      enabled: false,
    },
    domainName: Fn.conditionIf(HasEnvironmentParameter, Fn.ref('AWS::NoValue'), 'd' + apiId).toString(),
  });

  (domain.node.defaultChild as CfnDomain).elasticsearchClusterConfig = {
    instanceCount: parameterMap.get(OpenSearchInstanceCount)?.valueAsNumber,
    instanceType: parameterMap.get(OpenSearchInstanceType)?.valueAsString,
  };

  return domain;
};

export const createSearchableDomainRole = (
  context: TransformerContextProvider,
  stack: Construct,
  parameterMap: Map<string, CfnParameter>,
): IRole => {
  const { OpenSearchAccessIAMRoleLogicalID } = ResourceConstants.RESOURCES;
  const { OpenSearchAccessIAMRoleName } = ResourceConstants.PARAMETERS;
  return new Role(stack, OpenSearchAccessIAMRoleLogicalID, {
    assumedBy: new ServicePrincipal('appsync.amazonaws.com'),
    roleName: context.resourceHelper.generateIAMRoleName(parameterMap.get(OpenSearchAccessIAMRoleName)!.valueAsString),
  });
};
