import { DEFAULT_SCALARS, NormalizedScalarsMap } from '@graphql-codegen/visitor-plugin-common';
import { GraphQLSchema } from 'graphql';
import { AppSyncModelTypeScriptVisitor } from './appsync-typescript-visitor';
import { CodeGenEnum, CodeGenModel, ParsedAppSyncModelConfig, RawAppSyncModelConfig } from './appsync-visitor';

export interface RawAppSyncModelJavaScriptConfig extends RawAppSyncModelConfig {
  /**
   * @name isDeclaration
   * @type boolean
   * @description required, the language target for generated code
   *
   * @example
   * ```yml
   * generates:
   * Models:
   * config:
   *    target: 'javascript'
   *    isDelcaration: true
   *  plugins:
   *    - amplify-codegen-appsync-model-plugin
   * ```
   * isDeclaration: true| false
   */
  isDeclaration?: boolean;
}

export interface ParsedAppSyncModelJavaScriptConfig extends ParsedAppSyncModelConfig {
  isDeclaration: boolean;
}

export class AppSyncModelJavascriptVisitor<
  TRawConfig extends RawAppSyncModelJavaScriptConfig = RawAppSyncModelJavaScriptConfig,
  TPluginConfig extends ParsedAppSyncModelJavaScriptConfig = ParsedAppSyncModelJavaScriptConfig
> extends AppSyncModelTypeScriptVisitor<TRawConfig, TPluginConfig> {
  protected IMPORT_STATEMENTS = ['import { ModelInit, MutableModel, PersistentModelConstructor } from "@aws-amplify/datastore";'];

  constructor(
    schema: GraphQLSchema,
    rawConfig: TRawConfig,
    additionalConfig: Partial<TPluginConfig>,
    defaultScalars: NormalizedScalarsMap = DEFAULT_SCALARS
  ) {
    super(schema, rawConfig, additionalConfig, defaultScalars);
    this._parsedConfig.isDeclaration = rawConfig.isDeclaration || false;
  }

  generate(): string {
    this.processDirectives();
    if (this._parsedConfig.isDeclaration) {
      const imports = this.generateImports();
      const enumDeclarations = Object.values(this.enumMap)
        .map(enumObj => this.generateEnumDeclarations(enumObj, true))
        .join('\n\n');

      const modelDeclarations = Object.values(this.typeMap)
        .map(typeObj => this.generateModelDeclaration(typeObj, true))
        .join('\n\n');

      return [imports, '', enumDeclarations, '', modelDeclarations].join('\n');
    } else {
      const imports = this.generateImportsJavaScriptImplementation();
      const enumDeclarations = Object.values(this.enumMap)
        .map((e: CodeGenEnum) => this.generateEnumObject(e))
        .join('\n');

      const modelInitialization = this.generateModelInitialization(Object.values(this.typeMap), false);

      const modelExports = this.generateExports([...Object.values(this.typeMap), ...Object.values(this.enumMap)]);
      return [imports, '', enumDeclarations, '', modelInitialization, '', modelExports].join('\n');
    }
  }

  /**
   * Generate JavaScript object for enum. The generated objet. For an enum with value
   * enum status {
   * pending
   * done
   * }
   * the generated object would be
   * const Status = {
   *    "PENDING": "pending",
   *    "DONE": "done",
   * }
   * @param enumObj: CodeGenEnun codegen enum object
   * @param exportEnum: boolean export the enum object
   */
  protected generateEnumObject(enumObj: CodeGenEnum, exportEnum: boolean = false): string {
    const enumName = this.getEnumName(enumObj);
    const header = [exportEnum ? 'export' : null, 'const', enumName].filter(h => h).join(' ');

    return `${header} = ${JSON.stringify(enumObj.values, null, 2)};`;
  }

  /**
   * Generate import statements to be used in the JavaScript model file
   */
  protected generateImportsJavaScriptImplementation(): string {
    return ['// @ts-check', "import { initSchema } from '@aws-amplify/datastore';", "import { schema } from './schema';"].join('\n');
  }

  protected generateModelTypeDeclarationName(model: CodeGenModel): string {
    return `${this.getModelName(model)}`;
  }
}
