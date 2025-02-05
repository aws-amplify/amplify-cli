#!/usr/bin/env sh

# Usage: Can be invoked either independently, or with an npm tag suffix, in order to update to that tagged version of all packagers in the filter.
# e.g. `npx scripts/update-data-dependencies.sh update-data-packages`
#      `npx scripts/update-data-dependencies.sh update-data-packages @rds-support`

FILTER="amplify-codegen @aws-amplify/amplify-category-api @aws-amplify/graphql-auth-transformer @aws-amplify/graphql-default-value-transformer @aws-amplify/graphql-function-transformer @aws-amplify/graphql-http-transformer @aws-amplify/graphql-index-transformer @aws-amplify/graphql-maps-to-transformer @aws-amplify/graphql-model-transformer @aws-amplify/graphql-predictions-transformer @aws-amplify/graphql-relational-transformer @aws-amplify/graphql-schema-test-library @aws-amplify/graphql-searchable-transformer @aws-amplify/graphql-transformer-core @aws-amplify/graphql-transformer-interfaces @aws-amplify/graphql-transformer-migrator graphql-auth-transformer graphql-connection-transformer graphql-dynamodb-transformer graphql-elasticsearch-transformer graphql-function-transformer graphql-http-transformer graphql-key-transformer graphql-mapping-template graphql-predictions-transformer graphql-relational-schema-transformer graphql-transformer-common graphql-transformer-core graphql-transformers-e2e-tests graphql-versioned-transformer"

if [ $# -eq 0 ]
  then
    echo "Updating to latest tag"
    npx ncu \
        --deep \
        --upgrade \
        --dep "prod,dev,peer,bundle,optional" \
        --target minor \
        --filter "$FILTER"
  else 
    echo "Updating to $1 tag"
    npx ncu \
        --deep \
        --upgrade \
        --dep "prod,dev,peer,bundle,optional" \
        --filter "$FILTER" \
        --target $1
fi
