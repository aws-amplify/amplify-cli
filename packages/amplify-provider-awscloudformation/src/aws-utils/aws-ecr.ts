import AWS from 'aws-sdk';
import aws from './aws';
import { loadConfiguration } from '../configuration-manager';
import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { proxyAgent } from './aws-globals';
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

      this.ecr = new (aws as typeof AWS).ECR({
        ...cred,
        ...options,
        httpOptions: {
          agent: proxyAgent(),
        },
      });

      return this;
    })();

    return <ECR>(<unknown>instancePromise);
  }
}

module.exports = ECR;
