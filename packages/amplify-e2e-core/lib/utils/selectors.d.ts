import { ExecutionContext } from '..';
export declare const moveDown: (chain: ExecutionContext, nMoves: number) => ExecutionContext;
export declare const moveUp: (chain: ExecutionContext, nMoves: number) => ExecutionContext;
export declare const singleSelect: <T>(chain: ExecutionContext, item: T, allChoices: T[]) => ExecutionContext;
export declare const multiSelect: <T>(chain: ExecutionContext, items: T[], allChoices: T[]) => ExecutionContext;
