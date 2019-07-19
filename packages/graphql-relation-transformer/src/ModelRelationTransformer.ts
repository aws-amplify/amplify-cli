import {
    Transformer, TransformerContext, InvalidDirectiveError,
    gql, getDirectiveArguments
} from 'graphql-transformer-core'
import {
    DirectiveNode, ObjectTypeDefinitionNode,
    Kind, FieldDefinitionNode, InterfaceTypeDefinitionNode,
    InputObjectTypeDefinitionNode,
    NamedTypeNode
} from 'graphql'
import {
    getBaseType, isListType, ModelResourceIDs, isNonNullType, wrapNonNull
} from 'graphql-transformer-common'
import { KeySchema } from 'cloudform-types/types/dynamoDb/table';

interface RelationArguments {
    index?: string;
    fields: string[];
}

function validateKeyField(field: FieldDefinitionNode): void {
    if (!field) {
        return
    }
    const baseType = getBaseType(field.type);
    const isAList = isListType(field.type)
    // The only valid key fields are single String and ID fields.
    if (
        (baseType === 'ID' || baseType === 'String') &&
        (!isAList)
    ) {
        return;
    }
    throw new InvalidDirectiveError(`All fields used for a relation must be of type "String" or "ID".`)
}

function checkFieldsAgainstIndex(parentFields: ReadonlyArray<FieldDefinitionNode>,
                                 relatedTypeFields: ReadonlyArray<FieldDefinitionNode>,
                                 inputFields: string[],
                                 tableProperties: any,
                                 numFields: number): void {
    let hashAttributeName = tableProperties.KeySchema[0].AttributeName;
    let tablePKType = relatedTypeFields.find(f => f.name.value === hashAttributeName).type;
    let queryPKType = parentFields.find(f => f.name.value === inputFields[0]).type;

    if (getBaseType(tablePKType) !== getBaseType(queryPKType)) {
        throw new InvalidDirectiveError(inputFields[0] + ' field is not of type ' + getBaseType(tablePKType))
    }
    if (numFields > tableProperties.KeySchema.length) {
        throw new InvalidDirectiveError('Too many fields passed in for relation.')
    }
    if (numFields > 1) {
        let sortAttributeName = tableProperties.KeySchema[1].AttributeName;
        let tableSKType = relatedTypeFields.find(f => f.name.value === sortAttributeName).type;
        let querySKType = parentFields.find(f => f.name.value === inputFields[1]).type;

        if (getBaseType(tableSKType) !== getBaseType(querySKType)) {
            throw new InvalidDirectiveError(inputFields[1] + ' field is not of type ' + getBaseType(tableSKType))
        }
    }
}

export default class RelationTransformer extends Transformer {

    constructor() {
        super(
            'RelationTransformer',
            gql`directive @relation(index: String, fields: [String!]!) on FIELD_DEFINITION`
        )
    }

    public field = (
        parent: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
        field: FieldDefinitionNode,
        directive: DirectiveNode,
        ctx: TransformerContext
    ): void => {
        const parentTypeName = parent.name.value;
        const fieldName = field.name.value;
        const args : RelationArguments = getDirectiveArguments(directive);
        const numFields = args.fields.length;

        // Ensure that there is at least one field provided.
        if (numFields === 0) {
            throw new InvalidDirectiveError('No fields passed in to @relation directive.')
        }

        // Check that @relation was called on a @model type object.
        const parentModelDirective = parent.directives.find((dir: DirectiveNode) => dir.name.value === 'model')
        if (!parentModelDirective) {
            throw new InvalidDirectiveError(`Object type ${parentTypeName} must be annotated with @model.`)
        }

        // Check that related type exists and that the connected object is annotated with @model.
        const relatedTypeName = getBaseType(field.type)
        const relatedType = ctx.inputDocument.definitions.find(
            d => d.kind === Kind.OBJECT_TYPE_DEFINITION && d.name.value === relatedTypeName
        ) as ObjectTypeDefinitionNode | undefined

        if (!relatedType) {
            throw new InvalidDirectiveError(`Could not find an object type named ${relatedTypeName}.`)
        }

        const modelDirective = relatedType.directives.find((dir: DirectiveNode) => dir.name.value === 'model')
        if (!modelDirective) {
            throw new InvalidDirectiveError(`Object type ${relatedTypeName} must be annotated with @model.`)
        }

        // Check that each field provided exists in the parent model and that it is a valid key type (string or ID).
        args.fields.forEach(
            item => {
                let currfield = parent.fields.find(f => f.name.value === item);
                if (!currfield) {
                    throw new InvalidDirectiveError(item + ' is not a field in ' + parentTypeName)
                } else {
                    validateKeyField(currfield);
                }
            })

        // Get Child object's table.
        const tableLogicalID = ModelResourceIDs.ModelTableResourceID(relatedType.name.value);
        const tableResource = ctx.getResource(tableLogicalID);

        // If no index is provided use the default index for the related model type and
        // check that the query fields match the PK/SK of the table. Else confirm that index exists.
        if (!args.index || args.index === 'default' || args.index === 'Default') {

            args.index = 'default';
            checkFieldsAgainstIndex(parent.fields, relatedType.fields, args.fields, tableResource.Properties, numFields);

        } else {
            const index = (tableResource.Properties.GlobalSecondaryIndexes ?
                tableResource.Properties.GlobalSecondaryIndexes.find(GSI => GSI.IndexName === args.index) : null)
                || (tableResource.Properties.LocalSecondaryIndexes ?
                tableResource.Properties.LocalSecondaryIndexes.find(LSI => LSI.IndexName === args.index) : null)
            if (!index) {
                throw new InvalidDirectiveError('Index ' + args.index + ' does not exist for model ' + relatedTypeName)
            }

            // Confirm that types of query fields match types of PK/SK of the index being queried.
            checkFieldsAgainstIndex(parent.fields, relatedType.fields, args.fields, index, numFields);
        }

        // If the related type is not a list, the index has to be the default index and the fields provided must match the PK/SK of the index.
        if (!isListType(field.type)) {
            if (args.index !== 'default') {
                throw new InvalidDirectiveError('Relation is to a single object but the query index is not the default.')
            }
        }


        // Configure resolver that


    }

}