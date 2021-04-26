'use strict';
import { anything, countResources, expect as cdkExpect, haveResource } from '@aws-cdk/assert';
import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import { parse } from 'graphql';
import { FunctionTransformer } from '..';

test('it generates the expected resources', () => {
  const validSchema = `
    type Query {
        echo(msg: String): String @function(name: "echofunction-\${env}")
    }
    `;

  const transformer = new GraphQLTransform({
    transformers: [new FunctionTransformer()],
  });

  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.stacks).toBeDefined();
  parse(out.schema);
  const stack = out.stacks.FunctionDirectiveStack;
  expect(stack).toBeDefined();
  cdkExpect(stack).to(countResources('AWS::IAM::Role', 1));
  cdkExpect(stack).to(countResources('AWS::IAM::Policy', 1));
  cdkExpect(stack).to(countResources('AWS::AppSync::DataSource', 1));
  cdkExpect(stack).to(countResources('AWS::AppSync::FunctionConfiguration', 1));
  cdkExpect(stack).to(countResources('AWS::AppSync::Resolver', 1));
  cdkExpect(stack).to(
    haveResource('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'appsync.amazonaws.com',
            },
          },
        ],
        Version: '2012-10-17',
      },
    }),
  );
  cdkExpect(stack).to(
    haveResource('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: [
          {
            Action: 'lambda:InvokeFunction',
            Effect: 'Allow',
            Resource: {
              'Fn::If': [
                'HasEnvironmentParameter',
                {
                  'Fn::Sub': ['arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:echofunction-${env}', { env: { Ref: anything() } }],
                },
                { 'Fn::Sub': 'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:echofunction' },
              ],
            },
          },
        ],
        Version: '2012-10-17',
      },
      PolicyName: anything(),
      Roles: [{ Ref: anything() }],
    }),
  );
  cdkExpect(stack).to(
    haveResource('AWS::AppSync::DataSource', {
      ApiId: { Ref: anything() },
      Name: 'EchofunctionLambdaDataSource',
      Type: 'AWS_LAMBDA',
      LambdaConfig: {
        LambdaFunctionArn: {
          'Fn::If': [
            'HasEnvironmentParameter',
            {
              'Fn::Sub': ['arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:echofunction-${env}', { env: { Ref: anything() } }],
            },
            { 'Fn::Sub': 'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:echofunction' },
          ],
        },
      },
      ServiceRoleArn: {
        'Fn::GetAtt': ['EchofunctionLambdaDataSourceServiceRole3BE2FA57', 'Arn'],
      },
    }),
  );
  cdkExpect(stack).to(
    haveResource('AWS::AppSync::FunctionConfiguration', {
      ApiId: { Ref: anything() },
      DataSourceName: { 'Fn::GetAtt': [anything(), 'Name'] },
      FunctionVersion: '2018-05-29',
      Name: 'InvokeEchofunctionLambdaDataSource',
      RequestMappingTemplateS3Location: {
        'Fn::Join': [
          '',
          ['s3://', { Ref: anything() }, '/', { Ref: anything() }, '/pipelineFunctions/InvokeEchofunctionLambdaDataSource.req.vtl'],
        ],
      },
      ResponseMappingTemplateS3Location: {
        'Fn::Join': [
          '',
          ['s3://', { Ref: anything() }, '/', { Ref: anything() }, '/pipelineFunctions/InvokeEchofunctionLambdaDataSource.res.vtl'],
        ],
      },
    }),
  );
  cdkExpect(stack).to(
    haveResource('AWS::AppSync::Resolver', {
      ApiId: { Ref: anything() },
      FieldName: 'echo',
      TypeName: 'Query',
      Kind: 'PIPELINE',
      PipelineConfig: {
        Functions: [{ 'Fn::GetAtt': [anything(), 'FunctionId'] }],
      },
      RequestMappingTemplateS3Location: {
        'Fn::Join': ['', ['s3://', { Ref: anything() }, '/', { Ref: anything() }, '/pipelineFunctions/Query.echo.req.vtl']],
      },
      ResponseMappingTemplateS3Location: {
        'Fn::Join': ['', ['s3://', { Ref: anything() }, '/', { Ref: anything() }, '/pipelineFunctions/Query.echo.res.vtl']],
      },
    }),
  );
  expect(out.pipelineFunctions).toMatchSnapshot();
});

test('two @function directives for the same lambda should produce a single datasource, single role and two resolvers', () => {
  const validSchema = `
    type Query {
        echo(msg: String): String @function(name: "echofunction-\${env}")
        magic(msg: String): String @function(name: "echofunction-\${env}")
    }
    `;

  const transformer = new GraphQLTransform({
    transformers: [new FunctionTransformer()],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  parse(out.schema);
  expect(out.stacks).toBeDefined();
  const stack = out.stacks.FunctionDirectiveStack;
  expect(stack).toBeDefined();
  cdkExpect(stack).to(countResources('AWS::IAM::Role', 1));
  cdkExpect(stack).to(countResources('AWS::IAM::Policy', 1));
  cdkExpect(stack).to(countResources('AWS::AppSync::DataSource', 1));
  cdkExpect(stack).to(countResources('AWS::AppSync::FunctionConfiguration', 1));
  cdkExpect(stack).to(countResources('AWS::AppSync::Resolver', 2));
});

test('two @function directives for the same field should be valid', () => {
  const validSchema = `
    type Query {
        echo(msg: String): String @function(name: "echofunction-\${env}") @function(name: "otherfunction")
    }
    `;

  const transformer = new GraphQLTransform({
    transformers: [new FunctionTransformer()],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  parse(out.schema);
  expect(out.stacks).toBeDefined();
  const stack = out.stacks.FunctionDirectiveStack;
  expect(stack).toBeDefined();
  cdkExpect(stack).to(countResources('AWS::AppSync::Resolver', 1));
  cdkExpect(stack).to(
    haveResource('AWS::AppSync::Resolver', {
      ApiId: { Ref: anything() },
      FieldName: 'echo',
      TypeName: 'Query',
      Kind: 'PIPELINE',
      PipelineConfig: {
        Functions: [{ 'Fn::GetAtt': [anything(), 'FunctionId'] }, { 'Fn::GetAtt': [anything(), 'FunctionId'] }],
      },
    }),
  );
});

test('@function directive applied to Object should throw Error', () => {
  const invalidSchema = `
    type Query @function(name: "echofunction-\${env}") {
        echo(msg: String): String @function(name: "echofunction-\${env}")
    }
    `;

  const transformer = new GraphQLTransform({
    transformers: [new FunctionTransformer()],
  });
  expect(() => {
    transformer.transform(invalidSchema);
  }).toThrow('Directive "function" may not be used on OBJECT.');
});
