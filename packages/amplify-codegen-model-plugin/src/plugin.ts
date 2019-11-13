import { PluginFunction, Types } from '@graphql-codegen/plugin-helpers';
import { GraphQLSchema, parse, visit } from 'graphql';
import { printSchemaWithDirectives } from 'graphql-toolkit';
import { AppSyncSwiftVisitor } from './visitors/appsync-swift-visitor';
import { RawAppSyncLocalConfig } from './visitors/appsync-visitor';
import { AppSyncJSONVisitor } from './visitors/appsync-json-metadata-visitor';
import { AppSyncJavaVisitor } from './visitors/appsync-java-visitor';
import { AppSyncLocalTypeScriptVisitor } from './visitors/appsync-typescript-visitor';
import { AppSyncLocalJavascriptVisitor } from './visitors/appsync-javascript-visitor';
export const plugin: PluginFunction<RawAppSyncLocalConfig> = (
  schema: GraphQLSchema,
  rawDocuments: Types.DocumentFile[],
  config: RawAppSyncLocalConfig
) => {
  let visitor;
  switch (config.target) {
    case 'swift':
    case 'ios':
      visitor = new AppSyncSwiftVisitor(schema, config, {
        selectedType: config.selectedType,
        metadata: config.metadata,
      });
      break;
    case 'java':
    case 'android':
      visitor = new AppSyncJavaVisitor(schema, config, {
        selectedType: config.selectedType,
      });
      break;
    case 'metadata':
      visitor = new AppSyncJSONVisitor(schema, config, {});
      break;
    case 'typescript':
      visitor = new AppSyncLocalTypeScriptVisitor(schema, config, {});
      break;
    case 'javascript':
      visitor = new AppSyncLocalJavascriptVisitor(schema, config, {});
      break;
    default:
      return '';
  }
  if (schema) {
    const schemaStr = printSchemaWithDirectives(schema);
    const node = parse(schemaStr);
    visit(node, {
      leave: visitor,
    });
    return visitor.generate();
  }
  return '';
};
