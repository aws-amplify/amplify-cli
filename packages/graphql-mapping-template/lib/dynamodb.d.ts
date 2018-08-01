import { Expression, ReferenceNode, ObjectNode, CompoundExpressionNode } from './ast';
export declare class DynamoDBMappingTemplate {
    /**
     * Create a put item resolver template.
     * @param keys A list of strings pointing to the key value locations. E.G. ctx.args.x (note no $)
     */
    static putItem({ key, attributeValues, condition }: {
        key: ObjectNode;
        attributeValues: Expression;
        condition?: ObjectNode;
    }): ObjectNode;
    /**
     * Create a get item resolver template.
     * @param key A list of strings pointing to the key value locations. E.G. ctx.args.x (note no $)
     */
    static getItem({ key }: {
        key: ObjectNode;
    }): ObjectNode;
    /**
     * Create a query resolver template.
     * @param key A list of strings pointing to the key value locations. E.G. ctx.args.x (note no $)
     */
    static query({ query, filter, scanIndexForward, limit, nextToken }: {
        query: ObjectNode;
        scanIndexForward: Expression;
        filter: ObjectNode | Expression;
        limit: Expression;
        nextToken?: Expression;
    }): ObjectNode;
    /**
     * Create a list item resolver template.
     * @param key A list of strings pointing to the key value locations. E.G. ctx.args.x (note no $)
     */
    static listItem({ filter, limit, nextToken }: {
        filter: ObjectNode | Expression;
        limit: Expression;
        nextToken?: Expression;
    }): ObjectNode;
    /**
     * Create a delete item resolver template.
     * @param key A list of strings pointing to the key value locations. E.G. ctx.args.x (note no $)
     */
    static deleteItem({ key, condition }: {
        key: ObjectNode;
        condition: ObjectNode | ReferenceNode;
    }): ObjectNode;
    /**
     * Create an update item resolver template.
     * @param key
     */
    static updateItem({ key, condition }: {
        key: ObjectNode;
        condition: ObjectNode | ReferenceNode;
    }): CompoundExpressionNode;
    static stringAttributeValue(value: Expression): ObjectNode;
    static numericAttributeValue(value: Expression): ObjectNode;
    static binaryAttributeValue(value: Expression): ObjectNode;
    static paginatedResponse(): ObjectNode;
}
