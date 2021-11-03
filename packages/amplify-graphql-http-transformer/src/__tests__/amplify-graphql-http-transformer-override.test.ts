'use strict';
import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import { parse } from 'graphql';
import { HttpTransformer } from '..';
import path from 'path';
test('it generates the overrided resources', () => {
  const validSchema = `
      type Comment {
        id: ID!
        content: String @http(method: POST, url: "http://www.api.com/ping")
        content2: String @http(method: PUT, url: "http://www.api.com/ping")
        more: String @http(url: "http://api.com/ping/me/2")
        evenMore: String @http(method: DELETE, url: "http://www.google.com/query/id")
        stillMore: String @http(method: PATCH, url: "https://www.api.com/ping/id")
      }
      `;
  const transformer = new GraphQLTransform({
    transformers: [new HttpTransformer()],
    overrideConfig: {
      overrideDir: path.join(__dirname, 'overrides'),
      overrideFlag: true,
      resourceName: 'myResource',
    },
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.stacks).toBeDefined();
  parse(out.schema);
  const stack = out.stacks.HttpDirectiveStack;
  expect(stack).toMatchSnapshot();
  // cdkExpect(stack).to(
  //   haveResource('AWS::IAM::Role', {
  //     AssumeRolePolicyDocument: {
  //       Statement: [
  //         {
  //           Action: 'sts:AssumeRole',
  //           Effect: 'Allow',
  //           Principal: {
  //             Service: 'appsync.amazonaws.com',
  //           },
  //         },
  //       ],
  //       Version: '2012-10-17',
  //     },
  //   }),
  // );
  // cdkExpect(stack).to(countResources('AWS::AppSync::DataSource', 4));
  // cdkExpect(stack).to(
  //   haveResource('AWS::AppSync::DataSource', {
  //     ApiId: { Ref: anything() },
  //     Name: 'httpwwwapicomDataSource',
  //     Type: 'HTTP',
  //     HttpConfig: {
  //       Endpoint: 'http://www.api.com',
  //     },
  //     ServiceRoleArn: {
  //       'Fn::GetAtt': [anything(), 'Arn'],
  //     },
  //   }),
  // );
  // cdkExpect(stack).to(
  //   haveResource('AWS::AppSync::DataSource', {
  //     ApiId: { Ref: anything() },
  //     Name: 'httpapicomDataSource',
  //     Type: 'HTTP',
  //     HttpConfig: {
  //       Endpoint: 'http://api.com',
  //     },
  //     ServiceRoleArn: {
  //       'Fn::GetAtt': [anything(), 'Arn'],
  //     },
  //   }),
  // );
  // cdkExpect(stack).to(
  //   haveResource('AWS::AppSync::DataSource', {
  //     ApiId: { Ref: anything() },
  //     Name: 'httpwwwgooglecomDataSource',
  //     Type: 'HTTP',
  //     HttpConfig: {
  //       Endpoint: 'http://www.google.com',
  //     },
  //     ServiceRoleArn: {
  //       'Fn::GetAtt': [anything(), 'Arn'],
  //     },
  //   }),
  // );
  // cdkExpect(stack).to(
  //   haveResource('AWS::AppSync::DataSource', {
  //     ApiId: { Ref: anything() },
  //     Name: 'httpswwwapicomDataSource',
  //     Type: 'HTTP',
  //     HttpConfig: {
  //       Endpoint: 'https://www.api.com',
  //     },
  //     ServiceRoleArn: {
  //       'Fn::GetAtt': [anything(), 'Arn'],
  //     },
  //   }),
  // );
  // cdkExpect(stack).to(countResources('AWS::AppSync::Resolver', 5));
  // expect(stack.Resources!.commentContentResolver).toBeTruthy();
  // cdkExpect(stack).to(
  //   haveResource('AWS::AppSync::Resolver', {
  //     ApiId: { Ref: anything() },
  //     FieldName: 'content',
  //     TypeName: 'Comment',
  //     DataSourceName: {
  //       'Fn::GetAtt': [anything(), 'Name'],
  //     },
  //     Kind: 'UNIT',
  //     RequestMappingTemplateS3Location: {
  //       'Fn::Join': ['', ['s3://', { Ref: anything() }, '/', { Ref: anything() }, '/pipelineFunctions/Comment.content.req.vtl']],
  //     },
  //     ResponseMappingTemplateS3Location: {
  //       'Fn::Join': ['', ['s3://', { Ref: anything() }, '/', { Ref: anything() }, '/pipelineFunctions/Comment.content.res.vtl']],
  //     },
  //   }),
  // );
  // expect(stack.Resources!.commentContent2Resolver).toBeTruthy();
  // cdkExpect(stack).to(
  //   haveResource('AWS::AppSync::Resolver', {
  //     ApiId: { Ref: anything() },
  //     FieldName: 'content2',
  //     TypeName: 'Comment',
  //     DataSourceName: {
  //       'Fn::GetAtt': [anything(), 'Name'],
  //     },
  //     Kind: 'UNIT',
  //     RequestMappingTemplateS3Location: {
  //       'Fn::Join': ['', ['s3://', { Ref: anything() }, '/', { Ref: anything() }, '/pipelineFunctions/Comment.content2.req.vtl']],
  //     },
  //     ResponseMappingTemplateS3Location: {
  //       'Fn::Join': ['', ['s3://', { Ref: anything() }, '/', { Ref: anything() }, '/pipelineFunctions/Comment.content2.res.vtl']],
  //     },
  //   }),
  // );
  // expect(stack.Resources!.commentMoreResolver).toBeTruthy();
  // cdkExpect(stack).to(
  //   haveResource('AWS::AppSync::Resolver', {
  //     ApiId: { Ref: anything() },
  //     FieldName: 'more',
  //     TypeName: 'Comment',
  //     DataSourceName: {
  //       'Fn::GetAtt': [anything(), 'Name'],
  //     },
  //     Kind: 'UNIT',
  //     RequestMappingTemplateS3Location: {
  //       'Fn::Join': ['', ['s3://', { Ref: anything() }, '/', { Ref: anything() }, '/pipelineFunctions/Comment.more.req.vtl']],
  //     },
  //     ResponseMappingTemplateS3Location: {
  //       'Fn::Join': ['', ['s3://', { Ref: anything() }, '/', { Ref: anything() }, '/pipelineFunctions/Comment.more.res.vtl']],
  //     },
  //   }),
  // );
  // expect(stack.Resources!.commentEvenMoreResolver).toBeTruthy();
  // cdkExpect(stack).to(
  //   haveResource('AWS::AppSync::Resolver', {
  //     ApiId: { Ref: anything() },
  //     FieldName: 'evenMore',
  //     TypeName: 'Comment',
  //     DataSourceName: {
  //       'Fn::GetAtt': [anything(), 'Name'],
  //     },
  //     Kind: 'UNIT',
  //     RequestMappingTemplateS3Location: {
  //       'Fn::Join': ['', ['s3://', { Ref: anything() }, '/', { Ref: anything() }, '/pipelineFunctions/Comment.evenMore.req.vtl']],
  //     },
  //     ResponseMappingTemplateS3Location: {
  //       'Fn::Join': ['', ['s3://', { Ref: anything() }, '/', { Ref: anything() }, '/pipelineFunctions/Comment.evenMore.res.vtl']],
  //     },
  //   }),
  // );
  // expect(stack.Resources!.commentStillMoreResolver).toBeTruthy();
  // cdkExpect(stack).to(
  //   haveResource('AWS::AppSync::Resolver', {
  //     ApiId: { Ref: anything() },
  //     FieldName: 'stillMore',
  //     TypeName: 'Comment',
  //     DataSourceName: {
  //       'Fn::GetAtt': [anything(), 'Name'],
  //     },
  //     Kind: 'UNIT',
  //     RequestMappingTemplateS3Location: {
  //       'Fn::Join': ['', ['s3://', { Ref: anything() }, '/', { Ref: anything() }, '/pipelineFunctions/Comment.stillMore.req.vtl']],
  //     },
  //     ResponseMappingTemplateS3Location: {
  //       'Fn::Join': ['', ['s3://', { Ref: anything() }, '/', { Ref: anything() }, '/pipelineFunctions/Comment.stillMore.res.vtl']],
  //     },
  //   }),
  // );
});
