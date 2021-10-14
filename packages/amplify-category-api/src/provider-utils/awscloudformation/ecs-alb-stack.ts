import * as acm from '@aws-cdk/aws-certificatemanager';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as cognito from '@aws-cdk/aws-cognito';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as elb2 from '@aws-cdk/aws-elasticloadbalancingv2';
import * as route53 from '@aws-cdk/aws-route53';
import * as route53targets from '@aws-cdk/aws-route53-targets';
import * as cdk from '@aws-cdk/core';
import { ContainersStack, ContainersStackProps } from './base-api-stack';
import { v4 as uuid } from 'uuid';

type EcsStackProps = ContainersStackProps &
  Readonly<{
    domainName: string;
    hostedZoneId?: string;
    authName: string;
  }>;
export class EcsAlbStack extends ContainersStack {
  private readonly userPoolDomain: string;

  constructor(scope: cdk.Construct, id: string, private readonly ecsProps: EcsStackProps) {
    super(scope, id, {
      ...ecsProps,
      skipWait: true,
      createCloudMapService: false,
    });

    const { authName, restrictAccess } = ecsProps;

    if (restrictAccess) {
      const param = this.parameters.get(`auth${authName}HostedUIDomain`);

      this.userPoolDomain = param.valueAsString;
    }

    this.parameters.get('ParamZipPath').default = 'site.zip';

    this.alb();
  }

  private alb() {
    const {
      domainName,
      hostedZoneId,
      exposedContainer: { name: containerName, port },
      restrictAccess,
    } = this.ecsProps;

    const sharedSecretHeaderName = 'x-cf-token';
    const sharedSecretHeader = uuid();

    const userPoolDomain = this.userPoolDomain;

    const vpcId = this.vpcId;
    const subnets = <string[]>this.subnets;

    const userPoolArn = cdk.Fn.join('', [
      'arn:',
      cdk.Aws.PARTITION,
      ':cognito-idp:',
      cdk.Aws.REGION,
      ':',
      cdk.Aws.ACCOUNT_ID,
      ':userpool/',
      this.userPoolId,
    ]);

    const [distributionDomainName, , domainNameSuffix] = domainName.match(/([^\.]+)\.(.*)/);
    const lbPrefix = `lb-${this.envName}`;
    const albDomainName = `${lbPrefix}.${domainNameSuffix}`;
    const wildcardDomainName = `*.${domainNameSuffix}`;

    const wildcardCertificate = new acm.CfnCertificate(this, 'Certificate', {
      domainName: wildcardDomainName,
      validationMethod: hostedZoneId ? acm.ValidationMethod.DNS : acm.ValidationMethod.EMAIL,
      domainValidationOptions: [
        {
          domainName: wildcardDomainName,
          validationDomain: hostedZoneId === undefined ? domainNameSuffix : undefined,
          hostedZoneId,
        },
      ],
    });

    const userPoolClient = restrictAccess
      ? new cognito.CfnUserPoolClient(this, 'UserPoolClient', {
          userPoolId: this.userPoolId,
          allowedOAuthFlows: [
            // 'implicit',
            'code',
          ],
          allowedOAuthFlowsUserPoolClient: true,
          allowedOAuthScopes: ['profile', 'phone', 'email', 'openid', 'aws.cognito.signin.user.admin'],
          generateSecret: true,
          supportedIdentityProviders: ['COGNITO'],
          callbackUrLs: [`https://${distributionDomainName}/oauth2/idpresponse`],
          logoutUrLs: [`https://${distributionDomainName}/oauth2/idpresponse`],
        })
      : undefined;

    const targetGroup = new elb2.CfnTargetGroup(this, 'TargetGroup', {
      healthCheckIntervalSeconds: cdk.Duration.seconds(90).toSeconds(),
      healthCheckPath: '/',
      healthCheckTimeoutSeconds: cdk.Duration.minutes(1).toSeconds(),
      healthyThresholdCount: 2,
      port,
      protocol: elb2.Protocol.HTTP,
      targetType: elb2.TargetType.IP,
      unhealthyThresholdCount: 2,
      vpcId,
    });

    const albSecurityGroup = new ec2.CfnSecurityGroup(this, 'AlbSecurityGroup', {
      vpcId,
      groupDescription: 'ALB Security Group',
      securityGroupEgress: [
        {
          description: 'Allow all outbound traffic by default',
          ipProtocol: '-1',
          cidrIp: '0.0.0.0/0',
        },
      ],
      securityGroupIngress: [
        {
          description: 'Allow from anyone on port 443',
          ipProtocol: ec2.Protocol.TCP,
          cidrIp: '0.0.0.0/0',
          fromPort: 443,
          toPort: 443,
        },
      ],
    });

    const loadBalancer = new elb2.CfnLoadBalancer(this, 'LoadBalancer', {
      type: 'application',
      securityGroups: [albSecurityGroup.attrGroupId],
      loadBalancerAttributes: [
        {
          key: 'deletion_protection.enabled',
          value: 'false',
        },
      ],
      scheme: 'internet-facing',
      subnets,
    });

    (<ecs.CfnService.LoadBalancerProperty[]>this.ecsService.loadBalancers) = [
      {
        containerName,
        containerPort: port,
        targetGroupArn: targetGroup.ref,
      },
    ];
    (<ec2.CfnSecurityGroup.IngressProperty[]>this.ecsServiceSecurityGroup.securityGroupIngress).push({
      ipProtocol: ec2.Protocol.TCP,
      fromPort: port,
      toPort: port,
      sourceSecurityGroupId: albSecurityGroup.attrGroupId,
    });

    const listener = new elb2.CfnListener(this, 'AlbListener', {
      defaultActions: [
        {
          fixedResponseConfig: {
            statusCode: '403',
          },
          type: 'fixed-response',
        },
      ],
      loadBalancerArn: loadBalancer.ref,
      port: 443,
      protocol: elb2.Protocol.HTTPS,
      certificates: [{ certificateArn: wildcardCertificate.ref }],
    });

    this.ecsService.addDependsOn(listener);

    let actionsOrderCounter = 1;
    const listenerRule = new elb2.CfnListenerRule(this, 'AlbListenerRule', {
      priority: 1,
      listenerArn: listener.ref,
      actions: [].concat(
        restrictAccess
          ? {
              order: actionsOrderCounter++,
              type: 'authenticate-cognito',
              authenticateCognitoConfig: {
                userPoolArn,
                userPoolClientId: userPoolClient.ref,
                userPoolDomain,
              },
            }
          : undefined,
        {
          order: actionsOrderCounter++,
          type: 'forward',
          targetGroupArn: targetGroup.ref,
        },
      ),
      conditions: [
        {
          field: 'host-header',
          hostHeaderConfig: {
            values: [distributionDomainName],
          },
        },
        {
          field: 'http-header',
          httpHeaderConfig: {
            httpHeaderName: sharedSecretHeaderName,
            values: [sharedSecretHeader],
          },
        },
      ],
    });

    this.ecsService.addDependsOn(listenerRule);

    const originId = `${loadBalancer.logicalId}-origin`;

    const distribution = new cloudfront.CfnDistribution(this, 'Distribution', {
      distributionConfig: {
        enabled: true,
        httpVersion: 'http2',
        ipv6Enabled: true,
        aliases: [distributionDomainName],
        defaultCacheBehavior: {
          forwardedValues: {
            cookies: { forward: 'all' },
            headers: ['*'],
            queryString: true,
          },
          targetOriginId: originId,
          viewerProtocolPolicy: 'redirect-to-https',
        },
        origins: [
          {
            customOriginConfig: {
              originProtocolPolicy: 'https-only',
            },
            domainName: albDomainName,
            id: originId,
            originCustomHeaders: [
              {
                headerName: sharedSecretHeaderName,
                headerValue: sharedSecretHeader,
              },
            ],
          },
        ],
        viewerCertificate: {
          acmCertificateArn: wildcardCertificate.ref,
          minimumProtocolVersion: 'TLSv1.2_2019',
          sslSupportMethod: 'sni-only',
        },
      },
    });

    if (hostedZoneId) {
      new route53.CfnRecordSetGroup(this, 'RecordSetGroup', {
        hostedZoneId,
        recordSets: [
          {
            name: albDomainName,
            type: route53.RecordType.A,
            aliasTarget: {
              hostedZoneId: loadBalancer.attrCanonicalHostedZoneId,
              dnsName: loadBalancer.attrDnsName,
            },
          },
          {
            name: distributionDomainName,
            type: route53.RecordType.A,
            aliasTarget: {
              hostedZoneId: route53targets.CloudFrontTarget.CLOUDFRONT_ZONE_ID,
              dnsName: distribution.attrDomainName,
            },
          },
        ],
      });
    }

    new cdk.CfnOutput(this, 'PipelineUrl', {
      value: cdk.Fn.join('', [
        'https://',
        cdk.Aws.REGION,
        '.console.aws.amazon.com/codesuite/codepipeline/pipelines/',
        this.getPipelineName(),
        '/view',
      ]),
    });

    new cdk.CfnOutput(this, 'LoadBalancerAliasDomainName', { value: loadBalancer.attrDnsName });
    new cdk.CfnOutput(this, 'LoadBalancerCnameDomainName', { value: albDomainName });
    new cdk.CfnOutput(this, 'CloudfrontDistributionAliasDomainName', { value: distribution.attrDomainName });
    new cdk.CfnOutput(this, 'CloudfrontDistributionCnameDomainName', { value: distributionDomainName });
  }
}
