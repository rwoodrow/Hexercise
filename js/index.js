/* Node entry point (for tests): loads the pure-logic modules and re-exports the original public API. */
require('./types.js');
require('./plans.js');
require('./numbers.js');
const Hex = globalThis.Hex;
module.exports = {
    TYPES: Hex.TYPES, generateSet: Hex.generateSet, tcVal: Hex.tcVal, inv: Hex.inv, addCols: Hex.addCols,
    fpAddPlan: Hex.fpAddPlan, fpMove: Hex.fpMove, fpFrame: Hex.fpFrame,
    readFixed: Hex.readFixed, judgeFixedRow: Hex.judgeFixedRow, judgeCarryRow: Hex.judgeCarryRow
};
