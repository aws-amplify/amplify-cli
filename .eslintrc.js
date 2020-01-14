module.exports = {
  root: true,
  extends: [
    'airbnb',
    'eslint:recommended',
    "plugin:prettier/recommended",
    'plugin:react/recommended',  // Uses the recommended rules from @eslint-plugin-react
    'prettier/@typescript-eslint',  // Uses eslint-config-prettier to disable ESLint rules from @typescript-eslint/eslint-plugin that would conflict with prettier
    'plugin:@typescript-eslint/eslint-recommended',  // Uses the recommended rules from the @typescript-eslint/eslint-plugin
    'plugin:@typescript-eslint/recommended',  // Uses the recommended rules from the @typescript-eslint/eslint-plugin
  ],
  parser: '@typescript-eslint/parser',  // Specifies the ESLint parser
  env: {
    node: true,
    jest: true,
  },
  parserOptions: {
    ecmaVersion: 2020,  // Allows for the parsing of modern ECMAScript features
    sourceType: 'module',  // Allows for the use of imports
    ecmaFeatures: {
      jsx: true,  // Allows for the parsing of JSX
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
    "import/extensions": "off",
    "import/no-default-export": "error",
    "import/prefer-default-export": "off",
    "class-methods-use-this": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-var-requires": "off",
    "global-require": "off",
    "import/no-dynamic-require": "off",

    // TODO needs to be enabled when fixing valid warnings of this error
    //"no-param-reassign": ["error", { "props": false }],
    "no-param-reassign": "off",
    "no-plusplus": ["error", { "allowForLoopAfterthoughts": true }],
    "no-constant-condition": ["error", { "checkLoops": false }],

    // TODO enable later
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-use-before-define": "off",
    "no-console": "off",
    "consistent-return": "off",
    "prefer-object-spread": "off",
    "@typescript-eslint/camelcase": "off",

    // The errors for these rules needs a review one-by-one
    "no-await-in-loop": "off",
    "no-return-await": "off",
    "no-continue": "off",
    "no-else-return": "off",

    // These rules are code beauty ones
    "prettier/prettier": "off",
    "import/order": "off"
  },
  "ignorePatterns": [
    "dist",
    "tests",
    "__tests__",
    "__mocks__",
    "coverage",
    "function-template-dir"
  ]
};
