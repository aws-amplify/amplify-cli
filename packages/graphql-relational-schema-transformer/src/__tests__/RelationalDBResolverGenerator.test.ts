import RelationalDBResolverGenerator from '../RelationalDBResolverGenerator'
import TemplateContext from '../RelationalDBSchemaTransformer';
import { parse } from 'graphql'

const schema = parse(`
  type Pet {
    id: String
    name: String
  }

  type Owner {
    id: String
    name: String
  }
`);
let simplePrimaryKeyMap = {
    'Pet': 'Id',
    'Owner': 'Id'
}
let simpleStringFieldMap = new Map<string, string[]>()
let simpleIntFieldMap = new Map<string, string[]>()
const context = new TemplateContext(schema, simplePrimaryKeyMap, simpleStringFieldMap, simpleIntFieldMap)
const generator = new RelationalDBResolverGenerator(context)

/**
 * Test for verifying that provided a template context, the resolver generator
 * creates the CRUDL AppSync Resolver resources.
 */
test('Test Basic CRUDL Resolver Generation', () => {
    const resources: { [key: string]: any } = generator.createRelationalResolvers()
    expect(resources).toBeDefined()

    // Verify all CRUDL resolvers were created for the Pet Type
    expect(resources).toHaveProperty('PetCreateResolver')
    expect(resources).toHaveProperty('PetGetResolver')
    expect(resources).toHaveProperty('PetUpdateResolver')
    expect(resources).toHaveProperty('PetDeleteResolver')
    expect(resources).toHaveProperty('PetListResolver')

    // Verify for the GetResolver the elements are present
    let resolverMap = Object.keys(resources).map(key => resources[key])
    expect(resolverMap[1]).toHaveProperty('Type')
    expect(resolverMap[1]).toHaveProperty('Properties')

    // Verify a resolver was created for the owner type as well
    expect(resources).toHaveProperty('OwnerCreateResolver')
})