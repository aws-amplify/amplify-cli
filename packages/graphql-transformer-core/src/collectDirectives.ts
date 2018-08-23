import {
    ObjectTypeDefinitionNode, DirectiveNode, InterfaceTypeDefinitionNode,
    UnionTypeDefinitionNode, ScalarTypeDefinitionNode, InputObjectTypeDefinitionNode,
    FieldDefinitionNode, InputValueDefinitionNode, EnumValueDefinitionNode, EnumTypeDefinitionNode,
    parse,
    Kind
} from "graphql";

export function collectDirectiveNames(sdl: string): string[] {
    const dirs = collectDirectives(sdl)
    return dirs.map(d => d.name.value)
}

export function collectDirectives(sdl: string): DirectiveNode[] {
    const doc = parse(sdl)
    let directives = []
    for (const def of doc.definitions) {
        switch (def.kind) {
            case Kind.OBJECT_TYPE_DEFINITION:
                directives = directives.concat(collectObjectDirectives(def))
                break;
            case Kind.INTERFACE_TYPE_DEFINITION:
                directives = directives.concat(collectInterfaceDirectives(def))
                break;
            case Kind.UNION_TYPE_DEFINITION:
                directives = directives.concat(collectUnionDirectives(def))
                break;
            case Kind.INPUT_OBJECT_TYPE_DEFINITION:
                directives = directives.concat(collectInputObjectDirectives(def))
                break;
            case Kind.ENUM_TYPE_DEFINITION:
                directives = directives.concat(collectEnumDirectives(def))
                break;
            case Kind.SCALAR_TYPE_DEFINITION:
                directives = directives.concat(collectScalarDirectives(def))
                break;
        }
    }
    return directives
}

export function collectObjectDirectives(node: ObjectTypeDefinitionNode): DirectiveNode[] {
    let dirs = []
    for (const field of node.fields) {
        const fieldDirs = collectFieldDirectives(field)
        dirs = dirs.concat(fieldDirs)
    }
    return dirs.concat(node.directives)
}

export function collectInterfaceDirectives(node: InterfaceTypeDefinitionNode): DirectiveNode[] {
    let dirs = []
    for (const field of node.fields) {
        const fieldDirs = collectFieldDirectives(field)
        dirs = dirs.concat(fieldDirs)
    }
    return dirs.concat(node.directives)
}

export function collectFieldDirectives(node: FieldDefinitionNode): DirectiveNode[] {
    let dirs = []
    for (const arg of node.arguments) {
        const argDirs = collectArgumentDirectives(arg)
        dirs = dirs.concat(argDirs)
    }
    return dirs.concat(node.directives)
}

export function collectArgumentDirectives(node: InputValueDefinitionNode): DirectiveNode[] {
    return [...(node.directives || [])]
}

export function collectUnionDirectives(node: UnionTypeDefinitionNode): DirectiveNode[] {
    return [...(node.directives || [])]
}

export function collectScalarDirectives(node: ScalarTypeDefinitionNode): DirectiveNode[] {
    return [...(node.directives || [])]
}

export function collectInputObjectDirectives(node: InputObjectTypeDefinitionNode): DirectiveNode[] {
    let dirs = []
    for (const field of node.fields) {
        const fieldDirs = collectArgumentDirectives(field)
        dirs = dirs.concat(fieldDirs)
    }
    return dirs.concat(node.directives)
}

export function collectEnumDirectives(node: EnumTypeDefinitionNode): DirectiveNode[] {
    let dirs = []
    for (const val of node.values) {
        const valDirs = collectEnumValueDirectives(val)
        dirs = dirs.concat(valDirs)
    }
    return dirs.concat(node.directives)
}

export function collectEnumValueDirectives(node: EnumValueDefinitionNode): DirectiveNode[] {
    return [...(node.directives || [])]
}