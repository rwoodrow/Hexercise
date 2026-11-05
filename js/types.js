/* Question type registry and seeded question-set generation. */
(function () {
    'use strict';
    var Hex = globalThis.Hex = globalThis.Hex || {};
    if (typeof require === 'function') { require('./random.js'); require('./generators.js'); }
    var mulberry32 = Hex.mulberry32, hashSeed = Hex.hashSeed, gBinWhole = Hex.gBinWhole, gBinAdd = Hex.gBinAdd, gBinSub = Hex.gBinSub, gBinMul = Hex.gBinMul, gHexDen = Hex.gHexDen, gHexDenAdv = Hex.gHexDenAdv, gHexBin = Hex.gHexBin, gHexBinAdv = Hex.gHexBinAdv, gTwos = Hex.gTwos, gBinFrac = Hex.gBinFrac, gReal = Hex.gReal, gFpAdd = Hex.gFpAdd;

    var TYPES = [
        { id: 'binwhole', name: 'Binary whole numbers', lv: ['GCSE', 'AS', 'A2', 'H446'], gen: gBinWhole },
        { id: 'binadd', name: 'Binary addition', lv: ['GCSE', 'AS', 'A2', 'H446'], gen: gBinAdd },
        { id: 'binsub', name: 'Binary subtraction', lv: ['AS', 'A2', 'H446'], gen: gBinSub },
        { id: 'binmul', name: 'Binary multiplication', lv: ['A2'], gen: gBinMul },
        { id: 'hexden', name: 'Hexadecimal & Denary', lv: ['GCSE', 'AS', 'A2', 'H446'], gen: gHexDen },
        { id: 'hexdenadv', name: 'Hexadecimal & Denary Advanced', lv: ['AS', 'A2', 'H446'], gen: gHexDenAdv },
        { id: 'hexbin', name: 'Hexadecimal & Binary', lv: ['GCSE', 'AS', 'A2', 'H446'], gen: gHexBin },
        { id: 'hexbinadv', name: 'Hexadecimal & Binary Advanced', lv: ['AS', 'A2', 'H446'], gen: gHexBinAdv },
        { id: 'twos', name: 'Binary negative numbers (Two\'s Complement)', lv: ['AS', 'A2', 'H446'], gen: gTwos },
        { id: 'binfrac', name: 'Binary fractions', lv: ['AS', 'A2', 'H446'], gen: gBinFrac },
        { id: 'real', name: 'Real numbers (two\'s complement mantissa and exponent)', lv: ['A2', 'H446'], gen: gReal },
        { id: 'fpadd', name: 'Floating point numbers addition and subtraction', lv: ['A2', 'H446'], gen: gFpAdd }
    ];

    /* Same seed + same count + same ticked types = same questions. */
    function generateSet(seed, n, ids) {
        var r = mulberry32(hashSeed(seed));
        var sel = TYPES.filter(function (t) { return ids.indexOf(t.id) >= 0; });
        var out = [], bag = [];
        if (!sel.length) return out;
        while (out.length < n) {
            if (!bag.length) {
                bag = sel.slice();
                for (var i = bag.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = bag[i]; bag[i] = bag[j]; bag[j] = t; }
            }
            var ty = bag.pop();
            out.push(Object.assign(ty.gen(r), { type: ty.id }));
        }
        return out;
    }

    Hex.TYPES = TYPES;
    Hex.generateSet = generateSet;
})();
