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
