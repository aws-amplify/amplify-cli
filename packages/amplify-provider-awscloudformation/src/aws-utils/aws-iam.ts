import aws from './aws.js';
import awstype from 'aws-sdk';
import { IAM } from 'aws-sdk';
import { AwsSdkConfig } from '../utils/auth-types.js';

let instance: IAM;

export const getInstance = async (sdkConfigProvider: () => Promise<AwsSdkConfig>) => {
  if (instance) {
    return instance;
  }
  let cred = {};
  try {
    cred = await sdkConfigProvider();
  } catch (err) {
    // ignore error
  }
  instance = new (aws as typeof awstype).IAM({ ...cred });
  return instance;
};
