module.exports = {
  root: true,
  extends: [
    'airbnb',
    'eslint:recommended',
    "plugin:prettier/recommended",
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
    'prettier'
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
    // Existing rules
    "comma-dangle": "off", // https://eslint.org/docs/rules/comma-dangle
    "function-paren-newline": "off", // https://eslint.org/docs/rules/function-paren-newline
    "global-require": "off", // https://eslint.org/docs/rules/global-require
    "import/no-dynamic-require": "off", // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-dynamic-require.md
    "no-inner-declarations": "off", // https://eslint.org/docs/rules/no-inner-declarations

    // New rules
    "class-methods-use-this": "off",
    "import/extensions": "off",
    "import/no-default-export": "error",
    "import/prefer-default-export": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-var-requires": "off",

    // TODO Rules to enable linter pass for upgrade, fix them first
    "eqeqeq": "off",
    "func-names": "off",
    "lines-between-class-members": "off",
    "max-classes-per-file": "off",
    "no-lonely-if": "off",
    "no-loop-func": "off",
    "no-self-assign": "off",
    "no-shadow": "off",
    "no-undef": "off",
    "no-unneeded-ternary": "off",
    "no-unreachable": "off",
    "no-unused-expressions": "off",
    "no-useless-catch": "off",
    "no-useless-return": "off",
    "object-shorthand": "off",
    "prefer-const": "off",
    "prefer-template": "off",
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/no-this-alias": "off",
    "import/named": "off",
    "import/newline-after-import": "off",
    "import/no-cycle": "off",
    "import/no-default-export": "off",
    "react/destructuring-assignment": "off",

    // TODO These rules are code beauty ones
    "import/order": "off",
    "prettier/prettier": "off",

    // TODO needs to be enabled when fixing valid warnings of this error
    "no-constant-condition": ["error", { "checkLoops": false }],
    //"no-param-reassign": ["error", { "props": false }],
    "no-param-reassign": "off", // https://eslint.org/docs/rules/no-param-reassign
    "no-plusplus": ["error", { "allowForLoopAfterthoughts": true }], // https://eslint.org/docs/rules/no-plusplus

    // TODO enable later
    "consistent-return": "off", // https://eslint.org/docs/rules/consistent-return
    "no-console": "off", // https://eslint.org/docs/rules/no-console
    "no-prototype-builtins": "off", // https://eslint.org/docs/rules/no-prototype-builtins
    "no-unused-vars": "off", // https://eslint.org/docs/rules/no-unused-vars
    "no-use-before-define": "off", // https://eslint.org/docs/rules/no-use-before-define
    "prefer-destructuring": "off", // https://eslint.org/docs/rules/prefer-destructuring
    "prefer-object-spread": "off", // https://eslint.org/docs/rules/prefer-object-spread
    "@typescript-eslint/camelcase": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-use-before-define": "off",

    // The errors for these rules needs a review one-by-one
    "no-await-in-loop": "off", // https://eslint.org/docs/rules/no-await-in-loop
    "no-continue": "off", // https://eslint.org/docs/rules/no-continue
    "no-else-return": "off",
    "no-return-await": "off", // https://eslint.org/docs/rules/no-return-await
  },
  "ignorePatterns": [
    "node_modules",
    "dist",
    "build",
    "tests",
    "__test__",
    "__tests__",
    "__mocks__",
    "coverage",

    "/packages/amplify-graphql-types-generator/test", // Not linting tests yet
    "amplify-e2e-tests", // Not linting test projects yet
    "graphql-transformers-e2e-tests", // Not linting test projects yet
    "amplify-velocity-template", // Exclude for now as this was existing code before

    // Project specific excludes
    "/cypress",
    "/packages/amplify-appsync-simulator/public",
    "/packages/amplify-cli/scripts/post-install.js",

    // Ignore project/file templates
    "function-template-dir",
    "/packages/graphql-predictions-transformer/lambdaFunction",

    // Ignore output directories of typescript project until move to tsc and fixing src locations
    "/packages/amplify-appsync-simulator/lib",
    "/packages/amplify-cli/lib",
    "/packages/amplify-codegen-appsync-model-plugin/lib",
    "/packages/amplify-graphql-docs-generator/lib",
    "/packages/amplify-graphql-types-generator/lib",
    "/packages/amplify-storage-simulator/lib",
    "/packages/amplify-ui-tests/lib",
    "/packages/amplify-util-mock/lib",
    "/packages/graphql-mapping-template/lib",
    "/packages/graphql-*-transformer/lib",
    "/packages/graphql-transformer-*/lib",
  ]
};
