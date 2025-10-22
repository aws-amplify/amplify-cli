import ts from 'typescript';
export type Lambda = {
    source: string;
};
export declare const createTriggersProperty: (triggers: Record<string, Lambda>) => ts.PropertyAssignment;
//# sourceMappingURL=lambda.d.ts.map