"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.multiSelect = exports.singleSelect = exports.moveUp = exports.moveDown = void 0;
const moveDown = (chain, nMoves) => Array.from(Array(nMoves).keys()).reduce((chain) => chain.send('j'), chain);
exports.moveDown = moveDown;
const moveUp = (chain, nMoves) => Array.from(Array(nMoves).keys()).reduce((chain) => chain.send('k'), chain);
exports.moveUp = moveUp;
const singleSelect = (chain, item, allChoices) => (0, exports.multiSelect)(chain, [item], allChoices);
exports.singleSelect = singleSelect;
const multiSelect = (chain, items = [], allChoices) => {
    items
        .map((item) => allChoices.indexOf(item))
        .filter((idx) => idx > -1)
        .sort()
        // calculate the diff with the latest, since items are sorted, always positive
        // represents the numbers of moves down we need to make to selection
        .reduce((diffs, move) => (diffs.length > 0 ? [...diffs, move - diffs[diffs.length - 1]] : [move]), [])
        .reduce((chain, move) => (0, exports.moveDown)(chain, move).send(' '), chain);
    chain.sendCarriageReturn();
    return chain;
};
exports.multiSelect = multiSelect;
//# sourceMappingURL=selectors.js.map