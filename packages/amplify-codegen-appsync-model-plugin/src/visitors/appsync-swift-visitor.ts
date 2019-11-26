import { indent, indentMultiline } from '@graphql-codegen/visitor-plugin-common';
import { camelCase, lowerCaseFirst } from 'change-case';
import { SwiftDeclarationBlock } from '../languages/swift-declaration-block';
import { AppSyncModelVisitor, CodeGenField, CodeGenGenerateEnum, CodeGenModel } from './appsync-visitor';
import { CodeGenConnectionType } from '../utils/process-connections';
const schemaTypeMap: Record<string, string> = {
  String: '.string',
  AWSDate: '.dateTime',
  AWSTime: '.dateTime',
  Boolean: '.bool',
};
export class AppSyncSwiftVisitor extends AppSyncModelVisitor {
  protected modelExtensionImports: string[] = ['import Amplify', 'import Foundation'];
  protected imports: string[] = ['import Amplify', 'import Foundation'];
  generate(): string {
    this.processConnectionDirective();
    if (this._parsedConfig.generate === CodeGenGenerateEnum.metadata) {
      return this.generateSchema();
    }
    if (this._parsedConfig.generate === CodeGenGenerateEnum.loader) {
      return this.generateClassLoader();
    }

    if (this.selectedTypeIsEnum()) {
      return this.generateEnums();
    }
    return this.generateStruct();
  }
  generateStruct(): string {
    let result: string[] = [...this.imports, ''];
    Object.entries(this.getSelectedModels()).forEach(([name, obj]) => {
      const structBlock: SwiftDeclarationBlock = new SwiftDeclarationBlock()
        .withName(this.getModelName(obj))
        .access('public')
        .withProtocols(['Model']);
      Object.entries(obj.fields).forEach(([fieldName, field]) => {
        const fieldType = this.getNativeType(field);
        const isVariable = field.name !== 'id';
        structBlock.addProperty(field.name, fieldType, undefined, 'public', {
          optional: field.isNullable,
          isList: field.isList,
          variable: isVariable,
        });
      });
      const initImpl: string = this.getInitBody(obj.fields);
      structBlock.addClassMethod(
        'init',
        null,
        initImpl,
        obj.fields.map(field => ({
          name: this.getFieldName(field),
          type: this.getNativeType(field),
          value: field.name === 'id' ? 'UUID().uuidString' : undefined,
          flags: { optional: field.isNullable, isList: field.isList },
        })),
        'public',
        {}
      );
      result.push(structBlock.string);
    });
    return result.join('\n');
  }
  generateEnums(): string {
    const result: string[] = [...this.imports, ''];
    Object.entries(this.getSelectedEnums()).forEach(([name, enumValue]) => {
      const enumDeclaration = new SwiftDeclarationBlock()
        .asKind('enum')
        .access('public')
        .withProtocols(['String'])
        .withName(this.getEnumName(enumValue));

      Object.entries(enumValue.values).forEach(([name, value]) => {
        enumDeclaration.addEnumValue(name, value);
      });

      result.push(enumDeclaration.string);
    });
    return result.join('\n');
  }

  generateSchema(): string {
    let result: string[] = [...this.modelExtensionImports, ''];

    Object.values(this.getSelectedModels())
      .filter(m => m.type === 'model')
      .forEach(model => {
        const schemaDeclarations = new SwiftDeclarationBlock().asKind('extension').withName(this.getModelName(model));

        this.generateCodingKeys(this.getModelName(model), model, schemaDeclarations),
          this.generateModelSchema(this.getModelName(model), model, schemaDeclarations);

        result.push(schemaDeclarations.string);
      });
    return result.join('\n');
  }

  generateCodingKeys(name: string, model: CodeGenModel, extensionDeclaration: SwiftDeclarationBlock): void {
    const codingKeyEnum: SwiftDeclarationBlock = new SwiftDeclarationBlock()
      .asKind('enum')
      .access('public')
      .withName('CodingKeys')
      .withProtocols(['String', 'ModelKey'])
      .withComment('MARK: - CodingKeys');

    // AddEnums.name
    model.fields.forEach(field => codingKeyEnum.addEnumValue(this.getFieldName(field), field.name));
    extensionDeclaration.appendBlock(codingKeyEnum.string);

    // expose keys
    extensionDeclaration.addProperty('keys', '', 'CodingKeys.self', 'public', {
      static: true,
      variable: false,
    });
  }

  generateModelSchema(name: string, model: CodeGenModel, extensionDeclaration: SwiftDeclarationBlock): void {
    const keysName = lowerCaseFirst(model.name);
    const fields = model.fields.map(field => {
      return this.generateFieldSchema(field, keysName);
    });

    const closure = [
      '{ model in',
      `let ${keysName} = ${this.getModelName(model)}.keys`,
      '',
      'model.fields(',
      indentMultiline(fields.join(',\n')),
      ')',
      '}',
    ].join('\n');
    extensionDeclaration.addProperty(
      'schema',
      '',
      `defineSchema ${indentMultiline(closure).trim()}`,
      'public',
      { static: true, variable: false },
      ' MARK: - ModelSchema'
    );
  }

  protected generateClassLoader(): string {
    const structList = Object.values(this.typeMap).map(typeObj => {
      return `${this.getModelName(typeObj)}.self`;
    });

    const result: string[] = [...this.modelExtensionImports, ''];

    const classDeclaration = new SwiftDeclarationBlock()
      .access('public')
      .withName('AmplifyModels')
      .asKind('class')
      .final()
      .withProtocols(['DataStoreModelRegistration'])
      .withComment('Contains the set of classes that conforms to the `Model` protocol.');

    classDeclaration.addProperty('version', 'String', `"${this.computeVersion()}"`, 'public', {});
    const body = structList.map(modelClass => `ModelRegistry.register(modelType: ${modelClass})`).join('\n');
    classDeclaration.addClassMethod('registerModels', null, body, undefined, 'public', {});

    result.push(classDeclaration.string);

    return result.join('\n');
  }

  private getInitBody(fields: CodeGenField[]): string {
    let result = fields.map(field => {
      const fieldName = this.getFieldName(field);
      return indent(`self.${fieldName} = ${fieldName}`);
    });

    return result.join('\n');
  }
  protected getListType(typeStr: string): string {
    return `${typeStr}`;
  }

  private generateFieldSchema(field: CodeGenField, modelKeysName: string): string {
    if (field.type === 'ID' && field.name === 'id') {
      return `.id()`;
    }
    let ofType;
    const isEnumType = this.isEnumType(field);
    const isModelType = this.isModelType(field);
    const name = `${modelKeysName}.${this.getFieldName(field)}`;
    const typeName = this.getSwiftModelTypeName(field);
    const { connectionInfo } = field;
    // connected field
    if (connectionInfo) {
      if (connectionInfo.kind === CodeGenConnectionType.HAS_MANY) {
        return `.hasMany(${name}, ofType: ${typeName}, associatedWith: ${this.getModelName(
          connectionInfo.connectedModel
        )}.keys.${this.getFieldName(connectionInfo.associatedWith)})`;
      }
      if (connectionInfo.kind === CodeGenConnectionType.HAS_ONE) {
        return `.hasOne(${name}, ofType: ${typeName}, associatedWith: ${this.getModelName(
          connectionInfo.connectedModel
        )}.keys.${this.getFieldName(connectionInfo.associatedWith)})`;
      }
      if (connectionInfo.kind === CodeGenConnectionType.BELONGS_TO) {
        return `.belongsTo(${name}, ofType: ${typeName}, targetName: "${connectionInfo.targetName}")`;
      }
    }

    if (field.isList) {
      ofType = `.collection(of: ${this.getSwiftModelTypeName(field)})`;
    } else {
      if (isEnumType) {
        ofType = `.enum(${typeName})`;
      } else if (isModelType) {
        ofType = `.model(${typeName})`;
      } else {
        ofType = typeName;
      }
    }

    const isRequired = field.isNullable ? '.optional' : '.required';
    const args = [`${name}`, `is: ${isRequired}`, `ofType: ${ofType}`].filter(arg => arg).join(', ');
    return `.field(${args})`;
  }

  private getSwiftModelTypeName(field: CodeGenField) {
    if (this.isEnumType(field)) {
      return `${this.getEnumName(field.type)}.self`;
    }
    if (this.isModelType(field)) {
      return `${this.getModelName(this.typeMap[field.type])}.self`;
    }
    if (field.type in schemaTypeMap) {
      return schemaTypeMap[field.type];
    }
    // TODO: investigate if returning string is acceptable or should throw an exception
    return '.string';
  }

  protected getEnumValue(value: string): string {
    return camelCase(value);
  }

  protected getFieldName(field: CodeGenField): string {
    return camelCase(field.name);
  }
}
