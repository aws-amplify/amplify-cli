import { AppSyncLocalVisitor, CodeGenModel, CodeGenField, TypeInfo } from './appsync-visitor';
import { SwiftDeclarationBlock } from '../languages/swift-declaration-block';
import { indent } from '@graphql-codegen/visitor-plugin-common';

const DIRECTIVE_NAME_TO_PROTOCOL_MAP = {
  model: 'Model',
  searchable: 'Searchable',
  versioned: 'Versionable',
  auth: 'Authorizable',
};

export class AppSyncSwiftVisitor extends AppSyncLocalVisitor {
  protected SCALAR_TYPE_MAP: { [key: string]: string } = {
    String: 'String',
    Int: 'Int',
    Boolean: 'Bool',
    ID: 'String',
    Float: 'Float',
  };

  generate(): string {
    if (this._parsedConfig.metadata) {
      return this.generateMetaData();
    }
    return this.generateStruct();
  }
  generateStruct(): string {
    let result: string[] = [];
    Object.entries(this.getSelectedModels()).forEach(([name, obj]) => {
      const structBlock: SwiftDeclarationBlock = new SwiftDeclarationBlock()
        .withName(this.getModelName(obj))
        .access('public')
        .withProtocols(['model']);
      Object.entries(obj.fields).forEach(([fieldName, field]) => {
        const fieldType = this.getNativeType(field);
        structBlock.addProperty(field.name, fieldType, undefined, 'public', {
          optional: field.isNullable,
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
          flags: { optional: field.isNullable, list: field.isList },
        })),
        'public',
        {},
        'MARK: constructor'
      );
      result.push(structBlock.string);
    });
    return result.join('\n\n');
  }

  generateMetaData(): string {
    let result: string[] = [];
    Object.entries(this.getSelectedModels())
      .filter(([_, m]) => m.type === 'model')
      .forEach(([_, model]) => {
        const metaData = [
          this.generateCodingKeys(this.getModelName(model), model),
          this.generateModelMetaData(this.getModelName(model), model),
        ];
        result.push(...metaData);
      });
    return result.join('\n\n');
  }

  generateCodingKeys(name: string, model: CodeGenModel): string {
    const codingKeyEnum: SwiftDeclarationBlock = new SwiftDeclarationBlock()
      .asKind('enum')
      .access('public')
      .withName('CodingKeys')
      .withProtocols(['String', 'CodingKey', 'CaseIterable']);

    // AddEnums.name
    model.fields.forEach(field => codingKeyEnum.addEnumValue(this.getFieldName(field)));
    const codingKeysExtension: SwiftDeclarationBlock = new SwiftDeclarationBlock()
      .asKind('extension')
      .withName(name)
      .withComment('Mark: CodingKeys')
      .withBlock(codingKeyEnum.string);
    return codingKeysExtension.string;
  }

  generateModelMetaData(name: string, model: CodeGenModel): string {
    const modelMetaData: SwiftDeclarationBlock = new SwiftDeclarationBlock()
      .asKind('extension')
      .withName(name)
      .withProtocols(['ModelMetadata'])
      .withComment('MARK: model metadata');

    modelMetaData.addProperty('primaryKey', 'CodingKey', 'CodingKeys.id', 'public', {
      static: true,
    });
    modelMetaData.addProperty('properties', 'ModelProperties', 'CodingKeys.allCases', 'public', {
      static: true,
    });
    return modelMetaData.string;
  }

  private getInitBody(fields: CodeGenField[]): string {
    let result = fields.map(field => {
      return indent(`self.${field.name} = ${field.name}`);
    });

    return result.join('\n');
  }
}
