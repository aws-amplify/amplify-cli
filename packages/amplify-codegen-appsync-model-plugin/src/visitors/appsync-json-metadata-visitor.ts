import { DEFAULT_SCALARS, NormalizedScalarsMap } from '@graphql-codegen/visitor-plugin-common';
import { GraphQLSchema } from 'graphql';
import { CodeGenConnectionType } from '../utils/process-connections';
import {
  AppSyncModelVisitor,
  CodeGenField,
  CodeGenModel,
  ParsedAppSyncModelConfig,
  RawAppSyncModelConfig,
  CodeGenEnum,
} from './appsync-visitor';
import { METADATA_SCALAR_MAP } from '../scalars';
export type JSONSchema = {
  models: JSONSchemaModels;
  enums: JSONSchemaEnums;
  nonModels: JSONSchemaTypes;
  version: string;
};
export type JSONSchemaModels = Record<string, JSONSchemaModel>;
export type JSONSchemaTypes = Record<string, JSONSchemaNonModel>;
export type JSONSchemaNonModel = {
  name: string;
  fields: JSONModelFields;
};
type JSONSchemaModel = {
  name: string;
  attributes?: JSONModelAttributes;
  fields: JSONModelFields;
  pluralName: String;
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

type AssociationBaseType = {
  connectionType: CodeGenConnectionType;
};

export type AssociationHasMany = AssociationBaseType & {
  connectionType: CodeGenConnectionType.HAS_MANY;
  associatedWith: string;
};
type AssociationHasOne = AssociationHasMany & {
  connectionType: CodeGenConnectionType.HAS_ONE;
};

type AssociationBelongsTo = AssociationBaseType & {
  targetName: string;
};

type AssociationType = AssociationHasMany | AssociationHasOne | AssociationBelongsTo;

type JSONModelFieldType = keyof typeof METADATA_SCALAR_MAP | { model: string } | { enum: string } | { nonModel: string };
type JSONModelField = {
  name: string;
  type: JSONModelFieldType;
  isArray: boolean;
  isRequired?: boolean;
  attributes?: JSONModelFieldAttributes;
  association?: AssociationType;
};
type JSONModelFieldAttributes = JSONModelFieldAttribute[];
type JSONModelFieldAttribute = JSONModelAttribute;

export interface RawAppSyncModelMetadataConfig extends RawAppSyncModelConfig {
  /**
   * @name metadataTarget
   * @type string
   * @description required, the language target for generated code
   *
   * @example
   * ```yml
   * generates:
   * Models:
   * config:
   *    target: 'metadata'
   *    metadataTarget: 'typescript'
   *  plugins:
   *    - amplify-codegen-appsync-model-plugin
   * ```
   * metadataTarget: 'javascript'| 'typescript' | 'typedeclration'
   */
  metadataTarget?: string;
}

export interface ParsedAppSyncModelMetadataConfig extends ParsedAppSyncModelConfig {
  metadataTarget: string;
}
export class AppSyncJSONVisitor<
  TRawConfig extends RawAppSyncModelMetadataConfig = RawAppSyncModelMetadataConfig,
  TPluginConfig extends ParsedAppSyncModelMetadataConfig = ParsedAppSyncModelMetadataConfig
> extends AppSyncModelVisitor<TRawConfig, TPluginConfig> {
  constructor(
    schema: GraphQLSchema,
    rawConfig: TRawConfig,
    additionalConfig: Partial<TPluginConfig>,
    defaultScalars: NormalizedScalarsMap = DEFAULT_SCALARS,
  ) {
    super(schema, rawConfig, additionalConfig, defaultScalars);
    this._parsedConfig.metadataTarget = rawConfig.metadataTarget || 'javascript';
  }
  generate(): string {
    this.processDirectives();
    if (this._parsedConfig.metadataTarget === 'typescript') {
      return this.generateTypeScriptMetadata();
    } else if (this._parsedConfig.metadataTarget === 'javascript') {
      return this.generateJavaScriptMetadata();
    } else if (this._parsedConfig.metadataTarget === 'typeDeclaration') {
      return this.generateTypeDeclaration();
    }
    throw new Error(`Unsupported metadataTarget ${this._parsedConfig.metadataTarget}. Supported targets are javascript and typescript`);
  }

  protected generateTypeScriptMetadata(): string {
    const metadataObj = this.generateMetadata();
    const metadata: string[] = [`import { Schema } from "@aws-amplify/datastore";`, ''];
    metadata.push(`export const schema: Schema = ${JSON.stringify(metadataObj, null, 4)};`);
    return metadata.join('\n');
  }

  protected generateJavaScriptMetadata(): string {
    const metadataObj = this.generateMetadata();
    const metadata: string[] = [];
    metadata.push(`export const schema = ${JSON.stringify(metadataObj, null, 4)};`);
    return metadata.join('\n');
  }

  protected generateTypeDeclaration() {
    return ["import { Schema } from '@aws-amplify/datastore';", '', 'export declare const schema: Schema;'].join('\n');
  }

  protected generateJSONMetadata(): string {
    const metadata = this.generateMetadata();
    return JSON.stringify(metadata, null, 4);
  }

  protected generateMetadata(): JSONSchema {
    const result: JSONSchema = {
      models: {},
      enums: {},
      nonModels: {},
      version: this.computeVersion(),
    };

    const models = Object.values(this.getSelectedModels()).reduce((acc, model: CodeGenModel) => {
      return { ...acc, [model.name]: this.generateModelMetadata(model) };
    }, {});

    const nonModels = Object.values(this.getSelectedNonModels()).reduce((acc, nonModel: CodeGenModel) => {
      return { ...acc, [nonModel.name]: this.generateNonModelMetadata(nonModel) };
    }, {});

    const enums = Object.values(this.enumMap).reduce((acc, enumObj) => {
      const enumV = this.generateEnumMetadata(enumObj);
      return { ...acc, [this.getEnumName(enumObj)]: enumV };
    }, {});
    return { ...result, models, nonModels: nonModels, enums };
  }

  private getFieldAssociation(field: CodeGenField): AssociationType | void {
    if (field.connectionInfo) {
      const { connectionInfo } = field;
      const connectionAttribute: any = { connectionType: connectionInfo.kind };
      if (connectionInfo.kind === CodeGenConnectionType.HAS_MANY || connectionInfo.kind === CodeGenConnectionType.HAS_ONE) {
        connectionAttribute.associatedWith = this.getFieldName(connectionInfo.associatedWith);
      } else {
        connectionAttribute.targetName = connectionInfo.targetName;
      }
      return connectionAttribute;
    }
  }

  private generateModelAttributes(model: CodeGenModel): JSONModelAttributes {
    return model.directives.map(d => ({
      type: d.name,
      properties: d.arguments,
    }));
  }
  private generateModelMetadata(model: CodeGenModel): JSONSchemaModel {
    return {
      ...this.generateNonModelMetadata(model),
      syncable: true,
      pluralName: this.pluralizeModelName(model),
      attributes: this.generateModelAttributes(model),
    };
  }

  private generateNonModelMetadata(nonModel: CodeGenModel): JSONSchemaNonModel {
    return {
      name: this.getModelName(nonModel),
      fields: nonModel.fields.reduce((acc: JSONModelFields, field: CodeGenField) => {
        const fieldMeta: JSONModelField = {
          name: this.getFieldName(field),
          isArray: field.isList,
          type: this.getType(field.type),
          isRequired: !field.isNullable,
          attributes: [],
        };
        const association: AssociationType | void = this.getFieldAssociation(field);
        if (association) {
          fieldMeta.association = association;
        }
        acc[fieldMeta.name] = fieldMeta;
        return acc;
      }, {}),
    };
  }
  private generateEnumMetadata(enumObj: CodeGenEnum): JSONSchemaEnum {
    return {
      name: enumObj.name,
      values: Object.values(enumObj.values),
    };
  }

  private getType(gqlType: string): JSONModelFieldType {
    // Todo: Handle unlisted scalars
    if (gqlType in METADATA_SCALAR_MAP) {
      return METADATA_SCALAR_MAP[gqlType as keyof typeof METADATA_SCALAR_MAP];
    }
    if (gqlType in this.enumMap) {
      return { enum: this.enumMap[gqlType].name };
    }
    if (gqlType in this.nonModelMap) {
      return { nonModel: gqlType };
    }
    if (gqlType in this.modelMap) {
      return { model: gqlType };
    }
    throw new Error(`Unknown type ${gqlType}`);
  }
}
