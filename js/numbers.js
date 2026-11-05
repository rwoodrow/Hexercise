/* Number/string helpers: binary, hex, two's complement, floating point values. */
(function () {
    'use strict';
    var Hex = globalThis.Hex = globalThis.Hex || {};

    var P = function (n) { return Math.pow(2, n); };
    var toBin = function (n, w) { var s = n.toString(2); while (s.length < (w || 0)) s = '0' + s; return s; };
    var toHex = function (n) { return n.toString(16).toUpperCase(); };
    var tcStr = function (n, w) { return toBin(n >= 0 ? n : n + P(w), w); };
    var fpVal = function (m, e, M) { return m * P(e - (M - 1)); };
    var bold = function (x) { return '<b>' + x + '</b>'; };

    var tcVal = function (s) { return parseInt(s, 2) - (s.charAt(0) === '1' ? P(s.length) : 0); };
    var inv = function (s) { return s.replace(/[01]/g, function (c) { return c === '1' ? '0' : '1'; }); };

    Hex.P = P;
    Hex.toBin = toBin;
    Hex.toHex = toHex;
    Hex.tcStr = tcStr;
    Hex.fpVal = fpVal;
    Hex.bold = bold;
    Hex.tcVal = tcVal;
    Hex.inv = inv;
})();
