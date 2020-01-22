import { indent, indentMultiline, transformComment } from '@graphql-codegen/visitor-plugin-common';
import { camelCase, constantCase, pascalCase } from 'change-case';
import dedent from 'ts-dedent';
import {
  CLASS_IMPORT_PACKAGES,
  GENERATED_PACKAGE_NAME,
  LOADER_CLASS_NAME,
  LOADER_IMPORT_PACKAGES,
  CONNECTION_RELATIONSHIP_IMPORTS,
} from '../configs/java-config';
import { JavaDeclarationBlock } from '../languages/java-declaration-block';
import { AppSyncModelVisitor, CodeGenField, CodeGenModel, ParsedAppSyncModelConfig, RawAppSyncModelConfig } from './appsync-visitor';
import { CodeGenConnectionType } from '../utils/process-connections';

export class AppSyncModelJavaVisitor<
  TRawConfig extends RawAppSyncModelConfig = RawAppSyncModelConfig,
  TPluginConfig extends ParsedAppSyncModelConfig = ParsedAppSyncModelConfig
> extends AppSyncModelVisitor<TRawConfig, TPluginConfig> {
  protected additionalPackages: Set<string> = new Set();

  generate(): string {
    this.processDirectives();
    if (this._parsedConfig.generate === 'loader') {
      return this.generateClassLoader();
    }
    if (this.selectedTypeIsEnum()) {
      return this.generateEnums();
    }
    return this.generateClasses();
  }

  generateClassLoader(): string {
    const AMPLIFY_MODEL_VERSION = 'AMPLIFY_MODEL_VERSION';
    const result: string[] = [this.generatePackageName(), '', this.generateImportStatements(LOADER_IMPORT_PACKAGES)];
    result.push(
      transformComment(dedent` Contains the set of model classes that implement {@link Model}
    interface.`)
    );

    const loaderClassDeclaration = new JavaDeclarationBlock()
      .withName(LOADER_CLASS_NAME)
      .access('public')
      .final()
      .asKind('class')
      .implements(['ModelProvider']);

    // Schema version
    // private static final String AMPLIFY_MODELS_VERSION = "hash-code";
    loaderClassDeclaration.addClassMember(AMPLIFY_MODEL_VERSION, 'String', `"${this.computeVersion()}"`, [], 'private', {
      final: true,
      static: true,
    });

    // singleton instance
    // private static AmplifyCliGeneratedModelProvider amplifyCliGeneratedModelStoreInstance;
    loaderClassDeclaration.addClassMember('amplifyGeneratedModelInstance', LOADER_CLASS_NAME, '', [], 'private', { static: true });

    // private constructor for singleton
    loaderClassDeclaration.addClassMethod(LOADER_CLASS_NAME, null, '', [], [], 'private');

    // getInstance
    const getInstanceBody = dedent`
    if (amplifyGeneratedModelInstance == null) {
      amplifyGeneratedModelInstance = new ${LOADER_CLASS_NAME}();
    }
    return amplifyGeneratedModelInstance;`;
    loaderClassDeclaration.addClassMethod('getInstance', LOADER_CLASS_NAME, getInstanceBody, [], [], 'public', {
      static: true,
      synchronized: true,
    });

    // models method
    const modelsMethodDocString = dedent`
    Get a set of the model classes.

    @return a set of the model classes.`;

    const classList = Object.values(this.typeMap)
      .map(model => `${this.getModelName(model)}.class`)
      .join(', ');
    const modelsMethodImplementation = `final Set<Class<? extends Model>> modifiableSet = new HashSet<>(
      Arrays.<Class<? extends Model>>asList(${classList})
    );

    return Immutable.of(modifiableSet);
    `;
    loaderClassDeclaration.addClassMethod(
      'models',
      'Set<Class<? extends Model>>',
      modelsMethodImplementation,
      [],
      [],
      'public',
      {},
      ['Override'],
      undefined,
      modelsMethodDocString
    );

    // version method
    const versionMethodDocString = dedent`
    Get the version of the models.

    @return the version string of the models.
    `;
    loaderClassDeclaration.addClassMethod(
      'version',
      'String',
      `return ${AMPLIFY_MODEL_VERSION};`,
      [],
      [],
      'public',
      {},
      ['Override'],
      undefined,
      versionMethodDocString
    );

    result.push(loaderClassDeclaration.string);
    return result.join('\n');
  }
  generateEnums(): string {
    const result: string[] = [this.generatePackageName()];
    Object.entries(this.getSelectedEnums()).forEach(([name, enumValue]) => {
      const enumDeclaration = new JavaDeclarationBlock()
        .asKind('enum')
        .access('public')
        .withName(this.getEnumName(enumValue))
        .annotate(['SuppressWarnings("all")'])
        .withComment('Auto generated enum from GraphQL schema.');
      const body = Object.values(enumValue.values);
      enumDeclaration.withBlock(indentMultiline(body.join(',\n')));
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
    return `package ${GENERATED_PACKAGE_NAME};`;
  }
  generateClass(model: CodeGenModel): string {
    const classDeclarationBlock = new JavaDeclarationBlock()
      .asKind('class')
      .access('public')
      .withName(this.getModelName(model))
      .implements(['Model'])
      .withComment(`This is an auto generated class representing the ${model.name} type in your schema.`)
      .final();

    const annotations = this.generateModelAnnotations(model);
    classDeclarationBlock.annotate(annotations);

    const nonConnectedFields = this.getNonConnectedField(model);
    nonConnectedFields.forEach(field => this.generateQueryFields(field, classDeclarationBlock));
    model.fields.forEach(field => {
      const value = nonConnectedFields.includes(field) ? '' : 'null';
      this.generateField(field, value, classDeclarationBlock);
    });

    // step interface declarations
    this.generateStepBuilderInterfaces(model).forEach((builderInterface: JavaDeclarationBlock) => {
      classDeclarationBlock.nestedClass(builderInterface);
    });

    // builder
    this.generateBuilderClass(model, classDeclarationBlock);

    // copyOfBuilder for used for updating existing instance
    this.generateCopyOfBuilderClass(model, classDeclarationBlock);
    // getters
    this.generateGetters(model, classDeclarationBlock);

    // constructor
    this.generateConstructor(model, classDeclarationBlock);

    // equals
    this.generateEqualsMethod(model, classDeclarationBlock);
    // hash code
    this.generateHashCodeMethod(model, classDeclarationBlock);

    // builder
    this.generateBuilderMethod(model, classDeclarationBlock);

    // justId method
    this.generateJustIdMethod(model, classDeclarationBlock);

    // copyBuilder method
    this.generateCopyOfBuilderMethod(model, classDeclarationBlock);

    return classDeclarationBlock.string;
  }

  protected generatePackageHeader(): string {
    const imports = this.generateImportStatements([...Array.from(this.additionalPackages), '', ...CLASS_IMPORT_PACKAGES]);
    return [this.generatePackageName(), '', imports].join('\n');
  }

  /**
   * generate import statements.
   * @param packages
   *
   * @returns string
   */
  protected generateImportStatements(packages: string[]): string {
    return packages.map(pkg => (pkg ? `import ${pkg};` : '')).join('\n');
  }
  /**
   * Add query field used for construction of conditions by SyncEngine
   */
  protected generateQueryFields(field: CodeGenField, classDeclarationBlock: JavaDeclarationBlock): void {
    const queryFieldName = constantCase(field.name);
    // belongsTo field is computed field. the value needed to query the field is in targetName
    const fieldName =
      field.connectionInfo && field.connectionInfo.kind === CodeGenConnectionType.BELONGS_TO
        ? field.connectionInfo.targetName
        : this.getFieldName(field);
    classDeclarationBlock.addClassMember(queryFieldName, 'QueryField', `field("${fieldName}")`, [], 'public', {
      final: true,
      static: true,
    });
  }
  /**
   * Add fields as members of the class
   * @param field
   * @param classDeclarationBlock
   */
  protected generateField(field: CodeGenField, value: string, classDeclarationBlock: JavaDeclarationBlock): void {
    const annotations = this.generateFieldAnnotations(field);
    const fieldType = this.getNativeType(field);
    const fieldName = this.getFieldName(field);
    classDeclarationBlock.addClassMember(fieldName, fieldType, value, annotations, 'private', {
      final: true,
    });
  }

  /**
   * Generate step builder interfaces for each non-null field in the model
   *
   */
  protected generateStepBuilderInterfaces(model: CodeGenModel): JavaDeclarationBlock[] {
    const nonNullableFields = this.getNonConnectedField(model).filter(field => !field.isNullable);
    const nullableFields = this.getNonConnectedField(model).filter(field => field.isNullable);
    const requiredInterfaces = nonNullableFields.filter((field: CodeGenField) => !this.READ_ONLY_FIELDS.includes(field.name));
    const interfaces = requiredInterfaces.map((field, idx) => {
      const isLastField = requiredInterfaces.length - 1 === idx ? true : false;
      const returnType = isLastField ? 'Build' : requiredInterfaces[idx + 1].name;
      const interfaceName = this.getStepInterfaceName(field.name);
      const methodName = this.getStepFunctionName(field);
      const argumentType = this.getNativeType(field);
      const argumentName = this.getStepFunctionArgumentName(field);
      const interfaceDeclaration = new JavaDeclarationBlock()
        .asKind('interface')
        .withName(interfaceName)
        .access('public');
      interfaceDeclaration.withBlock(indent(`${this.getStepInterfaceName(returnType)} ${methodName}(${argumentType} ${argumentName});`));
      return interfaceDeclaration;
    });

    // Builder
    const builder = new JavaDeclarationBlock()
      .asKind('interface')
      .withName(this.getStepInterfaceName('Build'))
      .access('public');
    const builderBody = [];
    // build method
    builderBody.push(`${this.getModelName(model)} build();`);

    // id method. Special case as this can throw exception
    builderBody.push(`${this.getStepInterfaceName('Build')} id(String id) throws IllegalArgumentException;`);

    nullableFields.forEach(field => {
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
    const nonNullableFields = this.getNonConnectedField(model).filter(field => !field.isNullable);
    const nullableFields = this.getNonConnectedField(model).filter(field => field.isNullable);
    const stepFields = nonNullableFields.filter((field: CodeGenField) => !this.READ_ONLY_FIELDS.includes(field.name));
    const stepInterfaces = stepFields.map((field: CodeGenField) => {
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
    const buildImplementation = [`String id = this.id != null ? this.id : UUID.randomUUID().toString();`, ''];
    const buildParams = this.getNonConnectedField(model)
      .map(field => this.getFieldName(field))
      .join(',\n');
    buildImplementation.push(`return new ${this.getModelName(model)}(\n${indentMultiline(buildParams)});`);
    builderClassDeclaration.addClassMethod(
      'build',
      this.getModelName(model),
      indentMultiline(buildImplementation.join('\n')),
      undefined,
      [],
      'public',
      {},
      ['Override']
    );

    // non-nullable fields
    stepFields.forEach((field: CodeGenField, idx: number, fields) => {
      const isLastStep = idx === fields.length - 1;
      const fieldName = this.getFieldName(field);
      const methodName = this.getStepFunctionName(field);
      const returnType = isLastStep ? this.getStepInterfaceName('Build') : this.getStepInterfaceName(fields[idx + 1].name);
      const argumentType = this.getNativeType(field);
      const argumentName = this.getStepFunctionArgumentName(field);
      const body = [`Objects.requireNonNull(${argumentName});`, `this.${fieldName} = ${argumentName};`, `return this;`].join('\n');
      builderClassDeclaration.addClassMethod(
        methodName,
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
      const methodName = this.getStepFunctionName(field);
      const returnType = this.getStepInterfaceName('Build');
      const argumentType = this.getNativeType(field);
      const argumentName = this.getStepFunctionArgumentName(field);
      const body = [`this.${fieldName} = ${argumentName};`, `return this;`].join('\n');
      builderClassDeclaration.addClassMethod(
        methodName,
        returnType,
        indentMultiline(body),
        [{ name: argumentName, type: argumentType }],
        [],
        'public',
        {},
        ['Override']
      );
    });

    // Add id builder
    const idBuildStepBody = dedent`this.id = id;

    try {
        UUID.fromString(id); // Check that ID is in the UUID format - if not an exception is thrown
    } catch (Exception exception) {
      throw new IllegalArgumentException("Model IDs must be unique in the format of UUID.",
                exception);
    }

    return this;`;

    const idComment = dedent`WARNING: Do not set ID when creating a new object. Leave this blank and one will be auto generated for you.
    This should only be set when referring to an already existing object.
    @param id id
    @return Current Builder instance, for fluent method chaining
    @throws IllegalArgumentException Checks that ID is in the proper format`;

    builderClassDeclaration.addClassMethod(
      'id',
      this.getStepInterfaceName('Build'),
      indentMultiline(idBuildStepBody),
      [{ name: 'id', type: 'String' }],
      [],
      'public',
      {},
      [],
      ['IllegalArgumentException'],
      idComment
    );
    classDeclaration.nestedClass(builderClassDeclaration);
  }

  /**
   * * Generate a CopyOfBuilder class that will be used to create copy of the current model.
   * This is needed to mutate the object as all the generated models are immuteable and can
   * be update only by creating a new instance using copyOfBuilder
   * @param model
   * @param classDeclaration
   */
  protected generateCopyOfBuilderClass(model: CodeGenModel, classDeclaration: JavaDeclarationBlock): void {
    const builderName = 'CopyOfBuilder';
    const copyOfBuilderClassDeclaration = new JavaDeclarationBlock()
      .access('public')
      .final()
      .asKind('class')
      .withName(builderName)
      .extends(['Builder']);

    const nonNullableFields = this.getNonConnectedField(model)
      .filter(field => !field.isNullable)
      .filter(f => f.name !== 'id');
    const nullableFields = this.getNonConnectedField(model).filter(field => field.isNullable);

    // constructor
    const constructorArguments = this.getNonConnectedField(model).map(field => {
      return { name: this.getStepFunctionArgumentName(field), type: this.getNativeType(field) };
    });
    const stepBuilderInvocation = [...nonNullableFields, ...nullableFields].map(field => {
      const methodName = this.getStepFunctionName(field);
      const argumentName = this.getStepFunctionArgumentName(field);
      return `.${methodName}(${argumentName})`;
    });
    const invocations = ['super', indentMultiline(stepBuilderInvocation.join('\n')).trim(), ';'].join('');
    const body = ['super.id(id);', invocations].join('\n');
    copyOfBuilderClassDeclaration.addClassMethod(builderName, null, body, constructorArguments, [], 'private');

    // Non-nullable field setters need to be added to NewClass as this is not a step builder
    [...nonNullableFields, ...nullableFields].forEach(field => {
      const methodName = this.getStepFunctionName(field);
      const argumentName = this.getStepFunctionArgumentName(field);
      const argumentType = this.getNativeType(field);
      const implementation = `return (${builderName}) super.${methodName}(${argumentName});`;
      copyOfBuilderClassDeclaration.addClassMethod(
        methodName,
        builderName,
        implementation,
        [
          {
            name: argumentName,
            type: argumentType,
          },
        ],
        [],
        'public',
        {},
        ['Override']
      );
    });
    classDeclaration.nestedClass(copyOfBuilderClassDeclaration);
  }

  /**
   * adds a copyOfBuilder method to the Model class. This method is used to create a copy of the model to mutate it
   */
  protected generateCopyOfBuilderMethod(model: CodeGenModel, classDeclaration: JavaDeclarationBlock): void {
    const args = indentMultiline(
      this.getNonConnectedField(model)
        .map(field => this.getFieldName(field))
        .join(',\n')
    ).trim();
    const methodBody = `return new CopyOfBuilder(${args});`;
    classDeclaration.addClassMethod('copyOfBuilder', 'CopyOfBuilder', methodBody, [], [], 'public');
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
      const methodName = this.getFieldGetterName(field);
      const body = indent(`return ${fieldName};`);
      declarationsBlock.addClassMethod(methodName, returnType, body, undefined, undefined, 'public');
    });
  }

  /**
   * Generate Java field getter name
   * @param field codegen field
   */
  protected getFieldGetterName(field: CodeGenField): string {
    return `get${pascalCase(field.name)}`;
  }

  /**
   * generates the method name used in step builder
   * @param field
   */
  protected getStepFunctionName(field: CodeGenField): string {
    return camelCase(field.name);
  }

  /**
   * generates Step function argument
   * @param field
   */
  protected getStepFunctionArgumentName(field: CodeGenField): string {
    return camelCase(field.name);
  }

  /**
   * Generate constructor for the class
   * @param model CodeGenModel
   * @param declarationsBlock Class Declaration block to which constructor will be added
   */
  protected generateConstructor(model: CodeGenModel, declarationsBlock: JavaDeclarationBlock): void {
    const name = this.getModelName(model);
    const body = this.getNonConnectedField(model)
      .map((field: CodeGenField) => {
        const fieldName = this.getFieldName(field);
        return `this.${fieldName} = ${fieldName};`;
      })
      .join('\n');

    const constructorArguments = this.getNonConnectedField(model).map(field => {
      return { name: this.getFieldName(field), type: this.getNativeType(field) };
    });
    declarationsBlock.addClassMethod(name, null, body, constructorArguments, undefined, 'private');
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
   * Generate code for equals method
   * @param model
   * @param declarationBlock
   */
  protected generateEqualsMethod(model: CodeGenModel, declarationBlock: JavaDeclarationBlock): void {
    const paramName = 'obj';
    const className = this.getModelName(model);
    const instanceName = camelCase(model.name);

    const body = [
      `if (this == ${paramName}) {`,
      '  return true;',
      `} else if(${paramName} == null || getClass() != ${paramName}.getClass()) {`,
      '  return false;',
      '} else {',
    ];

    body.push(`${className} ${instanceName} = (${className}) ${paramName};`);
    const propCheck = indentMultiline(
      this.getNonConnectedField(model)
        .map(field => {
          const getterName = this.getFieldGetterName(field);
          return `ObjectsCompat.equals(${getterName}(), ${instanceName}.${getterName}())`;
        })
        .join(' &&\n'),
      4
    ).trim();

    body.push(`return ${propCheck};`);
    body.push('}');

    declarationBlock.addClassMethod(
      'equals',
      'boolean',
      indentMultiline(body.join('\n')),
      [{ name: paramName, type: 'Object' }],
      [],
      'public',
      {},
      ['Override']
    );
  }

  protected generateHashCodeMethod(model: CodeGenModel, declarationBlock: JavaDeclarationBlock): void {
    const body = [
      'return new StringBuilder()',
      ...this.getNonConnectedField(model).map(field => `.append(${this.getFieldGetterName(field)}())`),
      '.toString()',
      '.hashCode();',
    ].join('\n');
    declarationBlock.addClassMethod('hashCode', 'int', indentMultiline(body).trimLeft(), [], [], 'public', {}, ['Override']);
  }

  /**
   * Generate the builder method to get an instance of Builder class
   * @param model
   * @param classDeclaration
   */
  protected generateBuilderMethod(model: CodeGenModel, classDeclaration: JavaDeclarationBlock): void {
    const requiredFields = this.getNonConnectedField(model).filter(
      field => !field.isNullable && !this.READ_ONLY_FIELDS.includes(field.name)
    );
    const returnType = requiredFields.length ? this.getStepInterfaceName(requiredFields[0].name) : this.getStepInterfaceName('Build');
    classDeclaration.addClassMethod(
      'builder',
      returnType,
      indentMultiline(`return new Builder();`),
      [],
      [],
      'public',
      { static: true },
      []
    );
  }

  /**
   * Generate the name of the step builder interface
   * @param nextFieldName: string
   * @returns string
   */
  private getStepInterfaceName(nextFieldName: string): string {
    return `${pascalCase(nextFieldName)}Step`;
  }

  protected generateModelAnnotations(model: CodeGenModel): string[] {
    const annotations: string[] = model.directives.map(directive => {
      switch (directive.name) {
        case 'model':
          return `ModelConfig(pluralName = "${this.pluralizeModelName(model)}")`;
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
    return ['SuppressWarnings("all")', ...annotations].filter(annotation => annotation);
  }

  protected generateFieldAnnotations(field: CodeGenField): string[] {
    const annotations: string[] = [];
    annotations.push(this.generateModelFieldAnnotation(field));
    annotations.push(this.generateConnectionAnnotation(field));
    return annotations.filter(annotation => annotation);
  }

  protected generateModelFieldAnnotation(field: CodeGenField): string {
    const annotationArgs: string[] = [`targetType="${field.type}"`, !field.isNullable ? 'isRequired = true' : ''].filter(arg => arg);

    return `ModelField(${annotationArgs.join(', ')})`;
  }
  protected generateConnectionAnnotation(field: CodeGenField): string {
    if (!field.connectionInfo) return '';
    const { connectionInfo } = field;
    // Add annotation to import
    this.additionalPackages.add(CONNECTION_RELATIONSHIP_IMPORTS[connectionInfo.kind]);

    let connectionDirectiveName: string = '';
    const connectionArguments: string[] = [];

    switch (connectionInfo.kind) {
      case CodeGenConnectionType.HAS_ONE:
        connectionDirectiveName = 'HasOne';
        connectionArguments.push(`associatedWith = "${this.getFieldName(connectionInfo.associatedWith)}"`);
        break;
      case CodeGenConnectionType.HAS_MANY:
        connectionDirectiveName = 'HasMany';
        connectionArguments.push(`associatedWith = "${this.getFieldName(connectionInfo.associatedWith)}"`);
        break;
      case CodeGenConnectionType.BELONGS_TO:
        connectionDirectiveName = 'BelongsTo';
        connectionArguments.push(`targetName = "${connectionInfo.targetName}"`);
        break;
    }
    connectionArguments.push(`type = ${this.getModelName(connectionInfo.connectedModel)}.class`);

    return `${connectionDirectiveName}${connectionArguments.length ? `(${connectionArguments.join(', ')})` : ''}`;
  }
  protected generateJustIdMethod(model: CodeGenModel, classDeclaration: JavaDeclarationBlock): void {
    const returnType = this.getModelName(model);
    const comment = dedent`WARNING: This method should not be used to build an instance of this object for a CREATE mutation.
        This is a convenience method to return an instance of the object with only its ID populated
        to be used in the context of a parameter in a delete mutation or referencing a foreign key
        in a relationship.
        @param id the id of the existing item this instance will represent
        @return an instance of this model with only ID populated
        @throws IllegalArgumentException Checks that ID is in the proper format`;
    const exceptionBlock = dedent`
    try {
      UUID.fromString(id); // Check that ID is in the UUID format - if not an exception is thrown
    } catch (Exception exception) {
      throw new IllegalArgumentException(
              "Model IDs must be unique in the format of UUID. This method is for creating instances " +
              "of an existing object with only its ID field for sending as a mutation parameter. When " +
              "creating a new object, use the standard builder method and leave the ID field blank."
      );
    }`;
    const initArgs = indentMultiline(['id', ...new Array(this.getNonConnectedField(model).length - 1).fill('null')].join(',\n'));
    const initBlock = `return new ${returnType}(\n${initArgs}\n);`;
    classDeclaration.addClassMethod(
      'justId',
      returnType,
      [exceptionBlock, initBlock].join('\n'),
      [{ name: 'id', type: 'String' }],
      [],
      'public',
      { static: true },
      [],
      [],
      comment
    );
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
