const dictionary = require('./.eslint-dictionary.json');
/**
 * README if you have come here because you are sick and tired of some rule being on your case all the time:
 * If you are trying to modify a rule for normal code, see the docs for each of the lint plugins we are using in the "rules" section.
 * If you are trying to add a word to spellcheck: run `yarn addwords <word1> <word2> ...`
 * If you are trying to ignore certain files from spellchecking, see the "overrides" section
 * If you are trying to modify rules that run in test files, see the "overrides" section
 * If you are trying to ignore certain files from linting, see "ignorePatterns" at the bottom of the file
 */
module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  parser: '@typescript-eslint/parser', // Specifies the ESLint parser
  env: {
    es6: true,
    node: true,
    jest: true,
  },
  parserOptions: {
    ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
    sourceType: 'module', // Allows for the use of imports
    ecmaFeatures: {
      jsx: true, // Allows for the parsing of JSX
      arrowFunctions: true,
      modules: true,
      module: true,
    },
  },
  plugins: ['@typescript-eslint', 'spellcheck', 'import', 'jsdoc', 'prefer-arrow'],
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      typescript: {},
    },
  },
  rules: {
    "@typescript-eslint/no-var-requires": "off",
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/no-misused-promises": "error",
    "no-bitwise": "warn",
  },
  "parserOptions": {
    "project": [
      "tsconfig.base.json",
      "packages/amplify-cli/tsconfig.json"
    ]
  },
  overrides: [
    {
      // Add files to this list that shouldn't be spellchecked
      files: ['.eslintrc.js'],
      rules: {
        'spellcheck/spell-checker': 'off',
      },
    },
    {
      // edit rules here to modify test linting
      files: ['__tests__/**', '*.test.ts'],
      plugins: ['jest'],
      extends: ['plugin:jest/recommended'],
      rules: {
        '@typescript-eslint/unbound-method': 'off',
        'jest/unbound-method': 'error',
        '@typescript-eslint/no-explicit-any': 'off',
      }
    }
  ],
  // Files / paths / globs that shouldn't be linted at all
  // (note that only .js, .jsx, .ts, and .tsx files are linted in the first place)
  ignorePatterns: [
    '**/__tests__/**',
    '**.test.**',
    '.eslintrc.js',
    'scripts/',
    'node_modules',
    'dist',
    'build',
    '__mocks__',
    'coverage',

    // Forked package
    'amplify-velocity-template',

    // Project specific excludes
    '/cypress',
    '/packages/amplify-appsync-simulator/public',
    '/packages/amplify-cli/scripts/post-install.js',

    // Ignore project/file templates
    'function-template-dir',
    '/packages/graphql-predictions-transformer/lambdaFunction',

    // Ignore override resource test files
    '/packages/amplify-e2e-tests/overrides',

    // Ignore lib directory of typescript packages until all packages are migrated to typescript
    '/packages/amplify-*-function-*/lib',
    '/packages/amplify-appsync-simulator/lib',
    '/packages/amplify-category-api/lib',
    '/packages/amplify-category-auth/lib',
    '/packages/amplify-category-function/lib',
    '/packages/amplify-category-geo/lib',
    '/packages/amplify-category-storage/lib',
    '/packages/amplify-cli-npm/lib',
    '/packages/amplify-cli-core/lib',
    '/packages/amplify-cli/lib',
    '/packages/amplify-cli-logger/lib',
    '/packages/amplify-e2e-core/lib',
    '/packages/amplify-e2e-tests/lib',
    '/packages/amplify-function-plugin-interface/lib',
    '/packages/amplify-graphql-schema-test-library/lib',
    '/packages/amplify-headless-interface/lib',
    '/packages/amplify-migration-tests/lib',
    '/packages/amplify-prompts/lib',
    '/packages/amplify-provider-awscloudformation/lib',
    '/packages/amplify-storage-simulator/lib',
    '/packages/amplify-ui-tests/lib',
    '/packages/amplify-util-headless-input/lib',
    '/packages/amplify-util-mock/lib',
    '/packages/graphql-*-transformer/lib',
    '/packages/graphql-mapping-template/lib',
    '/packages/graphql-transformer-*/lib',
    '/packages/amplify-headless-interface/lib',
    '/packages/amplify-util-headless-input/lib',
    '/packages/amplify-util-uibuilder/lib',
    '/packages/amplify-graphql-docs-generator/lib',
    '/packages/amplify-graphql-*transformer*/lib',
    '/packages/amplify-graphql-types-generator/lib',
    '/packages/amplify-provider-awscloudformation/lib',
    '/packages/amplify-console-integration-tests/lib',
    '/packages/amplify-cli-extensibility-helper/lib',
    '/packages/amplify-category-auth/resources/auth-custom-resource',
    '/packages/amplify-category-custom/lib',
    '/packages/amplify-category-custom/resources',
    '/packages/amplify-console-hosting/lib/',
    '/packages/amplify-container-hosting/lib/',
    '/packages/amplify-category-predictions/lib',
    '/packages/amplify-category-analytics/lib',
    '/packages/amplify-category-notifications/lib',
    '/amplify-category-interactions/lib',
    '/packages/amplify-category-custom/src/utils/generate-cfn-from-cdk.ts',
    '/packages/amplify-environment-parameters/lib',
    '/packages/amplify-opensearch-simulator/lib',

    // Ignore CHANGELOG.md files
    '/packages/*/CHANGELOG.md',
  ],
};
