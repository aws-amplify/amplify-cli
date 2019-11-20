import { indent, indentMultiline } from '@graphql-codegen/visitor-plugin-common';
import { camelCase, lowerCaseFirst } from 'change-case';
import { SwiftDeclarationBlock } from '../languages/swift-declaration-block';
import { AppSyncModelVisitor, CodeGenField, CodeGenGenerateEnum, CodeGenModel } from './appsync-visitor';
const schemaTypeMap: Record<string, string> = {
  String: '.string',
  AWSDate: '.dateTime',
  AWSTime: '.dateTime',
  Boolean: '.bool',
};
export class AppSyncSwiftVisitor extends AppSyncModelVisitor {
  protected modelExtensionImports: string[] = ['import Amplify', 'import Foundation'];
  protected imports: string[] = ['import Foundation'];
  generate(): string {
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
        structBlock.addProperty(field.name, fieldType, undefined, 'public', {
          optional: field.isNullable,
          isList: field.isList,
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
        {},
        'MARK: constructor'
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

    Object.entries(this.getSelectedModels())
      .filter(([_, m]) => m.type === 'model')
      .forEach(([_, model]) => {
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
      .withComment('Contains the set of classes that conforms to the `Model` protocol.');

    classDeclaration.addProperty('version', 'String', `"${this.computeVersion()}"`, 'public', { static: true });
    const impl: string = ['return [', indentMultiline(structList.join(',\n')), ']'].join('\n');
    classDeclaration.addClassMethod('get', '[Model.Type]', impl, undefined, 'public', { static: true });

    result.push(classDeclaration.string);

    return result.join('\n');
  }

  private getInitBody(fields: CodeGenField[]): string {
    let result = fields.map(field => {
      return indent(`self.${field.name} = ${field.name}`);
    });

    return result.join('\n');
  }
  protected getListType(typeStr: string): string {
    return `${typeStr}`;
  }

  private generateFieldSchema(field: CodeGenField, modelKeysName: string): string {
    if (field.type === 'ID') {
      return `.id()`;
    }
    let ofType;
    const isEnumType = this.isEnumType(field);
    const isModelType = this.isModelType(field);
    if (field.isList) {
      ofType = `.collection(of: ${this.getSwiftModelTypeName(field)})`;
    } else {
      const typeName = this.getSwiftModelTypeName(field);
      if (isEnumType) {
        ofType = `.enum(${typeName})`;
      } else if (isModelType) {
        ofType = `.model(${typeName})`;
      } else {
        ofType = typeName;
      }
    }

    const name = `${modelKeysName}.${this.getFieldName(field)}`;
    const isRequired = field.isNullable ? '.optional' : '.required';
    const connection = this.getFieldConnection(field);
    const args = [`${name}`, `is: ${isRequired}`, `ofType: ${ofType}`, connection].filter(arg => arg).join(', ');
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

  private getFieldConnection(field: CodeGenField): string | void {
    //connection
    const connectionDirective = field.directives.find(d => d.name === 'connection');
    if (connectionDirective) {
      const connectionArgs = Object.entries(connectionDirective.arguments).map(([name, value]) => {
        return `${name}: "${value}"`;
      });
      return `.connected(${connectionArgs.join(', ')})`;
    }
  }

  protected getEnumValue(value: string): string {
    return camelCase(value);
  }
}
