/**
 * GraphQL Allows to show custom errors properties in errors using a property called extensions.
 * AppSync doesn't use extensions in error instead it puts the error at the objects root level.
 * For instance, UnAuthorized has errotType field with value Unauthorized.
 *
 * This utility method takes all the properties exposed through extensions and exposes them at root
 * level of the Error object
 * @param errors GraphQLError object
 *
 */
export function exposeGraphQLErrors(errors = []) {
  return errors.map(e => {
    if (e.extensions) {
      const additionalProps = Object.entries(e.extensions).reduce((sum, [k, v]) => {
        return { ...sum, [k]: { value: v, enumerable: true } };
      }, {});
      Object.defineProperties(e, additionalProps);
    }
    return e;
  });
}
