/**
 * The following is a map of versions and a function.
 * e.g. If the current version is 5 that means there will be a warning message going from
 * 5 -> 6. This map should be used when moving from the current version to the latest version.
 */
export const TRANSFORM_CONFIG_VERSION_MAP = {
  3: directives => {
    if (directives.includes('auth')) {
      return 'The default behavior for @auth has changed in the latest version of Amplify\nRead here for details: https://aws-amplify.github.io/docs/cli-toolchain/graphql#authorizing-subscriptions/n';
    }
  },
  5: directives => {
    if (directives.includes('searchable')) {
      return 'The behavior for @searchable has changed after version 4.14.1.\nRead here for details: https://aws-amplify.github.io/docs/cli-toolchain/graphql#searchable/n';
    }
  },
};
