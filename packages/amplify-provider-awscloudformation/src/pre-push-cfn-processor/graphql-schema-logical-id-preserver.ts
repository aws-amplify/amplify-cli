import { pathManager, readCFNTemplate } from '@aws-amplify/amplify-cli-core';
import { Template } from 'cloudform-types';
import * as fs from 'fs-extra';
import * as path from 'path';

const APPSYNC_SCHEMA_TYPE = 'AWS::AppSync::GraphQLSchema';
const API_ROOT_TEMPLATE_FILE_NAME = 'cloudformation-template.json';

/**
 * The hard-coded logical ID used by the v1 GraphQL transformer for the AppSync schema resource.
 * The v2 (CDK) transformer instead emits a hashed logical ID (e.g. `GraphQLAPITransformerSchema<hash>`).
 */
export const V1_GRAPHQL_SCHEMA_LOGICAL_ID = 'GraphQLSchema';

/**
 * Preserves the v1 AppSync `GraphQLSchema` logical ID across a v1 to v2 GraphQL transformer migration.
 *
 * On a v1 to v2 migration the schema resource's logical ID changes from the hard-coded `GraphQLSchema`
 * to a CDK-hashed `GraphQLAPITransformerSchema<hash>`. Since the schema's physical ID (`<apiId>GraphQLSchema`)
 * is unique per API, CloudFormation attempts a create-before-delete on the rename and fails with
 * `<apiId>GraphQLSchema already exists in stack`, rolling back the deployment.
 *
 * When the previously-deployed API template still uses the v1 `GraphQLSchema` logical ID, this rewrites the
 * template being pushed so the schema resource keeps that logical ID (and updates every reference to it),
 * letting CloudFormation perform an in-place update instead. Mutates `template` in place.
 *
 * The rewrite is gated on an actual v1 to v2 migration and is a no-op for born-v2 APIs, brand-new APIs,
 * non-API templates, nested stack templates, and templates that already use the v1 logical ID.
 *
 * @param template the API root CloudFormation template about to be pushed
 * @param filePath the on-disk path of the template being processed, used to locate the API resource
 */
export const preserveGraphQLSchemaLogicalId = (template: Template, filePath: string): void => {
  if (path.basename(filePath) !== API_ROOT_TEMPLATE_FILE_NAME || !template?.Resources) {
    return;
  }

  const apiName = getApiResourceNameFromTemplatePath(filePath);
  if (!apiName) {
    return;
  }

  const schemaLogicalIds = Object.entries(template.Resources)
    .filter(([, resource]) => resource?.Type === APPSYNC_SCHEMA_TYPE)
    .map(([logicalId]) => logicalId);

  if (schemaLogicalIds.length !== 1) {
    return;
  }

  const currentSchemaLogicalId = schemaLogicalIds[0];

  if (currentSchemaLogicalId === V1_GRAPHQL_SCHEMA_LOGICAL_ID || template.Resources[V1_GRAPHQL_SCHEMA_LOGICAL_ID]) {
    return;
  }

  if (!deployedTemplateHasV1SchemaLogicalId(apiName)) {
    return;
  }

  renameLogicalId(template, currentSchemaLogicalId, V1_GRAPHQL_SCHEMA_LOGICAL_ID);
};

const getApiResourceNameFromTemplatePath = (filePath: string): string | undefined => {
  const segments = path.normalize(filePath).split(path.sep);
  const apiIndex = segments.indexOf('api');
  if (apiIndex === -1 || apiIndex + 1 >= segments.length) {
    return undefined;
  }
  return segments[apiIndex + 1];
};

const deployedTemplateHasV1SchemaLogicalId = (apiName: string): boolean => {
  const deployedTemplatePath = path.join(pathManager.getCurrentCloudBackendDirPath(), 'api', apiName, 'build', API_ROOT_TEMPLATE_FILE_NAME);

  if (!fs.existsSync(deployedTemplatePath)) {
    return false;
  }

  const { cfnTemplate } = readCFNTemplate(deployedTemplatePath);
  return cfnTemplate?.Resources?.[V1_GRAPHQL_SCHEMA_LOGICAL_ID]?.Type === APPSYNC_SCHEMA_TYPE;
};

const renameLogicalId = (template: Template, oldLogicalId: string, newLogicalId: string): void => {
  const resources = template.Resources as Record<string, unknown>;
  resources[newLogicalId] = resources[oldLogicalId];
  delete resources[oldLogicalId];
  rewriteReferences(template, oldLogicalId, newLogicalId);
};

const rewriteReferences = (node: unknown, oldLogicalId: string, newLogicalId: string): void => {
  if (Array.isArray(node)) {
    node.forEach((element) => rewriteReferences(element, oldLogicalId, newLogicalId));
    return;
  }

  if (!node || typeof node !== 'object') {
    return;
  }

  const record = node as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    const value = record[key];

    switch (key) {
      case 'Ref':
        if (value === oldLogicalId) {
          record[key] = newLogicalId;
        }
        break;
      case 'DependsOn':
        if (value === oldLogicalId) {
          record[key] = newLogicalId;
        } else if (Array.isArray(value)) {
          record[key] = value.map((entry) => (entry === oldLogicalId ? newLogicalId : entry));
        }
        break;
      case 'Fn::GetAtt':
        if (Array.isArray(value) && value[0] === oldLogicalId) {
          value[0] = newLogicalId;
        } else if (typeof value === 'string') {
          record[key] = replaceGetAttString(value, oldLogicalId, newLogicalId);
        }
        break;
      case 'Fn::Sub':
        if (typeof value === 'string') {
          record[key] = replaceSubString(value, oldLogicalId, newLogicalId);
        } else if (Array.isArray(value)) {
          if (typeof value[0] === 'string') {
            value[0] = replaceSubString(value[0], oldLogicalId, newLogicalId);
          }
          rewriteReferences(value[1], oldLogicalId, newLogicalId);
        }
        break;
      default:
        rewriteReferences(value, oldLogicalId, newLogicalId);
    }
  }
};

const replaceGetAttString = (value: string, oldLogicalId: string, newLogicalId: string): string => {
  const dotIndex = value.indexOf('.');
  if (dotIndex === -1) {
    return value === oldLogicalId ? newLogicalId : value;
  }
  return value.slice(0, dotIndex) === oldLogicalId ? `${newLogicalId}${value.slice(dotIndex)}` : value;
};

const replaceSubString = (value: string, oldLogicalId: string, newLogicalId: string): string => {
  const pattern = new RegExp(`\\$\\{${escapeRegExp(oldLogicalId)}(\\.[^}]*)?\\}`, 'g');
  return value.replace(pattern, (_match, attribute = '') => `\${${newLogicalId}${attribute}}`);
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
