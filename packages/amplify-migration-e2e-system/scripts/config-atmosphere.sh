#!/bin/bash

# Output export commands for environment variables from .gamma.env
if [ -f ".gamma.env" ]; then
    # Output export commands for each line from .gamma.env (ignoring comments and empty lines)
    while IFS= read -r line || [[ -n "$line" ]]; do
        # Skip comments and empty lines
        if [[ "$line" =~ ^[[:space:]]*# ]] || [[ -z "${line// }" ]]; then
            continue
        fi
        
        # Output export command
        echo "export $line"
    done < ".gamma.env"
else
    echo "echo 'Error: .gamma.env file not found!'" >&2
    exit 1
fi
