'use strict';
import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import { anything, countResources, expect as cdkExpect, haveResource } from '@aws-cdk/assert';
import { parse } from 'graphql';
import { HttpTransformer } from '..';

test('generates expected VTL', () => {
  const validSchema = `
    type Comment {
      id: ID!
      content: String @http(url: "https://www.api.com/ping", headers: [{key: "X-Header", value: "X-Header-Value"}])
      contentDelete: String @http(method: DELETE, url: "https://www.api.com/ping", headers: [{key: "X-Header", value: "X-Header-ValueDelete"}])
      contentPatch: String @http(method: PATCH, url: "https://www.api.com/ping", headers: [{key: "X-Header", value: "X-Header-ValuePatch"}])
      contentPost: String @http(method: POST, url: "https://www.api.com/ping", headers: [{key: "X-Header", value: "X-Header-ValuePost"}])
      complexPut(
        id: Int!,
        title: String!,
        body: String,
        userId: Int!
      ): String @http(method: PUT, url: "https://jsonplaceholder.typicode.com/posts/:title/:id/\${ctx.source.id}", headers: [{key: "X-Header", value: "X-Header-ValuePut"}])
    }
    `;
  const transformer = new GraphQLTransform({
    transformers: [new HttpTransformer()],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.stacks).toBeDefined();
  expect(out.resolvers).toMatchSnapshot();
  expect(out.pipelineFunctions).toMatchSnapshot();
  parse(out.schema);
});

test('it generates the expected resources', () => {
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
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.stacks).toBeDefined();
  parse(out.schema);
  const stack = out.stacks.HttpStack;
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
  cdkExpect(stack).to(countResources('AWS::AppSync::DataSource', 4));
  cdkExpect(stack).to(
    haveResource('AWS::AppSync::DataSource', {
      ApiId: { Ref: anything() },
      Name: 'httpwwwapicomDataSource',
      Type: 'HTTP',
      HttpConfig: {
        Endpoint: 'http://www.api.com',
      },
      ServiceRoleArn: {
        'Fn::GetAtt': [anything(), 'Arn'],
      },
    }),
  );
  cdkExpect(stack).to(
    haveResource('AWS::AppSync::DataSource', {
      ApiId: { Ref: anything() },
      Name: 'httpapicomDataSource',
      Type: 'HTTP',
      HttpConfig: {
        Endpoint: 'http://api.com',
      },
      ServiceRoleArn: {
        'Fn::GetAtt': [anything(), 'Arn'],
      },
    }),
  );
  cdkExpect(stack).to(
    haveResource('AWS::AppSync::DataSource', {
      ApiId: { Ref: anything() },
      Name: 'httpwwwgooglecomDataSource',
      Type: 'HTTP',
      HttpConfig: {
        Endpoint: 'http://www.google.com',
      },
      ServiceRoleArn: {
        'Fn::GetAtt': [anything(), 'Arn'],
      },
    }),
  );
  cdkExpect(stack).to(
    haveResource('AWS::AppSync::DataSource', {
      ApiId: { Ref: anything() },
      Name: 'httpswwwapicomDataSource',
      Type: 'HTTP',
      HttpConfig: {
        Endpoint: 'https://www.api.com',
      },
      ServiceRoleArn: {
        'Fn::GetAtt': [anything(), 'Arn'],
      },
    }),
  );
  cdkExpect(stack).to(countResources('AWS::AppSync::Resolver', 5));
  cdkExpect(stack).to(countResources('AWS::AppSync::FunctionConfiguration', 5));
  expect(stack.Resources!.CommentcontentResolver).toBeTruthy();
  cdkExpect(stack).to(
    haveResource('AWS::AppSync::Resolver', {
      ApiId: { Ref: anything() },
      FieldName: 'content',
      TypeName: 'Comment',
      Kind: 'PIPELINE',
    }),
  );
  expect(stack.Resources!.Commentcontent2Resolver).toBeTruthy();
  cdkExpect(stack).to(
    haveResource('AWS::AppSync::Resolver', {
      ApiId: { Ref: anything() },
      FieldName: 'content2',
      TypeName: 'Comment',
      Kind: 'PIPELINE',
    }),
  );
  expect(stack.Resources!.CommentmoreResolver).toBeTruthy();
  cdkExpect(stack).to(
    haveResource('AWS::AppSync::Resolver', {
      ApiId: { Ref: anything() },
      FieldName: 'more',
      TypeName: 'Comment',
      Kind: 'PIPELINE',
    }),
  );
  expect(stack.Resources!.CommentevenMoreResolver).toBeTruthy();
  cdkExpect(stack).to(
    haveResource('AWS::AppSync::Resolver', {
      ApiId: { Ref: anything() },
      FieldName: 'evenMore',
      TypeName: 'Comment',
      Kind: 'PIPELINE',
    }),
  );
  expect(stack.Resources!.CommentstillMoreResolver).toBeTruthy();
  cdkExpect(stack).to(
    haveResource('AWS::AppSync::Resolver', {
      ApiId: { Ref: anything() },
      FieldName: 'stillMore',
      TypeName: 'Comment',
      Kind: 'PIPELINE',
    }),
  );
});

test('URL params happy path', () => {
  const validSchema = `
    type Comment {
      id: ID!
      title: String
      complex: CompObj @http(method: GET, url: "https://jsonplaceholder.typicode.com/posts/1")
      complexAgain: CompObj @http(url: "https://jsonplaceholder.typicode.com/posts/2")
      complexPost(
        id: Int,
        title: String,
        body: String,
        userId: Int
      ): CompObj @http(method: POST, url: "https://jsonplaceholder.typicode.com/posts")
      complexPut(
        id: Int!,
        title: String!,
        body: String,
        userId: Int!
      ): CompObj @http(method: PUT, url: "https://jsonplaceholder.typicode.com/posts/:title/:id")
      deleter: String @http(method: DELETE, url: "https://jsonplaceholder.typicode.com/posts/3")
      complexGet(
        id: Int!
      ): CompObj @http(url: "https://jsonplaceholder.typicode.com/posts/:id")
      complexGet2 (
        id: Int!,
        title: String!,
        userId: Int!
      ): CompObj @http(url: "https://jsonplaceholder.typicode.com/posts/:title/:id")
    }
    type CompObj {
      userId: Int
      id: Int
      title: String
      body: String
    }
    `;
  const transformer = new GraphQLTransform({
    transformers: [new HttpTransformer()],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.stacks).toBeDefined();
  parse(out.schema);
  const stack = out.stacks.HttpStack;
  cdkExpect(stack).to(countResources('AWS::AppSync::DataSource', 1));
  cdkExpect(stack).to(countResources('AWS::AppSync::Resolver', 7));
  expect(stack.Resources!.CommentcomplexResolver).toBeTruthy();
  expect(stack.Resources!.CommentcomplexAgainResolver).toBeTruthy();
  expect(stack.Resources!.CommentcomplexPostResolver).toBeTruthy();
  expect(stack.Resources!.CommentcomplexPutResolver).toBeTruthy();
  expect(stack.Resources!.CommentdeleterResolver).toBeTruthy();
  expect(stack.Resources!.CommentcomplexGetResolver).toBeTruthy();
  expect(stack.Resources!.CommentcomplexGet2Resolver).toBeTruthy();
});

test('it throws an error when missing protocol in URL argument', () => {
  const validSchema = `
    type Comment {
      id: ID!
      content: String @http(method: POST, url: "www.api.com/ping")
    }
    `;
  const transformer = new GraphQLTransform({
    transformers: [new HttpTransformer()],
  });

  expect(() => {
    transformer.transform(validSchema);
  }).toThrow('@http directive at location 56 requires a url parameter that begins with http:// or https://.');
});

test('env on the URI path', () => {
  const validSchema = `
    type Comment {
      id: ID!
      content: String @http(method: POST, url: "http://www.api.com/ping\${env}")
    }
  `;
  const transformer = new GraphQLTransform({
    transformers: [new HttpTransformer()],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.stacks).toBeDefined();
  parse(out.schema);
  const stack = out.stacks.HttpStack;
  const functionId = stack.Resources!.CommentcontentResolver.Properties.PipelineConfig.Functions[0]['Fn::GetAtt'][0];
  const reqTemplate = stack.Resources![functionId].Properties.RequestMappingTemplate;
  expect(reqTemplate['Fn::Sub']).toBeTruthy();
  expect(reqTemplate['Fn::Sub'][0]).toMatch('"resourcePath": "/ping${env}"');
  expect(reqTemplate['Fn::Sub'][1].env.Ref).toBeTruthy();
});

test('env on the hostname', () => {
  const validSchema = `
    type Comment {
      id: ID!
      content: String @http(method: POST, url: "http://\${env}www.api.com/ping")
      content2: String @http(method: PUT, url: "http://\${env}www.api.com/ping")
      more: String @http(url: "http://\${env}api.com/ping/me/2")
      evenMore: String @http(method: DELETE, url: "http://\${env}www.google.com/query/id")
      stillMore: String @http(method: PATCH, url: "https://\${env}www.api.com/ping/id")
    }
  `;
  const transformer = new GraphQLTransform({
    transformers: [new HttpTransformer()],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.stacks).toBeDefined();
  parse(out.schema);
  const stack = out.stacks.HttpStack;
  cdkExpect(stack).to(countResources('AWS::AppSync::DataSource', 4));
  cdkExpect(stack).to(
    haveResource('AWS::AppSync::DataSource', {
      Name: 'httpenvwwwapicomDataSource',
      Type: 'HTTP',
      HttpConfig: {
        Endpoint: {
          'Fn::Sub': [
            'http://${env}www.api.com',
            {
              env: {
                Ref: anything(),
              },
            },
          ],
        },
      },
    }),
  );
  cdkExpect(stack).to(
    haveResource('AWS::AppSync::DataSource', {
      Name: 'httpenvapicomDataSource',
      Type: 'HTTP',
      HttpConfig: {
        Endpoint: {
          'Fn::Sub': [
            'http://${env}api.com',
            {
              env: {
                Ref: anything(),
              },
            },
          ],
        },
      },
    }),
  );
  cdkExpect(stack).to(
    haveResource('AWS::AppSync::DataSource', {
      Name: 'httpenvwwwgooglecomDataSource',
      Type: 'HTTP',
      HttpConfig: {
        Endpoint: {
          'Fn::Sub': [
            'http://${env}www.google.com',
            {
              env: {
                Ref: anything(),
              },
            },
          ],
        },
      },
    }),
  );
  cdkExpect(stack).to(
    haveResource('AWS::AppSync::DataSource', {
      Name: 'httpsenvwwwapicomDataSource',
      Type: 'HTTP',
      HttpConfig: {
        Endpoint: {
          'Fn::Sub': [
            'https://${env}www.api.com',
            {
              env: {
                Ref: anything(),
              },
            },
          ],
        },
      },
    }),
  );
});

test('aws_region on the URI path', () => {
  const validSchema = `
    type Comment {
      id: ID!
      content: String @http(method: POST, url: "http://www.api.com/ping\${aws_region}")
    }
  `;
  const transformer = new GraphQLTransform({
    transformers: [new HttpTransformer()],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.stacks).toBeDefined();
  parse(out.schema);
  const stack = out.stacks.HttpStack;
  const functionId = stack.Resources!.CommentcontentResolver.Properties.PipelineConfig.Functions[0]['Fn::GetAtt'][0];
  const reqTemplate = stack.Resources![functionId].Properties.RequestMappingTemplate;
  expect(reqTemplate['Fn::Sub']).toBeTruthy();
  expect(reqTemplate['Fn::Sub'][0]).toMatch('"resourcePath": "/ping${aws_region}"');
  expect(reqTemplate['Fn::Sub'][1].aws_region.Ref).toBeTruthy();
});

test('aws_region on the hostname', () => {
  const validSchema = `
    type Comment {
      id: ID!
      content: String @http(method: POST, url: "http://\${aws_region}www.api.com/ping")
      content2: String @http(method: PUT, url: "http://\${aws_region}www.api.com/ping")
      more: String @http(url: "http://\${aws_region}api.com/ping/me/2")
      evenMore: String @http(method: DELETE, url: "http://\${aws_region}www.google.com/query/id")
      stillMore: String @http(method: PATCH, url: "https://\${aws_region}www.api.com/ping/id")
    }
  `;
  const transformer = new GraphQLTransform({
    transformers: [new HttpTransformer()],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.stacks).toBeDefined();
  parse(out.schema);
  const stack = out.stacks.HttpStack;
  cdkExpect(stack).to(countResources('AWS::AppSync::DataSource', 4));
  cdkExpect(stack).to(
    haveResource('AWS::AppSync::DataSource', {
      Name: 'httpaws_regionwwwapicomDataSource',
      Type: 'HTTP',
      HttpConfig: {
        Endpoint: {
          'Fn::Sub': [
            'http://${aws_region}www.api.com',
            {
              aws_region: {
                Ref: anything(),
              },
            },
          ],
        },
      },
    }),
  );
  cdkExpect(stack).to(
    haveResource('AWS::AppSync::DataSource', {
      Name: 'httpaws_regionapicomDataSource',
      Type: 'HTTP',
      HttpConfig: {
        Endpoint: {
          'Fn::Sub': [
            'http://${aws_region}api.com',
            {
              aws_region: {
                Ref: anything(),
              },
            },
          ],
        },
      },
    }),
  );
  cdkExpect(stack).to(
    haveResource('AWS::AppSync::DataSource', {
      Name: 'httpaws_regionwwwgooglecomDataSource',
      Type: 'HTTP',
      HttpConfig: {
        Endpoint: {
          'Fn::Sub': [
            'http://${aws_region}www.google.com',
            {
              aws_region: {
                Ref: anything(),
              },
            },
          ],
        },
      },
    }),
  );
  cdkExpect(stack).to(
    haveResource('AWS::AppSync::DataSource', {
      Name: 'httpsaws_regionwwwapicomDataSource',
      Type: 'HTTP',
      HttpConfig: {
        Endpoint: {
          'Fn::Sub': [
            'https://${aws_region}www.api.com',
            {
              aws_region: {
                Ref: anything(),
              },
            },
          ],
        },
      },
    }),
  );
});
