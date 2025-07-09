import { IAM } from 'aws-sdk';

export const toBeIAMRoleWithArn = async (roleName: string, arn?: string) => {
  const iam = new IAM();
  let pass: boolean;
  let message: string;
  try {
    const { Role: role } = await iam.getRole({ RoleName: roleName }).promise();
    if (arn) {
      pass = role.Arn === arn ? true : false;
      if (pass) {
        message = `role name ${roleName} has arn ${arn}`;
      } else {
        message = `expected ${roleName} to have ${arn}. Received ${role.Arn}`;
      }
    } else {
      pass = true;
    }
  } catch (e) {
    pass = false;
    message = `Role ${roleName} does not exist`;
  }

  const result = {
    message: () => message,
    pass,
  };
  return result;
};

export const toHaveValidPolicyConditionMatchingIdpId = async (roleName: string, idpId: string) => {
  let pass = false;
  let message = '';

  try {
    const iam = new IAM({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      sessionToken: process.env.AWS_SESSION_TOKEN,
    });

    const { Role: role } = await iam.getRole({ RoleName: roleName }).promise();
    const assumeRolePolicyDocument = JSON.parse(decodeURIComponent(role.AssumeRolePolicyDocument));

    pass = assumeRolePolicyDocument.Statement.some((statement) => {
      if (statement.Condition) {
        return (
          statement.Condition.StringEquals &&
          statement.Condition.StringEquals['cognito-identity.amazonaws.com:aud'] &&
          statement.Condition.StringEquals['cognito-identity.amazonaws.com:aud'] === idpId &&
          statement.Condition['ForAnyValue:StringLike'] &&
          statement.Condition['ForAnyValue:StringLike']['cognito-identity.amazonaws.com:amr'] &&
          /authenticated/.test(statement.Condition['ForAnyValue:StringLike']['cognito-identity.amazonaws.com:amr'])
        );
      } else {
        return false;
      }
    });
    message = pass ? 'Found Matching Condition' : 'Matching Condition does not exist';
  } catch (e) {
    pass = false;
    message = 'IAM GetRole threw Error: ' + e.message;
  }

  return {
    message: () => message,
    pass,
  };
};

export const toHaveDenyAssumeRolePolicy = async (roleName: string) => {
  let pass = false;
  let message = '';

  try {
    const iam = new IAM({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      sessionToken: process.env.AWS_SESSION_TOKEN,
    });

    const { Role: role } = await iam.getRole({ RoleName: roleName }).promise();
    const assumeRolePolicyDocument = JSON.parse(decodeURIComponent(role.AssumeRolePolicyDocument));

    pass = assumeRolePolicyDocument?.Statement?.length === 1 && assumeRolePolicyDocument?.Statement?.[0]?.Effect === 'Deny';

    message = pass ? 'Assume role policy has Effect: Deny' : `Assume role policy does not exist or does not have Effect: Deny.`;
  } catch (e) {
    message = 'IAM GetRole threw Error: ' + e.message;
  }

  return {
    message: () => message,
    pass,
  };
};
