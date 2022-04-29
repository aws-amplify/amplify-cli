import { methodCall, ref, ReferenceNode, set } from 'graphql-mapping-template';

/**
 * VTL Ref to the transformedArgs in the context stash
 */
export const transformedArgsRef = ref('ctx.stash.transformedArgs');

/**
 * VTL node to assign $args to transformedArgs with a fallback to $ctx.args if transformedArgs is not set
 */
export const setArgs = set(ref('args'), methodCall(ref('util.defaultIfNull'), transformedArgsRef, ref('ctx.args')));

/**
 * VTL node to set transformedArgs to the given value
 */
export const setTransformedArgs = (value: ReferenceNode) => set(transformedArgsRef, value);
