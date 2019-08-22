import { getBaseType } from 'graphql-transformer-common';
import {
    FieldDefinitionNode,
} from 'graphql'
/**
* Given a Type returns a plain JS map of its arguments
* @param arguments The list of argument nodes to reduce.
*/
export function getFieldArguments(type: any): any {
   return type.fields ? type.fields.reduce(
       (acc: {}, arg: FieldDefinitionNode) => ({
           ...acc,
           [arg.name.value]: getBaseType(arg.type)
       }),
       {}
   ) : []
}