#!/bin/bash

set -euxo pipefail

# Discover directory names dynamically — amplify add creates directories
# with generated names that don't match the config app name.
api_name=$(ls amplify/backend/api)
s3_trigger_function_name=$(ls amplify/backend/function | grep S3Trigger)

# Resolve the deployment name from the project config to use in custom-roles.json.
deployment_name=$(python3 -c "import json; print(json.load(open('amplify/.config/project-config.json'))['projectName'])")
sed "s/\${appId}/${deployment_name}/g" custom-roles.json > ./amplify/backend/api/${api_name}/custom-roles.json

cp -f schema.graphql ./amplify/backend/api/${api_name}/schema.graphql
cp -f lowstockproducts.js ./amplify/backend/function/lowstockproducts/src/index.js
cp -f lowstockproducts.package.json ./amplify/backend/function/lowstockproducts/src/package.json
cp -f onimageuploaded.js ./amplify/backend/function/${s3_trigger_function_name}/src/index.js
cp -f onimageuploaded.package.json ./amplify/backend/function/${s3_trigger_function_name}/src/package.json

# Wire up API access for both Lambda functions.
# The Amplify CLI does this via:
# 1. Adding dependsOn entries in backend-config.json (declares the dependency)
# 2. Adding parameters to the function CFN template (receives API outputs)
# 3. Using {Ref: paramName} in env vars (resolves at deploy time)
# The root stack reads dependsOn to pass API stack outputs as parameters
# and adds DependsOn to ensure correct deployment ordering.
env_name=$(python3 -c "import json; print(list(json.load(open('amplify/team-provider-info.json')).keys())[0])")
app_id=$(python3 -c "import json; d=json.load(open('amplify/team-provider-info.json')); env=list(d.keys())[0]; print(d[env]['awscloudformation']['AmplifyAppId'])")

export APP_ID="${app_id}"
export ENV_NAME="${env_name}"
export API_NAME="${api_name}"
export S3_TRIGGER_NAME="${s3_trigger_function_name}"

python3 << 'PYTHON_SCRIPT'
import json, os

app_id = os.environ['APP_ID']
env_name = os.environ['ENV_NAME']
api_name = os.environ['API_NAME']
s3_trigger_name = os.environ['S3_TRIGGER_NAME']

# The Amplify CLI parameter naming convention for API access:
# Parameter name: api<apiName>
# Env var keys: API_<APINAME>_GRAPHQLAPIENDPOINTOUTPUT, etc.
api_param_name = f'api{api_name}'
api_upper = api_name.upper().replace('-', '')

def patch_function_cfn(func_name, cfn_path, add_ssm=False):
    with open(cfn_path) as f:
        t = json.load(f)

    # Add API parameters to the function CFN template.
    # The root stack will pass the API stack's outputs as values for these.
    t['Parameters'][f'{api_param_name}GraphQLAPIIdOutput'] = {
        'Type': 'String',
        'Default': f'{api_param_name}GraphQLAPIIdOutput'
    }
    t['Parameters'][f'{api_param_name}GraphQLAPIEndpointOutput'] = {
        'Type': 'String',
        'Default': f'{api_param_name}GraphQLAPIEndpointOutput'
    }
    t['Parameters'][f'{api_param_name}GraphQLAPIKeyOutput'] = {
        'Type': 'String',
        'Default': f'{api_param_name}GraphQLAPIKeyOutput'
    }

    # Set env vars to reference the parameters (resolved at deploy time)
    env_vars = t['Resources']['LambdaFunction']['Properties']['Environment']['Variables']
    env_vars[f'API_{api_upper}_GRAPHQLAPIENDPOINTOUTPUT'] = {'Ref': f'{api_param_name}GraphQLAPIEndpointOutput'}
    env_vars[f'API_{api_upper}_GRAPHQLAPIIDOUTPUT'] = {'Ref': f'{api_param_name}GraphQLAPIIdOutput'}
    env_vars[f'API_{api_upper}_GRAPHQLAPIKEYOUTPUT'] = {'Ref': f'{api_param_name}GraphQLAPIKeyOutput'}

    if add_ssm:
        t['Resources']['SsmSecretsPolicy'] = {
            'DependsOn': ['LambdaExecutionRole'],
            'Type': 'AWS::IAM::Policy',
            'Properties': {
                'PolicyName': 'ssm-secrets-access',
                'Roles': [{'Ref': 'LambdaExecutionRole'}],
                'PolicyDocument': {
                    'Version': '2012-10-17',
                    'Statement': [{
                        'Effect': 'Allow',
                        'Action': ['ssm:GetParameter', 'ssm:GetParameters'],
                        'Resource': {'Fn::Sub': 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/amplify/*'}
                    },
                    {
                        'Effect': 'Allow',
                        'Action': ['appsync:GraphQL'],
                        'Resource': {'Fn::Sub': 'arn:aws:appsync:${AWS::Region}:${AWS::AccountId}:apis/*'}
                    }]
                }
            }
        }
        secret_path = f'/amplify/{app_id}/{env_name}/AMPLIFY_lowstockproducts_PRODUCT_CATALOG_SECRET'
        env_vars['PRODUCT_CATALOG_SECRET'] = secret_path

    with open(cfn_path, 'w') as f:
        json.dump(t, f, indent=2)
        f.write('\n')
    print(f'Patched CFN template: {cfn_path}')

def patch_backend_config(func_name):
    """Add dependsOn entry for the API to the function in backend-config.json."""
    bc_path = 'amplify/backend/backend-config.json'
    with open(bc_path) as f:
        bc = json.load(f)

    func_config = bc.get('function', {}).get(func_name, {})
    depends_on = func_config.get('dependsOn', [])

    # Check if API dependency already exists
    has_api_dep = any(d.get('category') == 'api' and d.get('resourceName') == api_name for d in depends_on)
    if not has_api_dep:
        depends_on.append({
            'category': 'api',
            'resourceName': api_name,
            'attributes': ['GraphQLAPIIdOutput', 'GraphQLAPIEndpointOutput', 'GraphQLAPIKeyOutput']
        })
        func_config['dependsOn'] = depends_on
        bc['function'][func_name] = func_config

        with open(bc_path, 'w') as f:
            json.dump(bc, f, indent=2)
            f.write('\n')
        print(f'Added API dependsOn for {func_name} in backend-config.json')

def patch_function_parameters(func_name):
    """Add permissions and dependsOn to function-parameters.json so the root stack passes API outputs."""
    fp_path = f'amplify/backend/function/{func_name}/function-parameters.json'

    # Create the file if it doesn't exist (S3 trigger functions don't have one)
    if not os.path.exists(fp_path):
        fp = {'lambdaLayers': []}
    else:
        with open(fp_path) as f:
            fp = json.load(f)

    fp['permissions'] = fp.get('permissions', {})
    fp['permissions']['api'] = fp['permissions'].get('api', {})
    fp['permissions']['api'][api_name] = ['Query']

    fp['dependsOn'] = fp.get('dependsOn', [])
    has_api_dep = any(d.get('category') == 'api' and d.get('resourceName') == api_name for d in fp['dependsOn'])
    if not has_api_dep:
        fp['dependsOn'].append({
            'category': 'api',
            'resourceName': api_name,
            'attributes': ['GraphQLAPIIdOutput', 'GraphQLAPIEndpointOutput', 'GraphQLAPIKeyOutput']
        })

    with open(fp_path, 'w') as f:
        json.dump(fp, f, indent=2)
        f.write('\n')
    print(f'Patched function-parameters.json for {func_name}')

# Patch lowstockproducts
patch_function_cfn(
    'lowstockproducts',
    'amplify/backend/function/lowstockproducts/lowstockproducts-cloudformation-template.json',
    add_ssm=True
)
patch_backend_config('lowstockproducts')
patch_function_parameters('lowstockproducts')

# Patch S3 trigger
patch_function_cfn(
    s3_trigger_name,
    f'amplify/backend/function/{s3_trigger_name}/{s3_trigger_name}-cloudformation-template.json',
    add_ssm=False
)
patch_backend_config(s3_trigger_name)
patch_function_parameters(s3_trigger_name)
PYTHON_SCRIPT

# Create the SSM parameter for the secret
aws ssm put-parameter \
  --name "/amplify/${app_id}/${env_name}/AMPLIFY_lowstockproducts_PRODUCT_CATALOG_SECRET" \
  --value "test-secret-value" \
  --type SecureString \
  --overwrite \
  --region us-east-1 2>/dev/null || echo "Note: SSM parameter creation skipped (will be created during push)"
