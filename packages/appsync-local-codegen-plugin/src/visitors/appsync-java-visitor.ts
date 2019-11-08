import { JavaDeclarationBlock } from '@graphql-codegen/java-common';
import { pascalCase, camelCase, upperCase } from 'change-case';
import {
  AppSyncLocalVisitor,
  CodeGenModel,
  CodeGenField,
  CodeGenEnum,
  RawAppSyncLocalConfig,
  ParsedAppSyncLocalConfig,
} from './appsync-visitor';
import { indent, indentMultiline, DEFAULT_SCALARS, NormalizedScalarsMap, buildScalars } from '@graphql-codegen/visitor-plugin-common';
import { isScalarType, GraphQLSchema } from 'graphql';
import { directives } from '../directives';
import { isArray } from 'util';

// Fields which can not be using builder,

const IMPORT_PKGS = [
  'java.util.List',
  'java.util.UUID',
  'java.util.Objects',
  '',
  'com.amplifyframework.datastore.annotations.Connection',
  'com.amplifyframework.datastore.annotations.Field',
  'com.amplifyframework.datastore.annotations.Index',
  'com.amplifyframework.datastore.model.Model',
  '',
];

const PKG_NAME = 'com.amplify.datastore.generated';

export class AppSyncJavaVisitor<
  TRawConfig extends RawAppSyncLocalConfig = RawAppSyncLocalConfig,
  TPluginConfig extends ParsedAppSyncLocalConfig = ParsedAppSyncLocalConfig
> extends AppSyncLocalVisitor<TRawConfig, TPluginConfig> {
  protected additionalPackages: Set<string> = new Set();

  generate(): string {
    if (this.selectedTypeIsEnum()) {
      return this.generateEnums();
    }
    return this.generateClasses();
  }

  generateEnums(): string {
    const result: string[] = [this.generatePackageName()];
    Object.entries(this.getSelectedEnums()).forEach(([name, enumValue]) => {
      const enumDeclaration = new JavaDeclarationBlock()
        .asKind('enum')
        .access('public')
        .withName(this.getEnumName(enumValue));
      const body = Object.entries(enumValue.values).map(([name, value]) => {
        return `${name}("${value}")`;
      });
      enumDeclaration.withBlock(indentMultiline(body.join(',\n') + ';'));
      result.push(enumDeclaration.string);
    });
    return result.join('\n');
  }

  generateClasses(): string {
    const result: string[] = [];
    Object.entries(this.getSelectedModels()).forEach(([name, model]) => {
      const modelDeclaration = this.generateClass(model);
      result.push(...[modelDeclaration]);
    });
    const packageDeclaration = this.generatePackageHeader();
    return [packageDeclaration, ...result].join('\n');
  }

  generatePackageName(): string {
    return `package ${PKG_NAME};`;
  }
  generateClass(model: CodeGenModel): string {
    const classDeclarationBlock = new JavaDeclarationBlock()
      .asKind('class')
      .access('public')
      .withName(model.name)
      .implements(['Model']);

    const annotations = this.generateModelAnnotations(model);
    classDeclarationBlock.annotate(annotations);

    model.fields.forEach(field => {
      this.generateField(field, classDeclarationBlock);
    });

    // step interface declarations
    this.generateStepBuilderInterfaces(model).forEach((builderInterface: JavaDeclarationBlock) => {
      classDeclarationBlock.nestedClass(builderInterface);
    });

    // builder
    this.generateBuilderClass(model, classDeclarationBlock);

    // getters
    this.generateGetters(model, classDeclarationBlock);

    // constructor
    this.generateConstructor(model, classDeclarationBlock);
    return classDeclarationBlock.string;
  }

  protected generatePackageHeader(): string {
    const imports = [...Array.from(this.additionalPackages), '', ...IMPORT_PKGS].map(pkg => (pkg ? `import ${pkg};` : ''));
    return [this.generatePackageName(), '', ...imports].join('\n');
  }

  /**
   * Add fields as members of the class
   * @param field
   * @param classDeclarationBlock
   */
  protected generateField(field: CodeGenField, classDeclarationBlock: JavaDeclarationBlock): void {
    const annotations = this.generateFieldAnnotations(field);
    const fieldType = this.getNativeType(field);
    const fieldName = this.getFieldName(field);
    classDeclarationBlock.addClassMember(fieldName, fieldType, '', annotations, 'private', {
      final: true,
    });
  }

  protected generateStepBuilderInterfaces(model: CodeGenModel): JavaDeclarationBlock[] {
    const nonNullableFields = model.fields.filter(field => !field.isNullable);
    const nullableFields = model.fields.filter(field => field.isNullable);
    const nonIdFields = nonNullableFields.filter((field: CodeGenField) => !this.READ_ONLY_FIELDS.includes(field.name));
    const interfaces = nonIdFields.map((field, idx) => {
      const fieldName = this.getFieldName(field);
      const isLastField = nonIdFields.length - 1 === idx ? true : false;
      const returnType = isLastField ? 'Build' : nonIdFields[idx + 1].name;
      const interfaceName = this.getStepInterfaceName(field.name);
      const interfaceDeclaration = new JavaDeclarationBlock()
        .asKind('interface')
        .withName(interfaceName)
        .access('public');
      interfaceDeclaration.withBlock(
        indent(`${this.getStepInterfaceName(returnType)} ${fieldName}(${this.getNativeType(field)} ${fieldName});`)
      );
      return interfaceDeclaration;
    });

    // Builder
    const builder = new JavaDeclarationBlock()
      .asKind('interface')
      .withName(this.getStepInterfaceName('Build'))
      .access('public');
    const builderBody = [];
    builderBody.push(`${this.getModelName(model)} build();`);
    nullableFields.forEach((field, idx) => {
      const fieldName = this.getFieldName(field);
      builderBody.push(`${this.getStepInterfaceName('Build')} ${fieldName}(${this.getNativeType(field)} ${fieldName});`);
    });

    builder.withBlock(indentMultiline(builderBody.join('\n')));
    return [...interfaces, builder];
  }

  /**
   * Generate the Builder class
   * @param model
   * @returns JavaDeclarationBlock
   */
  protected generateBuilderClass(model: CodeGenModel, classDeclaration: JavaDeclarationBlock): void {
    const nonNullableFields = model.fields.filter(field => !field.isNullable);
    const nullableFields = model.fields.filter(field => field.isNullable);
    const writeableFields = nullableFields.filter((field: CodeGenField) => !this.READ_ONLY_FIELDS.includes(field.name));
    const stepInterfaces = writeableFields.map((field: CodeGenField) => {
      return this.getStepInterfaceName(field.name);
    });

    const builderClassDeclaration = new JavaDeclarationBlock()
      .access('public')
      .static()
      .asKind('class')
      .withName('Builder')
      .implements([...stepInterfaces, this.getStepInterfaceName('Build')]);

    // Add private instance fields
    [...nonNullableFields, ...nullableFields].forEach((field: CodeGenField) => {
      const fieldName = this.getFieldName(field);
      builderClassDeclaration.addClassMember(fieldName, this.getNativeType(field), '', undefined, 'private');
    });

    // methods
    // build();
    builderClassDeclaration.addClassMethod(
      'build',
      this.getModelName(model),
      indentMultiline([`this.id = UUID.randomUUID().toString();`, `return new ${this.getModelName(model)}(this);`].join('\n')),
      undefined,
      [],
      'public',
      {},
      ['Override']
    );

    // non-nullable fields
    writeableFields.forEach((field: CodeGenField, idx: number, fields) => {
      const isLastStep = idx === fields.length - 1;
      const fieldName = this.getFieldName(field);
      const returnType = isLastStep ? this.getStepInterfaceName('Build') : this.getStepInterfaceName(fields[idx + 1].name);
      const argumentType = this.getNativeType(field);
      const argumentName = fieldName;
      const body = [`Objects.requireNonNull(${fieldName});`, `this.${fieldName} = ${argumentName};`, `return this;`].join('\n');
      builderClassDeclaration.addClassMethod(
        fieldName,
        returnType,
        indentMultiline(body),
        [{ name: argumentName, type: argumentType }],
        [],
        'public',
        {},
        ['Override']
      );
    });

    // nullable fields
    nullableFields.forEach((field: CodeGenField) => {
      const fieldName = this.getFieldName(field);
      const returnType = this.getStepInterfaceName('Build');
      const argumentType = this.getNativeType(field);
      const argumentName = fieldName;
      const body = [`this.${fieldName} = ${argumentName};`, `return this;`].join('\n');
      builderClassDeclaration.addClassMethod(
        fieldName,
        returnType,
        indentMultiline(body),
        [{ name: argumentName, type: argumentType }],
        [],
        'public',
        {},
        ['Override']
      );
    });
    classDeclaration.nestedClass(builderClassDeclaration);
  }

  /**
   * Generate getters for all the fields declared in the model. All the getter methods are added
   * to the declaration block passed
   * @param model
   * @param declarationsBlock
   */
  protected generateGetters(model: CodeGenModel, declarationsBlock: JavaDeclarationBlock): void {
    model.fields.forEach((field: CodeGenField) => {
      const fieldName = this.getFieldName(field);
      const returnType = this.getNativeType(field);
      const methodName = `get${pascalCase(field.name)}`;
      const body = indent(`return ${fieldName};`);
      declarationsBlock.addClassMethod(methodName, returnType, body, undefined, undefined, 'public');
    });
  }

  /**
   * Generate constructor for the class
   * @param model CodeGenModel
   * @param declarationsBlock Class Declaration block to which constructor will be added
   */
  protected generateConstructor(model: CodeGenModel, declarationsBlock: JavaDeclarationBlock): void {
    const name = this.getModelName(model);
    const body = model.fields
      .map((field: CodeGenField) => {
        const fieldName = this.getFieldName(field);
        return `this.${fieldName} = builder.${fieldName};`;
      })
      .join('\n');

    declarationsBlock.addClassMethod(
      name,
      null,
      body,
      [
        {
          name: 'builder',
          type: 'Builder',
        },
      ],
      undefined,
      'private'
    );
  }

  protected getNativeType(field: CodeGenField): string {
    const nativeType = super.getNativeType(field);
    if (nativeType.includes('.')) {
      const classSplit = nativeType.split('.');
      this.additionalPackages.add(nativeType);
      return classSplit[classSplit.length - 1];
    }
    return nativeType;
  }

  /**
   * Generate the name of the step builder interface
   * @param nextFieldName: string
   * @returns string
   */
  private getStepInterfaceName(nextFieldName: string): string {
    return `I${pascalCase(nextFieldName)}Step`;
  }

  protected generateModelAnnotations(model: CodeGenModel): string[] {
    const annotations: string[] = model.directives.map(directive => {
      switch (directive.name) {
        case 'model':
          return `ModelConfig(targetName = "${model.name}")`;
          break;
        case 'key':
          const args: string[] = [];
          args.push(`name = "${directive.arguments.name}"`);
          args.push(`fields = {${(directive.arguments.fields as string[]).map((f: string) => `"${f}"`).join(',')}}`);
          return `Index(${args.join(', ')})`;

        default:
          break;
      }
      return '';
    });
    return annotations.filter(annotation => annotation);
  }

  protected generateFieldAnnotations(field: CodeGenField): string[] {
    const annotations: string[] = [];
    const annotationArgs: string[] = [
      `targetName="${field.name}"`,
      `targetType="${field.type}"`,
      !field.isNullable ? 'isRequired = true' : '',
    ].filter(arg => arg);

    annotations.push(`ModelField(${annotationArgs.join(', ')})`);

    field.directives.forEach(annotation => {
      switch (annotation.name) {
        case 'connection':
          const connectionArgs: string[] = [];
          Object.keys(annotation.arguments).forEach(argName => {
            if (['name', 'keyField', 'sortField', 'keyName'].includes(argName)) {
              connectionArgs.push(`${argName} = "${annotation.arguments[argName]}"`);
            }
          });
          if (annotation.arguments.limit) {
            connectionArgs.push(`limit = ${annotation.arguments.limit}`);
          }
          if (annotation.arguments.fields && isArray(annotation.arguments.fields)) {
            const fieldArgs = (annotation.arguments.fields as string[]).map(f => `"${f}"`).join(', ');
            connectionArgs.push(`fields = {{${fieldArgs}}`);
          }

          if (connectionArgs.length) {
            annotations.push(`Connection(${connectionArgs.join(', ')})`);
          }
      }
    });
    return annotations;
  }
}
