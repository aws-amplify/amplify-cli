import { pathManager, readCFNTemplate } from '@aws-amplify/amplify-cli-core';
import { Template } from 'cloudform-types';
import * as fs from 'fs-extra';
import * as path from 'path';
import { preserveGraphQLSchemaLogicalId } from '../../pre-push-cfn-processor/graphql-schema-logical-id-preserver';

jest.mock('@aws-amplify/amplify-cli-core');
jest.mock('fs-extra');

const readCFNTemplate_mock = readCFNTemplate as jest.MockedFunction<typeof readCFNTemplate>;
const pathManager_mock = pathManager as jest.Mocked<typeof pathManager>;
const existsSync_mock = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;

const CURRENT_CLOUD_BACKEND = '/project/amplify/#current-cloud-backend';
const API_NAME = 'myapi';
const PUSH_TEMPLATE_PATH = path.join('/project/amplify/backend/api', API_NAME, 'build', 'cloudformation-template.json');
const HASHED_SCHEMA_ID = 'GraphQLAPITransformerSchema1A2B3C4D';

const v2SynthesizedTemplate = (): Template =>
  ({
    Resources: {
      GraphQLAPI: {
        Type: 'AWS::AppSync::GraphQLApi',
        Properties: { Name: 'myapi' },
      },
      [HASHED_SCHEMA_ID]: {
        Type: 'AWS::AppSync::GraphQLSchema',
        Properties: {
          ApiId: { 'Fn::GetAtt': ['GraphQLAPI', 'ApiId'] },
          DefinitionS3Location: 's3://bucket/schema.graphql',
        },
      },
      GraphQLAPIDefaultApiKey: {
        Type: 'AWS::AppSync::ApiKey',
        DependsOn: [HASHED_SCHEMA_ID],
        Properties: { ApiId: { 'Fn::GetAtt': ['GraphQLAPI', 'ApiId'] } },
      },
      TodoResolver: {
        Type: 'AWS::AppSync::Resolver',
        DependsOn: ['GraphQLAPI', HASHED_SCHEMA_ID],
        Properties: {
          ApiId: { Ref: 'GraphQLAPI' },
          RequestMappingTemplate: {
            'Fn::Sub': ['## resolver for ${SchemaRef}', { SchemaRef: { Ref: HASHED_SCHEMA_ID } }],
          },
          SchemaArn: { 'Fn::GetAtt': [HASHED_SCHEMA_ID, 'Arn'] },
          SchemaArnString: { 'Fn::GetAtt': `${HASHED_SCHEMA_ID}.Arn` },
          Description: { 'Fn::Sub': 'depends on ${' + HASHED_SCHEMA_ID + '}' },
        },
      },
    },
    Outputs: {
      SchemaRef: { Value: { Ref: HASHED_SCHEMA_ID } },
      SchemaArn: { Value: { 'Fn::GetAtt': [HASHED_SCHEMA_ID, 'Arn'] } },
    },
  } as unknown as Template);

const v1DeployedTemplate = (): Template =>
  ({
    Resources: {
      GraphQLAPI: { Type: 'AWS::AppSync::GraphQLApi', Properties: {} },
      GraphQLSchema: {
        Type: 'AWS::AppSync::GraphQLSchema',
        Properties: { ApiId: { 'Fn::GetAtt': ['GraphQLAPI', 'ApiId'] } },
      },
    },
  } as unknown as Template);

beforeEach(() => {
  jest.clearAllMocks();
  pathManager_mock.getCurrentCloudBackendDirPath.mockReturnValue(CURRENT_CLOUD_BACKEND);
});

describe('preserveGraphQLSchemaLogicalId', () => {
  it('renames the hashed schema logical id to GraphQLSchema and rewrites every reference on a v1 to v2 migration', () => {
    existsSync_mock.mockReturnValue(true);
    readCFNTemplate_mock.mockReturnValue({ templateFormat: 'json' as any, cfnTemplate: v1DeployedTemplate() });

    const template = v2SynthesizedTemplate();
    preserveGraphQLSchemaLogicalId(template, PUSH_TEMPLATE_PATH);

    expect(template.Resources[HASHED_SCHEMA_ID]).toBeUndefined();
    expect(template.Resources.GraphQLSchema?.Type).toEqual('AWS::AppSync::GraphQLSchema');

    expect(template.Resources.GraphQLAPIDefaultApiKey.DependsOn).toEqual(['GraphQLSchema']);
    expect(template.Resources.TodoResolver.DependsOn).toEqual(['GraphQLAPI', 'GraphQLSchema']);

    const resolverProps = template.Resources.TodoResolver.Properties;
    expect(resolverProps.RequestMappingTemplate['Fn::Sub'][1]).toEqual({ SchemaRef: { Ref: 'GraphQLSchema' } });
    expect(resolverProps.SchemaArn['Fn::GetAtt']).toEqual(['GraphQLSchema', 'Arn']);
    expect(resolverProps.SchemaArnString['Fn::GetAtt']).toEqual('GraphQLSchema.Arn');
    expect(resolverProps.Description['Fn::Sub']).toEqual('depends on ${GraphQLSchema}');

    expect(template.Outputs.SchemaRef.Value).toEqual({ Ref: 'GraphQLSchema' });
    expect(template.Outputs.SchemaArn.Value).toEqual({ 'Fn::GetAtt': ['GraphQLSchema', 'Arn'] });

    // untouched reference should stay intact
    expect(template.Resources.TodoResolver.Properties.ApiId).toEqual({ Ref: 'GraphQLAPI' });
  });

  it('leaves a born-v2 template unchanged when the deployed template already uses the hashed id', () => {
    existsSync_mock.mockReturnValue(true);
    const deployedV2 = v2SynthesizedTemplate();
    readCFNTemplate_mock.mockReturnValue({ templateFormat: 'json' as any, cfnTemplate: deployedV2 });

    const template = v2SynthesizedTemplate();
    const before = JSON.stringify(template);
    preserveGraphQLSchemaLogicalId(template, PUSH_TEMPLATE_PATH);

    expect(JSON.stringify(template)).toEqual(before);
  });

  it('leaves a brand-new API template unchanged when there is no prior deployed template', () => {
    existsSync_mock.mockReturnValue(false);

    const template = v2SynthesizedTemplate();
    const before = JSON.stringify(template);
    preserveGraphQLSchemaLogicalId(template, PUSH_TEMPLATE_PATH);

    expect(JSON.stringify(template)).toEqual(before);
    expect(readCFNTemplate_mock).not.toHaveBeenCalled();
  });

  it('is idempotent when the template already uses the GraphQLSchema logical id', () => {
    existsSync_mock.mockReturnValue(true);
    readCFNTemplate_mock.mockReturnValue({ templateFormat: 'json' as any, cfnTemplate: v1DeployedTemplate() });

    const template = v1DeployedTemplate();
    const before = JSON.stringify(template);
    preserveGraphQLSchemaLogicalId(template, PUSH_TEMPLATE_PATH);

    expect(JSON.stringify(template)).toEqual(before);
  });

  it('does nothing for non-API-root templates such as nested stacks', () => {
    existsSync_mock.mockReturnValue(true);
    readCFNTemplate_mock.mockReturnValue({ templateFormat: 'json' as any, cfnTemplate: v1DeployedTemplate() });

    const nestedPath = path.join('/project/amplify/backend/api', API_NAME, 'build', 'stacks', 'Todo.json');
    const template = v2SynthesizedTemplate();
    const before = JSON.stringify(template);
    preserveGraphQLSchemaLogicalId(template, nestedPath);

    expect(JSON.stringify(template)).toEqual(before);
    expect(readCFNTemplate_mock).not.toHaveBeenCalled();
  });
});
