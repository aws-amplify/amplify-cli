import { $TSAny } from 'amplify-cli-core';
import { Capture, Template, Match } from 'aws-cdk-lib/assertions';
import * as cdk from 'aws-cdk-lib';
import { cloneDeep } from 'lodash';
import { ApiGatewayAuthStack, CrudOperation } from '../../utils/consolidate-apigw-policies';

const generatePolicyDoc = (roleName: string, policy: any, assertionType: 'Presence' | 'Absence' = 'Presence'): $TSAny => ({
  Roles: [
    {
      Ref: roleName,
    },
  ],
  PolicyDocument: Match.objectLike({
    Statement: Match.arrayWith([
      Match.objectLike({
        Effect: 'Allow',
        Action: ['execute-api:Invoke'],
        Resource: (assertionType === 'Presence' ? Match.arrayWith : Match.not)([policy]),
      }),
    ]),
  }),
});

describe('ApiGatewayAuthStack', () => {
  let policyDocTemplate;

  beforeEach(() => {
    policyDocTemplate = {
      'Fn::Join': [
        '',
        [
          'arn:aws:execute-api:',
          {
            Ref: 'AWS::Region',
          },
          ':',
          {
            Ref: 'AWS::AccountId',
          },
          ':',
          {
            Ref: 'restApi',
          },
          '/',
          {
            'Fn::If': [
              'ShouldNotCreateEnvResources',
              'Prod',
              {
                Ref: 'env',
              },
            ],
          },
        ],
      ],
    };
  });

  it('should generate policy that collapses to * when all HTTP verbs are allowed', () => {
    const app = new cdk.App();
    const apiAuthStack = new ApiGatewayAuthStack(app, 'authStack', {
      envName: 'dev',
      stackName: 'authStack',
      description: 'authStackForAPI',
      apiGateways: [
        {
          resourceName: 'restApi',
          params: {
            paths: {
              '/items': {
                lambdaFunction: 'myFn1',
                name: '/items',
                permissions: {
                  settings: 'protected',
                  auth: [CrudOperation.CREATE, CrudOperation.DELETE, CrudOperation.READ, CrudOperation.UPDATE],
                },
              },
            },
          },
        },
      ],
    });

    const template = Template.fromStack(apiAuthStack);
    // Auth policy collapsed to * HTTP_VERB
    // Proxy auth policy
    const policyDocProxy = cloneDeep(policyDocTemplate);
    policyDocProxy['Fn::Join'][1].push('/*/items/*');
    template.hasResourceProperties('AWS::IAM::ManagedPolicy', generatePolicyDoc('authRoleName', policyDocProxy));

    const policyDoc = cloneDeep(policyDocTemplate);
    policyDoc['Fn::Join'][1].push('/*/items');
    template.hasResourceProperties('AWS::IAM::ManagedPolicy', generatePolicyDoc('authRoleName', policyDoc));
  });

  it('should not generate authPolicy when authRole rules are missing', () => {
    const app = new cdk.App();
    const apiAuthStack = new ApiGatewayAuthStack(app, 'authStack', {
      envName: 'dev',
      stackName: 'authStack',
      description: 'authStackForAPI',
      apiGateways: [
        {
          resourceName: 'restApi',
          params: {
            paths: {
              '/items': {
                lambdaFunction: 'myFn1',
                name: '/items',
                permissions: {
                  settings: 'protected',
                  guest: [CrudOperation.CREATE],
                },
              },
            },
          },
        },
      ],
    });
    const template = Template.fromStack(apiAuthStack);
    template.hasResourceProperties(
      'AWS::IAM::ManagedPolicy',
      Match.not({
        Roles: [
          {
            Ref: 'authRoleName',
          },
        ],
      }),
    );
  });

  it('should not generate unAuthPolicy when unAuthRole rules are missing', () => {
    const app = new cdk.App();
    const apiAuthStack = new ApiGatewayAuthStack(app, 'authStack', {
      envName: 'dev',
      stackName: 'authStack',
      description: 'authStackForAPI',
      apiGateways: [
        {
          resourceName: 'restApi',
          params: {
            paths: {
              '/items': {
                lambdaFunction: 'myFn1',
                name: '/items',
                permissions: {
                  settings: 'protected',
                  auth: [CrudOperation.CREATE],
                },
              },
            },
          },
        },
      ],
    });
    const template = Template.fromStack(apiAuthStack);
    template.hasResourceProperties(
      'AWS::IAM::ManagedPolicy',
      Match.not({
        Roles: [
          {
            Ref: 'unauthRoleName',
          },
        ],
      }),
    );
  });

  it('should generate policy that allows only allowed HTTP verb', () => {
    const app = new cdk.App();
    const apiAuthStack = new ApiGatewayAuthStack(app, 'authStack', {
      envName: 'dev',
      stackName: 'authStack',
      description: 'authStackForAPI',
      apiGateways: [
        {
          resourceName: 'restApi',
          params: {
            paths: {
              '/items': {
                lambdaFunction: 'myFn1',
                name: '/items',
                permissions: {
                  settings: 'protected',
                  guest: [CrudOperation.CREATE],
                },
              },
            },
          },
        },
      ],
    });
    const template = Template.fromStack(apiAuthStack);

    // UnAuth policy CREATE crud option should create POST
    const unAuthPolicyProxy = cloneDeep(policyDocTemplate);
    unAuthPolicyProxy['Fn::Join'][1].push('/POST/items/*');

    template.hasResourceProperties('AWS::IAM::ManagedPolicy', generatePolicyDoc('unauthRoleName', unAuthPolicyProxy));

    const unAuthPolicy = cloneDeep(policyDocTemplate);
    unAuthPolicy['Fn::Join'][1].push('/POST/items');
    template.hasResourceProperties('AWS::IAM::ManagedPolicy', generatePolicyDoc('unauthRoleName', unAuthPolicy));

    // Check for other HTTP verbs absence
    const unAuthGet = cloneDeep(policyDocTemplate);
    unAuthGet['Fn::Join'][1].push('/GET/items');
    template.hasResourceProperties('AWS::IAM::ManagedPolicy', generatePolicyDoc('unauthRoleName', unAuthGet, 'Absence'));

    const unAuthGetProxy = cloneDeep(policyDocTemplate);
    unAuthGetProxy['Fn::Join'][1].push('/GET/items/*');
    template.hasResourceProperties('AWS::IAM::ManagedPolicy', generatePolicyDoc('unauthRoleName', unAuthGetProxy, 'Absence'));

    const unAuthPut = cloneDeep(policyDocTemplate);
    unAuthGet['Fn::Join'][1].push('/PUT/items');
    template.hasResourceProperties('AWS::IAM::ManagedPolicy', generatePolicyDoc('unauthRoleName', unAuthPut, 'Absence'));

    const unAuthPutProxy = cloneDeep(policyDocTemplate);
    unAuthPutProxy['Fn::Join'][1].push('/PUT/items/*');
    template.hasResourceProperties('AWS::IAM::ManagedPolicy', generatePolicyDoc('unauthRoleName', unAuthPutProxy, 'Absence'));
  });

  // The test needs CDK to be updated to 1.140.0 so it can use capture.next. Skipping it for now
  it('should slice managed role when the size of the policy document exceeds 6K', () => {
    // create 100 paths
    const paths = new Array(100).fill(1).reduce((acc, __, idx) => ({
      ...acc,
      [`/items${idx}`]: {
        lambdaFunction: 'myFn1',
        name: `/items${idx}`,
        permissions: {
          settings: 'protected',
          auth: [CrudOperation.CREATE, CrudOperation.UPDATE, CrudOperation.DELETE, CrudOperation.READ],
          guest: [CrudOperation.READ],
        },
      },
    }), {});

    const app = new cdk.App();

    const apiAuthStack = new ApiGatewayAuthStack(app, 'authStack', {
      envName: 'dev',
      stackName: 'authStack',
      description: 'authStackForAPI',
      apiGateways: [
        {
          resourceName: 'restApi',
          params: {
            paths,
          },
        },
      ],
    });

    const template = Template.fromStack(apiAuthStack);
    template.resourceCountIs('AWS::IAM::ManagedPolicy', 6);

    const policyStatements = new Capture();
    template.hasResourceProperties('AWS::IAM::ManagedPolicy', {
      PolicyDocument: Match.objectLike({
        Version: '2012-10-17',
        Statement: Match.arrayWith([
          {
            Effect: 'Allow',
            Action: ['execute-api:Invoke'],
            Resource: policyStatements,
          },
        ]),
      }),
      Roles: Match.arrayEquals([Match.anyValue()]),
    });

    // Skipping this test for now as the CDK version needs to be updated to use `policyStatements.next()`
    // do {
    //   const policy = JSON.stringify(policyStatements.asArray());
    //   expect(policy.length).toBeLessThanOrEqual(6_144);
    // } while (policyStatements.next());
  });
});
