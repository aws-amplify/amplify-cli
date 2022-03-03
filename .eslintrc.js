const { dictionary } = require('./dictionary');
/**
 * IF YOU ARE TRYING TO EDIT LINT RULES: You probably want to start by looking through the "rules" block below.
 * Docs for each lint plugin we are using are linked there
 */
module.exports = {
  root: true,
  extends: [
    'airbnb',
    'eslint:recommended',
    'plugin:import/recommended',
    'plugin:@typescript-eslint/recommended', // Uses the recommended rules from the @typescript-eslint/eslint-plugin
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
  plugins: ['@typescript-eslint', 'spellcheck', 'import'],
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      typescript: {},
    },
  },
  /**
   * 
   */
  rules: {
    // Spellcheck rules
    // Docs: https://www.npmjs.com/package/eslint-plugin-spellcheck
    'spellcheck/spell-checker': [
      1,
      {
        comments: false,
        strings: true,
        identifiers: false,
        lang: 'en_US',
        skipWords: dictionary,
        skipIfMatch: [
          'http://[^s]*',
          '^[-\\w]+/[-\\w\\.]+$', //For MIME Types
        ],
        minLength: 4,
      },
    ],

    // Typescript rules
    // Extends recommended rules here: https://www.npmjs.com/package/@typescript-eslint/eslint-plugin
    '@typescript-eslint/naming-convention': [
      'warn',
      // Add to this block to enforce naming conventions on different identifiers
      // Docs here: https://github.com/typescript-eslint/typescript-eslint/blob/HEAD/packages/eslint-plugin/docs/rules/naming-convention.md
      {
        selector: ['variable'],
        modifiers: ['const', 'exported'],
        format: ['UPPER_CASE']
      },
      {
        selector: ['enumMember'],
        format: ['UPPER_CASE'],
      },
      {
        selector: ['typeLike'],
        format: ['PascalCase'],
      },
      {
        selector: 'default',
        format: ['strictCamelCase'],
      },
    ],
    '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': 'warn',

    // Import Rules
    // Extends recommended rules here: https://github.com/import-js/eslint-plugin-import/blob/6c957e7df178d1b81d01cf219d62ba91b4e6d9e8/config/recommended.js
    'import/no-dynamic-require': 'error',
    'import/newline-after-import': 'error',
    'import/no-cycle': 'error',
    'import/order': 'error',
    'import/first': 'error',
    'import/no-extraneous-dependencies': 'error',
    'import/no-useless-path-segments': 'error',
    'import/extensions': 'off',

    // ESLint Rules
    // These rules override the AirBnb rules here: https://github.com/airbnb/javascript
    // as well as the recommended ESLint rules here: https://eslint.org/docs/rules/
    'max-len': ['error', 140, 2, {
      ignoreUrls: true,
      ignoreComments: false,
      ignoreRegExpLiterals: true,
      ignoreStrings: true,
      ignoreTemplateLiterals: true,
    }],
    'arrow-parens': ['error', 'as-needed'],
    'lines-between-class-members': ['error', 'always', {exceptAfterSingleLine: true}],
    'max-classes-per-file': 'error',
    'no-lonely-if': 'error',
    'no-shadow': 'error',
    'no-unneeded-ternary': 'error',
    'no-use-before-define': 'off',
    'consistent-return': 'error',
    'no-console': 'warn',
    'no-bitwise': 'error',
    'yoda': 'error',
    'no-var': 'error',
    'strict': 'error',
    'spaced-comment': ['error', 'always'],
    'no-new': 'error',
  },
  overrides: [
    {
      // Add files to this list that shouldn't be spellchecked
      files: ['.eslintrc.js'],
      rules: {
        'spellcheck/spell-checker': 'off',
      },
    },
  ],
  ignorePatterns: [
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

    // Ignore lib directory of typescript packages until all packages are migrated to typescript
    '/packages/amplify-*-function-*/lib',
    '/packages/amplify-appsync-simulator/lib',
    '/packages/amplify-category-api/lib',
    '/packages/amplify-category-auth/lib',
    '/packages/amplify-category-function/lib',
    '/packages/amplify-category-geo/lib',
    '/packages/amplify-category-storage/lib',
    '/packages/amplify-cli-core/lib',
    '/packages/amplify-cli/lib',
    '/packages/amplify-cli-logger/lib',
    '/packages/amplify-e2e-core/lib',
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
    '/packages/amplify-category-custom/src/utils/generate-cfn-from-cdk.ts',

    // Ignore CHANGELOG.md files
    '/packages/*/CHANGELOG.md',
  ],
};
