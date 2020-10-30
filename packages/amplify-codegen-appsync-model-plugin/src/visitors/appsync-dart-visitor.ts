import { AppSyncModelVisitor, ParsedAppSyncModelConfig, RawAppSyncModelConfig, CodeGenModel, CodeGenField } from './appsync-visitor';
import { DartDeclarationBlock } from '../languages/dart-declaration-block';
import { CodeGenConnectionType } from '../utils/process-connections';
import { indent, indentMultiline } from '@graphql-codegen/visitor-plugin-common';
import { AuthDirective, AuthStrategy } from '../utils/process-auth';
import { printWarning } from '../utils/warn';

const typeToEnumMap: { [name: string] : string} = {
  String: 'string',
  Int: 'int',
  Float: 'double',
  Boolean: 'bool',
  AWSDate: 'date',
  AWSDateTime: 'dateTime',
  AWSTime: 'time',
  AWSTimestamp: 'timestamp',
};
const BASE_IMPORT_PACKAGES = [
  'package:flutter/foundation.dart',
  'package:flutter_modelschema/src/ModelSchema/types.dart'
];
const COLLECTION_PACKAGE = 'package:collection/collection.dart'
export class AppSyncModelDartVisitor<
  TRawConfig extends RawAppSyncModelConfig = RawAppSyncModelConfig,
  TPluginConfig extends ParsedAppSyncModelConfig = ParsedAppSyncModelConfig
> extends AppSyncModelVisitor<TRawConfig, TPluginConfig> {

  generate() : string {
    this.processDirectives();
    return this.generateModelClasses();
  }

  /**
   * Generate classes with model directives
   */
  protected generateModelClasses(): string {
    const result: string[] = [];
    const packageImports = this.generatePackageHeader();
    result.push(packageImports);
    Object.entries(this.getSelectedModels()).forEach(([name, model]) => {
      const modelDeclaration = this.generateModelClass(model);
      const modelType = this.generateModelType(model);
      const modelSchema = this.generateModelSchema(model);

      result.push(modelDeclaration);
      result.push(modelType);
      result.push(modelSchema)
    });
    return result.join('\n');
  }

  protected generatePackageHeader(): string {
    const additionalPackages: Set<string> = new Set();
    let usingCollection = false;
    const selectedModelTypes = Object.keys(this.getSelectedModels());
    Object.entries(this.getSelectedModels()).forEach(([name, model]) => {
      model.fields.forEach(f => {
        if (f.isList) {
          usingCollection = true;
        }
        if (this.isModelType(f) && !(f.type in selectedModelTypes)) {
          additionalPackages.add(f.type);
        }
      });
    });
    const baseImport = [
      ...BASE_IMPORT_PACKAGES,
      usingCollection ? COLLECTION_PACKAGE : ''
    ].filter(f => f).map(pckg => `import '${pckg}';`).join('\n');
    const additionalImport = Array.from(additionalPackages).map(name => `import '${name}.dart';`).join('\n');
    return [baseImport, additionalImport].filter(f => f).join('\n\n') + '\n';
  }

  protected generateModelClass(model: CodeGenModel): string {
    //class wrapper
    const classDeclarationBlock = new DartDeclarationBlock()
      .asKind('class')
      .withName(this.getModelName(model))
      .extends(['Model'])
      .withComment(`This is an auto generated class representing the ${model.name} type in your schema.`)
      .annotate(['immutalbe']);
    //model type field
    classDeclarationBlock.addClassMember(
      'classType',
      '',
      `${this.getModelName(model)}Type()`,
      { static: true, const: true }
    );
    //model fields
    model.fields.forEach(field => {
      this.generateModelField(field, '', classDeclarationBlock);
    });
    //getId
    this.generateGetIdMethod(model, classDeclarationBlock);
    //constructor
    this.generateConstructor(model, classDeclarationBlock);
    //equals
    this.generateEqualsMethodAndOperator(model, classDeclarationBlock);
    //hashCode
    this.generateHashCodeMethod(model, classDeclarationBlock);
    //toString
    this.generateToStringMethod(model, classDeclarationBlock);
    //copyWith
    this.generateCopyWithMethod(model, classDeclarationBlock);
    //de/serialization method
    this.generateSerializationMethod(model, classDeclarationBlock);
    return classDeclarationBlock.string;
  }

  protected generateModelType(model: CodeGenModel): string {
    const modelName = this.getModelName(model);
    const classDeclarationBlock = new DartDeclarationBlock()
      .asKind('class')
      .withName(`${modelName}Type`)
      .extends([`ModelType<${modelName}>`]);
    classDeclarationBlock.addClassMethod(
      `${modelName}Type`,
      '',
      [],
      ';',
      { const: true, isBlock: false }
    );
    classDeclarationBlock.addClassMethod(
      'createInstance',
      modelName,
      [],
      `return ${modelName}();`
    );
    return classDeclarationBlock.string;
  }

  protected generateModelSchema(model: CodeGenModel): string {
    const classDeclarationBlock = new DartDeclarationBlock()
      .asKind('extension')
      .withName(`${this.getModelName(model)}Schema`)
      .extensionOn(this.getModelName(model));
    //QueryField
    model.fields.forEach(field => {
      this.generateQueryField(field, classDeclarationBlock);
    });
    //schema
    this.generateSchemaField(model, classDeclarationBlock);
    return classDeclarationBlock.string;
  }

  /**
   * Generate code for fields inside models
   * @param field
   * @param value
   * @param classDeclarationBlock
   */
  protected generateModelField(field: CodeGenField, value: string, classDeclarationBlock: DartDeclarationBlock): void {
    const fieldType = this.getNativeType(field);
    const fieldName = this.getFieldName(field);
    classDeclarationBlock.addClassMember(fieldName, fieldType, value, { final: true });
  }

  protected generateGetIdMethod(model: CodeGenModel, declarationBlock: DartDeclarationBlock) : void {
    declarationBlock.addClassMethod(
      'getId',
      'String',
      [],
      'return id;',
      {},
      ['override']
    );
  }

  protected generateConstructor(model: CodeGenModel, declarationBlock: DartDeclarationBlock) : void {
    //Model._internal
    const args = `{${model.fields.map(f =>
      `${f.isNullable ? '' : '@required '}this.${this.getFieldName(f)}`
    ).join(', ')}}`
    declarationBlock.addClassMethod(
      `${this.getModelName(model)}._internal`,
      '',
      [{name: args}],
      ';',
      { const: true, isBlock: false },
    );
    //factory Model
    const returnParamStr = model.fields.map(field => {
      const fieldName = this.getFieldName(field);
      if (fieldName === 'id') {
        return 'id: id == null ? UUID.getUUID() : id';
      } else if (field.isList) {
        return `${fieldName}: ${fieldName} != null ? List.unmodifiable(${fieldName}) : ${fieldName}`;
      } else {
        return `${fieldName}: ${fieldName}`;
      }
    }).join(',\n');
    const factoryImpl = [
      `return ${this.getModelName(model)}._internal(`,
      indentMultiline(`${returnParamStr});`)
    ].join('\n');
    const factoryParam = `{${model.fields.map(f =>
      `${f.isNullable ? '' : '@required '}${this.getNativeType(f)} ${this.getFieldName(f)}`
    ).join(', ')}}`
    declarationBlock.addClassMethod(
      this.getModelName(model),
      'factory',
      [{name: factoryParam}],
      factoryImpl
    );
  }

  protected generateEqualsMethodAndOperator(model: CodeGenModel, declarationBlock: DartDeclarationBlock) : void {
    //equals
    declarationBlock.addClassMethod(
      'equals',
      'bool',
      [{name: 'other', type: 'Object'}],
      'return this == other;'
    );
    //operator ==
    const equalImpl = [
      'if (identical(other, this)) return true;',
      `return other is ${this.getModelName(model)} &&`,
      indentMultiline(`${model.fields.map(f => {
        const fieldName = this.getFieldName(f);
        return f.isList
          ? `DeepCollectionEquality().equals(${fieldName}, other.${fieldName})`
          : `${fieldName} == other.${fieldName}`
      }).join(' &&\n')};`)
    ].join('\n');
    declarationBlock.addClassMethod(
      'operator ==',
      'bool',
      [{name: 'other', type: 'Object'}],
      equalImpl,
      undefined,
      ['override']
    );
  }

  protected generateHashCodeMethod(model: CodeGenModel, declarationBlock: DartDeclarationBlock) : void {
    //hashcode
    declarationBlock.addClassMethod(
      `get hashCode`,
      `int`,
      undefined,
      ' => toString().hashCode;',
      { isGetter: true, isBlock: false },
      ['override']
    );
  }

  protected generateToStringMethod(model: CodeGenModel, declarationBlock: DartDeclarationBlock) : void {
    //toString
    const fields = this.getNonConnectedField(model);
    declarationBlock.addClassMethod(
      'toString',
      'String',
      [],
      [
        'var buffer = new StringBuffer();',
        `buffer.write("${this.getModelName(model)} {");`,
        ...fields.map((field, index) => {
          const fieldDelimiter = ', ';
          const fieldName = this.getFieldName(field);
          const toStringVal = this.getNativeType(field) === 'String' ? fieldName : `${fieldName}.toString()`;
          if (index !== fields.length -1) {
            return `buffer.write("${fieldName}=" + ${toStringVal} + "${fieldDelimiter}");`;
          }
          return `buffer.write("${fieldName}=" + ${toStringVal});`;
        }),
        `buffer.write("}");`,
        'return buffer.toString();'
      ].join('\n'),
      undefined,
      ['override']
    );
  }

  protected generateCopyWithMethod(model: CodeGenModel, declarationBlock: DartDeclarationBlock) : void {
    //copyWith
    const copyParam = `{${model.fields.map(f =>
      `${f.isNullable ? '' : '@required '}${this.getNativeType(f)} ${this.getFieldName(f)}`
    ).join(', ')}}`
    declarationBlock.addClassMethod(
      'copyWith',
      this.getModelName(model),
      [{name: copyParam}],
      [
        `return ${this.getModelName(model)}(`,
        indentMultiline(`${model.fields.map(field => {
          const fieldName = this.getFieldName(field);
          return `${fieldName}: ${fieldName} ?? this.${fieldName}`
        }).join(',\n')});`)
      ].join('\n')
    );
  }

  protected generateSerializationMethod(model: CodeGenModel, declarationBlock: DartDeclarationBlock) : void {
    //serialization: Model.fromJson
    const serializationImpl = `\n: ${indentMultiline(
      model.fields.map(field => {
        const fieldName = this.getFieldName(field);
        if (this.isModelType(field)){
          if (field.isList) {
            return [
              `${fieldName} = json['${fieldName}'] is List`,
              indent(`? (json['${fieldName}'] as List)`),
              indent(`.map((e) => ${this.getNativeType({...field, isList: false})}.fromJson(e as Map<String, dynamic>))`, 2),
              indent(`.toList()`, 2),
              indent(`: null`)
            ].join('\n');
          }
          return [
            `${fieldName} = json['${fieldName}'] is Map<String, dynamic>`,
            indent(`? ${this.getNativeType(field)}.fromJson(json['${fieldName}'] as Map<String, dynamic>)`),
            indent(`: null`)
          ].join('\n');
        }
        return `${fieldName} = json['${fieldName}']`;
      }).join(',\n')
    ).trim()};`;
    declarationBlock.addClassMethod(
      `${this.getModelName(model)}.fromJson`,
      ``,
      [{name: 'json', type: 'Map<String, dynamic>'}],
      indentMultiline(serializationImpl),
      { isBlock: false }
    );
    //deserialization: toJson
    const deserializationImpl = ` =>\n${indentMultiline(
      `{${model.fields.map(field => {
          const fieldName = this.getFieldName(field);
          if (this.isModelType(field)) {
            if (field.isList) {
              return `'${fieldName}': ${fieldName}.map((e) => e.toJson())`
            }
            return `'${fieldName}': ${fieldName}.toJson()`;
          }
          return `'${fieldName}': ${fieldName}`;
        }).join(', ')
      }}`
    )};`;
    declarationBlock.addClassMethod(
      'toJson',
      'Map<String, dynamic>',
      [],
      deserializationImpl,
      { isBlock: false }
    );
  }

  protected generateQueryField(field: CodeGenField, declarationBlock: DartDeclarationBlock) : void {
    const fieldName = this.getFieldName(field);
    let value = `QueryField(fieldName: "${fieldName}")`;
    if (this.isModelType(field)) {
      value = [
        'QueryField(',
        indent(`fieldName: "${fieldName}",`),
        indent(`fieldType: ModelFieldType(ModelFieldTypeEnum.model, ofModelName: "${this.getNativeType({...field, isList: false})}"))`)
      ].join('\n');
    }
    declarationBlock.addClassMember(
      fieldName,
      'QueryField',
      value,
      { static: true, final: true }
    );
  }

  protected generateSchemaField(model: CodeGenModel, declarationBlock: DartDeclarationBlock) : void {
    const schema = [
      'Model.defineSchema(define: (ModelSchemaDefinition modelSchemaDefinition) {',
      indentMultiline([
        `modelSchemaDefinition.name = "${this.getModelName(model)}";\nmodelSchemaDefinition.pluralName = "${this.pluralizeModelName(model)}";`,
        this.generateAuthRules(model),
        this.generateAddFields(model)
      ].filter(f => f).join('\n\n')),
      '})'
    ].join('\n');
    declarationBlock.addClassMember(
      'schema',
      '',
      schema,
      { static: true, var: true }
    );
  }

  protected generateAuthRules(model: CodeGenModel) : string {
    const authDirectives: AuthDirective[] = model.directives.filter(d => d.name === 'auth') as AuthDirective[];
    if (authDirectives.length) {
      const rules: string[] = [];
      authDirectives.forEach(directive => {
        directive.arguments?.rules.forEach(rule => {
          const authRule : string[] = [];
          switch (rule.allow) {
            case AuthStrategy.owner:
              authRule.push('allow: AuthStrategy.owner');
              authRule.push(`ownerField: "${rule.ownerField}"`);
              authRule.push(`identityClain: "${rule.identityClaim}"`);
              break;
            case AuthStrategy.private:
              authRule.push('allow: AuthStrategy.private');
              break;
            case AuthStrategy.public:
              authRule.push('allow: AuthStrategy.public');
              break;
            case AuthStrategy.groups:
              authRule.push('allow: AuthStrategy.groups');
              authRule.push(`groupClaim: "${rule.groupClaim}"`);
              if (rule.groups) {
                authRule.push(`groups: [ ${rule.groups?.map(group => `"${group}"`).join(', ')} ]`);
              } else {
                authRule.push(`groupsField: "${rule.groupField}"`);
              }
              break;
            default:
              printWarning(`Model has auth with authStrategy ${rule.allow} of which is not yet supported`);
              return '';
          }
          authRule.push(['operations: [',
                          indentMultiline(rule.operations.map(op => `ModelOperation.${op}`).join(',\n')),
                          ']'
                        ].join('\n'));
          rules.push(`AuthRule(\n${indentMultiline(authRule.join(',\n'))})`);
        })
      })
      if (rules.length) {
        return ['modelSchemaDefinition.authRules = [', indentMultiline(rules.join(',\n')), '];'].join('\n');
      }
    }
    return '';
  }

  protected generateAddFields(model: CodeGenModel) : string {
    if (model.fields.length) {
      const fieldsToAdd : string[] = [];
      model.fields.forEach(field => {
        const fieldName = this.getFieldName(field);
        const modelName = this.getModelName(model);
        let fieldParam: string = '';
        //field id
        if (fieldName === 'id') {
          fieldsToAdd.push('ModelFieldDefinition.id()');
        }
        //field with @connection
        else if (field.connectionInfo) {
          const connectedModelName = this.getNativeType({...field, isList: false});
          switch (field.connectionInfo.kind) {
            case CodeGenConnectionType.HAS_ONE:
              fieldParam = [
                `key: ${modelName}Schema.${fieldName}`,
                `isRequired: ${!field.isNullable}`,
                `ofModelName: ${connectedModelName}.classType.getTypeName()`,
                `associatedKey: ${connectedModelName}Schema.${this.getFieldName(field.connectionInfo.associatedWith)}`
              ].join(',\n');
              fieldsToAdd.push(['ModelFieldDeinition.hasOne(', indentMultiline(fieldParam), ')'].join('\n'));
              break;
            case CodeGenConnectionType.HAS_MANY:
              fieldParam = [
                `key: ${modelName}Schema.${fieldName}`,
                `isRequired: ${!field.isNullable}`,
                `ofModelName: ${connectedModelName}.classType.getTypeName()`,
                `associatedKey: ${connectedModelName}Schema.${this.getFieldName(field.connectionInfo.associatedWith)}`
              ].join(',\n');
              fieldsToAdd.push(['ModelFieldDeinition.hasMany(', indentMultiline(fieldParam), ')'].join('\n'));
              break;
            case CodeGenConnectionType.BELONGS_TO:
              fieldParam = [
                `key: ${modelName}Schema.${fieldName}`,
                `isRequired: ${!field.isNullable}`,
                `targetName: "${field.connectionInfo.targetName}"`,
                `ofModelName: ${connectedModelName}.classType.getTypeName()`
              ].join(',\n');
              fieldsToAdd.push(['ModelFieldDeinition.belongsTo(', indentMultiline(fieldParam), ')'].join('\n'));
              break;
          }
        }
        //field with regular types
        else {
          fieldParam = [
            `key: ${modelName}Schema.${fieldName}`,
            `isRequired: ${!field.isNullable}`,
            `ofType: ModelFieldType(ModelFieldTypeEnum.${field.type in typeToEnumMap ? typeToEnumMap[field.type] : 'string'})`
          ].join(',\n');
          fieldsToAdd.push(['ModelFieldDeinition.field(', indentMultiline(fieldParam), ')'].join('\n'));
        }
      });
      return fieldsToAdd.map(field => `modelSchemaDefinition.addField(${field});`).join('\n\n');
    }
    return '';
  }

      /**
   * Get the list of fields that can be are writeable. These fields should exclude the following
   * fields that are connected and are either HAS_ONE or HAS_MANY
   * @param model
   */
  protected getNonConnectedField(model: CodeGenModel): CodeGenField[] {
    return model.fields.filter(f => {
      if (!f.connectionInfo) return true;
      if (f.connectionInfo.kind == CodeGenConnectionType.BELONGS_TO) {
        return true;
      }
    });
  }
}