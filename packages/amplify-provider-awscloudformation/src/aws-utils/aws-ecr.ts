import { ECRClient } from '@aws-sdk/client-ecr';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { loadConfiguration } from '../configuration-manager';
import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { proxyAgent } from './aws-globals';

class ECR {
  public ecr: ECRClient;

  constructor(private readonly context: $TSContext, options = {}) {
    const instancePromise = (async () => {
      let cred = {};
      try {
        cred = await loadConfiguration(context);
      } catch (e) {
        // ignore missing config
      }

      this.ecr = new ECRClient({
        ...cred,
        ...options,
        requestHandler: new NodeHttpHandler({
          httpAgent: proxyAgent(),
          httpsAgent: proxyAgent(),
        }),
      });

      return this;
    })();

    return <ECR>(<unknown>instancePromise);
  }
}

module.exports = ECR;
