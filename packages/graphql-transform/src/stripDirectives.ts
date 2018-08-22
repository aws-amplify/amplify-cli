import {
    ObjectTypeDefinitionNode, DirectiveNode, InterfaceTypeDefinitionNode,
    UnionTypeDefinitionNode, ScalarTypeDefinitionNode, InputObjectTypeDefinitionNode,
    FieldDefinitionNode, InputValueDefinitionNode, EnumValueDefinitionNode, EnumTypeDefinitionNode,
    parse,
    Kind,
    DocumentNode
} from "graphql";

export function stripDirectives(doc: DocumentNode): DocumentNode {
    const definitions = []
    for (const def of doc.definitions) {
        switch (def.kind) {
            case Kind.OBJECT_TYPE_DEFINITION:
                definitions.push(stripObjectDirectives(def))
                break;
            case Kind.INTERFACE_TYPE_DEFINITION:
                definitions.push(stripInterfaceDirectives(def))
                break;
            case Kind.UNION_TYPE_DEFINITION:
                definitions.push(stripUnionDirectives(def))
                break;
            case Kind.INPUT_OBJECT_TYPE_DEFINITION:
                definitions.push(stripInputObjectDirectives(def))
                break;
            case Kind.ENUM_TYPE_DEFINITION:
                definitions.push(stripEnumDirectives(def))
                break;
            case Kind.SCALAR_TYPE_DEFINITION:
                definitions.push(stripScalarDirectives(def))
                break;
        }
    }
    return {
        kind: Kind.DOCUMENT,
        definitions
    }
}

export function stripObjectDirectives(node: ObjectTypeDefinitionNode): ObjectTypeDefinitionNode {
    return {
        ...node,
        directives: []
    }
}

export function stripInterfaceDirectives(node: InterfaceTypeDefinitionNode): InterfaceTypeDefinitionNode {
    return {
        ...node,
        directives: []
    }
}

export function stripFieldDirectives(node: FieldDefinitionNode): FieldDefinitionNode {
    return {
        ...node,
        directives: []
    }
}

export function stripArgumentDirectives(node: InputValueDefinitionNode): InputValueDefinitionNode {
    return {
        ...node,
        directives: []
    }
}

export function stripUnionDirectives(node: UnionTypeDefinitionNode): UnionTypeDefinitionNode {
    return {
        ...node,
        directives: []
    }
}

export function stripScalarDirectives(node: ScalarTypeDefinitionNode): ScalarTypeDefinitionNode {
    return {
        ...node,
        directives: []
    }
}

export function stripInputObjectDirectives(node: InputObjectTypeDefinitionNode): InputObjectTypeDefinitionNode {
    return {
        ...node,
        directives: []
    }
}

export function stripEnumDirectives(node: EnumTypeDefinitionNode): EnumTypeDefinitionNode {
    return {
        ...node,
        directives: []
    }
}

export function stripEnumValueDirectives(node: EnumValueDefinitionNode): EnumValueDefinitionNode {
    return {
        ...node,
        directives: []
    }
}