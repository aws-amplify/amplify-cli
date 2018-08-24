# Writing Custom GraphQL Transformers.

This document outlines the process of writing custom GraphQL transformers. The `graphql-transform` package serves as a lightweight framework that takes as input a GraphQL SDL document
and a list of **GraphQL Transformers** and returns a cloudformation document that fully implements the data model defined by the input schema. A GraphQL Transformer is a class the defines a directive and a set of functions that manipulate a context and are called whenever that directive is found in an input schema.

For example, the AWS Amplify CLI calls the GraphQL Transform like this:

```javascript
import GraphQLTransform from 'graphql-transformer-core'
import DynamoDBModelTransformer from 'graphql-dynamodb-transformer'
import ModelConnectionTransformer from 'graphql-connection-transformer'
import ModelAuthTransformer from 'graphql-auth-transformer'
import AppSyncTransformer from 'graphql-appsync-transformer'
import VersionedModelTransformer from 'graphql-versioned-transformer'

// Note: This is not exact as we are omitting the @searchable transformer.
const transformer = new GraphQLTransform({
    transformers: [
        new AppSyncTransformer(),
        new DynamoDBModelTransformer(),
        new ModelAuthTransformer(),
        new ModelConnectionTransformer(),
        new VersionedModelTransformer()
    ]
})
const schema = `
type Post @model {
    id: ID!
    title: String!
    comments: [Comment] @connection(name: "PostComments")
}
type Comment @model {
    id: ID!
    content: String!
    post: Post @connection(name: "PostComments")
}
`
const cfdoc = transformer.transform(schema);
const out = await createStack(cfdoc, name, region)
console.log('Application creation successfully started. It may take a few minutes to finish.')
```

As shown above the `GraphQLTransform` class takes a list of transformers and later is able to transform
GraphQL SDL documents into CloudFormation documents.

## The transform lifecycle

At a high level the `GraphQLTransform` takes the input SDL, parses it, validates the schema
is complete and satisfies the directive definitions, calls each transformers `.before()` method
if one exists, walks the parsed AST and called the relevant methods if they exists (e.g. `object()`, `field()`, `interface()` etc),
in reverse order calls each transformer's `.after()` method if one exists, and finally returns the context's finished template.

Here is pseudo code for how `const cfdoc = transformer.transform(schema);` works.

```javascript
function transform(schema: string): Template {
        const errors = this.validateModelSchema()
        if (errors && errors.length) {
            throw new SchemaValidationError(errors.slice(0))
        }

        const context = new TransformerContext(schema)
        for (const transformer of this.transformers) {
            if (isFunction(transformer.before)) {
                transformer.before(context)
            }

            // Apply each transformer and accumulate the context.
            for (const def of context.inputDocument.definitions as TypeDefinitionNode[]) {
                for (const dir of def.directives) {
                    switch (def.kind) {
                        case 'ObjectTypeDefinition':
                            this.transformObject(transformer, def, dir, context)
                            break
                        case 'InterfaceTypeDefinition':
                            this.transformInterface(transformer, def, dir, context)
                            break;
                        case 'ScalarTypeDefinition':
                            this.transformScalar(transformer, def, dir, context)
                            break;
                        case 'UnionTypeDefinition':
                            this.transformUnion(transformer, def, dir, context)
                            break;
                        case 'EnumTypeDefinition':
                            this.transformEnum(transformer, def, dir, context)
                            break;
                        case 'InputObjectTypeDefinition':
                            this.transformInputObject(transformer, def, dir, context)
                            break;
                        default:
                            continue
                    }
                }
            }
        }
        // .transform() is meant to behave like a composition so the
        // after functions are called in the reverse order (as if they were popping off a stack)
        let reverseThroughTransformers = this.transformers.length - 1;
        while (reverseThroughTransformers >= 0) {
            const transformer = this.transformers[reverseThroughTransformers]
            if (isFunction(transformer.after)) {
                transformer.after(context)
            }
            reverseThroughTransformers -= 1
        }
        // Write the schema.
        // TODO: In the future allow for different "Serializers".
        return context.template
    }
```

## Example: The @versioned transformer.

As an example let's walk through how we implemented the @versioned transformer. The first thing to do is to define a directive for our transformer.

```javascript
const VERSIONED_DIRECTIVE = `
    directive @versioned(versionField: String = "version", versionInput: String = "expectedVersion") on OBJECT
`
```

Our `@versioned` directive can be applied to `OBJECT` type definitions and automatically adds object versioning and conflict detection to an APIs mutations. For example, we might write

```graphql
# Any mutations that deal with the Post type will ask for an `expectedVersion`
# input that will be checked using DynamoDB condition expressions.
type Post @model @versioned {
    id: ID!
    title: String!
    version: Int!
}
```

> Note: @versioned depends on @model so we must pass `new new DynamoDBModelTransformer()` before `new new VersionedModelTransformer()`. Also note that `new AppSyncTransformer()` must go first for now. In the future we can add a dependency mechanism and topologically sort it outselves.

The next step after defining the directive is to implement the transformer's business logic. The `graphql-transformer-core` package makes this a little easier
by exporting a common class through which we may define transformers. User's extend the `Transformer` class and implement the required functions.

```javascript
export class Transformer {
    before?: (acc: TransformerContext) => void
    after?: (acc: TransformerContext) => void
    object?: (definition: ObjectTypeDefinitionNode, directive: DirectiveNode, acc: TransformerContext) => void
    interface?: (definition: InterfaceTypeDefinitionNode, directive: DirectiveNode, acc: TransformerContext) => void
    field?: (
        parent: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
        definition: FieldDefinitionNode,
        directive: DirectiveNode,
        acc: TransformerContext) => void
    argument?: (definition: InputValueDefinitionNode, directive: DirectiveNode, acc: TransformerContext) => void
    union?: (definition: UnionTypeDefinitionNode, directive: DirectiveNode, acc: TransformerContext) => void
    enum?: (definition: EnumTypeDefinitionNode, directive: DirectiveNode, acc: TransformerContext) => void
    enumValue?: (definition: EnumValueDefinitionNode, directive: DirectiveNode, acc: TransformerContext) => void
    scalar?: (definition: ScalarTypeDefinitionNode, directive: DirectiveNode, acc: TransformerContext) => void
    input?: (definition: InputObjectTypeDefinitionNode, directive: DirectiveNode, acc: TransformerContext) => void
    inputValue?: (definition: InputValueDefinitionNode, directive: DirectiveNode, acc: TransformerContext) => void
}
```

Since our `VERSIONED_DIRECTIVE` only specifies `OBJECT` in its **on** condition, we only **NEED* to implement the `object` function. You may also
implement the `before` and `after` functions which will be called once at the beginning and end respectively of the transformation process.

```javascript
/**
 * Users extend the Transformer class and implement the relevant functions.
 */
export class VersionedModelTransformer extends Transformer {

    constructor() {
        super(
            'VersionedModelTransformer',
            VERSIONED_DIRECTIVE
        )
    }

    /**
     * When a type is annotated with @versioned enable conflict resolution for the type.
     *
     * Usage:
     *
     * type Post @model @versioned(versionField: "version", versionInput: "expectedVersion") {
     *   id: ID!
     *   title: String
     *   version: Int!
     * }
     *
     * Enabling conflict resolution automatically manages a "version" attribute in
     * the @model type's DynamoDB table and injects a conditional expression into
     * the types mutations that actually perform the conflict resolutions by
     * checking the "version" attribute in the table with the "expectedVersion" passed
     * by the user.
     */
    public object = (def: ObjectTypeDefinitionNode, directive: DirectiveNode, ctx: TransformerContext): void => {
        // @versioned may only be used on types that are also @model
        const modelDirective = def.directives.find((dir) => dir.name.value === 'model')
        if (!modelDirective) {
            throw new InvalidDirectiveError('Types annotated with @auth must also be annotated with @model.')
        }

        const isArg = (s: string) => (arg: ArgumentNode) => arg.name.value === s
        const getArg = (arg: string, dflt?: any) => {
            const argument = directive.arguments.find(isArg(arg))
            return argument ? valueFromASTUntyped(argument.value) : dflt
        }

        const versionField = getArg('versionField', "version")
        const versionInput = getArg('versionInput', "expectedVersion")
        const typeName = def.name.value

        // Make the necessary changes to the context
        this.augmentCreateMutation(ctx, typeName, versionField, versionInput)
        this.augmentUpdateMutation(ctx, typeName, versionField, versionInput)
        this.augmentDeleteMutation(ctx, typeName, versionField, versionInput)
        this.stripCreateInputVersionedField(ctx, typeName, versionField)
        this.addVersionedInputToDeleteInput(ctx, typeName, versionInput)
        this.addVersionedInputToUpdateInput(ctx, typeName, versionInput)
        this.enforceVersionedFieldOnType(ctx, typeName, versionField)
    }

    // ... Implement the functions that do the real work by calling the context methods.
}
```

### The TransformerContext

The transformer context serves like an accumulator that is manipulated by transformers. The context exposes the following methods for manipulating the context.

```javascript
export default class TransformerContext {
    constructor(inputSDL: string);
    mergeResources(resources: {
        [key: string]: Resource;
    }): void;
    mergeParameters(params: {
        [key: string]: Parameter;
    }): void;
    mergeConditions(conditions: {
        [key: string]: Condition;
    }): void;
    getResource(resource: string): Resource;
    setResource(key: string, resource: Resource): void;
    setOutput(key: string, output: Output): void;
    getOutput(key: string): Output;
    mergeOutputs(outputs: {
        [key: string]: Output;
    }): void;
    putSchema(obj: SchemaDefinitionNode): void;
    addType(obj: TypeDefinitionNode): void;
    putType(obj: TypeDefinitionNode): void;
    getType(name: string): TypeSystemDefinitionNode | undefined;
    addObject(obj: ObjectTypeDefinitionNode): void;
    getObject(name: string): ObjectTypeDefinitionNode | undefined;
    addObjectExtension(obj: ObjectTypeExtensionNode): void;
    addInput(inp: InputObjectTypeDefinitionNode): void;
    addEnum(en: EnumTypeDefinitionNode): void;
}
```

> For now, the transform only support cloudformation and uses a library called `cloudform` to create cloudformation resources in code. In the future we would like to support alternative deployment mechanisms like terraform.

## The full code:

> Note: The @model directive runs first and handles setting up the original mutations. This code prepends the existing template with a "$VersionedCondition" variable which the original template knows to look for and if it exists handles merges the conditions.

```javascript
import { Transformer, TransformerContext, InvalidDirectiveError, TransformerContractError } from "graphql-transformer-core";
import {
    valueFromASTUntyped,
    ArgumentNode,
    ObjectTypeDefinitionNode,
    DirectiveNode,
    Kind
} from "graphql";
import { printBlock, compoundExpression, set, ref, qref, obj, str, raw } from 'graphql-mapping-template'
import {
    ResourceConstants, blankObject, makeSchema,
    makeOperationType,
    ModelResourceIDs,
    ResolverResourceIDs,
    makeInputValueDefinition,
    makeNonNullType,
    makeNamedType,
    getBaseType,
    makeField
} from "graphql-transformer-common";

export class VersionedModelTransformer extends Transformer {

    constructor() {
        super(
            'VersionedModelTransformer',
            // TODO: Allow version attribute selection. Could be `@version on FIELD_DEFINITION`
            'directive @versioned(versionField: String = "version", versionInput: String = "expectedVersion") on OBJECT'
        )
    }

    /**
     * When a type is annotated with @versioned enable conflict resolution for the type.
     *
     * Usage:
     *
     * type Post @model @versioned(versionField: "version", versionInput: "expectedVersion") {
     *   id: ID!
     *   title: String
     *   version: Int!
     * }
     *
     * Enabling conflict resolution automatically manages a "version" attribute in
     * the @model type's DynamoDB table and injects a conditional expression into
     * the types mutations that actually perform the conflict resolutions by
     * checking the "version" attribute in the table with the "expectedVersion" passed
     * by the user.
     */
    public object = (def: ObjectTypeDefinitionNode, directive: DirectiveNode, ctx: TransformerContext): void => {
        // @versioned may only be used on types that are also @model
        const modelDirective = def.directives.find((dir) => dir.name.value === 'model')
        if (!modelDirective) {
            throw new InvalidDirectiveError('Types annotated with @auth must also be annotated with @model.')
        }

        const isArg = (s: string) => (arg: ArgumentNode) => arg.name.value === s
        const getArg = (arg: string, dflt?: any) => {
            const argument = directive.arguments.find(isArg(arg))
            return argument ? valueFromASTUntyped(argument.value) : dflt
        }

        const versionField = getArg('versionField', "version")
        const versionInput = getArg('versionInput', "expectedVersion")
        const typeName = def.name.value

        // Make the necessary changes to the context
        this.augmentCreateMutation(ctx, typeName, versionField, versionInput)
        this.augmentUpdateMutation(ctx, typeName, versionField, versionInput)
        this.augmentDeleteMutation(ctx, typeName, versionField, versionInput)
        this.stripCreateInputVersionedField(ctx, typeName, versionField)
        this.addVersionedInputToDeleteInput(ctx, typeName, versionInput)
        this.addVersionedInputToUpdateInput(ctx, typeName, versionInput)
        this.enforceVersionedFieldOnType(ctx, typeName, versionField)
    }

    /**
     * Set the "version"  to 1.
     * @param ctx
     * @param versionField
     * @param versionInput
     */
    private augmentCreateMutation(ctx: TransformerContext, typeName: string, versionField: string, versionInput: string) {
        const snippet = printBlock(`Setting "${versionField}" to 1`)(
            qref(`$ctx.args.input.put("${versionField}", 1)`)
        )
        const mutationResolverLogicalId = ResolverResourceIDs.DynamoDBCreateResolverResourceID(typeName)
        const resolver = ctx.getResource(mutationResolverLogicalId)
        if (resolver) {
            resolver.Properties.RequestMappingTemplate = snippet + '\n\n' + resolver.Properties.RequestMappingTemplate
            ctx.setResource(mutationResolverLogicalId, resolver)
        }
    }

    /**
     * Prefix the update operation with a conditional expression that checks
     * the object versions.
     * @param ctx
     * @param versionField
     * @param versionInput
     */
    private augmentDeleteMutation(ctx: TransformerContext, typeName: string, versionField: string, versionInput: string) {
        const mutationResolverLogicalId = ResolverResourceIDs.DynamoDBDeleteResolverResourceID(typeName)
        const snippet = printBlock(`Inject @versioned condition.`)(
            compoundExpression([
                set(ref(ResourceConstants.SNIPPETS.VersionedCondition), obj({
                    expression: str(`#${versionField} = :${versionInput}`),
                    expressionValues: obj({
                        [`:${versionInput}`]: raw(`$util.dynamodb.toDynamoDB($ctx.args.input.${versionInput})`)
                    }),
                    expressionNames: obj({
                        [`#${versionField}`]: str(`${versionField}`)
                    })
                })),
                qref(`$ctx.args.input.remove("${versionInput}")`)
            ])
        )
        const resolver = ctx.getResource(mutationResolverLogicalId)
        if (resolver) {
            resolver.Properties.RequestMappingTemplate = snippet + '\n\n' + resolver.Properties.RequestMappingTemplate
            ctx.setResource(mutationResolverLogicalId, resolver)
        }
    }

    private augmentUpdateMutation(ctx: TransformerContext, typeName: string, versionField: string, versionInput: string) {
        const mutationResolverLogicalId = ResolverResourceIDs.DynamoDBUpdateResolverResourceID(typeName)
        const snippet = printBlock(`Inject @versioned condition.`)(
            compoundExpression([
                set(ref(ResourceConstants.SNIPPETS.VersionedCondition), obj({
                    expression: str(`#${versionField} = :${versionInput}`),
                    expressionValues: obj({
                        [`:${versionInput}`]: raw(`$util.dynamodb.toDynamoDB($ctx.args.input.${versionInput})`)
                    }),
                    expressionNames: obj({
                        [`#${versionField}`]: str(`${versionField}`)
                    })
                })),
                set(ref('newVersion'), raw(`$ctx.args.input.${versionInput} + 1`)),
                qref(`$ctx.args.input.put("${versionField}", $newVersion)`),
                qref(`$ctx.args.input.remove("${versionInput}")`)
            ])
        )
        const resolver = ctx.getResource(mutationResolverLogicalId)
        if (resolver) {
            resolver.Properties.RequestMappingTemplate = snippet + '\n\n' + resolver.Properties.RequestMappingTemplate
            ctx.setResource(mutationResolverLogicalId, resolver)
        }
    }

    private stripCreateInputVersionedField(
        ctx: TransformerContext,
        typeName: string,
        versionField: string,
    ) {
        const createInputName = ModelResourceIDs.ModelCreateInputObjectName(typeName)
        const input = ctx.getType(createInputName)
        if (input && input.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION) {
            const updatedFields = input.fields.filter(f => f.name.value !== versionField)
            if (updatedFields.length === 0) {
                throw new InvalidDirectiveError(
                    `After stripping away version field "${versionField}", the create input for type "${typeName}" cannot be created with 0 fields. Add another field to type "${typeName}" to continue.`
                )
            }
            const updatedInput = {
                ...input,
                fields: updatedFields
            }
            ctx.putType(updatedInput)
        }
    }

    private addVersionedInputToUpdateInput(
        ctx: TransformerContext,
        typeName: string,
        versionInput: string,
    ) {
        return this.addVersionedInputToInput(
            ctx,
            ModelResourceIDs.ModelUpdateInputObjectName(typeName),
            versionInput
        )
    }

    private addVersionedInputToDeleteInput(
        ctx: TransformerContext,
        typeName: string,
        versionInput: string,
    ) {
        return this.addVersionedInputToInput(
            ctx,
            ModelResourceIDs.ModelDeleteInputObjectName(typeName),
            versionInput
        )
    }

    private addVersionedInputToInput(
        ctx: TransformerContext,
        inputName: string,
        versionInput: string,
    ) {
        const input = ctx.getType(inputName)
        if (input && input.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION) {
            const updatedFields = [
                ...input.fields,
                makeInputValueDefinition(versionInput, makeNonNullType(makeNamedType("Int")))
            ]
            const updatedInput = {
                ...input,
                fields: updatedFields
            }
            ctx.putType(updatedInput)
        }
    }

    private enforceVersionedFieldOnType(
        ctx: TransformerContext,
        typeName: string,
        versionField: string,
    ) {
        const type = ctx.getType(typeName)
        if (type && type.kind === Kind.OBJECT_TYPE_DEFINITION) {
            const versionFieldImpl = type.fields.find(f => f.name.value === versionField)
            let updatedField = versionFieldImpl
            if (versionFieldImpl) {
                const baseType = getBaseType(versionFieldImpl.type)
                if (baseType === 'Int' || baseType === 'BigInt') {
                    // ok.
                    if (versionFieldImpl.type.kind !== Kind.NON_NULL_TYPE) {
                        updatedField = {
                            ...updatedField,
                            type: makeNonNullType(versionFieldImpl.type),
                        }
                    }
                } else {
                    throw new TransformerContractError(`The versionField "${versionField}" is required to be of type "Int" or "BigInt".`)
                }
            } else {
                updatedField = makeField(versionField, [], makeNonNullType(makeNamedType('Int')))
            }
            const updatedFields = [
                ...type.fields,
                updatedField
            ]
            const updatedType = {
                ...type,
                fields: updatedFields
            }
            ctx.putType(updatedType)
        }
    }
}
```