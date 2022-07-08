import { $TSObject } from "amplify-cli-core"

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
        throw new Error('The local opensearch endpoint is not found');
    }

    try {
        searchConfig = searchConfig as OpensearchQueryConfig;
    }
    catch(e) {
        throw new Error('Given search query configuration is not valid' + e?.message);
    }

    const url = endpoint.replace(/\/+$/, '') + searchConfig.path;

    const result = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(searchConfig.params.body),
        headers: {
            'Content-type': 'application/json',
        }
    });
    return await result.json();
}