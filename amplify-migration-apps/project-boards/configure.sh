#!/bin/bash

cp -f schema.graphql ./amplify/backend/api/projectboards/schema.graphql
cp -f quotegenerator.js ./amplify/backend/function/quotegenerator/src/index.js
cp -f tipsgenerator.js ./amplify/backend/function/tipsgenerator/src/index.js
cp -f utils.js ./amplify/backend/function/projectboardslambdalayer/lib/nodejs/utils.js
