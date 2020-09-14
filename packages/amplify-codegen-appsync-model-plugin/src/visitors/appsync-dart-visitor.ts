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
        result.push(modelDeclaration);
      });
      return result.join('\n');
    }

    protected generateModelClass(model: CodeGenModel): string {
      const classDeclarationBlock = new DartDeclarationBlock()
        .asKind('class')
        .withName(this.getModelName(model))
        .implements(['Model'])
        .withComment(`This is an auto generated clas representing the ${model.name} type in your schema.`)
        .annotate(this.generateModelAnnotations(model));
      console.log(model.fields);
      model.fields.forEach(field => {
        const value: string = '';
        this.generateModelField(field, value, classDeclarationBlock);
      });
      return classDeclarationBlock.string;
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
     * @param classDeclarationBlock
     */
    protected generateModelField(field: CodeGenField, value: string, classDeclarationBlock: DartDeclarationBlock): void {
      const annotations = this.generateFieldAnnotations(field);
      const fieldType = this.getNativeType(field);
      const fieldName = this.getFieldName(field);
      const nullable = field.isNullable && (!field.connectionInfo || field.connectionInfo.kind !== CodeGenConnectionType.BELONGS_TO);
      classDeclarationBlock.addClassMember(fieldName, fieldType, value, annotations, nullable);
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