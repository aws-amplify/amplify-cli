import RelationalDBMappingTemplate from '../RelationalDBMappingTemplate'
import { list, str, ObjectNode, print } from 'graphql-mapping-template'

const sql = 'SELECT * FROM Pets'

/**
 * Test for verifying that provided a sql statement, we succesfully create
 * the rds query mapping template
 */
test('Test RDS Query Mapping Template Creation', () => {
    const queryObj: ObjectNode = RelationalDBMappingTemplate.rdsQuery({
        statements: list([str(sql)])
    })

    expect(queryObj).toBeDefined()
    expect(queryObj.kind).toBe('Object')
    expect(queryObj.attributes).toBeDefined()

    // Verify the Version was created succesfully
    const versionAttr = queryObj.attributes[0]
    expect(versionAttr).toBeDefined()
    expect(versionAttr[0]).toBe('version')
    expect(versionAttr[1].kind).toBe('String')
    expect(print(versionAttr[1])).toBe('"2018-05-29"')

    // Verify the sql statement was created succesfully
    const statementsAttr = queryObj.attributes[1]
    expect(statementsAttr).toBeDefined()
    expect(statementsAttr[0]).toBe('statements')
    expect(statementsAttr[1].kind).toBe('List')
    expect(print(statementsAttr[1])).toBe('["SELECT * FROM Pets"]')
})
