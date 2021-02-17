const oldTypesgen = require('amplify-graphql-types-generator'); // old types generator package for GraphQL
const newTypesgen = require('@aws-amplify/graphql-types-generator'); // migrated types generator package for GraphQL

function getTypesgenPackage(isNewTypesgenPackage) {
  return isNewTypesgenPackage ? newTypesgen : oldTypesgen;
}

module.exports = {
    getTypesgenPackage,
};
