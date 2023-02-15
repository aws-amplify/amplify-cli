import { $TSObject, AMPLIFY_SUPPORT_DOCS, AmplifyFault } from 'amplify-cli-core';
import fetch from 'node-fetch';

type OpensearchQueryConfig = {
  path: string,
  params: {
    body: {
      size: number,
      sort: $TSObject[],
      version: boolean,
      query: $TSObject,
      aggs: $TSObject,
      from?: number
    }
  }
}

type OpensearchQueryResult = {
  hits: {
    hits: $TSObject,
    total: {
      value: number
    }
  },
  aggregations: $TSObject,

}

export const querySearchable = async (endpoint: string, searchConfig: OpensearchQueryConfig): Promise<OpensearchQueryResult> => {
  if (!endpoint) {
    throw new AmplifyFault('MockProcessFault', {
      message: 'The local opensearch endpoint is not found',
      link: AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url
    });
  }

  try {
    searchConfig = searchConfig as OpensearchQueryConfig;
  }
  catch(e) {
    throw new AmplifyFault('MockProcessFault', {
      message: 'Given search query configuration is not valid',
      link: AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url
    }, e);
  }

  const url = endpoint.replace(/\/+$/, '') + searchConfig.path;

  const result = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(searchConfig.params.body),
    headers: {
      'Content-type': 'application/json',
    }
  });
  return result.json();
}
