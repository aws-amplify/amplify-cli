import { PluginFunction, Types } from '@graphql-codegen/plugin-helpers';
import { GraphQLSchema, parse, visit } from 'graphql';
import { printSchemaWithDirectives } from '@graphql-tools/utils';
import { AppSyncSwiftVisitor } from './visitors/appsync-swift-visitor';
import { RawAppSyncModelConfig } from './visitors/appsync-visitor';
import { AppSyncJSONVisitor } from './visitors/appsync-json-metadata-visitor';
import { AppSyncModelJavaVisitor } from './visitors/appsync-java-visitor';
import { AppSyncModelTypeScriptVisitor } from './visitors/appsync-typescript-visitor';
import { AppSyncModelJavascriptVisitor } from './visitors/appsync-javascript-visitor';
import { AppSyncModelDartVisitor } from './visitors/appsync-dart-visitor';
export const plugin: PluginFunction<RawAppSyncModelConfig> = (
  schema: GraphQLSchema,
  rawDocuments: Types.DocumentFile[],
  config: RawAppSyncModelConfig,
) => {
  let visitor;
  switch (config.target) {
    case 'swift':
      visitor = new AppSyncSwiftVisitor(schema, config, {
        selectedType: config.selectedType,
        generate: config.generate,
      });
      break;
    case 'java':
      visitor = new AppSyncModelJavaVisitor(schema, config, {
        selectedType: config.selectedType,
        generate: config.generate,
      });
      break;
    case 'metadata':
      visitor = new AppSyncJSONVisitor(schema, config, {});
      break;
    case 'typescript':
      visitor = new AppSyncModelTypeScriptVisitor(schema, config, {});
      break;
    case 'javascript':
      visitor = new AppSyncModelJavascriptVisitor(schema, config, {});
      break;
    case 'dart':
      visitor = new AppSyncModelDartVisitor(schema, config, {
        selectedType: config.selectedType,
        generate: config.generate,
      });
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
