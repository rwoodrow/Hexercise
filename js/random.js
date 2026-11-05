/* Seeded random number generator (FNV-1a hash + mulberry32) and helpers. */
(function () {
    'use strict';
    var Hex = globalThis.Hex = globalThis.Hex || {};

    function hashSeed(s) {
        s = String(s).trim();
        var h = 2166136261 >>> 0;
        for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
        return h >>> 0;
    }
    function mulberry32(a) {
        return function () {
            a = (a + 0x6D2B79F5) | 0;
            var t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
    var ri = function (r, a, b) { return a + Math.floor(r() * (b - a + 1)); };
    var pick = function (r, arr) { return arr[Math.floor(r() * arr.length)]; };

    Hex.hashSeed = hashSeed;
    Hex.mulberry32 = mulberry32;
    Hex.ri = ri;
    Hex.pick = pick;
})();
