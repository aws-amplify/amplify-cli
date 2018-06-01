import {
    obj, Expression, str, ObjectNode, ListNode, ReferenceNode
} from './ast';

export class ElasticSearchMappingTemplate {
    public static search({
        body,
        pathRef
    }: { body: Expression, pathRef: string }): ObjectNode {
        return obj({
            version: str('2017-02-28'),
            operation: str('GET'),
            path: str(`$${pathRef}.toLowerCase()`),
            params: obj({
                body
            })
        })
    }
}
