/**
 * @param {args: Record<string, any>, fieldMap: Record<string, string>} event
 * @returns if args does not contain a filter or condition key, returns args unchanged
 * if args contains a filter or condition key, the object under those keys are traversed and any key matching a key in fieldMap is renamed to the corresponding value in fieldMap
 *
 * @example
 * given event:
 * {
 *  args: {
 *    filter: {
 *      or: [
 *        { articleCommentsId: { eq: 'testtest' } },
 *        { message: { beginsWith: 'hello' } },
 *        { and: [
 *          { articleCommentsId: {beginsWith: 'aa' } },
 *          { createdAt: {lt: 'date' } }
 *        ]}
 *      ]
 *    }
 *  },
 *  fieldMap: {
 *    articleCommentsId: 'postCommentsId'
 *  }
 * }
 *
 * the function will return
 * {
 *    filter: {
 *      or: [
 *        { postCommentsId: { eq: 'testtest' } },
 *        { message: { beginsWith: 'hello' } },
 *        { and: [
 *          { postCommentsId: {beginsWith: 'aa' } },
 *          { createdAt: {lt: 'date' } }
 *        ]}
 *      ]
 *    }
 *  }
 */
exports.handler = async event => {
  console.log('Processing input mapping event');
  const { args, fieldMap } = event;
  if (!args) {
    throw new Error('Event did not specify GraphQL input arguments');
  }
  if (!fieldMap) {
    throw new Error('Event did not specify field mappings');
  }
  const fieldMapKeySet = Object.keys(fieldMap);
  const argNodesStack = [];
  if (args.filter) {
    argNodesStack.push(args.filter);
  }
  if (args.condition) {
    argNodesStack.push(args.condition);
  }

  while (argNodesStack.length) {
    const argNode = argNodesStack.pop();
    Object.entries(argNode).forEach(([key, value]) => {
      if (fieldMapKeySet.includes(key)) {
        argNode[fieldMap[key]] = argNode[key];
        argNode[key] = undefined;
      } else if (typeof value === 'object') {
        argNodesStack.push(value);
      }
    });
  }

  /**
   * If the value of field is in the fieldMap, the value is replaced with the mapped value
   * @param {field: string} entry a sort of aggregates entry
   * @returns the entry with renamed fields
   */
  const mapEnumValue = entry => {
    if (fieldMapKeySet.includes(entry.field)) {
      entry.field = fieldMap[entry.field];
    }
  };

  if (Array.isArray(args.sort)) {
    args.sort.forEach(mapEnumValue);
  }
  if (args.aggregates) {
    args.aggregates.forEach(mapEnumValue);
  }
  console.log('Successfully returning mapped args');
  return args;
};
