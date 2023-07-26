import { ARN, parse } from '@aws-sdk/util-arn-parser';

export const parseArn = (arn: string): ARN => {
  return parse(arn);
};
