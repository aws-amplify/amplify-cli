import { DEFAULT_SCALARS, NormalizedScalarsMap } from '@graphql-codegen/visitor-plugin-common';
import { GraphQLSchema } from 'graphql';
import { AppSyncModelVisitor, CodeGenDirective, CodeGenField, ParsedAppSyncModelConfig, RawAppSyncModelConfig } from './appsync-visitor';

type JSONSchema = {
  models: JSONSchemaModels;
  enums: JSONSchemaEnums;
  version: string;
};
type JSONSchemaModels = Record<string, JSONSchemaModel>;
type JSONSchemaModel = {
  name: string;
  attributes?: JSONModelAttributes;
  fields: JSONModelFields;
  syncable?: boolean;
};
type JSONSchemaEnums = Record<string, JSONSchemaEnum>;
type JSONSchemaEnum = {
  name: string;
  values: string[];
};
type JSONModelAttributes = JSONModelAttribute[];
type JSONModelAttribute = { type: string; properties?: Record<string, any> };
type JSONModelFields = Record<string, JSONModelField>;
enum JSONGraphQLScalarType {
  ID = 'ID',
  String = 'String',
  Int = 'Int',
  Float = 'Float',
  Boolean = 'Boolean',
}

type JSONModelFieldType = JSONGraphQLScalarType | keyof typeof JSONGraphQLScalarType | { model: string } | { enum: string };
type JSONModelField = {
  name: string;
  targetName: string;
  type: JSONModelFieldType;
  isArray: boolean;
  isRequired?: boolean;
  attributes?: JSONModelFieldAttributes;
};
type JSONModelFieldAttributes = JSONModelFieldAttribute[];
type JSONModelFieldAttribute = JSONModelAttribute;

export interface RawAppSyncModelMetadataConfig extends RawAppSyncModelConfig {
  /**
   * @name metaDataTarget
   * @type string
   * @description required, the language target for generated code
   *
   * @example
   * ```yml
   * generates:
   * Models:
   * config:
   *    target: 'metadata'
   *    metaDataTarget: 'typescript'
   *  plugins:
   *    - amplify-codegen-appsync-model-plugin
   * ```
   * metaDataTarget: 'javascript'| 'typescript'
   */
  metaDataTarget?: string;
}

export interface ParsedAppSyncModelMetadataConfig extends ParsedAppSyncModelConfig {
  metaDataTarget: string;
}
export class AppSyncJSONVisitor<
  TRawConfig extends RawAppSyncModelMetadataConfig = RawAppSyncModelMetadataConfig,
  TPluginConfig extends ParsedAppSyncModelMetadataConfig = ParsedAppSyncModelMetadataConfig
> extends AppSyncModelVisitor<TRawConfig, TPluginConfig> {
  constructor(
    schema: GraphQLSchema,
    rawConfig: TRawConfig,
    additionalConfig: Partial<TPluginConfig>,
    defaultScalars: NormalizedScalarsMap = DEFAULT_SCALARS
  ) {
    super(schema, rawConfig, additionalConfig, defaultScalars);
    this._parsedConfig.metaDataTarget = rawConfig.metaDataTarget || 'json';
  }
  generate(): string {
    if (this._parsedConfig.metaDataTarget === 'typescript') {
      return this.generateTypeScriptMetaData();
    } else if (this._parsedConfig.metaDataTarget === 'javascript') {
      return this.generateJavaScriptMetaData();
    } else if (this._parsedConfig.metaDataTarget === 'typedeclaration') {
      return this.generateTypeDeclaration();
    }

    return this.generateJSONMetaData();
  }

  protected generateTypeScriptMetaData(): string {
    const metadatObj = this.generateMetaData();
    const metaData: string[] = [`import { Schema } from "@aws-amplify/datastore";`, ''];
    metaData.push(`export const schema: Schema = ${JSON.stringify(metadatObj, null, 4)};`);
    return metaData.join('\n');
  }

  protected generateJavaScriptMetaData(): string {
    const metadatObj = this.generateMetaData();
    const metaData: string[] = [];
    metaData.push(`export const schema = ${JSON.stringify(metadatObj, null, 4)};`);
    return metaData.join('\n');
  }

  protected generateTypeDeclaration() {
    return ["import { Schema } from '@aws-amplify/datastore';", '', 'export declare const schema: Schema;'].join('\n');
  }

  protected generateJSONMetaData(): string {
    const metaData = this.generateMetaData();
    return JSON.stringify(metaData, null, 4);
  }

  protected generateMetaData(): JSONSchema {
    const result: JSONSchema = {
      models: {},
      enums: {},
      version: this.computeVersion(),
    };

    Object.entries(this.getSelectedModels()).forEach(([name, obj]) => {
      const model = {
        syncable: true,
        name: this.getModelName(obj),
        attributes: this.generateAttributes(obj.directives),
        fields: obj.fields.reduce((acc: JSONModelFields, field: CodeGenField) => {
          acc[this.getFieldName(field)] = {
            name: this.getFieldName(field),
            targetName: field.name,
            isArray: field.isList,
            type: this.getType(field.type),
            isRequired: !field.isNullable,
            attributes: this.generateAttributes(field.directives),
          };
          return acc;
        }, {}),
      };
      result.models[obj.name] = model;
    });

    Object.entries(this.enumMap).forEach(([name, enumObj]) => {
      const enumV = {
        name,
        values: Object.values(enumObj.values),
      };
      result.enums[this.getEnumName(enumObj)] = enumV;
    });
    return result;
  }

  private generateAttributes(directives: CodeGenDirective[]): JSONModelAttributes {
    return directives.map(d => ({
      type: d.name,
      properties: d.arguments,
    }));
  }

  private getType(gqlType: string): JSONModelFieldType {
    // Todo: Handle unlisted scalars
    if (gqlType in JSONGraphQLScalarType) {
      return JSONGraphQLScalarType[gqlType as keyof typeof JSONGraphQLScalarType];
    }
    if (gqlType in this.enumMap) {
      return { enum: this.enumMap[gqlType].name };
    }
    return { model: gqlType };
  }
}
