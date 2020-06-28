module.exports = {
  root: true,
  extends: [
    'airbnb',
    'eslint:recommended',
    'plugin:prettier/recommended',
    'plugin:react/recommended',  // Uses the recommended rules from @eslint-plugin-react
    'plugin:@typescript-eslint/eslint-recommended',  // Uses the recommended rules from the @typescript-eslint/eslint-plugin
    'plugin:@typescript-eslint/recommended',  // Uses the recommended rules from the @typescript-eslint/eslint-plugin
    'prettier/@typescript-eslint',  // Uses eslint-config-prettier to disable ESLint rules from @typescript-eslint/eslint-plugin that would conflict with prettier
  ],
  parser: '@typescript-eslint/parser',  // Specifies the ESLint parser
  env: {
    es6: true,
    node: true,
    jest: true,
  },
  parserOptions: {
    ecmaVersion: 2020,  // Allows for the parsing of modern ECMAScript features
    sourceType: 'module',  // Allows for the use of imports
    ecmaFeatures: {
      jsx: true,  // Allows for the parsing of JSX
      arrowFunctions: true,
      modules: true,
      module: true,
    },
  },
  plugins: [
    '@typescript-eslint',
    'prettier',
    'spellcheck',
  ],
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      typescript: {},
    },
    react: {
      version: 'detect',  // Tells eslint-plugin-react to automatically detect the version of React to use
    },
  },
  rules: {
    "spellcheck/spell-checker": [1,
      {
        "comments": false,
        "strings": true,
        "identifiers": false,
        "lang": "en_US",
        "skipWords": [
            "dict",
            "aff",
            "hunspellchecker",
            "hunspell",
            "utils",
            "aws",
            "sdk",
        ],
        "skipIfMatch": [
            "http://[^s]*",
            "^[-\\w]+\/[-\\w\\.]+$" //For MIME Types
        ],
        "skipWordIfMatch": [
            "^foobar.*$" // words that begin with foobar will not be checked
        ],
        "minLength": 3
     }
    ],
    // Existing rules
    'comma-dangle': 'off', // https://eslint.org/docs/rules/comma-dangle
    'function-paren-newline': 'off', // https://eslint.org/docs/rules/function-paren-newline
    'global-require': 'off', // https://eslint.org/docs/rules/global-require
    'import/no-dynamic-require': 'off', // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-dynamic-require.md
    'no-inner-declarations': 'off', // https://eslint.org/docs/rules/no-inner-declarations

    // New rules
    'class-methods-use-this': 'off',
    'import/extensions': 'off',
    'import/no-default-export': 'error',
    'import/prefer-default-export': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-var-requires': 'off',

    // TODO Rules to enable linter pass for upgrade, fix them first
    'eqeqeq': 'off',
    'func-names': 'off',
    'lines-between-class-members': 'off',
    'max-classes-per-file': 'off',
    'no-lonely-if': 'off',
    'no-loop-func': 'off',
    'no-self-assign': 'off',
    'no-shadow': 'off',
    'no-unneeded-ternary': 'off',
    'no-unreachable': 'off',
    'no-unused-expressions': 'off',
    'no-useless-catch': 'off',
    'no-useless-return': 'off',
    'object-shorthand': 'off',
    'prefer-const': 'off',
    'prefer-template': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-this-alias': 'off',
    'import/named': 'off',
    'import/newline-after-import': 'off',
    'import/no-cycle': 'off',
    'import/no-default-export': 'off',
    'react/destructuring-assignment': 'off',

    // TODO These rules are code beauty ones
    'import/order': 'off',
    'prettier/prettier': 'off',

    // TODO needs to be enabled when fixing valid warnings of this error
    'no-constant-condition': ['error', { 'checkLoops': false }],
    //'no-param-reassign': ['error', { 'props': false }],
    'no-param-reassign': 'off', // https://eslint.org/docs/rules/no-param-reassign
    //'no-plusplus': ['error', { 'allowForLoopAfterthoughts': true }], // https://eslint.org/docs/rules/no-plusplus
    'no-plusplus': 'off',

    // TODO enable later
    'consistent-return': 'off', // https://eslint.org/docs/rules/consistent-return
    'no-console': 'off', // https://eslint.org/docs/rules/no-console
    'no-prototype-builtins': 'off', // https://eslint.org/docs/rules/no-prototype-builtins
    'no-unused-vars': 'off', // https://eslint.org/docs/rules/no-unused-vars
    'no-use-before-define': 'off', // https://eslint.org/docs/rules/no-use-before-define
    'prefer-destructuring': 'off', // https://eslint.org/docs/rules/prefer-destructuring
    'prefer-object-spread': 'off', // https://eslint.org/docs/rules/prefer-object-spread
    '@typescript-eslint/camelcase': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-use-before-define': 'off',

    // The errors for these rules needs a review one-by-one
    'no-await-in-loop': 'off', // https://eslint.org/docs/rules/no-await-in-loop
    'no-continue': 'off', // https://eslint.org/docs/rules/no-continue
    'no-else-return': 'off',
    'no-return-await': 'off', // https://eslint.org/docs/rules/no-return-await

    // TSLint existing rules
    '@typescript-eslint/class-name-casing': 'error',
    'curly': 'off', // Enable later
    'guard-for-in': 'error',
    'indent': 'off', // Enable later
    //'indent': ['error', 2],
    'no-labels': 'error',
    'no-caller': 'error',
    'no-bitwise': 'error',
    'no-new-wrappers': 'error',
    '@typescript-eslint/no-parameter-properties': 'off',
    'no-debugger': 'error',
    'no-eval': 'error',
    'dot-notation': 'off', // Enable later
    'no-trailing-spaces': 'error',
    'no-unused-expressions': 'error',
    'semi': 'off', // Enable later,
    '@typescript-eslint/typedef': 'off', // Enable later
    //'@typescript-eslint/typedef': ['error', { propertyDeclaration:true, variableDeclaration: true, memberVariableDeclaration: true }],

    // TS related rules to be enabled later
    'no-underscore-dangle': 'off',
    'no-restricted-syntax': 'off',
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/prefer-namespace-keyword': 'off',
    '@typescript-eslint/no-namespace': 'off',
    'no-template-curly-in-string': 'off', // Review one-by-one
    'import/first': 'off',
    'no-case-declarations': 'off',
    'yoda': 'off',
    'no-undef-init': 'off',
    'vars-on-top': 'off',
    'no-var': 'off',
    'lines-around-directive': 'off',
    'strict': 'off',
    'import/export': 'off',
    'default-case': 'off',
    'no-return-assign': 'off',
    'import/no-duplicates': 'off',
    '@typescript-eslint/interface-name-prefix': 'off',
    'no-throw-literal': 'off',
    'react/static-property-placement': 'off',
    'import/no-extraneous-dependencies': 'off',
    'spaced-comment': 'off',
    '@typescript-eslint/no-array-constructor': 'off',
    'prefer-rest-params': 'off',
    'no-useless-escape': 'off',
    'eol-last': 'off',
    'no-useless-concat': 'off',
    'no-multi-str': 'off',
    'array-callback-return': 'off',
    '@typescript-eslint/consistent-type-assertions': 'off',
    'no-extra-boolean-cast': 'off',
    'no-async-promise-executor': 'off',
    'no-nested-ternary': 'off',
    'no-unused-expressions': 'off',
    'no-sequences': 'off',
    '@typescript-eslint/no-empty-interface': 'off',
    'react/jsx-filename-extension': 'off',
    'react/state-in-constructor': 'off',
    'react/no-access-state-in-setstate': 'off',
    'react/jsx-closing-tag-location': 'off',
    'react/sort-comp': 'off',
    'jsx-a11y/label-has-associated-control': 'off',
    'no-empty': 'off',
    'import/no-unresolved': 'off',
    'no-useless-constructor': 'off',
    'import/no-useless-path-segments': 'off',
    'no-cond-assign': 'off',
    '@typescript-eslint/no-non-null-assertions': 'off',
    'new-cap': 'off',
    'no-new': 'off',
    'no-restricted-globals': 'off',
    'no-constant-condition': 'off',
    'operator-assignment': 'off',
    'import/no-named-default': 'off',
  },
  'ignorePatterns': [
    'node_modules',
    'dist',
    'build',
    'tests',
    '__test__',
    '__tests__',
    '__mocks__',
    '__e2e__',
    'coverage',

    '/packages/amplify-graphql-types-generator/test', // Not linting tests yet
    'amplify-e2e-tests', // Not linting test projects yet
    'graphql-transformers-e2e-tests', // Not linting test projects yet
    'amplify-velocity-template', // Exclude for now as this was existing code before

    // Project specific excludes
    '/cypress',
    '/packages/amplify-appsync-simulator/public',
    '/packages/amplify-cli/scripts/post-install.js',

    // Ignore project/file templates
    'function-template-dir',
    '/packages/graphql-predictions-transformer/lambdaFunction',

    // Ignore output directories of typescript project until move to tsc and fixing src locations
    '/packages/amplify-appsync-simulator/lib',
    '/packages/amplify-category-function/lib',
    '/packages/amplify-*-function-*/lib',
    '/packages/amplify-cli/lib',
    '/packages/amplify-codegen-appsync-model-plugin/lib',
    '/packages/amplify-e2e-core/lib',
    '/packages/amplify-migration-tests/lib',
    '/packages/amplify-graphql-docs-generator/lib',
    '/packages/amplify-graphql-types-generator/lib',
    '/packages/amplify-storage-simulator/lib',
    '/packages/amplify-ui-tests/lib',
    '/packages/amplify-util-mock/lib',
    '/packages/graphql-mapping-template/lib',
    '/packages/graphql-*-transformer/lib',
    '/packages/graphql-transformer-*/lib',

    // Ignore CHANGELOG.md files
    '/packages/*/CHANGELOG.md'
  ]
};
