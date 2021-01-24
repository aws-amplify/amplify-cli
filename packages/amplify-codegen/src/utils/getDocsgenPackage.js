const oldDocsgen = require('amplify-graphql-docs-generator'); // old graphql statements generator package
const newDocsgen = require('@aws-amplify/graphql-docs-generator'); // migrated graphql statements generator package

function getDocsgenPackage(isNewDocsgenPackage) {
  return isNewDocsgenPackage ? newDocsgen : oldDocsgen;
}

module.exports = {
    getDocsgenPackage,
};
