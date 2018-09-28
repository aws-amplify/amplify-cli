import {
    obj, Expression, str, ObjectNode, iff, ifElse,
    ref, raw, int, CompoundExpressionNode, compoundExpression,
    set, qref
} from './ast';

export class HttpMappingTemplate {

    static httpVersionId = '2018-05-29'

    /**
     * Create a mapping template for ES.
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
     * Create a mapping template for ES.
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
}