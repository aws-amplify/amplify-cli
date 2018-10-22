import {
    obj, Expression, str, ObjectNode, iff, ifElse,
    ref, raw, int, CompoundExpressionNode, compoundExpression,
    set, qref
} from './ast';

export class HttpMappingTemplate {

    static httpVersionId = '2018-05-29'

    /**
     * Create a mapping template for HTTP GET requests.
     */
    public static getRequest({ resourcePath, params }: {
        resourcePath: string,
        params: ObjectNode
    }): ObjectNode {
        return obj({
            version: str(this.httpVersionId),
            method: str('GET'),
            resourcePath: str(resourcePath),
            params
        })
    }

    /**
     * Create a mapping template for HTTP POST requests.
     */
    public static postRequest({ resourcePath, params }: {
        resourcePath: string,
        params: ObjectNode
    }): ObjectNode {
        return obj({
            version: str(this.httpVersionId),
            method: str('POST'),
            resourcePath: str(resourcePath),
            params
        })
    }

    /**
     * Create a mapping template for HTTP PUT requests.
     */
    public static putRequest({ resourcePath, params }: {
        resourcePath: string,
        params: ObjectNode
    }): ObjectNode {
        return obj({
            version: str(this.httpVersionId),
            method: str('PUT'),
            resourcePath: str(resourcePath),
            params
        })
    }

    /**
     * Create a mapping template for HTTP DELETE requests.
     */
    public static deleteRequest({ resourcePath, params }: {
        resourcePath: string,
        params: ObjectNode
    }): ObjectNode {
        return obj({
            version: str(this.httpVersionId),
            method: str('DELETE'),
            resourcePath: str(resourcePath),
            params
        })
    }

    /**
     * Create a mapping template for HTTP PATCH requests.
     */
    public static patchRequest({ resourcePath, params }: {
        resourcePath: string,
        params: ObjectNode
    }): ObjectNode {
        return obj({
            version: str(this.httpVersionId),
            method: str('PATCH'),
            resourcePath: str(resourcePath),
            params
        })
    }
}