import {
    DirectiveNode,
    ArgumentNode,
    valueFromASTUntyped,
} from 'graphql'
/**
* Given a directive returns a plain JS map of its arguments
* @param arguments The list of argument nodes to reduce.
*/
export function getDirectiveArguments(directive: DirectiveNode): any {
   return directive.arguments ? directive.arguments.reduce(
       (acc: {}, arg: ArgumentNode) => ({
           ...acc,
           [arg.name.value]: valueFromASTUntyped(arg.value)
       }),
       {}
   ) : []
}