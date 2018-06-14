import * as fs from 'fs'
import {camelCase, forEach, pickBy, map, some} from 'lodash'

const fetch = require('node-fetch')

const SchemaUrl = 'https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json'

type BasicTypeSuffix = 'Type' | 'ItemType'

interface TypeProperties {
    Type?: string
    ItemType?: string
    PrimitiveType?: string
    PrimitiveItemType?: string
    Required: boolean
}

interface ResourceType {
    Properties: {[key: string]: TypeProperties}
}

interface InnerType {
    Properties: {[key: string]: TypeProperties}
}

interface Schema {
    ResourceSpecificationVersion: string
    ResourceTypes: {[key: string]: ResourceType}
    PropertyTypes: {[key: string]: InnerType}
}

function adjustedCamelCase(input: string): string {
    return input === 'IoT' ? 'iot' : camelCase(input)
}

function determineTypeScriptType(property: TypeProperties, propertyName: string, typeSuffix: BasicTypeSuffix): string {
    if (property[typeSuffix] === 'List') {
        return `List<${determineTypeScriptType(property, propertyName, 'ItemType')}>`
    }
    if (property[typeSuffix] === 'Map') {
        return `{[key: string]: ${determineTypeScriptType(property, propertyName, 'ItemType')}}`
    }
    if (property[typeSuffix] === 'Tag') {
        return 'ResourceTag'
    }
    if (property[typeSuffix]) {
        return innerTypeName('.' + property[typeSuffix])
    }

    let primitiveType = property[typeSuffix === 'Type' ? 'PrimitiveType' : 'PrimitiveItemType'].toLowerCase()
    if (primitiveType === 'json') {
        return 'any'
    }
    if (['integer', 'double', 'long'].includes(primitiveType)) {
        primitiveType = 'number'
    }
    if (primitiveType === 'timestamp') {
        primitiveType = 'string' // TODO consider Date.toISOString()
    }
    return `Value<${primitiveType}>`
}

function propertiesEntries(properties: {[key: string]: TypeProperties}): string[] {
    return map(properties, (property: TypeProperties, propertyName: string) => {
        if (propertyName === 'Tags') {
            return `Tags?: ResourceTag[]`
        }

        return `${propertyName}${property.Required ? '' : '?'}: ${determineTypeScriptType(property, propertyName, 'Type')}`
    })
}

function hasTags(properties: {[key: string]: TypeProperties}): boolean {
    return Object.keys(properties).includes('Tags')
           || some(properties, p => p.Type === 'List' && p.ItemType === 'Tag')
}

function innerTypeName(innerTypeFullName: string): string {
    const [containingTypeFullName, innerTypeName] = innerTypeFullName.split('.')
    const containingTypeName = containingTypeFullName.split(':').pop()

    if (innerTypeName === containingTypeName) {
        return innerTypeName + 'Inner'
    }

    return innerTypeName
}

function generateInnerClass(name: string, properties: {[key: string]: TypeProperties}): string {
    return `export class ${name} {
${propertiesEntries(properties).map(e => `    ${e}`).join('\n')}

    constructor(properties: ${name}) {
        Object.assign(this, properties)
    }
}`
}

function generateTopLevelClass(namespace: string, typeName: string, properties: {[key: string]: TypeProperties}, innerTypes: {[key: string]: InnerType}) {
    return `export interface ${typeName}Properties {
${propertiesEntries(properties).map(e => `    ${e}`).join('\n')}
}

export default class ${typeName} extends ResourceBase {
${Object.keys(innerTypes).map(innerTypeFullName => {
        const [, innerTypeNameUnsafe] = innerTypeFullName.split('.')
        const innerTypeNameSafe = innerTypeName(innerTypeFullName)
        return `    static ${innerTypeNameUnsafe} = ${innerTypeNameSafe}`
    }).join('\n')}

    constructor(properties?: ${typeName}Properties) {
        super('AWS::${namespace}::${typeName}', properties)
    }
}`
}

function generateFile(fileHeader: string, namespace: string, resourceName: string, properties: {[key: string]: TypeProperties}, innerTypes: {[key: string]: InnerType}): void {
    let innerHasTags = false
    const innerTypesTemplates = map(innerTypes, (innerType: InnerType, innerTypeFullName: string) => {
        innerHasTags = innerHasTags || hasTags(innerType.Properties)
        return generateInnerClass(innerTypeName(innerTypeFullName), innerType.Properties)
    })

    const resourceImports = ['ResourceBase']
    if (innerHasTags || hasTags(properties)) {
        resourceImports.push('ResourceTag')
    }

    const generatedClass = generateTopLevelClass(namespace, resourceName, properties, innerTypes)

    const template = `${fileHeader}
   
import {${resourceImports.join(', ')}} from '../resource'
import {Value, List} from '../dataTypes'

${innerTypesTemplates.join('\n\n')}

${generatedClass}
`

    if (!fs.existsSync(`./types/${adjustedCamelCase(namespace)}`)) {
        fs.mkdirSync(`./types/${adjustedCamelCase(namespace)}`)
    }

    fs.writeFileSync(`./types/${adjustedCamelCase(namespace)}/${camelCase(resourceName)}.ts`, template, {encoding: 'utf8'})
}

function generateIndexFile(fileHeader: string, namespace: string, resourceTypeNames: string[]): void {
    const imports = resourceTypeNames.map(typeName => `import ${typeName} from './${camelCase(typeName)}'`)

    const template = `${fileHeader}
   
${imports.join('\n')} 

export default {
${resourceTypeNames.map(t => `  ${t}`).join(',\n')}
}
`

    fs.writeFileSync(`./types/${adjustedCamelCase(namespace)}/index.ts`, template, {encoding: 'utf8'})
}

function generateGrandIndexFile(fileHeader: string, indexContent: {[key: string]: string[]}): void {
    const imports: string[] = []

    forEach(indexContent, (dependentResourceTypeNames: string[], namespace: string) => {
        imports.push('\n' + `import ${namespace}_ from './${adjustedCamelCase(namespace)}'`)
        imports.push(`export const ${namespace} = ${namespace}_` + '\n')
        dependentResourceTypeNames.forEach(resourceName => imports.push(`import ${namespace}${resourceName} from './${adjustedCamelCase(namespace)}/${camelCase(resourceName)}'`))
    })

    const template = `${fileHeader}
   
${imports.join('\n')} 

export default {
${Object.keys(indexContent).map(t => `  ${t}`).join(',\n')}
}
`

    fs.writeFileSync('./types/index.ts', template, {encoding: 'utf8'})
}

fetch(SchemaUrl)
    .then((res: Response) => res.json())
    .then((schema: Schema) => {
        const fileHeader = `/* Generated from ${SchemaUrl}, version ${schema.ResourceSpecificationVersion} */`
        const indexContent: {[key: string]: string[]} = {}

        forEach(schema.ResourceTypes, (resource: ResourceType, resourceFullName: string) => {
            const [, namespace, typeName] = resourceFullName.split('::')
            const properties = resource.Properties || {}
            const resourcePropertyTypes = pickBy(schema.PropertyTypes, (propertyType: InnerType, propertyFullName: string) => propertyFullName.startsWith(resourceFullName + '.'))

            indexContent[namespace] = indexContent[namespace] || []
            indexContent[namespace].push(typeName)

            generateFile(fileHeader, namespace, typeName, properties, resourcePropertyTypes)
        })

        forEach(indexContent, (resourceTypeNames: string[], namespace: string) => {
            generateIndexFile(fileHeader, namespace, resourceTypeNames)
        })

        generateGrandIndexFile(fileHeader, indexContent)
    })