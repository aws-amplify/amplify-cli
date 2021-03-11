import { STS } from './aws-utils/aws-sts';

export async function getAccountId(context) {
  const amplifySts = await new STS(context);
  try {
    const data = await amplifySts.sts.getCallerIdentity().promise();
    return data.Account;
  } catch (ex) {
    return '';
  }
}
