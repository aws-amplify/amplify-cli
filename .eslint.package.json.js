module.exports = {
  root: true,
  parser: 'eslint-plugin-package-json-dependencies',
  plugins: ['package-json-dependencies'],
  rules: {
    'package-json-dependencies/alphabetically-sorted-dependencies': 'error',
  },
  ignorePatterns: ['node_modules'],
};
