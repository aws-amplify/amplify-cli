import { Expression, ObjectNode } from './ast';
export declare function printObject(node: ObjectNode, indent?: string): string;
export declare function print(expr: Expression): string;
export declare function printBlock(name: string): (expr: Expression) => string;
