/**
 * @param {args: Record<string, any>, fieldMap: Record<string, string>} event
 * @returns if args does not contain a filter or condition key, returns args unchanged
 * if args contains a filter or condition key, the object under those keys are traversed and any key matching a key in fieldMap is renamed to the corresponding value in fieldMap
 *
 * @example
 * given event: {
 *  args: {
 *    filter: {
 *      articleCommentsId: {
 *        eq: '90b5058a-c1fb-4682-901a-a5acc6d6ae08'
 *      },
 *      message: {
 *        beginsWith: 'hello'
 *      },
 *      or: {
 *        articleCommentsId: {
 *          beginsWith: 'aa'
 *        },
 *        and: {
 *          articleCommentsId: {
 *            lt: 'ZZ'
 *          }
 *        }
 *      }
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
 *      postCommentsId: {
 *        eq: '90b5058a-c1fb-4682-901a-a5acc6d6ae08'
 *      },
 *      message: {
 *        beginsWith: 'hello'
 *      },
 *      or: {
 *        postCommentsId: {
 *          beginsWith: 'aa'
 *        },
 *        and: {
 *          postCommentsId: {
 *            lt: 'ZZ'
 *          }
 *        }
 *      }
 *    }
 *  },
 */
exports.handler = async event => {
  console.log('Got event', event);
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
  console.log('Returning args:', args);
  return args;
};
