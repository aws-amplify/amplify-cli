import AWS from 'aws-sdk';
import aws from './aws';
import { loadConfiguration } from '../configuration-manager';
import { $TSContext } from 'amplify-cli-core';
class ECR {
  public ecr: AWS.ECR;

  constructor(private readonly context: $TSContext, options = {}) {
    const instancePromise = (async () => {
      let cred = {};
      try {
        cred = await loadConfiguration(context);
      } catch (e) {
        // ignore missing config
      }

      this.ecr = new (aws as typeof AWS).ECR({ ...cred, ...options });

      return this;
    })();

    return <ECR>(<unknown>instancePromise);
  }
}

module.exports = ECR;
