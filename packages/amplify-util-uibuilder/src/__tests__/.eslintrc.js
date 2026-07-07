module.exports = {
  rules: {
    // Tests in this directory use an empty package.json file
    // that triggers import/no-extraneous-dependencies rule
    // as it looks for closest package.json.
    // This is false positive.
    'import/no-extraneous-dependencies': 'off',
  },
};
