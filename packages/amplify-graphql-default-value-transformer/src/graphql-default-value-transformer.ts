import { DirectiveWrapper, InvalidDirectiveError, MappingTemplate, TransformerPluginBase } from '@aws-amplify/graphql-transformer-core';
import {
  TransformerContextProvider,
  TransformerResolverProvider,
  TransformerSchemaVisitStepContextProvider,
} from '@aws-amplify/graphql-transformer-interfaces';
import {
  DirectiveNode,
  EnumTypeDefinitionNode,
  FieldDefinitionNode,
  InterfaceTypeDefinitionNode,
  Kind,
  ObjectTypeDefinitionNode,
  StringValueNode,
  TypeNode,
} from 'graphql';
import { methodCall, printBlock, qref, raw, ref, str } from 'graphql-mapping-template';
import { getBaseType, isEnum, isListType, isNonNullType, isScalarOrEnum } from 'graphql-transformer-common';
import { DefaultValueDirectiveConfiguration } from './types';
import { TypeValidators } from './validators';

const directiveName = 'default';
const directiveDefinition = `
  directive @${directiveName}(value: String!) on FIELD_DEFINITION
`;

const nonStringStorageTypes = ['Int', 'Float', 'Boolean', 'AWSTimestamp', 'AWSJSON'];

export class DefaultValueTransformer extends TransformerPluginBase {
  private directiveMap = new Map<String, DefaultValueDirectiveConfiguration[]>();

  constructor() {
    super('amplify-default-value-transformer', directiveDefinition);
  }

  field = (
    parent: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
    definition: FieldDefinitionNode,
    directive: DirectiveNode,
    ctx: TransformerSchemaVisitStepContextProvider,
  ): void => {
    const directiveWrapped = new DirectiveWrapper(directive);
    const config = directiveWrapped.getArguments({
      object: parent as ObjectTypeDefinitionNode,
      field: definition,
      directive,
    } as DefaultValueDirectiveConfiguration);
    validate(ctx, config);

    if (!this.directiveMap.has(parent.name.value)) {
      this.directiveMap.set(parent.name.value, []);
    }

    this.directiveMap.get(parent.name.value)!.push(config);
  };

  generateResolvers = (ctx: TransformerContextProvider): void => {
    const context = ctx as TransformerContextProvider;

    for (const typeName of this.directiveMap.keys()) {
      const snippets: string[] = [];
      for (const config of this.directiveMap.get(typeName)!) {
        const fieldName = config.field.name.value;
        const defaultValueArgumentValueNode = config.directive.arguments![0].value as StringValueNode;
        const defaultValue = defaultValueArgumentValueNode.value;
        snippets.push(this.createVTLSnippet(fieldName, defaultValue, this.storeAsString(getBaseType(config.field.type))));
      }

      this.augmentResolver(context, `create${typeName}`, snippets);
      this.augmentResolver(context, `update${typeName}`, snippets);
    }
  };

  private storeAsString = (typeName: string) => !nonStringStorageTypes.includes(typeName);

  private createVTLSnippet = (fieldName: string, defaultValue: string, isString: boolean): string => {
    return printBlock(`Setting "${fieldName}" to default value of "${defaultValue}"`)(
      qref(methodCall(ref('ctx.stash.defaultValues.put'), str(fieldName), isString ? str(defaultValue) : raw(defaultValue))),
    );
  };

  private augmentResolver = (ctx: TransformerContextProvider, resolverLogicalId: string, snippets: string[]): void => {
    const resolver = this.getResolverObject(ctx, resolverLogicalId);
    if (resolver) {
      this.addSnippetToResolverSlot(resolver, snippets);
    }
  };

  private getResolverObject = (ctx: TransformerContextProvider, resolverLogicalId: string): TransformerResolverProvider | null => {
    const objectName = ctx.output.getMutationTypeName();

    if (!objectName) {
      return null;
    }

    return ctx.resolvers.getResolver(objectName, resolverLogicalId) ?? null;
  };

  private addSnippetToResolverSlot = (resolver: TransformerResolverProvider, snippets: string[]): void => {
    const res = resolver as any;
    res.addToSlot(
      'init',
      MappingTemplate.s3MappingTemplateFromString(
        snippets.join('\n') + '\n{}',
        `${res.typeName}.${res.fieldName}.{slotName}.{slotIndex}.req.vtl`,
      ),
    );
  };
}

function validate(ctx: TransformerSchemaVisitStepContextProvider, config: DefaultValueDirectiveConfiguration): void {
  assertModelDirective(config);
  assertCompatibleFieldType(ctx, config.field.type);
  assertValidDirectiveArguments(config.directive);
  assertFieldTypeAndDefaultValueTypeMatch(ctx, config);
}

function assertCompatibleFieldType(ctx: TransformerSchemaVisitStepContextProvider, type: TypeNode): void {
  const enums = ctx.output.getTypeDefinitionsOfKind(Kind.ENUM_TYPE_DEFINITION) as EnumTypeDefinitionNode[];
  if (isListType(type) || !isScalarOrEnum(type, enums)) {
    throw new InvalidDirectiveError('The @default directive may only be added to scalar or enum field types.');
  }

  if (isNonNullType(type)) {
    throw new InvalidDirectiveError('The @default directive cannot be added to required fields.');
  }
}

function assertValidDirectiveArguments(directive: DirectiveNode): void {
  if (directive.arguments!.length === 0) throw new InvalidDirectiveError('Directive for @default must declare a value property');
  if (directive.arguments!.length > 1) throw new InvalidDirectiveError('Directive for @default only takes a value property');
}

function assertModelDirective(config: DefaultValueDirectiveConfiguration): void {
  const modelDirective = config.object.directives!.find(dir => dir.name.value === 'model');
  if (!modelDirective) {
    throw new InvalidDirectiveError('The @default directive may only be added to object definitions annotated with @model.');
  }
}

function assertFieldTypeAndDefaultValueTypeMatch(
  ctx: TransformerSchemaVisitStepContextProvider,
  config: DefaultValueDirectiveConfiguration,
): void {
  // if field type is non-nullable, ensure value is not null
  if (config.value === null) {
    throw new InvalidDirectiveError('The @default directive does not support null values.');
  }

  // if base field type is enum, may be an enum - validate that argument value in among field type enum's values
  const enums = ctx.output.getTypeDefinitionsOfKind(Kind.ENUM_TYPE_DEFINITION) as EnumTypeDefinitionNode[];
  if (
    enums &&
    isEnum(config.field.type, ctx.inputDocument) &&
    !enums.find(it => it.name.value === getBaseType(config.field.type))!.values!.find(v => v.name.value === config.value)
  ) {
    throw new InvalidDirectiveError(`Default value "${config.value}" is not a member of ${getBaseType(config.field.type)} enum.`);
  }

  const typeValidators = new TypeValidators();
  if (!isEnum(config.field.type, ctx.inputDocument) && !typeValidators[getBaseType(config.field.type)](config.value)) {
    throw new InvalidDirectiveError(`Default value "${config.value}" is not a valid ${getBaseType(config.field.type)}.`);
  }
}
