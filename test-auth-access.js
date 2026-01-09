const {
  parseAuthAccessFromTemplate,
} = require('./packages/amplify-cli/lib/commands/gen2-migration/generate/codegen-head/auth_access_parser.js');

// Test CloudFormation template with Cognito actions
const testTemplate = `{
  "Resources": {
    "AmplifyResourcesPolicy": {
      "Type": "AWS::IAM::Policy",
      "Properties": {
        "PolicyDocument": {
          "Statement": [
            {
              "Effect": "Allow",
              "Action": [
                "cognito-idp:AdminCreateUser",
                "cognito-idp:AdminDeleteUser",
                "cognito-idp:AdminAddUserToGroup",
                "cognito-idp:AdminRemoveUserFromGroup",
                "cognito-idp:ListUsers",
                "cognito-idp:AdminResetUserPassword"
              ]
            }
          ]
        }
      }
    }
  }
}`;

console.log('Testing auth access parsing...');
const result = parseAuthAccessFromTemplate(testTemplate);
console.log('Parsed auth access:', JSON.stringify(result, null, 2));
