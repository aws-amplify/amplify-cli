import { indentMultiline } from '@graphql-codegen/visitor-plugin-common';
import { TypeScriptDeclarationBlock } from '../languages/typescript-declaration-block';
import { camelCase } from 'change-case';
import {
  AppSyncModelVisitor,
  CodeGenEnum,
  CodeGenField,
  CodeGenModel,
  ParsedAppSyncModelConfig,
  RawAppSyncModelConfig,
} from './appsync-visitor';

export interface RawAppSyncModelTypeScriptConfig extends RawAppSyncModelConfig {}
export interface ParsedAppSyncModelTypeScriptConfig extends ParsedAppSyncModelConfig {
  isDeclaration: boolean;
}

export class AppSyncModelTypeScriptVisitor<
  TRawConfig extends RawAppSyncModelTypeScriptConfig = RawAppSyncModelTypeScriptConfig,
  TPluginConfig extends ParsedAppSyncModelTypeScriptConfig = ParsedAppSyncModelTypeScriptConfig
> extends AppSyncModelVisitor<TRawConfig, TPluginConfig> {
  protected SCALAR_TYPE_MAP: { [key: string]: string } = {
    String: 'string',
    Int: 'number',
    Float: 'number',
    Boolean: 'boolean',
    ID: 'string',
  };

  protected IMPORT_STATEMENTS = [
    'import { ModelInit, MutableModel, PersistentModelConstructor } from "@aws-amplify/datastore";',
    'import { initSchema } from "@aws-amplify/datastore";',
    '',
    'import { schema } from "./schema";',
  ];

  generate(): string {
    this.processDirectives();
    const imports = this.generateImports();
    const enumDeclarations = Object.values(this.enumMap)
      .map(enumObj => this.generateEnumDeclarations(enumObj))
      .join('\n\n');

    const modelDeclarations = Object.values(this.typeMap)
      .map(typeObj => this.generateModelDeclaration(typeObj))
      .join('\n\n');

    const modelInitialization = this.generateModelInitialization(Object.values(this.typeMap));

    const modelExports = this.generateExports(Object.values(this.typeMap));

    return [imports, '', enumDeclarations, '', modelDeclarations, '', modelInitialization, '', modelExports].join('\n');
  }

  protected generateImports(): string {
    return this.IMPORT_STATEMENTS.join('\n');
  }

  protected generateEnumDeclarations(enumObj: CodeGenEnum, exportEnum: boolean = false): string {
    const enumDeclarations = new TypeScriptDeclarationBlock()
      .asKind('enum')
      .withName(this.getEnumName(enumObj))
      .withEnumValues(enumObj.values)
      .export(exportEnum);

    return enumDeclarations.string;
  }

  /**
   *
   * @param modelObj CodeGenModel object
   * @param isDeclaration flag indicates if the class needs to be exported
   */
  protected generateModelDeclaration(modelObj: CodeGenModel, isDeclaration: boolean = true): string {
    const modelName = this.generateModelTypeDeclarationName(modelObj);
    const modelDeclarations = new TypeScriptDeclarationBlock()
      .asKind('class')
      .withFlag({ isDeclaration })
      .withName(modelName)
      .export(true);

    modelObj.fields.forEach((field: CodeGenField) => {
      modelDeclarations.addProperty(this.getFieldName(field), this.getNativeType(field), undefined, 'DEFAULT', {
        readonly: true,
        optional: field.isNullable,
      });
    });

    // Constructor
    modelDeclarations.addClassMethod(
      'constructor',
      null,
      null,
      [
        {
          name: 'init',
          type: `ModelInit<${modelName}>`,
        },
      ],
      'DEFAULT',
      {}
    );

    // copyOf method
    modelDeclarations.addClassMethod(
      'copyOf',
      modelName,
      null,
      [
        {
          name: 'source',
          type: modelName,
        },
        {
          name: 'mutator',
          type: `(draft: MutableModel<${modelName}>) => MutableModel<${modelName}> | void`,
        },
      ],
      'DEFAULT',
      { static: true }
    );
    return modelDeclarations.string;
  }

  /**
   * Generate model Declaration using classCreator
   * @param model
   */
  protected generateModelInitialization(models: CodeGenModel[], includeTypeInfo: boolean = true): string {
    if (models.length === 0) {
      return '';
    }
    const modelClasses = models
      .map(model => [this.generateModelImportName(model), this.generateModelImportAlias(model)])
      .map(([importName, aliasName]) => {
        return importName === aliasName ? importName : `${importName}: ${aliasName}`;
      });

    const initializationResult = ['const', '{', modelClasses.join(', '), '}', '=', 'initSchema(schema)'];
    if (includeTypeInfo) {
      const typeInfo = models
        .map(model => {
          return [this.generateModelImportName(model), this.generateModelTypeDeclarationName(model)];
        })
        .map(([importName, modelDeclarationName]) => `${importName}: PersistentModelConstructor<${modelDeclarationName}>;`);
      const typeInfoStr = ['{', indentMultiline(typeInfo.join('\n')), '}'].join('\n');
      initializationResult.push('as', typeInfoStr);
    }
    return `${initializationResult.join(' ')};`;
  }

  protected generateExports(modelsOrEnum: (CodeGenModel | CodeGenEnum)[]): string {
    const exportStr = modelsOrEnum
      .map(model => {
        if (model.type === 'model') {
          const modelClassName = this.generateModelImportAlias(model);
          const exportClassName = this.getModelName(model);
          return modelClassName !== exportClassName ? `${modelClassName} as ${exportClassName}` : modelClassName;
        }
        return model.name;
      })
      .join(',\n');
    return ['export {', indentMultiline(exportStr), '};'].join('\n');
  }

  /**
   * Generate the type declaration class name of Model
   * @param model CodeGenModel
   */
  protected generateModelTypeDeclarationName(model: CodeGenModel): string {
    return `${this.getModelName(model)}Model`;
  }

  /**
   * Generate alias for the model used when importing it from initSchema
   * @param model
   */
  protected generateModelImportAlias(model: CodeGenModel): string {
    return this.getModelName(model);
  }

  /**
   * Generate the import name for model from initSchema
   * @param model Model object
   *
   */
  protected generateModelImportName(model: CodeGenModel): string {
    return this.getModelName(model);
  }

  /**
   * Generate the class name for export
   * @param model
   */
  protected generateModelExportName(model: CodeGenModel): string {
    return this.getModelName(model);
  }

  protected getListType(typeStr: string, field: CodeGenField): string {
    return `${typeStr}[]`;
  }

  protected getNativeType(field: CodeGenField): string {
    const typeName = field.type;
    if (this.isModelType(field)) {
      const modelType = this.typeMap[typeName];
      const typeNameStr = this.generateModelTypeDeclarationName(modelType);
      return field.isList ? this.getListType(typeNameStr, field) : typeNameStr;
    }

    let nativeType = super.getNativeType(field);

    if (this.isEnumType(field)) {
      nativeType = `${nativeType} | keyof typeof ${this.getEnumName(this.enumMap[typeName])}`;
    }

    return nativeType;
  }
}
