/* Answer checkers and the question-object factory. */
(function () {
    'use strict';
    var Hex = globalThis.Hex = globalThis.Hex || {};
    if (typeof require === 'function') { require('./numbers.js'); }
    var P = Hex.P;

    var clean = function (s) { return String(s).trim().replace(/[\s_]/g, ''); };
    var chk = {
        str: function (exp) { return function (s) { return clean(s).replace(/^0b/i, '') === exp; }; },
        binVal: function (v) { return function (s) { s = clean(s).replace(/^0b/i, ''); return /^[01]+$/.test(s) && parseInt(s, 2) === v; }; },
        dec: function (v) { return function (s) { s = clean(s); return /^[+-]?\d+$/.test(s) && Number(s) === v; }; },
        hex: function (v) { return function (s) { s = clean(s).replace(/^0x/i, ''); return /^[0-9a-f]+$/i.test(s) && parseInt(s, 16) === v; }; },
        real: function (v) {
            return function (s) {
                s = clean(s);
                return /^[+-]?(\d+\.?\d*|\.\d+)$/.test(s) && Number(s) === v; /* values are exact binary fractions, so exact match is safe */
            };
        },
        binFrac: function (v) {
            return function (s) {
                s = clean(s);
                if (!/^[01]*\.?[01]*$/.test(s) || !/[01]/.test(s)) return false;
                var p = s.split('.'), x = parseInt(p[0] || '0', 2), f = p[1] || '';
                for (var i = 0; i < f.length; i++) x += (+f[i]) / P(i + 1);
                return Math.abs(x - v) < 1e-12;
            };
        }
    };
    var Q = function (html, answer, check, extra) {
        return Object.assign({ html: html, answer: String(answer), check: check, prefix: '' }, extra || {});
    };

    Hex.clean = clean;
    Hex.chk = chk;
    Hex.Q = Q;
})();
