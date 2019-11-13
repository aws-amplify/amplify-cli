import {
  BaseVisitor,
  DEFAULT_SCALARS,
  NormalizedScalarsMap,
  ParsedConfig,
  RawConfig,
  buildScalars,
} from '@graphql-codegen/visitor-plugin-common';
import { camelCase, pascalCase, upperCase } from 'change-case';
import {
  DirectiveNode,
  EnumTypeDefinitionNode,
  FieldDefinitionNode,
  GraphQLNamedType,
  GraphQLSchema,
  ObjectTypeDefinitionNode,
  valueFromASTUntyped,
  isScalarType,
  parse,
  Kind,
  DefinitionNode,
} from 'graphql';
import { getTypeInfo } from '../utils/get-type-info';
import { type } from 'os';
export interface RawAppSyncLocalConfig extends RawConfig {
  /**
   * @name target
   * @type string
   * @description required, the language target for generated code
   *
   * @example
   * ```yml
   * generates:
   * Models:
   * config:
   *    target: 'swift'
   *  plugins:
   *    - appsync-local-codegen-plugin
   * ```
   * target: 'swift'| 'javascript'| 'typescript' | 'android' | 'metadata'
   */
  target: string;

  /**
   * @name modelName
   * @type string
   * @description optional, name of the model to which the code needs to be generated. Used only
   * when target is set to swift
   * @default undefined, this will generate code for all the models
   *
   * generates:
   * Models:
   * config:
   *    target: 'swift'
   *    model: Todo
   *  plugins:
   *    - appsync-local-codegen-plugin
   * ```
   */
  selectedType: string;

  /**
   * @name metadata
   * @type boolean
   * @description optional, name of the model to which the code needs to be generated
   * @default undefined, this will generate non meta data code
   *
   * generates:
   * Models:
   * config:
   *    target: 'swift'
   *    model: Todo
   *    metadata: true
   *  plugins:
   *    - appsync-local-codegen-plugin
   * ```
   */
  metadata: boolean;
  /**
   * @name directives
   * @type string
   * @descriptions optional string which includes directive definition and types used by directives. The types defined in here won't make it to output
   */
  directives?: string;
}

// Todo: need to figure out how to share config
export interface ParsedAppSyncLocalConfig extends ParsedConfig {
  selectedType?: string;
  metadata?: boolean;
}
export type CodeGenArgumentsMap = {
  [argumentName: string]: any;
};
export type CodeGenDirective = {
  name: string;
  arguments: CodeGenArgumentsMap;
};
export type CodeGenDirectives = CodeGenDirective[];
export type CodeGenField = TypeInfo & {
  name: string;
  directives: CodeGenDirectives;
};
export type TypeInfo = {
  type: string;
  isList: boolean;
  isNullable: boolean;
  baseType?: GraphQLNamedType | null;
};
export type CodeGenModel = {
  name: string;
  type: 'model';
  directives: CodeGenDirectives;
  fields: CodeGenField[];
};

export type CodeGenEnum = {
  name: string;
  type: 'enum';
  values: CodeGenEnumValueMap;
};
export type CodeGenModelMap = {
  [modelName: string]: CodeGenModel;
};

export type CodeGenEnumValueMap = { [enumConvertedName: string]: string };

export type CodeGenEnumMap = Record<string, CodeGenEnum>;

export abstract class AppSyncLocalVisitor<
  TRawConfig extends RawAppSyncLocalConfig = RawAppSyncLocalConfig,
  TPluginConfig extends ParsedAppSyncLocalConfig = ParsedAppSyncLocalConfig
> extends BaseVisitor<TRawConfig, TPluginConfig> {
  protected READ_ONLY_FIELDS = ['id'];
  protected SCALAR_TYPE_MAP: Record<string, string> = {};
  protected typeMap: CodeGenModelMap = {};
  protected enumMap: CodeGenEnumMap = {};
  protected typesToSkip: string[] = [];
  constructor(
    protected _schema: GraphQLSchema,
    rawConfig: TRawConfig,
    additionalConfig: Partial<TPluginConfig>,
    defaultScalars: NormalizedScalarsMap = DEFAULT_SCALARS
  ) {
    super(rawConfig, {
      ...additionalConfig,
      scalars: buildScalars(_schema, rawConfig.scalars || '', defaultScalars),
    });

    const typesUsedInDirectives: string[] = [];
    if (rawConfig.directives) {
      const directiveSchema = parse(rawConfig.directives);
      directiveSchema.definitions.forEach((definition: DefinitionNode) => {
        if (definition.kind === Kind.ENUM_TYPE_DEFINITION || definition.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION) {
          typesUsedInDirectives.push(definition.name.value);
        }
      });
    }

    this.typesToSkip = [this._schema.getQueryType(), this._schema.getMutationType(), this._schema.getSubscriptionType()]
      .filter(t => t)
      .map(t => (t && t.name) || '');
    this.typesToSkip.push(...typesUsedInDirectives);
  }

  ObjectTypeDefinition(node: ObjectTypeDefinitionNode, index?: string | number, parent?: any) {
    if (this.typesToSkip.includes(node.name.value)) {
      // Skip Query, mutation and subscription type
      return;
    }
    const directives = this.getDirectives(node.directives);
    if (directives.find(directive => directive.name === 'model')) {
      const fields = (node.fields as unknown) as CodeGenField[];
      // Todo: Add validation for each directives
      // @model would add the id: ID! if missing or throw error if there is an id of different type
      // @key check if fields listed in directives are present in the Object
      //
      const model: CodeGenModel = {
        name: this.convertName(node),
        type: 'model',
        directives,
        fields,
      };
      this.ensureIdField(model);
      this.typeMap[node.name.value] = model;
    }
  }
  FieldDefinition(node: FieldDefinitionNode): CodeGenField {
    const directive = this.getDirectives(node.directives);
    return {
      name: node.name.value,
      directives: directive,
      ...getTypeInfo(node.type, this._schema),
    };
  }
  EnumTypeDefinition(node: EnumTypeDefinitionNode): void {
    if (this.typesToSkip.includes(node.name.value)) {
      // Skip Query, mutation and subscription type and additional
      return;
    }
    const enumName = this.getEnumName(node.name.value);
    const values = node.values
      ? node.values.reduce(
          (acc, val) => {
            acc[this.getEnumValue(val.name.value)] = val.name.value;
            return acc;
          },
          {} as any
        )
      : {};
    this.enumMap[node.name.value] = {
      name: enumName,
      type: 'enum',
      values,
    };
  }
  abstract generate(): string;

  private getDirectives(directives: readonly DirectiveNode[] | undefined): CodeGenDirectives {
    if (directives) {
      return directives.map(d => ({
        name: d.name.value,
        arguments: this.getDirectiveArguments(d),
      }));
    }
    return [];
  }

  private getDirectiveArguments(directive: DirectiveNode): CodeGenArgumentsMap {
    const directiveArguments: CodeGenArgumentsMap = {};
    if (directive.arguments) {
      directive.arguments.reduce((acc, arg) => {
        directiveArguments[arg.name.value] = valueFromASTUntyped(arg.value);
        return directiveArguments;
      }, directiveArguments);
    }
    return directiveArguments;
  }

  /**
   * Returns an object that contains all the models that need codegen to be run
   *
   */
  protected getSelectedModels(): CodeGenModelMap {
    if (this._parsedConfig.selectedType) {
      const selectedModel = this.typeMap[this._parsedConfig.selectedType];
      return selectedModel ? { [this._parsedConfig.selectedType]: selectedModel } : {};
    }
    return this.typeMap;
  }

  protected getSelectedEnums(): CodeGenEnumMap {
    if (this._parsedConfig.selectedType) {
      const selectedModel = this.enumMap[this._parsedConfig.selectedType];
      return selectedModel ? { [this._parsedConfig.selectedType]: selectedModel } : {};
    }
    return this.enumMap;
  }
  protected selectedTypeIsEnum() {
    if (this._parsedConfig && this._parsedConfig.selectedType) {
      if (this._parsedConfig.selectedType in this.enumMap) {
        return true;
      }
    }
    return false;
  }

  /**
   * returns the Java type or class name
   * @param field
   */
  protected getNativeType(field: CodeGenField): string {
    const typeName = field.type;
    let typeNameStr: string = '';
    if (typeName in this.scalars) {
      typeNameStr = this.scalars[typeName];
    } else if (this.isModelType(field)) {
      typeNameStr = this.getModelName(this.typeMap[typeName]);
    } else if (this.isEnumType(field)) {
      typeNameStr = this.getEnumName(this.enumMap[typeName]);
    } else {
      throw new Error(`Unknown type ${typeName} for field ${field.name}`);
    }

    return field.isList ? this.getListType(typeNameStr) : typeNameStr;
  }

  protected getListType(typeStr: string): string {
    return `List<${typeStr}>`;
  }

  protected getFieldName(field: CodeGenField): string {
    return camelCase(field.name);
  }

  protected getEnumName(enumField: CodeGenEnum | string): string {
    if (typeof enumField === 'string') {
      return pascalCase(enumField);
    }
    return pascalCase(enumField.name);
  }

  protected getModelName(model: CodeGenModel) {
    return pascalCase(model.name);
  }

  protected getEnumValue(value: string): string {
    return upperCase(value);
  }

  protected isEnumType(field: CodeGenField): boolean {
    const typeName = field.type;
    return typeName in this.enumMap;
  }

  protected isModelType(field: CodeGenField): boolean {
    const typeName = field.type;
    return typeName in this.typeMap;
  }

  protected ensureIdField(model: CodeGenModel) {
    const idField = model.fields.find(field => field.name === 'id');
    if (idField) {
      if (idField.type !== 'ID') {
        throw new Error(`id field on ${model.name} should be of type ID`);
      }
      // Make id field required
      idField.isNullable = false;
    } else {
      model.fields.splice(0, 0, {
        name: 'id',
        type: 'ID',
        isNullable: false,
        isList: false,
        directives: [],
      });
    }
  }
}
