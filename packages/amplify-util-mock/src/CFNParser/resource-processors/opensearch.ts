import { ProcessedOpenSearchDomain } from '../stack/types';

export const openSearchDomainHandler = (resourceName: string): ProcessedOpenSearchDomain => {
  return {
    cfnExposedAttributes: { Arn: 'arn', DomainArn: 'arn', DomainEndpoint: 'endpoint' },
    arn: `arn:aws:es:{aws-region}:{aws-account-number}:domain/${resourceName}`,
    ref: resourceName,
    endpoint: 'localhost:9200',
  };
};
