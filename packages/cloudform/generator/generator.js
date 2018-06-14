"use strict";
exports.__esModule = true;
var fs = require("fs");
var lodash_1 = require("lodash");
var fetch = require('node-fetch');
var url = 'https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json';
function adjustedCamelCase(input) {
    return input === 'IoT' ? 'iot' : lodash_1.camelCase(input);
}
function determineTypeScriptType(property, propertyName, typeSuffix) {
    if (property[typeSuffix] === 'List') {
        return "List<" + determineTypeScriptType(property, propertyName, 'ItemType') + ">";
    }
    if (property[typeSuffix] === 'Map') {
        return "{[key: string]: " + determineTypeScriptType(property, propertyName, 'ItemType') + "}";
    }
    if (property[typeSuffix] === 'Tag') {
        return 'ResourceTag';
    }
    if (property[typeSuffix]) {
        return innerTypeName('.' + property[typeSuffix]);
    }
    var primitiveType = property['Primitive' + typeSuffix].toLowerCase();
    if (primitiveType === 'json') {
        return 'any';
    }
    if (['integer', 'double', 'long'].includes(primitiveType)) {
        primitiveType = 'number';
    }
    if (primitiveType === 'timestamp') {
        primitiveType = 'string'; // TODO consider Date.toISOString()
    }
    return "Value<" + primitiveType + ">";
}
function propertiesEntries(properties) {
    return lodash_1.map(properties, function (property, propertyName) {
        if (propertyName === 'Tags') {
            return "Tags?: ResourceTag[]";
        }
        return "" + propertyName + (property.Required ? '' : '?') + ": " + determineTypeScriptType(property, propertyName, 'Type');
    });
}
function generateInnerClass(name, properties) {
    return "export class " + name + " {\n" + propertiesEntries(properties).map(function (e) { return "    " + e; }).join('\n') + "\n\n    constructor(properties: " + name + ") {\n        Object.assign(this, properties)\n    }\n}";
}
function generateTopLevelClass(namespace, name, properties, innerTypes) {
    return "export interface " + name + "Properties {\n" + propertiesEntries(properties).map(function (e) { return "    " + e; }).join('\n') + "\n}\n\nexport default class " + name + " extends ResourceBase {\n" + Object.keys(innerTypes).map(function (innerTypeFullName) {
        var _a = innerTypeFullName.split('.'), innerTypeNameUnsafe = _a[1];
        var innerTypeNameSafe = innerTypeName(innerTypeFullName);
        return "    static " + innerTypeNameUnsafe + " = " + innerTypeNameSafe;
    }).join('\n') + "\n\n    constructor(properties?: " + name + "Properties) {\n        super('AWS::" + namespace + "::" + name + "', properties)\n    }\n}";
}
function hasTags(properties) {
    return Object.keys(properties).includes('Tags') || lodash_1.some(properties, function (p) { return p.Type === 'List' && p.ItemType === 'Tag'; });
}
function innerTypeName(innerTypeFullName) {
    var _a = innerTypeFullName.split('.'), containingTypeFullName = _a[0], innerTypeName = _a[1];
    var containingTypeName = containingTypeFullName.split(':').pop();
    if (innerTypeName === containingTypeName) {
        return innerTypeName + 'Inner';
    }
    return innerTypeName;
}
function generateFile(fileHeader, namespace, resourceName, properties, innerTypes) {
    var innerHasTags = false;
    var innerTypesTemplates = lodash_1.map(innerTypes, function (innerType, innerTypeFullName) {
        innerHasTags = innerHasTags || hasTags(innerType.Properties);
        return generateInnerClass(innerTypeName(innerTypeFullName), innerType.Properties);
    });
    var resourceImports = ['ResourceBase'];
    if (innerHasTags || hasTags(properties)) {
        resourceImports.push('ResourceTag');
    }
    var generatedClass = generateTopLevelClass(namespace, resourceName, properties, innerTypes);
    var template = fileHeader + "\n   \nimport {" + resourceImports.join(', ') + "} from '../resource'\nimport {Value, List} from '../dataTypes'\n\n" + innerTypesTemplates.join('\n\n') + "\n\n" + generatedClass + "\n";
    if (!fs.existsSync("./types/" + adjustedCamelCase(namespace))) {
        fs.mkdirSync("./types/" + adjustedCamelCase(namespace));
    }
    fs.writeFileSync("./types/" + adjustedCamelCase(namespace) + "/" + lodash_1.camelCase(resourceName) + ".ts", template, { encoding: 'utf8' });
}
function generateIndexFile(fileHeader, namespace, resourceNames) {
    var imports = resourceNames.map(function (resourceName) { return "import " + resourceName + " from './" + lodash_1.camelCase(resourceName) + "'"; });
    var template = fileHeader + "\n   \n" + imports.join('\n') + " \n\nexport default {\n" + resourceNames.map(function (t) { return "  " + t; }).join(',\n') + "\n}\n";
    fs.writeFileSync("./types/" + adjustedCamelCase(namespace) + "/index.ts", template, { encoding: 'utf8' });
}
function generateGrandIndexFile(fileHeader, indexContent) {
    var imports = [];
    lodash_1.forEach(indexContent, function (dependentResourceNames, namespace) {
        imports.push('\n' + ("import " + namespace + "_ from './" + adjustedCamelCase(namespace) + "'"));
        imports.push("export const " + namespace + " = " + namespace + "_" + '\n');
        dependentResourceNames.forEach(function (resourceName) { return imports.push("import " + namespace + resourceName + " from './" + adjustedCamelCase(namespace) + "/" + lodash_1.camelCase(resourceName) + "'"); });
    });
    var template = fileHeader + "\n   \n" + imports.join('\n') + " \n\nexport default {\n" + Object.keys(indexContent).map(function (t) { return "  " + t; }).join(',\n') + "\n}\n";
    fs.writeFileSync('./types/index.ts', template, { encoding: 'utf8' });
}
fetch(url)
    .then(function (res) { return res.json(); })
    .then(function (schema) {
    var fileHeader = "/* Generated from " + url + ", version " + schema.ResourceSpecificationVersion + " */";
    var indexContent = {};
    lodash_1.forEach(schema.ResourceTypes, function (resource, resourceFullName) {
        var _a = resourceFullName.split('::'), namespace = _a[1], resourceName = _a[2];
        var properties = resource.Properties || {};
        var resourcePropertyTypes = lodash_1.pickBy(schema.PropertyTypes, function (propertyType, propertyFullName) { return propertyFullName.startsWith(resourceFullName + '.'); });
        indexContent[namespace] = indexContent[namespace] || [];
        indexContent[namespace].push(resourceName);
        generateFile(fileHeader, namespace, resourceName, properties, resourcePropertyTypes);
    });
    lodash_1.forEach(indexContent, function (resourceNames, namespace) {
        generateIndexFile(fileHeader, namespace, resourceNames);
    });
    generateGrandIndexFile(fileHeader, indexContent);
});
