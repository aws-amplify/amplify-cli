import { RawNode, raw } from './ast';

type ToJsonNode = RawNode

export function toJson(path: string): ToJsonNode {
    return {
        kind: 'Raw',
        value: `$util.toJson(${path})`
    }
}