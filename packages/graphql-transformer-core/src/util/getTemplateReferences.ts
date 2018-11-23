import Template from "cloudform/types/template";
import { Condition } from "cloudform/types/dataTypes";
import { Fn, Refs, IntrinsicFunction } from 'cloudform'

export interface ReferenceMap {
    [referenceId: string]: string[][]
}
/**
 * Returns a map where the key is the logical id of the reference and the
 * value is a list locations where that reference is used.
 * @param template The template
 */
export function getTemplateReferences(template: Template): ReferenceMap {
    return walk(template, [])
}
function walk(node: any, path: string[]): ReferenceMap {
    if (typeof node === 'object') {
        // tslint:disable-next-line
        const refValue = node["Ref"];
        const getAtt = node["Fn::GetAtt"];
        if (refValue) {
            return {
                [refValue]: [path],
            }
        } else if (getAtt) {
            return {
                [getAtt[0]]: [path]
            }
        }
        let refsFromAllKeys = {}
        for (const key of Object.keys(node)) {
            const refsForKey = walk(node[key], path.concat(key))
            refsFromAllKeys = mergeReferenceMaps(refsFromAllKeys, refsForKey)
        }
        return refsFromAllKeys
    } else if (Array.isArray(node)) {
        let refsFromAllKeys = {}
        for (let i = 0; i < node.length; i++) {
            const n = node[i]
            const refsForKey = walk(n, path.concat(`${i}`))
            refsFromAllKeys = mergeReferenceMaps(refsFromAllKeys, refsForKey)
        }
        return refsFromAllKeys
    } else {
        return {}
    }
}
function mergeReferenceMaps(a: ReferenceMap, b: ReferenceMap): ReferenceMap {
    const bKeys = Object.keys(b);
    for (const bKey of bKeys) {
        if (a[bKey]) {
            a[bKey] = a[bKey].concat(b[bKey])
        } else {
            a[bKey] = b[bKey]
        }
    }
    return a;
}
