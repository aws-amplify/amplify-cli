import { ExecutionContext } from '..';

export const moveDownOld = (chain: ExecutionContext, nMoves: number) =>
  Array.from(Array(nMoves).keys()).reduce((chain, _idx) => chain.send('j'), chain);

export const moveDown = (chain: ExecutionContext, nMoves: number) =>
  Array.from(Array(nMoves).keys()).reduce((chain, _idx) => chain.sendKeyDown(), chain);

export const moveUp = (chain: ExecutionContext, nMoves: number) =>
  Array.from(Array(nMoves).keys()).reduce((chain, _idx) => chain.sendKeyUp(), chain);

export const singleSelect = <T>(chain: ExecutionContext, item: T, allChoices: T[]) => {
  [item]
    .map(item => allChoices.indexOf(item))
    .filter(idx => idx > -1)
    .sort()
    // calculate the diff with the latest, since items are sorted, always positive
    // represents the numbers of moves down we need to make to selection
    .reduce((diffs, move) => (diffs.length > 0 ? [...diffs, move - diffs[diffs.length - 1]] : [move]), [] as number[])
    .reduce((chain, move) => moveDownOld(chain, move), chain);
  chain.sendCarriageReturn();
  return chain;
};

export const multiSelect = <T>(chain: ExecutionContext, items: T[] = [], allChoices: T[]) => {
  items
    .map(item => allChoices.indexOf(item))
    .filter(idx => idx > -1)
    .sort()
    // calculate the diff with the latest, since items are sorted, always positive
    // represents the numbers of moves down we need to make to selection
    .reduce((diffs, move) => (diffs.length > 0 ? [...diffs, move - diffs[diffs.length - 1]] : [move]), [] as number[])
    .reduce((chain, move) => moveDown(chain, move).send(' '), chain);

  // This seems to be a key, we have to wait until enquirer flushes stdout before sending carriage return.
  chain.wait('❯● storage');
  chain.sendCarriageReturn();
  return chain;
};
