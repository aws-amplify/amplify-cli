import { IAM } from 'aws-sdk';

export class IAMHelper {
  client: IAM;
  constructor(region: string = 'us-west-2') {
    this.client = new IAM({
      region,
    });
  }

  /**
   * Creates auth and unauth roles
   */
  async createRoles(authRoleName: string, unauthRoleName: string): Promise<{ authRole: IAM.Role; unauthRole: IAM.Role }> {
    const authRole = await this.client
      .createRole({
        RoleName: authRoleName,
        AssumeRolePolicyDocument: `{
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Principal": {
              "Federated": "cognito-identity.amazonaws.com"
            },
            "Action": "sts:AssumeRoleWithWebIdentity"
          }
        ]
      }`,
      })
      .promise();
    const unauthRole = await this.client
      .createRole({
        RoleName: unauthRoleName,
        AssumeRolePolicyDocument: `{
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Principal": {
              "Federated": "cognito-identity.amazonaws.com"
            },
            "Action": "sts:AssumeRoleWithWebIdentity"
          }
        ]
      }`,
      })
      .promise();

    return { authRole: authRole.Role, unauthRole: unauthRole.Role };
  }
  async createRoleForCognitoGroup(name: string): Promise<IAM.Role> {
    const role = await this.client
      .createRole({
        RoleName: name,
        AssumeRolePolicyDocument: `{
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Principal": {
              "Federated": "cognito-identity.amazonaws.com"
            },
            "Action": "sts:AssumeRoleWithWebIdentity"
          }
        ]
      }`,
      })
      .promise();
    return role.Role;
  }

  async createLambdaExecutionRole(name: string) {
    return await this.client
      .createRole({
        AssumeRolePolicyDocument: `{
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }`,
        RoleName: name,
      })
      .promise();
  }

  async createLambdaExecutionPolicy(name: string) {
    return await this.client
      .createPolicy({
        PolicyDocument: `{
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": "arn:aws:logs:*:*:*"
                    }
                ]
            }`,
        PolicyName: name,
      })
      .promise();
  }

  async attachLambdaExecutionPolicy(policyArn: string, roleName: string) {
    return await this.client
      .attachRolePolicy({
        PolicyArn: policyArn,
        RoleName: roleName,
      })
      .promise();
  }

  async deletePolicy(policyArn: string) {
    return await this.client.deletePolicy({ PolicyArn: policyArn }).promise();
  }

  async deleteRole(roleName: string) {
    return await this.client.deleteRole({ RoleName: roleName }).promise();
  }

  async detachLambdaExecutionPolicy(policyArn: string, roleName: string) {
    return await this.client
      .detachRolePolicy({
        PolicyArn: policyArn,
        RoleName: roleName,
      })
      .promise();
  }
}
