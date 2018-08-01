import { Expression, ObjectNode, CompoundExpressionNode } from './ast';
export declare class ElasticSearchMappingTemplate {
    /**
     * Create a mapping template for ES.
     */
    static genericTemplte({ operation, path, params }: {
        operation: Expression;
        path: Expression;
        params: Expression | ObjectNode | CompoundExpressionNode;
    }): ObjectNode;
    /**
     * Create a search item resolver template.
     * @param size the size limit
     * @param from the next token
     * @param query the query
     */
    static searchItem({ query, size, from, path, sort }: {
        path: Expression;
        sort?: Expression | ObjectNode;
        query?: ObjectNode | Expression;
        size?: Expression;
        from?: Expression;
    }): ObjectNode;
}
