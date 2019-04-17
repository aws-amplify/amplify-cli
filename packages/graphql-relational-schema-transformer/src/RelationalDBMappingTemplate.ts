import {
    obj, str, ObjectNode, ListNode
} from 'graphql-mapping-template';

/**
 * The class that contains the resolver templates for interacting
 * with the Relational Database data source.
 */
export default class RelationalDBMappingTemplate {

    /**
     * Provided a SQL statement, creates the rds-query item resolver template.
     *
     * @param param0 - the SQL statement to use when querying the RDS cluster
     */
    public static rdsQuery({statements}: {
        statements: ListNode
    }): ObjectNode {
        return obj({
            version: str('2018-05-29'),
            statements: statements
        })
    }
}