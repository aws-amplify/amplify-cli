import { Transformer, TransformerContext, InvalidDirectiveError, TransformerContractError, gql } from "graphql-transformer-core";
import {
    valueFromASTUntyped,
    ArgumentNode,
    ObjectTypeDefinitionNode,
    DirectiveNode,
    Kind
} from "graphql";
import { printBlock, compoundExpression, set, ref, qref, obj, str, raw } from 'graphql-mapping-template'
import {
    ResourceConstants,
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
            gql`directive @versioned(versionField: String = "version", versionInput: String = "expectedVersion") on OBJECT`
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
            throw new InvalidDirectiveError('Types annotated with @versioned must also be annotated with @model.')
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
                    `After stripping away version field "${versionField}", \
                    the create input for type "${typeName}" cannot be created \
                    with 0 fields. Add another field to type "${typeName}" to continue.`
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
            let updatedFields = type.fields
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
                        updatedFields = updatedFields.map(
                            f => f.name.value === versionField ? updatedField : f
                        )
                    }
                } else {
                    throw new TransformerContractError(`The versionField "${versionField}" is required to be of type "Int" or "BigInt".`)
                }
            } else {
                updatedField = makeField(versionField, [], makeNonNullType(makeNamedType('Int')))
                updatedFields = [
                    ...updatedFields,
                    updatedField
                ]
            }
            const updatedType = {
                ...type,
                fields: updatedFields
            }
            ctx.putType(updatedType)
        }
    }
}
