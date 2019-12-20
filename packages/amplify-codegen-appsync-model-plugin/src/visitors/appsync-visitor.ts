import {
  BaseVisitor,
  buildScalars,
  DEFAULT_SCALARS,
  NormalizedScalarsMap,
  ParsedConfig,
  RawConfig,
} from '@graphql-codegen/visitor-plugin-common';
import { constantCase, pascalCase } from 'change-case';
import { plural } from 'pluralize';
import crypto from 'crypto';
import {
  DefinitionNode,
  DirectiveNode,
  EnumTypeDefinitionNode,
  FieldDefinitionNode,
  GraphQLNamedType,
  GraphQLSchema,
  Kind,
  ObjectTypeDefinitionNode,
  parse,
  valueFromASTUntyped,
} from 'graphql';
import { addFieldToModel, removeFieldFromModel } from '../utils/fieldUtils';
import { getTypeInfo } from '../utils/get-type-info';
import { CodeGenConnectionType, CodeGenFieldConnection, processConnections } from '../utils/process-connections';
import { sortFields } from '../utils/sort';
import { printWarning } from '../utils/warn';
import { processAuthDirective } from '../utils/process-auth';

export enum CodeGenGenerateEnum {
  metadata = 'metadata',
  code = 'code',
  loader = 'loader',
}
export interface RawAppSyncModelConfig extends RawConfig {
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
   *    - amplify-codegen-appsync-model-plugin
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
   *    - amplify-codegen-appsync-model-plugin
   * ```
   */
  selectedType?: string;

  /**
   * @name generate
   * @type string
   * @description optional, informs what needs to be generated.
   * type - Generate class or struct
   * metadata - Generate metadata used by swift and JS/TS
   * loader - Class/Struct loader used by swift or Java
   * @default code, this will generate non meta data code
   *
   * generates:
   * Models:
   * config:
   *    target: 'swift'
   *    model: Todo
   *    generate: 'metadata'
   *  plugins:
   *    - amplify-codegen-appsync-model-plugin
   * ```
   */
  generate?: CodeGenGenerateEnum;
  /**
   * @name directives
   * @type string
   * @descriptions optional string which includes directive definition and types used by directives. The types defined in here won't make it to output
   */
  directives?: string;
}

// Todo: need to figure out how to share config
export interface ParsedAppSyncModelConfig extends ParsedConfig {
  selectedType?: string;
  generate?: CodeGenGenerateEnum;
}
export type CodeGenArgumentsMap = Record<string, any>;

export type CodeGenDirective = {
  name: string;
  arguments: CodeGenArgumentsMap;
};

export type CodeGenDirectives = CodeGenDirective[];
export type CodeGenField = TypeInfo & {
  name: string;
  directives: CodeGenDirectives;
  connectionInfo?: CodeGenFieldConnection;
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

export class AppSyncModelVisitor<
  TRawConfig extends RawAppSyncModelConfig = RawAppSyncModelConfig,
  TPluginConfig extends ParsedAppSyncModelConfig = ParsedAppSyncModelConfig
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
        name: node.name.value,
        type: 'model',
        directives,
        fields,
      };
      this.ensureIdField(model);
      this.sortFields(model);
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
      ? node.values.reduce((acc, val) => {
          acc[this.getEnumValue(val.name.value)] = val.name.value;
          return acc;
        }, {} as any)
      : {};
    this.enumMap[node.name.value] = {
      name: enumName,
      type: 'enum',
      values,
    };
  }
  processDirectives() {
    this.processConnectionDirective();
    this.processAuthDirectives();
  }
  generate(): string {
    this.processDirectives();
    return '';
  }

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
      throw new Error(`Unknown type ${typeName} for field ${field.name}. Did you forget to add the @model directive`);
    }

    return field.isList ? this.getListType(typeNameStr, field) : typeNameStr;
  }

  protected getListType(typeStr: string, field: CodeGenField): string {
    return `List<${typeStr}>`;
  }

  protected getFieldName(field: CodeGenField): string {
    return field.name;
  }

  protected getEnumName(enumField: CodeGenEnum | string): string {
    if (typeof enumField === 'string') {
      return pascalCase(enumField);
    }
    return pascalCase(enumField.name);
  }

  protected getModelName(model: CodeGenModel) {
    return model.name;
  }

  protected getEnumValue(value: string): string {
    return constantCase(value);
  }

  protected isEnumType(field: CodeGenField): boolean {
    const typeName = field.type;
    return typeName in this.enumMap;
  }

  protected isModelType(field: CodeGenField): boolean {
    const typeName = field.type;
    return typeName in this.typeMap;
  }

  protected computeVersion(): string {
    // Sort types
    const typeArr: any[] = [];
    Object.values(this.typeMap).forEach((obj: CodeGenModel) => {
      // include only key directive as we don't care about others for versioning
      const directives = obj.directives.filter(dir => dir.name === 'key');
      const fields = obj.fields
        .map((field: CodeGenField) => {
          // include only connection field and type
          const fieldDirectives = field.directives.filter(field => field.name === 'connection');
          return {
            name: field.name,
            directives: fieldDirectives,
            type: field.type,
          };
        })
        .sort((a, b) => sortFields(a, b));
      typeArr.push({
        name: obj.name,
        directives,
        fields,
      });
    });
    typeArr.sort(sortFields);
    return crypto
      .createHash('MD5')
      .update(JSON.stringify(typeArr))
      .digest()
      .toString('hex');
  }

  /**
   * Sort the fields to ensure id is always the first field
   * @param model
   */
  protected sortFields(model: CodeGenModel) {
    // sort has different behavior in node 10 and 11. Using reduce instead
    model.fields = model.fields.reduce((acc, field) => {
      if (field.name === 'id') {
        acc.unshift(field);
      } else {
        acc.push(field);
      }
      return acc;
    }, [] as CodeGenField[]);
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

  protected processConnectionDirective(): void {
    Object.values(this.typeMap).forEach(model => {
      model.fields.forEach(field => {
        const connectionInfo = processConnections(field, model, this.typeMap);
        if (connectionInfo) {
          if (connectionInfo.kind === CodeGenConnectionType.HAS_MANY || connectionInfo.kind === CodeGenConnectionType.HAS_ONE) {
            // Need to update the other side of the connection even if there is no connection directive
            addFieldToModel(connectionInfo.connectedModel, connectionInfo.associatedWith);
          } else {
            // Need to remove the field that is targetName
            removeFieldFromModel(model, connectionInfo.targetName);
          }
          field.connectionInfo = connectionInfo;
        }
      });

      // Should remove the fields that are of Model type and are not connected to ensure there are no phantom input fields
      const modelTypes = Object.values(this.typeMap).map(model => model.name);
      model.fields = model.fields.filter(field => {
        const fieldType = field.type;
        const connectionInfo = field.connectionInfo;
        if (modelTypes.includes(fieldType) && connectionInfo === undefined) {
          printWarning(
            `Model ${model.name} has field ${field.name} of type ${field.type} but its not connected. Add a @connection directive if want to connect them.`
          );
          return false;
        }
        return true;
      });
    });
  }

  protected processAuthDirectives(): void {
    Object.values(this.typeMap).forEach(model => {
      const filteredDirectives = model.directives.filter(d => d.name !== 'auth');
      const authDirectives = processAuthDirective(model.directives);
      model.directives = [...filteredDirectives, ...authDirectives];
    });
  }

  protected pluralizeModelName(model: CodeGenModel): string {
    return plural(model.name);
  }

  get types() {
    return this.typeMap;
  }

  get enums() {
    return this.enumMap;
  }
}
