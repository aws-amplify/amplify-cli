#!/bin/bash

set -euxo pipefail

cp -f schema.graphql ./amplify/backend/api/discussions/schema.graphql
