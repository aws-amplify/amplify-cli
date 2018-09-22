import { GraphQLArgument } from 'graphql'

import getType from './utils/getType'
import isRequired from './utils/isRequired'

import { GQLTemplateArgDeclaration } from './types'

export default function getArgs(args: GraphQLArgument[]): Array<GQLTemplateArgDeclaration> {
  const argMaps = args.map((arg: GraphQLArgument) => ({
    name: arg.name,
    type: getType(arg.type).name,
    isRequired: isRequired(arg),
    defaultValue: arg.defaultValue,
  }))
  return argMaps
}
