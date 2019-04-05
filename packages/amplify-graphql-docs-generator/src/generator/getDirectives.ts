import {
  GraphQLDirective,
  GraphQLField,
  getDirectiveValues,
  getNamedType,
  DirectiveDefinitionNode,
  DirectiveNode,
  GraphQLNonNull,
  NameNode,
  ArgumentNode,
  ValueNode,
} from 'graphql'
import getArgs from './getArgs'
import getType from './utils/getType'

export default function getDirectives(operation: GraphQLField<any, any>) {
  const astNode = operation.astNode
  if (!astNode) {
    return []
  }
  const directiveNode = astNode.directives
  const d = directiveNode.map((dNode: DirectiveNode) => {
    return {
      name: dNode.name.value,
      args: getArguments(dNode.arguments),
    }
  })
  return d
}

export function getNameFromNameNode(name: NameNode) {
  return name.value
}

export function getArguments(args: ReadonlyArray<ArgumentNode>) {
  return args.map((arg) => ({
    name: getNameFromNameNode(arg.name),
    value: JSON.stringify(getValueFromValeNode(arg.value)),
  }))
}

export function getValueFromValeNode(val: any) {
  switch (val.kind) {
    case 'NullValue':
      return null
    case 'ListValue':
      return val.values.map((v) => getValueFromValeNode(v))
    case 'ObjectValue':
      const obj = {}
      val.fields.reduce((acc, f) => {
        acc[getNameFromNameNode(f.name)] = getValueFromValeNode(f.value)
      }, obj)
      return obj
    case 'FloatValue':
    case 'IntValue':
      return Number(val.value)
    default:
      return val.value
  }
}
