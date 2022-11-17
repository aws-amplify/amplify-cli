#!/bin/bash

function validateCDKVersion {
    # @aws-cdk/core indicates CDK v1.
    var=$(yarn why @aws-cdk/core 2>&1 | grep -c "We couldn't find a match")

    if [ $var == 0 ]; then
        echo "Found CDK v1, failing"
        yarn why @aws-cdk/core
        exit 1
    fi
}
