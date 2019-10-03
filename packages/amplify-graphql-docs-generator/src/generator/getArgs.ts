import { GraphQLArgument } from 'graphql';

import getType from './utils/getType';
import isList from './utils/isList';
import isRequired from './utils/isRequired';
import isRequiredList from './utils/isRequiredList';

import { GQLTemplateArgDeclaration } from './types';

export default function getArgs(args: GraphQLArgument[]): Array<GQLTemplateArgDeclaration> {
  const argMaps = args.map((arg: GraphQLArgument) => ({
    name: arg.name,
    type: getType(arg.type).name,
    isRequired: isRequired(arg.type),
    isList: isList(arg.type),
    isListRequired: isRequiredList(arg.type),
    defaultValue: arg.defaultValue,
  }));
  return argMaps;
}
