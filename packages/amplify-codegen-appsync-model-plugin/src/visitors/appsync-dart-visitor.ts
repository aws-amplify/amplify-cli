import { AppSyncModelVisitor, ParsedAppSyncModelConfig, RawAppSyncModelConfig, CodeGenModel, CodeGenField } from './appsync-visitor';
import { DartDeclarationBlock } from '../languages/dart-declaration-block';
import { CodeGenConnectionType } from '../utils/process-connections';

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

    protected generateModelClass(model: CodeGenModel): string {
      //class wrapper
      const classDeclarationBlock = new DartDeclarationBlock()
        .asKind('class')
        .withName(this.getModelName(model))
        .extends(['Model'])
        .withComment(`This is an auto generated class representing the ${model.name} type in your schema.`)
        .annotate(['immutalbe']);
      //model type field
      classDeclarationBlock.addClassMember('classType', '', `${this.getModelName(model)}Type()`, { static: true, const: true});
      //model fields
      model.fields.forEach(field => {
        this.generateModelField(field, '', classDeclarationBlock);
      });
      //getIdß
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
      const classDeclarationBlock = new DartDeclarationBlock()
        .asKind('class')
        .withName(`${this.getModelName(model)}Type`)
        .extends([`ModelType<${this.getModelName(model)}>`]);
      return classDeclarationBlock.string;
    }

    protected generateModelSchema(model: CodeGenModel): string {
      const classDeclarationBlock = new DartDeclarationBlock()
        .asKind('extension')
        .withName(`${this.getModelName(model)}Schema`)
        .extensionOn(this.getModelName(model));
      return classDeclarationBlock.string;
    }

    protected generateGetIdMethod(model: CodeGenModel, declarationBlock: DartDeclarationBlock) : void {
    }
    protected generateConstructor(model: CodeGenModel, declarationBlock: DartDeclarationBlock) : void {
      //TODO
    }
    protected generateEqualsMethodAndOperator(model: CodeGenModel, declarationBlock: DartDeclarationBlock) : void {
      //TODO
    }
    protected generateHashCodeMethod(model: CodeGenModel, declarationBlock: DartDeclarationBlock) : void {
      //TODO
    }
    protected generateToStringMethod(model: CodeGenModel, declarationBlock: DartDeclarationBlock) : void {
      //TODO
    }
    protected generateCopyWithMethod(model: CodeGenModel, declarationBlock: DartDeclarationBlock) : void {
      //TODO
    }
    protected generateSerializationMethod(model: CodeGenModel, declarationBlock: DartDeclarationBlock) : void {
      //TODO
    }


    /**
     * Generate code for model annotations which has model and key directives
     * @param model
     */
    protected generateModelAnnotations(model: CodeGenModel): string[] {
      const annotations: string[] = model.directives.map(directive => {
        switch (directive.name) {
          case 'model':
            const modelArgs: string[] = [];
            modelArgs.push(`pluralName: "${this.pluralizeModelName(model)}"`);
            return `ModelConfig(${modelArgs.join(', ')})`;
          case 'key':
            const keyArgs: string[] = [];
            keyArgs.push(`name: "${directive.arguments.name}"`);
            keyArgs.push(`fields: [${(directive.arguments.fields as string[]).map((f: string) => `"${f}"`).join(', ')}]`);
            return `Index(${keyArgs.join(', ')})`;
          default:
            break;
        }
        return '';
      });
      return annotations.filter(annotation => annotation);
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

    protected generateFieldAnnotations(field: CodeGenField): string[] {
      const annotations: string[] = [];
      annotations.push(this.getFieldName(field) === 'id' ? 'override' : '');
      annotations.push(this.generateModelFieldAnnotation(field));
      annotations.push(this.generateConnectionAnnotation(field));
      return annotations.filter(f => f);
    }
    protected generateModelFieldAnnotation(field: CodeGenField): string {
      const annotationArgs : string[] = [
        `targetType: "${field.type}"`,
        !field.isNullable ? 'isRequired: true' : '',
      ].filter(arg => arg);
      return `ModelField${annotationArgs.length ? `(${annotationArgs.join(', ')})` : ''}`;
    }
    protected generateConnectionAnnotation(field: CodeGenField): string {
      if (!field.connectionInfo) {
        return '';
      }

      const { connectionInfo } = field;
      const connectionArgs: string[] = [];
      let connectionDirectiveName: string = '';

      switch (connectionInfo.kind) {
        case CodeGenConnectionType.HAS_ONE:
          connectionDirectiveName = 'HasOne';
          connectionArgs.push(`associatedWith: "${this.getFieldName(connectionInfo.associatedWith)}"`);
          break;
        case CodeGenConnectionType.HAS_MANY:
          connectionDirectiveName = 'HasMany';
          connectionArgs.push(`associatedWith: "${this.getFieldName(connectionInfo.associatedWith)}"`);
          break;
        case CodeGenConnectionType.BELONGS_TO:
          connectionDirectiveName = 'BelongsTo';
          connectionArgs.push(`targetName: "${connectionInfo.targetName}"`);
          break;
      }
      connectionArgs.push(`type: ${this.getModelName(connectionInfo.connectedModel)}`);
      return `${connectionDirectiveName}${connectionArgs.length ? `(${connectionArgs.join(', ')})` : ''}`;
    }
}