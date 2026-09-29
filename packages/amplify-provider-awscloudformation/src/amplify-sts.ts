import { STS } from './aws-utils/aws-sts';

export async function getAccountId(context) {
  const amplifySts = await STS.getInstance(context);
  try {
    const data = await amplifySts.getCallerIdentity();
    return data.Account;
  } catch (ex) {
    return '';
  }
}
