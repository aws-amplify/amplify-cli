import { AmplifyApiGraphQlResourceStackTemplate } from '@aws-amplify/cli-extensibility-helper';

export function override(resources: AmplifyApiGraphQlResourceStackTemplate): void {
  if (resources.opensearch?.OpenSearchDomain) {
    resources.opensearch.OpenSearchDomain.domainEndpointOptions = {
      enforceHttps: true,
      tlsSecurityPolicy: 'Policy-Min-TLS-1-2-2019-07',
    };
  }
}
